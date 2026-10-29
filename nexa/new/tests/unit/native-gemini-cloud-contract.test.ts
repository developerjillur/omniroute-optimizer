import assert from "node:assert/strict";
import test from "node:test";
import { createPassthroughStreamWithLogger } from "../../open-sse/utils/stream.ts";
import { createStreamController, pipeWithDisconnect } from "../../open-sse/utils/streamHandler.ts";
import { parseNonStreamingResponseBody } from "../../open-sse/handlers/chatCore/nonStreamingResponseParse.ts";
import { translateNonStreamingResponse } from "../../open-sse/handlers/responseTranslator.ts";
import { translateRequest } from "../../open-sse/translator/index.ts";

const usage = { promptTokenCount: 12, candidatesTokenCount: 4, totalTokenCount: 16 };
const candidate = {
  content: { role: "model", parts: [{ text: "পরীক্ষা NEXA_NATIVE_OK" }] },
  finishReason: "STOP",
};

async function passthrough(
  events: unknown[],
  format: string,
  fragment: boolean | number,
  terminalNewline = true,
  guarded = false
) {
  const captured: Array<Record<string, unknown>> = [];
  const wire =
    events.map((value) => "data: " + JSON.stringify(value)).join("\n\n") +
    (terminalNewline ? "\n\n" : "");
  const bytes = new TextEncoder().encode(wire);
  const chunkWidth = typeof fragment === "number" ? fragment : fragment ? 3 : bytes.length;
  const source = new ReadableStream<Uint8Array>({
    start(controller) {
      for (let at = 0; at < bytes.length; at += chunkWidth) {
        controller.enqueue(bytes.subarray(at, at + chunkWidth));
      }
      controller.close();
    },
  });
  const transform = createPassthroughStreamWithLogger(
    "antigravity",
    null,
    null,
    "test-model",
    null,
    null,
    (result) => {
      captured.push({ ...result });
    },
    null,
    null,
    format
  );
  const readable = guarded
    ? pipeWithDisconnect(
        new Response(source),
        transform,
        createStreamController({ clientResponseFormat: format }),
        { stallTimeoutMs: 0, activeTimeoutMs: 0 }
      )
    : source.pipeThrough(transform);
  const text = await new Response(readable).text();
  const values = text
    .split("\n")
    .filter((line) => line.startsWith("data:") && line.slice(5).trim() !== "[DONE]")
    .map((line) => JSON.parse(line.slice(5)));
  return { text, values, captured };
}

for (const fragment of [false, true]) {
  for (const terminalNewline of [false, true]) {
    test(`native Cloud Code preserves UTF-8 content and usage (fragment=${fragment}, newline=${terminalNewline})`, async () => {
      const payload = {
        response: { candidates: [candidate], usageMetadata: usage, responseId: "native-response" },
      };
      const result = await passthrough([payload], "antigravity", fragment, terminalNewline);
      assert.deepEqual(result.values, [payload]);
      assert.ok(result.text.includes("পরীক্ষা NEXA_NATIVE_OK"));
      assert.equal(result.text.includes("[DONE]"), false);
      assert.equal(result.text.includes('"choices"'), false);
      assert.ok(result.captured.length > 0);
    });
  }
}

test("native function calls, thought signatures and trailing usage survive unchanged", async () => {
  const events = [
    {
      response: {
        candidates: [
          {
            content: {
              role: "model",
              parts: [
                { thought: true, text: "Reasoning", thoughtSignature: "opaque-signature" },
                {
                  functionCall: { id: "call-1", name: "inspect_video", args: { second: 42 } },
                  thoughtSignature: "tool-signature",
                },
              ],
            },
          },
        ],
      },
    },
    { response: { candidates: [{ content: { role: "model", parts: [] }, finishReason: "STOP" }] } },
    { response: { usageMetadata: usage } },
  ];
  const result = await passthrough(events, "antigravity", true);
  assert.deepEqual(result.values, events);
  assert.equal(result.text.includes('"tool_calls"'), false);
  assert.equal(result.text.includes("[DONE]"), false);
});

for (const newline of [true, false]) {
  test(`outer stream guard recognizes the native Gemini terminal (newline=${newline})`, async () => {
    const payload = { response: { candidates: [candidate], usageMetadata: usage } };
    const result = await passthrough([payload], "antigravity", true, newline, true);
    assert.deepEqual(result.values, [payload]);
    assert.equal(result.text.includes('"error"'), false);
  });
}

