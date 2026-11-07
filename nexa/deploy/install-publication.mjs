import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { packageInstallEnvironment } from "./package-install.mjs";
import { inspectInstalledPublication } from "./installed-publication.mjs";

export function publicationInstallArgs(packageRoot) {
  return [
    "ci",
    "--prefix",
    packageRoot,
    "--global=false",
    "--ignore-scripts=false",
    "--omit=dev",
    "--workspaces=false",
    "--legacy-peer-deps",
    "--no-fund",
    "--no-audit",
  ];
}

export async function installPublication(
  prefix,
  archive,
  {
    npmPackageJson = "/usr/local/lib/node_modules/npm/package.json",
    env = process.env,
    log = "inherit",
    timeout = 900000,
  } = {}
) {
  prefix = path.resolve(prefix);
  assert.ok(
    !fs.lstatSync(prefix, { throwIfNoEntry: false }),
    "Preserve earlier runtime prefixes; installation needs a new destination"
  );
  const pkg = path.join(prefix, "lib/node_modules");
  fs.mkdirSync(pkg, { recursive: true, mode: 0o700 });
  const packageRoot = path.join(pkg, "omniroute");
  execFileSync(
    "python3",
    [
      fileURLToPath(new URL("./extract-publication.py", import.meta.url)),
      path.resolve(archive),
      packageRoot,
    ],
    { env, stdio: log, timeout }
  );
  const metadata = JSON.parse(fs.readFileSync(path.join(packageRoot, "package.json")));
  const lockFile = path.join(packageRoot, "npm-shrinkwrap.json");
  const digest = (filename) => createHash("sha256").update(fs.readFileSync(filename)).digest("hex");
  const lockHash = digest(lockFile);
  const manifestHash = digest(path.join(packageRoot, "package.json"));
  const installEnv = packageInstallEnvironment(env);
  for (const key of Object.keys(installEnv)) {
    if (
      /^npm_config_(include|only|production|global|ignore_scripts|workspace|workspaces)$/i.test(key)
    ) {
      delete installEnv[key];
    }
  }
  // A fresh package root makes its own overrides and shrinkwrap authoritative.
  // Required lifecycle scripts run normally; only development dependencies and
  // source workspace linking are excluded from the installed runtime.
  execFileSync(
    process.execPath,
    [
      path.join(path.dirname(npmPackageJson), "bin/npm-cli.js"),
      ...publicationInstallArgs(packageRoot),
    ],
    { cwd: packageRoot, env: installEnv, stdio: log, timeout }
  );
  assert.equal(digest(lockFile), lockHash, "Installation changed the reviewed publication lock");
  assert.equal(
    digest(path.join(packageRoot, "package.json")),
    manifestHash,
    "Installation changed package metadata"
  );
  const graph = await inspectInstalledPublication(packageRoot, npmPackageJson);
  const bins =
    typeof metadata.bin === "string" ? { [metadata.name]: metadata.bin } : (metadata.bin ?? {});
  const binRoot = path.join(prefix, "bin");
  fs.mkdirSync(binRoot, { mode: 0o700 });
  for (const [name, target] of Object.entries(bins)) {
    assert.ok(
      name && path.basename(name) === name && ![".", ".."].includes(name),
      "Unsafe executable name"
    );
    const absolute = path.resolve(packageRoot, target);
    assert.ok(
      absolute.startsWith(packageRoot + path.sep) && fs.statSync(absolute).isFile(),
      "Unsafe executable target"
    );
    fs.chmodSync(absolute, fs.statSync(absolute).mode | 0o111);
    fs.symlinkSync(path.relative(binRoot, absolute), path.join(binRoot, name));
  }
  return {
    ...graph,
    prefix,
    packageRoot,
    packageName: metadata.name,
    version: metadata.version,
    requiredLifecycleScriptsEnabled: true,
    developmentDependenciesOmitted: true,
    workspaceLinksDisabled: true,
    existingPrefixOverwritten: false,
  };
}
