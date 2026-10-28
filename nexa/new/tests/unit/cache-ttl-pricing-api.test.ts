import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "cache-ttl-pricing-api-"));
process.env.DISABLE_SQLITE_AUTO_BACKUP = "true";
const core = await import("../../src/lib/db/core.ts");
const { updateSettings } = await import("../../src/lib/db/settings.ts");
await updateSettings({ requireLogin: false });
const { updatePricingSchema } = await import("../../src/shared/validation/schemas/pricing.ts");
const pricing = await import("../../src/app/api/pricing/route.ts");
const { computeCostFromPricing } = await import("../../src/lib/usage/costCalculator.ts");
test.after(() => core.resetDbInstance());

test("pricing schema retains a one-hour cache rate, including an explicit zero", () => {
  for (const hour of [4, 0]) {
    const body = { openai: { "fixture-ttl-schema": { input: 2, cache_creation_1h: hour } } };
    const result = updatePricingSchema.safeParse(body);
    assert.equal(result.success, true);
    if (result.success) assert.deepEqual(result.data, body);
  }
});

test("one-hour pricing validation rejects malformed rates and keeps unknown fields strict", () => {
  for (const hour of [-1, NaN, Infinity, "4", null]) {
    assert.equal(
      updatePricingSchema.safeParse({ openai: { fixture: { cache_creation_1h: hour } } }).success,
      false
    );
  }
  assert.equal(
    updatePricingSchema.safeParse({ openai: { fixture: { unexpectedRate: 4 } } }).success,
    false
  );
});

test("pricing PATCH and GET round-trip a one-hour cache rate through the real handlers", async () => {
  const model = "fixture-ttl-api-roundtrip";
  const rates = { input: 2, output: 10, cached: 0.2, cache_creation: 2.5, cache_creation_1h: 4 };
  const body = { openai: { [model]: rates } };
  const patched = await pricing.PATCH(
    new Request("http://localhost/api/pricing", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
  );
  assert.equal(patched.status, 200);
  assert.deepEqual((await patched.json()).openai[model], rates);
  const read = await pricing.GET(new Request("http://localhost/api/pricing"));
  assert.equal(read.status, 200);
  assert.deepEqual((await read.json()).openai[model], rates);
});

test("pricing API preserves an explicit free one-hour write instead of applying a fallback", async () => {
  const model = "fixture-ttl-api-free-hour";
  const response = await pricing.PATCH(
    new Request("http://localhost/api/pricing", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        openai: { [model]: { input: 2, cache_creation: 2.5, cache_creation_1h: 0 } },
      }),
    })
  );
  assert.equal(response.status, 200);
  const rates = (await response.json()).openai[model];
  assert.equal(rates.cache_creation_1h, 0);
  assert.equal(
    computeCostFromPricing(rates, {
      input: 1_000_000,
      cacheCreation: 1_000_000,
      cacheCreation5m: 0,
      cacheCreation1h: 1_000_000,
    }),
    0
  );
});
