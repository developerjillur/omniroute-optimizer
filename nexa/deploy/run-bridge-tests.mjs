import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";

const files = [];
for (const [directory, pattern] of [
  [
    "tests/unit",
    /^(mitm-|agent-bridge-|db-agent-bridge|claude-fallback-quota-|claude-quota-alert-).*\.test\.(ts|mjs)$/,
  ],
  ["tests/integration", /^agent-bridge-.*\.test\.ts$/],
]) {
  for (const name of fs.readdirSync(directory)) {
    if (pattern.test(name)) files.push(path.join(directory, name));
  }
}
if (!files.some((file) => file.endsWith("agent-bridge-legacy-claude-thinking.test.ts"))) {
  throw new Error("Native legacy-Claude thinking suite is missing");
}
if (!files.some((file) => file.endsWith("agent-bridge-resilience.test.ts"))) {
  throw new Error("Native Bridge resilience suite is missing");
}
if (!files.some((file) => file.endsWith("agent-bridge-thread-cache.test.ts"))) {
  throw new Error("Native thread cache-budget suite is missing");
}
if (!files.some((file) => file.endsWith("agent-bridge-client-beta.test.ts"))) {
  throw new Error("Native client protocol negotiation suite is missing");
}
for (const required of [
  "agent-bridge-native-cache-continuity.test.ts",
  "agent-bridge-compression-disabled.test.ts",
]) {
  if (!files.some((file) => file.endsWith(required)))
    throw new Error(`Native cache and compression-policy suite is missing: ${required}`);
}
if (!files.some((file) => file.endsWith("claude-fallback-quota-classification.test.ts"))) {
  throw new Error("Fallback quota classification suite is missing");
}
if (!files.some((file) => file.endsWith("claude-quota-alert-vs-exhaustion.test.ts"))) {
  throw new Error("Claude quota alert versus exhaustion suite is missing");
}
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "bridge-regression-data-"));
const testEnvironment = {
  ...process.env,
  DATA_DIR: dataDir,
  MITM_AUTO_RECOVER: "false",
  DISABLE_SQLITE_AUTO_BACKUP: "true",
  OMNIROUTE_SKIP_SYSTEM_TRUST: "1",
  OMNIROUTE_SKIP_DNS_WRITE: "1",
  ADOBE_FIREFLY_BROWSER_REFRESH: "0",
};
console.log(`Bridge regression: ${files.length} files, serial execution, isolated data directory`);
const result = spawnSync(
  process.execPath,
  [
    "--import",
    "tsx/esm",
    "--import",
    "./open-sse/utils/setupPolyfill.ts",
    "--import",
    "./tests/_setup/isolateDataDir.ts",
    "--test",
    "--test-concurrency=1",
    ...files.sort(),
  ],
  {
    stdio: "inherit",
    env: testEnvironment,
  }
);
process.exitCode = result.status ?? 1;
if (process.exitCode === 0) {
  const ui = fs
    .readdirSync("tests/unit/ui")
    .filter(
      (name) =>
        /^(agent-bridge-|mitm-proxy-).*\.test\.tsx$/.test(name) ||
        [
          "cost-live-refresh.test.tsx",
          "cost-filter-refresh-integration.test.tsx",
          "cost-overview-flat-rate-disclosure.test.tsx",
        ].includes(name)
    )
    .map((name) => path.join("tests/unit/ui", name));
  for (const required of [
    "cost-live-refresh.test.tsx",
    "cost-filter-refresh-integration.test.tsx",
    "cost-overview-flat-rate-disclosure.test.tsx",
  ]) {
    if (!ui.some((file) => file.endsWith(required)))
      throw new Error(`Cost regression suite is missing: ${required}`);
  }
  const checked = spawnSync(
    process.execPath,
    [
      "node_modules/vitest/vitest.mjs",
      "run",
      "--config",
      "vitest.config.ts",
      "--maxWorkers",
      "1",
      "--no-file-parallelism",
      ...ui,
    ],
    { stdio: "inherit", env: testEnvironment }
  );
  process.exitCode = checked.status ?? 1;
}
