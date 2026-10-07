import test from "node:test";
import assert from "node:assert/strict";
import { shouldSkipCredentialRefresh } from "../../open-sse/handlers/chatCore/skipCredentialRefresh.ts";
import {
  GOOGLE_VERIFICATION_KEY,
  GOOGLE_VERIFICATION_MESSAGE,
  googleAccountIdentity,
  googleVerificationBlockedIdentities,
  googleVerificationData,
  hasGoogleVerificationBlock,
  isGoogleVerificationFailure,
  prepareTokenRefreshUpdate,
} from "../../src/lib/providers/googleAccountHealth.ts";

const account = {
  id: "google-a",
  provider: "antigravity",
  email: "person@example.test",
  isActive: true,
};
const challenge = {
  ...account,
  testStatus: "unavailable",
  errorCode: 403,
  lastError: GOOGLE_VERIFICATION_MESSAGE,
  lastErrorType: "project_route_error",
  providerSpecificData: googleVerificationData(account, true, "2026-10-06T12:00:00.000Z"),
};
const refresh = {
  preserveHealthOnTokenRefresh: true,
  accessToken: "fresh-test-token",
  expiresAt: "2026-10-06T14:00:00.000Z",
  tokenExpiresAt: "2026-10-06T14:00:00.000Z",
  testStatus: "active",
  lastError: null,
  lastErrorType: null,
  errorCode: null,
};

test("Google verification 403 skips OAuth retry and leaves the original response readable", async () => {
  const body = JSON.stringify({
    error: { message: "Verify your account to continue", status: "VALIDATION_REQUIRED" },
  });
  for (const provider of ["antigravity", "agy"]) {
    const response = new Response(body, { status: 403 });
    assert.equal(await shouldSkipCredentialRefresh(provider, response), true);
    assert.equal(await response.text(), body);
  }
});

test("real 401s and other providers retain their credential refresh path", async () => {
  assert.equal(
    await shouldSkipCredentialRefresh(
      "antigravity",
      new Response("invalid token", { status: 401 })
    ),
    false
  );
  assert.equal(
    await shouldSkipCredentialRefresh(
      "antigravity",
      new Response("Access denied", { status: 403 })
    ),
    false
  );
  assert.equal(
    await shouldSkipCredentialRefresh(
      "claude",
      new Response("Verify your account to continue", { status: 403 })
    ),
    false
  );
  assert.equal(isGoogleVerificationFailure("agy", 403, '{"reason":"validation_required"}'), true);
  assert.equal(isGoogleVerificationFailure("agy", 429, "Quota exhausted"), false);
});

test("OAuth renewal updates expiry while retaining a pending Google verification barrier", () => {
  const updates = prepareTokenRefreshUpdate(challenge, {
    ...refresh,
    providerSpecificData: { projectId: "test-project" },
  });
  const stored = { ...challenge, ...updates };
  assert.equal(stored.testStatus, "unavailable");
  assert.equal(stored.errorCode, 403);
  assert.equal(stored.lastError, GOOGLE_VERIFICATION_MESSAGE);
  assert.equal(updates.tokenExpiresAt, refresh.tokenExpiresAt);
  assert.equal(hasGoogleVerificationBlock(stored), true);
  assert.equal(updates.preserveHealthOnTokenRefresh, undefined);
});

test("a stale refresh result cannot overwrite a newer challenge or operator disable", () => {
  const existing = {
    ...challenge,
    isActive: false,
    providerSpecificData: {
      ...challenge.providerSpecificData,
      operatorDisabledAt: "2026-10-06T12:01:00Z",
    },
  };
  const updates = prepareTokenRefreshUpdate(existing, {
    ...refresh,
    isActive: true,
    providerSpecificData: { [GOOGLE_VERIFICATION_KEY]: null, operatorDisabledAt: null },
  });
  assert.equal(updates.isActive, undefined);
  assert.equal(
    (updates.providerSpecificData as Record<string, unknown>).operatorDisabledAt,
    "2026-10-06T12:01:00Z"
  );
  assert.equal(hasGoogleVerificationBlock({ ...existing, ...updates }), true);
});

test("new tokens cannot clear a provider quota or transport cooldown", () => {
  for (const code of [429, 502, 520]) {
    const existing = {
      ...account,
      testStatus: "unavailable",
      lastError: "upstream failure",
      errorCode: code,
      rateLimitedUntil: "2026-10-06T15:00:00Z",
      backoffLevel: 3,
    };
    const stored = { ...existing, ...prepareTokenRefreshUpdate(existing, refresh) };
    assert.equal(stored.errorCode, code);
    assert.equal(stored.testStatus, "unavailable");
    assert.equal(stored.rateLimitedUntil, existing.rateLimitedUntil);
  }
});

test("successful credential renewal clears genuine expiry but keeps a ban intact", () => {
  const expired = { ...account, testStatus: "expired", errorCode: 401, lastError: "expired token" };
  assert.equal({ ...expired, ...prepareTokenRefreshUpdate(expired, refresh) }.testStatus, "active");
  const banned = {
    ...account,
    testStatus: "banned",
    errorCode: 403,
    lastError: "account suspended",
  };
  assert.equal({ ...banned, ...prepareTokenRefreshUpdate(banned, refresh) }.testStatus, "banned");
});

test("2, 3 and 5 account pools skip only the challenged identity including its AGY sibling", () => {
  for (const count of [2, 3, 5]) {
    const healthy = Array.from({ length: count - 1 }, (_, i) => ({
      ...account,
      id: `healthy-${i}`,
      email: `user${i}@example.test`,
    }));
    const sibling = { ...account, id: "agy-a", provider: "agy", email: " Person@Example.Test " };
    const blocked = googleVerificationBlockedIdentities([challenge, sibling, ...healthy]);
    assert.equal(blocked.has(googleAccountIdentity(sibling)), true);
    assert.deepEqual(
      healthy.map((c) => blocked.has(googleAccountIdentity(c))),
      healthy.map(() => false)
    );
  }
});

test("an exhausted model does not create an account verification block", () => {
  const quota = { ...account, errorCode: 429, lastError: "Quota exhausted for gemini-3.8-flash" };
  assert.equal(hasGoogleVerificationBlock(quota), false);
  assert.equal(googleVerificationBlockedIdentities([quota]).size, 0);
});

test("a stale passing probe cannot clear a challenge reported after that probe started", () => {
  const updates = prepareTokenRefreshUpdate(challenge, {
    testStatus: "active",
    lastError: null,
    providerSpecificData: googleVerificationData(challenge, false),
    googleVerificationRecovered: true,
    googleVerificationExpectedAt: "2026-10-06T11:00:00.000Z",
  });
  assert.equal(hasGoogleVerificationBlock({ ...challenge, ...updates }), true);
  assert.equal({ ...challenge, ...updates }.testStatus, "unavailable");
});

test("a current successful inference probe may clear verification without activating a disabled account", () => {
  const existing = { ...challenge, isActive: false };
  const updates = prepareTokenRefreshUpdate(existing, {
    testStatus: "active",
    lastError: null,
    errorCode: null,
    providerSpecificData: googleVerificationData(existing, false),
    googleVerificationRecovered: true,
    googleVerificationExpectedAt: "2026-10-06T12:00:00.000Z",
  });
  const stored = { ...existing, ...updates };
  assert.equal(hasGoogleVerificationBlock(stored), false);
  assert.equal(stored.isActive, false);
  assert.equal(updates.googleVerificationRecovered, undefined);
});
