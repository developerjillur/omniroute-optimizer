import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "pricing-alias-defaults-"));
process.env.DISABLE_SQLITE_AUTO_BACKUP = "true";

const core = await import("../../../src/lib/db/core.ts");
const pricing = await import("../../../src/lib/db/settings/pricing.ts");

test.after(() => core.resetDbInstance());

test("a canonical-provider override keeps unrelated alias defaults available", async () => {
  const expected = await pricing.getPricingForModel("cc", "claude-fable-5-1");
  assert.ok(expected);
  await pricing.updatePricing({
    claude: { "fixture-canonical-only": { input: 2, output: 10, cached: 0.2 } },
  });

  assert.deepEqual(await pricing.getPricingForModel("claude", "claude-fable-5-1"), expected);
});

test("alias requests can find models configured only under the canonical provider", async () => {
  const expected = { input: 2, output: 10, cached: 0.2 };
  await pricing.updatePricing({ claude: { "fixture-canonical-only": expected } });
  assert.deepEqual(await pricing.getPricingForModel("cc", "fixture-canonical-only"), expected);
});

test("an exact provider and model override retains precedence", async () => {
  const direct = { input: 7, output: 11, cached: 0 };
  const alias = { input: 9, output: 13, cached: 1 };
  await pricing.updatePricing({
    claude: { "fixture-explicit-precedence": direct },
    cc: { "fixture-explicit-precedence": alias },
  });

  assert.deepEqual(
    await pricing.getPricingForModel("claude", "fixture-explicit-precedence"),
    direct
  );
  assert.deepEqual(await pricing.getPricingForModel("cc", "fixture-explicit-precedence"), alias);
});

test("alias fallback retains case-insensitive and dotted-model matching", async () => {
  const expected = { input: 3, output: 15 };
  await pricing.updatePricing({ cc: { "fixture-alias-1-2": expected } });
  assert.deepEqual(await pricing.getPricingForModel("CLAUDE", "FIXTURE-ALIAS-1.2"), expected);
});

test("an unrelated provider's model does not become an alias fallback", async () => {
  await pricing.updatePricing({ anthropic: { "fixture-api-only": { input: 1, output: 2 } } });
  assert.equal(await pricing.getPricingForModel("claude", "fixture-api-only"), null);
});

test("a model missing from every equivalent namespace remains unpriced", async () => {
  assert.equal(await pricing.getPricingForModel("claude", "fixture-missing-everywhere"), null);
});

test("regional fallback still applies only when the requested namespace is absent", async () => {
  const expected = { input: 4, output: 8 };
  await pricing.updatePricing({ "fixture-region": { "fixture-regional-model": expected } });
  assert.deepEqual(
    await pricing.getPricingForModel("fixture-region-cn", "fixture-regional-model"),
    expected
  );
  await pricing.updatePricing({
    "fixture-region-cn": { "fixture-explicit-regional-model": { input: 1, output: 2 } },
  });
  assert.equal(
    await pricing.getPricingForModel("fixture-region-cn", "fixture-regional-model"),
    null
  );
});
