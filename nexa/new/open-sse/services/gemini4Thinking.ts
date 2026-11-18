type Body = Record<string, unknown>;
function record(value: unknown): Body {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Body) : {};
}

/** Gemini 4 has levels, no numeric off switch. Keep provider defaults when no level is requested. */
export function gemini4ThinkingConfig(
  model: string,
  budget: number,
  body: Body
): { thinkingLevel?: string; includeThoughts?: boolean } | null {
  if (!/(?:^|\/)gemini-4(?:$|[-.])/i.test(model)) return null;
  const gc = record(body.generationConfig);
  const native = record(gc.thinkingConfig ?? gc.thinking_config);
  const explicitNative =
    native.thinkingLevel ?? native.thinking_level ?? body.thinkingLevel ?? body.thinking_level;
  const effort =
    explicitNative ??
    record(body.output_config).effort ??
    record(body.reasoning).effort ??
    body.reasoning_effort;
  const level = typeof effort === "string" ? effort.toLowerCase().trim() : "";
  const hydrogen = /(?:^|\/)gemini-4-hydrogen(?:$|-)/i.test(model);
  const config: { thinkingLevel?: string; includeThoughts?: boolean } = {};
  if (typeof explicitNative === "string" && explicitNative.trim()) {
    config.thinkingLevel = explicitNative.trim();
  } else if (["low", "medium", "high", "xhigh"].includes(level)) {
    // An explicit native level stays explicit, including an upstream-invalid request.
    config.thinkingLevel = level;
  } else if (level === "max" || level === "ultra") {
    config.thinkingLevel = hydrogen ? "xhigh" : "high";
  } else if (
    budget > 0 &&
    (typeof body.reasoning_budget === "number" ||
      typeof record(body.thinking).budget_tokens === "number")
  ) {
    config.thinkingLevel = budget <= 1024 ? "low" : budget <= 8192 ? "medium" : "high";
  }
  const include =
    native.includeThoughts ??
    native.include_thoughts ??
    body.includeThoughts ??
    body.include_thoughts;
  if (typeof include === "boolean") config.includeThoughts = include;
  return config;
}
