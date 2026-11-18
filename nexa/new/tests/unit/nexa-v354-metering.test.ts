import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { getCacheCreationTtl } from "../../src/lib/usage/cacheCreationTtl.ts";
import { cacheTtlTokenSql } from "../../src/lib/db/usageAnalytics/cacheTtl.ts";
import { createNativeClaudeUsageTracker } from "../../open-sse/utils/nativeClaudeUsage.ts";

test("TTL accounting accepts whole REAL counters and refuses fractional or inconsistent splits", () => {
  const db = new DatabaseSync(":memory:");
  try {
    db.exec(`CREATE TABLE usage (
      tokens_cache_creation REAL, tokens_cache_creation_5m REAL, tokens_cache_creation_1h REAL
    ); INSERT INTO usage VALUES
      (1000000, 1000000, 0), (1000000, 0, 1000000),
      (1000000, 0.5, 0), (1000000, 0, 1000001), (-1, 0, 0),
      (1000000, NULL, NULL), (9007199254740992, 1, 0)`);
    const sql = cacheTtlTokenSql();
    const rows = db.prepare(`SELECT ${sql.five} AS five, ${sql.hour} AS hour FROM usage`).all();
    assert.deepEqual(
      rows.map((row) => [row.five, row.hour]),
      [
        [1000000, 0],
        [0, 1000000],
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
      ]
    );
  } finally {
    db.close();
  }
});

const body = {
  model: "claude-sonnet-5-5",
  thread: { type: "continue", previous_message_id: "msg_meter_previous" },
  messages: [{ role: "user", content: "fixture" }],
};

test("native streaming receipt includes complete compaction iterations and known TTL once", () => {
  const tracker = createNativeClaudeUsageTracker(body);
  tracker.observe({
    type: "message_start",
    message: {
      usage: {
        input_tokens: 2,
        output_tokens: 0,
        cache_read_input_tokens: 100000,
        cache_creation_input_tokens: 4000,
      },
    },
  });
  const terminal = {
    input_tokens: 2,
    output_tokens: 9,
    cache_read_input_tokens: 100000,
    cache_creation_input_tokens: 4000,
    output_tokens_details: { thinking_tokens: 3 },
    iterations: [
      {
        type: "compaction",
        input_tokens: 1,
        output_tokens: 4,
        cache_read_input_tokens: 50000,
        cache_creation_input_tokens: 0,
      },
      {
        type: "message",
        input_tokens: 2,
        output_tokens: 9,
        cache_read_input_tokens: 100000,
        cache_creation_input_tokens: 4000,
        cache_creation: { ephemeral_5m_input_tokens: 1000, ephemeral_1h_input_tokens: 3000 },
      },
    ],
  };
  const before = JSON.stringify(terminal);
  tracker.observe({ type: "message_delta", usage: terminal });
  const usage = tracker.getUsage();
  assert.equal(usage?.prompt_tokens, 154003);
  assert.equal(usage?.completion_tokens, 13);
  assert.equal(usage?.reasoning_tokens, 3);
  assert.equal(usage?.cacheCreation5m, 1000);
  assert.equal(usage?.cacheCreation1h, 3000);
  assert.equal(JSON.stringify(terminal), before, "native wire counters stay untouched");
});

test("a later cumulative counter update supersedes earlier iteration detail", () => {
  const tracker = createNativeClaudeUsageTracker(body);
  tracker.observe({
    type: "message_delta",
    usage: {
      iterations: [
        {
          type: "message",
          input_tokens: 1,
          output_tokens: 2,
          cache_read_input_tokens: 3,
          cache_creation_input_tokens: 4,
        },
      ],
      output_tokens: 2,
    },
  });
  tracker.observe({
    type: "message_delta",
    usage: {
      input_tokens: 10,
      output_tokens: 5,
      cache_read_input_tokens: 0,
      cache_creation_input_tokens: 0,
    },
  });
  assert.equal(tracker.getUsage()?.prompt_tokens, 10);
  assert.equal(tracker.getUsage()?.completion_tokens, 5);
});

test("invalid and inconsistent cache diagnostics never produce known TTL billing", () => {
  for (const status of ["invalid", "inconsistent"]) {
    assert.deepEqual(getCacheCreationTtl({
      cache_creation_input_tokens: 10,
      cache_creation: { ephemeral_5m_input_tokens: 5, ephemeral_1h_input_tokens: 5 },
      cache_creation_tier_status: status,
    }), { cacheCreation5m: null, cacheCreation1h: null });
  }
});
