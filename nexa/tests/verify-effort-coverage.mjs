import assert from "node:assert/strict";
import fs from "node:fs";

const text = fs.readFileSync(process.argv[2], "utf8");
const withinSuite = process.argv.includes("--within-suite");
const count = (name) =>
  Number([...text.matchAll(new RegExp(`^# ${name} (\\d+)$`, "gm"))].at(-1)?.[1]);
const executed = Number(text.match(/NEXA_EFFORT_COVERAGE_COMPLETE cases=(\d+)/)?.[1]);
assert.ok(
  Number.isInteger(executed) && executed >= 50,
  "native effort suite completion is required"
);
for (const title of [
  "Responses Max normalization uses the same model capabilities as the Codex executor",
  "legacy and unverified models retain their existing safety ceilings",
  "other providers retain upstream literal max behavior for unknown models",
])
  assert.ok(text.includes(`# Subtest: ${title}\n`), `missing native effort case: ${title}`);
assert.equal(count("fail"), 0);
assert.equal(count("cancelled"), 0);
assert.equal(count("skipped"), 0);
assert.equal(count("pass"), count("tests"));
if (withinSuite) assert.ok(count("tests") >= executed);
else assert.equal(count("tests"), executed, "all registered effort cases must be reported");
console.log(JSON.stringify({ nativeEffortCoverageComplete: true, executed, withinSuite }));
