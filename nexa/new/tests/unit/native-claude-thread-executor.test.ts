import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "native-thread-executor-"));
const { BaseExecutor } = await import("../../open-sse/executors/base.ts");
const core = await import("../../src/lib/db/core.ts");
const owners = await import("../../src/lib/db/nativeClaudeThreads.ts");
const { signRequestBody } = await import("../../open-sse/services/claudeCodeCCH.ts");
test.after(() => core.resetDbInstance());
const session = "12345678-1234-4123-8123-123456789abc";
const beta =
  "message-threads-2026-08-12,mid-conversation-output-config-2026-07-01,oauth-2025-04-20";

class Executor extends BaseExecutor {
  constructor() {
    super("claude", { format: "claude", baseUrls: ["https://api.anthropic.com/v1/messages"] });
  }
  needsRefresh() {
    return false;
  }
  transformRequest(_model: string, body: unknown) {
    const payload = body as Record<string, unknown>;
    // Simulate a provider transform mutating shared native descriptors.
    (payload.tools as Array<{ name: string }>)[0].name = "ProxyRead";
    return {
      ...payload,
      system: [{ type: "text", text: "rewritten" }],
      messages: [],
      cache_control: { type: "ephemeral", ttl: "1h" },
      output_config: { effort: "low" },
    };
  }
}

test("actual executor preserves create/continuation fields, beta and owning account", async () => {
  const originalFetch = globalThis.fetch;
  const sent: Array<{ body: Record<string, unknown>; headers: Headers }> = [];
  globalThis.fetch = async (_url, init: RequestInit = {}) => {
    sent.push({ body: JSON.parse(String(init.body)), headers: new Headers(init.headers) });
    return new Response(
      `event: message_start\ndata: {"type":"message_start","message":{"id":"msg_turn_${sent.length}"}}\n\n`,
      { headers: { "content-type": "text/event-stream" } }
    );
  };
  const system = [
    {
      type: "text",
      text: "x-anthropic-billing-header: cc_version=2.1.291.fixture; cc_entrypoint=cli; cch=abcde;",
    },
    {
      type: "text",
      text: "You are Claude Code, Anthropic's official CLI for Claude.",
      cache_control: { type: "ephemeral" },
    },
    { type: "text", text: "stable instructions", cache_control: { type: "ephemeral" } },
  ];
  const create = {
    model: "claude-sonnet-5-5",
    stream: true,
    system,
    cache_control: { type: "ephemeral" },
    thread: { type: "create" },
    metadata: { user_id: JSON.stringify({ session_id: session }) },
    thinking: { type: "adaptive" },
    output_config: { effort: "max" },
    tools: [
      { name: "Read", input_schema: { type: "object" }, cache_control: { type: "ephemeral" } },
    ],
    messages: [{ role: "user", content: [{ type: "text", text: "start" }] }],
  };
  const continuation = {
    ...structuredClone(create),
    thread: { type: "continue", previous_message_id: "msg_turn_1" },
    messages: [
      {
        role: "user",
        content: [{ type: "tool_result", tool_use_id: "toolu_server_owned", content: "done" }],
      },
      {
        role: "system",
        content: [{ type: "text", text: "next directive", cache_control: { type: "ephemeral" } }],
        output_config: { effort: "high" },
      },
    ],
  };
  const expected = [structuredClone(create), structuredClone(continuation)];
  try {
    for (const body of [create, continuation]) {
      const result = await new Executor().execute({
        model: body.model,
        body,
        stream: true,
        credentials: {
          accessToken: "sk-ant-oat-fixture",
          connectionId: "account-a",
          providerSpecificData: { accountUUID: session, cliUserID: "a".repeat(64) },
        },
        clientHeaders: { "x-app": "cli", "anthropic-beta": beta },
      });
      assert.ok(!(result instanceof Response));
      await result.response.text();
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
  const maskCch = (v: unknown) => JSON.stringify(v).replace(/cch=[0-9a-f]{5};/g, "cch=00000;");
  for (let i = 0; i < sent.length; i++) {
    assert.equal(sent[i].headers.get("anthropic-beta"), beta);
    assert.equal(maskCch(sent[i].body.system), maskCch(expected[i].system));
    for (const key of ["messages", "tools", "cache_control", "thinking", "output_config", "thread"])
      assert.deepEqual(sent[i].body[key], (expected[i] as Record<string, unknown>)[key], key);
  }
  assert.equal(sent.length, 2);
  assert.deepEqual(
    create,
    expected[0],
    "provider transformation must not mutate the client's logged request"
  );
  assert.deepEqual(continuation, expected[1]);
  assert.equal(owners.getNativeClaudeThreadOwner(session, "msg_turn_1"), "account-a");
  assert.equal(owners.getNativeClaudeThreadOwner(session, "msg_turn_2"), "account-a");
  assert.match(
    owners.getNativeClaudeThreadCacheGroup(session, "msg_turn_1") ?? "",
    /^[a-f0-9]{64}$/
  );
  assert.equal(
    owners.getNativeClaudeThreadCacheGroup(session, "msg_turn_2"),
    owners.getNativeClaudeThreadCacheGroup(session, "msg_turn_1")
  );
});

test("native Thread errors are forwarded without field or effort downgrade retries", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return new Response(
      JSON.stringify({
        type: "error",
        error: {
          type: "invalid_request_error",
          message: "context_management: unsupported parameter across a Thread",
        },
      }),
      { status: 400 }
    );
  };
  try {
    const result = await new Executor().execute({
      model: "claude-sonnet-5-5",
      stream: false,
      body: {
        thread: { type: "continue", previous_message_id: "msg_turn_1" },
        context_management: { edits: [] },
        output_config: { effort: "max" },
        tools: [{ name: "Read", input_schema: { type: "object" } }],
        messages: [{ role: "user", content: "delta" }],
      },
      credentials: {
        accessToken: "sk-ant-oat-fixture",
        connectionId: "account-a",
        providerSpecificData: { accountUUID: session, cliUserID: "a".repeat(64) },
      },
      clientHeaders: { "x-app": "cli", "anthropic-beta": beta },
      contextEditing: { enabled: true },
    });
    assert.ok(!(result instanceof Response));
    assert.equal(result.response.status, 400);
    assert.match(await result.response.text(), /context_management/);
    assert.equal(
      calls,
      1,
      "a native field error must not become a changed prompt and another request"
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("native CCH re-signing is idempotent and changes only the integrity token", async () => {
  const body = '{"system":[{"text":"cc_version=fixture; cch=abcde;"}],"model":"claude-sonnet-5-5"}';
  const signed = await signRequestBody(body);
  assert.equal(await signRequestBody(signed), signed);
  assert.equal(await signRequestBody(body.replace("abcde", "00000")), signed);
  assert.equal(signed.replace(/cch=[0-9a-f]{5};/, "cch=00000;"), body.replace("abcde", "00000"));
});
