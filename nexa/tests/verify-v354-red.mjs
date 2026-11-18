import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

assert.equal(process.env.GITHUB_ACTIONS, "true");
assert.ok(fs.existsSync("nexa/.work/applied.json"));
const root = process.cwd();
const files = [
  "open-sse/utils/cacheWriteUsage.ts",
  "open-sse/utils/proxyFetchTransportSupport.ts",
  "open-sse/services/claudeCodeCCH.ts",
];
const originals = files.map((file) => [file, fs.readFileSync(file)]);
const digest = (value) => createHash("sha256").update(value).digest("hex");
let result;
try {
  for (const file of files) {
    fs.writeFileSync(file, execFileSync("git", ["show", `upstream-main:${file}`]));
  }
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
      "--test-concurrency=1",
      "--test-reporter=tap",
      "tests/unit/nexa-v354-compatibility.test.ts",
    ],
    { cwd: root, env: process.env, encoding: "utf8", timeout: 90_000, maxBuffer: 16 * 1024 * 1024 }
  );
} finally {
  for (const [file, bytes] of originals) {
    fs.writeFileSync(file, bytes);
    assert.equal(digest(fs.readFileSync(file)), digest(bytes));
  }
}
const output = `${result.stdout || ""}${result.stderr || ""}`;
fs.writeFileSync(path.join(process.env.RUNNER_TEMP, "v354-baseline-red.tap"), output, {
  flag: "wx",
});
const counts = Object.fromEntries(
  ["tests", "pass", "fail", "skipped", "cancelled"].map((name) => {
    const matches = [...output.matchAll(new RegExp(`^# ${name} (\\d+)$`, "gm"))];
    return [name, matches.length ? Number(matches.at(-1)[1]) : null];
  })
);
assert.equal(result.signal, null, "an interrupted process is not a RED reproduction");
assert.ok(!result.error);
assert.equal(result.status, 1);
assert.equal(counts.tests, 9);
assert.equal(counts.skipped, 0);
assert.equal(counts.cancelled, 0);
assert.ok(counts.fail >= 3);
assert.doesNotMatch(
  output,
  /ERR_MODULE_NOT_FOUND|Cannot find module|SyntaxError|heap out of memory/
);
for (const name of [
  "retained internal TTL receipts survive the new cache-write reader",
  "billing-token re-signing is idempotent and leaves user text untouched",
  "generation writes never replay ambiguous transport failures in either legacy flag mode",
])
  assert.ok(output.includes(`- ${name}`) && new RegExp(`not ok \\d+ - ${name}`).test(output), name);
const receipt = {
  status: "ASSERTION_RED_REPRODUCED",
  counts,
  sourceRestored: true,
  productionBuildExecuted: false,
  providerGenerationCalls: 0,
  liveChanged: false,
};
fs.writeFileSync(
  path.join(process.env.RUNNER_TEMP, "v354-baseline-red.json"),
  JSON.stringify(receipt, null, 2) + "\n",
  { flag: "wx" }
);
console.log(JSON.stringify(receipt));
