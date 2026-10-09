import { isClaudeCodeOriginatedHeaders } from "../config/codexIdentity.ts";

/** Native WebSearch consumes Anthropic server result blocks, not a client function call. */
export function nativeHostedSearchFallbackError(
  body: Record<string, unknown>,
  headers: Headers | Record<string, unknown> | null | undefined,
  sourceFormat: string
): string | null {
  if (sourceFormat !== "claude" || !isClaudeCodeOriginatedHeaders(headers)) return null;
  if (!Array.isArray(body.tools)) return null;
  const hosted = body.tools.some((tool: unknown) => {
    if (!tool || typeof tool !== "object" || Array.isArray(tool)) return false;
    const value = tool as Record<string, unknown>;
    return (
      typeof value.type === "string" &&
      /^web_search(?:_\d{8})?$/.test(value.type) &&
      value.input_schema == null &&
      value.function == null
    );
  });
  if (!hosted) return null;
  return (
    "Native WebSearch requires Anthropic server search result blocks, which this target cannot preserve. " +
    "Use an Anthropic route for native WebSearch, or a configured client-side search/browser tool. " +
    "The request was stopped before provider dispatch; no empty search result was fabricated."
  );
}
