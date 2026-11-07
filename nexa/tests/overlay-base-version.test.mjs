import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

test("manifest base identity is stable across Git abbreviation settings", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "overlay-base-version-"));
  const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  git("init", "--quiet");
  git("config", "user.name", "Jillur Rahman");
  git("config", "user.email", "22579419+developerjillur@users.noreply.github.com");
  fs.writeFileSync(path.join(root, "package.json"), '{"version":"1.2.3"}\n');
  git("add", "package.json");
  const tree = git("write-tree");
  const commit = execFileSync("git", ["commit-tree", tree], {
    cwd: root,
    encoding: "utf8",
    input: "Fixture package version\n",
  }).trim();
  git("update-ref", "refs/heads/upstream-main", commit);
  const modulePath = path.join(root, "nexa/lib/overlay.mjs");
  fs.mkdirSync(path.dirname(modulePath), { recursive: true });
  fs.copyFileSync(fileURLToPath(new URL("../lib/overlay.mjs", import.meta.url)), modulePath);
  fs.copyFileSync(
    fileURLToPath(new URL("../lib/retiredPatches.mjs", import.meta.url)),
    path.join(path.dirname(modulePath), "retiredPatches.mjs")
  );
  const { baseVersion } = await import(pathToFileURL(modulePath).href);
  for (const abbreviation of [4, 12]) {
    git("config", "core.abbrev", String(abbreviation));
    assert.deepEqual(baseVersion(), { sha: commit, version: "1.2.3" });
  }
});
