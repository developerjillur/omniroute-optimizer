export type NativeCacheRow = {
  model: string;
  inputTokens?: number | null;
  outputTokens?: number | null;
  cacheRead: number | null;
  cacheCreation: number | null;
  cacheCreation5m?: number | null;
  cacheCreation1h?: number | null;
  firstRequest?: boolean | null;
};

export type NativeCacheModel = {
  model: string;
  calls: number;
  inputTokensTotal: number;
  outputTokensTotal: number;
  cacheReadTotal: number;
  cacheWriteTotal: number;
  cacheReadShare: number | null;
  rewriteEligibleCalls: number;
  largeRewriteCalls: number;
  largeRewriteShare: number | null;
  firstRequestUnknownCalls: number;
  cacheCreation5mTotal: number;
  cacheCreation1hTotal: number;
  unknownTtlWriteTotal: number;
};

const num = (n: number | null | undefined) =>
  typeof n === "number" && Number.isFinite(n) && n >= 0 ? n : 0;

/** Input counters are cache-inclusive. Unknown historical session/TTL evidence is never invented. */
export function summarizeNativeCacheHealth(rows: NativeCacheRow[]): { models: NativeCacheModel[] } {
  const models = new Map<string, NativeCacheModel>();
  for (const row of rows) {
    const m = models.get(row.model) ?? {
      model: row.model,
      calls: 0,
      inputTokensTotal: 0,
      outputTokensTotal: 0,
      cacheReadTotal: 0,
      cacheWriteTotal: 0,
      cacheReadShare: null,
      rewriteEligibleCalls: 0,
      largeRewriteCalls: 0,
      largeRewriteShare: null,
      firstRequestUnknownCalls: 0,
      cacheCreation5mTotal: 0,
      cacheCreation1hTotal: 0,
      unknownTtlWriteTotal: 0,
    };
    const read = num(row.cacheRead),
      write = num(row.cacheCreation);
    m.calls++;
    m.inputTokensTotal += Math.max(num(row.inputTokens), read + write);
    m.outputTokensTotal += num(row.outputTokens);
    m.cacheReadTotal += read;
    m.cacheWriteTotal += write;
    if (row.firstRequest === false) {
      m.rewriteEligibleCalls++;
      if (write >= 20_000 && read < write) m.largeRewriteCalls++;
    } else if (row.firstRequest !== true) m.firstRequestUnknownCalls++;
    const five = num(row.cacheCreation5m),
      hour = num(row.cacheCreation1h);
    // A contradictory breakdown cannot be priced or reported as known TTL.
    if (five + hour <= write) {
      m.cacheCreation5mTotal += five;
      m.cacheCreation1hTotal += hour;
      m.unknownTtlWriteTotal += write - five - hour;
    } else m.unknownTtlWriteTotal += write;
    models.set(row.model, m);
  }
  return {
    models: [...models.values()].map((m) => ({
      ...m,
      cacheReadShare: m.inputTokensTotal > 0 ? m.cacheReadTotal / m.inputTokensTotal : null,
      largeRewriteShare:
        m.rewriteEligibleCalls > 0 ? m.largeRewriteCalls / m.rewriteEligibleCalls : null,
    })),
  };
}

export function nativeCacheAlerts(
  models: NativeCacheModel[]
): Array<{ model: string; reason: "rewrite" | "low-cache-read"; measured: number }> {
  return models.flatMap((m) => {
    const alerts: Array<{ model: string; reason: "rewrite" | "low-cache-read"; measured: number }> =
      [];
    if (m.largeRewriteShare !== null && m.largeRewriteShare > 0.02)
      alerts.push({ model: m.model, reason: "rewrite", measured: m.largeRewriteShare });
    if (
      /claude-sonnet-5[-.]5(?:$|-)/.test(m.model) &&
      m.cacheReadShare !== null &&
      m.cacheReadShare < 0.8
    )
      alerts.push({ model: m.model, reason: "low-cache-read", measured: m.cacheReadShare });
    return alerts;
  });
}

/** Configured API-price equivalent, not subscription billing or a weekly-point conversion. */
export function nativeApiEquivalent(
  m: NativeCacheModel,
  pricing: {
    input?: unknown;
    output?: unknown;
    cached?: unknown;
    cache_creation?: unknown;
    cache_creation_1h?: unknown;
  } | null
): { lowerUsd: number; upperUsd: number } | null {
  if (
    !pricing ||
    ![pricing.input, pricing.output, pricing.cached].every(
      (n) => typeof n === "number" && Number.isFinite(n) && n >= 0
    )
  )
    return null;
  const input = pricing.input as number,
    output = pricing.output as number,
    cached = pricing.cached as number;
  const five = typeof pricing.cache_creation === "number" ? pricing.cache_creation : input * 1.25;
  const hour =
    typeof pricing.cache_creation_1h === "number" ? pricing.cache_creation_1h : input * 2;
  if (![five, hour].every((n) => Number.isFinite(n) && n >= 0)) return null;
  const fresh = Math.max(0, m.inputTokensTotal - m.cacheReadTotal - m.cacheWriteTotal);
  const known =
    fresh * input +
    m.outputTokensTotal * output +
    m.cacheReadTotal * cached +
    m.cacheCreation5mTotal * five +
    m.cacheCreation1hTotal * hour;
  return {
    lowerUsd: (known + m.unknownTtlWriteTotal * Math.min(five, hour)) / 1e6,
    upperUsd: (known + m.unknownTtlWriteTotal * Math.max(five, hour)) / 1e6,
  };
}
