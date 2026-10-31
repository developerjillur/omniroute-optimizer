import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  fixtureDir,
  history,
  queries,
  seed,
  seedMixed,
  rowCost,
  sourceForModel,
} from "../../helpers/cacheTtlDatabase.ts";
const { openDatabaseAsync } = await import("../../../src/lib/db/adapters/driverFactory.ts");
const { getUsageStats, getConnectionSpendUsdSinceAdded } =
  await import("../../../src/lib/usage/usageStats.ts");
const { getProviderWindowCostBreakdown } =
  await import("../../../src/lib/usage/providerWindowCosts.ts");

test("migration adds nullable TTL without assigning historical writes to either duration", async () => {
  const db = await openDatabaseAsync(path.join(fixtureDir, "legacy-migration.sqlite"));
  try {
    db.exec("CREATE TABLE usage_history (id INTEGER PRIMARY KEY, tokens_cache_creation INTEGER)");
    db.exec("INSERT INTO usage_history VALUES (1, 100)");
    db.exec(
      fs.readFileSync(
        new URL("../../../src/lib/db/migrations/198_usage_history_cache_ttl.sql", import.meta.url),
        "utf8"
      )
    );
    const row = db.prepare("SELECT * FROM usage_history WHERE id = 1").get();
    assert.deepEqual(row, {
      id: 1,
      tokens_cache_creation: 100,
      tokens_cache_creation_5m: null,
      tokens_cache_creation_1h: null,
    });
  } finally {
    db.close();
  }
});

test("history retains known split and keeps an omitted split nullable in both readers", async () => {
  const model = "fixture-ttl-history";
  await seed(model, { cacheCreation5m: 0, cacheCreation1h: 1_000_000 });
  await seed(model);
  const rows = await history.getUsageHistory({ model });
  assert.equal(rows.length, 2);
  assert.equal(rows[0].tokens.cacheCreation5m, 0);
  assert.equal(rows[0].tokens.cacheCreation1h, 1_000_000);
  assert.equal(rows[1].tokens.cacheCreation5m, null);
  assert.equal(rows[1].tokens.cacheCreation1h, null);
  const usageDb = await history.getUsageDb();
  const unknown = usageDb.data.history.find(
    (row) => row.model === model && row.tokens.cacheCreation1h === null
  );
  assert.ok(unknown);
});

test("duplicate metadata can enrich the same observed write total without a second usage row", async () => {
  const model = "fixture-ttl-dedup";
  const timestamp = new Date(Date.now() - 1000).toISOString();
  await seed(model, {}, timestamp);
  await seed(model, { cacheCreation1h: 1_000_000 }, timestamp);
  const rows = await history.getUsageHistory({ model });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].tokens.cacheCreation, 1_000_000);
  assert.equal(rows[0].tokens.cacheCreation1h, 1_000_000);
});

test("all cost dimensions price mixed TTL and unknown historical writes without double counting", async () => {
  const model = "fixture-ttl-dimensions";
  await seedMixed(model);
  const source = sourceForModel(model);
  for (const query of [
    queries.getDailyCostRows,
    queries.getModelUsageRows,
    queries.getProviderCostRows,
    queries.getServiceTierUsageRows,
    queries.getPresetCostModelRows,
  ]) {
    const rows = query(source.unifiedSource, source.unifiedParams);
    assert.equal(
      rows.reduce((sum, row) => sum + row.cacheCreationTokens, 0),
      3_000_000
    );
    assert.equal(
      rows.reduce((sum, row) => sum + Number(row.cacheCreation5mTokens), 0),
      1_000_000
    );
    assert.equal(
      rows.reduce((sum, row) => sum + Number(row.cacheCreation1hTokens), 0),
      1_000_000
    );
    assert.equal(
      rows.reduce((sum, row) => sum + rowCost({ ...row }), 0),
      9,
      query.name
    );
  }
  const where = "WHERE usage_history.model = @fixtureModel";
  for (const query of [queries.getAccountCostRows, queries.getApiKeyUsageRows]) {
    const rows = query(where, { fixtureModel: model });
    assert.equal(
      rows.reduce((sum, row) => sum + rowCost({ ...row }), 0),
      9,
      query.name
    );
  }
});

test("legacy custom SQL sources without TTL columns remain compatible", () => {
  const source = `(SELECT '2026-10-18T00:00:00.000Z' timestamp, 'openai' provider,
    'fixture-ttl-legacy-source' model, 1000000 tokens_input, 0 tokens_output,
    0 tokens_cache_read, 1000000 tokens_cache_creation, 0 tokens_reasoning,
    'standard' service_tier, 1 requests, 1 success, 0 latency_ms,
    0 stored_cost, 0 is_aggregated)`;
  const rows = queries.getDailyCostRows(source, {});
  assert.equal(rows.length, 1);
  assert.equal(rowCost({ ...rows[0] }), 2.5);
});

test("an impossible row split cannot borrow another row's writes during SQL aggregation", () => {
  const source = `(SELECT '2026-10-18T00:00:00.000Z' timestamp, 'openai' provider,
    'fixture-ttl-invalid-source' model, 1000000 tokens_input, 0 tokens_output,
    0 tokens_cache_read, 1000000 tokens_cache_creation,
    600000 tokens_cache_creation_5m, 600000 tokens_cache_creation_1h,
    0 tokens_reasoning, 'standard' service_tier, 0 stored_cost, 0 is_aggregated
    UNION ALL SELECT '2026-10-18T00:00:01.000Z', 'openai', 'fixture-ttl-invalid-source',
    1000000, 0, 0, 1000000, 1000000, 0, 0, 'standard', 0, 0)`;
  const rows = queries.getDailyCostRows(source, {});
  assert.equal(rows.length, 1);
  assert.equal(rows[0].cacheCreation5mTokens, 1_000_000);
  assert.equal(rows[0].cacheCreation1hTokens, 0);
  assert.equal(rowCost({ ...rows[0] }), 5);
  for (const total of ["1.5", "9007199254740992", "'broken'"]) {
    const malformed = `(SELECT '2026-10-18T00:00:00.000Z' timestamp, 'openai' provider,
      'fixture-ttl-malformed-total' model, 10 tokens_input, 0 tokens_output,
      0 tokens_cache_read, ${total} tokens_cache_creation,
      0 tokens_cache_creation_5m, 1 tokens_cache_creation_1h,
      0 tokens_reasoning, 'standard' service_tier, 0 stored_cost, 0 is_aggregated)`;
    const [row] = queries.getDailyCostRows(malformed, {});
    assert.equal(row.cacheCreation5mTokens, 0, total);
    assert.equal(row.cacheCreation1hTokens, 0, total);
  }
});

test("legacy stats, connection estimates and provider windows retain TTL cost", async () => {
  const model = "fixture-ttl-surfaces";
  await seedMixed(model);
  const stats = await getUsageStats();
  assert.equal(stats.byModel[`${model} (openai)`].cost, 9);
  const connection = await getConnectionSpendUsdSinceAdded("openai", `connection-${model}`);
  assert.equal(connection.requests, 3);
  assert.equal(connection.costUsd, 9);
  const windows = await getProviderWindowCostBreakdown({
    provider: "openai",
    connectionId: `connection-${model}`,
  });
  assert.equal(
    windows.rows.reduce((sum, row) => sum + row.costUsd, 0),
    9
  );
});
