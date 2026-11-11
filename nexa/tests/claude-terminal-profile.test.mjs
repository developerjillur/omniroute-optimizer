import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import os from "node:os";
import path from "node:path";
import net from "node:net";
import http from "node:http";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { EventEmitter, once } from "node:events";
import { createRequire } from "node:module";
import {
  launch,
  extractSettingsArguments,
  readSettings,
  readRoutingMode,
} from "../deploy/claude-terminal-launcher.mjs";
import { startTerminalTunnel, bypassesProxy } from "../deploy/claude-terminal-tunnel.mjs";
import { install, updateShell, shellBlock } from "../deploy/install-claude-terminal.mjs";

const require = createRequire(import.meta.url);
const {
  buildTerminalLaunchSettings,
  mergeTerminalProfile,
  parseSettingsJson,
} = require("../new/src/mitm/_internal/claudeTerminalProfile.cjs");
const original = {
  model: "opus",
  hooks: { UserPromptSubmit: ["owner hook"] },
  permissions: { allow: ["Read"] },
  env: {
    ANTHROPIC_BASE_URL: "https://omni.local",
    ANTHROPIC_AUTH_TOKEN: "fixture-gateway-token",
    ANTHROPIC_MODEL: "cc/claude-opus-5-5",
    ANTHROPIC_DEFAULT_FABLE_MODEL: "claude-fable-5-1",
    CUSTOM_OWNER_ENV: "retain",
  },
};

function proxyRequest(proxyUrl, options) {
  const proxy = new URL(proxyUrl);
  return http.request(proxy.origin, {
    ...options,
    headers: {
      ...options.headers,
      "proxy-authorization":
        "Basic " +
        Buffer.from(
          decodeURIComponent(proxy.username) + ":" + decodeURIComponent(proxy.password)
        ).toString("base64"),
    },
  });
}

test("native Terminal mode isolates authentication and preserves global settings", () => {
  const before = JSON.stringify(original);
  const native = buildTerminalLaunchSettings("native", original, {});
  assert.equal(native.env.ANTHROPIC_BASE_URL, "https://api.anthropic.com");
  assert.equal(native.env.ANTHROPIC_AUTH_TOKEN, "");
  assert.equal(native.env.ANTHROPIC_API_KEY, "");
  assert.equal(native.env.ANTHROPIC_MODEL, "");
  assert.equal(native.model, "opus");
  assert.equal(native.env.ANTHROPIC_DEFAULT_FABLE_MODEL, "claude-fable-5-2");
  assert.equal(native.hooks, undefined);
  assert.equal(native.permissions, undefined);
  assert.equal(JSON.stringify(original), before);
});

test("gateway mode keeps the key, normalizes selection and requires configured credentials", () => {
  const gateway = buildTerminalLaunchSettings("gateway", original, {});
  assert.equal(gateway.env.ANTHROPIC_AUTH_TOKEN, "fixture-gateway-token");
  assert.equal(gateway.env.CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY, "1");
  assert.equal(gateway.env.CLAUDE_CODE_OAUTH_TOKEN, "");
  assert.throws(() => buildTerminalLaunchSettings("gateway", {}, {}));
  assert.throws(() =>
    buildTerminalLaunchSettings(
      "gateway",
      { env: { ANTHROPIC_BASE_URL: "https://user:pass@example.test" } },
      {}
    )
  );
  const explicit = mergeTerminalProfile(original, {
    env: { ANTHROPIC_DEFAULT_FABLE_MODEL: "claude-fable-5-1" },
  });
  assert.equal(explicit.env.ANTHROPIC_DEFAULT_FABLE_MODEL, "claude-fable-5-1");
});

test("JSONC parser preserves comment-like strings, trailing commas inside strings and rejects broken input", () => {
  assert.deepEqual(
    parseSettingsJson('{/* comment */ "env": {"URL":"https://x.test/a,}",}, // end\n}'),
    { env: { URL: "https://x.test/a,}" } }
  );
  assert.throws(() => parseSettingsJson("{ /* broken"));
  assert.throws(() => parseSettingsJson("[]"));
  assert.throws(() => parseSettingsJson('{"env":{"x":false}}'));
});

