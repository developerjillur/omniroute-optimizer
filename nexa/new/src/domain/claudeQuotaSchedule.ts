import type { QuotaCacheEntry, QuotaInfo } from "./quotaCacheState";

const REFRESH_RETRY_MS = 5 * 60 * 1000;
const PARKED_REFRESH_MS = 30 * 60 * 1000;

export function isBlockingClaudeQuotaWindow(quota: QuotaInfo): boolean {
  const metadata = quota.claudeQuota;
  if (!metadata?.active) return false;
  // Anthropic also labels the 90%-used warning band active/critical. A known
  // positive remainder must stay usable until the provider actually rejects it.
  if (quota.fractionReported !== false && quota.remainingPercentage > 0) return false;
  const severity = metadata.severity?.trim().toLowerCase();
  return !severity || severity === "critical";
}

/** Schedule a usage read at the time the blocked scope can actually recover. */
export function getClaudeQuotaSchedule(entry: QuotaCacheEntry): { checkAt: number | null } | null {
  if (entry.provider !== "claude") return null;
  const global = Object.values(entry.quotas).filter(
    (quota) => quota.claudeQuota?.kind !== "weekly_scoped" && isBlockingClaudeQuotaWindow(quota)
  );
  const scoped = Object.values(entry.modelQuotas).filter(isBlockingClaudeQuotaWindow);
  const windows = global.length ? global : scoped;
  if (!windows.length) return null;
  const resets = windows.map((quota) => (quota.resetAt ? Date.parse(quota.resetAt) : NaN));
  const known = resets.filter(Number.isFinite);
  // All global walls must clear; independent model scopes can recover separately.
  const checkAt = known.length ? (global.length ? Math.max(...known) : Math.min(...known)) : null;
  return { checkAt };
}

export function shouldRefreshQuotaEntry(
  entry: QuotaCacheEntry,
  now: number,
  lastAttemptAt?: number
): boolean {
  if (lastAttemptAt !== undefined && now < lastAttemptAt + REFRESH_RETRY_MS) return false;
  const schedule = getClaudeQuotaSchedule(entry);
  if (schedule?.checkAt !== null && schedule?.checkAt !== undefined) {
    // Keep the wall parked, but occasionally read actual quota so changed plans
    // and provider-side recovery are noticed without waiting for an old deadline.
    if (now < schedule.checkAt) {
      return now >= Math.max(entry.fetchedAt, lastAttemptAt ?? 0) + PARKED_REFRESH_MS;
    }
    // A stale reset still reported active is retried at a bounded interval.
    return (
      now >=
      Math.max(
        schedule.checkAt,
        entry.fetchedAt >= schedule.checkAt ? entry.fetchedAt + REFRESH_RETRY_MS : schedule.checkAt
      )
    );
  }
  if (entry.exhausted && entry.nextResetAt) {
    const resetMs = Date.parse(entry.nextResetAt);
    if (Number.isFinite(resetMs) && resetMs <= now) return true;
  }
  return now - entry.fetchedAt >= REFRESH_RETRY_MS;
}
