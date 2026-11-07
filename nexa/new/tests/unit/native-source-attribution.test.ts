import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "native-source-attribution-"));
const core = await import("../../src/lib/db/core.ts");
const logs = await import("../../src/lib/usage/callLogs.ts");
const { persistAttemptLogs } = await import("../../open-sse/handlers/chatCore/attemptLogging.ts");
const { FORMATS } = await import("../../open-sse/translator/formats.ts");
await core.ensureDbInitialized();
test.after(async () => {
  await logs.closeCallLogSaves();
  core.resetDbInstance();
});

const session = "11111111-2222-4333-8444-555555555555";
const headerSession = "66666666-7777-4888-8999-000000000000";
const body = {
  metadata: { user_id: JSON.stringify({ session_id: session }) },
  messages: [{ role: "user", content: "Synthetic attribution fixture" }],
  output_config: { effort: "xhigh" },
};
const cases = [
  {
    name: "native Claude attribution retains its session and cache group",
    provider: "claude",
    source: FORMATS.CLAUDE,
    session,
  },
  {
    name: "native client attribution follows a routed Codex request",
    provider: "codex",
    source: FORMATS.CLAUDE,
    session,
  },
  {
    name: "native client attribution follows a routed Gemini request",
    provider: "gemini",
    source: FORMATS.CLAUDE,
    session,
  },
  {
    name: "non-native Chat metadata cannot manufacture native attribution",
    provider: "claude",
    source: FORMATS.OPENAI,
    session: null,
  },
  {
    name: "non-native Responses headers cannot manufacture native attribution",
    provider: "claude",
    source: FORMATS.OPENAI_RESPONSES,
    session: null,
    header: headerSession,
  },
  {
    name: "malformed native metadata remains unattributed",
    provider: "claude",
    source: FORMATS.CLAUDE,
    session: null,
    invalid: true,
  },
  {
    name: "routed native attribution preserves header identity precedence",
    provider: "codex",
    source: FORMATS.CLAUDE,
    session: headerSession,
    header: headerSession,
  },
  {
    name: "failed routed native attempts retain identity and the real error",
    provider: "codex",
    source: FORMATS.CLAUDE,
    session,
    failed: true,
  },
];

for (const [index, item] of cases.entries()) {
  test(item.name, async () => {
    const request = structuredClone(body);
    if (item.invalid) request.metadata.user_id = "malformed fixture";
    const unchanged = structuredClone(request);
    const id = `native-source-attribution-${index}`;
    const status = item.failed ? 503 : 200;
    persistAttemptLogs(
      {
        status,
        tokens: { input: 7, output: 3 },
        error: item.failed ? "Fixture upstream timeout" : null,
      },
      {
        traceId: id,
        provider: item.provider,
        connectionId: "fixture-connection",
        model: item.provider === "claude" ? "claude-sonnet-5-5" : "fixture-routed-model",
        skillRequestId: id,
        detailedLoggingEnabled: false,
        reqLogger: null,
        pendingRequestId: id,
        clientRawRequest: {
          endpoint: "/v1/messages",
          headers: item.header ? { "X-Claude-Code-Session-Id": item.header } : {},
        },
        requestedModel: "fixture-requested-model",
        credentials: { connectionId: "fixture-connection" },
        startTime: Date.now(),
        body: request,
        sourceFormat: item.source,
        targetFormat: item.provider === "claude" ? FORMATS.CLAUDE : FORMATS.OPENAI_RESPONSES,
        comboName: null,
        comboStepId: null,
        comboExecutionKey: null,
        tokensCompressed: 0,
        apiKeyInfo: { id: "fixture-owner", name: "Fixture Owner" },
        noLogEnabled: false,
        correlationId: id,
      } as Parameters<typeof persistAttemptLogs>[1]
    );
    const deadline = Date.now() + 10_000;
    let row: Record<string, unknown> | undefined;
    while (Date.now() < deadline) {
      row = core
        .getDbInstance()
        .prepare(
          "SELECT native_session_tag, native_cache_group_tag, status, tokens_in, tokens_out, error_summary FROM call_logs WHERE correlation_id = ?"
        )
        .get(id) as Record<string, unknown> | undefined;
      if (row) break;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    if (!row) throw new Error("Environment: call-log persistence did not settle");
    assert.equal(row.status, status);
    assert.equal(row.tokens_in, 7);
    assert.equal(row.tokens_out, 3);
    assert.deepEqual(request, unchanged);
    if (item.failed) assert.match(String(row.error_summary), /Fixture upstream timeout/);
    assert.equal(
      row.native_session_tag,
      item.session ? createHash("sha256").update(item.session).digest("hex") : null
    );
    if (item.provider === "claude" && item.source === FORMATS.CLAUDE && item.session) {
      assert.match(String(row.native_cache_group_tag), /^[a-f0-9]{64}$/);
    } else {
      assert.equal(row.native_cache_group_tag, null);
    }
  });
}
