import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "model-test-connection-"));
process.env.DATA_DIR = dataDir;
process.env.MITM_AUTO_RECOVER = "false";
const core = await import("../../src/lib/db/core.ts");
const { createProviderConnection } = await import("../../src/lib/db/providers.ts");
const { runSingleModelTest } = await import("../../src/lib/api/modelTestRunner.ts");
const { getModelTestConnectionId } = await import("../../src/lib/api/modelTestScope.ts");
const { resetAllCircuitBreakers } = await import("../../src/shared/utils/circuitBreaker.ts");
const originalFetch = globalThis.fetch;
const connection = await createProviderConnection({
  provider: "openai",
  authType: "apikey",
  name: "model-test regression",
  apiKey: "fixture-selected-key",
  isActive: true,
  testStatus: "active",
});
await createProviderConnection({
  provider: "openai",
  authType: "apikey",
  name: "fallback sibling",
  apiKey: "fixture-sibling-key",
  isActive: true,
  testStatus: "active",
  priority: 2,
});
const connectionId = String(connection.id);

test.after(() => {
  globalThis.fetch = originalFetch;
  core.resetDbInstance();
  assert.equal(fs.lstatSync(dataDir).isSymbolicLink(), false);
  console.info("Removing isolated test data", {
    directory: dataDir,
    entries: fs.readdirSync(dataDir),
  });
  fs.rmSync(dataDir, { recursive: true, force: true });
});

test("a successful model test reports the connection actually used upstream", async () => {
  resetAllCircuitBreakers();
  globalThis.fetch = async () => {
    assert.equal(getModelTestConnectionId(), connectionId);
    return Response.json({ choices: [{ message: { role: "assistant", content: "pong" } }] });
  };
  const result = await runSingleModelTest({
    providerId: "openai",
    modelId: "gpt-4o",
    connectionId,
    streamChat: false,
    timeoutMs: 10_000,
  });
  assert.equal(result.status, "ok");
  assert.equal(result.selectedConnectionId, connectionId);
  assert.equal(result.responseText, "pong");
  assert.equal(getModelTestConnectionId(), null);
});

test("a delayed streaming test retains its selected connection until the response finishes", async () => {
  resetAllCircuitBreakers();
  let attempts = 0;
  globalThis.fetch = async (_url, options: RequestInit = {}) => {
    attempts++;
    assert.equal(getModelTestConnectionId(), connectionId);
    assert.equal(new Headers(options.headers).get("Authorization"), "Bearer fixture-selected-key");
    // Cross the early-stream keepalive threshold so the outer response is created
    // before upstream headers and the final model response exist.
    await new Promise((resolve) => setTimeout(resolve, 2200));
    return Response.json({
      choices: [{ message: { role: "assistant", content: "delayed pong" } }],
    });
  };
  const result = await runSingleModelTest({
    providerId: "openai",
    modelId: "gpt-4o",
    connectionId,
    streamChat: true,
    timeoutMs: 10_000,
  });
  assert.equal(result.status, "ok");
  assert.equal(result.selectedConnectionId, connectionId);
  assert.equal(result.responseText, "delayed pong");
  assert.equal(attempts, 1);
  assert.ok(result.latencyMs >= 2200);
  assert.equal(getModelTestConnectionId(), null);
});

test("a failed pinned probe cannot try another account", async () => {
  resetAllCircuitBreakers();
  let attempts = 0;
  globalThis.fetch = async (_url, options: RequestInit = {}) => {
    attempts++;
    assert.equal(new Headers(options.headers).get("Authorization"), "Bearer fixture-selected-key");
    return Response.json({ error: { message: "Fixture access denied" } }, { status: 403 });
  };
  const result = await runSingleModelTest({
    providerId: "openai",
    modelId: "gpt-4o",
    connectionId,
    streamChat: false,
    timeoutMs: 10_000,
  });
  assert.equal(result.status, "error");
  assert.ok(attempts > 0);
});

test("a cancelled caller never dispatches an upstream test", async () => {
  let attempts = 0;
  globalThis.fetch = async () => {
    attempts++;
    throw new Error("unexpected dispatch");
  };
  const controller = new AbortController();
  controller.abort();
  const result = await runSingleModelTest({
    providerId: "openai",
    modelId: "gpt-4o",
    connectionId,
    signal: controller.signal,
    timeoutMs: 10_000,
  });
  assert.equal(result.httpStatus, 499);
  assert.equal(result.rateLimited, undefined);
  assert.equal(attempts, 0);
});

test("caller cancellation during an upstream call stops the model test", async () => {
  resetAllCircuitBreakers();
  const controller = new AbortController();
  globalThis.fetch = async (_url, options: RequestInit = {}) => {
    const signal = options.signal;
    assert.ok(signal);
    return new Promise<Response>((_resolve, reject) => {
      signal.addEventListener("abort", () => reject(new DOMException("Cancelled", "AbortError")), {
        once: true,
      });
      controller.abort();
    });
  };
  const result = await runSingleModelTest({
    providerId: "openai",
    modelId: "gpt-4o",
    connectionId,
    signal: controller.signal,
    timeoutMs: 10_000,
  });
  assert.equal(result.httpStatus, 499);
  assert.equal(result.rateLimited, undefined);
});
