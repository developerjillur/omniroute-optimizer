// Official API Standard rates, per million tokens, checked 2026-11-18.
// https://developers.openai.com/api/docs/models/gpt-6.2-sol
// https://developers.openai.com/api/docs/models/gpt-6.2-astra
const longContext = {
  long_context_threshold: 272000,
  long_context_input_multiplier: 2,
  long_context_output_multiplier: 1.5,
};

export const GPT_6_2_SOL_PRICING = {
  input: 2,
  cached: 0.1,
  cache_creation: 2.5,
  output: 10,
  reasoning: 10,
  ...longContext,
};
export const GPT_6_2_ASTRA_PRICING = {
  input: 8,
  cached: 0.4,
  cache_creation: 10,
  output: 40,
  reasoning: 40,
  ...longContext,
};

// Codex has no separate cache-write charge. These are cost estimates, not included-plan quota.
// https://learn.chatgpt.com/docs/pricing#token-rates
export const GPT_6_2_SOL_CODEX_PRICING = { ...GPT_6_2_SOL_PRICING, cache_creation: 0 };
export const GPT_6_2_ASTRA_CODEX_PRICING = { ...GPT_6_2_ASTRA_PRICING, cache_creation: 0 };

export function getGpt62ServiceTierMultiplier(
  model: string,
  tier: string,
  at = Date.now()
): number | null {
  if (model !== "gpt-6.2-sol" && model !== "gpt-6.2-astra") return null;
  if (tier === "flex" || tier === "batch") return 0.5;
  if (tier === "priority" || tier === "fast") return 2;
  // The promotional price ends at the start of March 1 in Pacific time.
  if (tier === "ultrafast") return at < Date.parse("2027-03-01T08:00:00Z") ? 3 : 6;
  return 1;
}
