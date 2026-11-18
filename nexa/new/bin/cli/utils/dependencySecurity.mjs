import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const fixes = JSON.parse(fs.readFileSync(new URL("./dependencyFixes.json", import.meta.url)));
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const advisory = "https://github.com/advisories/GHSA-fc5q-39xc-vjpf";

function packageRoot(directory) {
  const root = fs.realpathSync(directory);
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  assert.equal(pkg.name, "omniroute", "Dependency remediation requires an OmniRoute package root");
  assert.equal(pkg.version, "3.8.54", "Review dependency remediations for the new release");
  return root;
}

function copiesWithin(root) {
  const copies = new Set();
  const visited = new Set();
  let packages = 0;
  function packageDirectory(directory, depth) {
    if (++packages > 20000 || depth > 20) throw Error("Dependency traversal exceeded its bound");
    const stat = fs.lstatSync(directory);
    if (!stat.isDirectory() || stat.isSymbolicLink()) return;
    if (path.basename(directory) === "picomatch") copies.add(directory);
    visit(path.join(directory, "node_modules"), depth + 1);
  }
  function visit(directory, depth = 0) {
    if (!fs.existsSync(directory)) return;
    const real = fs.realpathSync(directory);
    assert.ok(real.startsWith(root + path.sep), "Dependency path escaped the package root");
    if (visited.has(real)) return;
    visited.add(real);
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.isSymbolicLink() || entry.name.startsWith(".")) continue;
      const target = path.join(directory, entry.name);
      if (entry.name.startsWith("@")) {
        for (const scoped of fs.readdirSync(target, { withFileTypes: true })) {
          if (scoped.isDirectory() && !scoped.isSymbolicLink())
            packageDirectory(path.join(target, scoped.name), depth + 1);
        }
      } else packageDirectory(target, depth + 1);
    }
  }
  for (const relative of [
    "node_modules",
    "dist/node_modules",
    "open-sse/node_modules",
    ".build/next/standalone/node_modules",
    "dist/.build/next/standalone/node_modules",
  ])
    visit(path.join(root, relative));
  assert.ok(copies.size > 0, "No installed picomatch copies found for mandatory verification");
  return [...copies].sort();
}

function moduleState(root, directory) {
  const pkg = JSON.parse(fs.readFileSync(path.join(directory, "package.json"), "utf8"));
  assert.equal(pkg.name, "picomatch");
  const fix = fixes.versions[pkg.version];
  assert.ok(fix, "Review this picomatch version before accepting the dependency graph");
  const file = path.join(directory, "lib/parse.js");
  assert.ok(!fs.lstatSync(file).isSymbolicLink(), "A parser symlink cannot be remediated");
  assert.ok(fs.realpathSync(file).startsWith(root + path.sep));
  const bytes = fs.readFileSync(file);
  const sha256 = digest(bytes);
  assert.ok(
    sha256 === fix.originalSHA256 || sha256 === fix.patchedSHA256,
    "Unexpected parser bytes; dependency remediation refused"
  );
  return { directory, file, version: pkg.version, bytes, sha256, fix };
}

function verifyBehavior(directory) {
  const require = createRequire(path.join(directory, "package.json"));
  const matcher = require(path.join(directory, "index.js"));
  for (const pattern of ["+(*)b", "+(*a)b", "*(*a)b", "+(@(a|aa))b"]) {
    for (const options of [{}, { capture: true }, { maxExtglobRecursion: false }]) {
      assert.throws(
        () => matcher.makeRe(pattern, options),
        /Unsafe single-branch repeated extglob/,
        "Unsafe repetition was not rejected before regular-expression execution"
      );
    }
  }
  assert.equal(matcher("**/*.ts")("src/index.ts"), true);
  assert.equal(matcher("**/*.ts")("src/index.js"), false);
  assert.equal(matcher("+(abc)")("abcabc"), true);
  assert.equal(matcher("+([ab])")("abba"), true);
}

