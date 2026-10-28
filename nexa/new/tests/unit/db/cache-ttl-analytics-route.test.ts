import test from "node:test";
import assert from "node:assert/strict";
import { seedMixed, core } from "../../helpers/cacheTtlDatabase.ts";
const analytics = await import("../../../src/app/api/usage/analytics/route.ts");

test("analytics route forwards TTL into visible model cost without network or live-service access", async () => {
  const model = "fixture-ttl-route";
  await seedMixed(model);
  const response = await analytics.GET(
    new Request("http://localhost/api/usage/analytics?range=all")
  );
  assert.equal(response.status, 200);
  const result = await response.json();
  const row = result.byModel.find((entry) => entry.provider === "openai" && entry.model === model);
  assert.ok(row);
  assert.equal(row.cost, 9);
});

test("reported cost is retained while unreported rows keep their native cache TTL tariff", async () => {
  const model = "fixture-ttl-reported-cost";
  await seedMixed(model);
  const db = core.getDbInstance();
  db.prepare("UPDATE usage_history SET provider_cost_usd=0.75 WHERE model=? AND tokens_cache_creation_5m=1000000").run(model);
  const response = await analytics.GET(new Request("http://localhost/api/usage/analytics?range=all"));
  assert.equal(response.status, 200);
  const result = await response.json();
  const row = result.byModel.find((entry) => entry.provider === "openai" && entry.model === model);
  assert.ok(row);
  assert.equal(row.cost, 7.25);
  const { getProviderWindowCostBreakdown } = await import("../../../src/lib/usage/providerWindowCosts.ts");
  const window = await getProviderWindowCostBreakdown({ provider: "openai", connectionId: `connection-${model}` });
  assert.equal(window.rows.reduce((sum, entry) => sum+entry.costUsd,0), 7.25);
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM usage_history WHERE model=?").get(model) as {count:number}).count,3);
});
