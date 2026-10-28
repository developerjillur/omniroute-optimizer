import { getDbInstance } from "../core";

const TTL_COLUMNS = ["tokens_cache_creation_5m", "tokens_cache_creation_1h"] as const;

/** Older internal SQL-source callers omit the optional TTL columns. */
export function withCacheTtlColumns(source: string, params: Record<string, unknown> = {}): string {
  const db = getDbInstance();
  try {
    // LIMIT 0 resolves columns without scanning rows, including on lazy adapters.
    db.prepare(`SELECT ${TTL_COLUMNS.join(", ")} FROM ${source} AS cache_ttl_source LIMIT 0`).all(
      params
    );
    return source;
  } catch (error) {
    const message = String((error as Error).message);
    if (!/no such column/i.test(message) || !TTL_COLUMNS.some((column) => message.includes(column)))
      throw error;
  }
  const missing = TTL_COLUMNS.filter((column) => {
    try {
      db.prepare(`SELECT ${column} FROM ${source} AS cache_ttl_source LIMIT 0`).all(params);
      return false;
    } catch (error) {
      const message = String((error as Error).message);
      if (!/no such column/i.test(message) || !message.includes(column)) throw error;
      return true;
    }
  });
  if (missing.length === 0) return source;
  return `(SELECT cache_ttl_source.*, ${missing.map((column) => `NULL AS ${column}`).join(", ")}
    FROM ${source} AS cache_ttl_source)`;
}

/** Validate each row before summing, so bad splits cannot borrow another row's writes. */
export function cacheTtlTokenSql(prefix = ""): { five: string; hour: string } {
  const total = `${prefix}tokens_cache_creation`;
  const five = `${prefix}${TTL_COLUMNS[0]}`;
  const hour = `${prefix}${TTL_COLUMNS[1]}`;
  const valid = `typeof(${total}) = 'integer' AND ${total} BETWEEN 0 AND 9007199254740991 AND
    (${five} IS NULL OR (typeof(${five}) = 'integer' AND ${five} >= 0)) AND
    (${hour} IS NULL OR (typeof(${hour}) = 'integer' AND ${hour} >= 0)) AND
    COALESCE(${five}, 0) + COALESCE(${hour}, 0) <= ${total}`;
  return {
    five: `CASE WHEN ${valid} THEN COALESCE(${five}, 0) ELSE 0 END`,
    hour: `CASE WHEN ${valid} THEN COALESCE(${hour}, 0) ELSE 0 END`,
  };
}
