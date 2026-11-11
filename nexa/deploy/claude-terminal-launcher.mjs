import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath, pathToFileURL } from "node:url";
import { startTerminalTunnel } from "./claude-terminal-tunnel.mjs";

const require = createRequire(import.meta.url);
const {
  buildTerminalLaunchSettings,
  parseSettingsJson,
  isNativeModel,
  normalizeClaudeModelId,
  PROFILE_FLAG,
  PROFILE_DIRECTORY,
} = require(
  (await fs.stat(new URL("./claudeTerminalProfile.cjs", import.meta.url)).catch(() => null))
    ? "./claudeTerminalProfile.cjs"
    : "../new/src/mitm/_internal/claudeTerminalProfile.cjs"
);
const exec = promisify(execFile);

export async function readSettings(filename, required = false) {
  try {
    const stat = await fs.stat(filename);
    if (!stat.isFile() || stat.size > 2 * 1024 * 1024) throw Error("Invalid settings file");
    return parseSettingsJson(await fs.readFile(filename, "utf8"));
  } catch (error) {
    if (!required && error.code === "ENOENT") return {};
    throw error;
  }
}

export async function readRoutingMode(database, env = process.env) {
  // Opening the existing database read-only does not start OmniRoute or run migrations.
  // A failed read is an error, never a silent change of billing/provider.
  const { stdout } = await exec(
    "/usr/bin/python3",
    [
      "-c",
      [
        "import sqlite3,sys,pathlib,json",
        "p=pathlib.Path(sys.argv[1]).resolve(strict=True)",
        "c=sqlite3.connect(p.as_uri()+'?mode=ro',uri=True,timeout=2)",
        "r=c.execute(\"SELECT value FROM key_value WHERE namespace='feature_flags' AND key=?\",(sys.argv[2],)).fetchone()",
        "print(json.dumps(None if r is None else r[0]))",
        "c.close()",
      ].join("\n"),
      database,
      PROFILE_FLAG,
    ],
    { timeout: 5000, maxBuffer: 4096 }
  );
  const override = JSON.parse(stdout);
  const value = override ?? env[PROFILE_FLAG] ?? "false";
  return ["true", "1", "yes"].includes(value) ? "gateway" : "native";
}

export async function extractSettingsArguments(args) {
  const remaining = [],
    settings = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--") {
      remaining.push(...args.slice(i));
      break;
    }
    if (arg !== "--settings" && !arg.startsWith("--settings=")) {
      remaining.push(arg);
      continue;
    }
    const value = arg === "--settings" ? args[++i] : arg.slice("--settings=".length);
    if (!value) throw Error("--settings requires a JSON object or file");
    const supplied = value.trim().startsWith("{")
      ? parseSettingsJson(value)
      : await readSettings(value, true);
    Object.assign(settings, supplied, { env: { ...settings.env, ...supplied.env } });
  }
  return { args: remaining, settings };
}

export function nativeProxyEnvironment(env, proxyUrl) {
  const result = { ...env };
  // The tunnel applies the previous proxy/NO_PROXY policy itself. This also covers
  // a wildcard NO_PROXY that would otherwise send api.anthropic.com into the Bridge.
  for (const key of ["HTTP_PROXY", "http_proxy", "HTTPS_PROXY", "https_proxy"])
    result[key] = proxyUrl;
  result.NO_PROXY = "localhost,127.0.0.1,::1";
  result.no_proxy = result.NO_PROXY;
  return result;
}

