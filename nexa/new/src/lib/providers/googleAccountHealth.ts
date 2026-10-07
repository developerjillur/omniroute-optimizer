type JsonRecord = Record<string, unknown>;
type Connection = {
  id?: unknown;
  provider?: unknown;
  email?: unknown;
  isActive?: unknown;
  providerSpecificData?: unknown;
  testStatus?: unknown;
  errorCode?: unknown;
  lastError?: unknown;
  lastErrorType?: unknown;
  rateLimitedUntil?: unknown;
};
export const GOOGLE_VERIFICATION_KEY = "googleAccountVerification";
export const GOOGLE_VERIFICATION_MESSAGE =
  "Google account verification required: verify your account to continue in Google, then Retest this connection.";

function record(value: unknown): JsonRecord {
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return {};
    }
  }
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : {};
}

export function isGoogleCloudAccount(provider: unknown): boolean {
  return provider === "antigravity" || provider === "agy";
}

export function isGoogleVerificationFailure(
  provider: unknown,
  status: unknown,
  error: unknown
): boolean {
  return (
    isGoogleCloudAccount(provider) &&
    Number(status) === 403 &&
    /verify your account to continue|\bVALIDATION_REQUIRED\b/i.test(String(error || ""))
  );
}

export function hasGoogleVerificationBlock(connection: Connection): boolean {
  if (!isGoogleCloudAccount(connection.provider)) return false;
  const marker = record(record(connection.providerSpecificData)[GOOGLE_VERIFICATION_KEY]);
  return (
    marker.required === true ||
    isGoogleVerificationFailure(connection.provider, connection.errorCode, connection.lastError)
  );
}

export function googleAccountIdentity(connection: Connection): string {
  const email = typeof connection.email === "string" ? connection.email.trim().toLowerCase() : "";
  return email ? `google:${email}` : `connection:${String(connection.id || "")}`;
}

export function googleVerificationBlockedIdentities(
  connections: readonly Connection[]
): Set<string> {
  return new Set(connections.filter(hasGoogleVerificationBlock).map(googleAccountIdentity));
}

export function googleVerificationData(
  connection: Connection,
  required: boolean,
  now = new Date().toISOString()
): JsonRecord {
  const data = { ...record(connection.providerSpecificData) };
  if (required) data[GOOGLE_VERIFICATION_KEY] = { required: true, detectedAt: now };
  else delete data[GOOGLE_VERIFICATION_KEY];
  return data;
}

export function googleVerificationObservedAt(connection: Connection): string | null {
  const marker = record(record(connection.providerSpecificData)[GOOGLE_VERIFICATION_KEY]);
  return typeof marker.detectedAt === "string" ? marker.detectedAt : null;
}

/** OAuth success proves credential validity; it does not prove inference eligibility. */
export function prepareTokenRefreshUpdate(existing: Connection, incoming: JsonRecord): JsonRecord {
  const updates = { ...incoming };
  delete updates.preserveHealthOnTokenRefresh;
  delete updates.googleVerificationRecovered;
  delete updates.googleVerificationExpectedAt;
  if (!isGoogleCloudAccount(existing.provider)) return updates;

  const verifiedRecovery =
    incoming.googleVerificationRecovered === true &&
    incoming.googleVerificationExpectedAt === googleVerificationObservedAt(existing);
  // An older successful call, stale edit, or metadata poll cannot erase a newer challenge.
  if (hasGoogleVerificationBlock(existing) && !verifiedRecovery) {
    const providerData = {
      ...record(existing.providerSpecificData),
      ...record(incoming.providerSpecificData),
    };
    const oldMarker = record(existing.providerSpecificData)[GOOGLE_VERIFICATION_KEY];
    const incomingMarker = record(record(incoming.providerSpecificData)[GOOGLE_VERIFICATION_KEY]);
    providerData[GOOGLE_VERIFICATION_KEY] =
      incomingMarker.required === true &&
      String(incomingMarker.detectedAt || "") > String(googleVerificationObservedAt(existing) || "")
        ? incomingMarker
        : oldMarker || { required: true };
    updates.providerSpecificData = providerData;
    if (incoming.testStatus === "active" || incoming.lastError === null) {
      for (const key of [
        "testStatus",
        "lastError",
        "lastErrorAt",
        "lastErrorType",
        "lastErrorSource",
        "errorCode",
        "rateLimitedUntil",
        "backoffLevel",
      ])
        delete updates[key];
    }
  }
  if (incoming.preserveHealthOnTokenRefresh !== true) return updates;
  if (existing.isActive === false || record(existing.providerSpecificData).operatorDisabledAt) {
    delete updates.isActive;
    if (updates.providerSpecificData) {
      (updates.providerSpecificData as JsonRecord).operatorDisabledAt = record(
        existing.providerSpecificData
      ).operatorDisabledAt;
    }
  }

  const status = String(existing.testStatus || "");
  const code = Number(existing.errorCode);
  const errorType = String(existing.lastErrorType || "");
  const hasError = Boolean(existing.lastError || existing.lastErrorType || existing.errorCode);
  const authFailure =
    (code === 401 ||
      ["auth_error", "token_expired", "invalid_token"].includes(errorType) ||
      ["expired", "invalid"].includes(status)) &&
    !hasGoogleVerificationBlock(existing);
  const preserve =
    hasGoogleVerificationBlock(existing) ||
    ["banned", "credits_exhausted"].includes(status) ||
    (hasError && !authFailure) ||
    Boolean(existing.rateLimitedUntil && !authFailure);
  if (preserve) {
    for (const key of [
      "testStatus",
      "lastError",
      "lastErrorAt",
      "lastErrorType",
      "lastErrorSource",
      "errorCode",
      "rateLimitedUntil",
      "backoffLevel",
    ])
      delete updates[key];
  }
  if (incoming.providerSpecificData) {
    updates.providerSpecificData = {
      ...record(existing.providerSpecificData),
      ...record(updates.providerSpecificData),
    };
    if (hasGoogleVerificationBlock(existing)) {
      (updates.providerSpecificData as JsonRecord)[GOOGLE_VERIFICATION_KEY] = record(
        existing.providerSpecificData
      )[GOOGLE_VERIFICATION_KEY] || { required: true };
    }
  }
  return updates;
}
