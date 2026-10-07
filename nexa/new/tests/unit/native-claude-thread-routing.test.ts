import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "native-thread-routing-"));
process.env.API_KEY_SECRET = "native-thread-routing-fixture-secret";
const { handleChat } = await import("../../src/sse/handlers/chat.ts");
const core = await import("../../src/lib/db/core.ts");
const owners = await import("../../src/lib/db/nativeClaudeThreads.ts");
const logs = await import("../../src/lib/usage/callLogs.ts");
const quota = await import("../../src/domain/quotaCache.ts");
const providers = await import("../../src/lib/db/providers.ts");
const apiKeys = await import("../../src/lib/db/apiKeys.ts");
const settings = await import("../../src/lib/db/settings.ts");
const resilience = await import("../../src/lib/resilience/settings.ts");
const session = "12345678-1234-4123-8123-123456789abc";
const otherSession = "22345678-1234-4123-8123-123456789abc";
let accountA: string;
let accountB: string;

test.before(async () => {
  await settings.updateSettings({
    requireApiKey: false,
    resilienceSettings: resilience.mergeResilienceSettings(
      resilience.resolveResilienceSettings({}),
      { quotaPreflight: { enabled: false, cachedQuotaFilteringEnabled: true } }
    ),
  });
  accountA = String(
    (
      await providers.createProviderConnection({
        provider: "claude",
        authType: "apikey",
        apiKey: "fixture-account-a",
        name: "Thread owner",
        isActive: true,
      })
    ).id
  );
  accountB = String(
    (
      await providers.createProviderConnection({
        provider: "claude",
        authType: "apikey",
        apiKey: "fixture-account-b",
        name: "Sibling",
        isActive: true,
      })
    ).id
  );
});
test.after(async () => {
  quota.stopBackgroundRefresh();
  await logs.closeCallLogSaves();
  core.resetDbInstance();
});

async function expectClientReplay(messageId: string, id: string, sid = session, apiKey?: string) {
  const body = {
    model: "claude/claude-sonnet-5-5",
    stream: false,
    thread: { type: "continue", previous_message_id: messageId },
    metadata: { user_id: JSON.stringify({ session_id: sid }) },
    messages: [
      {
        role: "user",
        content: [{ type: "tool_result", tool_use_id: "toolu_previous", content: "delta" }],
      },
    ],
  };
  const original = structuredClone(body);
  const headers = {
    "content-type": "application/json",
    "x-app": "cli",
    "anthropic-beta": "message-threads-2026-08-12,oauth-2025-04-20",
    ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
  };
  const request = new Request("http://localhost/v1/messages", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const originalFetch = globalThis.fetch;
  let dispatches = 0;
  globalThis.fetch = async () => {
    dispatches++;
    throw new Error("unexpected provider dispatch");
  };
  try {
    const response = await handleChat(request, { headers, endpoint: "/v1/messages" }, body, id);
    assert.equal(response.status, 404);
    const payload = await response.json();
    assert.equal(payload.error.type, "invalid_request_error");
    assert.match(payload.error.message, /No thread state is available/);
    assert.match(payload.error.message, /Replay the full conversation/);
    assert.equal(dispatches, 0, "a sparse delta cannot be sent on any sibling account");
    assert.deepEqual(
      body,
      original,
      "a rejected continuation must retain its sparse native payload"
    );
    let row: { status: number; error_summary: string } | undefined;
    for (let tries = 0; tries < 100 && !row; tries++) {
      row = core
        .getDbInstance()
        .prepare("SELECT status,error_summary FROM call_logs WHERE correlation_id = ? LIMIT 1")
        .get(id) as typeof row;
      if (!row) await new Promise((resolve) => setTimeout(resolve, 10));
    }
    assert.equal(row?.status, 404, "the local refusal remains visible in call logs");
    assert.match(row?.error_summary ?? "", /No thread state is available/);
  } finally {
    globalThis.fetch = originalFetch;
  }
}

test("an unknown or cross-session Thread requests full replay without dispatch", async () => {
  owners.saveNativeClaudeThreadOwner(session, "msg_owned", accountA);
  await expectClientReplay("msg_missing", "native-thread-unknown");
  await expectClientReplay("msg_owned", "native-thread-cross-session", otherSession);
});

test("an expired Thread owner cannot cause a sparse sibling fallback", async () => {
  owners.saveNativeClaudeThreadOwner(session, "msg_expired", accountA, Date.now() - 86400001);
  await expectClientReplay("msg_expired", "native-thread-expired");
});

test("Thread ownership cannot bypass an API key's connection allowlist", async () => {
  owners.saveNativeClaudeThreadOwner(session, "msg_restricted", accountA);
  const key = await apiKeys.createApiKey("Thread routing fixture", "native-thread-fixture", [], {
    allowedConnections: [accountB],
  });
  await expectClientReplay("msg_restricted", "native-thread-restricted", session, key.key);
});

test("a paused Thread owner requests replay without using an active sibling", async () => {
  owners.saveNativeClaudeThreadOwner(session, "msg_paused", accountA);
  await providers.updateProviderConnection(accountA, { isActive: false });
  try {
    await expectClientReplay("msg_paused", "native-thread-paused");
  } finally {
    await providers.updateProviderConnection(accountA, { isActive: true });
  }
});

test("an exhausted Thread owner requests replay while preserving its quota wall", async () => {
  owners.saveNativeClaudeThreadOwner(session, "msg_exhausted", accountA);
  const resetAt = new Date(Date.now() + 86400000).toISOString();
  quota.setQuotaCache(accountA, "claude", {
    "weekly (7d)": {
      remainingPercentage: 0,
      resetAt,
      claudeQuota: {
        kind: "weekly_all",
        active: true,
        severity: "critical",
        scopeKey: null,
        modelId: null,
        modelDisplayName: null,
      },
    },
  });
  try {
    await expectClientReplay("msg_exhausted", "native-thread-exhausted");
    assert.equal(quota.isQuotaExhaustedForRequest(accountA, "claude", "claude-sonnet-5-5"), true);
  } finally {
    quota.__clearForTests();
  }
});
