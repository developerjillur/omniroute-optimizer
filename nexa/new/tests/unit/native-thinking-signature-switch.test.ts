import test from "node:test";
import assert from "node:assert/strict";
import { BaseExecutor } from "../../open-sse/executors/base.ts";
import {
  sanitizeAnthropicThinkingReplay,
  stripRejectedThinkingSuffix,
} from "../../open-sse/utils/anthropicThinkingReplay.ts";
import { executeWithAnthropicThinkingSignatureRecovery } from "../../open-sse/handlers/chatCore/passthroughHelpers.ts";
import { DEFAULT_THINKING_CLAUDE_SIGNATURE } from "../../open-sse/config/defaultThinkingSignature.ts";

class NativeExecutor extends BaseExecutor {
  constructor() {
    super("claude", { format: "claude", baseUrls: ["https://api.anthropic.com/v1/messages"] });
  }
  needsRefresh() {
    return false;
  }
}

class ThreadMutatingExecutor extends NativeExecutor {
  transformRequest(_model: string, body: unknown) {
    return { ...(body as Record<string, unknown>), messages: [], output_config: { effort: "low" } };
  }
}

test("valid native thinking and redacted thinking retain the original bytes and references", () => {
  const body = history("REAL_NATIVE_SIGNATURE");
  body.messages[1].content.push({ type: "redacted_thinking", data: "REAL_NATIVE_DATA" });
  const before = JSON.stringify(body);
  assert.equal(sanitizeAnthropicThinkingReplay(body), body);
  assert.equal(JSON.stringify(body), before);
});

for (const signature of [undefined, "", "   ", DEFAULT_THINKING_CLAUDE_SIGNATURE]) {
  test(`foreign replay removes its thinking suffix without altering earlier native blocks: ${signature === undefined ? "missing" : signature.length}`, () => {
    const body = history("EARLIER_NATIVE_SIGNATURE");
    const foreign = structuredClone(body.messages[1]);
    const first = foreign.content[0] as Record<string, unknown>;
    if (signature === undefined) delete first.signature;
    else first.signature = signature;
    body.messages.push(
      foreign,
      structuredClone(body.messages[2]),
      structuredClone(body.messages[1]),
      structuredClone(body.messages[2])
    );
    const before = structuredClone(body);
    const out = sanitizeAnthropicThinkingReplay(body);
    assert.notEqual(out, body);
    assert.deepEqual(body, before, "caller transcript is immutable");
    assert.equal(out.messages[1], body.messages[1]);
    for (const index of [3, 5]) {
      assert.deepEqual(out.messages[index].content, before.messages[index].content.slice(1));
      assert.equal(out.messages[index + 1], body.messages[index + 1]);
    }
    assert.equal(out.system, body.system);
    assert.equal(out.tools, body.tools);
    assert.equal(out.output_config, body.output_config);
    assert.equal(sanitizeAnthropicThinkingReplay(out), out, "repeated dispatch is idempotent");
  });
}

test("a thinking-only foreign turn is removed instead of sending an empty assistant", () => {
  const body = history();
  body.messages[1].content.splice(1);
  body.messages[2].content = [{ type: "text", text: "Continue." }];
  const out = sanitizeAnthropicThinkingReplay(body);
  assert.equal(out.messages.length, 2);
  assert.deepEqual(out.messages[0], body.messages[0]);
  assert.deepEqual(out.messages[1], body.messages[2]);
});

test("empty redacted replay drops the suffix but preserves document and tool payloads", () => {
  const body = history("REAL_NATIVE_SIGNATURE");
  body.messages[1].content.splice(1, 0, { type: "redacted_thinking", data: "" });
  body.messages[2].content.push({ type: "document", source: { type: "text", data: "FILE_OK" } });
  const before = structuredClone(body);
  const out = sanitizeAnthropicThinkingReplay(body);
  assert.equal(out.messages[1].content[0], body.messages[1].content[0]);
  assert.deepEqual(out.messages[1].content[1], before.messages[1].content[2]);
  assert.equal(out.messages[2], body.messages[2]);
  assert.deepEqual(body, before);
});

test("an indexed upstream rejection removes all later thinking, preserving earlier native bytes", () => {
  const body = history("EARLIER_NATIVE_SIGNATURE");
  body.messages.push(...structuredClone(body.messages.slice(1)));
  body.messages.push(...structuredClone(body.messages.slice(1, 3)));
  const before = structuredClone(body);
  const out = stripRejectedThinkingSuffix(
    body,
    "messages.3.content.0: Invalid `signature` in `thinking` block"
  );
  assert.ok(out);
  assert.equal(out.messages[1], body.messages[1]);
  assert.deepEqual(out.messages[3].content, before.messages[3].content.slice(1));
  assert.deepEqual(out.messages[5].content, before.messages[5].content.slice(1));
  assert.deepEqual(body, before);
});

test("a rejected signature within the pending tool cycle is recovered once with the tools intact", async () => {
  const body = history("OPAQUE_FOREIGN_SIGNATURE");
  const before = structuredClone(body);
  const sent: unknown[] = [];
  const out = await executeWithAnthropicThinkingSignatureRecovery({
    provider: "claude",
    body,
    execute: async (request) => {
      sent.push(request);
      return sent.length === 1
        ? { status: 400, message: "messages.1.content.0: Invalid `signature` in `thinking` block" }
        : { status: 200, message: "OK" };
    },
    getError: (result) => (result.status >= 400 ? result : null),
  });
  assert.equal(out.retried, true);
  assert.equal(sent.length, 2);
  assert.deepEqual(body, before);
  const retry = sent[1] as ReturnType<typeof history>;
  assert.deepEqual(retry.messages[1].content, before.messages[1].content.slice(1));
  assert.deepEqual(retry.messages[2], before.messages[2]);
});

