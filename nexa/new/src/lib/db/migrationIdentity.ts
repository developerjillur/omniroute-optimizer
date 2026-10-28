/** Keep the two historical distribution SQL paths without occupying upstream numeric slots. */
export function resolveMigrationIdentity(
  filename: string
): { version: string; name: string } | null {
  const match = filename.match(/^(\d+)_(.+)\.sql$/);
  if (!match) return null;
  const version =
    filename === "197_native_claude_cache_details.sql"
      ? "legacy-197-native_claude_cache_details"
      : filename === "198_usage_history_cache_ttl.sql"
        ? "legacy-198-usage_history_cache_ttl"
        : match[1];
  return { version, name: match[2] };
}
