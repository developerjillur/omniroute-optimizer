import runTest from "node:test";
import assert from "node:assert/strict";

import { codexProvider } from "../../open-sse/config/providers/registry/codex/index.ts";
import { CodexExecutor } from "../../open-sse/executors/codex.ts";
import { sanitizeReasoningEffortForProvider } from "../../open-sse/executors/base/reasoningEffort.ts";
import {
  getCodexAliasEffortCap,
  splitCodexReasoningSuffix,
} from "../../open-sse/executors/codex/reasoningSuffix.ts";
import { claudeToOpenAIRequest } from "../../open-sse/translator/request/claude-to-openai.ts";
import { normalizeResponsesReasoningEffort } from "../../open-sse/translator/request/openai-responses/helpers.ts";
import { openaiToOpenAIResponsesRequest } from "../../open-sse/translator/request/openai-responses/toResponses.ts";
import { resetDbInstance } from "../../src/lib/db/core.ts";

type JsonRecord = Record<string, unknown>;
let registeredCases = 0;
let executedCases = 0;
function test(name: string, run: () => unknown) {
  registeredCases++;
  return runTest(name, async () => {
    executedCases++;
    await run();
  });
}
type InputFormat = "claude" | "chat" | "responses";

const basicEfforts = ["low", "medium", "high", "xhigh"];
const maxEfforts = [...basicEfforts, "max"];
const ultraEfforts = [...maxEfforts, "ultra"];
const supportedEfforts = {
  "gpt-6.1-sol": ultraEfforts,
  "gpt-6-astra": ultraEfforts,
  "gpt-6-sol": ultraEfforts,
  "gpt-6-luna": maxEfforts,
  "gpt-reserve": maxEfforts,
  "gpt-5.6-sol": ultraEfforts,
  "gpt-5.6-terra": ultraEfforts,
  "gpt-5.6-luna": maxEfforts,
  "gpt-5.5": basicEfforts,
};

const executor = new CodexExecutor();
const formats: InputFormat[] = ["claude", "chat", "responses"];

function wireBody(model: string, effort: string, format: InputFormat): JsonRecord {
  let body: JsonRecord;
  if (format === "responses") {
    body = { model, input: [{ role: "user", content: "Reply OK." }], reasoning: { effort } };
  } else {
    const messages = [{ role: "user", content: "Reply OK." }];
    const chat =
      format === "claude"
        ? claudeToOpenAIRequest(
            model,
            {
              model,
              messages,
              max_tokens: 128,
              thinking: { type: "adaptive" },
              output_config: { effort },
            },
            true
          )
        : { model, messages, reasoning_effort: effort };
    assert.equal(chat.reasoning_effort, effort);
    const translated = openaiToOpenAIResponsesRequest(model, chat, true, null);
    assert.ok(translated && typeof translated === "object" && !Array.isArray(translated));
    body = translated as JsonRecord;
  }
  const transformed = executor.transformRequest(model, body, true, {
    requestEndpointPath: "/v1/responses",
    providerSpecificData: {},
  });
  const sanitized = sanitizeReasoningEffortForProvider(transformed, "codex", model);
  assert.ok(sanitized && typeof sanitized === "object" && !Array.isArray(sanitized));
  return sanitized as JsonRecord;
}

runTest.after(() => {
  resetDbInstance();
  assert.equal(executedCases, registeredCases, "every registered native effort case must execute");
  console.log(`NEXA_EFFORT_COVERAGE_COMPLETE cases=${registeredCases}`);
});

for (const [model, efforts] of Object.entries(supportedEfforts)) {
  for (const effort of efforts) {
    test(`${model} preserves selected ${effort} through all three request formats`, () => {
      for (const format of formats) {
        const body = wireBody(model, effort, format);
        const reasoning = body.reasoning as JsonRecord;
        assert.equal(body.model, model, format);
        assert.equal(reasoning.effort, effort === "ultra" ? "max" : effort, format);
      }
    });
  }
}

for (const entry of codexProvider.models ?? []) {
  const { baseModel, effort } = splitCodexReasoningSuffix(entry.id);
  if (!entry.id.startsWith("gpt-") || !effort) continue;
  test(`fixed target ${entry.id} retains its explicit effort override`, () => {
    for (const format of formats) {
      const body = wireBody(entry.id, "high", format);
      assert.equal(body.model, baseModel, format);
      assert.equal(
        (body.reasoning as JsonRecord).effort,
        effort === "ultra" ? "max" : effort,
        format
      );
    }
  });
}

test("Responses Max normalization uses the same model capabilities as the Codex executor", () => {
  for (const [model, efforts] of Object.entries(supportedEfforts)) {
    if (!efforts.includes("max")) continue;
    assert.ok(getCodexAliasEffortCap(model));
    for (const prefix of ["", "cx/", "codex/"]) {
      for (const suffix of ["", "-low", "-high", "-max", "(max)"]) {
        assert.equal(normalizeResponsesReasoningEffort("max", `${prefix}${model}${suffix}`), "max");
      }
    }
  }
});

test("legacy and unverified models retain their existing safety ceilings", () => {
  for (const model of ["gpt-5.5", "gpt-6.1-unverified", "gpt-unverified"]) {
    assert.equal(getCodexAliasEffortCap(model), null);
    assert.equal(normalizeResponsesReasoningEffort("max", model), "xhigh");
    assert.equal((wireBody(model, "max", "responses").reasoning as JsonRecord).effort, "xhigh");
  }
  for (const model of ["kr/gpt-5.6-sol", "kiro/gpt-5.6-terra-max"]) {
    assert.equal(normalizeResponsesReasoningEffort("max", model), "max");
  }
});

test("other providers retain upstream literal max behavior for unknown models", () => {
  const body = { reasoning: { effort: "max" } };
  assert.deepEqual(sanitizeReasoningEffortForProvider(body, "openai", "gpt-unverified"), body);
});
