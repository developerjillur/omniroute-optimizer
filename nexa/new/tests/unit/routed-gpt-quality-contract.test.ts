import assert from "node:assert/strict";
import { after, test } from "node:test";
import { CodexExecutor } from "../../open-sse/executors/codex.ts";
import { FORMATS } from "../../open-sse/translator/formats.ts";
import { claudeToOpenAIRequest } from "../../open-sse/translator/request/claude-to-openai.ts";
import { openaiToOpenAIResponsesRequest } from "../../open-sse/translator/request/openai-responses/toResponses.ts";
import { resetDbInstance } from "../../src/lib/db/core.ts";

type RecordValue = Record<string, unknown>;
const model = "gpt-6.1-sol";
const executor = new CodexExecutor();

function responses(body: RecordValue): RecordValue {
  return openaiToOpenAIResponsesRequest(model, body, true, { _provider: "codex" }) as RecordValue;
}

after(() => resetDbInstance());

for (const phase of ["commentary", "final_answer", null]) {
  test(`Responses translation retains an explicit assistant phase ${String(phase)}`, () => {
    const original = {
      messages: [
        { role: "user", phase: "commentary", content: "Check the fixture." },
        { role: "assistant", phase, content: "Checking the fixture." },
      ],
    };
    const before = structuredClone(original);
    const translated = responses(original);
    const input = translated.input as RecordValue[];
    assert.equal(input.find((item) => item.role === "assistant")?.phase, phase);
    assert.equal(
      Object.hasOwn(
        input.find((item) => item.role === "user")!,
        "phase"
      ),
      false
    );
    assert.deepEqual(original, before);
  });
}

test("Responses translation neither invents a phase nor forwards an invalid phase", () => {
  for (const phase of [undefined, "invented", 1, { commentary: true }]) {
    const translated = responses({
      messages: [{ role: "assistant", content: "Continue.", phase }],
    });
    const input = translated.input as RecordValue[];
    assert.equal(Object.hasOwn(input[0], "phase"), false);
  }
});

test("Claude to GPT preserves the complete system, transcript, tool schema and selected effort", () => {
  const system = [
    { type: "text", text: "Follow the fixture requirements exactly." },
    { type: "text", text: "Keep the full evidence. " + "fixture context ".repeat(1_000) },
  ];
  const messages: RecordValue[] = Array.from({ length: 80 }, (_, i) => ({
    role: i % 2 === 0 ? "user" : "assistant",
    content: `fixture-${i}:` + " retained context".repeat(600),
  }));
  messages.push(
    {
      role: "assistant",
      content: [
        {
          type: "tool_use",
          id: "call_fixture_read",
          name: "read_fixture",
          input: { path: "fixture.txt", lines: [1, 9] },
        },
      ],
    },
    {
      role: "user",
      content: [
        { type: "tool_result", tool_use_id: "call_fixture_read", content: "Full fixture result." },
      ],
    }
  );
  const schema = {
    type: "object",
    properties: { path: { type: "string" }, lines: { type: "array", items: { type: "integer" } } },
    required: ["path", "lines"],
  };
  const body = {
    system,
    messages,
    tools: [
      {
        name: "read_fixture",
        description: "Read the requested fixture lines.",
        input_schema: schema,
      },
    ],
    thinking: { type: "adaptive" },
    output_config: { effort: "xhigh" },
    max_tokens: 32_768,
  };
  const before = structuredClone(body);
  const pivot = claudeToOpenAIRequest(model, body, true, {
    _provider: "codex",
    _targetFormat: FORMATS.OPENAI_RESPONSES,
  });
  const translated = responses(pivot);
  const wire = executor.transformRequest(model, translated, true, {
    providerSpecificData: {},
    requestEndpointPath: "/v1/responses",
  });
  assert.equal(wire.instructions, system.map((block) => block.text).join("\n"));
  assert.equal((wire.reasoning as RecordValue).effort, "xhigh");
  const input = wire.input as RecordValue[];
  for (let i = 0; i < 80; i++) {
    const item = input[i];
    assert.equal(item.role, messages[i].role);
    assert.equal((item.content as RecordValue[])[0].text, messages[i].content);
  }
  const call = input.find((item) => item.type === "function_call")!;
  assert.equal(call.call_id, "call_fixture_read");
  assert.equal(call.name, "read_fixture");
  assert.deepEqual(JSON.parse(String(call.arguments)), { path: "fixture.txt", lines: [1, 9] });
  const output = input.find((item) => item.type === "function_call_output")!;
  assert.equal(output.call_id, call.call_id);
  assert.equal(output.output, "Full fixture result.");
  const tools = wire.tools as RecordValue[];
  assert.deepEqual(tools[0].parameters, schema);
  assert.equal(tools[0].description, "Read the requested fixture lines.");
  assert.deepEqual(body, before);
});

test("native Responses replay retains provider opaque reasoning and original phase without synthesizing either", () => {
  const input = [
    { type: "message", role: "user", content: "Read the fixture." },
    {
      type: "reasoning",
      id: "rs_fixture",
      encrypted_content: "opaque-provider-fixture",
      summary: [],
    },
    {
      type: "message",
      role: "assistant",
      phase: "commentary",
      content: [{ type: "output_text", text: "Reading." }],
    },
    { type: "function_call", call_id: "call_fixture", name: "read_fixture", arguments: "{}" },
    { type: "function_call_output", call_id: "call_fixture", output: "Fixture read." },
  ];
  const before = structuredClone(input);
  const wire = executor.transformRequest(
    model,
    { input, _nativeCodexPassthrough: true, reasoning: { effort: "xhigh" } },
    true,
    { providerSpecificData: {}, requestEndpointPath: "/v1/responses" }
  );
  const items = wire.input as RecordValue[];
  assert.equal(
    items.find((item) => item.type === "reasoning")?.encrypted_content,
    "opaque-provider-fixture"
  );
  assert.equal(items.find((item) => item.role === "assistant")?.phase, "commentary");
  assert.deepEqual(input, before);
});
