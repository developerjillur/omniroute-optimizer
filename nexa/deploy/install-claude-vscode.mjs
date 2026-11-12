import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { parseSettingsJson } = require("../new/src/mitm/_internal/claudeTerminalProfile.cjs");
const directory = path.dirname(fileURLToPath(import.meta.url));
const key = "claudeCode.claudeProcessWrapper";
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const quote = (value) => "'" + value.replaceAll("'", "'\\''") + "'";

export function wrapperScript(node, launcher) {
  if (!path.isAbsolute(node) || !path.isAbsolute(launcher)) throw Error("Absolute paths required");
  return `#!/bin/sh\nexec ${quote(node)} ${quote(launcher)} "$@"\n`;
}

/** Insert one root property; all existing JSONC bytes, comments and values remain. */
export function updateVSCodeSettings(original, wrapper) {
  const settings = parseSettingsJson(original);
  if (Object.hasOwn(settings, key)) {
    if (settings[key] === wrapper) return original;
    throw Error("An existing VS Code Claude process wrapper needs review");
  }
  if (settings["claude-code.claudeProcessWrapper"])
    throw Error("An existing legacy VS Code Claude process wrapper needs review");
  let quoted = false,
    escaped = false,
    depth = 0,
    lastToken = "",
    lastEnd = 0,
    closing = -1;
  for (let i = 0; i < original.length; i++) {
    const c = original[i];
    if (quoted) {
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === '"') {
        quoted = false;
        lastToken = c;
        lastEnd = i + 1;
      }
      continue;
    }
    if (c === "/" && original[i + 1] === "/") {
      while (i < original.length && original[i] !== "\n") i++;
      continue;
    }
    if (c === "/" && original[i + 1] === "*") {
      i = original.indexOf("*/", i + 2) + 1;
      continue;
    }
    if (c === '"') {
      quoted = true;
      continue;
    }
    if (c === "}" && depth === 1) {
      closing = i;
      break;
    }
    if (c === "{" || c === "[") depth++;
    if (c === "}" || c === "]") depth--;
    if (!/\s/.test(c)) {
      lastToken = c;
      lastEnd = i + 1;
    }
  }
  if (closing < 0) throw Error("Missing settings object boundary");
  const comma = lastToken === "{" || lastToken === "," ? "" : ",";
  const indent = original.match(/\n([ \t]+)"/)?.[1] || "  ";
  let prefix = original.slice(0, lastEnd) + comma + original.slice(lastEnd, closing);
  if (!prefix.endsWith("\n")) prefix += "\n";
  const updated = prefix + indent + JSON.stringify(key) + ": " + JSON.stringify(wrapper) +
    "\n" + original.slice(closing);
  const parsed = parseSettingsJson(updated);
  delete parsed[key];
  if (JSON.stringify(parsed) !== JSON.stringify(settings)) throw Error("Unrelated settings changed");
  return updated;
}

