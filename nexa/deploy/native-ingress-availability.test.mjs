import test from "node:test";
import assert from "node:assert/strict";
import net from "node:net";
import { once } from "node:events";
import { createIngress, inspectClientHello } from "./native-ingress.mjs";

// Synthetic TLS ClientHello for api.anthropic.com; no real TLS, credential,
// provider endpoint or native session is used by these loopback fixtures.
const packet = Buffer.from(
  "1603010049010000450303" +
    "00".repeat(32) +
    "00000213010100001a0000001600140000116170692e616e7468726f7069632e636f6d",
  "hex"
);
assert.equal(
  inspectClientHello(packet),
  "api.anthropic.com",
  "fixture must select the Bridge route"
);
const ingressFor = (options) =>
  createIngress({
    ...options,
    localRouterHost: "127.0.0.1",
    localRouterPort: options.backendPort,
  });
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const listen = (server, port = 0) =>
  new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve(server.address().port));
  });
const close = (server) => new Promise((resolve) => server.close(resolve));
const unusedPort = async () => {
  const reservation = net.createServer();
  const port = await listen(reservation);
  await close(reservation);
  return port;
};
const exchange = (port) =>
  new Promise((resolve, reject) => {
    const client = net.connect(port, "127.0.0.1", () => client.end(packet));
    const bytes = [];
    client.on("data", (chunk) => bytes.push(chunk));
    client.on("end", () => resolve(Buffer.concat(bytes)));
    client.on("error", reject);
  });

test(
  "an unavailable Bridge never silently sends the mapped conversation to the vendor",
  { timeout: 3000 },
  async (t) => {
    let vendorConnections = 0;
    let fallbackCalls = 0;
    const vendor = net.createServer((client) => {
      vendorConnections++;
      client.pipe(client);
    });
    const vendorPort = await listen(vendor);
    t.after(() => close(vendor));
    const ingress = ingressFor({
      backendPort: await unusedPort(),
      backendWaitMs: 80,
      backendRetryMs: 5,
      publicPort: vendorPort,
      fallback: async () => {
        fallbackCalls++;
        return "127.0.0.1";
      },
    });
    const port = await listen(ingress);
    t.after(() => close(ingress));
    assert.deepEqual(await exchange(port), Buffer.alloc(0), "mapped route must fail closed");
    assert.equal(fallbackCalls, 0);
    assert.equal(vendorConnections, 0);
  }
);

test(
  "a restarting Bridge receives the original encrypted bytes exactly once",
  { timeout: 3000 },
  async (t) => {
    const backendPort = await unusedPort();
    const received = [];
    const backend = net.createServer((client) => {
      const bytes = [];
      client.on("data", (chunk) => bytes.push(chunk));
      client.on("end", () => received.push(Buffer.concat(bytes)));
      client.pipe(client);
    });
    t.after(() => close(backend));
    const ingress = ingressFor({
      backendPort,
      backendWaitMs: 1000,
      backendRetryMs: 10,
      fallback: async () => {
        throw Error("mapped request reached vendor fallback");
      },
    });
    const port = await listen(ingress);
    t.after(() => close(ingress));
    const result = exchange(port);
    await pause(40);
    await listen(backend, backendPort);
    assert.deepEqual(await result, packet, "restart-gap TLS bytes must be retained");
    assert.deepEqual(received, [packet]);
  }
);

test(
  "a disconnected client cancels the pending Bridge connection attempts",
  { timeout: 3000 },
  async (t) => {
    const backendPort = await unusedPort();
    let connections = 0;
    const backend = net.createServer((client) => {
      connections++;
      client.destroy();
    });
    t.after(() => close(backend));
    const ingress = ingressFor({
      backendPort,
      backendWaitMs: 1000,
      backendRetryMs: 10,
      fallback: async () => {
        throw Error("disconnected fixture must not resolve a vendor address");
      },
    });
    const port = await listen(ingress);
    t.after(() => close(ingress));
    const client = net.connect(port, "127.0.0.1");
    await once(client, "connect");
    client.write(packet);
    await pause(20);
    if (!client.destroyed) {
      const closed = once(client, "close");
      client.resetAndDestroy();
      await closed;
    }
    await listen(backend, backendPort);
    await pause(100);
    assert.equal(connections, 0);
  }
);

test(
  "an established upstream failure never replays delivered bytes or changes provider",
  { timeout: 3000 },
  async (t) => {
    let connections = 0;
    let fallbackCalls = 0;
    const backend = net.createServer((client) => {
      connections++;
      client.once("data", () => client.destroy());
    });
    const backendPort = await listen(backend);
    t.after(() => close(backend));
    const ingress = ingressFor({
      backendPort,
      backendWaitMs: 80,
      backendRetryMs: 5,
      allowVendorFallback: true,
      fallback: async () => {
        fallbackCalls++;
        return "127.0.0.1";
      },
    });
    const port = await listen(ingress);
    t.after(() => close(ingress));
    assert.deepEqual(await exchange(port), Buffer.alloc(0));
    await pause(30);
    assert.equal(connections, 1);
    assert.equal(fallbackCalls, 0);
  }
);
