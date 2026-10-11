import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "omniroute-native-suggestion-"));
process.env.DATA_DIR = dataDir;
const core = await import("../../src/lib/db/core.ts");
const { handleChatCore } = await import("../../open-sse/handlers/chatCore.ts");
const originalFetch = globalThis.fetch;
const suggestion =
  "[SUGGESTION MODE: Suggest what the user might naturally type next into Claude Code.]\n" +
  "Stay silent if the next step is not obvious. Reply with only the suggestion, or nothing.";

function codexResponse(text = "", status = "completed") {
  const response = {
    id: "resp_optional_suggestion",
    object: "response",
    model: "gpt-6.1-sol",
    status,
    output: [
      {
        id: "msg_optional_suggestion",
        type: "message",
        role: "assistant",
        status,
        content: [{ type: "output_text", text }],
      },
    ],
    usage: { input_tokens: 6, output_tokens: text ? 2 : 0 },
  };
  const events = [
    { type: "response.created", response: { ...response, output: [], status: "in_progress" } },
    {
      type: "response.output_item.added",
      output_index: 0,
      item: { ...response.output[0], content: [], status: "in_progress" },
    },
    {
      type: "response.output_text.delta",
      item_id: "msg_optional_suggestion",
      output_index: 0,
      content_index: 0,
      delta: text,
    },
    { type: "response.output_item.done", output_index: 0, item: response.output[0] },
    { type: status === "completed" ? "response.completed" : "response.incomplete", response },
  ];
  return new Response(
    events.map((e) => `event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`).join("") +
      "data: [DONE]\n\n",
    { headers: { "Content-Type": "text/event-stream" } }
  );
}

async function invoke(prompt: string, response: () => Response, native = true, stream = false) {
  const calls: string[] = [];
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    return response();
  };
  try {
    const body = {
      model: "gpt-6.1-sol",
      max_tokens: 64,
      stream,
      messages: [{ role: "user", content: prompt }],
      metadata: { user_id: JSON.stringify({ session_id: "native-suggestion-fixture" }) },
      fallbacks: "default",
    };
    const result = await handleChatCore({
      body,
      modelInfo: { provider: "codex", model: "gpt-6.1-sol" },
      credentials: {
        apiKey: "fixture-key",
        accessToken: "fixture-token",
        providerSpecificData: {},
      },
      log: { debug() {}, info() {}, warn() {}, error() {} },
      onCredentialsRefreshed: undefined,
      onRequestSuccess: undefined,
      onStreamFailure: undefined,
      onDisconnect: undefined,
      connectionId: undefined,
      comboName: undefined,
      clientRawRequest: {
        endpoint: "/v1/messages",
        body: structuredClone(body),
        headers: new Headers({
          accept: "application/json",
          "user-agent": native ? "claude-cli/2.1.294" : "test-client",
          ...(native ? { "x-app": "cli" } : {}),
        }),
      },
      userAgent: native ? "claude-cli/2.1.294" : "test-client",
    });
    assert.ok(!(result instanceof Response), "the fixture must return a chat result wrapper");
    let payload, readError;
    try {
      payload = stream ? await result.response.text() : await result.response.json();
    } catch (error) {
      readError = error;
    }
    for (let i = 0; i < 5; i++) await new Promise<void>((resolve) => setImmediate(resolve));
    return { result, payload, calls, readError };
  } finally {
    globalThis.fetch = originalFetch;
  }
}

test.after(async () => {
  for (let i = 0; i < 5; i++) await new Promise<void>((resolve) => setImmediate(resolve));
  globalThis.fetch = originalFetch;
  core.resetDbInstance();
  // Retain this small, isolated test database for failure evidence.
});

test("native optional suggestion accepts a completed silent response without another provider call", async () => {
  const { result, payload, calls } = await invoke(suggestion, () => codexResponse());
  assert.equal(result.success, true);
  assert.equal(result.response.status, 200);
  assert.equal(payload.type, "message");
  assert.equal(payload.stop_reason, "end_turn");
  assert.deepEqual(payload.content, []);
  assert.equal(calls.length, 1);
});

test("ordinary native requests still reject empty provider output", async () => {
  const { result } = await invoke("Run the requested task.", () => codexResponse());
  assert.equal(result.success, false);
  assert.equal(result.response.status, 502);
});

for (const stream of [false, true]) {
  test(`completed optional suggestion may contain hidden reasoning without visible text (stream=${stream})`, async () => {
    const response = () => {
      const completed = {
        id: "resp_silent_reasoning",
        object: "response",
        model: "gpt-6.1-sol",
        status: "completed",
        output: [
          { id: "rs_silent", type: "reasoning", summary: [] },
          {
            id: "msg_silent_reasoning",
            type: "message",
            role: "assistant",
            status: "completed",
            content: [{ type: "output_text", text: "" }],
          },
        ],
        usage: { input_tokens: 6, output_tokens: 1 },
      };
      return new Response(
        `event: response.completed\ndata: ${JSON.stringify({ type: "response.completed", response: completed })}\n\ndata: [DONE]\n\n`,
        { headers: { "Content-Type": "text/event-stream" } }
      );
    };
    const { result, payload, calls, readError } = await invoke(suggestion, response, true, stream);
    assert.equal(result.success, true);
    assert.equal(result.response.status, 200);
    assert.equal(readError, undefined);
    assert.equal(calls.length, 1);
    if (stream) {
      assert.match(payload, /"type":"message_stop"/);
      assert.doesNotMatch(payload, /"type":"error"|\(empty response\)/);
    } else {
      assert.deepEqual(payload.content, []);
      assert.equal(payload.stop_reason, "end_turn");
    }
  });
}