test("launch overlays are private, preserve flags and never pass secret settings in argv", async () => {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), "terminal-launch-test-"));
  const config = path.join(home, ".claude");
  await fs.mkdir(config);
  const globalFile = path.join(config, "settings.json");
  const bytes = JSON.stringify(original);
  await fs.writeFile(globalFile, bytes);
  const captured = [];
  const run = (binary, args, options) => {
    const filename = args[1];
    captured.push({
      binary,
      args,
      env: options.env,
      settings: JSON.parse(fsSync.readFileSync(filename, "utf8")),
      mode: fsSync.statSync(filename).mode & 0o777,
    });
    const child = new EventEmitter();
    child.kill = () => {};
    setImmediate(() => child.emit("exit", 0, null));
    return child;
  };
  let closed = 0;
  const options = {
    home,
    binary: "/fixture/official-claude",
    env: { PATH: "/fixture" },
    modeReader: async () => "native",
    run,
    startTunnel: async () => ({ url: "http://127.0.0.1:12345", close: () => closed++ }),
  };
  assert.equal(
    await launch({
      ...options,
      args: [
        "--resume",
        "existing-session",
        "--model",
        "cc/claude-fable-5-2",
        "--settings",
        '{"hooks":{"Stop":[]},"permissions":{"allow":["Read"]}}',
        "--",
        "prompt",
      ],
    }),
    0
  );
  assert.equal(captured[0].mode, 0o600);
  assert.deepEqual(captured[0].args.slice(2), [
    "--resume",
    "existing-session",
    "--model",
    "claude-fable-5-2",
    "--",
    "prompt",
  ]);
  assert.equal(captured[0].args.join(" ").includes("fixture-gateway-token"), false);
  assert.deepEqual(captured[0].settings.hooks, { Stop: [] });
  assert.equal(captured[0].env.ANTHROPIC_AUTH_TOKEN, "");
  assert.equal(captured[0].env.CUSTOM_OWNER_ENV, "retain");
  assert.equal(captured[0].env.CLAUDE_CONFIG_DIR, undefined);
  assert.equal(closed, 1);
  assert.equal(await fs.readFile(globalFile, "utf8"), bytes);
  await assert.rejects(fs.stat(captured[0].args[1]), { code: "ENOENT" });
  await launch({ ...options, modeReader: async () => "gateway", args: [] });
  assert.equal(closed, 1);
  assert.equal(captured[1].env.ANTHROPIC_AUTH_TOKEN, "fixture-gateway-token");
  await assert.rejects(launch({ ...options, args: ["--model", "cx/gpt-6.1-sol"] }));
});

test("missing explicit settings and unavailable mode store fail before starting Claude", async () => {
  await assert.rejects(
    extractSettingsArguments(["--settings", "/missing-terminal-test-settings.json"]),
    { code: "ENOENT" }
  );
  await assert.rejects(readSettings("/missing-terminal-test-settings.json", true));
  let spawned = false;
  await assert.rejects(
    launch({
      modeReader: async () => {
        throw Error("store unavailable");
      },
      run: () => {
        spawned = true;
      },
    })
  );
  assert.equal(spawned, false);
});

test("CONNECT tunnel carries opaque bytes without TLS termination and avoids loopback native DNS", async () => {
  const destination = net.createServer((socket) => socket.pipe(socket));
  destination.listen(0, "127.0.0.1");
  await once(destination, "listening");
  const resolved = [];
  const tunnel = await startTerminalTunnel({
    resolveApi: async (host) => {
      resolved.push(host);
      return "203.0.113.5";
    },
    connect: ({ host, port }) => {
      assert.equal(host, "203.0.113.5");
      assert.equal(port, 443);
      return net.connect(destination.address().port, "127.0.0.1");
    },
  });
  try {
    const req = proxyRequest(tunnel.url, { method: "CONNECT", path: "api.anthropic.com:443" });
    const connected = once(req, "connect");
    req.end();
    const [res, socket] = await connected;
    assert.equal(res.statusCode, 200);
    const bytes = Buffer.from([0x16, 0x03, 0x01, 0, 5, 0xff, 0, 0x7f]);
    const data = once(socket, "data");
    socket.write(bytes);
    assert.deepEqual((await data)[0], bytes);
    socket.destroy();
    assert.deepEqual(resolved, ["api.anthropic.com"]);
  } finally {
    tunnel.close();
    await new Promise((resolve) => destination.close(resolve));
  }
});

