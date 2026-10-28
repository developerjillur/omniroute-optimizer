import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const directory = process.env.RUNNER_TEMP;
assert.ok(directory && process.env.GITHUB_ACTIONS === "true");
const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
const sourceCommit = event.pull_request?.head?.sha || process.env.GITHUB_SHA;
const primaryRuntime = fs.readFileSync(path.join(directory, "primary-node-version.txt"), "utf8").trim();
assert.equal(primaryRuntime, "v26.7.0");
assert.equal(process.version, "v24.15.0");
assert.match(sourceCommit, /^[a-f0-9]{40}$/);
const hash = (data) => createHash("sha256").update(data).digest("hex");

function tap(name, expectedFailure = false) {
  const data = fs.readFileSync(path.join(directory, name));
  const text = data.toString();
  const count = (field) => {
    const match = [...text.matchAll(new RegExp(`^# ${field} (\\d+)$`, "gm"))].at(-1);
    assert.ok(match, `${name}: missing ${field} count`);
    return Number(match[1]);
  };
  const counts = Object.fromEntries(
    ["tests", "pass", "fail", "skipped", "cancelled"].map((field) => [field, count(field)])
  );
  assert.ok(counts.tests > 0);
  assert.equal(counts.skipped, 0);
  assert.equal(counts.cancelled, 0);
  if (expectedFailure) {
    assert.ok(counts.fail > 0);
    assert.match(text, /ERR_ASSERTION/);
  } else {
    assert.equal(counts.fail, 0);
    assert.equal(counts.pass, counts.tests);
  }
  return { file: name, sha256: hash(data), counts };
}

const compilerData = fs.readFileSync(path.join(directory, "tsc-diagnostics.log"), "utf8");
const compiler = JSON.parse(compilerData.split("\n")[0]);
const diagnostics = (compilerData.match(/error TS\d+:/g) || []).length;
const baseline = JSON.parse(
  fs.readFileSync(path.join(directory, "omniroute-fixture/config/quality/tsc-error-baseline.json"))
).value;
assert.equal(compiler.signal, null);
assert.ok(compiler.status === 0 || (compiler.status === 2 && diagnostics > 0));
assert.ok(diagnostics <= baseline);
const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();
const manifest = JSON.parse(fs.readFileSync("nexa/manifest.json", "utf8"));
const receipt = {
  atUtc: new Date().toISOString(),
  repository: process.env.GITHUB_REPOSITORY,
  sourceCommit,
  checkoutCommit: git("rev-parse", "HEAD"),
  overlayTree: git("rev-parse", "HEAD:nexa"),
  runUrl: `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`,
  upstreamBase: manifest.upstreamBase,
  inventorySha256: hash(fs.readFileSync("overlay-inventory.json")),
  primaryRuntime,
  productionRuntime: process.version,
  baseline: tap("native-red.tap", true),
  node26: {
    tooling: tap("tooling-node26.tap"),
    native: tap("native-green.tap"),
    nativeExtended: tap("native-extended.tap"),
    stream: tap("stream-green.tap"),
  },
  node24: {
    tooling: tap("tooling-node24.tap"),
    native: tap("native-production.tap"),
    productionDnsShimLoaded: true,
  },
  fullTypecheck: { completed: true, diagnostics, baseline },
  gates: {
    pristineBase: true,
    patchesApplicable: manifest.counts.patches,
    manifestReproduced: true,
    inventoryVerified: true,
    coreTypecheck: true,
    fullLint: true,
    docsAll: true,
    committedFormatting: true,
  },
  fullBuild: false,
  deployment: false,
  liveModelProbes: 0,
  privateRuntimeDataUsed: false,
};
fs.writeFileSync(path.join(directory, "native-validation.json"), JSON.stringify(receipt, null, 2) + "\n", {
  flag: "wx",
});
console.log(JSON.stringify({ sourceCommit, fullTypecheck: receipt.fullTypecheck, receipt: "native-validation.json" }));