export async function launch({
  home = os.homedir(),
  env = process.env,
  args = process.argv.slice(2),
  binary = path.join(home, ".local/bin/claude"),
  database = path.join(home, ".omniroute-local/storage.sqlite"),
  modeReader = readRoutingMode,
  startTunnel = startTerminalTunnel,
  run = spawn,
} = {}) {
  // Version/help checks must not create profiles, query credentials or start a proxy.
  if (args.length === 1 && ["--version", "-v", "--help", "-h"].includes(args[0])) {
    return await runChild(binary, args, env, run);
  }
  const configHome = env.CLAUDE_CONFIG_DIR || path.join(home, ".claude");
  const mode = await modeReader(database, env);
  const globalSettings = await readSettings(path.join(configHome, "settings.json"));
  const profile = await readSettings(path.join(configHome, PROFILE_DIRECTORY, "settings.json"));
  const supplied = await extractSettingsArguments(args);
  for (let i = 0; i < supplied.args.length; i++) {
    const arg = supplied.args[i];
    if (arg === "--") break;
    const named = arg === "--model" || arg === "--fallback-model";
    const inline = arg.startsWith("--model=") || arg.startsWith("--fallback-model=");
    if (!named && !inline) continue;
    const value = named ? supplied.args[++i] : arg.slice(arg.indexOf("=") + 1);
    if (!value) throw Error("A model argument is missing");
    if (mode === "native" && !isNativeModel(value))
      throw Error("Enable Terminal routing for a non-Claude model");
    const normalized = normalizeClaudeModelId(value);
    supplied.args[i] = named ? normalized : arg.slice(0, arg.indexOf("=") + 1) + normalized;
  }
  const settings = buildTerminalLaunchSettings(mode, globalSettings, profile, supplied.settings);
  let childEnv = { ...env, ...globalSettings.env, ...settings.env };
  let tunnel;
  let temporary;
  try {
    if (mode === "native") {
      const upstreamProxy =
        childEnv.https_proxy || childEnv.HTTPS_PROXY || childEnv.http_proxy || childEnv.HTTP_PROXY;
      tunnel = await startTunnel({
        upstreamProxy,
        noProxy: childEnv.no_proxy ?? childEnv.NO_PROXY ?? "",
      });
      childEnv = nativeProxyEnvironment(childEnv, tunnel.url);
      // Settings env has precedence over the shell. Scope proxy overrides to this launch too.
      for (const key of [
        "HTTP_PROXY",
        "http_proxy",
        "HTTPS_PROXY",
        "https_proxy",
        "NO_PROXY",
        "no_proxy",
      ])
        settings.env[key] = childEnv[key];
    }
    const directory = path.join(configHome, PROFILE_DIRECTORY);
    await fs.mkdir(directory, { recursive: true, mode: 0o700 });
    if ((await fs.lstat(directory)).isSymbolicLink())
      throw Error("Terminal profile directory must not be a symlink");
    temporary = await fs.mkdtemp(path.join(directory, "launch-"));
    await fs.chmod(temporary, 0o700);
    const filename = path.join(temporary, "settings.json");
    await fs.writeFile(filename, JSON.stringify(settings), { mode: 0o600, flag: "wx" });
    // Same native login, project, hooks and history; no separate CLAUDE_CONFIG_DIR.
    return await runChild(binary, ["--settings", filename, ...supplied.args], childEnv, run);
  } finally {
    tunnel?.close();
    if (temporary) {
      // Only these two paths were exclusively created by this launch. No recursive deletion.
      await fs.unlink(path.join(temporary, "settings.json")).catch(() => {});
      await fs.rmdir(temporary).catch(() => {});
    }
  }
}

function runChild(binary, args, env, run) {
  return new Promise((resolve, reject) => {
    const child = run(binary, args, { env, stdio: "inherit" });
    const handlers = new Map(
      ["SIGINT", "SIGTERM", "SIGHUP"].map((signal) => {
        const handler = () => {
          if (!child.killed) child.kill(signal);
        };
        process.on(signal, handler);
        return [signal, handler];
      })
    );
    const clean = () => {
      for (const [signal, handler] of handlers) process.off(signal, handler);
    };
    child.once("error", (error) => {
      clean();
      reject(error);
    });
    child.once("exit", (code, signal) => {
      clean();
      resolve(code ?? (signal === "SIGINT" ? 130 : 1));
    });
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const directory = path.dirname(fileURLToPath(import.meta.url));
  try {
    const local = JSON.parse(await fs.readFile(path.join(directory, "installation.json"), "utf8"));
    process.exitCode = await launch({ binary: local.binary, database: local.database });
  } catch {
    console.error(
      "Claude Terminal routing could not start. Check its profile and OmniRoute availability; no provider request was sent."
    );
    process.exitCode = 1;
  }
}
