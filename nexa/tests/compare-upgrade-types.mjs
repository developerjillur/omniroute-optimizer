import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { parseTypeDiagnostics, compareTypeDiagnostics } from "../lib/typeDiagnostics.mjs";

const directory = process.env.RUNNER_TEMP;
assert.equal(process.env.GITHUB_ACTIONS, "true");
function completedOutput(file) {
  const data = fs.readFileSync(path.join(directory, file), "utf8");
  const header = JSON.parse(data.split("\n")[0]);
  assert.equal(header.signal, null);
  assert.ok(header.status === 0 || header.status === 2);
  assert.ok(!header.error, "an incomplete compiler cannot become a baseline");
  return data;
}
const beforeLog = completedOutput("pristine-tsc-diagnostics.log");
const before = JSON.parse(
  fs.readFileSync(path.join(directory, "pristine-tsc-identities.json"), "utf8")
);
assert.equal(before.length, (beforeLog.match(/error TS\d+:/g) || []).length);
const sourceFiles = new Map();
const after = parseTypeDiagnostics(completedOutput("tsc-diagnostics.log"), (file, row) => {
  if (!sourceFiles.has(file))
    sourceFiles.set(
      file,
      fs.readFileSync(path.join(directory, "omniroute-fixture", file), "utf8").split(/\r?\n/)
    );
  return sourceFiles.get(file)[row - 1];
});
const receipt = {
  ...compareTypeDiagnostics(before, after),
  baselineRaised: false,
  identity: "same file, diagnostic code, source statement and column; multiplicity cannot grow",
};
fs.writeFileSync(
  path.join(directory, "upgrade-types.json"),
  JSON.stringify(receipt, null, 2) + "\n",
  { flag: "wx" }
);
console.log(
  JSON.stringify({
    pristine: receipt.pristine,
    applied: receipt.applied,
    newDiagnostics: receipt.added.length,
    changedTypeMessages: receipt.changedMessages.length,
  })
);
assert.ok(
  receipt.applied <= receipt.pristine,
  "the upgrade must not increase the full-project backlog"
);
assert.equal(
  receipt.added.length,
  0,
  "review and fix every diagnostic newly introduced by the overlay"
);
