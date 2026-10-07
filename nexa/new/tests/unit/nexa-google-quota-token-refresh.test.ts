import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "google-quota-refresh-"));
process.env.DATA_DIR = dataDir;
process.env.MITM_AUTO_RECOVER = "false";
const core = await import("../../src/lib/db/core.ts");
const providers = await import("../../src/lib/db/providers.ts");
const { getQuotaUsageWithRefreshedToken } = await import("../../src/domain/quotaAccountRefresh.ts");
const { googleVerificationData, hasGoogleVerificationBlock, GOOGLE_VERIFICATION_MESSAGE } =
  await import("../../src/lib/providers/googleAccountHealth.ts");
const originalFetch = globalThis.fetch;

test.after(() => {
  globalThis.fetch = originalFetch;
  core.resetDbInstance();
  assert.equal(fs.lstatSync(dataDir).isSymbolicLink(), false);
  console.info("Removing isolated test data", {
    directory: dataDir,
    entries: fs.readdirSync(dataDir),
  });
  fs.rmSync(dataDir, { recursive: true, force: true });
});

for (const provider of ["agy", "antigravity"]) {
  test(`${provider} background quota polling renews expired credentials without erasing verification`, async () => {
    const row = await providers.createProviderConnection({
      provider,
      authType: "oauth",
      name: "quota renewal regression",
      email: `${provider}@example.test`,
      isActive: true,
      testStatus: "unavailable",
      errorCode: 403,
      lastError: GOOGLE_VERIFICATION_MESSAGE,
      lastErrorType: "project_route_error",
      accessToken: `expired-${provider}`,
      refreshToken: `refresh-${provider}`,
      expiresAt: new Date(Date.now() - 60_000).toISOString(),
      providerSpecificData: googleVerificationData({ provider }, true),
    });
    const usageTokens: string[] = [];
    let renewals = 0;
    globalThis.fetch = async (url, options: RequestInit = {}) => {
      if (String(url).includes("/token")) {
        renewals++;
        return Response.json({ access_token: `fresh-${provider}`, expires_in: 3600 });
      }
      const authorization = new Headers(options.headers).get("Authorization");
      if (authorization) usageTokens.push(authorization);
      return Response.json({
        models: {},
        currentTier: { id: "standard-tier" },
        cloudaicompanionProject: "fixture-project",
      });
    };
    try {
      await getQuotaUsageWithRefreshedToken(row);
      assert.equal(renewals, 1);
      assert.ok(usageTokens.length > 0, "quota polling must actually fetch usage");
      assert.ok(
        usageTokens.every((token) => token === `Bearer fresh-${provider}`),
        "no stale token may reach the usage API"
      );
      const stored = await providers.getProviderConnectionById(String(row.id));
      assert.equal(stored.accessToken, `fresh-${provider}`);
      assert.equal(hasGoogleVerificationBlock(stored), true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
}
