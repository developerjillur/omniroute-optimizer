import {
  getProviderConnections,
  getProviderConnectionById,
  updateProviderConnection,
} from "@/lib/db/providers";
import {
  googleAccountIdentity,
  googleVerificationData,
  googleVerificationObservedAt,
  hasGoogleVerificationBlock,
  isGoogleVerificationFailure,
  isGoogleCloudAccount,
  GOOGLE_VERIFICATION_MESSAGE,
} from "@/lib/providers/googleAccountHealth";

/** Capture each barrier before the inference probe, including legacy unequal timestamps. */
export async function getGoogleAccountVerificationSnapshot(
  connectionId: string
): Promise<Record<string, string | null>> {
  const connection = await getProviderConnectionById(connectionId);
  if (!connection || !isGoogleCloudAccount(connection.provider)) return {};
  const identity = googleAccountIdentity(connection);
  const rows = (
    await Promise.all(
      ["antigravity", "agy"].map((provider) => getProviderConnections({ provider }))
    )
  ).flat();
  const snapshot: Record<string, string | null> = Object.create(null);
  for (const candidate of rows) {
    if (
      typeof candidate.id === "string" &&
      googleAccountIdentity(candidate) === identity &&
      hasGoogleVerificationBlock(candidate)
    )
      snapshot[candidate.id] = googleVerificationObservedAt(candidate);
  }
  return snapshot;
}

/** AGY and Antigravity may hold distinct tokens for the same Google identity. */
export async function setGoogleAccountVerification(
  connectionId: string,
  required: boolean,
  expectedDetectedAt: string | null = null,
  snapshot?: Record<string, string | null>
): Promise<void> {
  const connection = await getProviderConnectionById(connectionId);
  if (!connection || !isGoogleCloudAccount(connection.provider)) return;
  const identity = googleAccountIdentity(connection);
  const detectedAt = new Date().toISOString();
  const rows = (
    await Promise.all(
      ["antigravity", "agy"].map((provider) => getProviderConnections({ provider }))
    )
  ).flat();
  for (const candidate of rows) {
    if (googleAccountIdentity(candidate) !== identity) continue;
    const candidateId = typeof candidate.id === "string" ? candidate.id : "";
    if (!candidateId) continue;
    const latest = await getProviderConnectionById(candidateId);
    if (!latest || (!required && !hasGoogleVerificationBlock(latest))) continue;
    const expectedAt = snapshot ? snapshot[candidateId] : expectedDetectedAt;
    if (!required && googleVerificationObservedAt(latest) !== expectedAt) continue;
    const updates: Record<string, unknown> = {
      providerSpecificData: googleVerificationData(latest, required, detectedAt),
      ...(!required
        ? { googleVerificationRecovered: true, googleVerificationExpectedAt: expectedAt }
        : {}),
    };
    if (required) {
      Object.assign(updates, {
        testStatus: "unavailable",
        lastError: GOOGLE_VERIFICATION_MESSAGE,
        lastErrorAt: new Date().toISOString(),
        lastErrorType: "project_route_error",
        lastErrorSource: "upstream",
        errorCode: 403,
      });
    } else if (
      isGoogleVerificationFailure(latest.provider, latest.errorCode, latest.lastError) ||
      Number(latest.errorCode) === 401 ||
      ["expired", "invalid"].includes(String(latest.testStatus))
    ) {
      Object.assign(updates, {
        testStatus: "active",
        lastError: null,
        lastErrorAt: null,
        lastErrorType: null,
        lastErrorSource: null,
        errorCode: null,
      });
    }
    // Never change isActive: a verification test must preserve operator-disabled rows.
    await updateProviderConnection(candidateId, updates);
  }
}
