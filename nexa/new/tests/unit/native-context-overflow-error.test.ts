import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const fixtureRoot = process.env.NEXA_CONTEXT_ERROR_TEST_DIR || os.tmpdir();
const dataDir = fs.mkdtempSync(path.join(fixtureRoot, "native-context-error-"));
process.env.DATA_DIR = dataDir;
process.env.SQLITE_FILE = path.join(dataDir, "storage.sqlite");
process.env.OMNIROUTE_PLUGINS_DIR = path.join(dataDir, "plugins");
process.env.APP_LOG_TO_FILE = "false";
process.env.DISABLE_SQLITE_AUTO_BACKUP = "true";
const core = await import("../../src/lib/db/core.ts");
const logs = await import("../../src/lib/usage/callLogs.ts");
const { handleChatCore } = await import("../../open-sse/handlers/chatCore.ts");
const { runNonStreamingProviderLeg } =
  await import("../../open-sse/handlers/chatCore/nonStreamingProviderLeg.ts");
const originalFetch = globalThis.fetch;

function failedResponse(includeStatus = true, code = "context_length_exceeded") {
  return {
    id: "resp_context_fixture",
    object: "response",
    model: "gpt-6.1-sol",
    ...(includeStatus ? { status: "failed" } : {}),
    output: [],
    usage: null,
    error: {
      code,
      message: "token=fixture-private-token at /private/fixture/config.json\nforged-log: true",
    },
  };
}

type WireFormat = "json" | "sse" | "ndjson";

function wireResponse(body: Record<string, unknown>, format: WireFormat = "json") {
  if (format === "json") return Response.json(body);
  const event = { type: "response.failed", response: body };
  return new Response(
    format === "sse"
      ? `event: response.failed\ndata: ${JSON.stringify(event)}\n\ndata: [DONE]\n\n`
      : `${JSON.stringify(event)}\n`,
    {
      headers: {
        "content-type": format === "sse" ? "text/event-stream" : "application/x-ndjson",
      },
    }
  );
}

async function invoke(response: () => Response, stream = false) {
  const sent: Record<string, unknown>[] = [];
  globalThis.fetch = async (_url, init) => {
    if (init?.body) sent.push(JSON.parse(String(init.body)));
    return response();
  };
  try {
    const body = {
      model: "gpt-6.1-sol",
      max_tokens: 64,
      stream,
      messages: [{ role: "user", content: "Inspect the fixture." }],
      output_config: { effort: "max" },
      tools: [
        {
          name: "Read",
          input_schema: { type: "object", properties: { file_path: { type: "string" } } },
        },
      ],
    };
    const result = await handleChatCore({
      body,
      modelInfo: { provider: "codex", model: "gpt-6.1-sol" },
      credentials: {
        accessToken: "fixture-token",
        apiKey: "fixture-key",
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
        headers: new Headers({ "user-agent": "claude-cli/2.1.294", "x-app": "cli" }),
      },
      userAgent: "claude-cli/2.1.294",
    });
    assert.ok(!(result instanceof Response), "the fixture must return a chat result wrapper");
    const payload = await result.response.json();
    return { result, payload, sent };
  } finally {
    globalThis.fetch = originalFetch;
  }
}

test.after(async () => {
  globalThis.fetch = originalFetch;
  await logs.closeCallLogSaves();
  core.resetDbInstance();
  // Keep the small, isolated database beside the test log as failure evidence.
});

for (const format of ["json", "sse", "ndjson"] as const) {
  test(`native non-streaming ${format} context failure is an actionable 400 without a retry`, async () => {
    const { result, payload, sent } = await invoke(() => wireResponse(failedResponse(), format));
    assert.equal(result.success, false);
    assert.equal(result.response.status, 400);
    assert.equal(payload.error.code, "context_length_exceeded");
    assert.equal(payload.error.type, "invalid_request_error");
    assert.match(payload.error.message, /prompt is too long/i);
    assert.doesNotMatch(
      JSON.stringify(payload),
      /fixture-private-token|private\/fixture|forged-log/
    );
    assert.equal(sent.length, 1, "deterministic overflow must not replay the same request");
    assert.equal((sent[0].reasoning as { effort?: string }).effort, "max");
  });
}

test("an error-only Responses payload needs no status field to preserve context overflow", async () => {
  const { result, payload, sent } = await invoke(() => wireResponse(failedResponse(false)));
  assert.equal(result.response.status, 400);
  assert.equal(payload.error.code, "context_length_exceeded");
  assert.equal(sent.length, 1);
});

test("partial output does not turn a failed context-overflow response into a success", async () => {
  const body = {
    ...failedResponse(),
    output: [
      { type: "message", role: "assistant", content: [{ type: "output_text", text: "partial" }] },
    ],
  };
  const { result, payload } = await invoke(() => wireResponse(body));
  assert.equal(result.response.status, 400);
  assert.equal(payload.error.code, "context_length_exceeded");
});

