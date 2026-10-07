import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const data = fs.mkdtempSync(path.join(os.tmpdir(), "claude-quota-alert-"));
process.env.DATA_DIR = data;
process.env.API_KEY_SECRET = "quota-alert-regression-secret";
const core = await import("../../src/lib/db/core.ts");
const quota = await import("../../src/domain/quotaCache.ts");
const schedule = await import("../../src/domain/claudeQuotaSchedule.ts");
const providers = await import("../../src/lib/db/providers.ts");
const settings = await import("../../src/lib/db/settings.ts");
const auth = await import("../../src/sse/services/auth.ts");
const { normalizeClaudeUsageQuotas } = await import("../../open-sse/services/usage/claudeQuota.ts");

function observe(id: string, percent: number, kind = "weekly_all") {
  const reset = new Date(Date.now() + 3 * 60 * 60_000).toISOString();
  const usage = normalizeClaudeUsageQuotas({
    limits: [
      {
        kind,
        percent,
        resets_at: reset,
        is_active: true,
        severity: "critical",
        ...(kind === "weekly_scoped" ? { scope: { model: { display_name: "Fable" } } } : {}),
      },
    ],
  });
  quota.setQuotaCache(id, "claude", usage.quotas, usage.modelQuotas);
  return quota.getQuotaCache(id)!;
}

test.beforeEach(() => quota.__clearForTests());
test.after(() => {
  quota.stopBackgroundRefresh();
  core.resetDbInstance();
  fs.rmSync(data, { recursive: true, force: true });
});

test("critical usage alerts with remaining quota do not block Claude dispatch", () => {
  for (const used of [90, 99, 99.9]) {
    const id = `alert-${used}`;
    observe(id, used);
    assert.equal(quota.isQuotaExhaustedForRequest(id, "claude", "claude-opus-5-5"), false);
  }
});

test("an active critical alert is refreshed normally instead of parked until reset", () => {
  const entry = observe("refresh-alert", 90);
  assert.equal(schedule.getClaudeQuotaSchedule(entry), null);
  assert.equal(entry.nextResetAt, null);
  assert.equal(schedule.shouldRefreshQuotaEntry(entry, entry.fetchedAt + 300_000), true);
});

test("a genuinely exhausted window still parks at the provider reset", () => {
  const entry = observe("exhausted", 100);
  assert.equal(quota.isQuotaExhaustedForRequest("exhausted", "claude", "claude-opus-5-5"), true);
  assert.equal(schedule.getClaudeQuotaSchedule(entry)?.checkAt, Date.parse(entry.nextResetAt!));
  assert.equal(schedule.shouldRefreshQuotaEntry(entry, entry.fetchedAt + 300_000), false);
});

test("model-scoped critical alerts allow the same model while quota remains", () => {
  observe("scoped-alert", 90, "weekly_scoped");
  assert.equal(
    quota.isQuotaExhaustedForRequest("scoped-alert", "claude", "claude-fable-5-1"),
    false
  );
  assert.equal(
    quota.isQuotaExhaustedForRequest("scoped-alert", "claude", "claude-opus-5-5"),
    false
  );
});

test("restart hydration retains available quota despite a critical severity label", () => {
  observe("restart-alert", 90);
  quota.__clearForTests();
  assert.equal(
    quota.isQuotaExhaustedForRequest("restart-alert", "claude", "claude-opus-5-5"),
    false
  );
  assert.equal(quota.getQuotaCache("restart-alert")?.nextResetAt, null);
});

test("parallel credential selections skip a depleted account and keep the critical alert usable", async () => {
  await settings.updateSettings({
    resilienceSettings: {
      quotaPreflight: {
        enabled: false,
        cachedQuotaFilteringEnabled: true,
        defaultThresholdPercent: 0,
      },
    },
  });
  const exhausted = await providers.createProviderConnection({
    provider: "claude",
    authType: "apikey",
    name: "depleted",
    apiKey: "test-a",
    isActive: true,
    priority: 1,
    providerSpecificData: { disableCooling: true },
  });
  const available = await providers.createProviderConnection({
    provider: "claude",
    authType: "apikey",
    name: "critical-available",
    apiKey: "test-b",
    isActive: true,
    priority: 2,
    providerSpecificData: { disableCooling: true },
  });
  assert.equal(typeof exhausted.id, "string");
  assert.equal(typeof available.id, "string");
  const exhaustedId = exhausted.id as string;
  const availableId = available.id as string;
  observe(exhaustedId, 100);
  observe(availableId, 90);
  const selected = await Promise.all(
    Array.from({ length: 20 }, () =>
      auth.getProviderCredentials("claude", null, [exhaustedId, availableId], "claude-opus-5-5", {
        bypassQuotaPolicy: true,
      })
    )
  );
  assert.ok(
    selected.every(
      (result) => result && "connectionId" in result && result.connectionId === availableId
    )
  );
});
