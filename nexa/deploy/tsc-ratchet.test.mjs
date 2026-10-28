import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const checker = fileURLToPath(new URL("../new/scripts/check/check-tsc-ratchet.mjs", import.meta.url));
function measure(compiler, { args = [], baseline = { value: 1 } } = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "nexa-tsc-gate-"));
  if (compiler !== null) {
    const target = path.join(directory, "node_modules/typescript/bin/tsc");
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, compiler);
  }
  fs.mkdirSync(path.join(directory, "config/quality"), { recursive: true });
  const baselineFile = path.join(directory, "config/quality/tsc-error-baseline.json");
  if (baseline !== null) fs.writeFileSync(baselineFile, JSON.stringify(baseline));
  const diagnostics = path.join(directory, "diagnostics.log");
  const result = spawnSync(process.execPath, [checker, "--ratchet", ...args, "--diagnostics-out", diagnostics], {
    cwd: directory,
    encoding: "utf8",
  });
  return { ...result, diagnostics: fs.existsSync(diagnostics) ? fs.readFileSync(diagnostics, "utf8") : "",
    baseline: fs.existsSync(baselineFile) ? JSON.parse(fs.readFileSync(baselineFile,"utf8")) : null };
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
test("a terminated compiler retains partial diagnostics and cannot pass the ratchet", () => {
  const result = measure('console.log("a.ts: error TS1234: partial"); console.error("fixture termination diagnostic"); process.kill(process.pid, "SIGTERM")');
  assert.equal(result.status, 75);
  assert.match(result.stdout, /^tscErrors=SKIP reason=tsc-signal-SIGTERM/m);
  assert.match(result.diagnostics, /fixture termination diagnostic/);
  assert.match(result.diagnostics, /error TS1234: partial/);
});
test("a missing diagnostic destination is rejected before measurement", () => {
  const result = spawnSync(process.execPath, [checker, "--ratchet", "--diagnostics-out"], {
    encoding: "utf8",
  });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /requires an output file/);
});


test("lowering a release budget preserves the complete previous-release record", () => {
  const previousReleaseBudgets = [{value:5830,direction:"down",upstreamBaseVersion:"3.8.51"}];
  const result = measure('process.exit(0)',{args:["--update"],baseline:{value:1,direction:"down",upstreamBaseVersion:"3.8.52",previousReleaseBudgets}});
  assert.equal(result.status,0,result.stderr);
  assert.equal(result.baseline.value,0);
  assert.equal(result.baseline.upstreamBaseVersion,"3.8.52");
  assert.deepEqual(result.baseline.previousReleaseBudgets,previousReleaseBudgets);
});

test("an increased measurement cannot rewrite a version budget or its history", () => {
  const baseline = {value:1,previousReleaseBudgets:[{value:5830,upstreamBaseVersion:"3.8.51"}]};
  const result = measure('console.log("a.ts: error TS1234: one\\nb.ts: error TS5678: two"); process.exit(2)',{args:["--update"],baseline});
  assert.equal(result.status,1);
  assert.deepEqual(result.baseline,baseline);
});

test("missing and invalid budgets fail closed even after a completed compiler", () => {
  for (const baseline of [null,{value:-1},{value:"1"}]) {
    const result = measure('process.exit(0)',{baseline});
    assert.equal(result.status,75,result.stderr);
    assert.match(result.stderr,/baseline missing or invalid/);
    assert.deepEqual(result.baseline,baseline);
  }
});
