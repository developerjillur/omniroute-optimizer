import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const verifier = fileURLToPath(new URL("./verify-resilience-budget-red.mjs", import.meta.url));
const target = "resilience budgetMs follows runtime floors and the five-minute ceiling";
const fixture = `TAP version 13
not ok 1 - ${target}
  code: ERR_ASSERTION
not ok 2 - resilience budgetMs survives a complete settings payload
  code: ERR_ASSERTION
ok 3 - concurrency control
ok 4 - invalid budget control
ok 5 - unknown key control
ok 6 - default preservation control
# tests 6
# pass 4
# fail 2
# skipped 0
# cancelled 0
`;
function verify(output) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "resilience-budget-red-"));
  const file = path.join(directory, "fixture.tap");
  fs.writeFileSync(file, output);
  return spawnSync(process.execPath, [verifier, file], { encoding: "utf8" });
}

test("the settings RED verifier accepts only its two exact assertion failures", () => {
  const result = verify(fixture);
  assert.equal(result.status, 0, result.stderr);
});

test("the settings RED verifier rejects an import failure despite a failure summary", () => {
  const result = verify(`${fixture}\nSyntaxError: fixture import failed\n`);
  assert.notEqual(result.status, 0);
});

test("the settings RED verifier rejects an unrelated assertion or incomplete count", () => {
  assert.notEqual(verify(fixture.replace(target, "unrelated assertion")).status, 0);
  assert.notEqual(verify(fixture.replace("# tests 6", "# tests 5")).status, 0);
});
