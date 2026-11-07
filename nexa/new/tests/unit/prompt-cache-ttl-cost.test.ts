import assert from "node:assert/strict";
import test from "node:test";

import { computeCostFromPricing } from "../../src/lib/usage/costCalculator.ts";

const pricing = {
  input: 2,
  output: 10,
  cached: 0.2,
  cache_creation: 2.5,
  cache_creation_1h: 4,
};

test("one-hour cache creation uses its one-hour price", () => {
  assert.equal(
    computeCostFromPricing(pricing, {
      input: 1_000_000,
      cacheCreation: 1_000_000,
      cacheCreation5m: 0,
      cacheCreation1h: 1_000_000,
    }),
    4
  );
});

test("mixed cache TTLs are priced separately without adding their tokens twice", () => {
  assert.equal(
    computeCostFromPricing(pricing, {
      input: 1_000_000,
      cacheCreation: 1_000_000,
      cacheCreation5m: 500_000,
      cacheCreation1h: 500_000,
    }),
    3.25
  );
});

test("five-minute cache creation preserves the existing write price", () => {
  assert.equal(
    computeCostFromPricing(pricing, {
      input: 1_000_000,
      cacheCreation: 1_000_000,
      cacheCreation5m: 1_000_000,
      cacheCreation1h: 0,
    }),
    2.5
  );
});

test("historical usage without a TTL split retains the legacy estimate", () => {
  assert.equal(
    computeCostFromPricing(pricing, { input: 1_000_000, cacheCreation: 1_000_000 }),
    2.5
  );
});

test("unclassified writes retain the legacy rate instead of being invented as one-hour writes", () => {
  assert.ok(
    Math.abs(
      computeCostFromPricing(pricing, {
        input: 1_000_000,
        cacheCreation: 1_000_000,
        cacheCreation5m: 600_000,
        cacheCreation1h: 300_000,
      }) - 2.95
    ) < 1e-12
  );
});

test("cache reads, fresh input and reasoning-inclusive output remain disjoint", () => {
  assert.ok(
    Math.abs(
      computeCostFromPricing(pricing, {
        input: 2_000_000,
        cacheRead: 1_000_000,
        cacheCreation: 500_000,
        cacheCreation5m: 300_000,
        cacheCreation1h: 200_000,
        output: 500,
        reasoning: 300,
      }) - 2.755
    ) < 1e-12
  );
});

test("an explicit zero one-hour price remains zero", () => {
  assert.equal(
    computeCostFromPricing(
      { ...pricing, cache_creation_1h: 0 },
      { input: 1_000_000, cacheCreation: 1_000_000, cacheCreation1h: 1_000_000 }
    ),
    0
  );
});

test("a flat-rate billing surface remains zero when TTL detail is available", () => {
  assert.equal(
    computeCostFromPricing(
      pricing,
      { input: 1_000_000, cacheCreation: 1_000_000, cacheCreation1h: 1_000_000 },
      { provider: "claude", flatRateAsZero: true }
    ),
    0
  );
});

test("native Claude aliases derive a missing one-hour rate from their configured input price", () => {
  const { cache_creation_1h: _hour, ...legacyPricing } = pricing;
  for (const provider of ["claude", "cc", "anthropic"]) {
    assert.equal(
      computeCostFromPricing(
        legacyPricing,
        { input: 1_000_000, cacheCreation: 1_000_000, cacheCreation1h: 1_000_000 },
        { provider }
      ),
      4
    );
  }
});

test("other providers keep the legacy fallback when no one-hour price is configured", () => {
  const { cache_creation_1h: _hour, ...legacyPricing } = pricing;
  assert.equal(
    computeCostFromPricing(
      legacyPricing,
      { input: 1_000_000, cacheCreation: 1_000_000, cacheCreation1h: 1_000_000 },
      { provider: "fixture-provider" }
    ),
    2.5
  );
});

test("a contradictory TTL split cannot manufacture additional cache-write cost", () => {
  assert.equal(
    computeCostFromPricing(pricing, {
      input: 1_000_000,
      cacheCreation: 1_000_000,
      cacheCreation5m: 600_000,
      cacheCreation1h: 600_000,
    }),
    2.5
  );
});

test("nullable historical detail remains an unknown-TTL legacy estimate", () => {
  assert.equal(
    computeCostFromPricing(pricing, {
      input: 1_000_000,
      cacheCreation: 1_000_000,
      cacheCreation5m: null,
      cacheCreation1h: null,
    }),
    2.5
  );
});

test("one-hour write pricing retains the request's long-context input multiplier", () => {
  assert.equal(
    computeCostFromPricing(
      { ...pricing, long_context_threshold: 100, long_context_input_multiplier: 2 },
      { input: 1_000_000, cacheCreation: 1_000_000, cacheCreation1h: 1_000_000 }
    ),
    8
  );
});

test("an exact provider cost still takes precedence over all TTL estimates", () => {
  assert.equal(
    computeCostFromPricing(
      pricing,
      {
        input: 1_000_000,
        cacheCreation: 1_000_000,
        cacheCreation1h: 1_000_000,
        cost_in_usd_ticks: 10_000_000_000,
      },
      { provider: "xai" }
    ),
    1
  );
});
