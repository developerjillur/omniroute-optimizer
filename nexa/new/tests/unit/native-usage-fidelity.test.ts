import assert from "node:assert/strict";
import { test } from "node:test";
import { FORMATS } from "../../open-sse/translator/formats.ts";
import {
  extractUsage,
  sanitizeProviderUsageForRequest,
  sanitizeUsagePayloadForRequest,
} from "../../open-sse/utils/usageTracking.ts";
import { extractUsageFromResponse } from "../../open-sse/handlers/usageExtractor.ts";
import { claudeToOpenAIResponse } from "../../open-sse/translator/response/claude-to-openai.ts";
import { createSSEStream } from "../../open-sse/utils/stream.ts";
import { hasRenderedContent } from "../../src/lib/usage/callContentProvenance.ts";
import * as attemptLogging from "../../open-sse/handlers/chatCore/attemptLogging.ts";
import {
  getAnthropicMeteredUsage,
  mergeAnthropicUsage,
} from "../../open-sse/utils/anthropicUsage.ts";

const body = {
  model: "claude-sonnet-5-5",
  thread: { type: "continue", previous_message_id: "msg_previous_fixture" },
  messages: [{ role: "user", content: "Continue." }],
};
const usage = {
  input_tokens: 2,
  cache_read_input_tokens: 100_000,
  cache_creation_input_tokens: 4_000,
  output_tokens: 9,
};

test("native Thread continuation keeps provider usage and cache counters by reference", () => {
  assert.equal(sanitizeProviderUsageForRequest(usage, body, FORMATS.CLAUDE), usage);
  const event = { type: "message_start", message: { usage } };
  assert.equal(sanitizeUsagePayloadForRequest(event, body, FORMATS.CLAUDE), false);
  assert.equal(event.message.usage, usage);
});

test("malformed or empty Thread references do not disable the stateless usage guard", () => {
  for (const thread of [
    { type: "continue", previous_message_id: " " },
    { type: "create", previous_message_id: "msg_previous_fixture" },
    { type: "continue" },
  ]) {
    const result = sanitizeProviderUsageForRequest(usage, { ...body, thread }, FORMATS.CLAUDE);
    assert.notEqual(result, usage);
    assert.equal(result?.cache_read_input_tokens, 0);
  }
});

test("native usage iterations meter the complete request without adding thinking twice", () => {
  const raw = {
    ...usage,
    input_tokens: 700,
    cache_read_input_tokens: 0,
    cache_creation_input_tokens: 0,
    output_tokens_details: { thinking_tokens: 3 },
    iterations: [
      {
        type: "compaction",
        input_tokens: 1,
        cache_read_input_tokens: 50_000,
        cache_creation_input_tokens: 0,
        output_tokens: 4,
      },
      { type: "message", ...usage },
    ],
  };
  for (const result of [
    extractUsage({ type: "message_delta", usage: raw }),
    extractUsageFromResponse({ type: "message", usage: raw }, "claude"),
  ]) {
    assert.ok(result && "cache_read_input_tokens" in result);
    assert.equal(result?.prompt_tokens, 154_003);
    assert.equal(result?.completion_tokens, 13);
    assert.equal(result?.cache_read_input_tokens, 150_000);
    assert.equal(result?.cache_creation_input_tokens, 4_000);
    assert.equal(result?.reasoning_tokens, 3);
  }
  assert.equal(raw.input_tokens, 700, "metering must not mutate the native wire payload");
});

test("incomplete or unknown usage iterations do not replace measured top-level counters", () => {
  for (const iterations of [
    [],
    [{ type: "message", input_tokens: 0 }],
    [{ type: "unknown", ...usage }],
  ]) {
    const result = extractUsageFromResponse(
      { type: "message", usage: { ...usage, iterations } },
      "claude"
    );
    assert.equal(result?.prompt_tokens, 104_002);
    assert.equal(result?.completion_tokens, 9);
  }
});

test("metered iterations retain the complete cache TTL split and discard stale snapshots", () => {
  const metered = getAnthropicMeteredUsage({
    iterations: [
      {
        type: "compaction",
        input_tokens: 1,
        cache_read_input_tokens: 50_000,
        cache_creation_input_tokens: 0,
        output_tokens: 4,
      },
      {
        type: "message",
        ...usage,
        cache_creation: { ephemeral_5m_input_tokens: 0, ephemeral_1h_input_tokens: 4_000 },
      },
    ],
  });
  assert.deepEqual(metered.cache_creation, {
    ephemeral_5m_input_tokens: 0,
    ephemeral_1h_input_tokens: 4_000,
  });
  assert.equal(mergeAnthropicUsage(metered, { output_tokens: 14 }).iterations, undefined);
});

