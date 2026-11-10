import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { inspectUpgrade } from "./inspect-upgrade.mjs";

function fixture(conflict = false) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "upgrade-inspection-"));
  const root = path.join(home, "application");
  const overlay = path.join(home, "overlay");
  const output = path.join(home, "result");
  fs.mkdirSync(root);
  fs.mkdirSync(path.join(overlay, "patches"), { recursive: true });
  const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  git("init", "--quiet");
  git("config", "user.name", "Jillur Rahman");
  git("config", "user.email", "22579419+developerjillur@users.noreply.github.com");
  const text = Array.from({ length: 30 }, (_, i) => `line ${i}`).join("\n") + "\n";
  fs.writeFileSync(path.join(root, "sample.txt"), text);
  fs.writeFileSync(path.join(root, "retired.txt"), "already incorporated\n");
  git("add", ".");
  git("commit", "--quiet", "-m", "Baseline fixture");
  const from = git("rev-parse", "HEAD");
  fs.writeFileSync(path.join(root, "sample.txt"), text.replace("line 15\n", "custom correction\n"));
  const patch = execFileSync("git", ["diff", "--binary", "--full-index", from], { cwd: root });
  fs.writeFileSync(path.join(overlay, "patches/sample.patch"), patch);
  fs.writeFileSync(
    path.join(root, "sample.txt"),
    conflict ? text.replace("line 15\n", "upstream correction\n") : "new upstream line\n" + text
  );
  fs.writeFileSync(path.join(root, "retired.txt"), "upstream evolved\n");
  git("add", ".");
  git("commit", "--quiet", "-m", "New release fixture");
  const to = git("rev-parse", "HEAD");
  fs.writeFileSync(
    path.join(overlay, "manifest.json"),
    JSON.stringify({
      upstreamBase: { sha: from },
      items: [{ layer: "patch", file: "patches/sample.patch", target: "sample.txt" }],
    })
  );
  fs.writeFileSync(path.join(overlay, "patches/retired.patch"), "retained historical patch\n");
  const registry = {
    upstreamBase: from,
    patches: [
      {
        patch: "retired.patch",
        target: "retired.txt",
        patchSha256: createHash("sha256").update("retained historical patch\n").digest("hex"),
        upstreamBlob: git("rev-parse", `${from}:retired.txt`),
        reason: "Previously reviewed incorporation",
      },
    ],
  };
  fs.writeFileSync(path.join(overlay, "retired-patches.json"), JSON.stringify(registry));
  return { root, overlay, from, to, output };
}

test("a clean three-way port retains both changes without altering the application or retiring patches", () => {
  const options = fixture();
  const before = fs.readFileSync(path.join(options.root, "sample.txt"));
  const result = inspectUpgrade(options);
  assert.equal(result.patches[0].status, "PORTED_FOR_REVIEW");
  const patch = fs.readFileSync(path.join(options.output, "ported/patches/sample.patch"), "utf8");
  assert.match(patch, /custom correction/);
  assert.ok(fs.readFileSync(path.join(options.root, "sample.txt")).equals(before));
  assert.equal(result.preservedRetiredPatches[0].status, "RETIRED_TARGET_REVIEW_REQUIRED");
  assert.equal(result.patchesRetiredAutomatically, false);
  assert.equal(result.sourceValidationComplete, false);
});

test("an overlapping correction retains all three source versions for review", () => {
  const options = fixture(true);
  const result = inspectUpgrade(options);
  assert.equal(result.patches[0].status, "MANUAL_REVIEW_REQUIRED");
  assert.match(
    fs.readFileSync(path.join(options.output, "review/new-upstream/sample.txt"), "utf8"),
    /upstream correction/
  );
  assert.match(
    fs.readFileSync(path.join(options.output, "review/previous-candidate/sample.txt"), "utf8"),
    /custom correction/
  );
  assert.equal(fs.existsSync(path.join(options.output, "ported/patches/sample.patch")), false);
});

test("inspection rejects evidence inside the application and refuses to overwrite a previous report", () => {
  const options = fixture();
  assert.throws(
    () => inspectUpgrade({ ...options, output: path.join(options.root, "result") }),
    /outside the application/
  );
  inspectUpgrade(options);
  assert.throws(() => inspectUpgrade(options), /earlier upgrade evidence/);
});
