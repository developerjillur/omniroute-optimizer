import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import net from "node:net";
import tls from "node:tls";
import vm from "node:vm";
import { EventEmitter } from "node:events";

// Exercise the production bootstrap without opening a listener or using a key,
// certificate, provider, native session or global exception handler.
async function bootstrap() {
  const source = fs.readFileSync(new URL("../../src/mitm/server.cjs", import.meta.url), "utf8");
  const start = source.indexOf("async function startMitmServer() {");
  const end = source.lastIndexOf("\nstartMitmServer().catch(");
  assert.ok(start >= 0 && end > start, "production bootstrap must be available");
  const server = new EventEmitter() as EventEmitter & {
    listen: (port: number, ready: () => void) => void;
  };
  server.listen = (_port, ready) => ready();
  const processEvents: string[] = [];
  const exits: number[] = [];
  const stats = { activeConnections: 0 };
  const context = {
    CERT_MODE: "legacy",
    loadLegacySslOptions: () => ({}),
    https: { createServer: () => server },
    MITM_IDLE_TIMEOUT_MS: 60_000,
    LOCAL_PORT: 8443,
    ROUTER_URL: "http://127.0.0.1:28128",
    stats,
    writeStats: () => {},
    vlog: () => {},
    console: { log: () => {}, error: () => {} },
    process: {
      on: (event: string) => processEvents.push(event),
      exit: (code: number) => exits.push(code),
    },
    peerGuardShim: { guardLoopbackPeer: () => true },
  };
  const run = vm.runInNewContext(`${source.slice(start, end)}\nstartMitmServer`, context, {
    timeout: 1000,
  });
  await run();
  return { server, processEvents, exits, stats };
}

for (const phase of ["connection", "secureConnection"] as const) {
  test(`late EPIPE on ${phase} closes only that client and preserves other sessions`, async (t) => {
    const { server, processEvents, exits } = await bootstrap();
    const healthy = new net.Socket();
    const failed =
      phase === "secureConnection" ? new tls.TLSSocket(new net.Socket()) : new net.Socket();
    t.after(() => {
      healthy.destroy();
      failed.destroy();
    });
    server.emit("connection", healthy);
    server.emit(phase, failed);
    const failure = Object.assign(new Error("write EPIPE"), { code: "EPIPE" });
    assert.doesNotThrow(() => failed.emit("error", failure), "client-socket-EPIPE");
    assert.equal(failed.destroyed, true);
    assert.equal(healthy.destroyed, false, "another session must remain open");
    assert.deepEqual(exits, []);
    assert.deepEqual(processEvents.sort(), ["SIGINT", "SIGTERM"]);
    assert.doesNotThrow(() => healthy.emit("error", new Error("late client reset")));
    assert.equal(healthy.destroyed, true);
  });
}

test("CONNECT re-emission keeps one client error handler and one connection count", async (t) => {
  const { server, stats } = await bootstrap();
  const socket = new net.Socket();
  t.after(() => socket.destroy());
  server.emit("connection", socket);
  server.emit("connection", socket);
  server.emit("secureConnection", socket);
  assert.equal(socket.listenerCount("error"), 1, "CONNECT must not accumulate error handlers");
  assert.equal(stats.activeConnections, 1);
  assert.doesNotThrow(() => socket.emit("error", new Error("late reset")));
});

test("listener failures remain fatal instead of being hidden by client error recovery", async () => {
  const { server, exits } = await bootstrap();
  server.emit("error", Object.assign(new Error("port in use"), { code: "EADDRINUSE" }));
  assert.deepEqual(exits, [1]);
});
