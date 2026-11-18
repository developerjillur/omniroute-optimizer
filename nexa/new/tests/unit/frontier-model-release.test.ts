import test from "node:test";
import assert from "node:assert/strict";
import { codexProvider } from "../../open-sse/config/providers/registry/codex/index.ts";
import { geminiProvider } from "../../open-sse/config/providers/registry/gemini/index.ts";
import { isDiscoverableAgyModelId } from "../../open-sse/config/agyModels.ts";
import {
  isDiscoverableAntigravityModelId,
  resolveAntigravityModelId,
} from "../../open-sse/config/antigravityModelAliases.ts";
import { normalizeSyncedAvailableModels } from "../../src/lib/db/models/synced.ts";
import { gemini38ThinkingConfig } from "../../open-sse/services/thinkingBudget.ts";
import { getModelSpec, getCanonicalModelSpecId } from "../../src/shared/constants/modelSpecs.ts";
import { getResolvedModelCapabilities } from "../../src/lib/modelCapabilities.ts";
import {
  openaiToGeminiRequest,
  openaiToAntigravityRequest,
} from "../../open-sse/translator/request/openai-to-gemini.ts";
import { claudeToGeminiRequest } from "../../open-sse/translator/request/claude-to-gemini.ts";
import { DEFAULT_PRICING } from "../../src/shared/constants/pricing/default-pricing.ts";
import {
  computeCostFromPricing,
  getCodexFastCostMultiplier,
} from "../../src/lib/usage/costCalculator.ts";

test("both GPT 6.2 models use Responses with native Codex limits and full effort range", () => {
  for (const id of ["gpt-6.2-sol", "gpt-6.2-astra"]) {
    const model = codexProvider.models.find((row) => row.id === id);
    assert.ok(model);
    assert.equal(model.targetFormat, "openai-responses");
    assert.equal(model.toolCalling, true);
    assert.equal(model.maxInputTokens, 872000);
    assert.deepEqual(model.supportedThinkingEfforts, [
      "low",
      "medium",
      "high",
      "xhigh",
      "max",
      "ultra",
    ]);
  }
});

test("Google release models keep conservative foreground limits and tool/vision support", () => {
  for (const [id, limit] of [
    ["gemini-4-hydrogen", 65536],
    ["gemini-4-carbon", 32768],
  ] as const) {
    const model = geminiProvider.models.find((row) => row.id === id);
    assert.ok(model);
    assert.equal(model.maxOutputTokens, limit);
    assert.equal(model.supportsVision, true);
    assert.equal(model.toolCalling, true);
  }
});

test("new family specs precede generic aliases and Codex keeps its provider-specific window", () => {
  for (const family of ["hydrogen", "carbon"]) {
    assert.equal(getCanonicalModelSpecId(`agy/gemini-4-${family}-high`), `gemini-4-${family}`);
    assert.equal(getModelSpec(`gemini-4-${family}`)?.noThinkingAlias, false);
  }
  for (const model of ["gpt-6.2-sol", "gpt-6.2-astra"]) {
    assert.equal(getModelSpec(model)?.contextWindow, 1050000);
    assert.equal(getResolvedModelCapabilities(`cx/${model}`).contextWindow, 872000);
  }
});

test("actual Gemini and Antigravity translators retain Hydrogen XHIGH without numeric budgets", () => {
  type Config = { thinkingLevel?: string; thinkingBudget?: number };
  type Wire = { generationConfig?: { thinkingConfig?: Config } };
  const body = {
    messages: [{ role: "user", content: "hello" }],
    reasoning_effort: "xhigh",
    max_tokens: 4096,
  };
  const direct = openaiToGeminiRequest("gemini-4-hydrogen", body, true) as Wire;
  const bridge = openaiToAntigravityRequest("gemini-4-hydrogen", body, true) as { request?: Wire };
  for (const config of [
    direct.generationConfig?.thinkingConfig,
    bridge.request?.generationConfig?.thinkingConfig,
  ]) {
    assert.equal(config?.thinkingLevel, "xhigh");
    assert.equal(config?.thinkingBudget, undefined);
  }
  const claude = claudeToGeminiRequest("gemini-4-hydrogen", {
    messages: [{ role: "user", content: "hello" }],
    thinking: { type: "enabled", budget_tokens: 0 },
  }) as Wire;
  assert.equal(claude.generationConfig?.thinkingConfig?.thinkingBudget, undefined);
});

test("both Google surfaces exclude disabled placeholders, including pre-existing cached rows", () => {
  assert.equal(resolveAntigravityModelId("gemini-4-hydrogen"), "gemini-4-hydrogen-high");
  assert.equal(resolveAntigravityModelId("gemini-4-carbon"), "gemini-4-carbon-medium");
  for (const provider of ["agy", "antigravity"]) {
    const data = [
      { id: "gemini-4-argon-disabled", name: "Gemini 4 Argon" },
      { id: "gemini-4-hydrogen", name: "Hydrogen" },
    ];
    assert.deepEqual(
      normalizeSyncedAvailableModels(data, provider).map((row) => row.id),
      ["gemini-4-hydrogen"]
    );
    assert.equal(data.length, 2);
  }
  for (const callable of [isDiscoverableAgyModelId, isDiscoverableAntigravityModelId]) {
    assert.equal(callable("gemini-4-carbon-disabled"), false);
    assert.equal(callable("gemini-4-hydrogen"), true);
    assert.equal(callable("gemini-4-argon"), true);
  }
});

test("Gemini 4 translator helper retains default reasoning and explicit Hydrogen XHIGH", () => {
  assert.deepEqual(gemini38ThinkingConfig("gemini-4-hydrogen", 0, {}), {});
  assert.deepEqual(gemini38ThinkingConfig("gemini-4-hydrogen", 8192, {}), {});
  assert.deepEqual(
    gemini38ThinkingConfig("gemini-4-hydrogen", 24576, { output_config: { effort: "max" } }),
    { thinkingLevel: "xhigh" }
  );
  assert.deepEqual(gemini38ThinkingConfig("gemini-3.8-flash", 0, {}), {
    thinkingBudget: 0,
    includeThoughts: false,
  });
});

test("GPT 6.2 pricing dispatch resolves base and effort aliases, preserving older pricing", () => {
  const pricing = DEFAULT_PRICING as unknown as Record<
    string,
    Record<string, Record<string, number>>
  >;
  for (const [id, input, output] of [
    ["gpt-6.2-sol", 2, 10],
    ["gpt-6.2-astra", 8, 40],
  ] as const) {
    assert.equal(pricing.openai[id].input, input);
    assert.equal(pricing.cx[id].output, output);
    assert.equal(pricing.cx[id].cache_creation, 0);
    assert.equal(getCodexFastCostMultiplier("codex", `${id}-high`, "fast"), 2);
    const cost = computeCostFromPricing(
      pricing.cx[id],
      { input: 300000, output: 1000 },
      { provider: "codex", model: id }
    );
    assert.ok(Math.abs(cost - (300000 * input * 2 + 1000 * output * 1.5) / 1000000) < 1e-12);
  }
  assert.equal(pricing.cx["gpt-6.1-sol"].cached, 0.1);
});
