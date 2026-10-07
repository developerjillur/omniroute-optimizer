import { createHash } from "node:crypto";

type HeaderLike =
  { get?: (name: string) => string | null } | Record<string, string | undefined> | null | undefined;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_METADATA_LENGTH = 4096;

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function uuid(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 64) return null;
  const trimmed = value.trim();
  return UUID.test(trimmed) ? trimmed.toLowerCase() : null;
}

/** Read the native conversation identifier without hashing mutable prompt content. */
export function getNativeClaudeSessionId(body: unknown, headers?: HeaderLike): string | null {
  const getter = headers && "get" in headers ? headers.get : null;
  const headerValue =
    typeof getter === "function"
      ? getter.call(headers, "x-claude-code-session-id")
      : Object.entries(headers ?? {}).find(
          ([name]) => name.toLowerCase() === "x-claude-code-session-id"
        )?.[1];
  const headerId = uuid(headerValue);
  if (headerId) return headerId;

  const raw = record(record(body).metadata).user_id;
  if (typeof raw !== "string" || raw.length > MAX_METADATA_LENGTH) return null;
  try {
    return uuid(record(JSON.parse(raw)).session_id);
  } catch {
    return null;
  }
}

/** Keep conversations distinct and stable across token refreshes and process restarts. */
export function accountScopedClaudeSessionId(accountScope: string, nativeId: string): string {
  const hex = createHash("sha256")
    .update("claude-native-session\0")
    .update(accountScope)
    .update("\0")
    .update(nativeId.toLowerCase())
    .digest("hex");
  const variant = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${variant}${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}
