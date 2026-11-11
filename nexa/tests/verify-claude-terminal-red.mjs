import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync, execFileSync } from "node:child_process";

assert.equal(
  process.env.GITHUB_ACTIONS,
  "true",
  "Baseline reproduction runs only in the isolated CI fixture"
);
const delta = path.resolve("nexa/tests/fixtures/claude-terminal-controls-delta-v1.patch");
const output = path.join(process.env.RUNNER_TEMP, "claude-terminal-red.tap");
const receipt = path.join(process.env.RUNNER_TEMP, "claude-terminal-red.json");
assert.ok(!fs.existsSync(output) && !fs.existsSync(receipt), "Preserve earlier receipts");
execFileSync("git", ["apply", "--reverse", "--check", delta]);
execFileSync("git", ["apply", "--reverse", delta]);
let result, record;
try {
  result = spawnSync(
    process.execPath,
    [
      "--import",
      "tsx/esm",
      "--import",
      "./open-sse/utils/setupPolyfill.ts",
      "--import",
      "./tests/_setup/isolateDataDir.ts",
      "--import",
      "./nexa/tests/isolated-network.mjs",
      "--test",
      "--test-reporter=tap",
      "--test-concurrency=1",
      "tests/unit/claude-model-id-routing.test.ts",
      "tests/unit/claude-model-settings-route.test.ts",
    ],
    {
      encoding: "utf8",
      timeout: 90000,
      maxBuffer: 2 * 1024 * 1024,
      env: { ...process.env, DATA_DIR: path.join(process.env.RUNNER_TEMP, "terminal-red-data") },
    }
  );
  const text = String(result.stdout || "") + String(result.stderr || "");
  fs.writeFileSync(output, text, { flag: "wx" });
  const failures = Number([...text.matchAll(/^# fail (\d+)$/gm)].at(-1)?.[1]);
  const assertions = (text.match(/code: 'ERR_ASSERTION'/g) || []).length;
  record = {
    status: "baseline_assertion_failure",
    exitCode: result.status,
    failures,
    assertions,
    candidateModulesRestored: false,
    networkGenerationCalls: 0,
  };
  fs.writeFileSync(receipt, JSON.stringify(record, null, 2) + "\n", { flag: "wx" });
  assert.equal(result.status, 1);
  assert.ok(
    failures >= 3 && assertions === failures,
    "Every baseline failure must be an assertion"
  );
  assert.doesNotMatch(
    text,
    /ERR_MODULE_NOT_FOUND|ERR_UNKNOWN_FILE_EXTENSION|ERR_TEST_FAILURE.*timeout/
  );
} finally {
  execFileSync("git", ["apply", "--check", delta]);
  execFileSync("git", ["apply", delta]);
  if (record) {
    record.candidateModulesRestored = true;
    fs.writeFileSync(receipt, JSON.stringify(record, null, 2) + "\n");
    console.log(JSON.stringify(record));
  }
}
