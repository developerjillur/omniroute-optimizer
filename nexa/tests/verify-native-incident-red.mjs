import assert from "node:assert/strict";
import fs from "node:fs";

const [family, filename] = process.argv.slice(2);
const expected = {
  "native-attribution": {
    tests: 8,
    failures: [
      "native client attribution follows a routed Codex request",
      "native client attribution follows a routed Gemini request",
      "non-native Chat metadata cannot manufacture native attribution",
      "non-native Responses headers cannot manufacture native attribution",
      "routed native attribution preserves header identity precedence",
      "failed routed native attempts retain identity and the real error",
    ],
  },
  "quality-usage": {
    tests: 11,
    failures: [
      "self-service counts Responses cached input and reasoning once and keeps the breakdown",
      "self-service counts native Claude cache reads and writes once and keeps the breakdown",
      "monthly self-tracked provider quotas count inclusive tokens once within their connection and month",
      "Antigravity local quota fallback counts normalized reasoning once within its account model and window",
      "Responses translation retains an explicit assistant phase commentary",
      "Responses translation retains an explicit assistant phase final_answer",
      "Responses translation retains an explicit assistant phase null",
    ],
  },
  "tool-only": {
    tests: 16,
    failures: [
      "tool-only Claude reply omits synthetic text for null content",
      "tool-only Claude reply omits synthetic text for omitted content",
      "tool-only Claude reply omits synthetic text for whitespace content",
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
  "ingress-availability": {
    tests: 4,
    failures: [
      "an unavailable Bridge never silently sends the mapped conversation to the vendor",
      "a restarting Bridge receives the original encrypted bytes exactly once",
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
  /ERR_MODULE_NOT_FOUND|ERR_DLOPEN_FAILED|ERR_UNSUPPORTED|SyntaxError:|ReferenceError:|hookFailed|Environment:|heap out of memory|RESOURCE_STOP/
);
console.log(
  JSON.stringify({
    family,
    reproduced: true,
    tests: expected.tests,
    assertionFailures: failures.length,
  })
);
