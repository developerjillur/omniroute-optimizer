import assert from "node:assert/strict";
import fs from "node:fs";

const [family, filename] = process.argv.slice(2);
const expected = {
  "tool-only": {
    tests: 16,
    failures: [
      "tool-only Claude reply omits synthetic text for null content",
      "tool-only Claude reply omits synthetic text for omitted content",
      "tool-only Claude reply omits synthetic text for whitespace content",
      "Responses API function-call-only output remains a tool-only Claude reply",
      "parallel tool-only calls preserve every id, name and argument",
    ],
  },
  "client-socket": {
    tests: 4,
    failures: [
      "late EPIPE on connection closes only that client and preserves other sessions",
      "late EPIPE on secureConnection closes only that client and preserves other sessions",
      "CONNECT re-emission keeps one client error handler and one connection count",
    ],
  },
}[family];
assert.ok(expected, "a reviewed incident family is required");
const output = fs.readFileSync(filename, "utf8");
const count = (name) =>
  Number([...output.matchAll(new RegExp(`^# ${name} (\\d+)$`, "gm"))].at(-1)?.[1]);
assert.equal(count("tests"), expected.tests);
assert.equal(count("fail"), expected.failures.length);
assert.equal(count("pass"), expected.tests - expected.failures.length);
assert.equal(count("skipped"), 0);
assert.equal(count("cancelled"), 0);
const failures = [...output.matchAll(/^not ok \d+ - (.+)$/gm)].map((match) => match[1]);
assert.deepEqual(failures.sort(), [...expected.failures].sort());
assert.match(output, /ERR_ASSERTION/);
assert.doesNotMatch(
  output,
  /ERR_MODULE_NOT_FOUND|ERR_DLOPEN_FAILED|ERR_UNSUPPORTED|SyntaxError:|ReferenceError:|hookFailed|heap out of memory|RESOURCE_STOP/
);
console.log(
  JSON.stringify({
    family,
    reproduced: true,
    tests: expected.tests,
    assertionFailures: failures.length,
  })
);
