import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "cache-ttl-tool-loop-"));
process.env.DISABLE_SQLITE_AUTO_BACKUP = "true";

const { aggregateProviderLegUsage } = await import("../../src/lib/skills/serverOwnedToolLoop.ts");
const { toFailureUsageAggregate, buildFailureUsageRecord } =
  await import("../../open-sse/handlers/chatCore/failureUsage.ts");
const core = await import("../../src/lib/db/core.ts");
test.after(() => core.resetDbInstance());

test("server-owned tool legs retain TTL, unknown writes and reasoning as separate dimensions", () => {
  const first = {
    prompt_tokens: 112,
    completion_tokens: 7,
    total_tokens: 119,
    cache_creation_input_tokens: 100,
    cacheCreation5m: 40,
    cacheCreation1h: 60,
    reasoning_tokens: 5,
  };
  const second = {
    prompt_tokens: 30,
    completion_tokens: 3,
    total_tokens: 33,
    cache_creation_input_tokens: 20,
  };
  const result = aggregateProviderLegUsage([first, second]);
  assert.equal(result.prompt_tokens, 142);
  assert.equal(result.completion_tokens, 10);
  assert.equal(result.total_tokens, 152);
  assert.equal(result.cache_creation_input_tokens, 120);
  assert.equal(result.cacheCreation5m, 40);
  assert.equal(result.cacheCreation1h, 60);
  assert.equal(result.reasoning_tokens, 5);
});

test("invalid TTL on one tool leg cannot borrow writes from another leg", () => {
  const result = aggregateProviderLegUsage([
    {
      prompt_tokens: 100,
      completion_tokens: 0,
      total_tokens: 100,
      cache_creation_input_tokens: 100,
      cacheCreation5m: 60,
      cacheCreation1h: 60,
    },
    {
      prompt_tokens: 100,
      completion_tokens: 0,
      total_tokens: 100,
      cache_creation_input_tokens: 100,
      cacheCreation5m: 100,
    },
  ]);
  assert.equal(result.cache_creation_input_tokens, 200);
  assert.equal(result.cacheCreation5m, 100);
  assert.equal(result.cacheCreation1h, undefined);
});

test("a failed later tool leg preserves the earlier billed legs' TTL without adding usage", () => {
  const aggregate = toFailureUsageAggregate({
    prompt_tokens: 100,
    completion_tokens: 5,
    cache_creation_input_tokens: 100,
    cacheCreation5m: 40,
    cacheCreation1h: 60,
  });
  const record = buildFailureUsageRecord({
    provider: "claude",
    model: "fixture-failure",
    connectionId: "fixture-connection",
    apiKeyInfo: null,
    effectiveServiceTier: "standard",
    isCombo: false,
    comboStrategy: null,
    statusCode: 503,
    errorCode: "fixture-failure",
    latencyMs: 1,
    aggregate,
  });
  assert.equal(record.success, false);
  assert.equal(record.tokens.input, 100);
  assert.equal(record.tokens.output, 5);
  assert.equal(record.tokens.cacheCreation, 100);
  assert.equal(record.tokens.cacheCreation5m, 40);
  assert.equal(record.tokens.cacheCreation1h, 60);
  const invalid = toFailureUsageAggregate({
    cache_creation_input_tokens: 100,
    cacheCreation5m: 60,
    cacheCreation1h: 60,
  });
  assert.equal(invalid?.cacheCreation5m, undefined);
  assert.equal(invalid?.cacheCreation1h, undefined);
});
