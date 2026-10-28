import assert from "node:assert/strict";
import test from "node:test";
import {
  requestQueueSettingsSchema,
  updateResilienceSchema,
  waitForCooldownSettingsSchema,
} from "../../src/shared/validation/schemas/settings.ts";
import {
  normalizeRequestQueueSettings,
  normalizeWaitForCooldownSettings,
} from "../../src/lib/resilience/settings/normalize.ts";

const queueDefaults = {
  autoEnableApiKeyProviders: false,
  requestsPerMinute: 60,
  minTimeBetweenRequestsMs: 0,
  concurrentRequests: 1,
  globalConcurrentRequests: 0,
  maxWaitMs: 0,
  executionMaxWaitMs: 120_000,
  maxQueueDepth: 0,
};
const waitDefaults = {
  enabled: true,
  maxRetries: 3,
  maxRetryWaitSec: 60,
  maxRetryWaitMs: 60_000,
  budgetMs: 120_000,
};

test("resilience schema accepts the existing global concurrency contract", () => {
  for (const globalConcurrentRequests of [0, 1, 100_000]) {
    const input = { globalConcurrentRequests, maxWaitMs: 0 };
    assert.deepEqual(requestQueueSettingsSchema.parse(input), input);
    const normalized = normalizeRequestQueueSettings(input, queueDefaults);
    assert.equal(normalized.globalConcurrentRequests, globalConcurrentRequests);
    assert.equal(normalized.maxWaitMs, 0);
  }
});

test("resilience budgetMs survives a complete settings payload", () => {
  const input = {
    requestQueue: { globalConcurrentRequests: 0, maxWaitMs: 0 },
    waitForCooldown: { enabled: true, maxRetries: 3, maxRetryWaitSec: 30, budgetMs: 90_000 },
  };
  const parsed = updateResilienceSchema.safeParse(input);
  assert.ok(parsed.success, "budgetMs must be accepted with the normal settings payload");
  assert.deepEqual(parsed.data, input);
});

test("resilience budgetMs follows runtime floors and the five-minute ceiling", () => {
  for (const budgetMs of [0, 60_000, 300_000]) {
    const parsed = waitForCooldownSettingsSchema.safeParse({ budgetMs });
    assert.ok(parsed.success, "budgetMs must reach its existing runtime normalizer");
    assert.equal(parsed.data.budgetMs, budgetMs);
    const normalized = normalizeWaitForCooldownSettings(parsed.data, waitDefaults);
    assert.equal(normalized.budgetMs, Math.max(60_000, budgetMs));
    assert.deepEqual(normalizeWaitForCooldownSettings(normalized, waitDefaults), normalized);
  }
});

test("resilience schema rejects invalid budgetMs without coercion", () => {
  for (const budgetMs of [-1, 300_001, 0.5, "10", null, Number.NaN, Infinity]) {
    assert.equal(waitForCooldownSettingsSchema.safeParse({ budgetMs }).success, false);
  }
});

test("resilience schema retains concurrency bounds and strict unknown-key rejection", () => {
  for (const globalConcurrentRequests of [-1, 100_001, 0.5, "10", null, Number.NaN, Infinity]) {
    assert.equal(requestQueueSettingsSchema.safeParse({ globalConcurrentRequests }).success, false);
  }
  assert.equal(requestQueueSettingsSchema.safeParse({ unknownQueueSetting: 1 }).success, false);
  assert.equal(waitForCooldownSettingsSchema.safeParse({ budget_ms: 1000 }).success, false);
  assert.equal(updateResilienceSchema.safeParse({ unknownSection: {} }).success, false);
});

test("omitted resilience settings retain the current runtime defaults", () => {
  assert.deepEqual(updateResilienceSchema.parse({}), {});
  assert.deepEqual(normalizeRequestQueueSettings({}, queueDefaults), queueDefaults);
  assert.deepEqual(normalizeWaitForCooldownSettings({}, waitDefaults), waitDefaults);
});
