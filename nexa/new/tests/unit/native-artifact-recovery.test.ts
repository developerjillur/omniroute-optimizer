import test from "node:test";
import assert from "node:assert/strict";
import { createStreamController, pipeWithDisconnect } from "../../open-sse/utils/streamHandler.ts";
import {
  observeNativeClaudeThreadResponse,
  isNativeClaudeThreadReplayError,
} from "../../open-sse/services/nativeClaudeThread.ts";
import {
  allowsAnthropicThinkingProgress,
  createAnthropicThinkingProgressWatcher,
} from "../../open-sse/utils/anthropicStreamProgress.ts";

const encoder = new TextEncoder();
const frame = (value: unknown) => encoder.encode(`data: ${JSON.stringify(value)}\n\n`);

test("native thinking progress requires a matching open block; lifecycle frames cannot extend it", () => {
  const watcher = createAnthropicThinkingProgressWatcher();
  const note = (event: unknown) => watcher.note(new TextDecoder().decode(frame(event)));
  assert.equal(note({ type: "ping" }), false);
  assert.equal(
    note({
      type: "content_block_delta",
      index: 0,
      delta: { type: "thinking_delta", thinking: "" },
    }),
    false
  );
  assert.equal(
    note({
      type: "content_block_start",
      index: 0,
      content_block: { type: "thinking", thinking: "" },
    }),
    false
  );
  assert.equal(
    note({
      type: "content_block_delta",
      index: 1,
      delta: { type: "thinking_delta", thinking: "" },
    }),
    false
  );
  assert.equal(
    note({
      type: "content_block_delta",
      index: 0,
      delta: { type: "thinking_delta", thinking: "" },
    }),
    true
  );
  assert.equal(note({ type: "content_block_stop", index: 0 }), false);
  assert.equal(
    note({
      type: "content_block_delta",
      index: 0,
      delta: { type: "signature_delta", signature: "fixture" },
    }),
    false
  );
  assert.equal(allowsAnthropicThinkingProgress("claude", { thinking: { type: "adaptive" } }), true);
  assert.equal(
    allowsAnthropicThinkingProgress("claude", { thinking: { type: "between_tools" } }),
    true
  );
  assert.equal(
    allowsAnthropicThinkingProgress("claude", { thinking: { type: "disabled" } }),
    false
  );
  assert.equal(allowsAnthropicThinkingProgress("codex", { thinking: { type: "adaptive" } }), false);
});

test("native thinking progress stays bounded by the absolute active deadline", async (t) => {
  let timer: ReturnType<typeof setInterval>;
  const source = new ReadableStream<Uint8Array>({
    start(c) {
      c.enqueue(
        frame({
          type: "content_block_start",
          index: 0,
          content_block: { type: "thinking", thinking: "" },
        })
      );
      timer = setInterval(
        () =>
          c.enqueue(
            frame({
              type: "content_block_delta",
              index: 0,
              delta: { type: "thinking_delta", thinking: "" },
            })
          ),
        20
      );
    },
    cancel() {
      clearInterval(timer);
    },
  });
  t.after(() => clearInterval(timer));
  const errors: { message: string }[] = [];
  const controller = createStreamController({
    onError(e) {
      errors.push(e);
      return true;
    },
  });
  const text = await new Response(
    pipeWithDisconnect(new Response(source), new TransformStream(), controller, {
      contentStallTimeoutMs: 80,
      stallTimeoutMs: 500,
      activeTimeoutMs: 180,
      allowAnthropicThinkingProgress: true,
    })
  ).text();
  assert.match(errors[0]?.message, /stream active timeout/);
  assert.match(text, /stream active timeout/);
  assert.equal(errors.length, 1);
});

