import test from "node:test";
import assert from "node:assert/strict";
import { claudeToOpenAIRequest } from "../../open-sse/translator/request/claude-to-openai.ts";
import { translateRequest } from "../../open-sse/translator/index.ts";

const placeholder = {
  name: "DeferredToolPlaceholder",
  description:
    "Reserved placeholder that keeps deferred tool loading active; never call this tool.",
  input_schema: { type: "object", properties: {} },
  defer_loading: true,
};
const search = {
  name: "ToolSearch",
  description: "Fetch schemas for deferred tools.",
  input_schema: {
    type: "object",
    properties: { query: { type: "string" }, max_results: { type: "number" } },
    required: ["query", "max_results"],
    additionalProperties: false,
  },
};
const connector = {
  name: "mcp__higgsfield_bridge__get_host_status",
  description: "Read the existing host connection status.",
  input_schema: { type: "object", properties: {}, additionalProperties: false },
  defer_loading: true,
};
const base = { messages: [{ role: "user", content: "Check the connector status." }] };

function names(body: Record<string, unknown>): string[] {
  return ((body.tools ?? []) as Array<{ name?: string; function?: { name?: string } }>).map(
    (tool) => tool.name ?? tool.function?.name ?? ""
  );
}

function firstToolResult(body: {
  messages: Record<string, unknown>[];
}): Record<string, unknown> & { content: string } {
  const result = body.messages.find((message) => message.role === "tool");
  assert.ok(result);
  assert.equal(typeof result.content, "string");
  return result as Record<string, unknown> & { content: string };
}

test("cross-provider translation omits the native reserved placeholder and keeps real discovery", () => {
  const body = { ...base, tools: [placeholder, search, connector] };
  const original = structuredClone(body);
  const out = claudeToOpenAIRequest("glm-5.3-max", body, true);
  assert.deepEqual(names(out), [search.name, connector.name]);
  assert.deepEqual(body, original, "native input must remain unchanged");
  const tools = out.tools as Array<{ function: { parameters: unknown } }>;
  assert.deepEqual(tools[0].function.parameters, search.input_schema);
  assert.deepEqual(tools[1].function.parameters, connector.input_schema);
});

test("Codex Responses translation never advertises the reserved placeholder as an executable function", () => {
  const out = translateRequest(
    "claude",
    "openai-responses",
    "gpt-6.1-sol",
    { ...base, tools: [placeholder, search, connector] },
    true,
    null,
    "codex"
  );
  assert.deepEqual(names(out), [search.name, connector.name]);
});

test("client tool discovery and tool_reference results survive a follow-up round", () => {
  const out = claudeToOpenAIRequest(
    "gpt-6.1-sol",
    {
      tools: [placeholder, search, connector],
      messages: [
        ...base.messages,
        {
          role: "assistant",
          content: [
            {
              type: "tool_use",
              id: "search_1",
              name: search.name,
              input: { query: `select:${connector.name}`, max_results: 1 },
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: "search_1",
              content: [{ type: "tool_reference", tool_name: connector.name }],
            },
          ],
        },
      ],
    },
    false
  );
  assert.deepEqual(names(out), [search.name, connector.name]);
  const result = firstToolResult(out);
  assert.equal(result.tool_call_id, "search_1");
  assert.match(result.content, /mcp__higgsfield_bridge__get_host_status/);
});

test("a required real client tool remains required when the reserved placeholder is also sent", () => {
  const out = claudeToOpenAIRequest(
    "gpt-6.1-sol",
    { ...base, tools: [placeholder, search], tool_choice: { type: "any" } },
    false
  );
  assert.deepEqual(names(out), [search.name]);
  assert.equal(out.tool_choice, "required");
});

test("an explicitly forced reserved placeholder fails before dispatch", () => {
  assert.throws(
    () =>
      claudeToOpenAIRequest(
        "gpt-6.1-sol",
        {
          ...base,
          tools: [placeholder, search],
          tool_choice: { type: "tool", name: placeholder.name },
        },
        false
      ),
    (error: Error & { statusCode?: number; errorType?: string }) =>
      error.statusCode === 400 &&
      error.errorType === "unsupported_feature" &&
      /ToolSearch/.test(error.message)
  );
});

test("an optional placeholder-only request becomes an ordinary text request", () => {
  const out = claudeToOpenAIRequest(
    "gpt-6.1-sol",
    { ...base, tools: [placeholder], tool_choice: { type: "auto" } },
    false
  );
  assert.equal(out.tools, undefined);
  assert.equal(out.tool_choice, undefined);
});

test("requiring only the non-executable placeholder fails locally", () => {
  assert.throws(
    () =>
      claudeToOpenAIRequest(
        "gpt-6.1-sol",
        {
          ...base,
          tools: [placeholder],
          tool_choice: { type: "any" },
        },
        false
      ),
    (error: Error & { statusCode?: number }) => error.statusCode === 400
  );
});

test("a genuine custom function with the same name is preserved", () => {
  for (const tool of [
    { ...placeholder, defer_loading: false },
    {
      ...placeholder,
      description: "A real custom operation.",
      input_schema: { type: "object", properties: { query: { type: "string" } } },
    },
    { ...placeholder, input_schema: { type: "object", properties: { query: { type: "string" } } } },
  ]) {
    const out = claudeToOpenAIRequest("gpt-6.1-sol", { ...base, tools: [tool, search] }, false);
    assert.deepEqual(names(out), [placeholder.name, search.name]);
  }
});

test("native Anthropic passthrough retains its own deferred-loading sentinel", () => {
  const body = { ...base, tools: [placeholder, search, connector] };
  const out = translateRequest("claude", "claude", "claude-opus-5-5", body, true, null, "claude");
  assert.deepEqual(names(out), [placeholder.name, search.name, connector.name]);
});

test("historical failed placeholder calls retain their original name and error result", () => {
  const out = claudeToOpenAIRequest(
    "gpt-6.1-sol",
    {
      tools: [placeholder, search, connector],
      messages: [
        ...base.messages,
        {
          role: "assistant",
          content: [
            {
              type: "tool_use",
              id: "bad_1",
              name: placeholder.name,
              input: { query: "higgsfield", max_results: 1 },
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: "bad_1",
              is_error: true,
              content: "Error: No such tool available: DeferredToolPlaceholder",
            },
          ],
        },
      ],
    },
    false
  );
  const assistant = out.messages.find((message) => Array.isArray(message.tool_calls));
  assert.ok(assistant);
  const calls = assistant.tool_calls as Array<{ function: { name: string } }>;
  assert.equal(calls[0].function.name, placeholder.name);
  assert.match(firstToolResult(out).content, /No such tool available/);
});
