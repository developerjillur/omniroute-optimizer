import assert from "node:assert/strict";
import fs from "node:fs";

const output = fs.readFileSync(process.argv[2], "utf8");
const count = (field) =>
  Number([...output.matchAll(new RegExp(`^# ${field} (\\d+)$`, "gm"))].at(-1)?.[1]);
assert.ok(count("tests") >= 15, "the complete focused baseline must execute");
assert.ok(count("fail") >= 1, "an assertion must reproduce the missing capability");
assert.equal(count("skipped"), 0);
assert.equal(count("cancelled"), 0);
assert.match(output, /ERR_ASSERTION/);
assert.doesNotMatch(
  output,
  /ERR_MODULE_NOT_FOUND|ERR_PACKAGE_PATH_NOT_EXPORTED|Cannot find (?:module|package)|does not provide an export|SyntaxError|ReferenceError|TypeError|ENOTFOUND|ECONNREFUSED|SIGKILL/
);
console.log(
  JSON.stringify({
    reproduced: true,
    tests: count("tests"),
    assertionFailures: count("fail"),
    generationCalls: 0,
  })
);
