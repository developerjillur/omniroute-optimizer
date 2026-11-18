import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  applyDependencySecurityFixes,
  verifyDependencySecurityFixes,
  verifyAuditWithDependencyFixes,
} from "../../bin/cli/utils/dependencySecurity.mjs";

const source = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const metadata = JSON.parse(
  fs.readFileSync(path.join(source, "bin/cli/utils/dependencyFixes.json"))
);
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
function fixture() {
  const root = fs.mkdtempSync(
    path.join(process.env.TMPDIR || os.tmpdir(), "nexa-dependency-security-")
  );
  fs.writeFileSync(
    path.join(root, "package.json"),
    JSON.stringify({ name: "omniroute", version: "3.8.54" })
  );
  for (const relative of [
    "node_modules/picomatch",
    "node_modules/micromatch/node_modules/picomatch",
  ]) {
    const from = path.join(source, relative);
    const to = path.join(root, relative);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.cpSync(from, to, { recursive: true });
    const version = JSON.parse(fs.readFileSync(path.join(to, "package.json"))).version;
    const parser = path.join(to, "lib/parse.js");
    const bytes = fs.readFileSync(parser);
    if (hash(bytes) === metadata.versions[version].patchedSHA256) {
      const original = bytes.toString().replace(metadata.guard, "");
      assert.equal(hash(original), metadata.versions[version].originalSHA256);
      fs.writeFileSync(parser, original);
    }
  }
  return root;
}

test("dependency remediation rejects the unsafe pattern and preserves ordinary matching", () => {
  const root = fixture();
  assert.throws(() => verifyDependencySecurityFixes(root), /remediation is absent/);
  const report = applyDependencySecurityFixes(root);
  assert.equal(report.status, "LOCAL_REMEDIATION_VERIFIED");
  assert.equal(report.changed.length, 2);
  assert.equal(report.registryVersionChanged, false);
  for (const copy of report.copies) {
    const require = createRequire(path.join(root, copy.path, "package.json"));
    const matcher = require(path.join(root, copy.path, "index.js"));
    assert.throws(() => matcher.makeRe("+(*a)b"), /Unsafe single-branch repeated extglob/);
    assert.equal(matcher("**/*.ts")("src/main.ts"), true);
    assert.equal(matcher("**/*.ts")("src/main.js"), false);
    assert.equal(matcher("+(abc)")("abcabc"), true);
  }
  assert.deepEqual(applyDependencySecurityFixes(root).changed, []);
});

test("atomic remediation preserves the source cache hard link and file permissions", () => {
  const root = fixture();
  const parser = path.join(root, "node_modules/picomatch/lib/parse.js");
  const retained = path.join(root, "retained-original.js");
  const before = hash(fs.readFileSync(parser));
  const mode = fs.statSync(parser).mode & 0o777;
  fs.linkSync(parser, retained);
  applyDependencySecurityFixes(root);
  assert.equal(hash(fs.readFileSync(retained)), before);
  assert.notEqual(hash(fs.readFileSync(parser)), before);
  assert.equal(fs.statSync(parser).mode & 0o777, mode);
});

test("unknown parser bytes cannot receive an automatic security exception", () => {
  const root = fixture();
  const parser = path.join(root, "node_modules/picomatch/lib/parse.js");
  fs.appendFileSync(parser, "\n// unexpected local change\n");
  const changed = fs.readFileSync(parser);
  assert.throws(() => applyDependencySecurityFixes(root), /Unexpected parser bytes/);
  assert.deepEqual(fs.readFileSync(parser), changed);
});

test("audit keeps registry findings visible and accepts only verified local remediation", () => {
  const root = fixture();
  applyDependencySecurityFixes(root);
  const raw = {
    metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 3, critical: 0, total: 3 } },
    vulnerabilities: {
      "fumadocs-core": { name: "fumadocs-core", via: ["tinyglobby"] },
      tinyglobby: { name: "tinyglobby", via: ["picomatch"] },
      picomatch: {
        name: "picomatch",
        nodes: ["node_modules/picomatch", "node_modules/micromatch/node_modules/picomatch"],
        via: [
          { dependency: "picomatch", url: "https://github.com/advisories/GHSA-fc5q-39xc-vjpf" },
        ],
      },
    },
  };
  const report = verifyAuditWithDependencyFixes(root, raw);
  assert.equal(report.rawRegistryFindings.high, 3);
  assert.equal(report.auditReportedZero, false);
  assert.equal(report.locallyMitigatedPackages.length, 3);
  assert.deepEqual(report.unmitigatedFindings, []);
  const unreviewed = structuredClone(raw);
  unreviewed.vulnerabilities.picomatch.via.push({
    dependency: "picomatch",
    url: "https://github.com/advisories/GHSA-unreviewed",
  });
  assert.throws(
    () => verifyAuditWithDependencyFixes(root, unreviewed),
    /Unmitigated or unreviewed/
  );
});

test("missing or failed audit evidence cannot pass security acceptance", () => {
  const root = fixture();
  applyDependencySecurityFixes(root);
  assert.throws(
    () => verifyAuditWithDependencyFixes(root, { error: { code: "EAI_AGAIN" } }),
    /unavailable or malformed/
  );
});
