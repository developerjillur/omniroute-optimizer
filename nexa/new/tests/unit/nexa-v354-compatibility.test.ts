import assert from "node:assert/strict";
import test from "node:test";
import { cacheCreationFields, readCacheWriteUsage } from "../../open-sse/utils/cacheWriteUsage.ts";
import {
  getAnthropicMeteredUsage,
  mergeAnthropicUsage,
  normalizeAnthropicUsage,
} from "../../open-sse/utils/anthropicUsage.ts";
import { computeCCH, signRequestBody } from "../../open-sse/services/claudeCodeCCH.ts";
import { canResendAfterTransportError } from "../../open-sse/utils/proxyFetchTransportSupport.ts";

test("retained internal TTL receipts survive the new cache-write reader", () => {
  const usage = { cache_creation_input_tokens: 1000, cacheCreation5m: 600, cacheCreation1h: 400 };
  assert.deepEqual(readCacheWriteUsage(usage), {
    total: 1000,
    fiveMinute: 600,
    oneHour: 400,
    unknown: 0,
    status: "reported",
  });
  assert.deepEqual(cacheCreationFields(usage), {
    cache_creation_input_tokens: 1000,
    cache_creation: { ephemeral_5m_input_tokens: 600, ephemeral_1h_input_tokens: 400 },
  });
});

test("native nested tier evidence wins over stale internal aliases", () => {
  const usage = {
    cache_creation_input_tokens: 1000,
    cacheCreation5m: 600,
    cacheCreation1h: 400,
    cache_creation: { ephemeral_5m_input_tokens: 0, ephemeral_1h_input_tokens: 1000 },
  };
  const actual = readCacheWriteUsage(usage);
  assert.equal(actual.fiveMinute, 0);
  assert.equal(actual.oneHour, 1000);
  assert.equal(actual.status, "reported");
});

test("unknown, inconsistent and invalid tier evidence stays distinguishable", () => {
  assert.equal(readCacheWriteUsage({}).total, null);
  assert.equal(readCacheWriteUsage({ cache_creation_input_tokens: 1000 }).status, "unknown");
  assert.equal(
    readCacheWriteUsage({ cache_creation_input_tokens: 100, cacheCreation1h: 101 }).status,
    "inconsistent"
  );
  assert.equal(
    readCacheWriteUsage({ cache_creation_input_tokens: 100, cacheCreation1h: "100" }).status,
    "invalid"
  );
});

test("native usage keeps both tier representations and counts each token once", () => {
  const original = {
    input_tokens: 20,
    cache_read_input_tokens: 30,
    cache_creation_input_tokens: 100,
    output_tokens: 7,
    cache_creation: { ephemeral_5m_input_tokens: 60, ephemeral_1h_input_tokens: 40 },
  };
  const snapshot = structuredClone(original);
  const normalized = normalizeAnthropicUsage(original);
  assert.equal(normalized.prompt_tokens, 150);
  assert.equal(normalized.cache_creation_input_tokens, 100);
  assert.equal(normalized.cacheCreation5m, 60);
  assert.equal(normalized.cacheCreation1h, 40);
  assert.deepEqual(normalized.cache_creation, original.cache_creation);
  assert.deepEqual(original, snapshot);
});

test("cumulative explicit zero and partial tier receipts are retained", () => {
  const first = {
    input_tokens: 20,
    output_tokens: 7,
    cache_read_input_tokens: 30,
    cache_creation_input_tokens: 100,
    cache_creation: { ephemeral_5m_input_tokens: 60, ephemeral_1h_input_tokens: 40 },
  };
  const merged = mergeAnthropicUsage(first, {
    output_tokens: 0,
    cache_creation: { ephemeral_5m_input_tokens: 0 },
  });
  const normalized = normalizeAnthropicUsage(merged);
  assert.equal(normalized.output_tokens, 0);
  assert.equal(normalized.prompt_tokens, 150);
  assert.equal(normalized.cacheCreation5m, 0);
  assert.equal(normalized.cacheCreation1h, 40);
});

test("compaction iterations keep native tier totals and inclusive input", () => {
  const usage = getAnthropicMeteredUsage({
    input_tokens: 1,
    output_tokens: 1,
    iterations: [
      {
        type: "compaction",
        input_tokens: 10,
        output_tokens: 2,
        cache_read_input_tokens: 20,
        cache_creation_input_tokens: 30,
        cache_creation: { ephemeral_5m_input_tokens: 30 },
      },
      {
        type: "message",
        input_tokens: 40,
        output_tokens: 5,
        cache_read_input_tokens: 50,
        cache_creation_input_tokens: 60,
        cache_creation: { ephemeral_1h_input_tokens: 60 },
      },
    ],
  });
  const normalized = normalizeAnthropicUsage(usage);
  assert.equal(normalized.prompt_tokens, 210);
  assert.equal(normalized.output_tokens, 7);
  assert.equal(normalized.cache_creation_input_tokens, 90);
  assert.equal(normalized.cacheCreation5m, 30);
  assert.equal(normalized.cacheCreation1h, 60);
});

test("billing-token re-signing is idempotent and leaves user text untouched", async () => {
  const body = {
    messages: [{ role: "user", content: "x-anthropic-billing-header: cch=00000;" }],
    system: [{ type: "text", text: "x-anthropic-billing-header: cc_version=fixture; cch=abcde;" }],
    model: "claude-fable-5-2",
  };
  const unsigned = structuredClone(body);
  unsigned.system[0].text = unsigned.system[0].text.replace("cch=abcde;", "cch=00000;");
  const expected = await computeCCH(new TextEncoder().encode(JSON.stringify(unsigned)));
  const signed = await signRequestBody(JSON.stringify(body));
  const actual = JSON.parse(signed);
  assert.deepEqual(actual.messages, body.messages);
  assert.equal(actual.system[0].text, body.system[0].text.replace("abcde", expected));
  assert.equal(await signRequestBody(signed), signed);
  assert.equal(await signRequestBody(JSON.stringify(unsigned)), signed);
});

test("non-billing user and system text never become signing targets", async () => {
  const body = JSON.stringify({
    messages: [{ role: "user", content: "cch=00000;" }],
    system: [{ type: "text", text: "Reference example: cch=00000;" }],
  });
  assert.equal(await signRequestBody(body), body);
});

test("generation writes never replay ambiguous transport failures in either legacy flag mode", () => {
  const previous = process.env.PROXY_STRICT_POST_REPLAY_ENABLED;
  try {
    for (const value of ["true", "false"]) {
      process.env.PROXY_STRICT_POST_REPLAY_ENABLED = value;
      for (const code of ["ECONNRESET", "ETIMEDOUT", "EPIPE", "UND_ERR_SOCKET", "ENETUNREACH"]) {
        assert.equal(
          canResendAfterTransportError(
            "https://example.test/generate",
            { method: "POST", body: "{}" },
            { code }
          ),
          false,
          code
        );
      }
      for (const code of ["ENOTFOUND", "EAI_AGAIN", "ECONNREFUSED"]) {
        assert.equal(
          canResendAfterTransportError(
            "https://example.test/generate",
            { method: "POST", body: "{}" },
            { cause: { code } }
          ),
          true,
          code
        );
      }
      assert.equal(
        canResendAfterTransportError(
          "https://example.test/read",
          { method: "GET" },
          { code: "ECONNRESET" }
        ),
        true
      );
    }
  } finally {
    if (previous === undefined) delete process.env.PROXY_STRICT_POST_REPLAY_ENABLED;
    else process.env.PROXY_STRICT_POST_REPLAY_ENABLED = previous;
  }
});
