#!/usr/bin/env node
import { runBounded } from "../deploy/run-bounded-build.mjs";
import fs from "node:fs";
import path from "node:path";

const scratch = path.resolve("nexa/.work/native-claude-regressions");
fs.mkdirSync(scratch, { recursive: true });
if (fs.lstatSync(scratch).isSymbolicLink())
  throw new Error("Validation directory must not be a symlink");

// Preserve native cache/TTL coverage and the sparse-thread, usage and quota regressions.
const tests = [
  "agent-bridge-native-cache-continuity.test.ts",
  "agent-bridge-thread-cache.test.ts",
  "native-claude-thread-protocol.test.ts",
  "native-claude-thread-executor.test.ts",
  "native-claude-thread-chatcore.test.ts",
  "native-claude-thread-routing.test.ts",
  "native-thinking-signature-switch.test.ts",
  "native-claude-cache-identity.test.ts",
  "db/native-claude-usage-persistence.test.ts",
  "claude-usage-effort.test.ts",
  "native-cache-health.test.ts",
  "agent-bridge-quota-recovery.test.ts",
  "ui/native-cache-panel.test.ts",
  "cli-package-migrations.test.mjs",
].map((file) => `tests/unit/${file}`);
const result = await runBounded(
  process.execPath,
  [
    "--import",
    "tsx/esm",
    "--import",
    "./open-sse/utils/setupPolyfill.ts",
    "--import",
    "./tests/_setup/isolateDataDir.ts",
    "--test",
    "--test-force-exit",
    "--test-concurrency=1",
    ...tests,
  ],
  {
    limitMiB: 768,
    env: {
      ...process.env,
      NODE_ENV: "test",
      NEXA_BUILD_HEAP_MB: "1024",
      TMPDIR: scratch,
      DATA_DIR: path.join(scratch, "data"),
      DISABLE_SQLITE_AUTO_BACKUP: "true",
      MITM_AUTO_RECOVER: "false",
    },
  }
);
process.exitCode = result.code;
