import assert from "node:assert/strict";
import fs from "node:fs";

const text = fs.readFileSync(process.argv[2], "utf8");
for (const [name, expected] of Object.entries({tests:1,pass:0,fail:1,skipped:0,cancelled:0})) {
  const actual = Number([...text.matchAll(new RegExp(`^# ${name} (\\d+)$`, "gm"))].at(-1)?.[1]);
  assert.equal(actual, expected, `cache cost baseline ${name}`);
}
assert.match(text, /ERR_ASSERTION/);
assert.doesNotMatch(text, /ERR_MODULE_NOT_FOUND|ERR_DLOPEN_FAILED|SyntaxError:|hookFailed/);
console.log(JSON.stringify({cacheCostRegressionReproduced:true,assertionFailures:1}));
