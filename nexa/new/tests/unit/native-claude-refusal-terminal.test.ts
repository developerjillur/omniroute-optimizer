import assert from "node:assert/strict";
import test from "node:test";

import { FORMATS } from "../../open-sse/translator/formats.ts";
import { claudeToOpenAIResponse } from "../../open-sse/translator/response/claude-to-openai.ts";
import { translateNonStreamingResponse } from "../../open-sse/handlers/responseTranslator.ts";
import { isEmptyContentResponse } from "../../open-sse/services/errorClassifier.ts";
import { createSSEStream } from "../../open-sse/utils/stream.ts";
import {
  createDisconnectAwareStream,
  createStreamController,
} from "../../open-sse/utils/streamHandler.ts";
import { observeNativeClaudeThreadResponse } from "../../open-sse/services/nativeClaudeThread.ts";
import { resetDbInstance } from "../../src/lib/db/core.ts";

const encoder = new TextEncoder();
const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const frame = (data: Record<string, unknown>) =>
  `event: ${data.type}\ndata: ${JSON.stringify(data)}\n\n`;

function events(stopReason = "refusal", thinking = true) {
  return [
    {
      type: "message_start",
      message: {
        id: "msg_native_refusal_fixture",
        type: "message",
        role: "assistant",
        model: "claude-opus-5-5",
        content: [],
        stop_reason: null,
        usage: { input_tokens: 2, cache_read_input_tokens: 80, output_tokens: 0 },
      },
    },
    ...(thinking
      ? [
          {
            type: "content_block_start",
            index: 0,
            content_block: { type: "thinking", thinking: "", signature: "" },
          },
          {
            type: "content_block_delta",
            index: 0,
            delta: { type: "thinking_delta", thinking: "" },
          },
          {
            type: "content_block_delta",
            index: 0,
            delta: { type: "signature_delta", signature: "fixture-refusal-signature" },
          },
          { type: "content_block_stop", index: 0 },
        ]
      : []),
    {
      type: "message_delta",
      delta: { stop_reason: stopReason, stop_sequence: null },
      usage: { output_tokens: 7080, output_tokens_details: { thinking_tokens: 7080 } },
    },
    { type: "message_stop" },
  ];
}

function source(text: string, splitAt = 17) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      // Split event names, JSON and frame boundaries across transport chunks.
      for (let i = 0; i < text.length; i += splitAt)
        controller.enqueue(encoder.encode(text.slice(i, i + splitAt)));
      controller.close();
    },
  });
}

async function wrap(text: string, format: string = FORMATS.CLAUDE) {
  let failures = 0;
  const controller = createStreamController({
    clientResponseFormat: format,
    onError: () => {
      failures += 1;
    },
  });
  const readable = createDisconnectAwareStream(
    { readable: source(text), writable: new WritableStream() },
    controller
  );
  return { text: await new Response(readable).text(), failures };
}

let networkAttempts = 0;
const originalFetch = globalThis.fetch;
test.before(() => {
  globalThis.fetch = async () => {
    networkAttempts += 1;
    throw new Error("No generation or network request is permitted in refusal fixtures");
  };
});
test.after(() => {
  globalThis.fetch = originalFetch;
  resetDbInstance();
  assert.equal(networkAttempts, 0, "a refusal must never trigger another generation");
});

for (const effort of ["low", "medium", "high", "xhigh", "max"]) {
  test(`native hidden-thinking refusal stays byte-identical at ${effort} effort`, async () => {
    const text = events().map(frame).join("");
    let completed: unknown;
    let transformFailures = 0;
    const body = {
      model: "claude-opus-5-5",
      output_config: { effort },
      thinking: { type: "adaptive", display: "updates" },
      thread: { type: "continue", previous_message_id: "msg_fixture_previous" },
      messages: [{ role: "user", content: "fixture request" }],
    };
    const transformed = source(text).pipeThrough(
      createSSEStream({
        mode: "passthrough",
        sourceFormat: FORMATS.CLAUDE,
        clientResponseFormat: FORMATS.CLAUDE,
        provider: "claude",
        model: body.model,
        body,
        onComplete: (result) => {
          completed = result;
        },
        onFailure: () => {
          transformFailures += 1;
        },
      })
    );
    let wrapperFailures = 0;
    const wrapped = createDisconnectAwareStream(
      { readable: transformed, writable: new WritableStream() },
      createStreamController({
        clientResponseFormat: FORMATS.CLAUDE,
        onError: () => {
          wrapperFailures += 1;
        },
      })
    );
    const result = await new Response(wrapped).text();
    assert.equal(wrapperFailures, 0);
    assert.equal(transformFailures, 0);
    assert.equal(result, text, "keep the actual refusal and signature; invent no answer");
    assert.equal(body.output_config.effort, effort);
    const completion = record(completed);
    const retained = record(completion.responseBody);
    assert.equal(completion.status, 200);
    assert.equal(retained.stop_reason, "refusal");
    assert.equal(retained.type, "message");
    assert.ok(Array.isArray(retained.content));
    assert.equal(record(retained.content[0]).type, "thinking");
    assert.equal(record(completion.usage).completion_tokens, 7080);
    assert.equal(record(retained.usage).output_tokens, 7080);
    assert.equal(record(retained.usage).cache_read_input_tokens, 80);
  });
}