test("native hidden thinking can progress beyond the first-content window before an Artifact call", async (t) => {
  let timer: ReturnType<typeof setInterval>;
  const upstream = new ReadableStream<Uint8Array>({
    start(c) {
      c.enqueue(
        frame({
          type: "content_block_start",
          index: 0,
          content_block: { type: "thinking", thinking: "" },
        })
      );
      let ticks = 0;
      timer = setInterval(() => {
        c.enqueue(
          frame({
            type: "content_block_delta",
            index: 0,
            delta: { type: "thinking_delta", thinking: "" },
          })
        );
        if (++ticks < 8) return;
        clearInterval(timer);
        c.enqueue(
          frame({
            type: "content_block_delta",
            index: 0,
            delta: { type: "signature_delta", signature: "synthetic-signature" },
          })
        );
        c.enqueue(frame({ type: "content_block_stop", index: 0 }));
        c.enqueue(
          frame({
            type: "content_block_start",
            index: 1,
            content_block: { type: "tool_use", id: "toolu_fixture", name: "Artifact", input: {} },
          })
        );
        c.enqueue(frame({ type: "message_delta", delta: { stop_reason: "tool_use" } }));
        c.enqueue(frame({ type: "message_stop" }));
        c.close();
      }, 25);
    },
    cancel() {
      clearInterval(timer);
    },
  });
  t.after(() => clearInterval(timer));
  const errors: unknown[] = [];
  const controller = createStreamController({
    clientResponseFormat: "claude",
    onError(e) {
      errors.push(e);
      return true;
    },
  });
  const output = pipeWithDisconnect(new Response(upstream), new TransformStream(), controller, {
    contentStallTimeoutMs: 90,
    stallTimeoutMs: 500,
    activeTimeoutMs: 1000,
    allowAnthropicThinkingProgress: true,
  });
  const text = await new Response(output).text();
  assert.deepEqual(
    errors,
    [],
    "reasoning progress must not be reported as an empty stalled stream"
  );
  assert.match(text, /"name":"Artifact"/);
  assert.match(text, /"type":"message_stop"/);
});

test("a partial native response must not register a resumable Thread owner", async (t) => {
  let upstream: ReadableStreamDefaultController<Uint8Array>;
  const source = new ReadableStream<Uint8Array>({
    start(c) {
      upstream = c;
      c.enqueue(frame({ type: "message_start", message: { id: "msg_incomplete" } }));
    },
  });
  const owners: string[] = [];
  const reader = observeNativeClaudeThreadResponse(
    new Response(source, { headers: { "content-type": "text/event-stream" } }),
    (id) => owners.push(id)
  ).body!.getReader();
  t.after(() => reader.cancel().catch(() => {}));
  await reader.read();
  assert.deepEqual(owners, [], "message_start alone is not a completed, resumable response");
  upstream!.enqueue(frame({ type: "message_stop" }));
  upstream!.close();
  while (!(await reader.read()).done) {
    /* Drain the complete envelope. */
  }
  assert.deepEqual(owners, ["msg_incomplete"]);
});

test("native stream cancellation never commits an interrupted message owner", async () => {
  const source = new ReadableStream<Uint8Array>({
    start(c) {
      c.enqueue(frame({ type: "message_start", message: { id: "msg_cancelled" } }));
    },
  });
  const owners: string[] = [];
  const reader = observeNativeClaudeThreadResponse(
    new Response(source, { headers: { "content-type": "text/event-stream" } }),
    (id) => owners.push(id)
  ).body!.getReader();
  await reader.read();
  await reader.cancel();
  assert.deepEqual(owners, []);
});

test("only recoverable Thread errors request a full replay", () => {
  assert.equal(
    isNativeClaudeThreadReplayError(
      404,
      "No thread state was found for the requested previous_message_id"
    ),
    true
  );
  assert.equal(
    isNativeClaudeThreadReplayError(400, "thread: the request does not match the stored Thread"),
    true
  );
  assert.equal(isNativeClaudeThreadReplayError(400, "Invalid signature in thinking block"), false);
  assert.equal(isNativeClaudeThreadReplayError(404, "Model not found"), false);
  assert.equal(isNativeClaudeThreadReplayError(429, "No thread state was found"), false);
});
