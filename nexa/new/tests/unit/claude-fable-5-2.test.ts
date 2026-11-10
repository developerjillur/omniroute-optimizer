import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import {
  getModelsByProviderId,
  getModelTargetFormat,
  supportsClaudeMaxEffort,
  supportsXHighEffort,
} from "../../open-sse/config/providerModels.ts";
import { getUnsupportedParams } from "../../open-sse/config/providerRegistry.ts";
import {
  modelHasNativeContext1m,
  modelRequiresPreservedThinkingPrefix,
} from "../../open-sse/config/claudeCodeCompatibleIdentity.ts";
import { modelSupportsContext1mBeta } from "../../open-sse/config/context1m.ts";
import { normalizeClaudeAdaptiveThinking } from "../../open-sse/services/claudeAdaptiveThinking.ts";
import { getModelPricing } from "../../open-sse/services/providerCostData.ts";
import { buildClaudePassthroughBody } from "../../open-sse/handlers/chatCore/claudePassthroughBody.ts";
import { executeWithAnthropicThinkingSignatureRecovery } from "../../open-sse/handlers/chatCore/passthroughHelpers.ts";
import {
  resolveEffectiveServiceTier,
  resolveReportedServiceTier,
} from "../../open-sse/handlers/chatCore/serviceTier.ts";
import { computeCostFromPricing } from "../../src/lib/usage/costCalculator.ts";
import { getDefaultPricing } from "../../src/shared/constants/pricing.ts";
import {
  getModelSpec,
  normalizeForcedToolChoiceForModel,
  normalizeThinkingForModel,
} from "../../src/shared/constants/modelSpecs.ts";

const MODEL = "claude-fable-5-2";
const EFFORTS = ["low", "medium", "high", "xhigh", "max"];
const require = createRequire(import.meta.url);
const bridge = require("../../src/mitm/_internal/claudeModels.cjs");

test("Fable 5.2 is discoverable on verified Claude surfaces with exact native limits", () => {
  for (const provider of [
    "claude",
    "anthropic",
    "claude-web",
    "bedrock",
    "vertex",
    "vertex-partner",
  ]) {
    const id = provider === "bedrock" ? `anthropic.${MODEL}` : MODEL;
    const row = getModelsByProviderId(provider).find((entry) => entry.id === id);
    assert.ok(row, `${provider}/${id}`);
    if (provider.startsWith("vertex")) {
      assert.equal(getModelTargetFormat(provider, id), "claude");
    } else {
      assert.equal(row.contextLength, 1_000_000);
      assert.equal(row.maxOutputTokens, 128_000);
      assert.deepEqual(row.supportedThinkingEfforts, EFFORTS);
    }
  }
  for (const provider of ["github", "ghe-copilot", "kiro", "cursor", "cursor-api"]) {
    assert.equal(
      getModelsByProviderId(provider).some((entry) => entry.id === MODEL),
      false
    );
  }
  for (const id of [MODEL, `cc/${MODEL}`, `global.anthropic.${MODEL}`, "claude-fable-5.2"]) {
    assert.equal(modelHasNativeContext1m(id), true, id);
    assert.equal(modelRequiresPreservedThinkingPrefix(id), true, id);
  }
  for (const id of ["claude-fable-5-1", "claude-fable-5-20", "gpt-6.1-sol"]) {
    assert.equal(modelRequiresPreservedThinkingPrefix(id), false, id);
  }
  assert.equal(modelSupportsContext1mBeta(MODEL), false);
  assert.equal(supportsXHighEffort("claude", MODEL), true);
  assert.equal(supportsClaudeMaxEffort(MODEL), true);
  assert.deepEqual(bridge.resolveClaudeMapping(`cc/${MODEL}`, {}), { model: `cc/${MODEL}` });
  assert.equal(bridge.resolveClaudeMapping(MODEL, { [MODEL]: "cx/gpt-6.1-sol" }), "cx/gpt-6.1-sol");
});

test("Fable 5.2 advertises adaptive thinking, vision and tools without unsupported sampling", () => {
  const spec = getModelSpec(MODEL);
  assert.equal(spec?.contextWindow, 1_000_000);
  assert.equal(spec?.maxOutputTokens, 128_000);
  for (const key of [
    "supportsThinking",
    "supportsTools",
    "supportsVision",
    "adaptiveThinkingOnly",
    "rejectsThinkingDisabled",
    "rejectsForcedToolChoice",
  ] as const) {
    assert.equal(spec?.[key], true, key);
  }
  assert.equal(getModelSpec(`global.anthropic.${MODEL}`), spec);
  for (const provider of ["claude", "anthropic"]) {
    for (const param of ["temperature", "top_p", "top_k"]) {
      assert.ok(getUnsupportedParams(provider, MODEL).includes(param), `${provider}/${param}`);
    }
  }
  assert.equal(
    "thinking" in normalizeThinkingForModel({ thinking: { type: "disabled" } }, MODEL),
    false
  );
  assert.deepEqual(
    normalizeClaudeAdaptiveThinking({ thinking: { type: "enabled", budget_tokens: 64000 } }, MODEL)
      .thinking,
    { type: "adaptive" }
  );
  const tools = [{ name: "Read", input_schema: { type: "object" } }];
  const normalized = normalizeForcedToolChoiceForModel(
    { tools, tool_choice: { type: "tool", name: "Read" } },
    MODEL
  );
  assert.equal("tool_choice" in normalized, false);
  assert.equal(normalized.tools, tools);
});

