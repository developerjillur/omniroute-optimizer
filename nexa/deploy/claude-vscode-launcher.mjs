import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { launch } from "./claude-terminal-launcher.mjs";

/** VS Code passes its bundled CLI as the first argument to its process wrapper. */
export async function vscodeInvocation(args, { home = os.homedir(), fallbackBinary } = {}) {
  const remaining = [...args];
  const candidate = remaining[0];
  if (!candidate || !path.isAbsolute(candidate)) {
    if (candidate && !candidate.startsWith("-") && /[/\\]/.test(candidate))
      throw Error("A bundled Claude executable must use an absolute path");
    if (!path.isAbsolute(fallbackBinary || "")) throw Error("Official Claude binary is required");
    return { binary: fallbackBinary, args: remaining };
  }

  // Accept the installed extension's CLI, never a project-supplied executable.
  const roots = [".vscode", ".vscode-insiders"].map((name) =>
    path.join(home, name, "extensions")
  );
  const root = roots.find((entry) => {
    const relative = path.relative(entry, candidate);
    return /^anthropic\.claude-code-[a-zA-Z0-9._+-]+[/\\]resources[/\\](?:native-binary|native-binaries[/\\]darwin-arm64)[/\\]claude$/.test(
      relative
    );
  });
  if (!root) throw Error("Unexpected VS Code Claude executable");
  const realRoot = await fs.realpath(root);
  const realBinary = await fs.realpath(candidate);
  const relativeReal = path.relative(realRoot, realBinary);
  if (relativeReal.startsWith("..") || path.isAbsolute(relativeReal))
    throw Error("Bundled executable leaves the extension directory");
  const extensionDirectory = path.join(root, path.relative(root, candidate).split(path.sep)[0]);
  const manifestPath = path.join(extensionDirectory, "package.json");
  if ((await fs.stat(manifestPath)).size > 256 * 1024) throw Error("Invalid extension manifest");
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  if (String(manifest.publisher).toLowerCase() !== "anthropic" || manifest.name !== "claude-code")
    throw Error("Unexpected extension publisher");
  if (!(await fs.stat(realBinary)).isFile()) throw Error("Missing bundled executable");
  remaining.shift();
  return { binary: candidate, args: remaining };
}

export async function launchVSCode({
  args = process.argv.slice(2),
  home = os.homedir(),
  env = process.env,
  configuration,
  runLaunch = launch,
} = {}) {
  const invocation = await vscodeInvocation(args, {
    home,
    fallbackBinary: configuration.binary,
  });
  return runLaunch({
    home,
    env,
    ...invocation,
    database: configuration.database,
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const directory = path.dirname(fileURLToPath(import.meta.url));
    const configuration = JSON.parse(
      await fs.readFile(path.join(directory, "installation.json"), "utf8")
    );
    process.exitCode = await launchVSCode({ configuration });
  } catch {
    console.error("Claude VS Code routing could not start; no alternate provider was selected.");
    process.exitCode = 1;
  }
}
