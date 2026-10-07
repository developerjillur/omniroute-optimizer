import { test } from "node:test";
import assert from "node:assert/strict";
import { BaseExecutor } from "../../open-sse/executors/base.ts";
import {
  shouldUseMidConversationSystem,
  selectBetaFlags,
} from "../../open-sse/executors/claudeIdentity.ts";
import {
  getNativeClaudeSessionId,
  accountScopedClaudeSessionId,
} from "../../open-sse/services/nativeClaudeSession.ts";
import { extractSessionAffinityKey } from "../../src/sse/services/sessionAffinityPin.ts";
import {
  generateSessionId,
  extractExternalSessionId,
} from "../../open-sse/services/sessionManager.ts";
import {
  extractSystemRoleMessages,
  hoistLeadingTextSystemMessages,
  relocateDirectiveOnlyMessages,
} from "../../open-sse/handlers/chatCore/claudeSystemRole.ts";

const sid = "550e8400-e29b-41d4-a716-446655440000";
const otherSid = "660e8400-e29b-41d4-a716-446655440001";
const marker = (): { type: string; ttl?: string } => ({ type: "ephemeral" });
function body(sessionId = sid, prompt = "initial task") {
  return {
    model: "claude-sonnet-5-5",
    system: [{ type: "text", text: "stable native instructions", cache_control: marker() }],
    tools: [{ name: "Read", input_schema: { type: "object", properties: {} } }],
    metadata: {
      user_id: JSON.stringify({
        device_id: "a".repeat(64),
        account_uuid: sid,
        session_id: sessionId,
      }),
    },
    messages: [
      { role: "user", content: [{ type: "text", text: prompt, cache_control: marker() }] },
    ],
    thread: { type: "create" },
    output_config: { effort: "max" },
  };
}

for (const model of [
  "claude-sonnet-5-5",
  "claude-sonnet-5.5",
  "claude-sonnet-5-5-20260915",
  "claude-opus-5-5",
  "claude-fable-5-1",
])
  test(`${model} keeps native mid-conversation system messages`, () => {
    assert.equal(shouldUseMidConversationSystem(body(), model), true);
    assert.ok(selectBetaFlags(body(), model).includes("mid-conversation-system"));
  });
for (const model of ["claude-sonnet-5", "claude-sonnet-4-6", "claude-haiku-4-5"])
  test(`${model} retains legacy system-message sanitation`, () => {
    assert.equal(shouldUseMidConversationSystem(body(), model), false);
  });
test("a native Sonnet directive does not change the existing cache prefix", () => {
  const payload: Record<string, unknown> = body();
  const prefix = JSON.stringify(payload.system);
  (payload.messages as unknown[]).push(
    { role: "assistant", content: "done" },
    {
      role: "system",
      content: [{ type: "text", text: "new file notice" }],
      output_config: { effort: "high" },
    }
  );
  if (shouldUseMidConversationSystem(payload, "claude-sonnet-5-5")) {
    hoistLeadingTextSystemMessages(payload);
    relocateDirectiveOnlyMessages(payload);
  } else extractSystemRoleMessages(payload);
  assert.equal(JSON.stringify(payload.system), prefix);
  assert.equal((payload.messages as Array<{ role: string }>).at(-1)?.role, "system");
});

