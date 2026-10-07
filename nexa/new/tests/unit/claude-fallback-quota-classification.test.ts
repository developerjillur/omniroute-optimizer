import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const data = fs.mkdtempSync(path.join(os.tmpdir(), "claude-fallback-quota-"));
process.env.DATA_DIR = data;
process.env.API_KEY_SECRET = "isolated-fallback-test-key";
const core = await import("../../src/lib/db/core.ts");
const quota = await import("../../src/domain/quotaCache.ts");
const providers = await import("../../src/lib/db/providers.ts");
const settings = await import("../../src/lib/db/settings.ts");
const resilience = await import("../../src/lib/resilience/settings.ts");
const auth = await import("../../src/sse/services/auth.ts");
const helpers = await import("../../src/sse/handlers/chatHelpers.ts");
const { normalizeClaudeUsageQuotas } = await import("../../open-sse/services/usage/claudeQuota.ts");
let connectionSequence = 0;

test.before(async () => {
  await settings.updateSettings({
    resilienceSettings: resilience.mergeResilienceSettings(
      resilience.resolveResilienceSettings({}),
      { quotaPreflight: { enabled: false, cachedQuotaFilteringEnabled: true } }
    ),
  });
});
test.beforeEach(() => quota.__clearForTests());
test.after(() => {
  quota.stopBackgroundRefresh();
  core.resetDbInstance();
  fs.rmSync(data, { recursive: true, force: true });
});

async function connection(remaining: number, resetDelayMs = 3 * 86400000) {
  const row = await providers.createProviderConnection({
    provider: "claude",
    authType: "apikey",
    apiKey: `isolated-test-credential-${++connectionSequence}`,
    name: `quota-${remaining ? "available" : "exhausted"}-${connectionSequence}`,
    isActive: true,
    providerSpecificData: { disableCooling: true, blockExtraUsage: true },
  });
  const id = String(row.id);
  const resetAt = new Date(Date.now() + resetDelayMs).toISOString();
  const usage = normalizeClaudeUsageQuotas({
    limits: [
      {
        kind: "weekly_all",
        percent: 100 - remaining,
        resets_at: resetAt,
        is_active: remaining === 0,
        severity: remaining === 0 ? "critical" : "normal",
      },
    ],
  });
  quota.setQuotaCache(id, "claude", usage.quotas, usage.modelQuotas);
  return { id, resetAt };
}

