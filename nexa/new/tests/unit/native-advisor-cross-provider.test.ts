import test from "node:test";
import assert from "node:assert/strict";
import { claudeToOpenAIRequest } from "../../open-sse/translator/request/claude-to-openai.ts";
import { translateRequest } from "../../open-sse/translator/index.ts";

const advisor = { type: "advisor_20260301", name: "advisor", model: "claude-opus-5-5" };
const read = {
  name: "Read",
  input_schema: { type: "object", properties: { file_path: { type: "string" } } },
};
const base = { messages: [{ role: "user", content: "Read the fixture." }] };

function toolNames(result: Record<string, unknown>): string[] {
  const tools = result.tools as Array<{ name?: string; function?: { name?: string } }> | undefined;
  return (tools ?? []).map((tool) => tool.function?.name ?? tool.name ?? "");
}

test("native advisor is not advertised as a client function on a Chat Completions target", () => {
  const result = claudeToOpenAIRequest("glm-5.3-max", { ...base, tools: [advisor, read] }, true);
  assert.deepEqual(toolNames(result), ["Read"]);
});

test("Codex Responses targets retain client tools without inventing a local advisor", () => {
  const result = translateRequest(
    "claude",
    "openai-responses",
    "gpt-6.1-sol",
    { ...base, tools: [advisor, read] },
    true,
    null,
    "codex"
  );
  assert.deepEqual(toolNames(result), ["Read"]);
});

test("an explicitly forced server advisor fails locally with a clear 400", () => {
  assert.throws(
    () =>
      claudeToOpenAIRequest(
        "glm-5.3-max",
        {
          ...base,
          tools: [advisor, read],
          tool_choice: { type: "tool", name: "advisor" },
        },
        false
      ),
    (error: Error & { statusCode?: number; errorType?: string }) =>
      error.statusCode === 400 &&
      error.errorType === "unsupported_feature" &&
      /advisor/i.test(error.message)
  );
});

test("an optional advisor-only request becomes a normal text request", () => {
  const result = claudeToOpenAIRequest(
    "glm-5.3-max",
    {
      ...base,
      tools: [advisor],
      tool_choice: { type: "auto" },
    },
    false
  );
  assert.equal(result.tools, undefined);
  assert.equal(result.tool_choice, undefined);
});

test("requiring a tool when only an unsupported advisor exists fails before dispatch", () => {
  assert.throws(
    () =>
      claudeToOpenAIRequest(
        "glm-5.3-max",
        {
          ...base,
          tools: [advisor],
          tool_choice: { type: "any" },
        },
        false
      ),
    (error: Error & { statusCode?: number }) => error.statusCode === 400
  );
});

test("requiring any client tool remains valid when advisor is also declared", () => {
  const result = claudeToOpenAIRequest(
    "glm-5.3-max",
    {
      ...base,
      tools: [advisor, read],
      tool_choice: { type: "any" },
    },
    false
  );
  assert.deepEqual(toolNames(result), ["Read"]);
  assert.equal(result.tool_choice, "required");
});

test("a real client tool named advisor keeps its supplied schema", () => {
  const client = {
    name: "advisor",
    input_schema: { type: "object", properties: { topic: { type: "string" } } },
  };
  const result = claudeToOpenAIRequest("glm-5.3-max", { ...base, tools: [client, read] }, false);
  assert.deepEqual(toolNames(result), ["advisor", "Read"]);
});

test("readable historical advisor results are preserved as assistant context", () => {
  const result = claudeToOpenAIRequest(
    "glm-5.3-max",
    {
      messages: [
        ...base.messages,
        {
          role: "assistant",
          content: [
            { type: "server_tool_use", id: "srvtoolu_advisor", name: "advisor", input: {} },
            {
              type: "advisor_tool_result",
              tool_use_id: "srvtoolu_advisor",
              content: { type: "advisor_result", text: "PRESERVED_ADVICE" },
            },
            { type: "text", text: "CONTINUE_TEXT" },
          ],
        },
        { role: "user", content: "Continue." },
      ],
      tools: [advisor, read],
    },
    false
  );
  const history = JSON.stringify(result.messages);
  assert.ok(history.includes("PRESERVED_ADVICE"));
  assert.ok(history.includes("CONTINUE_TEXT"));
  assert.ok(!history.includes("srvtoolu_advisor"));
});

test("encrypted advisor blobs are never sent as prompt text to another provider", () => {
  const result = claudeToOpenAIRequest(
    "glm-5.3-max",
    {
      messages: [
        ...base.messages,
        {
          role: "assistant",
          content: [
            {
              type: "advisor_tool_result",
              tool_use_id: "srvtoolu_advisor",
              content: { type: "advisor_redacted_result", encrypted_content: "OPAQUE_ADVICE" },
            },
            { type: "text", text: "VISIBLE_TEXT" },
          ],
        },
        { role: "user", content: "Continue." },
      ],
      tools: [advisor, read],
    },
    false
  );
  assert.ok(!JSON.stringify(result).includes("OPAQUE_ADVICE"));
  assert.ok(JSON.stringify(result.messages).includes("VISIBLE_TEXT"));
});
