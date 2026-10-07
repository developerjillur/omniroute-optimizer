import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "native-claude-usage-"));
const core = await import("../../../src/lib/db/core.ts");
const owners = await import("../../../src/lib/db/nativeClaudeThreads.ts");
const logs = await import("../../../src/lib/usage/callLogs.ts");
const snapshots = await import("../../../src/lib/db/quotaSnapshots.ts");
const { shouldPersistClaudeQuotaSnapshot } =
  await import("../../../src/lib/db/claudeQuotaSnapshots.ts");
const health = await import("../../../src/lib/usage/cacheHealth.ts");
test.after(async () => {
  await logs.closeCallLogSaves();
  core.resetDbInstance();
});

test("thread ownership is isolated, expires, survives reopening and stores no transcript", () => {
  const now = Date.now();
  owners.saveNativeClaudeThreadOwner("conversation-a", "msg_same", "account-a", now);
  owners.saveNativeClaudeThreadOwner("conversation-b", "msg_same", "account-b", now);
  assert.equal(owners.getNativeClaudeThreadOwner("conversation-a", "msg_same", now), "account-a");
  assert.equal(owners.getNativeClaudeThreadOwner("conversation-b", "msg_same", now), "account-b");
  assert.equal(
    owners.getNativeClaudeThreadOwner("conversation-a", "msg_same", now + 86400000),
    null
  );
  const row = core
    .getDbInstance()
    .prepare("SELECT key, value FROM key_value WHERE namespace = ? LIMIT 1")
    .get("native_claude_thread_owners") as { key: string; value: string };
  assert.match(row.key, /^[a-f0-9]{64}$/);
  assert.equal(row.value.includes("conversation-"), false);
  core.resetDbInstance();
  assert.equal(owners.getNativeClaudeThreadOwner("conversation-a", "msg_same", now), "account-a");
});

test("malformed persisted ownership is pruned without breaking valid saves", () => {
  const db = core.getDbInstance();
  db.prepare("INSERT OR REPLACE INTO key_value(namespace, key, value) VALUES (?, ?, ?)").run(
    "native_claude_thread_owners",
    "corrupt",
    "{broken"
  );
  const now = Date.now() + 6 * 60000;
  assert.doesNotThrow(() =>
    owners.saveNativeClaudeThreadOwner("healthy", "msg_current", "account-a", now)
  );
  assert.equal(owners.getNativeClaudeThreadOwner("healthy", "msg_current", now), "account-a");
  assert.equal(
    db
      .prepare("SELECT value FROM key_value WHERE namespace = ? AND key = ?")
      .get("native_claude_thread_owners", "corrupt"),
    undefined
  );
});

test("native effort and provider TTL counters persist without encrypted thinking", async () => {
  await logs.saveCallLog({
    id: "native-effort",
    method: "POST",
    path: "/v1/messages",
    status: 200,
    provider: "claude",
    model: "claude-sonnet-5-5",
    duration: 1,
    tokens: {
      prompt_tokens: 100000,
      completion_tokens: 25,
      cache_read_input_tokens: 70000,
      cache_creation_input_tokens: 30000,
    },
    clientRequestBody: { output_config: { effort: "max" } },
    upstreamRequestBody: { output_config: { effort: "max" } },
    cacheCreation5mTokens: 12000,
    cacheCreation1hTokens: 18000,
    nativeSessionTag: "a".repeat(64),
    nativeCacheGroupTag: "b".repeat(64),
  });
  const row = core
    .getDbInstance()
    .prepare(
      `SELECT reasoning_effort_requested, reasoning_effort_upstream,
    tokens_cache_creation_5m, tokens_cache_creation_1h, native_session_tag FROM call_logs WHERE id = ?`
    )
    .get("native-effort") as Record<string, unknown>;
  assert.equal(row.reasoning_effort_requested, "max");
  assert.equal(row.reasoning_effort_upstream, "max");
  assert.equal(row.tokens_cache_creation_5m, 12000);
  assert.equal(row.tokens_cache_creation_1h, 18000);
  assert.equal(row.native_session_tag, "a".repeat(64));
});

test("first-request detection includes retained history outside the selected window", () => {
  const db = core.getDbInstance();
  db.prepare("DELETE FROM call_logs").run();
  const insert =
    db.prepare(`INSERT INTO call_logs (id,timestamp,status,provider,model,tokens_in,tokens_out,
    tokens_cache_read,tokens_cache_creation,native_cache_group_tag) VALUES (?,?,?,?,?,?,?,?,?,?)`);
  const now = Date.now();
  insert.run(
    "older",
    new Date(now - 2 * 3600000).toISOString(),
    200,
    "claude",
    "claude-sonnet-5-5",
    30000,
    1,
    0,
    30000,
    "a".repeat(64)
  );
  insert.run(
    "current",
    new Date(now - 1000).toISOString(),
    200,
    "claude",
    "claude-sonnet-5-5",
    32000,
    1,
    1000,
    31000,
    "a".repeat(64)
  );
  const model = health.buildCacheHealthResponse({ range: "1h", now }).native.models[0];
  assert.equal(model.rewriteEligibleCalls, 1);
  assert.equal(model.largeRewriteShare, 1);
  assert.equal(model.unknownTtlWriteTotal, 31000);
});

test("Claude snapshot jitter deduplicates without rounding a real deadline or quota change", () => {
  const db = core.getDbInstance();
  const base = {
    provider: "claude",
    connection_id: "snapshot-owner",
    window_key: "weekly (7d)",
    remaining_percentage: 40,
    is_exhausted: 0,
    next_reset_at: "2026-10-13T02:59:59.960Z",
    window_duration_ms: 604800000,
    raw_data: null,
  };
  snapshots.saveQuotaSnapshot(base);
  snapshots.saveQuotaSnapshot({ ...base, next_reset_at: "2026-10-13T03:00:00.570Z" });
  const rows = () =>
    db
      .prepare("SELECT * FROM quota_snapshots WHERE connection_id = ? ORDER BY id")
      .all(base.connection_id) as Array<Record<string, unknown>>;
  assert.equal(rows().length, 1);
  assert.equal(rows()[0].next_reset_at, base.next_reset_at);
  snapshots.saveQuotaSnapshot({
    ...base,
    remaining_percentage: 39,
    next_reset_at: "2026-10-13T03:00:00.570Z",
  });
  assert.equal(rows().length, 2);
  snapshots.saveQuotaSnapshot({
    ...base,
    remaining_percentage: 39,
    next_reset_at: "2026-10-13T03:10:00.570Z",
  });
  assert.equal(rows().length, 3);
  db.prepare("UPDATE quota_snapshots SET created_at = ? WHERE connection_id = ?").run(
    new Date(Date.now() - 31 * 60000).toISOString(),
    base.connection_id
  );
  snapshots.saveQuotaSnapshot({
    ...base,
    remaining_percentage: 39,
    next_reset_at: "2026-10-13T03:10:00.570Z",
  });
  assert.equal(rows().length, 4);
});

test("an invalid or future snapshot timestamp cannot suppress fresh quota evidence", () => {
  const now = Date.now();
  const state = {
    remaining_percentage: 50,
    is_exhausted: 0,
    next_reset_at: null,
    window_duration_ms: 604800000,
    raw_data: null,
  };
  assert.equal(
    shouldPersistClaudeQuotaSnapshot({ ...state, created_at: "invalid" }, state, now),
    true
  );
  assert.equal(
    shouldPersistClaudeQuotaSnapshot(
      { ...state, created_at: new Date(now + 1).toISOString() },
      state,
      now
    ),
    true
  );
});