for (const size of [2, 3, 5]) {
  for (const status of [502, 520]) {
    test(`${size} accounts: an excluded available account preserves upstream ${status}`, async () => {
      const walls = [];
      for (let index = 0; index < size - 1; index++) walls.push(await connection(0));
      const available = await connection(90);
      const credentials = await auth.getProviderCredentials(
        "claude",
        available.id,
        [...walls.map((wall) => wall.id), available.id],
        "claude-opus-5-5",
        { bypassQuotaPolicy: true, excludeConnectionIds: [available.id] }
      );
      assert.equal(credentials, null, "fallback exclusion is not evidence of quota exhaustion");
      const original = `Transient upstream ${status}`;
      const response = helpers.handleNoCredentials(
        credentials,
        available.id,
        "claude",
        "claude-opus-5-5",
        original,
        status
      );
      assert.equal(response.status, status);
      const body = JSON.stringify(await response.json());
      assert.ok(body.includes(original));
      assert.ok(!body.includes("exhausted their quota"));
      assert.equal(
        quota.isQuotaExhaustedForRequest(available.id, "claude", "claude-opus-5-5"),
        false
      );
      assert.ok(
        walls.every((wall) =>
          quota.isQuotaExhaustedForRequest(wall.id, "claude", "claude-opus-5-5")
        )
      );
    });
  }

  test(`${size} accounts: concurrent sessions keep the remaining account usable`, async () => {
    const walls = [];
    for (let index = 0; index < size - 1; index++) walls.push(await connection(0));
    const available = await connection(1);
    const pool = [...walls.map((wall) => wall.id), available.id];
    assert.equal(new Set(pool).size, size, "the fixture must contain distinct accounts");
    const selected = await Promise.all(
      Array.from({ length: 20 }, () =>
        auth.getProviderCredentials("claude", null, pool, "claude-opus-5-5", {
          bypassQuotaPolicy: true,
          forcedConnectionId: walls[0].id,
        })
      )
    );
    assert.ok(
      selected.every(
        (result) => result && "connectionId" in result && result.connectionId === available.id
      )
    );
    for (const account of [...walls, available]) {
      assert.equal((await providers.getProviderConnectionById(account.id)).isActive, true);
    }
  });

  test(`${size} accounts: exhausted pool retains the earliest reset and recovers on fresh evidence`, async () => {
    const accounts = [];
    for (let index = 0; index < size; index++)
      accounts.push(await connection(0, (index + 1) * 86400000));
    const pool = accounts.map((account) => account.id);
    assert.equal(new Set(pool).size, size);
    const options = { bypassQuotaPolicy: true };
    const blocked = await auth.getProviderCredentials(
      "claude",
      null,
      pool,
      "claude-opus-5-5",
      options
    );
    assert.ok(blocked && "allRateLimited" in blocked && blocked.allRateLimited);
    assert.equal(blocked.retryAfter, accounts[0].resetAt);

    // Fresh quota, rather than merely a passed clock deadline, restores eligibility.
    const recoveredId = accounts[size - 1].id;
    quota.setQuotaCache(recoveredId, "claude", {
      "weekly (7d)": {
        remainingPercentage: 80,
        resetAt: accounts[size - 1].resetAt,
        claudeQuota: {
          kind: "weekly_all",
          active: false,
          severity: "normal",
          scopeKey: null,
          modelId: null,
          modelDisplayName: null,
        },
      },
    });
    const recovered = await auth.getProviderCredentials(
      "claude",
      null,
      pool,
      "claude-opus-5-5",
      options
    );
    assert.ok(recovered && "connectionId" in recovered);
    assert.equal(recovered.connectionId, recoveredId);
    assert.equal((await providers.getProviderConnectionById(recoveredId)).isActive, true);
  });

  if (size > 2) {
    test(`${size} accounts: fallback can select another available sibling`, async () => {
      const pool = [];
      for (let index = 0; index < size - 2; index++) pool.push(await connection(0));
      const failed = await connection(60);
      const sibling = await connection(40);
      const result = await auth.getProviderCredentials(
        "claude",
        failed.id,
        [...pool.map((account) => account.id), failed.id, sibling.id],
        "claude-opus-5-5",
        { bypassQuotaPolicy: true }
      );
      assert.ok(result && "connectionId" in result);
      assert.equal(result.connectionId, sibling.id);
    });
  }
}

test("parallel fallback selections do not park an available sibling", async () => {
  const wall = await connection(0);
  const available = await connection(90);
  const pool = [wall.id, available.id];
  const results = await Promise.all(
    Array.from({ length: 12 }, () =>
      auth.getProviderCredentials("claude", available.id, pool, "claude-opus-5-5", {
        bypassQuotaPolicy: true,
      })
    )
  );
  assert.ok(results.every((result) => result === null));
  const next = await auth.getProviderCredentials("claude", null, pool, "claude-opus-5-5", {
    bypassQuotaPolicy: true,
  });
  assert.ok(next && "connectionId" in next);
  assert.equal(next.connectionId, available.id);
  assert.equal((await providers.getProviderConnectionById(available.id)).isActive, true);
});

test("genuine exhaustion retains the provider reset when every account is exhausted", async () => {
  const first = await connection(0);
  const second = await connection(0);
  const result = await auth.getProviderCredentials(
    "claude",
    null,
    [first.id, second.id],
    "claude-opus-5-5",
    { bypassQuotaPolicy: true }
  );
  assert.ok(result && "allRateLimited" in result && result.allRateLimited);
  assert.equal(result.lastErrorCode, 429);
  assert.ok([first.resetAt, second.resetAt].includes(result.retryAfter));
});

test("an excluded account outside the allowed pool cannot bypass genuine exhaustion", async () => {
  const wall = await connection(0);
  const other = await connection(90);
  const result = await auth.getProviderCredentials(
    "claude",
    other.id,
    [wall.id],
    "claude-opus-5-5",
    {
      bypassQuotaPolicy: true,
    }
  );
  assert.ok(result && "allRateLimited" in result && result.allRateLimited);
  assert.equal(result.lastErrorCode, 429);
});
