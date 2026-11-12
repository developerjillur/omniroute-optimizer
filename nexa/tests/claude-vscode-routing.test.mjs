import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import os from "node:os";
import path from "node:path";
import { EventEmitter } from "node:events";
import { launchVSCode, vscodeInvocation } from "../deploy/claude-vscode-launcher.mjs";
import { installVSCode, updateVSCodeSettings, wrapperScript } from "../deploy/install-claude-vscode.mjs";
import { install as installTerminal } from "../deploy/install-claude-terminal.mjs";
import { launch } from "../deploy/claude-terminal-launcher.mjs";

const wrapperKey = "claudeCode.claudeProcessWrapper";

async function fixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "vscode-routing-test-"));
  const home = path.join(root, "home");
  const extension = path.join(home, ".vscode/extensions/anthropic.claude-code-2.1.322-darwin-arm64");
  const binary = path.join(extension, "resources/native-binary/claude");
  await fs.mkdir(path.dirname(binary), { recursive: true });
  await fs.writeFile(binary, "fixture executable never invoked\n");
  await fs.writeFile(path.join(extension, "package.json"), JSON.stringify({
    publisher: "Anthropic", name: "claude-code", version: "2.1.322",
  }));
  const configuration = { binary: path.join(home, ".local/bin/claude"),
    database: path.join(home, ".omniroute-local/storage.sqlite") };
  return { root, home, extension, binary, configuration };
}

test("VS Code consumes only its official bundled binary prefix and keeps SDK arguments intact", async () => {
  const f = await fixture();
  const original = [f.binary, "--input-format", "stream-json", "--output-format", "stream-json",
    "--resume", "existing-session", "--model", "claude-fable-5-2", "--permission-prompt-tool", "stdio"];
  const before = [...original];
  let received;
  await launchVSCode({ ...f, args: original, env: { CLAUDE_CODE_ENTRYPOINT: "claude-vscode" },
    runLaunch: async (options) => { received = options; return 0; } });
  assert.equal(received.binary, f.binary);
  assert.equal(received.database, f.configuration.database);
  assert.deepEqual(received.args, original.slice(1));
  assert.equal(received.env.CLAUDE_CODE_ENTRYPOINT, "claude-vscode");
  assert.deepEqual(original, before);
});

test("an extension without a bundled prefix uses the existing official CLI install", async () => {
  const f = await fixture();
  const args = ["auth", "status", "--json"];
  assert.deepEqual(await vscodeInvocation(args, { home: f.home, fallbackBinary: f.configuration.binary }),
    { binary: f.configuration.binary, args });
});

test("unrelated executables, publishers and symlinks leaving the extension tree are refused", async () => {
  const f = await fixture();
  await assert.rejects(vscodeInvocation(["/usr/bin/python3"], { home: f.home }));
  await assert.rejects(vscodeInvocation(["./project/claude"], { home: f.home }));
  await fs.writeFile(path.join(f.extension, "package.json"), JSON.stringify({ publisher: "other", name: "claude-code" }));
  await assert.rejects(vscodeInvocation([f.binary], { home: f.home }));
  const sibling = path.join(f.extension, "resources/native-binary/foreign");
  await fs.symlink(process.execPath, sibling);
  await assert.rejects(vscodeInvocation([sibling], { home: f.home }));
  const another = path.join(f.home, ".vscode/extensions/anthropic.claude-code-2.1.323-darwin-arm64/resources/native-binary");
  await fs.mkdir(another, { recursive: true });
  await fs.symlink(process.execPath, path.join(another, "claude"));
  await assert.rejects(vscodeInvocation([path.join(another, "claude")], { home: f.home }));
});

test("native and gateway SDK launches retain protocol, Fable ID, hooks, permissions and shared login scope", async () => {
  const f = await fixture();
  const global = { model: "fable", hooks: { Stop: ["owner-hook"] }, permissions: { deny: ["Bash(rm:*)"] }, env: {
    ANTHROPIC_BASE_URL: "https://omni.local", ANTHROPIC_AUTH_TOKEN: "fixture-key",
    ANTHROPIC_MODEL: "claude-sonnet-5-5", ANTHROPIC_DEFAULT_FABLE_MODEL: "claude-fable-5-1",
  } };
  await fs.mkdir(path.join(f.home, ".claude"));
  const globalFile = path.join(f.home, ".claude/settings.json");
  const before = JSON.stringify(global);
  await fs.writeFile(globalFile, before);
  const observed = [];
  let tunnels = 0;
  for (const mode of ["native", "gateway"]) {
    await launchVSCode({ ...f, args: [f.binary, "--input-format", "stream-json", "--output-format", "stream-json",
      "--model", "cc/claude-fable-5-2", "--settings", '{"permissions":{"allow":["Read"]}}'],
    env: { CLAUDE_CODE_ENTRYPOINT: "claude-vscode" },
    runLaunch: (options) => launch({ ...options, modeReader: async () => mode,
      startTunnel: async () => { tunnels++; return { url: "http://127.0.0.1:12345", close() {} }; },
      run: (binary, args, options) => {
        observed.push({ binary, args, options, settings: JSON.parse(fsSync.readFileSync(args[1], "utf8")),
          mode: fsSync.statSync(args[1]).mode & 0o777 });
        const child = new EventEmitter();
        child.kill = () => {};
        setImmediate(() => child.emit("exit", 0));
        return child;
      },
    }), });
  }
  assert.equal(tunnels, 1);
  assert.equal(observed[0].settings.env.ANTHROPIC_BASE_URL, "https://api.anthropic.com");
  assert.equal(observed[0].settings.env.ANTHROPIC_AUTH_TOKEN, "");
  assert.equal(observed[0].settings.env.ANTHROPIC_MODEL, "");
  assert.equal(observed[1].settings.env.ANTHROPIC_BASE_URL, "https://omni.local");
  assert.equal(observed[1].settings.env.ANTHROPIC_AUTH_TOKEN, "fixture-key");
  for (const item of observed) {
    assert.equal(item.binary, f.binary);
    assert.equal(item.options.stdio, "inherit");
    assert.equal(item.mode, 0o600);
    assert.equal(item.settings.env.ANTHROPIC_DEFAULT_FABLE_MODEL, "claude-fable-5-2");
    assert.equal(item.settings.hooks, undefined);
    assert.deepEqual(item.settings.permissions, { allow: ["Read"] });
    assert.equal(item.options.env.CLAUDE_CONFIG_DIR, undefined);
    assert.equal(item.options.env.CLAUDE_CODE_ENTRYPOINT, "claude-vscode");
    assert.ok(item.args.includes("claude-fable-5-2"));
    assert.equal(item.args.join(" ").includes("fixture-key"), false);
  }
  assert.equal(await fs.readFile(globalFile, "utf8"), before);
});

