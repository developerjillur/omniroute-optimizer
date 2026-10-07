import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "google-account-routing-"));
process.env.DATA_DIR = dataDir;
process.env.MITM_AUTO_RECOVER = "false";

const core = await import("../../src/lib/db/core.ts");
const providers = await import("../../src/lib/db/providers.ts");
const settings = await import("../../src/lib/db/settings.ts");
const affinity = await import("../../src/lib/db/sessionAccountAffinity.ts");
const { getProviderCredentials, markAccountUnavailable } =
  await import("../../src/sse/services/auth.ts");
const { setGoogleAccountVerification, getGoogleAccountVerificationSnapshot } =
  await import("../../src/sse/services/googleAccountVerification.ts");
const { hasGoogleVerificationBlock, googleVerificationObservedAt, googleVerificationData } =
  await import("../../src/lib/providers/googleAccountHealth.ts");
const {
  runWithModelTestScope,
  getModelTestConnectionId,
  createModelTestScope,
  recordModelTestSelection,
} = await import("../../src/lib/api/modelTestScope.ts");
const { invalidateDbCache } = await import("../../src/lib/db/readCache.ts");

test.after(() => {
  core.resetDbInstance();
  assert.equal(fs.lstatSync(dataDir).isSymbolicLink(), false);
  console.info("Removing isolated test data", {
    directory: dataDir,
    entries: fs.readdirSync(dataDir),
  });
  fs.rmSync(dataDir, { recursive: true, force: true });
});

async function create(provider: string, email: string, priority = 1): Promise<string> {
  const row = await providers.createProviderConnection({
    provider,
    email,
    priority,
    authType: provider === "openai" ? "apikey" : "oauth",
    name: "routing regression",
    isActive: true,
    testStatus: "active",
    apiKey: "fixture-key",
    accessToken: "fixture-token",
    refreshToken: "fixture-refresh",
    expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    providerSpecificData: { projectId: "fixture-project" },
  });
  return String(row.id);
}

test("model test scope is isolated between concurrent tests and normal requests", async () => {
  await Promise.all(
    ["account-a", "account-b"].map((connectionId) =>
      runWithModelTestScope(connectionId, async () => {
        await new Promise((resolve) => setImmediate(resolve));
        assert.equal(getModelTestConnectionId(), connectionId);
      })
    )
  );
  assert.equal(getModelTestConnectionId(), null);
});

test("a model test shares selection with its consumer and rejects a different account", async () => {
  const scope = createModelTestScope("account-a");
  await runWithModelTestScope(scope, async () => {
    recordModelTestSelection("account-a");
    assert.throws(() => recordModelTestSelection("account-b"), /unexpected connection/);
  });
  assert.equal(scope.selectedConnectionId, "account-a");
  await runWithModelTestScope(scope, async () => {
    assert.equal(getModelTestConnectionId(), "account-a");
    assert.equal(scope.selectedConnectionId, "account-a");
  });
  assert.equal(getModelTestConnectionId(), null);
});

test("a model test cannot be redirected to a healthy session-affinity sibling", async () => {
  const selected = await create("openai", "probe-a@example.test");
  const sibling = await create("openai", "probe-b@example.test", 2);
  const sessionKey = "header:regression-model-test";
  affinity.upsertSessionAccountAffinity(sessionKey, "openai", sibling, Date.now(), 3600_000);
  invalidateDbCache("connections");
  const options = { forcedConnectionId: selected, sessionKey, sessionAffinityTtlMs: 3600_000 };
  const normal = await getProviderCredentials(
    "openai",
    null,
    [selected, sibling],
    "gpt-4o",
    options
  );
  assert.ok(normal && "connectionId" in normal);
  assert.equal(normal.connectionId, sibling, "normal session affinity is preserved");
  const probe = await runWithModelTestScope(selected, () =>
    getProviderCredentials("openai", null, [selected, sibling], "gpt-4o", options)
  );
  assert.ok(probe && "connectionId" in probe);
  assert.equal(probe.connectionId, selected, "the requested account must actually be selected");
  const excluded = await runWithModelTestScope(selected, () =>
    getProviderCredentials("openai", selected, [selected, sibling], "gpt-4o", options)
  );
  if (excluded && "connectionId" in excluded)
    assert.notEqual(excluded.connectionId, sibling, "a failed probe must not retry a sibling");
});

