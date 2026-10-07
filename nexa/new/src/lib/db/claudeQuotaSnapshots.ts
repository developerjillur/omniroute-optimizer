type Observation = {
  remaining_percentage: number | null;
  is_exhausted: number;
  next_reset_at: string | null;
  window_duration_ms: number | null;
  raw_data: string | null;
};

/** Deduplicate clock jitter, retaining the exact reported deadline and periodic evidence. */
export function shouldPersistClaudeQuotaSnapshot(
  previous: (Observation & { created_at: string }) | undefined,
  next: Observation,
  now: number
): boolean {
  const observedAt = previous ? Date.parse(previous.created_at) : NaN;
  if (
    !previous ||
    !Number.isFinite(observedAt) ||
    observedAt > now ||
    now - observedAt >= 30 * 60_000
  )
    return true;
  if (
    previous.remaining_percentage !== next.remaining_percentage ||
    previous.is_exhausted !== next.is_exhausted ||
    previous.window_duration_ms !== next.window_duration_ms ||
    previous.raw_data !== next.raw_data
  )
    return true;
  if (previous.next_reset_at === next.next_reset_at) return false;
  const before = previous.next_reset_at ? Date.parse(previous.next_reset_at) : NaN;
  const after = next.next_reset_at ? Date.parse(next.next_reset_at) : NaN;
  return !Number.isFinite(before) || !Number.isFinite(after) || Math.abs(before - after) > 2000;
}
