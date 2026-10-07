import { createHash } from "node:crypto";

/** Parent metadata can be shared by children; distinguish their client-side prompt prefix. */
export function nativeClaudeCacheGroup(body: unknown, sessionId: string | null): string | null {
  if (!sessionId || !body || typeof body !== "object" || Array.isArray(body)) return null;
  const b = body as Record<string, unknown>;
  const first = Array.isArray(b.messages) ? b.messages.find((m) => m?.role === "user") : null;
  if (
    !first ||
    (Array.isArray(first.content) && first.content.some((p) => p?.type === "tool_result"))
  )
    return null;
  const system = Array.isArray(b.system)
    ? b.system.filter(
        (block) =>
          typeof block?.text !== "string" || !block.text.startsWith("x-anthropic-billing-header:")
      )
    : b.system;
  const ignoreCacheMarker = (key: string, value: unknown) =>
    key === "cache_control" ? undefined : value;
  const hash = createHash("sha256").update(sessionId.toLowerCase());
  for (const value of [system, b.tools, first.content])
    hash.update("\0").update(JSON.stringify(value ?? null, ignoreCacheMarker));
  return hash.digest("hex");
}