test("native header and JSON metadata resolve to the same conversation", () => {
  assert.equal(getNativeClaudeSessionId(body()), sid);
  assert.equal(getNativeClaudeSessionId({}, { "X-Claude-Code-Session-Id": sid }), sid);
  assert.equal(
    getNativeClaudeSessionId(body(), new Headers({ "x-claude-code-session-id": otherSid })),
    otherSid
  );
});
test("malformed and oversized native metadata is ignored", () => {
  for (const user_id of [
    "invalid",
    "[]",
    "null",
    JSON.stringify({ session_id: "not-a-uuid" }),
    " ".repeat(4097) + JSON.stringify({ session_id: sid }),
  ])
    assert.equal(getNativeClaudeSessionId({ metadata: { user_id } }), null);
});
test("native affinity survives compaction and distinct subagent prompts", () => {
  const keys = ["initial task", "compacted replacement", "subagent investigation"].map((prompt) =>
    extractSessionAffinityKey(body(sid, prompt))
  );
  assert.deepEqual(keys, Array(3).fill(`claude:${sid}`));
  assert.equal(
    extractSessionAffinityKey({}, new Headers({ "x-claude-code-session-id": sid })),
    keys[0]
  );
});
test("different native conversations stay separate despite identical prompts", () => {
  assert.notEqual(extractSessionAffinityKey(body()), extractSessionAffinityKey(body(otherSid)));
});
test("explicit gateway session headers retain priority", () => {
  assert.equal(
    extractSessionAffinityKey(body(), new Headers({ "x-session-id": "operator-session" })),
    "header:operator-session"
  );
});
test("runtime session tracking uses the same native identifier across compaction", () => {
  assert.equal(generateSessionId(body()), `claude:${sid}`);
  assert.equal(generateSessionId(body(sid, "compacted replacement")), `claude:${sid}`);
  assert.equal(
    extractExternalSessionId(new Headers({ "x-claude-code-session-id": sid })),
    `claude:${sid}`
  );
});
test("upstream native session ids are stable and scoped to the selected account", () => {
  const id = accountScopedClaudeSessionId("account-a", sid);
  assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.equal(accountScopedClaudeSessionId("account-a", sid), id);
  assert.notEqual(accountScopedClaudeSessionId("account-a", otherSid), id);
  assert.notEqual(accountScopedClaudeSessionId("account-b", sid), id);
});

class NativeCacheExecutor extends BaseExecutor {
  constructor() {
    super("claude", { format: "claude", baseUrls: ["https://api.anthropic.com/v1/messages"] });
  }
  needsRefresh() {
    return false;
  }
  async transformRequest(_model: string, payload: Record<string, unknown>) {
    return structuredClone(payload);
  }
}
async function dispatch(
  sessionId = sid,
  token = "sk-ant-oat-fixture-a",
  connectionId = "fixture-account-a"
) {
  const original = globalThis.fetch;
  let sent: Record<string, unknown> | undefined;
  let headers = new Headers();
  globalThis.fetch = async (_url: string | URL | Request, init: RequestInit = {}) => {
    if (init.body) {
      sent = JSON.parse(String(init.body));
      headers = new Headers(init.headers);
    }
    return new Response('{"ok":true}', {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };
  const payload = body(sessionId);
  payload.messages[0].content.push({
    type: "text",
    text: "explicit hour",
    cache_control: { type: "ephemeral", ttl: "1h" },
  });
  try {
    await new NativeCacheExecutor().execute({
      model: payload.model,
      body: payload,
      stream: false,
      credentials: {
        accessToken: token,
        connectionId,
        providerSpecificData: { accountUUID: sid, cliUserID: "b".repeat(64) },
      },
      clientHeaders: {
        "x-app": "cli",
        "anthropic-beta": "message-threads-2026-08-12,fixture-native-cache-negotiation",
      },
    });
  } finally {
    globalThis.fetch = original;
  }
  assert.ok(sent);
  return { sent, headers };
}
test("native implicit cache TTL stays implicit and explicit 1h stays explicit", async () => {
  const { sent, headers } = await dispatch();
  const systems = sent.system as Array<{
    text: string;
    cache_control?: { type: string; ttl?: string };
  }>;
  assert.deepEqual(systems.find((s) => s.text === "stable native instructions")?.cache_control, {
    type: "ephemeral",
  });
  const blocks = (sent.messages as Array<{ content: Array<{ cache_control?: unknown }> }>)[0]
    .content;
  assert.deepEqual(blocks[0].cache_control, { type: "ephemeral" });
  assert.deepEqual(blocks[1].cache_control, { type: "ephemeral", ttl: "1h" });
  assert.ok(headers.get("anthropic-beta")?.includes("fixture-native-cache-negotiation"));
});
test("native session identity no longer merges distinct chats on one account", async () => {
  const first = await dispatch();
  const second = await dispatch(otherSid);
  const session = (sent: Record<string, unknown>) =>
    JSON.parse((sent.metadata as { user_id: string }).user_id).session_id;
  assert.notEqual(session(first.sent), session(second.sent));
  assert.equal(first.headers.get("x-claude-code-session-id"), session(first.sent));
});
test("token rotation retains the native session identity on the same connection", async () => {
  const first = await dispatch();
  const refreshed = await dispatch(sid, "sk-ant-oat-fixture-refreshed");
  assert.equal(
    (first.sent.metadata as { user_id: string }).user_id,
    (refreshed.sent.metadata as { user_id: string }).user_id
  );
});
