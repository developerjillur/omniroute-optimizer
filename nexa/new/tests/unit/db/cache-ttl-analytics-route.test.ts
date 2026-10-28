import test from "node:test";
import assert from "node:assert/strict";
import { seedMixed } from "../../helpers/cacheTtlDatabase.ts";
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
