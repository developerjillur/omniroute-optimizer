// @ts-nocheck
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "native-thread-chatcore-"));
const core = await import("../../src/lib/db/core.ts");
const logs = await import("../../src/lib/usage/callLogs.ts");
const owners = await import("../../src/lib/db/nativeClaudeThreads.ts");
const { handleChatCore } = await import("../../open-sse/handlers/chatCore.ts");
test.after(async () => {
  await logs.closeCallLogSaves();
  core.resetDbInstance();
});

test("full native chat pipeline preserves sparse directives and persists provider TTL", async () => {
  const session = "12345678-1234-4123-8123-123456789abc";
  const marker = () => ({ type: "ephemeral", ttl: "1h" });
  const billing = {
    type: "text",
    text: "x-anthropic-billing-header: cc_version=2.1.291.fixture; cc_entrypoint=cli; cch=abcde;",
  };
  const create = {
    model: "claude-sonnet-5-5",
    max_tokens: 64,
    stream: true,
    system: [billing, { type: "text", text: "stable instructions", cache_control: marker() }],
    tools: [{ name: "Read", input_schema: { type: "object" }, cache_control: marker() }],
    thread: { type: "create" },
    metadata: { user_id: JSON.stringify({ session_id: session }) },
    output_config: { effort: "high" },
    messages: [
      { role: "user", content: [{ type: "text", text: "start", cache_control: marker() }] },
      {
        role: "system",
        content: [{ type: "text", text: "turn directive", cache_control: marker() }],
      },
    ],
  };
  const continuation = {
    ...create,
    system: [billing],
    tools: undefined,
    thread: { type: "continue", previous_message_id: "msg_fixture_1" },
    messages: [
      { role: "user", content: "continue" },
      {
        role: "system",
        content: [{ type: "text", text: "new directive", cache_control: marker() }],
      },
    ],
  };
  delete continuation.tools;
  const sent = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, init = {}) => {
    sent.push(JSON.parse(String(init.body)));
    const message = {
      id: `msg_fixture_${sent.length}`,
      type: "message",
      role: "assistant",
      model: create.model,
      content: [],
      usage: {
        input_tokens: 10,
        cache_read_input_tokens: 2000,
        cache_creation_input_tokens: 1000,
        cache_creation: { ephemeral_5m_input_tokens: 0, ephemeral_1h_input_tokens: 1000 },
        output_tokens: 0,
      },
    };
    return new Response(
      `event: message_start\ndata: ${JSON.stringify({ type: "message_start", message })}\n\n` +
        'event: content_block_start\ndata: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":"OK"}}\n\n' +
        'event: message_delta\ndata: {"type":"message_delta","delta":{"stop_reason":"end_turn"},"usage":{"output_tokens":1}}\n\n' +
        'event: message_stop\ndata: {"type":"message_stop"}\n\n',
      { headers: { "content-type": "text/event-stream" } }
    );
  };
  const maskCch = (v) => JSON.stringify(v).replace(/cch=[0-9a-f]{5};/g, "cch=00000;");
  try {
    for (const original of [create, continuation]) {
      const body = structuredClone(original);
      const result = await handleChatCore({
        body,
        modelInfo: { provider: "claude", model: create.model, extendedContext: false },
        credentials: {
          accessToken: "sk-ant-oat-fixture",
          connectionId: "fixture-account",
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
          providerSpecificData: { accountUUID: session, cliUserID: "a".repeat(64) },
        },
        userAgent: "claude-cli/2.1.291 (external, cli)",
        log: { debug() {}, info() {}, warn() {}, error() {} },
        clientRawRequest: {
          endpoint: "/v1/messages",
          body: structuredClone(original),
          headers: {
            "user-agent": "claude-cli/2.1.291 (external, cli)",
            "x-app": "cli",
            "anthropic-beta":
              "message-threads-2026-08-12,mid-conversation-system-2026-04-07,oauth-2025-04-20",
          },
        },
      });
      assert.equal(result.success, true);
      await result.response.text();
      const upstream = sent.at(-1);
      assert.equal(maskCch(upstream.system), maskCch(original.system));
      assert.deepEqual(upstream.messages, original.messages);
      assert.deepEqual(upstream.tools, original.tools);
      assert.deepEqual(upstream.thread, original.thread);
      assert.deepEqual(upstream.cache_control, original.cache_control);
      assert.deepEqual(body.system, original.system, "the logged input remains unmodified");
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert.equal(sent.length, 2);
  assert.equal(owners.getNativeClaudeThreadOwner(session, "msg_fixture_1"), "fixture-account");
  let rows = [];
  for (let i = 0; i < 100 && rows.length < 2; i++) {
    rows = core
      .getDbInstance()
      .prepare(
        "SELECT tokens_cache_creation_5m,tokens_cache_creation_1h,native_cache_group_tag FROM call_logs WHERE model=?"
      )
      .all(create.model);
    if (rows.length < 2) await new Promise((resolve) => setTimeout(resolve, 10));
  }
  assert.equal(rows.length, 2);
  for (const row of rows) {
    assert.equal(row.tokens_cache_creation_5m, 0);
    assert.equal(row.tokens_cache_creation_1h, 1000);
  }
  assert.equal(rows[0].native_cache_group_tag, rows[1].native_cache_group_tag);
});
