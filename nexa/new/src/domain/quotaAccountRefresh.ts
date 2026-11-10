import { isGoogleCloudAccount } from "@/lib/providers/googleAccountHealth";

// Usage polling must use the same serialized token renewal as inference. An
// expired access token is temporary; a Google verification barrier is separate.
export async function getQuotaUsageWithRefreshedToken(connection: Record<string, unknown>) {
  const { getUsageForProvider } = await import("@omniroute/open-sse/services/usage.ts");
  const provider = String(connection.provider || "");
  if (provider !== "claude" && !isGoogleCloudAccount(provider)) {
    return getUsageForProvider(connection);
  }
  const { checkAndRefreshToken } = await import("@/sse/services/tokenRefresh");
  const fresh = await checkAndRefreshToken(provider, {
    ...connection,
    connectionId: connection.id,
  });
  return getUsageForProvider(fresh);
}
