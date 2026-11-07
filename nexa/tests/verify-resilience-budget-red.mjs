import assert from "node:assert/strict";
import fs from "node:fs";

const output = fs.readFileSync(process.argv[2], "utf8");
const count = (name) =>
  Number([...output.matchAll(new RegExp(`^# ${name} (\\d+)$`, "gm"))].at(-1)?.[1]);
assert.equal(count("tests"), 6);
assert.equal(count("pass"), 4);
assert.equal(count("fail"), 2);
assert.equal(count("skipped"), 0);
assert.equal(count("cancelled"), 0);
assert.equal((output.match(/^ok \d+ - /gm) || []).length, 4);
const failures = [...output.matchAll(/^not ok \d+ - (.+)$/gm)].map((match) => match[1]);
assert.deepEqual(failures.sort(), [
  "resilience budgetMs follows runtime floors and the five-minute ceiling",
  "resilience budgetMs survives a complete settings payload",
]);
assert.match(output, /ERR_ASSERTION/);
assert.doesNotMatch(
  output,
  /ERR_MODULE_NOT_FOUND|ERR_DLOPEN_FAILED|ERR_UNSUPPORTED|SyntaxError:|hookFailed/
);
console.log(JSON.stringify({ settingsBudgetRegressionReproduced: true, tests: 6, failures: 2 }));