test("optional suggestion does not accept a zero-byte upstream body", async () => {
  const { result } = await invoke(
    suggestion,
    () => new Response("", { headers: { "Content-Type": "text/event-stream" } })
  );
  assert.equal(result.success, false);
  assert.equal(result.response.status, 502);
});

test("optional suggestion preserves nonempty model output", async () => {
  const { result, payload, calls } = await invoke(suggestion, () => codexResponse("run the tests"));
  assert.equal(result.success, true);
  assert.equal(payload.content[0].text, "run the tests");
  assert.equal(calls.length, 1);
});

test("a non-native caller cannot opt into the silent-suggestion exception", async () => {
  const { result } = await invoke(suggestion, () => codexResponse(), false);
  assert.equal(result.success, false);
  assert.equal(result.response.status, 502);
});

test("native streaming suggestion completes silently without a synthetic error or text", async () => {
  const { result, payload, calls, readError } = await invoke(
    suggestion,
    () => codexResponse(),
    true,
    true
  );
  assert.equal(result.success, true);
  assert.equal(readError, undefined);
  assert.match(payload, /message_stop/);
  assert.doesNotMatch(payload, /"type":"error"|\(empty response\)/);
  assert.equal(calls.length, 1);
});

for (const stream of [false, true]) {
  test(`incomplete optional suggestion remains a failure (stream=${stream})`, async () => {
    const { result, payload, readError } = await invoke(
      suggestion,
      () => codexResponse("", "incomplete"),
      true,
      stream
    );
    if (stream) assert.ok(readError || String(payload).includes('"type":"error"'));
    else assert.equal(result.response.status, 502);
  });

  test(`truncated optional suggestion remains a failure (stream=${stream})`, async () => {
    const partial = {
      type: "response.created",
      response: {
        id: "resp_truncated",
        object: "response",
        status: "in_progress",
        output: [],
      },
    };
    const { result, payload, readError } = await invoke(
      suggestion,
      () =>
        new Response(`event: response.created\ndata: ${JSON.stringify(partial)}\n\n`, {
          headers: { "Content-Type": "text/event-stream" },
        }),
      true,
      stream
    );
    if (stream) assert.ok(readError || String(payload).includes('"type":"error"'));
    else assert.equal(result.response.status, 502);
  });
}

test("a completed payload with an upstream error is not a silent suggestion", async () => {
  const { result } = await invoke(
    suggestion,
    () =>
      new Response(
        "event: response.completed\ndata: " +
          JSON.stringify({
            type: "response.completed",
            response: {
              id: "resp_error",
              object: "response",
              status: "completed",
              output: [],
              error: { message: "fixture error" },
            },
          }) +
          "\n\n",
        { headers: { "Content-Type": "text/event-stream" } }
      )
  );
  assert.equal(result.response.status, 502);
});

test("ordinary streaming requests retain the empty-response guard", async () => {
  const { payload, readError } = await invoke("Run the task.", () => codexResponse(), true, true);
  assert.ok(readError || String(payload).includes('"type":"error"'));
});

test("a streaming non-native request cannot opt into silent suggestions", async () => {
  const { payload, readError } = await invoke(suggestion, () => codexResponse(), false, true);
  assert.ok(readError || String(payload).includes('"type":"error"'));
});

test("optional streaming suggestion preserves generated text", async () => {
  const { payload, readError, calls } = await invoke(
    suggestion,
    () => codexResponse("run the tests"),
    true,
    true
  );
  assert.equal(readError, undefined);
  assert.match(payload, /run the tests/);
  assert.doesNotMatch(payload, /"type":"error"/);
  assert.equal(calls.length, 1);
});

test("optional streaming suggestion does not accept a zero-byte upstream body", async () => {
  const { payload, readError, result } = await invoke(
    suggestion,
    () =>
      new Response("", {
        headers: { "Content-Type": "text/event-stream" },
      }),
    true,
    true
  );
  assert.ok(!result.success || readError || String(payload).includes('"type":"error"'));
});

test("an optional suggestion still relays an actual tool call", async () => {
  const response = {
    id: "resp_tool",
    object: "response",
    status: "completed",
    model: "gpt-6.1-sol",
    output: [
      {
        type: "function_call",
        id: "fc_fixture",
        call_id: "call_fixture",
        name: "Read",
        arguments: JSON.stringify({ file_path: "marker.txt" }),
      },
    ],
    usage: { input_tokens: 6, output_tokens: 4 },
  };
  const { result, payload, calls } = await invoke(
    suggestion,
    () =>
      new Response(
        "event: response.completed\ndata: " +
          JSON.stringify({ type: "response.completed", response }) +
          "\n\n",
        { headers: { "Content-Type": "text/event-stream" } }
      )
  );
  assert.equal(result.success, true);
  const tool = payload.content.find((block) => block.type === "tool_use");
  assert.equal(tool.name, "Read");
  assert.deepEqual(tool.input, { file_path: "marker.txt" });
  assert.equal(payload.stop_reason, "tool_use");
  assert.equal(calls.length, 1);
});
