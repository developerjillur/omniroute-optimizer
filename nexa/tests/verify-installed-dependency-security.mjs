import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

assert.equal(process.env.GITHUB_ACTIONS, "true");
assert.ok(process.env.RUNNER_TEMP);
const root = process.cwd();
const config = JSON.parse(
  fs.readFileSync("nexa/security/dependency-targets-2026-11-06.json", "utf8")
);
const declarations = JSON.parse(fs.readFileSync("package.json", "utf8"));
const lockBytes = fs.readFileSync("package-lock.json");
const lock = JSON.parse(lockBytes);
const verified = [];
function installed(location) {
  assert.ok(location.startsWith("node_modules/") && !location.split("/").includes(".."));
  return JSON.parse(fs.readFileSync(path.join(root, location, "package.json"), "utf8")).version;
}
for (const target of config.targets) {
  assert.equal(declarations[target.section][target.name], target.after);
  assert.equal(installed(`node_modules/${target.name}`), target.after);
}
for (const [name, allowed] of Object.entries(config.allowedGraphVersions)) {
  const entries = Object.entries(lock.packages).filter(
    ([location]) => location.split("node_modules/").at(-1) === name
  );
  assert.ok(entries.length > 0, name);
  for (const [location, record] of entries) {
    assert.ok(allowed.includes(record.version), `${location}: unexpected locked version`);
    assert.equal(installed(location), record.version, `${location}: installed/lock mismatch`);
    verified.push({ path: location, version: record.version });
  }
}
const audit = spawnSync(
  "npm",
  ["audit", "--package-lock-only", "--ignore-scripts", "--omit=dev", "--json"],
  {
    encoding: "utf8",
    timeout: 120_000,
    maxBuffer: 8 * 1024 * 1024,
  }
);
const auditPath = path.join(process.env.RUNNER_TEMP, "dependency-production-audit.json");
fs.writeFileSync(auditPath, audit.stdout || "", { flag: "wx" });
assert.ifError(audit.error);
assert.equal(audit.status, 0, "Production dependency audit must complete without a finding");
const report = JSON.parse(audit.stdout);
assert.ok(!report.error && report.auditReportVersion >= 2);
assert.equal(report.metadata?.vulnerabilities?.total, 0);
assert.deepEqual(report.vulnerabilities, {});
const receipt = {
  atUtc: new Date().toISOString(),
  runtime: process.version,
  lockSha256: createHash("sha256").update(lockBytes).digest("hex"),
  installedDependencies: verified,
  productionAudit: {
    vulnerabilities: report.metadata.vulnerabilities,
    file: path.basename(auditPath),
  },
  developmentAuditCleared: false,
  lifecycleScriptsExecutedByThisCheck: false,
  buildExecuted: false,
  deploymentExecuted: false,
  providerGenerationCalls: 0,
};
fs.writeFileSync(
  path.join(process.env.RUNNER_TEMP, "dependency-installed-security.json"),
  JSON.stringify(receipt, null, 2) + "\n",
  { flag: "wx" }
);
console.log(JSON.stringify(receipt));