async function regular(filename) {
  try {
    const stat = await fs.lstat(filename);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 2 * 1024 * 1024)
      throw Error("Refusing non-regular or oversized target");
    return { bytes: await fs.readFile(filename), mode: stat.mode & 0o777 };
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function atomicWrite(filename, bytes, mode) {
  const temporary = filename + ".nexa-" + randomUUID();
  await fs.writeFile(temporary, bytes, { flag: "wx", mode });
  await fs.rename(temporary, filename);
}

async function workMounted(volume) {
  const [stat, parent] = await Promise.all([fs.stat(volume), fs.stat(path.dirname(volume))]);
  return stat.isDirectory() && stat.dev !== parent.dev;
}

export async function installVSCode({
  home = os.homedir(),
  node = process.execPath,
  apply = false,
  backupDirectory,
  workVolume = "/Volumes/NexaWork",
  isWorkMounted = workMounted,
} = {}) {
  const target = path.join(home, ".local/share/nexalance/omniroute-terminal");
  if (!(await fs.lstat(target)).isDirectory() || (await fs.lstat(target)).isSymbolicLink())
    throw Error("The installed Terminal routing directory is required");
  const terminalFile = await regular(path.join(target, "installation.json"));
  if (!terminalFile) throw Error("The installed Terminal routing receipt is required");
  const terminal = JSON.parse(terminalFile.bytes);
  const required = ["claude-terminal-launcher.mjs", "claude-terminal-tunnel.mjs",
    "claudeTerminalProfile.cjs", "claudeModels.cjs", "claudeModels.json"];
  for (const name of required) {
    const existing = await regular(path.join(target, name));
    if (!existing || sha(existing.bytes) !== terminal.files?.[name])
      throw Error("Installed Terminal routing helper changed: " + name);
  }
  const settingsPath = path.join(home, "Library/Application Support/Code/User/settings.json");
  const before = await regular(settingsPath);
  const original = before?.bytes.toString("utf8") || "{}\n";
  const wrapper = path.join(target, "claude-vscode-wrapper");
  const updated = updateVSCodeSettings(original, wrapper);
  const payloads = new Map([
    ["claude-vscode-launcher.mjs", await fs.readFile(path.join(directory, "claude-vscode-launcher.mjs"))],
    ["claude-vscode-wrapper", Buffer.from(wrapperScript(node, path.join(target, "claude-vscode-launcher.mjs")))],
  ]);
  const metadataPath = path.join(target, "vscode-installation.json");
  const metadataBefore = await regular(metadataPath);
  const prior = metadataBefore ? JSON.parse(metadataBefore.bytes) : null;
  const previousFiles = new Map();
  for (const [name] of payloads) {
    const existing = await regular(path.join(target, name));
    if (existing && sha(existing.bytes) !== prior?.files?.[name])
      throw Error("Installed VS Code routing helper changed: " + name);
    previousFiles.set(name, existing);
  }
  const receipt = {
    status: "prepared", settingsPath, wrapper,
    files: Object.fromEntries([...payloads].map(([name, bytes]) => [name, sha(bytes)])),
    settingsBeforeSha256: sha(original), settingsAfterSha256: sha(updated),
    terminalInstallationSha256: sha(terminalFile.bytes),
    sharedClaudeSettingsChanged: false, routingFlagChanged: false,
    officialBinariesChanged: false, nativeAppBridgeChanged: false,
    appliesToNewProcesses: true,
  };
  if (!apply) return receipt;
  if (!(await isWorkMounted(workVolume))) throw Error("The work volume is not mounted");
  if (!backupDirectory || !path.isAbsolute(backupDirectory)) throw Error("Backup directory required");
  const relative = path.relative(await fs.realpath(workVolume),
    path.join(await fs.realpath(path.dirname(backupDirectory)), path.basename(backupDirectory)));
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative))
    throw Error("Backups must remain on the mounted work volume");
  await fs.mkdir(backupDirectory, { mode: 0o700 });
  for (const [name, file] of [["vscode-settings.before.jsonc", before],
    ["vscode-installation.before.json", metadataBefore], ...[...previousFiles].map(([n, f]) => [n + ".before", f])]) {
    if (file) await fs.writeFile(path.join(backupDirectory, name), file.bytes, { flag: "wx", mode: 0o600 });
  }
  const current = await regular(settingsPath);
  if (sha(current?.bytes.toString("utf8") || "{}\n") !== receipt.settingsBeforeSha256)
    throw Error("VS Code settings changed during installation");
  const currentTerminal = await regular(path.join(target, "installation.json"));
  if (sha(currentTerminal.bytes) !== receipt.terminalInstallationSha256)
    throw Error("Terminal installation changed during installation");
  for (const [name, bytes] of payloads)
    await atomicWrite(path.join(target, name), bytes, name.endsWith("-wrapper") ? 0o700 : 0o600);
  await atomicWrite(metadataPath, JSON.stringify(receipt, null, 2) + "\n", 0o600);
  await fs.mkdir(path.dirname(settingsPath), { recursive: true });
  await atomicWrite(settingsPath, updated, before?.mode || 0o600);
  receipt.status = "installed";
  await fs.writeFile(path.join(backupDirectory, "receipt.json"), JSON.stringify(receipt, null, 2) + "\n",
    { flag: "wx", mode: 0o600 });
  return receipt;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const i = process.argv.indexOf("--backup-directory");
    console.log(JSON.stringify(await installVSCode({ apply: process.argv.includes("--apply"),
      backupDirectory: i < 0 ? undefined : process.argv[i + 1] }), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
