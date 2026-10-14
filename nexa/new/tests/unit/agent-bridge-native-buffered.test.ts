import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  bufferAnthropicMessage,
  shouldBufferNativeThinking,
} = require("../../src/mitm/_internal/anthropicBuffered.cjs");

const sseResponse = (events: unknown[]) =>
  new Response(events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join(""), {
    headers: { "content-type": "text/event-stream" },
  });
const envelope = {
  type: "message_start",
  message: { type: "message", role: "assistant", id: "msg_fixture", content: [] },
};

test("only native Claude thinking fallbacks use bounded buffering", () => {
  const body = { model: "cc/claude-opus-5-5", stream: false, thinking: { type: "adaptive" } };
  assert.equal(shouldBufferNativeThinking(body, "claude-code"), true);
  assert.equal(
    shouldBufferNativeThinking({ ...body, thinking: { type: "between_tools" } }, "claude-code"),
    true
  );
  assert.equal(shouldBufferNativeThinking(body, "opencode"), false);
  assert.equal(
    shouldBufferNativeThinking({ ...body, model: "cx/gpt-6.1-sol" }, "claude-code"),
    false
  );
  assert.equal(shouldBufferNativeThinking({ ...body, stream: true }, "claude-code"), false);
  assert.equal(
    shouldBufferNativeThinking({ ...body, thinking: { type: "disabled" } }, "claude-code"),
    false
  );
});

test("buffered native messages reject overflow, incomplete tools and deltas after block closure", async () => {
  await assert.rejects(bufferAnthropicMessage(sseResponse([envelope]), { maxBytes: 32 }), {
    code: "agent_bridge_response_too_large",
    retryable: false,
  });
  const start = {
    type: "content_block_start",
    index: 0,
    content_block: { type: "tool_use", name: "Artifact", id: "toolu_fixture", input: {} },
  };
  await assert.rejects(
    bufferAnthropicMessage(sseResponse([envelope, start, { type: "message_stop" }])),
    /incomplete content blocks/
  );
  await assert.rejects(
    bufferAnthropicMessage(
      sseResponse([
        envelope,
        start,
        {
          type: "content_block_delta",
          index: 0,
          delta: { type: "input_json_delta", partial_json: '{"broken":' },
        },
        { type: "content_block_stop", index: 0 },
      ])
    ),
    /incomplete tool arguments/
  );
  await assert.rejects(
    bufferAnthropicMessage(
      sseResponse([
        envelope,
        start,
        { type: "content_block_stop", index: 0 },
        {
          type: "content_block_delta",
          index: 0,
          delta: { type: "input_json_delta", partial_json: "{}" },
        },
      ])
    ),
    /without an open content block/
  );
});

test("a native completed JSON fallback preserves tools while a truncated one cannot succeed", async () => {
  const message = {
    ...envelope.message,
    stop_reason: "tool_use",
    content: [
      { type: "tool_use", name: "Artifact", id: "toolu_json", input: { title: "Fixture" } },
    ],
  };
  const response = (body: string) =>
    new Response(body, { headers: { "content-type": "application/json" } });
  assert.deepEqual(await bufferAnthropicMessage(response(JSON.stringify(message))), message);
  await assert.rejects(
    bufferAnthropicMessage(response(JSON.stringify(message).slice(0, -1))),
    /incomplete JSON/
  );
  await assert.rejects(
    bufferAnthropicMessage(response(JSON.stringify({ ...message, stop_reason: null }))),
    /incomplete JSON/
  );
});

test("native buffered transport failures remain bounded and disable automatic replay", async () => {
  for (const code of ["UND_ERR_BODY_TIMEOUT", "UND_ERR_SOCKET"]) {
    const body = new ReadableStream({
      start(controller) {
        controller.error(Object.assign(new Error("fixture transport"), { cause: { code } }));
      },
    });
    await assert.rejects(bufferAnthropicMessage(new Response(body)), {
      statusCode: code.endsWith("TIMEOUT") ? 504 : 502,
      retryable: false,
    });
  }
});

