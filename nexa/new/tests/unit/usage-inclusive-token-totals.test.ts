import assert from "node:assert/strict";
import { test } from "node:test";
import { DatabaseSync } from "node:sqlite";
import { buildApiKeySelfServiceStatus } from "../../src/lib/usage/apiKeySelfService.ts";
import { getDbInstance } from "../../src/lib/db/core.ts";
import { getMonthlyProviderTokensForConnection } from "../../src/lib/usage/usageStats.ts";

const metadata = {
  id: "inclusive-token-owner",
  name: "Usage fixture",
  scopes: ["self:usage"],
  allowedConnections: [],
};

const budget = {
  budget: null,
  totalCostMonth: 12.34,
  totalCostPeriod: 0,
  activeLimitUsd: 0,
  resetInterval: null,
  budgetResetAt: null,
  periodStartAt: null,
  nextResetAt: null,
  warningThreshold: null,
};

for (const fixture of [
  {
    name: "Responses cached input and reasoning",
    input: 200_000,
    output: 1_000,
    read: 190_000,
    write: 0,
    reasoning: 700,
  },
  {
    name: "native Claude cache reads and writes",
    input: 104_002,
    output: 9,
    read: 100_000,
    write: 4_000,
    reasoning: 3,
  },
  { name: "uncached input", input: 900, output: 30, read: 0, write: 0, reasoning: 0 },
]) {
  test(`self-service counts ${fixture.name} once and keeps the breakdown`, async () => {
    const db = new DatabaseSync(":memory:");
    try {
      db.exec(`CREATE TABLE usage_history (
        api_key_id TEXT, timestamp TEXT, tokens_input INTEGER, tokens_output INTEGER,
        tokens_cache_read INTEGER, tokens_cache_creation INTEGER, tokens_reasoning INTEGER
      )`);
      const insert = db.prepare("INSERT INTO usage_history VALUES (?, ?, ?, ?, ?, ?, ?)");
      insert.run(
        metadata.id,
        "2026-11-05T12:00:00.000Z",
        fixture.input,
        fixture.output,
        fixture.read,
        fixture.write,
        fixture.reasoning
      );
      insert.run("another-owner", "2026-11-05T12:00:00.000Z", 999_999, 999, 900_000, 500, 900);
      insert.run(metadata.id, "2026-10-05T12:00:00.000Z", 888_888, 888, 800_000, 400, 800);
      const result = await buildApiKeySelfServiceStatus(metadata, {
        now: () => Date.UTC(2026, 10, 6),
        getCostSummary: () => budget,
        checkBudget: () => ({ allowed: true }),
        getDbInstance: () => ({
          prepare: (sql: string) => {
            const statement = db.prepare(sql);
            return {
              get: (...params: unknown[]) => {
                assert.ok(params.every((value) => typeof value === "string"));
                return statement.get(...(params as string[]));
              },
            };
          },
        }),
        getProviderConnectionById: async () => null,
        getProviderConnections: async () => [],
        fetchAndPersistProviderLimits: async () => {
          throw new Error("Usage totals must not fetch provider quota or generate a response");
        },
      });
      assert.equal(result.usage.tokens.totalTokens, fixture.input + fixture.output);
      assert.equal(result.usage.tokens.inputTokens, fixture.input);
      assert.equal(result.usage.tokens.outputTokens, fixture.output);
      assert.equal(result.usage.tokens.cacheReadTokens, fixture.read);
      assert.equal(result.usage.tokens.cacheCreationTokens, fixture.write);
      assert.equal(result.usage.tokens.reasoningTokens, fixture.reasoning);
      assert.equal(
        result.usage.cost.usedUsd,
        12.34,
        "token display must not rewrite a measured cost"
      );
    } finally {
      db.close();
    }
  });
}

test("monthly self-tracked provider quotas count inclusive tokens once within their connection and month", (t) => {
  const db = getDbInstance();
  const connection = "inclusive-monthly-connection";
  const key = "inclusive-monthly-fixture";
  const now = new Date();
  const stamp = now.toISOString();
  const previousMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 15)
  ).toISOString();
  const insert = db.prepare(`INSERT INTO usage_history
    (provider, model, connection_id, api_key_id, timestamp, tokens_input, tokens_output,
     tokens_cache_read, tokens_cache_creation, tokens_reasoning, status, success)
    VALUES (?, 'inclusive-model', ?, ?, ?, 200000, 1000, 190000, 4000, 700, 'success', 1)`);
  t.after(() => db.prepare("DELETE FROM usage_history WHERE api_key_id = ?").run(key));
  insert.run("mimo", connection, key, stamp);
  insert.run("mimo", connection, key, stamp);
  insert.run("another-provider", connection, key, stamp);
  insert.run("mimo", "another-connection", key, stamp);
  insert.run("mimo", connection, key, previousMonth);
  assert.equal(getMonthlyProviderTokensForConnection("mimo", connection), 402_000);
  assert.equal(getMonthlyProviderTokensForConnection("", connection), 0);
  assert.equal(getMonthlyProviderTokensForConnection("mimo", ""), 0);
});
