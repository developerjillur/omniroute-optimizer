import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_PRICING } from "../../src/shared/constants/pricing/default-pricing.ts";
import {
  computeCostFromPricing,
  getCodexFastCostMultiplier,
} from "../../src/lib/usage/costCalculator.ts";

test("legacy long-context fallback rates are multiplied once and nested tiers take precedence", () => {
  const legacy = { input: 2, long_context_threshold: 10, long_context_input_multiplier: 2 };
  for (const tokens of [{ input: 20, cacheRead: 10 }, { input: 20, cacheCreation: 10 }]) {
    assert.ok(Math.abs(computeCostFromPricing(legacy, tokens) - 0.00008) < 1e-12);
  }
  const nested = { ...legacy, long_context: { threshold: 10, input: 4, cached: 2 } };
  assert.ok(Math.abs(computeCostFromPricing(nested, { input: 20, cacheRead: 10 }) - 0.00006) < 1e-12);
});

test("GPT 6.1 Sol has official API-equivalent rates for Codex base and effort aliases", () => {
  const pricing = DEFAULT_PRICING as Record<string, Record<string, Record<string, number>>>;
  for (const suffix of ["", "-low", "-medium", "-high", "-xhigh", "-max", "-ultra"]) {
    const row = pricing.cx[`gpt-6.1-sol${suffix}`];
    assert.ok(row, `missing pricing for gpt-6.1-sol${suffix}`);
    assert.equal(row.input, 2);
    assert.equal(row.output, 10);
    assert.equal(row.cached, 0.1);
    assert.equal(row.cache_creation, 2.5);
    assert.equal(
      computeCostFromPricing(
        row,
        { input: 1_000_000, output: 100_000 },
        { provider: "codex", model: "gpt-6.1-sol" }
      ),
      5.5
    );
  }
  assert.equal(pricing.openai["gpt-6.1-sol"].cached, 0.1);
});

test("GPT 6.1 Sol separates standard and long-context cache/output rates", () => {
  const row = DEFAULT_PRICING.cx["gpt-6.1-sol"];
  const standard = computeCostFromPricing(
    row,
    { input: 272_000, cacheRead: 200_000, output: 1000 },
    { provider: "codex", model: "gpt-6.1-sol" }
  );
  const long = computeCostFromPricing(
    row,
    { input: 300_000, cacheRead: 200_000, output: 1000 },
    { provider: "codex", model: "gpt-6.1-sol" }
  );
  assert.ok(Math.abs(standard - 0.174) < 1e-12);
  assert.ok(Math.abs(long - 0.455) < 1e-12);
});

test("flat-rate billing remains zero when the priced model has an API-equivalent estimate", () => {
  assert.equal(
    computeCostFromPricing(
      DEFAULT_PRICING.cx["gpt-6.1-sol"],
      { input: 400_000, cacheRead: 390_000, output: 1000 },
      { provider: "claude", model: "gpt-6.1-sol", flatRateAsZero: true }
    ),
    0
  );
});

test("GPT 6.1 Sol fast and ultrafast costs use the documented multipliers", () => {
  assert.equal(getCodexFastCostMultiplier("codex", "gpt-6.1-sol-high", "priority"), 2);
  assert.equal(getCodexFastCostMultiplier("cx", "gpt-6.1-sol", "ultrafast"), 6);
  assert.equal(getCodexFastCostMultiplier("codex", "gpt-6.1-sol", "standard"), 1);
});
