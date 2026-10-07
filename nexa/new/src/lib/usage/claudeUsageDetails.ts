function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function effort(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return ["none", "off", "minimal", "low", "medium", "high", "xhigh", "max"].includes(normalized)
    ? normalized
    : null;
}

/** Last per-message directive applies to the current turn; absent intent stays unknown. */
export function readRequestedEffort(body: unknown): string | null {
  const b = record(body);
  if (Array.isArray(b.messages)) {
    for (let i = b.messages.length - 1; i >= 0; i--) {
      const value = effort(record(record(b.messages[i]).output_config).effort);
      if (value) return value;
    }
  }
  return (
    effort(record(b.output_config).effort) ??
    effort(b.reasoning_effort) ??
    effort(record(b.reasoning).effort)
  );
}

function count(value: unknown): number | null {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value >= 0
    ? value
    : null;
}

export function readCacheCreationTtl(usage: unknown): {
  cacheCreation5mTokens: number | null;
  cacheCreation1hTokens: number | null;
} {
  const creation = record(record(usage).cache_creation);
  return {
    cacheCreation5mTokens: count(creation.ephemeral_5m_input_tokens),
    cacheCreation1hTokens: count(creation.ephemeral_1h_input_tokens),
  };
}
