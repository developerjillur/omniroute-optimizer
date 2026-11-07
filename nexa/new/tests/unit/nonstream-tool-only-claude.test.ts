import test from "node:test";
import assert from "node:assert/strict";
import { translateNonStreamingResponse } from "../../open-sse/handlers/responseTranslator.ts";
import { detectMalformedNonStream } from "../../open-sse/utils/diagnostics.ts";

type Block = {
  type: string;
  id?: string;
  name?: string;
  text?: string;
  thinking?: string;
  input?: unknown;
};
type ClaudeReply = {
  id: string;
  content: Block[];
  stop_reason: string;
  usage: Record<string, number>;
};

const omitted = Symbol("omitted content");
const readCall = {
  id: "call_tool_only_read",
  type: "function",
  function: { name: "Read", arguments: '{"file_path":"fixture.txt"}' },
};

function completion(content: unknown, toolCalls: unknown = [readCall], finish = "tool_calls") {
  const message: Record<string, unknown> = { role: "assistant", tool_calls: toolCalls };
  if (content !== omitted) message.content = content;
  return {
    id: "chatcmpl-tool-only-fixture",
    object: "chat.completion",
    model: "fixture-model",
    choices: [{ index: 0, message, finish_reason: finish }],
    usage: {
      prompt_tokens: 120,
      completion_tokens: 9,
      prompt_tokens_details: { cached_tokens: 40, cache_creation_tokens: 10 },
    },
  };
}

function translate(body: unknown, target = "openai", thinking?: boolean): ClaudeReply {
  return translateNonStreamingResponse(body, target, "claude", null, null, thinking) as ClaudeReply;
}

function assertToolOnly(reply: ClaudeReply) {
  assert.deepEqual(reply.content, [
    { type: "tool_use", id: readCall.id, name: "Read", input: { file_path: "fixture.txt" } },
  ]);
  assert.equal(reply.stop_reason, "tool_use");
  assert.equal(detectMalformedNonStream(reply), null);
}

const blanks: [string, unknown][] = [
  ["null", null],
  ["omitted", omitted],
  ["empty string", ""],
  ["whitespace", " \n\t"],
  ["empty array", []],
];
for (const [name, value] of blanks) {
  test(`tool-only Claude reply omits synthetic text for ${name} content`, () => {
    const input = completion(value);
    const before = structuredClone(input);
    const reply = translate(input);
    assertToolOnly(reply);
    assert.equal(reply.id, input.id);
    assert.deepEqual(reply.usage, {
      input_tokens: 70,
      output_tokens: 9,
      cache_read_input_tokens: 40,
      cache_creation_input_tokens: 10,
    });
    assert.deepEqual(input, before);
  });
}

test("Responses API function-call-only output remains a tool-only Claude reply", () => {
  const reply = translate(
    {
      id: "resp-tool-only-fixture",
      object: "response",
      model: "fixture-model",
      status: "completed",
      output: [
        {
          id: "fc-tool-only-fixture",
          type: "function_call",
          call_id: readCall.id,
          name: "Read",
          arguments: readCall.function.arguments,
          status: "completed",
        },
      ],
      usage: { input_tokens: 12, output_tokens: 9 },
    },
    "openai-responses"
  );
  assertToolOnly(reply);
  assert.equal(reply.usage.output_tokens, 9);
});

test("parallel tool-only calls preserve every id, name and argument", () => {
  const tools = [
    readCall,
    {
      id: "call_tool_only_bash",
      type: "function",
      function: { name: "Bash", arguments: '{"command":"pwd"}' },
    },
  ];
  const reply = translate(completion(null, tools));
  assert.deepEqual(reply.content, [
    { type: "tool_use", id: readCall.id, name: "Read", input: { file_path: "fixture.txt" } },
    { type: "tool_use", id: tools[1].id, name: "Bash", input: { command: "pwd" } },
  ]);
  assert.equal(reply.stop_reason, "tool_use");
});

test("visible narration beside a tool call remains unchanged", () => {
  const text = "Checking the selected file.\n";
  const reply = translate(completion(text));
  assert.deepEqual(reply.content[0], { type: "text", text });
  assert.equal(reply.content[1].id, readCall.id);
});

test("a placeholder literally supplied by the provider is not silently removed", () => {
  const reply = translate(completion("(empty response)"));
  assert.deepEqual(reply.content[0], { type: "text", text: "(empty response)" });
  assert.equal(reply.content[1].id, readCall.id);
});

test("requested reasoning and tool calls retain their original block types", () => {
  const input = completion(null);
  input.choices[0].message.reasoning_content = "Synthetic planning summary.";
  const reply = translate(input, "openai", true);
  assert.deepEqual(
    reply.content.map((block) => block.type),
    ["thinking", "tool_use"]
  );
  assert.equal(reply.content[0].thinking, "Synthetic planning summary.");
  assert.equal(reply.content[1].id, readCall.id);
});

for (const [name, value] of blanks.slice(0, 3)) {
  test(`genuinely empty ${name} output without tools remains malformed`, () => {
    const reply = translate(completion(value, [], "stop"));
    assert.equal(detectMalformedNonStream(reply), "empty_choices");
  });
}

test("an empty tool-call array does not exempt an empty response", () => {
  const reply = translate(completion(null, [], "stop"));
  assert.equal(detectMalformedNonStream(reply), "empty_choices");
});

test("a non-array tool-call field does not exempt an empty response", () => {
  const reply = translate(completion(null, { id: readCall.id }, "stop"));
  assert.equal(detectMalformedNonStream(reply), "empty_choices");
});

test("an ordinary final text answer keeps its content and terminal reason", () => {
  const reply = translate(completion("Completed.", [], "stop"));
  assert.deepEqual(reply.content, [{ type: "text", text: "Completed." }]);
  assert.equal(reply.stop_reason, "end_turn");
  assert.equal(detectMalformedNonStream(reply), null);
});
