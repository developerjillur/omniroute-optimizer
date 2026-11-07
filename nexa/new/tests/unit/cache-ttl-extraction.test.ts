import assert from "node:assert/strict";
import test from "node:test";
import { rawUsage } from "../helpers/cacheTtlFixture.ts";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "cache-ttl-extraction-"));
process.env.DISABLE_SQLITE_AUTO_BACKUP = "true";

const { extractUsage, normalizeUsage } = await import("../../open-sse/utils/usageTracking.ts");
const { extractUsageFromResponse } = await import("../../open-sse/handlers/usageExtractor.ts");
const core = await import("../../src/lib/db/core.ts");
test.after(() => core.resetDbInstance());

test("non-streaming and streamed extraction retain TTL without changing native wire counters", () => {
  const before = structuredClone(rawUsage);
  const direct = extractUsageFromResponse({ type: "message", usage: rawUsage }, "claude");
  const streamed = extractUsage({ type: "message_delta", usage: rawUsage });
  for (const result of [direct, streamed, normalizeUsage(direct)]) {
    assert.equal(result?.prompt_tokens, 112);
    assert.equal(result?.completion_tokens, 7);
    assert.equal(result?.cache_creation_input_tokens, 100);
    assert.equal(result?.cacheCreation5m, 40);
    assert.equal(result?.cacheCreation1h, 60);
    assert.equal(result?.reasoning_tokens, 5);
  }
  assert.deepEqual(rawUsage, before);
});

test("OpenAI-shaped metering retains TTL metadata through both extraction paths", () => {
  const usage = {
    prompt_tokens: 112,
    completion_tokens: 7,
    cache_creation_input_tokens: 100,
    cache_creation: rawUsage.cache_creation,
  };
  for (const result of [
    extractUsage({ usage }),
    extractUsageFromResponse({ usage }, "fixture-provider"),
  ]) {
    assert.equal(result?.cacheCreation5m, 40);
    assert.equal(result?.cacheCreation1h, 60);
  }
});