test("an invalid named rejection position cannot remove unrelated signed history", () => {
  const body = history("REAL_NATIVE_SIGNATURE");
  for (const message of [
    "messages.999.content.0: invalid signature in thinking block",
    "messages.0.content.0: invalid signature in thinking block",
    "messages.9007199254740993.content.0: invalid signature in thinking block",
    "messages.1.content.9007199254740993: invalid signature in thinking block",
  ]) {
    assert.equal(stripRejectedThinkingSuffix(body, message), body);
  }
  assert.equal(stripRejectedThinkingSuffix(body, "Invalid signature in thinking block"), null);
});

test("signature recovery remains bounded and does not apply to GPT/GLM or unrelated errors", async () => {
  for (const [provider, status, message] of [
    ["codex", 400, "messages.1.content.0: Invalid signature in thinking block"],
    ["glmt", 400, "messages.1.content.0: Invalid signature in thinking block"],
    ["claude", 429, "messages.1.content.0: Invalid signature in thinking block"],
    ["claude", 400, "thinking blocks cannot be modified"],
  ] as const) {
    let calls = 0;
    const out = await executeWithAnthropicThinkingSignatureRecovery({
      provider,
      body: history("SIGNED"),
      execute: async () => {
        calls++;
        return { status, message };
      },
      getError: (result) => result,
    });
    assert.equal(calls, 1);
    assert.equal(out.retried, false);
  }
  let calls = 0;
  const out = await executeWithAnthropicThinkingSignatureRecovery({
    provider: "claude",
    body: history("OPAQUE_FOREIGN"),
    execute: async () => {
      calls++;
      return { status: 400, message: "messages.1.content.0: Invalid signature in thinking block" };
    },
    getError: (result) => result,
  });
  assert.equal(calls, 2);
  assert.equal(out.result.status, 400, "terminal upstream failure is not disguised as success");
});

function history(signature = "") {
  return {
    model: "claude-opus-5-5",
    max_tokens: 1024,
    thinking: { type: "adaptive" },
    output_config: { effort: "high" },
    system: [{ type: "text", text: "Keep the connector result exact." }],
    tools: [{ name: "mcp__higgsfield__get_host_status", input_schema: { type: "object" } }],
    messages: [
      { role: "user", content: [{ type: "text", text: "Check the connector." }] },
      {
        role: "assistant",
        content: [
          { type: "thinking", thinking: "Foreign model summary", signature },
          {
            type: "tool_use",
            id: "toolu_bridge",
            name: "mcp__higgsfield__get_host_status",
            input: {},
          },
        ],
      },
      {
        role: "user",
        content: [{ type: "tool_result", tool_use_id: "toolu_bridge", content: "HOST_OK" }],
      },
    ] as Array<{ role: string; content: Array<Record<string, unknown>> }>,
  };
}

for (const thread of [
  undefined,
  { type: "create" },
  { type: "continue", previous_message_id: "msg_fixture" },
]) {
  test(`native dispatch drops unsigned GPT thinking, retains tool cycle: ${thread?.type ?? "full"}`, async () => {
    const body = { ...history(), ...(thread ? { thread } : {}) };
    const before = structuredClone(body);
    let wire: Record<string, unknown> | undefined;
    const savedFetch = globalThis.fetch;
    globalThis.fetch = async (_url, init) => {
      wire = JSON.parse(String(init?.body));
      return new Response(
        JSON.stringify({ type: "message", content: [{ type: "text", text: "OK" }] }),
        {
          headers: { "content-type": "application/json" },
        }
      );
    };
    try {
      const executor = thread ? new ThreadMutatingExecutor() : new NativeExecutor();
      await executor.execute({
        model: body.model,
        body,
        stream: false,
        credentials: { accessToken: "sk-ant-oat-fixture" },
        clientHeaders: { "x-app": "cli" },
      });
    } finally {
      globalThis.fetch = savedFetch;
    }
    assert.ok(wire);
    const messages = wire.messages as Array<{
      role: string;
      content: Array<Record<string, unknown>>;
    }>;
    assert.equal(
      messages
        .flatMap((m) => m.content)
        .some((b) => b.type === "thinking" || b.type === "redacted_thinking"),
      false
    );
    assert.equal(messages[1].content[0].type, "tool_use");
    assert.equal(messages[1].content[0].id, "toolu_bridge");
    assert.deepEqual(messages[2].content, before.messages[2].content);
    assert.deepEqual(wire.output_config, before.output_config);
    if (thread) assert.deepEqual(wire.thread, thread);
  });
}

test("native count_tokens uses the same sanitized history without changing the caller", async () => {
  const body = history();
  const before = structuredClone(body);
  let wire: Record<string, unknown> | undefined;
  const savedFetch = globalThis.fetch;
  globalThis.fetch = async (_url, init) => {
    wire = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({ input_tokens: 42 }), {
      headers: { "content-type": "application/json" },
    });
  };
  try {
    const result = await new NativeExecutor().countTokens({
      model: body.model,
      body,
      credentials: { accessToken: "sk-ant-oat-fixture" },
      clientHeaders: { "x-app": "cli" },
    });
    assert.deepEqual(result, { input_tokens: 42, provider: "claude", source: "provider" });
  } finally {
    globalThis.fetch = savedFetch;
  }
  assert.ok(wire);
  assert.deepEqual(wire.messages, sanitizeAnthropicThinkingReplay(before).messages);
  assert.deepEqual(body, before);
});
