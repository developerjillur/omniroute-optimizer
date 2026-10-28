import fs from "node:fs";
import assert from "node:assert/strict";

const output = fs.readFileSync(process.argv[2], "utf8");
const lastCount = (name) => Number([...output.matchAll(new RegExp(`^# ${name} (\\d+)$`, "gm"))].at(-1)?.[1]);
const tests = lastCount("tests");
const failures = lastCount("fail");
assert.ok(tests >= 10, "The baseline must execute the focused fixtures, not fail while importing them");
assert.ok(failures > 0, "The unchanged baseline must fail the regression assertions");
assert.match(output, /ERR_ASSERTION/, "A setup or process failure is not a reproduced regression");
assert.doesNotMatch(output, /ERR_MODULE_NOT_FOUND|ERR_DLOPEN_FAILED|ERR_UNSUPPORTED|SyntaxError:|hookFailed/);
console.log(JSON.stringify({ baselineReproduced: true, tests, failures }));