test("upstream proxy and original NO_PROXY policy stay effective", async () => {
  assert.equal(bypassesProxy("sub.example.test", 443, ".example.test"), true);
  assert.equal(bypassesProxy("example.test", 443, "example.test:8443"), false);
  assert.equal(bypassesProxy("api.anthropic.com", 443, "*"), true);
  assert.equal(bypassesProxy("::1", 443, "[::1]:443"), true);
  assert.equal(bypassesProxy("::1", 443, "::1"), true);
  assert.equal(bypassesProxy("::1", 443, "[::1]:8443"), false);
  const requests = [];
  const proxy = http.createServer();
  proxy.on("connect", (req, socket) => {
    requests.push(req.url);
    socket.end("HTTP/1.1 403 Forbidden\r\n\r\n");
  });
  proxy.listen(0, "127.0.0.1");
  await once(proxy, "listening");
  const tunnel = await startTerminalTunnel({
    upstreamProxy: `http://127.0.0.1:${proxy.address().port}`,
    resolveApi: async () => {
      throw Error("must use existing proxy");
    },
  });
  try {
    const req = proxyRequest(tunnel.url, { method: "CONNECT", path: "api.anthropic.com:443" });
    const connected = once(req, "connect");
    req.end();
    const [res, socket] = await connected;
    assert.equal(res.statusCode, 502);
    socket.destroy();
    assert.deepEqual(requests, ["api.anthropic.com:443"]);
  } finally {
    tunnel.close();
    await new Promise((resolve) => proxy.close(resolve));
  }
});

test("installer preserves shell bytes outside its block, leaves global settings and official binary untouched", async () => {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), "terminal-install-test-"));
  const originalShell = "export OWNER_TEST='retain'\n";
  await fs.writeFile(path.join(home, ".zshrc"), originalShell);
  await fs.mkdir(path.join(home, ".claude"));
  const globalFile = path.join(home, ".claude/settings.json");
  await fs.writeFile(globalFile, JSON.stringify(original));
  const before = await fs.readFile(globalFile, "utf8");
  const backup = path.join(home, "backup");
  const prepared = await install({ home });
  assert.equal(prepared.status, "prepared");
  assert.equal(await fs.readFile(path.join(home, ".zshrc"), "utf8"), originalShell);
  const applied = await install({ home, apply: true, backupDirectory: backup });
  assert.equal(applied.status, "installed");
  assert.equal(applied.officialBinaryChanged, false);
  assert.equal(await fs.readFile(globalFile, "utf8"), before);
  assert.equal(await fs.readFile(path.join(backup, "zshrc.before"), "utf8"), originalShell);
  const shell = await fs.readFile(path.join(home, ".zshrc"), "utf8");
  assert.ok(shell.startsWith(originalShell));
  assert.equal(
    updateShell(
      shell,
      shellBlock(process.execPath, path.join(applied.target, "claude-terminal-launcher.mjs"))
    ),
    shell
  );
  await fs.appendFile(
    path.join(applied.target, "claude-terminal-launcher.mjs"),
    "\n// owner edit\n"
  );
  await assert.rejects(install({ home }));
});

test("the next Terminal launch reads the changed DB flag without writing the store", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "terminal-mode-db-"));
  const database = path.join(directory, "storage.sqlite");
  const write = (value) =>
    execFileSync("/usr/bin/python3", [
      "-c",
      `import sqlite3,sys
c=sqlite3.connect(sys.argv[1])
c.execute("CREATE TABLE IF NOT EXISTS key_value(namespace TEXT,key TEXT,value TEXT)")
c.execute("DELETE FROM key_value")
c.execute("INSERT INTO key_value VALUES('feature_flags','OMNIROUTE_AUTO_SYNC_CLAUDE_PROFILES',?)",(sys.argv[2],))
c.commit()
c.close()`,
      database,
      value,
    ]);
  const hash = async () =>
    createHash("sha256")
      .update(await fs.readFile(database))
      .digest("hex");
  write("false");
  const before = await hash();
  assert.equal(
    await readRoutingMode(database, { OMNIROUTE_AUTO_SYNC_CLAUDE_PROFILES: "true" }),
    "native"
  );
  assert.equal(await hash(), before);
  write("true");
  const on = await hash();
  assert.equal(await readRoutingMode(database, {}), "gateway");
  assert.equal(await hash(), on);
  const missing = path.join(directory, "missing.sqlite");
  await assert.rejects(readRoutingMode(missing, {}));
  await assert.rejects(fs.stat(missing), { code: "ENOENT" });
});