for (const effort of EFFORTS) {
  test(`native Fable 5.2 preserves its complete signed prefix and ${effort} effort`, () => {
    const body = {
      model: MODEL,
      system: [
        { type: "text", text: "stable system", cache_control: { type: "ephemeral", ttl: "1h" } },
      ],
      tools: [{ type: "computer_toolset_20260801" }, { type: "advisor_20260301", model: MODEL }],
      messages: [
        { role: "user", content: "start" },
        {
          role: "assistant",
          content: [
            { type: "thinking", thinking: "", signature: "fixture-signed-empty" },
            { type: "text", text: "retained answer" },
          ],
        },
        { role: "user", content: "continue" },
      ],
      output_config: { effort },
      speed: "fast",
      cache_control: { type: "ephemeral", ttl: "1h" },
    };
    const before = structuredClone(body);
    for (const provider of ["claude", "anthropic"]) {
      const result = buildClaudePassthroughBody({
        body,
        provider,
        clientHeaders: { "x-app": "cli" },
        isClaudeCodeSemanticPassthrough: true,
        effectiveModel: MODEL,
        targetFormat: "claude",
        preserveCacheControl: true,
        normalizeClaudeUpstreamMessages: () => {
          throw new Error("native prefix normalization");
        },
        applyReasoningRuleDirective: () => {
          throw new Error("native prefix rewrite");
        },
      });
      const { _disableToolPrefix, ...wire } = result;
      assert.equal(_disableToolPrefix, true);
      assert.deepEqual(wire, before);
      assert.deepEqual(body, before);
      assert.notEqual(wire.messages, body.messages);
    }
  });
}

for (const message of [
  "messages.1.content.0: Invalid `signature` in `thinking` block",
  "messages.1.content.0: `thinking` or `redacted_thinking` blocks in the latest assistant message cannot be modified",
  "prefix_binding_mismatch: preserved thinking prefix does not match",
]) {
  test(`Fable 5.2 does not remove thinking or replay a rejected prefix: ${message}`, async () => {
    const body = {
      messages: [
        {
          role: "assistant",
          content: [{ type: "thinking", thinking: "", signature: "fixture-original" }],
        },
      ],
    };
    const before = structuredClone(body);
    let attempts = 0;
    const failure = { status: 400, message };
    const result = await executeWithAnthropicThinkingSignatureRecovery({
      provider: "claude",
      model: MODEL,
      body,
      execute: async (sent) => {
        attempts++;
        assert.equal(sent, body);
        return failure;
      },
      getError: (response) => response,
    });
    assert.equal(attempts, 1);
    assert.equal(result.result, failure);
    assert.equal(result.retried, false);
    assert.equal(result.recoveryBody, null);
    assert.deepEqual(body, before);
  });
}

test("Fable 5.2 prices standard and reported fast usage with separate 5m and 1h cache writes", () => {
  for (const provider of ["anthropic", "cc"]) {
    const price = getDefaultPricing()[provider][MODEL];
    assert.deepEqual(
      [price.input, price.output, price.cached, price.cache_creation, price.cache_creation_1h],
      [8, 40, 0.2, 10, 16]
    );
    const tokens = {
      input: 1000,
      cached_tokens: 500,
      cache_creation_input_tokens: 300,
      cache_creation: { ephemeral_5m_input_tokens: 100, ephemeral_1h_input_tokens: 200 },
      output: 100,
    };
    const options = { provider, model: MODEL, serviceTier: "standard" };
    const standard = computeCostFromPricing(price, tokens, options);
    const expected = (200 * 8 + 500 * 0.2 + 100 * 10 + 200 * 16 + 100 * 40) / 1_000_000;
    assert.ok(Math.abs(standard - expected) < 1e-12);
    assert.ok(
      Math.abs(
        computeCostFromPricing(price, tokens, { ...options, serviceTier: "fast" }) - expected * 2
      ) < 1e-12
    );
    assert.equal(
      computeCostFromPricing(
        price,
        { ...tokens, cost_usd: 0.123 },
        { ...options, serviceTier: "fast" }
      ),
      0.123
    );
  }
  assert.deepEqual(getModelPricing("anthropic", MODEL), {
    inputCostPer1M: 8,
    outputCostPer1M: 40,
    isFree: false,
    isEstimated: false,
  });
});

test("reported Claude speed overrides the requested estimate without altering Codex tiers", () => {
  assert.equal(resolveEffectiveServiceTier("claude", {}, { speed: "fast" }), "fast");
  assert.equal(resolveEffectiveServiceTier("claude", {}, {}), "standard");
  assert.equal(resolveReportedServiceTier("claude", { usage: { speed: "standard" } }), "standard");
  assert.equal(
    resolveReportedServiceTier("claude", {
      type: "message_start",
      message: { usage: { speed: "fast" } },
    }),
    "fast"
  );
  assert.equal(resolveReportedServiceTier("claude", { usage: {} }), null);
  assert.equal(resolveReportedServiceTier("codex", { service_tier: "priority" }), "priority");
  assert.equal(resolveReportedServiceTier("unrelated", { usage: { speed: "fast" } }), null);
});