test("hidden thinking alone cannot turn an empty completion into native success", async () => {
  await assert.rejects(
    bufferAnthropicMessage(
      sseResponse([
        envelope,
        {
          type: "content_block_start",
          index: 0,
          content_block: { type: "thinking", thinking: "", signature: "opaque-fixture" },
        },
        { type: "content_block_stop", index: 0 },
        { type: "message_delta", delta: { stop_reason: "end_turn" } },
        { type: "message_stop" },
      ])
    ),
    { statusCode: 502, retryable: false }
  );
});

test("native buffered fallback preserves Artifact tools and opaque thinking without a headers stall", async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "bridge-native-buffered-"));
  console.log(JSON.stringify({ ownedFixtureDirectory: root }));
  fs.mkdirSync(path.join(root, "mitm"));
  fs.writeFileSync(
    path.join(root, "db.json"),
    JSON.stringify({
      mitmAlias: { "claude-code": { "native-buffered-fixture": "cc/claude-opus-5-5" } },
    })
  );
  fs.writeFileSync(
    path.join(root, "mitm/targets.json"),
    JSON.stringify({ targets: [{ id: "claude-code", hosts: ["api.anthropic.com"] }] })
  );
  const cert = path.join(root, "mitm/server.crt"),
    key = path.join(root, "mitm/server.key");
  assert.equal(
    spawnSync(
      "openssl",
      [
        "req",
        "-x509",
        "-newkey",
        "rsa:2048",
        "-nodes",
        "-keyout",
        key,
        "-out",
        cert,
        "-days",
        "1",
        "-subj",
        "/CN=api.anthropic.com",
        "-addext",
        "subjectAltName=DNS:api.anthropic.com",
      ],
      { stdio: "ignore" }
    ).status,
    0
  );
  fs.chmodSync(key, 0o600);
  let mode = "complete";
  const requests: Record<string, unknown>[] = [];
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const router = http.createServer(async (req, res) => {
    let raw = "";
    for await (const chunk of req) raw += chunk;
    const body = JSON.parse(raw);
    requests.push(body);
    if (!body.stream) {
      const timer = setTimeout(() => {
        timers.delete(timer);
        if (!res.destroyed) res.end(JSON.stringify({ type: "message", content: [] }));
      }, 2200);
      timers.add(timer);
      return;
    }
    res.writeHead(200, { "content-type": "text/event-stream", "request-id": "buffered-fixture" });
    const send = (event: unknown) => res.write(`data: ${JSON.stringify(event)}\n\n`);
    send({
      type: "message_start",
      message: {
        id: "msg_buffered",
        type: "message",
        role: "assistant",
        model: "claude-opus-5-5",
        content: [],
        usage: { input_tokens: 12, output_tokens: 0 },
      },
    });
    send({
      type: "content_block_start",
      index: 0,
      content_block: { type: "thinking", thinking: "", signature: "" },
    });
    send({
      type: "content_block_delta",
      index: 0,
      delta: { type: "thinking_delta", thinking: "" },
    });
    send({
      type: "content_block_delta",
      index: 0,
      delta: { type: "signature_delta", signature: "synthetic-opaque-signature" },
    });
    send({ type: "content_block_stop", index: 0 });
    send({
      type: "content_block_start",
      index: 1,
      content_block: { type: "tool_use", id: "toolu_artifact", name: "Artifact", input: {} },
    });
    send({
      type: "content_block_delta",
      index: 1,
      delta: { type: "input_json_delta", partial_json: '{"title":"Fixture",' },
    });
    send({
      type: "content_block_delta",
      index: 1,
      delta: { type: "input_json_delta", partial_json: '"auto_open":false}' },
    });
    send({ type: "content_block_stop", index: 1 });
    send({
      type: "message_delta",
      delta: {
        stop_reason: "tool_use",
        stop_sequence: null,
        diagnostics: { previous_message_id: "msg_previous" },
      },
      usage: { output_tokens: 30 },
      context_management: { applied_edits: [] },
    });
    if (mode === "complete") send({ type: "message_stop" });
    res.end();
  });
  const listen = (server: net.Server) =>
    new Promise<number>((resolve) =>
      server.listen(0, "127.0.0.1", () => resolve((server.address() as net.AddressInfo).port))
    );
  const routerPort = await listen(router),
    reservation = net.createServer(),
    port = await listen(reservation);
  await new Promise<void>((resolve) => reservation.close(() => resolve()));
  const child = spawn(process.execPath, [path.resolve("src/mitm/server.cjs")], {
    env: {
      ...process.env,
      DATA_DIR: root,
      ROUTER_API_KEY: "synthetic-key",
      OMNIROUTE_BASE_URL: `http://127.0.0.1:${routerPort}`,
      MITM_LOCAL_PORT: String(port),
      MITM_LOCAL_HOST: "127.0.0.1",
      MITM_TARGET_AGENT: "claude-code",
      MITM_CERT_MODE: "legacy",
      MITM_ROUTER_TIMEOUT_MS: "1500",
      INSPECTOR_INTERNAL_INGEST_TOKEN: "",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  t.after(async () => {
    timers.forEach(clearTimeout);
    if (child.exitCode === null) {
      const exited = new Promise<void>((resolve) => child.once("exit", () => resolve()));
      child.kill("SIGTERM");
      await exited;
    }
    router.closeAllConnections();
    await new Promise<void>((resolve) => router.close(() => resolve()));
  });
  await new Promise<void>((resolve, reject) => {
    const deadline = setTimeout(() => reject(new Error("Fixture bridge did not start")), 5000);
    child.stdout.on("data", (chunk) => {
      if (String(chunk).includes("MITM ready")) {
        clearTimeout(deadline);
        resolve();
      }
    });
    child.once("exit", () => {
      clearTimeout(deadline);
      reject(new Error("Fixture bridge exited"));
    });
  });
  const payload = {
    model: "native-buffered-fixture",
    stream: false,
    max_tokens: 64000,
    thinking: { type: "adaptive", display: "updates" },
    output_config: { effort: "xhigh" },
    thread: { type: "create" },
    system: "Preserved fixture",
    messages: [{ role: "user", content: "Create a fixture artifact" }],
    tools: [{ name: "Artifact", input_schema: { type: "object" } }],
  };
  const request = () =>
    new Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }>(
      (resolve, reject) => {
        const req = https.request(
          {
            hostname: "127.0.0.1",
            port,
            servername: "api.anthropic.com",
            ca: fs.readFileSync(cert),
            path: "/v1/messages?beta=true",
            method: "POST",
            headers: {
              host: "api.anthropic.com",
              "content-type": "application/json",
              "x-app": "cli",
            },
            timeout: 5000,
          },
          (res) => {
            let body = "";
            res.on("data", (chunk) => (body += chunk));
            res.on("end", () => resolve({ status: res.statusCode!, headers: res.headers, body }));
            res.on("error", reject);
          }
        );
        req.on("error", reject);
        req.on("timeout", () => req.destroy(new Error("Fixture request timed out")));
        req.end(JSON.stringify(payload));
      }
    );
  const result = await request();
  assert.equal(result.status, 200, result.body);
  assert.match(String(result.headers["content-type"]), /application\/json/);
  const message = JSON.parse(result.body);
  assert.equal(message.stop_reason, "tool_use");
  assert.equal(message.content[0].signature, "synthetic-opaque-signature");
  assert.equal(message.content[0].thinking, "");
  assert.deepEqual(message.content[1].input, { title: "Fixture", auto_open: false });
  assert.equal(message.content[1].name, "Artifact");
  assert.equal(message.usage.input_tokens, 12);
  assert.equal(message.usage.output_tokens, 30);
  assert.deepEqual(message.diagnostics, { previous_message_id: "msg_previous" });
  assert.deepEqual(message.context_management, { applied_edits: [] });
  assert.deepEqual(requests[0], { ...payload, model: "cc/claude-opus-5-5", stream: true });
  mode = "truncated";
  const truncated = await request();
  assert.equal(truncated.status, 502);
  assert.equal(truncated.headers["x-should-retry"], "false");
  assert.equal(JSON.parse(truncated.body).error.code, "agent_bridge_incomplete_response");
});
