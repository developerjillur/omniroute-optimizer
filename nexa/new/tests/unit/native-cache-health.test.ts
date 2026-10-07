import { test } from "node:test";
import assert from "node:assert/strict";
import {
  summarizeNativeCacheHealth,
  nativeCacheAlerts,
  nativeApiEquivalent,
} from "../../src/lib/usage/nativeCacheHealth.ts";

test("cache share counts tokens and excludes only known first turns from rewrites", () => {
  const rows = [
    {
      model: "claude-sonnet-5-5",
      inputTokens: 30_000,
      cacheRead: 0,
      cacheCreation: 30_000,
      firstRequest: true,
    },
    {
      model: "claude-sonnet-5-5",
      inputTokens: 100_000,
      cacheRead: 99_000,
      cacheCreation: 1000,
      firstRequest: false,
    },
    {
      model: "claude-sonnet-5-5",
      inputTokens: 22_000,
      cacheRead: 1000,
      cacheCreation: 21_000,
      firstRequest: false,
    },
    { model: "claude-sonnet-5-5", inputTokens: 22_000, cacheRead: 0, cacheCreation: 22_000 },
  ];
  const m = summarizeNativeCacheHealth(rows).models[0];
  assert.equal(m.cacheReadShare, 100_000 / 174_000);
  assert.equal(m.rewriteEligibleCalls, 2);
  assert.equal(m.largeRewriteCalls, 1);
  assert.equal(m.largeRewriteShare, 0.5);
  assert.equal(m.firstRequestUnknownCalls, 1);
  assert.deepEqual(
    nativeCacheAlerts([m]).map((a) => a.reason),
    ["rewrite", "low-cache-read"]
  );
});

test("the rewrite cutoff is inclusive at 20k and read >= write is healthy", () => {
  const m = summarizeNativeCacheHealth([
    { model: "claude-opus-5-5", cacheRead: 0, cacheCreation: 19_999, firstRequest: false },
    { model: "claude-opus-5-5", cacheRead: 20_000, cacheCreation: 20_000, firstRequest: false },
    { model: "claude-opus-5-5", cacheRead: 19_999, cacheCreation: 20_000, firstRequest: false },
  ]).models[0];
  assert.equal(m.largeRewriteCalls, 1);
  assert.equal(m.largeRewriteShare, 1 / 3);
});

test("missing TTLs and contradictory counters remain unknown", () => {
  const m = summarizeNativeCacheHealth([
    {
      model: "claude-opus-5-5",
      cacheRead: 0,
      cacheCreation: 100,
      cacheCreation5m: 30,
      cacheCreation1h: 20,
    },
    {
      model: "claude-opus-5-5",
      cacheRead: 0,
      cacheCreation: 100,
      cacheCreation5m: 100,
      cacheCreation1h: 100,
    },
  ]).models[0];
  assert.equal(m.cacheCreation5mTotal, 30);
  assert.equal(m.cacheCreation1hTotal, 20);
  assert.equal(m.unknownTtlWriteTotal, 150);
  assert.equal(m.largeRewriteShare, null);
});

test("API-equivalent bounds do not double-count cache or thinking output", () => {
  const m = summarizeNativeCacheHealth([
    {
      model: "claude-opus-5-5",
      inputTokens: 1_000_000,
      outputTokens: 100_000,
      cacheRead: 800_000,
      cacheCreation: 150_000,
      cacheCreation5m: 50_000,
      cacheCreation1h: 50_000,
    },
  ]).models[0];
  const cost = nativeApiEquivalent(m, { input: 5, output: 25, cached: 0.5 });
  assert.deepEqual(cost, { lowerUsd: 4.275, upperUsd: 4.4625 });
  assert.equal(nativeApiEquivalent(m, null), null);
});

test("healthy, empty and unknown-history windows produce no invented rewrite alert", () => {
  assert.deepEqual(summarizeNativeCacheHealth([]), { models: [] });
  const m = summarizeNativeCacheHealth([
    { model: "claude-sonnet-5-5", inputTokens: 100_000, cacheRead: 99_000, cacheCreation: 1000 },
  ]).models[0];
  assert.equal(m.largeRewriteShare, null);
  assert.deepEqual(nativeCacheAlerts([m]), []);
});