test("native refusal with no content block is a valid terminal, including the flush tail", async () => {
  const text = events("refusal", false).map(frame).join("");
  let completed: unknown;
  const transformed = source(text).pipeThrough(
    createSSEStream({
      mode: "passthrough",
      sourceFormat: FORMATS.CLAUDE,
      clientResponseFormat: FORMATS.CLAUDE,
      provider: "claude",
      model: "claude-opus-5-5",
      body: { messages: [{ role: "user", content: "fixture request" }] },
      onComplete: (result) => {
        completed = result;
      },
    })
  );
  const result = await new Response(
    createDisconnectAwareStream(
      { readable: transformed, writable: new WritableStream() },
      createStreamController({ clientResponseFormat: FORMATS.CLAUDE })
    )
  ).text();
  assert.equal(result, text);
  assert.equal(record(record(completed).responseBody).stop_reason, "refusal");
  assert.deepEqual(record(record(completed).responseBody).content, []);
});

test("refusal does not exempt an upstream close before message_stop", async () => {
  const parts = events();
  parts.pop();
  const result = await wrap(parts.map(frame).join(""));
  assert.equal(result.failures, 1);
  assert.match(result.text, /event: error/);
  assert.doesNotMatch(result.text, /"stop_reason":"max_tokens"/);
});

test("an actual native max_tokens terminal preserves an opaque-thinking truncation", async () => {
  const result = await wrap(events("max_tokens").map(frame).join(""));
  assert.equal(result.failures, 0);
  assert.match(result.text, /"stop_reason":"max_tokens"/);
  assert.doesNotMatch(result.text, /Provider returned empty content/);
});

test("nested message_stop metadata cannot complete a native refusal", async () => {
  const parts: Record<string, unknown>[] = events();
  parts.pop();
  parts[0].metadata = { type: "message_stop" };
  const result = await wrap(parts.map(frame).join(""));
  assert.equal(result.failures, 1);
  assert.doesNotMatch(result.text, /"stop_reason":"max_tokens"/);
});

test("nested refusal-looking metadata cannot exempt an empty end_turn", async () => {
  const parts: Record<string, unknown>[] = events("end_turn");
  parts[0].metadata = { type: "message_delta", delta: { stop_reason: "refusal" } };
  const result = await wrap(parts.map(frame).join(""));
  assert.equal(result.failures, 1);
  assert.match(result.text, /Provider returned empty content/);
});

for (const visible of [false, true]) {
  test(`${visible ? "visible" : "empty"} native text blocks retain the empty-response boundary`, async () => {
    const parts: Record<string, unknown>[] = events("end_turn", false);
    parts.splice(
      1,
      0,
      { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } },
      ...(visible
        ? [
            {
              type: "content_block_delta",
              index: 0,
              delta: { type: "text_delta", text: "fixture-visible" },
            },
          ]
        : []),
      { type: "content_block_stop", index: 0 }
    );
    const result = await wrap(parts.map(frame).join(""));
    assert.equal(result.failures, visible ? 0 : 1);
    if (visible) assert.match(result.text, /fixture-visible/);
    else assert.match(result.text, /Provider returned empty content/);
  });
}

test("an unrelated OpenAI stream cannot use an Anthropic refusal exemption", async () => {
  const result = await wrap(events().map(frame).join(""), FORMATS.OPENAI);
  assert.equal(result.failures, 1);
});

test("a structured upstream error keeps its original diagnostic after a refusal", async () => {
  const parts: Record<string, unknown>[] = events();
  parts.splice(-1, 0, {
    type: "error",
    error: { type: "overloaded_error", message: "fixture upstream overloaded" },
  });
  const result = await wrap(parts.map(frame).join(""));
  assert.match(result.text, /fixture upstream overloaded/);
  assert.doesNotMatch(result.text, /Provider returned empty content/);
});

test("buffered native refusal stays a refusal while an empty end_turn stays an error", () => {
  assert.equal(
    isEmptyContentResponse({ type: "message", content: [], stop_reason: "refusal" }),
    false
  );
  assert.equal(
    isEmptyContentResponse({ type: "message", content: [], stop_reason: "end_turn" }),
    true
  );
  assert.equal(isEmptyContentResponse({ type: "message", content: [], stop_reason: null }), true);
  assert.equal(
    isEmptyContentResponse({ type: "response", content: [], stop_reason: "refusal" }),
    true
  );
});

test("Claude-to-OpenAI streaming refusal maps to content_filter without text", () => {
  const state = { toolCalls: new Map(), toolNameMap: new Map() };
  const chunks = claudeToOpenAIResponse(
    {
      type: "message_delta",
      delta: { stop_reason: "refusal" },
      usage: { output_tokens: 7080 },
    },
    state
  );
  assert.equal(chunks?.at(-1)?.choices?.[0]?.finish_reason, "content_filter");
});

test("Claude-to-OpenAI buffered refusal maps to content_filter", () => {
  const result = translateNonStreamingResponse(
    {
      id: "msg_refusal_nonstream",
      type: "message",
      role: "assistant",
      model: "claude-opus-5-5",
      content: [],
      stop_reason: "refusal",
      usage: { input_tokens: 2, output_tokens: 3 },
    },
    FORMATS.CLAUDE,
    FORMATS.OPENAI
  );
  const choices = record(result).choices;
  assert.ok(Array.isArray(choices));
  assert.equal(record(choices[0]).finish_reason, "content_filter");
  assert.equal(record(record(choices[0]).message).content, "");
});

test("a completed refusal keeps native Thread ownership without another request", async () => {
  let saves = 0;
  const text = events().map(frame).join("");
  const observed = observeNativeClaudeThreadResponse(
    new Response(source(text), {
      headers: { "content-type": "text/event-stream" },
    }),
    (id) => {
      saves += 1;
      assert.equal(id, "msg_native_refusal_fixture");
    }
  );
  const result = await wrap(await observed.text());
  assert.equal(result.text, text);
  assert.equal(saves, 1);
});
