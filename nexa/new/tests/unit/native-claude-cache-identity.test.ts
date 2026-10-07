import test from "node:test";
import assert from "node:assert/strict";
import { nativeClaudeCacheGroup } from "../../open-sse/services/nativeClaudeCacheIdentity.ts";

const body = (prompt = "child task A") => ({
  system: [
    { type: "text", text: "x-anthropic-billing-header: cc_prev_req=one; cch=abcde;" },
    { type: "text", text: "stable native instructions", cache_control: { type: "ephemeral" } },
  ],
  tools: [{ name: "Read", input_schema: { type: "object" } }],
  messages: [{ role: "user", content: [{ type: "text", text: prompt }] }],
});

test("children sharing parent metadata keep separate initial-request groups", () => {
  assert.notEqual(
    nativeClaudeCacheGroup(body(), "parent"),
    nativeClaudeCacheGroup(body("child task B"), "parent")
  );
  assert.notEqual(
    nativeClaudeCacheGroup(body(), "parent"),
    nativeClaudeCacheGroup(body(), "other-parent")
  );
});

test("billing signatures, cache TTL and added turns do not split an existing group", () => {
  const original = body();
  const changed = body();
  changed.system[0].text = "x-anthropic-billing-header: cc_prev_req=two; cch=efabc;";
  Object.assign(changed.system[1].cache_control!, { ttl: "1h" });
  changed.messages.push({ role: "assistant", content: [{ type: "text", text: "answer" }] });
  assert.equal(
    nativeClaudeCacheGroup(original, "parent"),
    nativeClaudeCacheGroup(changed, "parent")
  );
});

test("a sparse server-owned tool result has no invented full-history cache identity", () => {
  assert.equal(
    nativeClaudeCacheGroup(
      { messages: [{ role: "user", content: [{ type: "tool_result", content: "result" }] }] },
      "parent"
    ),
    null
  );
  assert.equal(nativeClaudeCacheGroup(body(), null), null);
});
