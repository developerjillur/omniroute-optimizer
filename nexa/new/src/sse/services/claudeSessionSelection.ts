export function isNativeClaudeSession(
  provider: string,
  sessionKey: string | null | undefined
): boolean {
  return provider === "claude" && Boolean(sessionKey?.startsWith("claude:"));
}

/** Candidates are already eligible; quota ranks only a new session, never its affinity. */
export function pickClaudeNewSession<T extends { id: string }>(
  candidates: readonly T[],
  remaining: (id: string) => number | null
): T | undefined {
  let selected = candidates[0];
  let most = -1;
  for (const candidate of candidates) {
    const quota = remaining(candidate.id);
    const score = typeof quota === "number" && Number.isFinite(quota) ? quota : -1;
    if (score > most) {
      selected = candidate;
      most = score;
    }
  }
  return selected;
}
