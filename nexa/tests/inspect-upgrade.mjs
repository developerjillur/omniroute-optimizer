import assert from "node:assert/strict";
import { spawnSync, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const digest = (data) => createHash("sha256").update(data).digest("hex");
const safe = (value) => {
  assert.ok(value && !path.isAbsolute(value) && !value.split("/").includes(".."));
  return value;
};

/** Inspect a release port in a separate index; never modify application source or retire a patch. */
export function inspectUpgrade({ root, overlay, from, to, output }) {
  for (const ref of [from, to]) assert.match(ref, /^[a-f0-9]{40}$/);
  root = fs.realpathSync(root);
  overlay = fs.realpathSync(overlay);
  output = path.resolve(output);
  assert.ok(!fs.existsSync(output), "Preserve earlier upgrade evidence; use a new output path");
  assert.ok(!output.startsWith(root + path.sep), "Evidence must be outside the application");
  const git = (args, options = {}) =>
    execFileSync("git", args, { cwd: root, maxBuffer: 24 * 1024 * 1024, ...options });
  assert.equal(git(["rev-parse", "--show-toplevel"]).toString().trim(), root);
  assert.equal(git(["status", "--porcelain=v1"]).toString(), "");
  const sourceIndex = git(["rev-parse", "--git-path", "index"]).toString().trim();
  const indexPath = path.resolve(root, sourceIndex);
  const originalIndex = fs.existsSync(indexPath) ? digest(fs.readFileSync(indexPath)) : null;
  fs.mkdirSync(output, { recursive: true });
  const env = { ...process.env, GIT_INDEX_FILE: path.join(output, "analysis.index") };
  const isolatedGit = (args, input) => git(args, { env, ...(input ? { input } : {}) });
  const blob = (ref, target) => {
    const result = spawnSync("git", ["show", `${ref}:${safe(target)}`], {
      cwd: root,
      maxBuffer: 24 * 1024 * 1024,
    });
    return result.status === 0 ? result.stdout : null;
  };
  const save = (relative, data) => {
    const target = path.join(output, safe(relative));
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, data, { flag: "wx" });
  };
  const manifest = JSON.parse(fs.readFileSync(path.join(overlay, "manifest.json")));
  assert.equal(manifest.upstreamBase.sha, from);
  const report = {
    from,
    to,
    applicationWorkingTreeChanged: false,
    applicationIndexChanged: false,
    patchesRetiredAutomatically: false,
    sourceValidationComplete: false,
    patches: [],
    preservedRetiredPatches: [],
    newFileCollisions: [],
  };
  for (const item of manifest.items.filter((entry) => entry.layer === "patch")) {
    safe(item.file);
    safe(item.target);
    const original = fs.readFileSync(path.join(overlay, item.file));
    const entry = { patch: item.file, target: item.target, originalSHA256: digest(original) };
    isolatedGit(["read-tree", from]);
    const previous = spawnSync("git", ["apply", "--cached", "--binary", "-"], {
      cwd: root,
      env,
      input: original,
      maxBuffer: 1024 * 1024,
    });
    if (previous.status !== 0) {
      report.patches.push({
        ...entry,
        status: "PREVIOUS_BASE_APPLY_FAILED",
        error: previous.stderr.toString(),
      });
      continue;
    }
    const aligned = isolatedGit([
      "diff",
      "--cached",
      "--binary",
      "--full-index",
      from,
      "--",
      item.target,
    ]);
    // Read the isolated index explicitly; the application's real index remains untouched.
    const candidate = isolatedGit(["show", `:${item.target}`]);
    isolatedGit(["read-tree", to]);
    const result = spawnSync("git", ["apply", "--cached", "--3way", "--binary", "-"], {
      cwd: root,
      env,
      input: aligned,
      maxBuffer: 1024 * 1024,
    });
    if (result.status === 0) {
      const ported = isolatedGit([
        "diff",
        "--cached",
        "--binary",
        "--full-index",
        to,
        "--",
        item.target,
      ]);
      if (ported.length) save(`ported/${item.file}`, ported);
      report.patches.push({
        ...entry,
        status: ported.length ? "PORTED_FOR_REVIEW" : "UPSTREAM_INCORPORATED_REVIEW_REQUIRED",
        ...(ported.length ? { portedSHA256: digest(ported) } : {}),
      });
    } else {
      const before = blob(from, item.target);
      const after = blob(to, item.target);
      if (before) save(`review/previous-upstream/${item.target}`, before);
      if (after) save(`review/new-upstream/${item.target}`, after);
      save(`review/previous-candidate/${item.target}`, candidate);
      save(`review/aligned/${item.file}`, aligned);
      report.patches.push({
        ...entry,
        status: "MANUAL_REVIEW_REQUIRED",
        error: result.stderr.toString(),
      });
    }
  }
  const retired = JSON.parse(fs.readFileSync(path.join(overlay, "retired-patches.json")));
  assert.equal(retired.upstreamBase, from);
  for (const item of retired.patches) {
    const oldBlob = git(["rev-parse", `${from}:${safe(item.target)}`])
      .toString()
      .trim();
    assert.equal(oldBlob, item.upstreamBlob);
    assert.equal(
      digest(fs.readFileSync(path.join(overlay, "patches", safe(item.patch)))),
      item.patchSha256
    );
    const data = blob(to, item.target);
    const newBlob = data
      ? git(["hash-object", "--stdin"], { input: data }).toString().trim()
      : null;
    report.preservedRetiredPatches.push({
      ...item,
      newUpstreamBlob: newBlob,
      status: newBlob === oldBlob ? "IDENTICAL_RETIRED_TARGET" : "RETIRED_TARGET_REVIEW_REQUIRED",
    });
    if (data && newBlob !== oldBlob) save(`review/retired-new-upstream/${item.target}`, data);
  }
  for (const item of manifest.items.filter((entry) => entry.layer === "new")) {
    const data = blob(to, item.target);
    if (data)
      report.newFileCollisions.push({
        target: item.target,
        sameBytes: data.equals(fs.readFileSync(path.join(overlay, item.file))),
      });
  }
  assert.equal(git(["status", "--porcelain=v1"]).toString(), "");
  assert.equal(fs.existsSync(indexPath) ? digest(fs.readFileSync(indexPath)) : null, originalIndex);
  report.counts = Object.fromEntries(
    [...new Set(report.patches.map((entry) => entry.status))].map((status) => [
      status,
      report.patches.filter((entry) => entry.status === status).length,
    ])
  );
  save("inspection.json", JSON.stringify(report, null, 2) + "\n");
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [root, overlay, from, to, output] = process.argv.slice(2);
  const report = inspectUpgrade({ root, overlay, from, to, output });
  console.log(
    JSON.stringify({
      from,
      to,
      counts: report.counts,
      retired: report.preservedRetiredPatches.length,
      collisions: report.newFileCollisions.length,
      sourceValidationComplete: false,
    })
  );
}
