import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createPublicationLock } from "../deploy/publication-lock.mjs";
import { inspectInstalledPublication } from "../deploy/installed-publication.mjs";
import { installPublication } from "../deploy/install-publication.mjs";
import {
  packageInstallArgs,
  packageInstallEnvironment,
} from "../deploy/package-install.mjs";

const root = process.env.PUBLICATION_TEST_ROOT
  ? path.resolve(process.env.PUBLICATION_TEST_ROOT)
  : fs.mkdtempSync(path.join(os.tmpdir(), "publication-install-"));
if (process.env.PUBLICATION_TEST_ROOT) fs.mkdirSync(root, { mode: 0o700 });
const npmRoot = execFileSync("npm", ["root", "--global"], {
  encoding: "utf8",
}).trim();
const npmPackageJson = path.join(npmRoot, "npm/package.json");
const npmCli = path.join(npmRoot, "npm/bin/npm-cli.js");
const environment = packageInstallEnvironment({
  PATH: process.env.PATH,
  HOME: process.env.HOME,
  USER: process.env.USER,
  LANG: "C.UTF-8",
  CI: "true",
  NODE_OPTIONS: "--max-old-space-size=256",
  npm_config_cache: path.join(root, "npm-cache"),
  npm_config_userconfig: "/dev/null",
  npm_config_registry: "https://registry.npmjs.org/",
  npm_config_audit: "false",
  npm_config_fund: "false",
  npm_config_maxsockets: "2",
});
function runNpm(args, cwd, name) {
  const log = fs.openSync(path.join(root, name + ".log"), "wx", 0o600);
  try {
    execFileSync(process.execPath, [npmCli, ...args], {
      cwd,
      env: environment,
      stdio: ["ignore", log, log],
      timeout: 120000,
    });
  } finally {
    fs.closeSync(log);
  }
}
const source = path.join(root, "source");
fs.mkdirSync(source);
const metadata = {
  name: "publication-regression-fixture",
  version: "1.0.0",
  main: "index.cjs",
  files: ["index.cjs", "cli.cjs", "packages/local-workspace/package.json"],
  bin: { "publication-fixture": "cli.cjs" },
  scripts: {
    postinstall:
      "node -e \"require('fs').writeFileSync('lifecycle-ran.txt','ran')\"",
  },
  dependencies: { "is-odd": "3.0.1", "is-number": "7.0.0" },
  devDependencies: { "is-plain-object": "5.0.0" },
  workspaces: ["packages/local-workspace"],
  overrides: { "is-odd": { "is-number": "7.0.0" } },
};
fs.writeFileSync(
  path.join(source, "package.json"),
  JSON.stringify(metadata, null, 2) + "\n",
);
fs.writeFileSync(
  path.join(source, "index.cjs"),
  'module.exports = require("is-odd");\n',
);
fs.writeFileSync(
  path.join(source, "cli.cjs"),
  '#!/usr/bin/env node\nprocess.stdout.write("fixture ready\\n");\n',
);
fs.mkdirSync(path.join(source, "packages/local-workspace"), {
  recursive: true,
});
fs.writeFileSync(
  path.join(source, "packages/local-workspace/package.json"),
  JSON.stringify({ name: "publication-fixture-workspace", version: "1.0.0" }),
);
runNpm(
  [
    "install",
    "--package-lock-only",
    "--ignore-scripts",
    "--legacy-peer-deps",
    "--no-audit",
    "--no-fund",
  ],
  source,
  "source-lock",
);
const unsealed = path.join(root, "unsealed");
fs.mkdirSync(unsealed);
runNpm(["pack", "--pack-destination", unsealed], source, "pack");
const filename = "publication-regression-fixture-1.0.0.tgz";
const original = path.join(unsealed, filename);
const baselinePrefix = path.join(root, "baseline-runtime");
runNpm(packageInstallArgs(baselinePrefix, original), root, "baseline-install");
function installedRoot(prefix) {
  return path.join(prefix, "lib/node_modules/publication-regression-fixture");
}
function nestedVersion(pkg) {
  const req = createRequire(path.join(pkg, "node_modules/is-odd/index.js"));
  return req("is-number/package.json").version;
}
const before = nestedVersion(installedRoot(baselinePrefix));
assert.match(
  before,
  /^6\./,
  "The baseline must reproduce ignored dependency-root overrides",
);
const publication = path.join(root, "publication-lock");
const compiled = await createPublicationLock(
  source,
  npmPackageJson,
  publication,
);
assert.equal(compiled.changedEdges, 1);
const sealed = path.join(root, "sealed");
fs.mkdirSync(sealed);
const archive = path.join(sealed, filename);
execFileSync(
  "python3",
  [
    fileURLToPath(new URL("../deploy/seal-package.py", import.meta.url)),
    original,
    path.join(source, "package-lock.json"),
    path.join(publication, "npm-shrinkwrap.json"),
    archive,
    "--effective-edges",
    path.join(publication, "effective-edges.json"),
  ],
  { env: environment, stdio: "inherit", timeout: 30000 },
);
const candidatePrefix = path.join(root, "candidate-runtime");
const installLog = fs.openSync(
  path.join(root, "candidate-install.log"),
  "wx",
  0o600,
);
let installed;
try {
  installed = await installPublication(candidatePrefix, archive, {
    npmPackageJson,
    env: {
      ...environment,
      npm_config_ignore_scripts: "true",
      npm_config_include: "dev",
      npm_config_global: "true",
    },
    log: ["ignore", installLog, installLog],
    timeout: 120000,
  });
} finally {
  fs.closeSync(installLog);
}
const pkg = installed.packageRoot;
assert.equal(
  JSON.parse(fs.readFileSync(path.join(pkg, "package.json"))).workspaces,
  undefined,
);
assert.ok(
  fs.existsSync(path.join(pkg, "packages/local-workspace/package.json")),
);
assert.deepEqual(
  JSON.parse(fs.readFileSync(path.join(source, "package.json"))).workspaces,
  metadata.workspaces,
);
const after = nestedVersion(pkg);
assert.equal(after, "7.0.0");
const graph = await inspectInstalledPublication(pkg, npmPackageJson);
const req = createRequire(path.join(pkg, "index.cjs"));
const isOdd = req(path.join(pkg, "index.cjs"));
assert.equal(isOdd(3), true);
assert.equal(isOdd(4), false);
assert.equal(
  fs.readFileSync(path.join(pkg, "lifecycle-ran.txt"), "utf8"),
  "ran",
);
assert.equal(
  fs.existsSync(path.join(pkg, "node_modules/is-plain-object")),
  false,
);
assert.equal(
  fs.existsSync(path.join(pkg, "node_modules/publication-fixture-workspace")),
  false,
);
assert.equal(
  execFileSync(
    process.execPath,
    [path.join(candidatePrefix, "bin/publication-fixture")],
    {
      encoding: "utf8",
    },
  ).trim(),
  "fixture ready",
);
const result = {
  status: "PUBLICATION_INSTALL_REGRESSION_PASS",
  baselineNestedVersion: before,
  candidateNestedVersion: after,
  ...graph,
  functionalDependencyCallsPassed: true,
  requiredLifecycleScriptsEnabled: true,
  developmentDependenciesOmitted: true,
  sourceWorkspaceLinksDisabled: true,
  executableLayoutVerified: true,
  applicationArtifactAcceptance: false,
  providerGenerationCalls: 0,
  sourcePackage: "is-odd@3.0.1 with is-number@7.0.0 override",
  retainedRoot: root,
};
fs.writeFileSync(
  path.join(root, "verification.json"),
  JSON.stringify(result, null, 2) + "\n",
  {
    flag: "wx",
    mode: 0o600,
  },
);
console.log(JSON.stringify(result));
