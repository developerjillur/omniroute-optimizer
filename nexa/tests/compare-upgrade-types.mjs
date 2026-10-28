import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const directory = process.env.RUNNER_TEMP;
assert.equal(process.env.GITHUB_ACTIONS, "true");
function diagnostics(file) {
  const data = fs.readFileSync(path.join(directory, file), "utf8");
  const header = JSON.parse(data.split("\n")[0]);
  assert.equal(header.signal, null);
  assert.ok(header.status === 0 || header.status === 2);
  const result = new Map();
  for (const line of data.split("\n")) {
    const match = line.match(/^(.+?)\(\d+,\d+\): error (TS\d+): (.*)$/);
    if (!match) continue;
    const key = `${match[1]}: ${match[2]}: ${match[3]}`;
    result.set(key, (result.get(key) || 0) + 1);
  }
  return result;
}
const before = diagnostics("pristine-tsc-diagnostics.log");
const after = diagnostics("tsc-diagnostics.log");
const added = [];
for (const [message, count] of after) {
  const increase = count - (before.get(message) || 0);
  if (increase > 0) added.push({message,count:increase});
}
const sum = (map) => [...map.values()].reduce((a,b) => a+b,0);
const receipt = {pristine:sum(before),applied:sum(after),added,baselineRaised:false};
fs.writeFileSync(path.join(directory, "upgrade-types.json"),JSON.stringify(receipt,null,2)+"\n",{flag:"wx"});
console.log(JSON.stringify({pristine:receipt.pristine,applied:receipt.applied,newDiagnostics:added.length}));
assert.ok(receipt.applied <= receipt.pristine, "the upgrade must not increase the full-project backlog");
assert.equal(added.length, 0, "review and fix every diagnostic newly introduced by the overlay");
