import assert from "node:assert/strict";
import test from "node:test";
import { getEventListeners } from "node:events";
import {
  collectNativeGeminiResponse,
  NativeGeminiResponseError,
} from "../../src/sse/handlers/nativeGeminiResponse.ts";

function response(events: unknown[], terminalNewline = true) {
  const text =
    events.map((value) => "data: " + JSON.stringify(value)).join("\n\n") +
    (terminalNewline ? "\n\n" : "");
  const bytes = new TextEncoder().encode(text);
  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        for (let at = 0; at < bytes.length; at += 3) controller.enqueue(bytes.subarray(at, at + 3));
        controller.close();
      },
    }),
    { headers: { "content-type": "text/event-stream" } }
  );
}

test("native JSON retains opaque signatures, call identity and provider metadata", async () => {
  const thought = { thought: true, text: "Reasoning", thoughtSignature: "opaque-thought" };
  const tool = {
    functionCall: { id: "native-id", name: "inspect", args: { second: 42 } },
    thoughtSignature: "opaque-tool",
    vendorExtension: { future: true },
  };
  const output = await collectNativeGeminiResponse(
    response(
      [
        {
          requestId: "outer-id",
          response: {
            modelVersion: "gemini-test",
            responseId: "native-response",
            candidates: [{ index: 0, content: { role: "model", parts: [thought] } }],
          },
        },
        {
          response: {
            candidates: [
              {
                index: 0,
                content: { role: "model", parts: [tool, { text: "বাংলা কথা" }] },
                finishReason: "STOP",
                groundingMetadata: { groundingChunks: [{ web: { title: "Source" } }] },
              },
            ],
            usageMetadata: {
              promptTokenCount: 12,
              candidatesTokenCount: 4,
              totalTokenCount: 16,
              cachedContentTokenCount: 2,
            },
          },
        },
      ],
      false
    )
  );
  const native = output.response as {
    modelVersion: string;
    responseId: string;
    candidates: Array<{
      content: { parts: unknown[] };
      groundingMetadata: { groundingChunks: Array<{ web: { title: string } }> };
    }>;
    usageMetadata: { cachedContentTokenCount: number };
  };
  assert.equal(output.requestId, "outer-id");
  assert.equal(native.modelVersion, "gemini-test");
  assert.equal(native.responseId, "native-response");
  assert.deepEqual(native.candidates[0].content.parts, [thought, tool, { text: "বাংলা কথা" }]);
  assert.equal(native.candidates[0].groundingMetadata.groundingChunks[0].web.title, "Source");
  assert.equal(native.usageMetadata.cachedContentTokenCount, 2);
  assert.equal(output.choices, undefined);
});

test("missing terminal is an error rather than a synthetic successful STOP", async () => {
  await assert.rejects(
    collectNativeGeminiResponse(
      response([{ response: { candidates: [{ content: { parts: [{ text: "partial" }] } }] } }])
    ),
    (error) => error instanceof NativeGeminiResponseError && error.code === "native_incomplete"
  );
});

test("provider errors after partial content never become a JSON completion", async () => {
  await assert.rejects(
    collectNativeGeminiResponse(
      response([
        { response: { candidates: [{ content: { parts: [{ text: "partial" }] } }] } },
        { error: { message: "provider failure" } },
      ])
    ),
    (error) => error instanceof NativeGeminiResponseError && error.code === "native_upstream_error"
  );
});

test("native length and safety reasons are preserved instead of rewritten to STOP", async () => {
  const value = await collectNativeGeminiResponse(
    response([
      {
        response: {
          candidates: [{ content: { parts: [{ text: "partial" }] }, finishReason: "MAX_TOKENS" }],
        },
      },
    ])
  );
  const native = value.response as { candidates: Array<{ finishReason: string }> };
  assert.equal(native.candidates[0].finishReason, "MAX_TOKENS");
});

test("a source safety block without candidates remains a source safety block", async () => {
  const value = await collectNativeGeminiResponse(
    response([{ response: { promptFeedback: { blockReason: "SAFETY" } } }])
  );
  assert.deepEqual(value, { response: { promptFeedback: { blockReason: "SAFETY" } } });
});

test("byte limit cancels only this upstream reader", async () => {
  let cancelled = false;
  const source = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(128));
    },
    cancel() {
      cancelled = true;
    },
  });
  await assert.rejects(
    collectNativeGeminiResponse(new Response(source), undefined, { maxBytes: 32 }),
    (error) => error instanceof NativeGeminiResponseError && error.code === "native_response_limit"
  );
  assert.equal(cancelled, true);
});

test("stalled native JSON collection times out and cancels its reader", async () => {
  let cancelled = false;
  const source = new ReadableStream({
    cancel() {
      cancelled = true;
    },
  });
  await assert.rejects(
    collectNativeGeminiResponse(new Response(source), undefined, { timeoutMs: 10 }),
    (error) => error instanceof NativeGeminiResponseError && error.code === "native_timeout"
  );
  assert.equal(cancelled, true);
});

test("client abort cancels native collection without retaining the signal listener", async () => {
  let cancelled = false;
  const source = new ReadableStream({
    cancel() {
      cancelled = true;
    },
  });
  const abort = new AbortController();
  const collected = collectNativeGeminiResponse(new Response(source), abort.signal);
  abort.abort();
  await assert.rejects(
    collected,
    (error) => error instanceof NativeGeminiResponseError && error.code === "native_cancelled"
  );
  assert.equal(cancelled, true);
  assert.equal(getEventListeners(abort.signal, "abort").length, 0);
});
