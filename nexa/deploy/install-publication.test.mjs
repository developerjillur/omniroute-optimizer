import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { installPublication } from "./install-publication.mjs";

test("an existing runtime is rejected without altering its files or running npm", async () => {
  const prefix = fs.mkdtempSync(path.join(os.tmpdir(), "preserve-publication-"));
  const marker = path.join(prefix, "existing-runtime.txt");
  fs.writeFileSync(marker, "preserve this installation");
  await assert.rejects(
    installPublication(prefix, "/does-not-exist.tgz"),
    /Preserve earlier runtime/
  );
  assert.deepEqual(fs.readdirSync(prefix), ["existing-runtime.txt"]);
  assert.equal(fs.readFileSync(marker, "utf8"), "preserve this installation");
});
