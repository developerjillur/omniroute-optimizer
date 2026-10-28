import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));

test("canonical inventory matches every tracked overlay file and its exact bytes", () => {
  const inventory = JSON.parse(fs.readFileSync(path.join(root, "overlay-inventory.json"), "utf8"));
  const tracked = execFileSync("git", ["ls-files", "-z", "--", "nexa/"], {
    cwd: root,
    encoding: "utf8",
  }).split("\0").filter(Boolean).sort();
  const files = inventory.files;
  assert.equal(inventory.trackedNexaFiles, tracked.length);
  assert.deepEqual(files.map((item) => item.path).sort(), tracked);
  let bytes = 0;
  for (const item of files) {
    assert.ok(item.path.startsWith("nexa/") && !item.path.split("/").includes(".."));
    const file = path.join(root, item.path);
    const stat = fs.lstatSync(file);
    assert.ok(stat.isFile(), item.path);
    const data = fs.readFileSync(file);
    assert.equal(item.bytes, data.length, item.path);
    assert.equal(item.mode, stat.mode & 0o111 ? "100755" : "100644", item.path);
    assert.equal(item.sha256, createHash("sha256").update(data).digest("hex"), item.path);
    const blob = createHash("sha1").update(`blob ${data.length}\0`).update(data).digest("hex");
    assert.equal(item.gitBlobSha, blob, item.path);
    bytes += data.length;
  }
  assert.equal(inventory.totalNexaBytes, bytes);
});