export function applyDependencySecurityFixes(directory) {
  const root = packageRoot(directory);
  const changed = [];
  for (const copy of copiesWithin(root)) {
    const state = moduleState(root, copy);
    if (state.sha256 === state.fix.patchedSHA256) continue;
    const text = state.bytes.toString();
    assert.equal(text.split(fixes.anchor).length, 2, "Parser patch anchor must be unique");
    const patched = Buffer.from(text.replace(fixes.anchor, fixes.anchor + fixes.guard));
    assert.equal(digest(patched), state.fix.patchedSHA256);
    // Atomic replacement breaks any cache hard link; the original cache inode stays unchanged.
    const temporary = state.file + ".nexa-" + randomBytes(8).toString("hex");
    fs.writeFileSync(temporary, patched, {
      flag: "wx",
      mode: fs.statSync(state.file).mode & 0o777,
    });
    fs.chmodSync(temporary, fs.statSync(state.file).mode & 0o777);
    assert.equal(digest(fs.readFileSync(state.file)), state.fix.originalSHA256);
    fs.renameSync(temporary, state.file);
    changed.push(path.relative(root, state.file));
  }
  return { ...verifyDependencySecurityFixes(root), changed };
}

export function verifyDependencySecurityFixes(directory) {
  const root = packageRoot(directory);
  const copies = copiesWithin(root).map((copy) => {
    const state = moduleState(root, copy);
    assert.equal(
      state.sha256,
      state.fix.patchedSHA256,
      "Required dependency remediation is absent"
    );
    verifyBehavior(copy);
    return { path: path.relative(root, copy), version: state.version, parserSHA256: state.sha256 };
  });
  return { status: "LOCAL_REMEDIATION_VERIFIED", advisory, copies, registryVersionChanged: false };
}

export function verifyAuditWithDependencyFixes(directory, audit) {
  const report = verifyDependencySecurityFixes(directory);
  assert.ok(
    audit && !audit.error && audit.metadata?.vulnerabilities,
    "An unavailable or malformed audit is not a security pass"
  );
  const root = packageRoot(directory);
  const rows = new Map(Object.entries(audit.vulnerabilities || {}));
  const verifiedCopies = new Set(
    report.copies.map((copy) => fs.realpathSync(path.join(root, copy.path)))
  );
  function covered(name, visiting = new Set()) {
    if (visiting.has(name)) return false;
    const row = rows.get(name);
    if (!row || !Array.isArray(row.via) || row.via.length === 0) return false;
    const next = new Set([...visiting, name]);
    return row.via.every((via) => {
      if (typeof via === "string") return covered(via, next);
      if (name !== "picomatch" || via?.url !== advisory || via?.dependency !== "picomatch")
        return false;
      return (
        Array.isArray(row.nodes) &&
        row.nodes.length > 0 &&
        row.nodes.every((node) => {
          const target = path.resolve(root, node);
          return (
            target.startsWith(root + path.sep) &&
            fs.existsSync(target) &&
            verifiedCopies.has(fs.realpathSync(target))
          );
        })
      );
    });
  }
  const unmitigated = [...rows.keys()].filter((name) => !covered(name));
  const raw = audit.metadata.vulnerabilities;
  const rawTotal =
    raw.total ??
    Object.entries(raw)
      .filter(([key]) => key !== "total")
      .reduce((sum, [, count]) => sum + Number(count), 0);
  assert.ok(Number.isSafeInteger(rawTotal) && rawTotal >= 0);
  assert.equal(rawTotal, rows.size, "Audit findings must agree with their reported package count");
  assert.equal(unmitigated.length, 0, "Unmitigated or unreviewed security findings block release");
  return {
    ...report,
    rawRegistryFindings: raw,
    locallyMitigatedPackages: [...rows.keys()],
    unmitigatedFindings: unmitigated,
    auditReportedZero: rawTotal === 0,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
  const args = process.argv.slice(2);
  const auditIndex = args.indexOf("--audit");
  const report = args.includes("--apply")
    ? applyDependencySecurityFixes(root)
    : auditIndex >= 0
      ? verifyAuditWithDependencyFixes(
          root,
          JSON.parse(fs.readFileSync(args[auditIndex + 1], "utf8"))
        )
      : verifyDependencySecurityFixes(root);
  console.log(JSON.stringify(report));
}
