import assert from "node:assert/strict";
import test from "node:test";
import { createStructuredSSECollector } from "../../open-sse/utils/streamPayloadCollector.ts";
import { FORMATS } from "../../open-sse/translator/formats.ts";

const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};

function collector() {
  const result = createStructuredSSECollector({ format: FORMATS.CLAUDE, maxEvents: 1, maxBytes: 64 });
  result.push({
    type: "message_start",
    message: { id: "msg_summary_fixture", type: "message", role: "assistant", model: "claude-opus-5-5", content: [], usage: { input_tokens: 2 } },
  });
  return result;
}

test("hidden thinking signature fragments survive retained-event truncation", () => {
  const c = collector();
  c.push({ type: "content_block_start", index: 0, content_block: { type: "thinking", thinking: "", signature: "" } });
  c.push({ type: "content_block_delta", index: 0, delta: { type: "signature_delta", signature: "fixture-" } });
  c.push({ type: "content_block_delta", index: 0, delta: { type: "signature_delta", signature: "signature" } });
  c.push({ type: "content_block_stop", index: 0 });
  c.push({ type: "message_delta", delta: { stop_reason: "refusal", stop_details: { type: "refusal", category: "fixture" } }, usage: { output_tokens: 7 } });
  c.push({ type: "message_stop" });
  const summary = record(c.getSummary());
  assert.equal(summary.type, "message");
  assert.equal(summary.stop_reason, "refusal");
  assert.deepEqual(summary.stop_details, { type: "refusal", category: "fixture" });
  assert.deepEqual(summary.content, [{ type: "thinking", thinking: "", signature: "fixture-signature" }]);
  assert.equal(record(summary.usage).input_tokens, 2);
  assert.equal(record(summary.usage).output_tokens, 7);
});

test("signature deltas cannot replace preceding thinking with an empty text block", () => {
  const c = collector();
  c.push({ type: "content_block_start", index: 0, content_block: { type: "thinking", thinking: "fixture thought" } });
  c.push({ type: "content_block_delta", index: 0, delta: { type: "signature_delta", signature: "fixture-signature" } });
  c.push({ type: "message_delta", delta: { stop_reason: "end_turn" } });
  assert.deepEqual(record(c.getSummary()).content, [{ type: "thinking", thinking: "fixture thought", signature: "fixture-signature" }]);
});

test("an incomplete native summary has no invented end_turn stop reason", () => {
  assert.equal(record(collector().getSummary()).stop_reason, null);
});

test("a stray signature delta cannot destroy a native tool call", () => {
  const c = collector();
  c.push({ type: "content_block_start", index: 0, content_block: { type: "tool_use", id: "toolu_fixture", name: "Read", input: { file_path: "fixture.txt" } } });
  c.push({ type: "content_block_delta", index: 0, delta: { type: "signature_delta", signature: "fixture-stray" } });
  c.push({ type: "message_delta", delta: { stop_reason: "tool_use" } });
  assert.deepEqual(record(c.getSummary()).content, [{ type: "tool_use", id: "toolu_fixture", name: "Read", input: { file_path: "fixture.txt" } }]);
});
