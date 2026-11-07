import { CACHE_CREATION_TOKEN_KEYS, CACHE_CREATION_TOKEN_DETAIL_KEYS } from "./tokenAccounting";

type TtlSplit = { cacheCreation5m: number | null; cacheCreation1h: number | null };

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function count(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : null;
}

/** Reported TTL detail is usable only with a compatible, known total write count. */
export function getCacheCreationTtl(value: unknown): TtlSplit {
  const usage = record(value);
  const creation = record(usage.cache_creation);
  const five = count(usage.cacheCreation5m ?? creation.ephemeral_5m_input_tokens);
  const hour = count(usage.cacheCreation1h ?? creation.ephemeral_1h_input_tokens);
  // Read the reported value before numeric coercion can turn malformed input into zero.
  const promptDetails = record(usage.prompt_tokens_details);
  const details =
    Object.keys(promptDetails).length > 0 ? promptDetails : record(usage.input_tokens_details);
  const reportedTotal = CACHE_CREATION_TOKEN_KEYS.map((key) => usage[key])
    .concat(CACHE_CREATION_TOKEN_DETAIL_KEYS.map((key) => details[key]))
    .find((value) => value !== undefined && value !== null);
  const total = count(reportedTotal);
  if (total === null || (five ?? 0) + (hour ?? 0) > total)
    return { cacheCreation5m: null, cacheCreation1h: null };
  return { cacheCreation5m: five, cacheCreation1h: hour };
}

/** Internal numeric metadata; absence stays absent instead of inventing a zero. */
export function getCacheCreationTtlFields(value: unknown): {
  cacheCreation5m?: number;
  cacheCreation1h?: number;
} {
  const ttl = getCacheCreationTtl(value);
  return {
    ...(ttl.cacheCreation5m !== null ? { cacheCreation5m: ttl.cacheCreation5m } : {}),
    ...(ttl.cacheCreation1h !== null ? { cacheCreation1h: ttl.cacheCreation1h } : {}),
  };
}
