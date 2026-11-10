import assert from "node:assert/strict";
import test from "node:test";
import { handleChatCore } from "../../open-sse/handlers/chatCore.ts";
import { closeCallLogSaves } from "../../src/lib/usage/callLogs.ts";
import { resetDbInstance } from "../../src/lib/db/core.ts";

test.after(async () => {
  await closeCallLogSaves();
  resetDbInstance();
});

test("production Fable 5.2 native dispatch preserves signed history, tools, effort and provider wire", async () => {
  const model = "claude-fable-5-2";
  const session = "52345678-1234-4123-8123-123456789abc";
  const captured: Record<string, unknown>[] = [];
  const upstreamMessage = {
    id: "msg_fable52_fixture",
    type: "message",
    role: "assistant",
    model,
    content: [],
    input_transformations: [{ type: "thinking_block_dropped", message_index: 1 }],
    usage: { input_tokens: 10, output_tokens: 0, speed: "fast", cache_read_input_tokens: 1000 },
  };
  const wire =
    `event: message_start\ndata: ${JSON.stringify({ type: "message_start", message: upstreamMessage })}\n\n` +
    'event: content_block_start\ndata: {"type":"content_block_start","index":0,"content_block":{"type":"thinking","thinking":""}}\n\n' +
    'event: content_block_delta\ndata: {"type":"content_block_delta","index":0,"delta":{"type":"signature_delta","signature":"fixture-server-signature"}}\n\n' +
    'event: content_block_stop\ndata: {"type":"content_block_stop","index":0}\n\n' +
    'event: content_block_start\ndata: {"type":"content_block_start","index":1,"content_block":{"type":"text","text":"OK"}}\n\n' +
    'event: content_block_stop\ndata: {"type":"content_block_stop","index":1}\n\n' +
    'event: message_delta\ndata: {"type":"message_delta","delta":{"stop_reason":"end_turn"},"usage":{"output_tokens":1}}\n\n' +
    'event: message_stop\ndata: {"type":"message_stop"}\n\n';
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, init) => {
    captured.push(JSON.parse(String(init?.body)));
    return new Response(wire, { headers: { "content-type": "text/event-stream" } });
  };
  try {
    for (const effort of ["low", "medium", "high", "xhigh", "max"]) {
      const body = {
        model,
        max_tokens: 64,
        stream: true,
        system: [
          {
            type: "text",
            text: "stable fixture system",
            cache_control: { type: "ephemeral", ttl: "1h" },
          },
        ],
        tools: [{ type: "computer_toolset_20260801" }, { type: "advisor_20260301", model }],
        messages: [
          { role: "user", content: "start" },
          {
            role: "assistant",
            content: [
              { type: "thinking", thinking: "", signature: "fixture-original-signed-empty" },
              { type: "text", text: "prior answer" },
            ],
          },
          { role: "user", content: "continue" },
        ],
        metadata: { user_id: JSON.stringify({ session_id: session }) },
        thinking: { type: "adaptive" },
        output_config: { effort },
        speed: "fast",
      };
      const before = structuredClone(body);
      const result = await handleChatCore({
        body,
        modelInfo: { provider: "claude", model, extendedContext: false },
        credentials: {
          accessToken: "sk-ant-oat-fixture",
          connectionId: "fable52-fixture-account",
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
          providerSpecificData: { accountUUID: session, cliUserID: "a".repeat(64) },
        },
        userAgent: "claude-cli/2.1.291 (external, cli)",
        log: { debug() {}, info() {}, warn() {}, error() {} },
        clientRawRequest: {
          endpoint: "/v1/messages",
          body: structuredClone(body),
          headers: {
            "user-agent": "claude-cli/2.1.291 (external, cli)",
            "x-app": "cli",
            "anthropic-beta": "oauth-2025-04-20,context-1m-2025-08-07",
          },
        },
      });
      assert.equal(result.success, true);
      assert.ok(result.response);
      const received = await result.response.text();
      assert.ok(
        received.includes(JSON.stringify({ type: "message_start", message: upstreamMessage }))
      );
      assert.ok(received.includes('"signature":"fixture-server-signature"'));
      const sent = captured.at(-1)!;
      assert.equal(sent.model, model);
      assert.deepEqual(sent.messages, before.messages);
      assert.deepEqual(sent.system, before.system);
      assert.deepEqual(sent.tools, before.tools);
      assert.deepEqual(sent.output_config, before.output_config);
      assert.equal(sent.speed, "fast");
      assert.deepEqual(body.messages, before.messages);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert.equal(captured.length, 5, "one dispatch per effort with no replay or external generation");
});
