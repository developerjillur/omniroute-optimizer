import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

const directory = path.dirname(fileURLToPath(import.meta.url));
const start = "# >>> NexaLance Claude Terminal routing >>>";
const end = "# <<< NexaLance Claude Terminal routing <<<";
const sha = bytes => createHash("sha256").update(bytes).digest("hex");

export function shellBlock(node, launcher) {
  const quote = value => "'" + value.replaceAll("'", "'\\''") + "'";
  return `${start}\nclaude() { command ${quote(node)} ${quote(launcher)} "$@"; }\n${end}\n`;
}

export function updateShell(original, block) {
  const first = original.indexOf(start), last = original.indexOf(end);
  if (first < 0 && last < 0) return original + (original.endsWith("\n") || !original ? "" : "\n") + block;
  if (first < 0 || last < first || original.indexOf(start, first + start.length) >= 0 ||
      original.indexOf(end, last + end.length) >= 0) throw Error("Ambiguous managed shell block");
  return original.slice(0, first) + block.trimEnd() + original.slice(last + end.length);
}

async function regularOrAbsent(filename) {
  try {
    const stat = await fs.lstat(filename);
    if (!stat.isFile() || stat.isSymbolicLink()) throw Error("Refusing non-regular target: " + filename);
    return { bytes: await fs.readFile(filename), mode: stat.mode & 0o777 };
  } catch (error) { if (error.code === "ENOENT") return null; throw error; }
}

export async function install({ home = os.homedir(), node = process.execPath,
  binary = path.join(home, ".local/bin/claude"), database = path.join(home, ".omniroute-local/storage.sqlite"),
  backupDirectory, apply = false } = {}) {
  const target = path.join(home, ".local/share/nexalance/omniroute-terminal");
  const shell = path.join(home, ".zshrc");
  const sources = [
    ["claude-terminal-launcher.mjs", path.join(directory, "claude-terminal-launcher.mjs")],
    ["claude-terminal-tunnel.mjs", path.join(directory, "claude-terminal-tunnel.mjs")],
    ["claudeTerminalProfile.cjs", path.join(directory, "../new/src/mitm/_internal/claudeTerminalProfile.cjs")],
    ["claudeModels.cjs", path.join(directory, "../new/src/mitm/_internal/claudeModels.cjs")],
    ["claudeModels.json", path.join(directory, "../new/src/mitm/_internal/claudeModels.json")],
  ];
  const payloads = new Map(await Promise.all(sources.map(async ([name, filename]) => [name, await fs.readFile(filename)])));
  const previous = await regularOrAbsent(path.join(target, "installation.json"));
  const prior = previous ? JSON.parse(previous.bytes) : null;
  const shellBefore = await regularOrAbsent(shell);
  const original = shellBefore?.bytes.toString("utf8") || "";
  // Do not silently replace a user's pre-existing alias/function.
  if (!original.includes(start) && /(?:^|\n)\s*(?:alias\s+claude\s*=|(?:function\s+)?claude\s*\(\s*\))/.test(original))
    throw Error("A Claude shell alias/function already exists; review it before installation");
  const updated = updateShell(original, shellBlock(node, path.join(target, "claude-terminal-launcher.mjs")));
  for (const [name] of payloads) {
    const existing = await regularOrAbsent(path.join(target, name));
    if (existing && (!prior?.files?.[name] || sha(existing.bytes) !== prior.files[name]))
      throw Error("Installed Terminal helper changed: " + name);
  }
  const receipt = { status: "prepared", target, shell, binary, database,
    files: Object.fromEntries([...payloads].map(([name, bytes]) => [name, sha(bytes)])),
    shellBefore: sha(shellBefore?.bytes || ""), shellAfter: sha(updated),
    sharedClaudeSettingsChanged: false, officialBinaryChanged: false, nativeBridgeChanged: false };
  if (!apply) return receipt;
  if (!backupDirectory || !path.isAbsolute(backupDirectory)) throw Error("An explicit absolute backup directory is required");
  // Backups belong on the operator's mounted work volume, never on the boot disk.
  await fs.mkdir(backupDirectory, { recursive: false, mode: 0o700 });
  if (shellBefore) await fs.writeFile(path.join(backupDirectory, "zshrc.before"), shellBefore.bytes, { mode: 0o600, flag: "wx" });
  if (previous) await fs.writeFile(path.join(backupDirectory, "installation.before.json"), previous.bytes, { mode: 0o600, flag: "wx" });
  for (const [name] of payloads) {
    const existing = await regularOrAbsent(path.join(target, name));
    if (existing) await fs.writeFile(path.join(backupDirectory, name), existing.bytes, { mode: 0o600, flag: "wx" });
  }
  await fs.mkdir(target, { recursive: true, mode: 0o700 });
  if ((await fs.lstat(target)).isSymbolicLink()) throw Error("Refusing a symlink installation directory");
  for (const [name, bytes] of payloads) {
    await fs.writeFile(path.join(target, name), bytes, { mode: 0o600 });
    await fs.chmod(path.join(target, name), 0o600);
  }
  await fs.writeFile(path.join(target, "installation.json"), JSON.stringify(receipt, null, 2), { mode: 0o600 });
  // Recheck the shell before this last, small mutation.
  const currentShell = await regularOrAbsent(shell);
  if (sha(currentShell?.bytes || "") !== receipt.shellBefore) throw Error("Shell changed during installation");
  await fs.writeFile(shell, updated, { mode: shellBefore?.mode || 0o600 });
  receipt.status = "installed";
  await fs.writeFile(path.join(backupDirectory, "receipt.json"), JSON.stringify(receipt, null, 2), { mode: 0o600, flag: "wx" });
  return receipt;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const backupIndex = process.argv.indexOf("--backup-directory");
  try {
    console.log(JSON.stringify(await install({ apply: process.argv.includes("--apply"),
      backupDirectory: backupIndex < 0 ? undefined : process.argv[backupIndex + 1] }), null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
