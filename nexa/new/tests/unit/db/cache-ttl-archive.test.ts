import test from "node:test";
import assert from "node:assert/strict";
import { core, queries, seedMixed } from "../../helpers/cacheTtlDatabase.ts";
const { rollupUsageHistoryBeforeDate } = await import("../../../src/lib/usage/aggregateHistory.ts");

test("archive stores TTL-aware cost once and a repeated rollup does not add it twice", async () => {
  const model = "fixture-ttl-archive";
  await seedMixed(model, [
    "2026-01-01T00:00:00.000Z",
    "2026-01-01T00:00:01.000Z",
    "2026-01-01T00:00:02.000Z",
  ]);
  for (let iteration = 0; iteration < 2; iteration++) {
    const result = await rollupUsageHistoryBeforeDate("2026-01-02");
    assert.equal(result.errors, 0);
    const row = core
      .getDbInstance()
      .prepare(
        "SELECT total_requests, total_input_tokens, total_cost FROM daily_usage_summary WHERE model = ?"
      )
      .get(model) as { total_requests: number; total_input_tokens: number; total_cost: number };
    assert.equal(row.total_requests, 3);
    assert.equal(row.total_input_tokens, 3_000_000);
    assert.equal(row.total_cost, 9);
  }
  const source = queries.buildUnifiedSource({
    sinceIso: null,
    untilIso: null,
    rawCutoffDate: "2026-01-02",
    apiKeyWhere: "",
    apiKeyParams: {},
  });
  const rows = queries
    .getDailyCostRows(source.unifiedSource, source.unifiedParams)
    .filter((row) => row.model === model);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].isAggregated, 1);
  assert.equal(rows[0].storedCost, 9);
});
