import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const checker = fileURLToPath(new URL("../new/scripts/check/check-tsc-ratchet.mjs", import.meta.url));
function measure(compiler) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "nexa-tsc-gate-"));
  if (compiler !== null) {
    const target = path.join(directory, "node_modules/typescript/bin/tsc");
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, compiler);
  }
  fs.mkdirSync(path.join(directory, "config/quality"), { recursive: true });
  fs.writeFileSync(path.join(directory, "config/quality/tsc-error-baseline.json"), '{"value":1}');
  return spawnSync(process.execPath, [checker, "--ratchet"], { cwd: directory, encoding: "utf8" });
}
test("a missing compiler is reported as an unmeasured gate", () => {
  const result = measure(null);
  assert.match(result.stdout, /^tscErrors=SKIP reason=tsc-absent/m);
  assert.equal(result.status, 75);
});
test("a compiler crash cannot be misreported as zero TypeScript errors", () => {
  assert.match(measure('process.exit(1)').stdout, /^tscErrors=SKIP reason=tsc-exit-1/m);
});
test("a terminated compiler records the signal instead of a missing installation", () => {
  assert.match(measure('process.kill(process.pid, "SIGTERM")').stdout, /^tscErrors=SKIP reason=tsc-signal-SIGTERM/m);
});
test("completed diagnostics are measured and still enforce the down-only baseline", () => {
  const result = measure('console.log("a.ts: error TS1234: first\\nb.ts: error TS5678: second"); process.exit(2)');
  assert.equal(result.status, 1);
  assert.match(result.stdout, /^tscErrors=2/m);
});
test("a completed compiler with no diagnostics measures zero", () => {
  assert.match(measure('process.exit(0)').stdout, /^tscErrors=0/m);
});
