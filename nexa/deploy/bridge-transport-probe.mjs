import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import https from "node:https";

// The private input stays in this process; output contains protocol evidence only.
let input = "";
for await (const chunk of process.stdin) {
  input += chunk;
  assert.ok(Buffer.byteLength(input) <= 4096, "Bounded probe input required");
}
const { port, caFile, apiKey } = JSON.parse(input);
assert.ok(Number.isInteger(port) && port > 1024 && port <= 65535);
assert.ok(![28128, 28131, 28132, 8443].includes(port), "Use an isolated listener");
assert.ok(path.isAbsolute(caFile) && fs.statSync(caFile).isFile());
assert.ok(typeof apiKey === "string" && apiKey.length > 20 && !/[\r\n]/.test(apiKey));
const ca = fs.readFileSync(caFile);

function request(method, route, body, trust = ca) {
  return new Promise((resolve, reject) => {
    const bytes = body === undefined ? undefined : Buffer.from(JSON.stringify(body));
    const headers = {
      Host: "api.anthropic.com",
      "User-Agent": "claude-code/2.1.325",
      "anthropic-version": "2023-06-01",
    };
    if (bytes) {
      headers["Content-Type"] = "application/json";
      headers["Content-Length"] = String(bytes.length);
      headers["x-api-key"] = apiKey;
    }
    const client = https.request({
      hostname: "127.0.0.1", port, servername: "api.anthropic.com",
      ca: trust, rejectUnauthorized: true, method, path: route, headers,
      timeout: 8000,
    }, (response) => {
      const chunks = [];
      let size = 0;
      response.on("data", (chunk) => {
        size += chunk.length;
        if (size > 1024 ** 2) client.destroy(new Error("Probe response exceeded its limit"));
        else chunks.push(chunk);
      });
      response.on("error", reject);
      response.on("end", () => {
        try { resolve({ status: response.statusCode, value: JSON.parse(Buffer.concat(chunks)) }); }
        catch { reject(new Error("Bridge returned invalid protocol JSON")); }
      });
    });
    client.on("timeout", () => client.destroy(new Error("Bridge probe timed out")));
    client.on("error", reject);
    client.end(bytes);
  });
}

const deadline = Date.now() + 90000;
let health;
while (Date.now() < deadline) {
  try { health = await request("GET", "/__omniroute_bridge_health"); break; }
  catch (error) {
    if (!["ECONNREFUSED", "ECONNRESET"].includes(error.code)) throw error;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}
assert.equal(health?.status, 200);
assert.equal(health.value.ok, true);
assert.equal(health.value.transportVersion, 1);
assert.equal(health.value.targetAgent, "claude-code");
let untrustedCARejected = false;
try { await request("GET", "/__omniroute_bridge_health", undefined, []); }
catch (error) {
  assert.ok([
    "SELF_SIGNED_CERT_IN_CHAIN", "DEPTH_ZERO_SELF_SIGNED_CERT",
    "UNABLE_TO_VERIFY_LEAF_SIGNATURE", "UNABLE_TO_GET_ISSUER_CERT_LOCALLY",
  ].includes(error.code), "The negative control must fail certificate verification");
  untrustedCARejected = true;
}
assert.equal(untrustedCARejected, true, "An untrusted CA must never be accepted");
const count = await request("POST", "/v1/messages/count_tokens", {
  model: "claude-fable-5-2",
  messages: [{ role: "user", content: "Local protocol verification." }],
});
assert.equal(count.status, 200);
assert.ok(Number.isInteger(count.value.input_tokens) && count.value.input_tokens > 0);
console.log(JSON.stringify({
  status: "PASS", runtime: process.version, certificateVerified: true,
  untrustedCARejected, transportVersion: 1, nativeCountTokensForwarding: true,
  inputTokens: count.value.input_tokens, providerGenerationCalls: 0,
}));
