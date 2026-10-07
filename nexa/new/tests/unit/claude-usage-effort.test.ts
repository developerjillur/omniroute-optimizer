import { test } from "node:test";
import assert from "node:assert/strict";
import {
  readRequestedEffort,
  readCacheCreationTtl,
} from "../../src/lib/usage/claudeUsageDetails.ts";

test("native, per-message and OpenAI effort are observable without encrypted thinking", () => {
  assert.equal(readRequestedEffort({ output_config: { effort: "max" } }), "max");
  assert.equal(readRequestedEffort({ reasoning_effort: "high" }), "high");
  assert.equal(readRequestedEffort({ reasoning: { effort: "low" } }), "low");
  assert.equal(
    readRequestedEffort({
      output_config: { effort: "high" },
      messages: [{ output_config: { effort: "max" } }, { content: "continue" }],
    }),
    "max"
  );
  assert.equal(readRequestedEffort({}), null);
  assert.equal(readRequestedEffort({ output_config: { effort: "secret-invalid-value" } }), null);
});

test("TTL counters come from provider usage and missing evidence remains unknown", () => {
  assert.deepEqual(
    readCacheCreationTtl({
      cache_creation: {
        ephemeral_5m_input_tokens: 100,
        ephemeral_1h_input_tokens: 40,
      },
    }),
    { cacheCreation5mTokens: 100, cacheCreation1hTokens: 40 }
  );
  assert.deepEqual(readCacheCreationTtl({ cache_creation_input_tokens: 100 }), {
    cacheCreation5mTokens: null,
    cacheCreation1hTokens: null,
  });
  assert.deepEqual(
    readCacheCreationTtl({
      cache_creation: { ephemeral_5m_input_tokens: -1, ephemeral_1h_input_tokens: NaN },
    }),
    { cacheCreation5mTokens: null, cacheCreation1hTokens: null }
  );
  assert.deepEqual(
    readCacheCreationTtl({
      cache_creation: { ephemeral_5m_input_tokens: 0, ephemeral_1h_input_tokens: 0 },
    }),
    { cacheCreation5mTokens: 0, cacheCreation1hTokens: 0 }
  );
});