test("a normal streaming HTTP 400 retains the existing context-error contract", async () => {
  const { result, payload } = await invoke(
    () =>
      Response.json(
        {
          error: {
            code: "context_length_exceeded",
            type: "invalid_request_error",
            message: "Prompt is too long",
          },
        },
        { status: 400 }
      ),
    true
  );
  assert.equal(result.response.status, 400);
  assert.equal(payload.error.code, "context_length_exceeded");
});

test("an unrelated embedded server failure remains a 5xx", async () => {
  const { result, payload } = await invoke(() =>
    wireResponse(failedResponse(true, "server_error"))
  );
  assert.equal(result.response.status, 502);
  assert.notEqual(payload.error.code, "context_length_exceeded");
});

test("a genuinely empty completed response retains its 502 guard", async () => {
  const { error: _error, ...body } = failedResponse();
  const { result, payload } = await invoke(() => wireResponse({ ...body, status: "completed" }));
  assert.equal(result.response.status, 502);
  assert.equal(payload.error.code, "upstream_empty_response");
});

test("valid GPT text and native tool names still translate to Claude messages", async () => {
  for (const output of [
    [
      {
        type: "message",
        role: "assistant",
        content: [{ type: "output_text", text: "fixture-ok" }],
      },
    ],
    [
      {
        type: "function_call",
        call_id: "call_fixture",
        name: "Read",
        arguments: '{"file_path":"fixture.txt"}',
      },
    ],
  ]) {
    const { result, payload } = await invoke(() =>
      wireResponse({
        id: "resp_valid_fixture",
        object: "response",
        model: "gpt-6.1-sol",
        status: "completed",
        output,
        usage: { input_tokens: 6, output_tokens: 2 },
      })
    );
    assert.equal(result.response.status, 200);
    assert.equal(payload.type, "message");
    if (output[0].type === "message") assert.equal(payload.content[0].text, "fixture-ok");
    else {
      const tool = payload.content.find((block: { type: string }) => block.type === "tool_use");
      assert.equal(tool?.name, "Read");
      assert.equal(payload.stop_reason, "tool_use");
    }
  }
});

test("a follow-up leg preserves the owning connection, error receipt, and provider usage", async () => {
  let sends = 0;
  const body = { ...failedResponse(), usage: { input_tokens: 123, output_tokens: 0 } };
  const result = await runNonStreamingProviderLeg({
    phase: "follow-up",
    sourceBody: { messages: [{ role: "user", content: "fixture" }] },
    provider: "codex",
    model: "gpt-6.1-sol",
    connectionId: "fixture-owner",
    expectedConnectionId: "fixture-owner",
    getCurrentConnectionId: () => "fixture-owner",
    sourceFormat: "claude",
    targetFormat: "openai-responses",
    clientResponseFormat: "claude",
    allowAccountRotation: true,
    allowModelFallback: true,
    setRequestWireState: (state) => assert.equal(state.effectiveModel, "gpt-6.1-sol"),
    executeProviderRequest: async () => {
      sends++;
      return {
        response: wireResponse(body),
        url: "https://upstream.fixture/responses",
        headers: {},
        transformedBody: {},
      };
    },
  });
  assert.equal(result.kind, "error");
  assert.equal(result.receipt.httpStatus, 400);
  assert.equal(result.receipt.errorType, "context_length_exceeded");
  assert.equal(result.receipt.connectionId, "fixture-owner");
  assert.equal(result.receipt.termination, "provider_error");
  assert.equal(result.usage?.prompt_tokens, 123);
  assert.equal(sends, 1);
  if (result.kind === "error") {
    assert.equal(result.result.retryAfterMs, undefined);
    assert.equal(
      (result.result.upstreamErrorBody as typeof body).error.code,
      "context_length_exceeded"
    );
  }
});

test("retained call logs and artifacts preserve the 400 context failure", async () => {
  await logs.closeCallLogSaves();
  const rows = core
    .getDbInstance()
    .prepare(
      "SELECT error_summary,artifact_relpath FROM call_logs WHERE status = 400 AND error_type = ?"
    )
    .all("context_overflow") as { error_summary: string; artifact_relpath: string }[];
  assert.ok(rows.length >= 5, "the diagnostic log must agree with the response sent to Claude");
  let preservedErrors = 0;
  for (const row of rows) {
    assert.doesNotMatch(row.error_summary, /fixture-private-token|forged-log/);
    const artifact = JSON.parse(
      fs.readFileSync(path.join(dataDir, "call_logs", row.artifact_relpath), "utf8")
    );
    if (artifact.responseBody?.error?.code === "context_length_exceeded") {
      preservedErrors++;
      assert.doesNotMatch(
        JSON.stringify(artifact.responseBody),
        /fixture-private-token|private\/fixture|forged-log/
      );
    }
  }
  assert.ok(preservedErrors >= 5, "the provider error must survive into the bounded log artifact");
});
