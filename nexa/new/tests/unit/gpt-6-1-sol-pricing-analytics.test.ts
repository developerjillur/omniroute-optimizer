import test from "node:test";
import assert from "node:assert/strict";
import {
  getModelUsageRows,
  getDailyCostRows,
  getProviderCostRows,
  getServiceTierUsageRows,
  getPresetCostModelRows,
  getAccountCostRows,
  getApiKeyUsageRows,
} from "../../src/lib/db/usageAnalytics.ts";
import { getDbInstance } from "../../src/lib/db/core.ts";
import { DEFAULT_PRICING } from "../../src/shared/constants/pricing/default-pricing.ts";
import { computeCostFromPricing } from "../../src/lib/usage/costCalculator.ts";

const sourceRow = (input: number, cached: number) => `SELECT
  '2026-10-14T00:00:00.000Z' AS timestamp, 'codex' AS provider, 'gpt-6.1-sol' AS model,
  ${input} AS tokens_input, 1000 AS tokens_output, ${cached} AS tokens_cache_read,
  0 AS tokens_cache_creation, 0 AS tokens_reasoning, 'standard' AS service_tier,
  1 AS success, 100 AS latency_ms, 1 AS requests, 0 AS stored_cost, 0 AS is_aggregated`;

test("analytics prices mixed GPT 6.1 Sol contexts by request rather than the summed token count", () => {
  const source = `(${sourceRow(200_000, 190_000)} UNION ALL ${sourceRow(400_000, 390_000)})`;
  for (const query of [
    getModelUsageRows,
    getDailyCostRows,
    getProviderCostRows,
    getServiceTierUsageRows,
    getPresetCostModelRows,
  ]) {
    const rows = query(source, {});
    assert.equal(rows.length, 2, query.name);
    const total = rows.reduce(
      (sum, row) =>
        sum +
        computeCostFromPricing(
          DEFAULT_PRICING.cx["gpt-6.1-sol"],
          {
            input: row.promptTokens,
            output: row.completionTokens,
            cacheRead: row.cacheReadTokens,
          },
          { provider: "codex", model: "gpt-6.1-sol", longContext: row.longContext === 1 }
        ),
      0
    );
    assert.ok(Math.abs(total - 0.182) < 1e-12, `${query.name}: ${total}`);
  }
});

test("summed small requests never trigger the GPT 6.1 Sol long-context premium", () => {
  const rows = getModelUsageRows(
    `(${sourceRow(200_000, 190_000)} UNION ALL ${sourceRow(200_000, 190_000)})`,
    {}
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].promptTokens, 400_000);
  assert.equal(rows[0].longContext, 0);
  const cost = computeCostFromPricing(
    DEFAULT_PRICING.cx["gpt-6.1-sol"],
    {
      input: rows[0].promptTokens,
      output: rows[0].completionTokens,
      cacheRead: rows[0].cacheReadTokens,
    },
    { provider: "codex", model: "gpt-6.1-sol", longContext: false }
  );
  assert.ok(Math.abs(cost - 0.098) < 1e-12);
});

test("API-key and account costs retain each request's GPT 6.1 Sol context bucket", (t) => {
  const db = getDbInstance();
  const key = "pricing-context-fixture-key";
  const insert =
    db.prepare(`INSERT INTO usage_history (provider, model, tokens_input, tokens_output, tokens_cache_read, tokens_cache_creation, tokens_reasoning, service_tier, status, success, timestamp, api_key_id, account_key)
    VALUES ('codex', 'gpt-6.1-sol', ?, 1000, ?, 0, 0, 'standard', 'success', 1, '2026-10-14T00:00:00.000Z', ?, 'pricing-context-fixture-account')`);
  t.after(() => db.prepare("DELETE FROM usage_history WHERE api_key_id = ?").run(key));
  insert.run(200_000, 190_000, key);
  insert.run(400_000, 390_000, key);
  for (const query of [getAccountCostRows, getApiKeyUsageRows]) {
    const rows = query("WHERE usage_history.api_key_id = @fixture", { fixture: key });
    assert.equal(rows.length, 2, query.name);
    const cost = rows.reduce(
      (sum, row) =>
        sum +
        computeCostFromPricing(
          DEFAULT_PRICING.cx["gpt-6.1-sol"],
          {
            input: row.promptTokens,
            output: row.completionTokens,
            cacheRead: row.cacheReadTokens,
          },
          { provider: "codex", model: "gpt-6.1-sol", longContext: row.longContext === 1 }
        ),
      0
    );
    assert.ok(Math.abs(cost - 0.182) < 1e-12, query.name);
  }
});

test("legacy stats and provider-window estimates preserve context buckets across mixed requests", async (t) => {
  const { getUsageStats, getConnectionSpendUsdSinceAdded } =
    await import("../../src/lib/usage/usageStats.ts");
  const { getProviderWindowCostBreakdown } =
    await import("../../src/lib/usage/providerWindowCosts.ts");
  const db = getDbInstance();
  const key = "pricing-context-surface-key";
  const connection = "pricing-context-surface-connection";
  const timestamp = new Date(Date.now() - 1000).toISOString();
  const insert =
    db.prepare(`INSERT INTO usage_history (provider, model, tokens_input, tokens_output, tokens_cache_read, tokens_cache_creation, tokens_reasoning, service_tier, status, success, timestamp, api_key_id, account_key, connection_id)
    VALUES (?, 'gpt-6.1-sol', ?, 1000, ?, 0, 0, 'standard', 'success', 1, ?, ?, 'pricing-context-fixture-account', ?)`);
  t.after(() => db.prepare("DELETE FROM usage_history WHERE api_key_id = ?").run(key));
  for (const provider of ["codex", "openai"]) {
    insert.run(provider, 200_000, 190_000, timestamp, key, connection);
    insert.run(provider, 400_000, 390_000, timestamp, key, connection);
  }
  const stats = await getUsageStats();
  assert.ok(Math.abs(stats.byModel["gpt-6.1-sol (openai)"].cost - 0.182) < 1e-12);
  assert.ok(
    Math.abs(stats.byModel["gpt-6.1-sol (codex)"].cost - 0.182) < 1e-12,
    "Codex keeps its existing API-equivalent cost display"
  );
  const spend = await getConnectionSpendUsdSinceAdded("openai", connection);
  assert.equal(spend.requests, 2);
  assert.ok(Math.abs(spend.costUsd - 0.182) < 1e-12);
  const breakdown = await getProviderWindowCostBreakdown({
    provider: "codex",
    connectionId: connection,
  });
  assert.equal(breakdown.rows.length, 1);
  assert.ok(Math.abs(breakdown.rows[0].costUsd - 0.182) < 1e-12);
  assert.equal(
    breakdown.rows[0].models.length,
    1,
    "context buckets merge into one displayed model"
  );
});
