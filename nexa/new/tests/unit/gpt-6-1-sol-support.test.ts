import test from "node:test";
import assert from "node:assert/strict";

import { codexProvider } from "../../open-sse/config/providers/registry/codex/index.ts";
import { CodexExecutor } from "../../open-sse/executors/codex.ts";
import {
  getCodexAliasEffortCap,
  splitCodexReasoningSuffix,
} from "../../open-sse/executors/codex/reasoningSuffix.ts";
import { DEFAULT_CODEX_CLIENT_VERSION } from "../../src/shared/constants/codexClient.ts";

const model = "gpt-6.1-sol";
const efforts = ["low", "medium", "high", "xhigh", "max", "ultra"] as const;

test("GPT 6.1 Sol is a native Codex model with its verified context and vision capabilities", () => {
  const entry = codexProvider.models?.find((candidate) => candidate.id === model);
  assert.ok(entry);
  assert.equal(entry.contextLength, 872000);
  assert.equal(entry.maxInputTokens, 872000);
  assert.equal(entry.supportsVision, true);
  assert.equal(entry.toolCalling, true);
  assert.equal(entry.targetFormat, "openai-responses");
  assert.deepEqual(entry.supportedThinkingEfforts, efforts);
});

test("native GPT 6.1 Sol ids route to Codex while explicit provider prefixes still win", async () => {
  const { createProviderConnection } = await import("../../src/lib/db/providers.ts");
  await createProviderConnection({
    provider: "codex",
    authType: "oauth",
    email: "codex@example.com",
  });
  const { CODEX_NATIVE_UNPREFIXED_MODELS, getModelInfoCore } =
    await import("../../open-sse/services/model.ts");
  for (const id of [model, ...efforts.map((effort) => `${model}-${effort}`)]) {
    assert.equal(CODEX_NATIVE_UNPREFIXED_MODELS.has(id), true);
    const resolved = await getModelInfoCore(id, null);
    assert.equal(resolved.provider, "codex");
    assert.equal(resolved.model, id);
  }
  const explicit = await getModelInfoCore(`openai/${model}`, null);
  assert.equal(explicit.provider, "openai");
});

test("all six GPT 6.1 Sol effort aliases resolve to the same base model", () => {
  for (const effort of efforts) {
    assert.ok(codexProvider.models?.some((candidate) => candidate.id === `${model}-${effort}`));
    assert.deepEqual(splitCodexReasoningSuffix(`${model}-${effort}`), {
      baseModel: model,
      effort,
    });
  }
  assert.equal(getCodexAliasEffortCap(model), "ultra");
  assert.deepEqual(splitCodexReasoningSuffix(`${model}(ultra)`), {
    baseModel: model,
    effort: "ultra",
  });
  assert.equal(getCodexAliasEffortCap("gpt-6.1-unverified"), null);
});

test("explicit GPT 6.1 Sol max effort is preserved on the upstream request", () => {
  const executor = new CodexExecutor();
  const body = executor.transformRequest(
    model,
    { model, input: [], reasoning: { effort: "max" } },
    true,
    { requestEndpointPath: "/v1/responses" }
  ) as { model: string; reasoning: { effort: string } };
  assert.equal(body.model, model);
  assert.equal(body.reasoning.effort, "max");
});

test("GPT 6.1 Sol ultra alias uses upstream max without changing the model", () => {
  const executor = new CodexExecutor();
  const body = executor.transformRequest(
    `${model}-ultra`,
    { model: `${model}-ultra`, input: [], reasoning: { effort: "low" } },
    true,
    { requestEndpointPath: "/v1/responses" }
  ) as { model: string; reasoning: { effort: string } };
  assert.equal(body.model, model);
  assert.equal(body.reasoning.effort, "max");
});

test("Codex default identity supports the verified client and still forwards later native versions", () => {
  const parts = DEFAULT_CODEX_CLIENT_VERSION.split(".").map(Number);
  assert.ok(parts[0] > 0 || parts[1] >= 160);
  const executor = new CodexExecutor();
  const headers = executor.buildHeaders({ accessToken: "test-token" }, true, {
    "user-agent": "codex_cli_rs/0.161.0",
  });
  assert.equal(headers.Version, "0.161.0");
});
