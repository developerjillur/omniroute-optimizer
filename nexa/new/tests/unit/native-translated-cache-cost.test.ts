import assert from "node:assert/strict";
import test from "node:test";
import { claudeToOpenAIResponse } from "../../open-sse/translator/response/claude-to-openai.ts";
import { computeCostFromPricing } from "../../src/lib/usage/costCalculator.ts";
import { rawUsage } from "../helpers/cacheTtlFixture.ts";

const record = (value: unknown): Record<string, unknown> => value && typeof value === "object"
  ? value as Record<string, unknown> : {};

test("translated native cache writes remain inclusive and retain their TTL cost without double billing", () => {
  const before = structuredClone(rawUsage);
  const state = { toolCalls: new Map(), toolNameMap: new Map() };
  claudeToOpenAIResponse({ type:"message_start", message:{id:"msg_cost_fixture", model:"fixture-model", usage:rawUsage} }, state);
  claudeToOpenAIResponse({ type:"message_delta", delta:{stop_reason:"end_turn"}, usage:{output_tokens:7} }, state);
  const chunks = claudeToOpenAIResponse({type:"message_stop"}, state);
  const frame = (Array.isArray(chunks) ? chunks : [chunks]).find((chunk) => record(chunk).usage);
  const usage = record(record(frame).usage);
  assert.equal(usage.prompt_tokens,112);
  assert.equal(record(usage.prompt_tokens_details).cache_creation_tokens,100);
  assert.equal(record(usage.prompt_tokens_details).cache_creation_in_prompt,true);
  assert.equal(usage.cacheCreation5m,40);
  assert.equal(usage.cacheCreation1h,60);
  const cost = computeCostFromPricing({input:2,output:10,cached:0.2,cache_creation:2.5,cache_creation_1h:4},usage,{provider:"claude"});
  assert.ok(Math.abs(cost-0.000416)<1e-12,`native translated cost: ${cost}`);
  assert.deepEqual(rawUsage,before);
});
