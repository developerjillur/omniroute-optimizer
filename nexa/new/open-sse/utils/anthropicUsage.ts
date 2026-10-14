type UsageRecord = Record<string, unknown>;

function record(value: unknown): UsageRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as UsageRecord) : {};
}

function tokens(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
}

/** Merge cumulative native counters by field presence, including explicit zeroes. */
export function mergeAnthropicUsage(previous: unknown, incoming: unknown): UsageRecord {
  const before = record(previous);
  const next = record(incoming);
  const result = { ...before, ...next };
  for (const key of ["cache_creation", "output_tokens_details"]) {
    if (next[key] && typeof next[key] === "object" && !Array.isArray(next[key])) {
      result[key] = { ...record(before[key]), ...record(next[key]) };
    }
  }
  if (
    before.iterations !== undefined &&
    next.iterations === undefined &&
    [
      "input_tokens",
      "output_tokens",
      "cache_read_input_tokens",
      "cache_creation_input_tokens",
    ].some((key) => next[key] !== undefined)
  ) {
    delete result.iterations;
  }
  return result;
}

/** Provider iterations contain the complete billed request, including compaction. */
export function getAnthropicMeteredUsage(value: unknown): UsageRecord {
  const usage = record(value);
  const iterations = usage.iterations;
  const fields = [
    "input_tokens",
    "cache_read_input_tokens",
    "cache_creation_input_tokens",
    "output_tokens",
  ];
  if (
    !Array.isArray(iterations) ||
    iterations.length === 0 ||
    !iterations.every((value) => {
      const item = record(value);
      return (
        (item.type === "message" || item.type === "compaction") &&
        fields.every((key) => {
          const count = item[key];
          return typeof count === "number" && Number.isFinite(count) && count >= 0;
        })
      );
    })
  ) {
    return usage;
  }
  const result = { ...usage };
  for (const field of fields) {
    const total = (iterations as unknown[]).reduce<number>(
      (sum, item) => sum + tokens(record(item)[field]),
      0
    );
    if (!Number.isSafeInteger(total)) return usage;
    result[field] = total;
  }
  const ttl = { ephemeral_5m_input_tokens: 0, ephemeral_1h_input_tokens: 0 };
  const completeTtl = (iterations as unknown[]).every((value) => {
    const item = record(value);
    const creation = record(item.cache_creation);
    const short =
      creation.ephemeral_5m_input_tokens ?? (item.cache_creation_input_tokens === 0 ? 0 : null);
    const long =
      creation.ephemeral_1h_input_tokens ?? (item.cache_creation_input_tokens === 0 ? 0 : null);
    if (
      typeof short !== "number" ||
      typeof long !== "number" ||
      !Number.isFinite(short) ||
      !Number.isFinite(long) ||
      short < 0 ||
      long < 0 ||
      short + long !== item.cache_creation_input_tokens
    )
      return false;
    ttl.ephemeral_5m_input_tokens += short;
    ttl.ephemeral_1h_input_tokens += long;
    return true;
  });
  if (completeTtl) result.cache_creation = ttl;
  else if (iterations.length > 1) delete result.cache_creation;
  return result;
}

/** Canonical inclusive input for internal metering and OpenAI-format clients. */
export function normalizeAnthropicUsage(value: unknown): Record<string, number> {
  const usage = getAnthropicMeteredUsage(value);
  const read = tokens(usage.cache_read_input_tokens);
  const write = tokens(usage.cache_creation_input_tokens);
  const input = tokens(usage.input_tokens ?? usage.prompt_tokens) + read + write;
  const output = tokens(usage.output_tokens ?? usage.completion_tokens);
  const result: Record<string, number> = {
    prompt_tokens: input,
    input_tokens: input,
    completion_tokens: output,
    output_tokens: output,
  };
  if (usage.cache_read_input_tokens !== undefined) result.cache_read_input_tokens = read;
  if (usage.cache_creation_input_tokens !== undefined) result.cache_creation_input_tokens = write;
  const details = record(usage.output_tokens_details);
  const reasoning = details.thinking_tokens ?? details.reasoning_tokens ?? usage.reasoning_tokens;
  if (typeof reasoning === "number" && Number.isFinite(reasoning) && reasoning >= 0) {
    result.reasoning_tokens = reasoning;
  }
  return result;
}
