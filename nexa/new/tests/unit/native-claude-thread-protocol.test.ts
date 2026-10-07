import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isNativeClaudeThreadRequest,
  isNativeClaudeThreadContinuation,
  captureNativeClaudeThreadFields,
  restoreNativeClaudeThreadFields,
  nativeClaudeThreadBeta,
  observeNativeClaudeThreadResponse,
} from "../../open-sse/services/nativeClaudeThread.ts";

test("a sparse continuation keeps the server-owned tool result and system directive", () => {
  const original = {
    thread: { type: "continue", previous_message_id: "msg_fixture_parent" },
    system: [{ type: "text", text: "unchanged", cache_control: { type: "ephemeral" } }],
    messages: [
      {
        role: "user",
        content: [{ type: "tool_result", tool_use_id: "toolu_parent", content: "result" }],
      },
      { role: "system", content: [{ type: "text", text: "new directive" }] },
    ],
    tools: [{ name: "Read", input_schema: { type: "object" } }],
  };
  const snapshot = captureNativeClaudeThreadFields(original);
  const transformed: Record<string, unknown> = {
    ...original,
    model: "claude-sonnet-5-5",
    metadata: { user_id: "selected-account" },
    system: [{ type: "text", text: "incorrectly hoisted directive" }],
    messages: [],
    cache_control: { type: "ephemeral", ttl: "1h" },
  };
  restoreNativeClaudeThreadFields(transformed, snapshot);
  assert.deepEqual(transformed.messages, original.messages);
  assert.deepEqual(transformed.system, original.system);
  assert.equal("cache_control" in transformed, false);
  assert.equal(transformed.model, "claude-sonnet-5-5");
  assert.deepEqual(transformed.metadata, { user_id: "selected-account" });
});

test("a native create preserves implicit TTL, automatic cache and native tool schemas", () => {
  const original = {
    thread: { type: "create" },
    cache_control: { type: "ephemeral" },
    system: [{ type: "text", text: "native" }],
    tools: [{ name: "Read", cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: "start" }],
    output_config: { effort: "max" },
  };
  const snapshot = captureNativeClaudeThreadFields(original);
  original.tools[0].name = "mutated";
  const transformed: Record<string, unknown> = { model: "claude-opus-5-5" };
  restoreNativeClaudeThreadFields(transformed, snapshot);
  assert.deepEqual(transformed.cache_control, { type: "ephemeral" });
  assert.equal((transformed.tools as typeof original.tools)[0].name, "Read");
  assert.deepEqual(transformed.output_config, { effort: "max" });
});

test("native beta negotiation stays identical on create and sparse continuation", () => {
  const headers = {
    "Anthropic-Beta":
      "message-threads-2026-08-12,mid-conversation-output-config-2026-07-01,oauth-2025-04-20",
  };
  assert.equal(nativeClaudeThreadBeta(headers), headers["Anthropic-Beta"]);
  assert.equal(
    nativeClaudeThreadBeta({ "anthropic-beta": "message-threads-2026-08-12" }),
    "message-threads-2026-08-12,oauth-2025-04-20"
  );
  assert.equal(nativeClaudeThreadBeta({}), null);
});

test("only an explicit native thread contract bypasses full-history repairs", () => {
  assert.equal(isNativeClaudeThreadRequest({ thread: { type: "create" } }), true);
  assert.equal(
    isNativeClaudeThreadContinuation({
      thread: { type: "continue", previous_message_id: "msg_valid" },
    }),
    true
  );
  assert.equal(
    isNativeClaudeThreadContinuation({ diagnostics: { previous_message_id: "msg_valid" } }),
    false
  );
  assert.equal(isNativeClaudeThreadRequest({ thread: { type: "continue" } }), false);
  assert.equal(isNativeClaudeThreadRequest({ thread: { type: "unknown" } }), false);
});

test("SSE ownership observation forwards exact bytes and handles split frames", async () => {
  const chunks = [
    "event: message_sta",
    'rt\ndata: {"type":"message_start","message":{"id":"msg_owned"}}\n',
    "\nevent: message_delta\ndata: {}\n\n",
  ];
  const observed: string[] = [];
  const response = observeNativeClaudeThreadResponse(
    new Response(
      new ReadableStream({
        start(c) {
          chunks.forEach((s) => c.enqueue(new TextEncoder().encode(s)));
          c.close();
        },
      }),
      { headers: { "content-type": "text/event-stream", "x-test": "keep" } }
    ),
    (id) => observed.push(id)
  );
  assert.equal(await response.text(), chunks.join(""));
  assert.deepEqual(observed, ["msg_owned"]);
  assert.equal(response.headers.get("x-test"), "keep");
});

test("ownership observation is bounded and ignores errors and tool ids", async () => {
  const observed: string[] = [];
  for (const response of [
    new Response('{"id":"msg_error"}', { status: 400 }),
    new Response('data: {"type":"content_block_start","content_block":{"id":"toolu_x"}}\n\n', {
      headers: { "content-type": "text/event-stream" },
    }),
    new Response("x".repeat(70_000), { headers: { "content-type": "text/event-stream" } }),
  ])
    await observeNativeClaudeThreadResponse(response, (id) => observed.push(id)).text();
  assert.deepEqual(observed, []);
});

test("non-streaming ownership uses only an Anthropic message id", async () => {
  const observed: string[] = [];
  const response = observeNativeClaudeThreadResponse(
    new Response('{"id":"msg_json","content":[]}'),
    (id) => observed.push(id)
  );
  assert.equal(await response.text(), '{"id":"msg_json","content":[]}');
  assert.deepEqual(observed, ["msg_json"]);
});

test("a large first SSE chunk still records its small message-start envelope", async () => {
  const body =
    'data: {"type":"message_start","message":{"id":"msg_large"}}\n\n' + "x".repeat(70_000);
  const ids: string[] = [];
  assert.equal(
    await observeNativeClaudeThreadResponse(
      new Response(body, { headers: { "content-type": "text/event-stream" } }),
      (id) => ids.push(id)
    ).text(),
    body
  );
  assert.deepEqual(ids, ["msg_large"]);
});

test("nested and escaped JSON ids never become a thread owner", async () => {
  const ids: string[] = [];
  const body = JSON.stringify({
    content: [{ id: "msg_nested" }],
    text: '"id":"msg_escaped"',
    id: "msg_root",
  });
  await observeNativeClaudeThreadResponse(new Response(body), (id) => ids.push(id)).text();
  assert.deepEqual(ids, ["msg_root"]);
});
