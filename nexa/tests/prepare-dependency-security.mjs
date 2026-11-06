import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    application: { type: "string" },
    baseline: { type: "string" },
    output: { type: "string" },
    targets: { type: "string" },
  },
});
for (const key of ["application", "baseline", "output", "targets"]) {
  assert.ok(values[key], `Missing --${key}`);
}
const application = fs.realpathSync(values.application);
const baseline = fs.realpathSync(values.baseline);
const output = path.resolve(values.output);
assert.notEqual(application, baseline);
assert.ok(!fs.existsSync(output), "Use a new output directory for every attempt");
fs.mkdirSync(output, { recursive: true });
const config = JSON.parse(fs.readFileSync(values.targets, "utf8"));
const hash = (data) => createHash("sha256").update(data).digest("hex");
const sourceHash = process.env.GITHUB_SHA || null;
const npmEnvironment = {
  ...process.env,
  npm_config_ignore_scripts: "true",
  npm_config_update_notifier: "false",
  npm_config_fund: "false",
};

function command(program, args, cwd) {
  const result = spawnSync(program, args, {
    cwd,
    env: npmEnvironment,
    encoding: "utf8",
    timeout: 240_000,
    maxBuffer: 16 * 1024 * 1024,
  });
  assert.ifError(result.error);
  assert.equal(result.signal, null, `${program} terminated by ${result.signal}`);
  return result;
}

function save(name, data) {
  fs.writeFileSync(path.join(output, name), data, { flag: "wx" });
}

function audit(cwd, name, productionOnly) {
  const args = ["audit", "--package-lock-only", "--ignore-scripts", "--json"];
  if (productionOnly) args.push("--omit=dev");
  const result = command("npm", args, cwd);
  save(`${name}.json`, result.stdout);
  save(`${name}.stderr.txt`, result.stderr);
  assert.ok([0, 1].includes(result.status), `${name}: npm audit exit ${result.status}`);
  const report = JSON.parse(result.stdout);
  assert.ok(!report.error, `${name}: npm audit returned an error`);
  assert.ok(report.auditReportVersion >= 2 && report.metadata?.vulnerabilities);
  assert.ok(report.vulnerabilities && typeof report.vulnerabilities === "object");
  return { exitCode: result.status, vulnerabilities: report.metadata.vulnerabilities };
}

const baselinePackage = fs.readFileSync(path.join(baseline, "package.json"));
const baselineLock = fs.readFileSync(path.join(baseline, "package-lock.json"));
const beforePackage = fs.readFileSync(path.join(application, "package.json"));
const beforeLock = fs.readFileSync(path.join(application, "package-lock.json"));
const baselineJson = JSON.parse(baselinePackage);
const candidate = JSON.parse(beforePackage);
assert.equal(candidate.version, config.applicationVersion);
assert.equal(baselineJson.version, config.applicationVersion);
const original = structuredClone(candidate);
for (const target of config.targets) {
  assert.equal(baselineJson[target.section]?.[target.name], target.before);
  assert.ok(
    [target.before, target.after].includes(candidate[target.section]?.[target.name]),
    `Unexpected installed source declaration for ${target.name}`
  );
  candidate[target.section][target.name] = target.after;
}
const candidateWithoutTargets = structuredClone(candidate);
for (const target of config.targets) {
  candidateWithoutTargets[target.section][target.name] = original[target.section][target.name];
}
assert.deepEqual(candidateWithoutTargets, original, "Unrelated package declarations changed");
save("baseline-package.json", baselinePackage);
save("baseline-package-lock.json", baselineLock);
save("applied-before-package.json", beforePackage);
save("applied-before-package-lock.json", beforeLock);
save("targets.json", JSON.stringify(config, null, 2) + "\n");
const baselineAudit = audit(baseline, "baseline-production-audit", true);
fs.writeFileSync(path.join(application, "package.json"), JSON.stringify(candidate, null, 2) + "\n");
const install = command(
  "npm",
  ["install", "--package-lock-only", "--ignore-scripts", "--no-audit", "--no-fund"],
  application
);
save("lock-preparation.stdout.txt", install.stdout);
save("lock-preparation.stderr.txt", install.stderr);
assert.equal(install.status, 0, "Lock preparation failed");
const finalPackage = fs.readFileSync(path.join(application, "package.json"));
const finalLock = fs.readFileSync(path.join(application, "package-lock.json"));
assert.deepEqual(JSON.parse(finalPackage), candidate);
const lock = JSON.parse(finalLock);
assert.equal(lock.lockfileVersion, 3);
for (const target of config.targets) {
  assert.equal(lock.packages[""][target.section]?.[target.name], target.after);
  assert.equal(lock.packages[`node_modules/${target.name}`]?.version, target.after);
}
save("candidate-package.json", finalPackage);
save("candidate-package-lock.json", finalLock);
const candidateAudit = audit(application, "candidate-production-audit", true);
const developmentAudit = audit(application, "candidate-all-audit", false);
const receipt = {
  atUtc: new Date().toISOString(),
  status: "LOCK_PREPARED_REQUIRES_REVIEW_AND_SOURCE_VALIDATION",
  sourceCommit: sourceHash,
  upstreamBase: config.upstreamBase,
  runtime: process.version,
  targets: config.targets,
  hashes: {
    baselinePackage: hash(baselinePackage),
    baselineLock: hash(baselineLock),
    appliedBeforePackage: hash(beforePackage),
    appliedBeforeLock: hash(beforeLock),
    candidatePackage: hash(finalPackage),
    candidateLock: hash(finalLock),
  },
  baselineAudit,
  candidateAudit,
  developmentAudit,
  remainingAdvisoriesRequireReview: candidateAudit.vulnerabilities.total > 0,
  lifecycleScriptsExecuted: false,
  packageBuildExecuted: false,
  deploymentExecuted: false,
  providerGenerationCalls: 0,
  privateRuntimeDataUsed: false,
};
save("dependency-lock-receipt.json", JSON.stringify(receipt, null, 2) + "\n");
console.log(JSON.stringify(receipt));