test("verification survives token renewal and normal routing skips paired Google identities", async () => {
  await settings.updateSettings({
    resilience: { quotaPreflight: { cachedQuotaFilteringEnabled: false } },
  });
  for (const count of [2, 3, 5]) {
    const email = `challenge-${count}@example.test`;
    const challenged = await create("agy", email);
    const paired = await create("antigravity", email, 2);
    const healthy: string[] = [];
    for (let i = 0; i < count - 1; i++)
      healthy.push(await create("agy", `healthy-${count}-${i}@example.test`, i + 3));
    const failure = await markAccountUnavailable(
      challenged,
      403,
      "Verify your account to continue",
      "antigravity",
      "gemini-3.8-flash-low"
    );
    assert.equal(failure.shouldFallback, true);
    for (const id of [challenged, paired]) {
      await providers.updateProviderConnection(id, {
        accessToken: "renewed-fixture-token",
        preserveHealthOnTokenRefresh: true,
        testStatus: "active",
        lastError: null,
        errorCode: null,
        lastErrorType: null,
      });
      assert.equal(hasGoogleVerificationBlock(await providers.getProviderConnectionById(id)), true);
    }
    const selected = await getProviderCredentials(
      "antigravity",
      null,
      [challenged, paired, ...healthy],
      "gemini-3.8-flash-low"
    );
    assert.ok(selected && "connectionId" in selected);
    assert.ok(
      healthy.includes(String(selected.connectionId)),
      `${count} account pool must choose a healthy identity`
    );
    const allBlocked = await getProviderCredentials(
      "antigravity",
      null,
      [challenged, paired],
      "gemini-3.8-flash-low"
    );
    assert.ok(allBlocked && "lastErrorCode" in allBlocked && "retryAfterHuman" in allBlocked);
    assert.equal(
      allBlocked.lastErrorCode,
      403,
      "verification must not be mislabeled as exhausted quota"
    );
    assert.equal(allBlocked.retryAfterHuman, undefined, "verification has no timed quota reset");
    const challengeRow = await providers.getProviderConnectionById(challenged);
    await setGoogleAccountVerification(
      challenged,
      false,
      googleVerificationObservedAt(challengeRow)
    );
    assert.equal(
      hasGoogleVerificationBlock(await providers.getProviderConnectionById(challenged)),
      false
    );
    assert.equal(
      hasGoogleVerificationBlock(await providers.getProviderConnectionById(paired)),
      false
    );
  }
});

test("Retest recovers unequal paired barriers while retaining operator disable and newer challenges", async () => {
  const first = await create("agy", "paired-retest@example.test");
  const second = await create("antigravity", "paired-retest@example.test");
  await providers.updateProviderConnection(first, {
    isActive: false,
    providerSpecificData: googleVerificationData(
      { provider: "agy" },
      true,
      "2026-10-06T12:00:00.000Z"
    ),
  });
  await providers.updateProviderConnection(second, {
    providerSpecificData: googleVerificationData(
      { provider: "antigravity" },
      true,
      "2026-10-06T12:01:00.000Z"
    ),
  });
  const snapshot = await getGoogleAccountVerificationSnapshot(first);
  await setGoogleAccountVerification(first, false, snapshot[first], snapshot);
  assert.equal(hasGoogleVerificationBlock(await providers.getProviderConnectionById(first)), false);
  assert.equal(
    hasGoogleVerificationBlock(await providers.getProviderConnectionById(second)),
    false
  );
  assert.equal((await providers.getProviderConnectionById(first)).isActive, false);
  await setGoogleAccountVerification(first, true);
  const beforeProbe = await getGoogleAccountVerificationSnapshot(first);
  await providers.updateProviderConnection(second, {
    providerSpecificData: googleVerificationData(
      { provider: "antigravity" },
      true,
      "2099-01-01T00:00:00.000Z"
    ),
  });
  await setGoogleAccountVerification(first, false, beforeProbe[first], beforeProbe);
  assert.equal(hasGoogleVerificationBlock(await providers.getProviderConnectionById(first)), false);
  assert.equal(
    hasGoogleVerificationBlock(await providers.getProviderConnectionById(second)),
    true,
    "a challenge recorded after the probe started must survive its successful response"
  );
});
