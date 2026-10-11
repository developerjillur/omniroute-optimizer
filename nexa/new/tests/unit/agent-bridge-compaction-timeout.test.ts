import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import { spawn, spawnSync } from "node:child_process";

test("native non-streaming compaction has its own bounded router deadline", async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "bridge-compaction-timeout-"));
  const mitm = path.join(root, "mitm");
  fs.mkdirSync(mitm);
  fs.writeFileSync(
    path.join(root, "db.json"),
    JSON.stringify({ mitmAlias: { "claude-code": { "native-fixture": "cx/gpt-6.1-sol" } } })
  );
  fs.writeFileSync(
    path.join(mitm, "targets.json"),
    JSON.stringify({ targets: [{ id: "claude-code", hosts: ["api.anthropic.com"] }] })
  );
  const cert = path.join(mitm, "server.crt"),
    key = path.join(mitm, "server.key");
  assert.equal(
    spawnSync("openssl", [
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
    ]).status,
    0
  );
  fs.chmodSync(key, 0o600);
  const preload = path.join(root, "short-global-fetch-timeout.cjs");
  fs.writeFileSync(
    preload,
    `const { Agent, setGlobalDispatcher } = require(${JSON.stringify(requireResolveUndici())}); setGlobalDispatcher(new Agent({ headersTimeout: 80, bodyTimeout: 80 }));`
  );
  let mode = "slow",
    cancelled = false,
    received: unknown;
  const router = http.createServer(async (req, res) => {
    let bytes = "";
    for await (const chunk of req) bytes += chunk;
    received = JSON.parse(bytes);
    res.once("close", () => {
      if (!res.writableFinished) cancelled = true;
    });
    if (mode === "timeout") return;
    setTimeout(() => {
      if (!res.destroyed) {
        res.writeHead(200, {
          "content-type": "application/json",
          "request-id": "compact-fixture-id",
        });
        res.end(
          JSON.stringify({
            type: "message",
            role: "assistant",
            content: [{ type: "text", text: "COMPACT_FIXTURE_OK" }],
            stop_reason: "end_turn",
          })
        );
      }
    }, 1400);
  });
  const listen = (server: net.Server) =>
    new Promise<number>((resolve) =>
      server.listen(0, "127.0.0.1", () => resolve((server.address() as net.AddressInfo).port))
    );
  const routerPort = await listen(router);
  const reservation = net.createServer(),
    port = await listen(reservation);
  await new Promise<void>((resolve) => reservation.close(() => resolve()));
  const child = spawn(process.execPath, [path.resolve("src/mitm/server.cjs")], {
    env: {
      ...process.env,
      DATA_DIR: root,
      NODE_OPTIONS: `${process.env.NODE_OPTIONS || ""} --require=${preload}`,
      ROUTER_API_KEY: "synthetic-router-token",
      OMNIROUTE_BASE_URL: `http://127.0.0.1:${routerPort}`,
      MITM_LOCAL_PORT: String(port),
      MITM_LOCAL_HOST: "127.0.0.1",
      MITM_TARGET_AGENT: "claude-code",
      MITM_CERT_MODE: "legacy",
      MITM_ROUTER_TIMEOUT_MS: "2500",
      INSPECTOR_INTERNAL_INGEST_TOKEN: "",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let childErrors = "";
  child.stderr.on("data", (bytes) => {
    childErrors = (childErrors + String(bytes)).slice(-2000);
  });
  t.after(async () => {
    if (child.exitCode === null) {
      const exited = new Promise<void>((resolve) => child.once("exit", () => resolve()));
      child.kill("SIGTERM");
      await exited;
    }
    router.closeAllConnections();
    await new Promise<void>((resolve) => router.close(() => resolve()));
    console.log(JSON.stringify({ disposableFixtureDirectory: root, files: fs.readdirSync(root) }));
    fs.rmSync(root, { recursive: true });
  });
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Fixture Bridge did not start")), 10000);
    child.stdout.on("data", (b) => {
      if (String(b).includes("MITM ready")) {
        clearTimeout(timer);
        resolve();
      }
    });
    child.once("exit", () => {
      clearTimeout(timer);
      reject(new Error("Fixture Bridge exited"));
    });
  });
  const payload = {
    model: "native-fixture",
    stream: false,
    max_tokens: 64,
    messages: [
      { role: "user", content: "Summarize this synthetic conversation; do not call tools." },
    ],
    output_config: { effort: "high" },
    tools: [{ name: "native_tool", input_schema: { type: "object", properties: {} } }],
  };
  const request = () =>
    new Promise<{ status?: number; headers: http.IncomingHttpHeaders; body: string }>(
      (resolve, reject) => {
        const req = https.request(
          {
            hostname: "127.0.0.1",
            port,
            servername: "api.anthropic.com",
            ca: fs.readFileSync(cert),
            method: "POST",
            path: "/v1/messages?beta=true",
            headers: { host: "api.anthropic.com", "content-type": "application/json" },
            timeout: 6000,
          },
          (res) => {
            let body = "";
            res.on("data", (b) => (body += b));
            res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body }));
            res.on("error", reject);
          }
        );
        req.on("timeout", () => req.destroy(new Error("Fixture client timed out")));
        req.on("error", reject);
        req.end(JSON.stringify(payload));
      }
    );
  await t.test("slow JSON survives a shorter process-wide fetch timeout", async () => {
    const response = await request();
    assert.equal(response.status, 200, childErrors);
    assert.equal(response.headers["content-type"], "application/json");
    assert.equal(response.headers["request-id"], "compact-fixture-id");
    assert.equal(JSON.parse(response.body).content[0].text, "COMPACT_FIXTURE_OK");
    assert.deepEqual(received, { ...payload, model: "cx/gpt-6.1-sol" });
  });
  await t.test("an actual deadline returns 504 and cancels only its router request", async () => {
    mode = "timeout";
    cancelled = false;
    const start = Date.now(),
      response = await request();
    assert.equal(response.status, 504, childErrors);
    assert.equal(JSON.parse(response.body).error.code, "agent_bridge_timeout");
    assert.doesNotMatch(response.body, /fetch failed|UND_ERR|stack|synthetic-router-token/);
    assert.ok(Date.now() - start < 5000);
    await new Promise((resolve) => setTimeout(resolve, 100));
    assert.equal(cancelled, true);
    assert.equal(child.exitCode, null);
  });
});

function requireResolveUndici() {
  return path.resolve("node_modules/undici/index.js");
}
