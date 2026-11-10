import net from "node:net";
import tls from "node:tls";
import { syncBuiltinESMExports } from "node:module";

// Protect the socket layer as well as global fetch. A lazily imported transport
// may replace fetch or use an explicit Undici dispatcher beneath a test mock.
function assertIsolatedConnection(args) {
  const values = Array.isArray(args[0]) ? args[0] : args;
  const options =
    values[0] && typeof values[0] === "object"
      ? values[0]
      : { port: values[0], host: typeof values[1] === "string" ? values[1] : "localhost" };
  if (options.socket) return; // An already connected socket passed to TLS.
  const host = String(options.host || options.hostname || "localhost").toLowerCase();
  const port = Number(options.port);
  if (
    !["localhost", "127.0.0.1", "::1", "[::1]"].includes(host) ||
    !Number.isInteger(port) ||
    port <= 1023 ||
    port > 65535 ||
    [28128, 8443].includes(port)
  ) {
    throw new Error("Fixture socket guard blocked a request outside an isolated local test server");
  }
}
const socketConnect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (...args) {
  assertIsolatedConnection(args);
  return socketConnect.apply(this, args);
};
const tlsConnect = tls.connect;
tls.connect = function (...args) {
  assertIsolatedConnection(args);
  return tlsConnect.apply(this, args);
};
syncBuiltinESMExports();

// Synthetic application fixtures may fetch only their ephemeral loopback server.
const baseFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const raw = input instanceof Request ? input.url : String(input);
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Fixture attempted a non-mocked fetch");
  }
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (!local || ["", "80", "443", "28128", "8443"].includes(url.port)) {
    throw new Error("Fixture fetch guard blocked a request outside an isolated local test server");
  }
  return baseFetch(input, init);
};
