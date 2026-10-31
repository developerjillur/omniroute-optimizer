import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";

const inventory = JSON.parse(fs.readFileSync("overlay-inventory.json", "utf8"));
const manifest = JSON.parse(fs.readFileSync("nexa/manifest.json", "utf8"));
assert.equal(inventory.upstreamBase, manifest.upstreamBase.sha);
assert.equal(inventory.upstreamVersion, manifest.upstreamBase.version);
const paths = execFileSync("git", ["ls-files", "-z", "--", "nexa/"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean)
  .sort();
assert.deepEqual(inventory.files.map((entry) => entry.path).sort(), paths);
assert.equal(inventory.trackedNexaFiles, paths.length);
let bytes = 0;
for (const entry of inventory.files) {
  const data = fs.readFileSync(entry.path);
  bytes += data.length;
  assert.equal(entry.bytes, data.length, entry.path);
  assert.equal(entry.sha256, createHash("sha256").update(data).digest("hex"), entry.path);
  assert.equal(
    entry.gitBlobSha,
    createHash("sha1").update(`blob ${data.length}\0`).update(data).digest("hex"),
    entry.path
  );
  const mode = fs.statSync(entry.path).mode & 0o111 ? "100755" : "100644";
  assert.equal(entry.mode, mode, entry.path);
}
assert.equal(inventory.totalNexaBytes, bytes);
console.log(JSON.stringify({ inventoryVerified: true, files: paths.length, bytes }));
