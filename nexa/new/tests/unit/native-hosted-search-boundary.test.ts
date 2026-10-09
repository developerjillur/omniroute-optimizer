import test from "node:test";
import assert from "node:assert/strict";
import { nativeHostedSearchFallbackError } from "../../open-sse/utils/nativeHostedSearch.ts";

const native = { "user-agent": "claude-cli/2.1.294 (external, cli)" };
const server = { type: "web_search_20260209", name: "web_search", max_uses: 1 };
const client = {
  name: "WebSearch",
  input_schema: { type: "object", properties: { query: { type: "string" } } },
};

test("native hosted search fails clearly before unsupported fallback dispatch", () => {
  const message = nativeHostedSearchFallbackError({ tools: [server] }, native, "claude");
  assert.match(message || "", /Native WebSearch requires Anthropic server search result blocks/);
  assert.match(message || "", /before provider dispatch/);
});

test("client-side WebSearch remains available on mapped targets", () => {
  assert.equal(nativeHostedSearchFallbackError({ tools: [client] }, native, "claude"), null);
});

test("a custom function named web_search is not mistaken for a hosted server tool", () => {
  assert.equal(
    nativeHostedSearchFallbackError(
      { tools: [{ ...client, name: "web_search", type: "web_search" }] },
      native,
      "claude"
    ),
    null
  );
});

test("programmatic Anthropic clients retain the existing fallback behavior", () => {
  assert.equal(nativeHostedSearchFallbackError({ tools: [server] }, {}, "claude"), null);
});

test("Responses clients retain existing hosted search support", () => {
  assert.equal(
    nativeHostedSearchFallbackError({ tools: [server] }, native, "openai-responses"),
    null
  );
});

test("normal native WebFetch summary and malformed tool arrays are untouched", () => {
  for (const tools of [undefined, null, "web_search", [], [null, 1, []], [client]]) {
    assert.equal(nativeHostedSearchFallbackError({ tools }, native, "claude"), null);
  }
});

test("versioned hosted tool declaration is recognized with Headers as well", () => {
  assert.ok(nativeHostedSearchFallbackError({ tools: [server] }, new Headers(native), "claude"));
});

test("unrelated server tools are not blocked", () => {
  assert.equal(
    nativeHostedSearchFallbackError(
      { tools: [{ type: "advisor_20260301", name: "advisor" }] },
      native,
      "claude"
    ),
    null
  );
});
