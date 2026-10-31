import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

assert.equal(
  process.env.GITHUB_ACTIONS,
  "true",
  "The full upgrade lane requires the isolated CI fixture"
);
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const name = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(name);
    else if (
      /\.test\.(?:ts|mjs)$/.test(name) &&
      !fs.readFileSync(name, "utf8").includes('from "vitest"')
    ) {
      files.push(name.replace(/^nexa\/new\//, ""));
    }
  }
}
walk("nexa/new/tests/unit");
for (const file of fs.readdirSync("nexa/patches")) {
  const text = fs.readFileSync(path.join("nexa/patches", file), "utf8");
  const target = text.match(/^\+\+\+ b\/(.+)$/m)?.[1];
  if (target?.startsWith("tests/unit/") && /\.test\.(?:ts|mjs)$/.test(target)) files.push(target);
}
const tests = [...new Set(files)].sort();
console.log(`# Upgrade compatibility files: ${tests.length}`);
const result = spawnSync(
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
    ...tests,
  ],
  { stdio: "inherit", env: process.env, timeout: 6 * 60_000, killSignal: "SIGTERM" }
);
if (result.error) throw result.error;
process.exitCode = result.signal ? 75 : (result.status ?? 75);
