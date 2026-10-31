import assert from "node:assert/strict";
import test from "node:test";
import { rawUsage } from "../helpers/cacheTtlFixture.ts";

const { getCacheCreationTtl, getCacheCreationTtlFields } =
  await import("../../src/lib/usage/cacheCreationTtl.ts");
const { getAnthropicMeteredUsage } = await import("../../open-sse/utils/anthropicUsage.ts");

test("TTL normalization retains partial detail, explicit zero and unknown residual writes", () => {
  assert.deepEqual(getCacheCreationTtl(rawUsage), { cacheCreation5m: 40, cacheCreation1h: 60 });
  assert.deepEqual(
    getCacheCreationTtl({
      input_tokens_details: { cache_write_tokens: 100 },
      cache_creation: rawUsage.cache_creation,
    }),
    { cacheCreation5m: 40, cacheCreation1h: 60 }
  );
  assert.deepEqual(getCacheCreationTtl({ cacheCreation: 100, cacheCreation1h: 60 }), {
    cacheCreation5m: null,
    cacheCreation1h: 60,
  });
  assert.deepEqual(getCacheCreationTtlFields({ cacheCreation: 100, cacheCreation5m: 0 }), {
    cacheCreation5m: 0,
  });
});

test("absent totals, impossible splits and malformed counts do not become known TTL", () => {
  for (const value of [
    { cacheCreation1h: 10 },
    { cacheCreation: NaN, cacheCreation1h: 0 },
    { cacheCreation: "broken", cacheCreation1h: 0 },
    { cacheCreation: 1.5, cacheCreation1h: 1 },
    { cacheCreation: Number.MAX_SAFE_INTEGER + 1, cacheCreation1h: 0 },
    { cacheCreation: 10, cacheCreation5m: 6, cacheCreation1h: 6 },
    { cacheCreation: 10, cacheCreation1h: -1 },
    { cacheCreation: 10, cacheCreation1h: 1.5 },
    { cacheCreation: 10, cacheCreation1h: NaN },
  ])
    assert.deepEqual(getCacheCreationTtlFields(value), {});
});

test("metered compaction iterations keep known TTL while another iteration stays unknown", () => {
  const raw = {
    iterations: [
      { type: "compaction", ...rawUsage },
      {
        type: "message",
        input_tokens: 3,
        output_tokens: 4,
        cache_read_input_tokens: 20,
        cache_creation_input_tokens: 50,
      },
    ],
  };
  const before = structuredClone(raw);
  const result = getAnthropicMeteredUsage(raw);
  assert.equal(result.cache_creation_input_tokens, 150);
  assert.deepEqual(result.cache_creation, rawUsage.cache_creation);
  assert.deepEqual(getCacheCreationTtl(result), { cacheCreation5m: 40, cacheCreation1h: 60 });
  assert.deepEqual(raw, before);
});
