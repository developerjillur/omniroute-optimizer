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
