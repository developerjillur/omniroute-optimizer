import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const temporary = fs.mkdtempSync(
  path.join(os.tmpdir(), "startup-retention-red-"),
);
const baseline = path.join(temporary, "instrumentation-node.ts");
fs.writeFileSync(
  baseline,
  execFileSync("git", ["show", "HEAD:src/instrumentation-node.ts"]),
  { flag: "wx" },
);
const result = spawnSync(
  process.execPath,
  [
    "--test",
    "--test-reporter=tap",
    "nexa/tests/startup-data-retention.test.mjs",
  ],
  {
    encoding: "utf8",
    maxBuffer: 256 * 1024,
    env: {
      ...process.env,
      NEXA_SOURCE_ROOT: process.cwd(),
      NEXA_RETENTION_SOURCE: baseline,
    },
  },
);
assert.equal(result.error, undefined);
assert.equal(result.signal, null);
assert.equal(
  result.status,
  1,
  "An environment error or interrupted run is not a baseline reproduction",
);
for (const expected of [
  "# tests 4",
  "# pass 1",
  "# fail 3",
  "# cancelled 0",
  "# skipped 0",
])
  assert.ok(result.stdout.includes(expected), expected);
assert.ok(result.stdout.includes("Boot must not silently prune"));
assert.ok(result.stdout.includes("Read-only migration fixtures must retain"));
assert.ok(
  result.stdout.includes(
    "Enabled native Bridge recovery must remain registered",
  ),
);
console.log(
  JSON.stringify({
    baselineAssertionsReproduced: 3,
    unaffectedPolicyAssertionPassed: 1,
    environmentErrors: 0,
  }),
);
