import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

assert.equal(process.env.GITHUB_ACTIONS, "true");
const directory = process.env.RUNNER_TEMP;
assert.ok(directory);
const outcomes = JSON.parse(process.env.UPGRADE_GATE_OUTCOMES);
const required = [
  "claude_model_ids",
  "dependency_security",
  "native_attribution",
  "quality_usage",
  "native_incidents",
  "resilience_budget",
  "effort_tests",
  "production_efforts",
  "cache_cost_baseline",
  "production_migrations",
  "deployment_helpers",
  "migrations",
  "fable52",
  "native_tests",
  "extended_tests",
  "stream_tests",
  "compatibility",
  "interface_tests",
  "core_types",
  "docs_types",
  "full_types",
  "compare_types",
  "lint",
  "docs",
  "production_tooling",
  "production",
  "formatting",
];
for (const name of required) assert.equal(outcomes[name]?.outcome, "success", name);
const hash = (data) => createHash("sha256").update(data).digest("hex");
function tap(name, expectedFailure = false, allowedSkips = []) {
  const bytes = fs.readFileSync(path.join(directory, name));
  const output = bytes.toString();
  const counts = Object.fromEntries(
    ["tests", "pass", "fail", "skipped", "cancelled"].map((field) => {
      const match = [...output.matchAll(new RegExp(`^# ${field} (\\d+)$`, "gm"))].at(-1);
      assert.ok(match, `${name}: missing ${field}`);
      return [field, Number(match[1])];
    })
  );
  assert.ok(counts.tests > 0);
  assert.equal(counts.cancelled, 0);
  const skipped = [...output.matchAll(/^ok \d+ - (.+?) # SKIP.*$/gm)]
    .map((match) => match[1])
    .sort();
  assert.deepEqual(
    skipped,
    [...allowedSkips].sort(),
    `${name}: only explicit platform limitations may be skipped`
  );
  assert.equal(counts.skipped, allowedSkips.length);
  if (expectedFailure) {
    assert.ok(counts.fail > 0);
    assert.match(output, /ERR_ASSERTION/);
  } else {
    assert.equal(counts.fail, 0);
    assert.equal(counts.pass + counts.skipped, counts.tests);
  }
  return {
    file: name,
    sha256: hash(bytes),
    counts,
    ...(allowedSkips.length ? { notValidated: allowedSkips } : {}),
  };
}
const primaryRuntime = fs
  .readFileSync(path.join(directory, "primary-node-version.txt"), "utf8")
  .trim();
assert.equal(primaryRuntime, "v26.7.0");
assert.equal(process.version, "v24.15.0");
const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
const sourceCommit = event.pull_request?.head?.sha || process.env.GITHUB_SHA;
assert.match(sourceCommit, /^[a-f0-9]{40}$/);
const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();
assert.equal(git("rev-parse", "HEAD"), sourceCommit);
const manifest = JSON.parse(fs.readFileSync("nexa/manifest.json", "utf8"));
assert.deepEqual(manifest.upstreamBase, {
  sha: "191dce8d534ceb56c28a08e71381284a9a87838f",
  version: "3.8.53",
});
const compilerOutput = fs.readFileSync(path.join(directory, "tsc-diagnostics.log"), "utf8");
const compiler = JSON.parse(compilerOutput.split("\n")[0]);
const diagnostics = (compilerOutput.match(/error TS\d+:/g) || []).length;
assert.equal(compiler.signal, null);
assert.ok(!compiler.error && (compiler.status === 0 || (compiler.status === 2 && diagnostics > 0)));
const ceiling = JSON.parse(
  fs.readFileSync(path.join(directory, "omniroute-fixture/config/quality/tsc-error-baseline.json"))
).value;
assert.ok(diagnostics <= ceiling, "the previous numerical ceiling is not raised for this upgrade");
const comparison = JSON.parse(fs.readFileSync(path.join(directory, "upgrade-types.json"), "utf8"));
assert.equal(comparison.added.length, 0);
const receipt = {
  status: "SOURCE_VALIDATED_BUILD_HELD",
  atUtc: new Date().toISOString(),
  repository: process.env.GITHUB_REPOSITORY,
  sourceCommit,
  overlayTree: git("rev-parse", "HEAD:nexa"),
  runUrl: `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`,
  upstreamBase: manifest.upstreamBase,
  inventorySha256: hash(fs.readFileSync("overlay-inventory.json")),
  historicalCorrectionProof: {
    release: "3.8.52",
    sourceCommit: "b12e37412751574db4dfb0da0447a9287ace73c9",
    run: "https://github.com/developerjillur/omniroute-optimizer/actions/runs/42403189143",
    replayedAgainstNewRelease: false,
    functionalAssertionsRetained: true,
  },
  fable52: {
    baseline: tap("fable52-red.tap", true),
    green: tap("fable52-green.tap"),
    providerEntitlementTested: false,
  },
  preservedCorrections: Object.fromEntries(
    [
      "claude-model-ids-green.tap",
      "quality-usage-green.tap",
      "native-attribution-green.tap",
      "resilience-budget-green.tap",
      "cache-cost-green.tap",
      "native-incidents-green.tap",
    ].map((name) => [name, tap(name)])
  ),
  dependencySecurity: JSON.parse(
    fs.readFileSync(path.join(directory, "dependency-installed-security.json"), "utf8")
  ),
  primaryRuntime,
  productionRuntime: process.version,
  node26: Object.fromEntries(
    [
      "tooling-node26.tap",
      "native-green.tap",
      "native-extended.tap",
      "stream-green.tap",
      "effort-primary.tap",
      "upgrade-migrations.tap",
      "upgrade-compatibility.tap",
    ].map((name) => [name, tap(name)])
  ),
  node24: Object.fromEntries(
    [
      "tooling-node24.tap",
      "native-production.tap",
      "effort-production.tap",
      "production-migrations.tap",
    ].map((name) => [name, tap(name)])
  ),
  deploymentHelpers: tap("deployment-helpers.tap", false, [
    "macOS wildcard Local listener coexists and receives other loopback HTTPS names",
  ]),
  fullTypecheck: { completed: true, diagnostics, ceiling, zeroErrorClaim: false },
  upgradeTypeComparison: comparison,
  requiredGateOutcomes: Object.fromEntries(required.map((name) => [name, outcomes[name].outcome])),
  patchesApplicable: manifest.counts.patches,
  manifestReproduced: true,
  fullBuild: false,
  packageAcceptance: false,
  deployment: false,
  liveModelProbes: 0,
  privateRuntimeDataUsed: false,
};
fs.writeFileSync(
  path.join(directory, "release-validation.json"),
  JSON.stringify(receipt, null, 2) + "\n",
  { flag: "wx" }
);
console.log(
  JSON.stringify({ sourceCommit, status: receipt.status, fullTypecheck: receipt.fullTypecheck })
);