test("JSONC installation preserves comments, nested braces, trailing commas and every unrelated value", () => {
  const source = '{\n  // keep owner comment\n  "owner": {"text":"brace } and URL https://x.test",},\n  "list": [1,2],\n}\n// after root\n';
  const target = "/owner's folder/launcher";
  const updated = updateVSCodeSettings(source, target);
  assert.ok(updated.includes('// keep owner comment'));
  assert.ok(updated.includes('// after root'));
  assert.ok(updated.includes('"owner": {"text":"brace } and URL https://x.test",}'));
  assert.equal(updateVSCodeSettings(updated, target), updated);
  assert.ok(updateVSCodeSettings('{"last":"value" // last comment\n}', target).includes('"last":"value", // last comment'));
  assert.ok(updateVSCodeSettings("{}", target).includes(wrapperKey));
  assert.throws(() => updateVSCodeSettings('{"claudeCode.claudeProcessWrapper":"/custom"}', target));
  assert.throws(() => updateVSCodeSettings('{"claude-code.claudeProcessWrapper":"/legacy"}', target));
  assert.throws(() => updateVSCodeSettings("{ /* broken", target));
  assert.ok(wrapperScript("/node path/node", target).includes('"$@"'));
  assert.ok(wrapperScript("/node path/node", target).includes("'\\''"));
});

async function installedFixture() {
  const f = await fixture();
  await installTerminal({ home: f.home, ...f.configuration, apply: true,
    backupDirectory: path.join(f.root, "terminal-before") });
  const settings = path.join(f.home, "Library/Application Support/Code/User/settings.json");
  await fs.mkdir(path.dirname(settings), { recursive: true });
  const content = '{\n  // preserve\n  "claudeCode.preferredLocation": "panel",\n  "unrelated.setting": {"enabled":true},\n}\n';
  await fs.writeFile(settings, content);
  return { ...f, settings, content, target: path.join(f.home, ".local/share/nexalance/omniroute-terminal") };
}

test("installer previews without changes and then backs up only its own targets", async () => {
  const f = await installedFixture();
  const terminalBefore = await fs.readFile(path.join(f.target, "installation.json"));
  const shellBefore = await fs.readFile(path.join(f.home, ".zshrc"));
  const preview = await installVSCode({ home: f.home });
  assert.equal(preview.status, "prepared");
  assert.equal(await fs.readFile(f.settings, "utf8"), f.content);
  await assert.rejects(fs.stat(path.join(f.target, "claude-vscode-wrapper")), { code: "ENOENT" });
  const options = { home: f.home, workVolume: f.root, isWorkMounted: async () => true };
  const backup = path.join(f.root, "vscode-before");
  const result = await installVSCode({ ...options, apply: true, backupDirectory: backup });
  assert.equal(result.status, "installed");
  assert.equal(JSON.parse(await fs.readFile(path.join(f.target, "vscode-installation.json"), "utf8")).status, "installed");
  assert.equal(await fs.readFile(path.join(backup, "vscode-settings.before.jsonc"), "utf8"), f.content);
  assert.ok((await fs.readFile(f.settings, "utf8")).includes(wrapperKey));
  assert.deepEqual(await fs.readFile(path.join(f.target, "installation.json")), terminalBefore);
  assert.deepEqual(await fs.readFile(path.join(f.home, ".zshrc")), shellBefore);
  assert.equal((await fs.stat(path.join(f.target, "claude-vscode-wrapper"))).mode & 0o777, 0o700);
  assert.equal((await fs.stat(path.join(f.target, "claude-vscode-launcher.mjs"))).mode & 0o777, 0o600);
  assert.equal((await installVSCode({ ...options, apply: true,
    backupDirectory: path.join(f.root, "vscode-again") })).status, "installed");
});

test("installer refuses an unmounted work volume, outside backup path and modified Terminal helper", async () => {
  const f = await installedFixture();
  const options = { home: f.home, workVolume: f.root, apply: true,
    backupDirectory: path.join(f.root, "not-created") };
  await assert.rejects(installVSCode({ ...options, isWorkMounted: async () => false }));
  await assert.rejects(fs.stat(options.backupDirectory), { code: "ENOENT" });
  await assert.rejects(installVSCode({ ...options, isWorkMounted: async () => true,
    backupDirectory: path.join(path.dirname(f.root), "outside-backup") }));
  await fs.appendFile(path.join(f.target, "claude-terminal-launcher.mjs"), "\n// owner edit\n");
  await assert.rejects(installVSCode({ ...options, isWorkMounted: async () => true }));
  assert.equal(await fs.readFile(f.settings, "utf8"), f.content);
});