test("outer native guard retains a terminal larger than its generic tail window", async () => {
  const payload = {
    response: {
      candidates: [
        {
          content: { role: "model", parts: [{ text: "x".repeat(128 * 1024) }] },
          finishReason: "STOP",
        },
      ],
      usageMetadata: usage,
    },
  };
  const result = await passthrough([payload], "antigravity", 8192, true, true);
  assert.deepEqual(result.values, [payload]);
  assert.equal(result.text.includes('"error"'), false);
});

test("a finishReason string inside model text cannot complete a truncated native stream", async () => {
  const payload = {
    response: {
      candidates: [
        {
          content: {
            role: "model",
            parts: [{ text: 'NEXA_NATIVE_OK with literal "finishReason":"STOP"' }],
          },
        },
      ],
    },
  };
  try {
    const result = await passthrough([payload], "antigravity", true, true, true);
    assert.ok(
      result.values.some((value) => value.error),
      "truncated stream must expose an error"
    );
  } catch (error) {
    assert.match(String(error), /terminal|upstream.*stream/i);
  }
});

test("standard Gemini native events also use their own terminal instead of OpenAI DONE", async () => {
  const payload = { candidates: [candidate], usageMetadata: usage };
  const result = await passthrough([payload], "gemini", true, true, true);
  assert.deepEqual(result.values, [payload]);
  assert.equal(result.text.includes("[DONE]"), false);
});

test("zero-valued native usage remains a protocol event", async () => {
  const events = [
    {
      response: {
        usageMetadata: { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 },
      },
    },
  ];
  assert.deepEqual((await passthrough(events, "antigravity", false)).values, events);
});

test("OpenAI passthrough retains its own choices and DONE contract", async () => {
  const events = [
    {
      id: "chatcmpl-test",
      object: "chat.completion.chunk",
      model: "test-model",
      choices: [{ index: 0, delta: { content: "NEXA_OPENAI_OK" }, finish_reason: "stop" }],
    },
  ];
  const result = await passthrough(events, "openai", false);
  assert.ok(result.text.includes("NEXA_OPENAI_OK"));
  assert.ok(result.text.includes("[DONE]"));
});

for (const targetFormat of ["antigravity", "gemini"]) {
  test(`buffered ${targetFormat} executor JSON is classified by its actual OpenAI wire shape`, async () => {
    const body = {
      object: "chat.completion",
      id: "chatcmpl-native",
      model: "test-model",
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: "NEXA_NATIVE_OK" },
          finish_reason: "stop",
        },
      ],
      usage: { prompt_tokens: 12, completion_tokens: 4, total_tokens: 16 },
    };
    const parsed = await parseNonStreamingResponseBody({
      providerResponse: Response.json(body),
      upstreamStream: false,
      providerHeaders: {},
      finalBody: {},
      targetFormat,
      model: "test-model",
    });
    assert.equal(parsed.kind, "ok");
    if (parsed.kind !== "ok") throw new Error("Expected buffered JSON");
    assert.equal(parsed.responsePayloadFormat, "openai");
    const native = translateNonStreamingResponse(
      parsed.responseBody,
      parsed.responsePayloadFormat,
      "antigravity"
    ) as {
      response: {
        candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
        usageMetadata: typeof usage;
      };
    };
    assert.equal(native.response.candidates[0].content.parts[0].text, "NEXA_NATIVE_OK");
    assert.deepEqual(native.response.usageMetadata, usage);
  });
}

test("native JSON envelopes are not nested twice; standard Gemini remains unwrapped", () => {
  const body = { candidates: [candidate], usageMetadata: usage };
  const wrapped = { response: body };
  assert.deepEqual(translateNonStreamingResponse(body, "antigravity", "antigravity"), wrapped);
  assert.equal(translateNonStreamingResponse(wrapped, "antigravity", "antigravity"), wrapped);
  assert.equal(translateNonStreamingResponse(body, "gemini", "gemini"), body);
});

test("native video URL, clip bounds and structured schema stay on the request", () => {
  const media = {
    fileData: { fileUri: "https://www.youtube.com/watch?v=wFbgrPmVXb0", mimeType: "video/mp4" },
    videoMetadata: { startOffset: "40s", endOffset: "60s" },
  };
  const schema = { type: "OBJECT", properties: { text: { type: "STRING" } }, required: ["text"] };
  const body = {
    model: "test-model",
    request: {
      contents: [{ role: "user", parts: [media, { text: "Inspect this clip" }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
        thinkingConfig: { thinkingBudget: 0 },
      },
    },
  };
  const output = translateRequest(
    "antigravity",
    "antigravity",
    "test-model",
    structuredClone(body),
    false
  );
  assert.deepEqual(output.request.contents[0].parts[0], media);
  assert.deepEqual(output.request.generationConfig.responseSchema, schema);
});