test("Claude to OpenAI usage includes cache creation and preserves sparse cumulative input", () => {
  const state = {
    toolCalls: new Map(),
    toolNameMap: new Map(),
    usage: {} as Record<string, number>,
  };
  claudeToOpenAIResponse(
    { type: "message_start", message: { id: "msg_meter", model: body.model, usage } },
    state
  );
  assert.equal(state.usage.prompt_tokens, 104_002);
  claudeToOpenAIResponse(
    { type: "message_delta", usage: { input_tokens: 3, output_tokens: 12 } },
    state
  );
  assert.equal(state.usage.prompt_tokens, 104_003);
  assert.equal(state.usage.cache_read_input_tokens, 100_000);
  assert.equal(state.usage.cache_creation_input_tokens, 4_000);
  assert.equal(state.usage.completion_tokens, 12);
});

test("native stream preserves the exact client usage while retaining cumulative log counters and tool presence", async () => {
  let completed: Record<string, unknown> | undefined;
  const stream = createSSEStream({
    mode: "passthrough",
    sourceFormat: FORMATS.CLAUDE,
    clientResponseFormat: FORMATS.CLAUDE,
    provider: "claude",
    model: body.model,
    body,
    onComplete: (result) => {
      completed = result;
    },
  });
  const events = [
    {
      type: "message_start",
      message: {
        type: "message",
        id: "msg_native_meter",
        role: "assistant",
        model: body.model,
        content: [],
        usage,
      },
    },
    {
      type: "content_block_start",
      index: 0,
      content_block: { type: "tool_use", id: "tool_fixture", name: "read_fixture", input: {} },
    },
    {
      type: "content_block_delta",
      index: 0,
      delta: { type: "input_json_delta", partial_json: "{}" },
    },
    { type: "content_block_stop", index: 0 },
    {
      type: "message_delta",
      delta: { stop_reason: "tool_use" },
      usage: { input_tokens: 3, output_tokens: 12 },
    },
    { type: "message_stop" },
  ];
  const reading = new Response(stream.readable).text();
  const writer = stream.writable.getWriter();
  for (const event of events)
    await writer.write(
      new TextEncoder().encode(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`)
    );
  await writer.close();
  const text = await reading;
  const forwarded = text
    .split("\n")
    .filter((line) => line.startsWith("data: "))
    .map((line) => JSON.parse(line.slice(6)));
  assert.deepEqual(forwarded.find((event) => event.type === "message_start").message.usage, usage);
  assert.deepEqual(forwarded.find((event) => event.type === "message_delta").usage, {
    input_tokens: 3,
    output_tokens: 12,
  });
  const metered = completed?.usage as Record<string, number>;
  assert.equal(metered.prompt_tokens, 104_003);
  assert.equal(metered.cache_read_input_tokens, 100_000);
  assert.equal(metered.cache_creation_input_tokens, 4_000);
  const client = completed?.clientPayload as { summary?: unknown };
  assert.equal(
    hasRenderedContent(client?.summary),
    true,
    "a forwarded native tool call is content, even when the chat summary has no text"
  );
});

test("native server and connector tool blocks are measurable tool content", () => {
  for (const type of ["tool_use", "server_tool_use", "mcp_tool_use"]) {
    assert.equal(
      hasRenderedContent({
        type: "message",
        content: [{ type, id: "tool_fixture", name: "read_fixture", input: {} }],
      }),
      true
    );
  }
});

test("native message IDs can be correlated from direct and streamed client bodies", () => {
  assert.equal(typeof attemptLogging.extractNativeMessageId, "function");
  const native = { type: "message", id: "msg_native_fixture", content: [] };
  assert.equal(attemptLogging.extractNativeMessageId(FORMATS.CLAUDE, native), native.id);
  assert.equal(
    attemptLogging.extractNativeMessageId(FORMATS.CLAUDE, { summary: native }),
    native.id
  );
  assert.equal(attemptLogging.extractNativeMessageId(FORMATS.OPENAI, native), null);
  assert.equal(
    attemptLogging.extractNativeMessageId(FORMATS.CLAUDE, {
      type: "chat.completion",
      id: "chatcmpl_fixture",
    }),
    null
  );
  assert.equal(
    attemptLogging.extractNativeMessageId(FORMATS.CLAUDE, {
      type: "message",
      id: "private-invalid-id",
    }),
    null
  );
});