test("Off ignores saved gateway model mappings while On restores them", () => {
  const terminal = {
    env: {
      ANTHROPIC_MODEL: "claude-haiku-5-5",
      ANTHROPIC_DEFAULT_FABLE_MODEL: "cx/gpt-6.1-sol",
    },
  };
  const native = buildTerminalLaunchSettings("native", original, terminal);
  assert.equal(native.env.ANTHROPIC_MODEL, "");
  assert.equal(native.model, "opus");
  assert.equal(native.env.ANTHROPIC_DEFAULT_FABLE_MODEL, "claude-fable-5-2");
  const gateway = buildTerminalLaunchSettings("gateway", original, terminal);
  assert.equal(gateway.env.ANTHROPIC_MODEL, "claude-haiku-5-5");
  assert.equal(gateway.env.ANTHROPIC_DEFAULT_FABLE_MODEL, "cx/gpt-6.1-sol");
  assert.equal(
    buildTerminalLaunchSettings("native", original, {}, { model: "cc/claude-fable-5-2" }).model,
    "claude-fable-5-2"
  );
  assert.throws(() =>
    buildTerminalLaunchSettings("native", original, {}, { model: "cx/gpt-6.1-sol" })
  );
});

test("an unrelated local client cannot use the Terminal tunnel or inherited proxy credentials", async () => {
  let connected = false;
  const tunnel = await startTerminalTunnel({
    resolveApi: async () => {
      connected = true;
      throw Error("must not resolve without authentication");
    },
  });
  try {
    const proxy = new URL(tunnel.url);
    const req = http.request(proxy.origin, { method: "CONNECT", path: "api.anthropic.com:443" });
    const response = once(req, "connect");
    req.end();
    const [res, socket] = await response;
    assert.equal(res.statusCode, 407);
    socket.destroy();
    assert.equal(connected, false);
  } finally {
    tunnel.close();
  }
});

test("late upstream errors close TLS tunnels without HTTP injection", async () => {
  const destination = net.createServer((socket) => socket.pipe(socket));
  destination.listen(0, "127.0.0.1");
  await once(destination, "listening");
  let outbound;
  const tunnel = await startTerminalTunnel({
    resolveApi: async () => "203.0.113.5",
    connect: () => {
      outbound = net.connect(destination.address().port, "127.0.0.1");
      return outbound;
    },
  });
  const originalWrite = net.Socket.prototype.write;
  const originalEnd = net.Socket.prototype.end;
  let lateHttpErrors = 0;
  try {
    const req = proxyRequest(tunnel.url, { method: "CONNECT", path: "api.anthropic.com:443" });
    const connected = once(req, "connect");
    req.end();
    const [response, client] = await connected;
    assert.equal(response.statusCode, 200);
    client.on("error", () => {});
    const closed = new Promise((resolve) => client.once("close", resolve));
    net.Socket.prototype.write = function (chunk, ...args) {
      if (typeof chunk === "string" && chunk.includes("502 Bad Gateway")) lateHttpErrors++;
      return originalWrite.call(this, chunk, ...args);
    };
    net.Socket.prototype.end = function (chunk, ...args) {
      if (typeof chunk === "string" && chunk.includes("502 Bad Gateway")) lateHttpErrors++;
      return originalEnd.call(this, chunk, ...args);
    };
    outbound.emit("error", new Error("fixture late connection reset"));
    outbound.destroy();
    await closed;
    assert.equal(lateHttpErrors, 0);
  } finally {
    net.Socket.prototype.write = originalWrite;
    net.Socket.prototype.end = originalEnd;
    tunnel.close();
    await new Promise((resolve) => destination.close(resolve));
  }
});
