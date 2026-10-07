import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("./build-candidate.sh", import.meta.url));
function checkBuildGate(output, status = 0, googleStatus = 0) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "nexa-build-gate-"));
  const bin = path.join(directory, "bin");
  fs.mkdirSync(bin);
  fs.writeFileSync(path.join(bin, "npm"), "#!/bin/sh\nexit 0\n", { mode: 0o700 });
  fs.writeFileSync(path.join(bin, "npx"), "#!/bin/sh\nexit 0\n", { mode: 0o700 });
  fs.writeFileSync(
    path.join(bin, "node"),
    `#!/bin/sh
case "$*" in
  *tests/unit/nexa-google-account-health.test.ts*)
    exit "$GATE_GOOGLE_STATUS"
    ;;
esac
case "$1" in
  scripts/check/check-tsc-ratchet.mjs)
    printf '%s\\n' "$GATE_OUTPUT"
    exit "$GATE_STATUS"
    ;;
  nexa/deploy/run-bridge-tests.mjs)
    : > "$GATE_MARKER"
    exit 77
    ;;
esac
exit 0
`,
    { mode: 0o700 }
  );
  const marker = path.join(directory, "regression-entered");
  try {
    const result = spawnSync("/bin/bash", [script, directory], {
      cwd: directory,
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${bin}:/usr/bin:/bin`,
        GATE_OUTPUT: output,
        GATE_STATUS: String(status),
        GATE_GOOGLE_STATUS: String(googleStatus),
        GATE_MARKER: marker,
      },
    });
    return { status: result.status, continued: fs.existsSync(marker), stderr: result.stderr };
  } finally {
    assert.equal(fs.lstatSync(directory).isSymbolicLink(), false);
    console.info("Removing isolated build-gate fixture", {
      directory,
      entries: fs.readdirSync(directory),
    });
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

test("a skipped TypeScript measurement blocks production before regression or packaging", () => {
  const result = checkBuildGate("tscErrors=SKIP reason=tsc-signal-SIGABRT");
  assert.equal(result.status, 1);
  assert.equal(result.continued, false);
  assert.match(result.stderr, /production build blocked/);
});
test("a missing TypeScript measurement cannot pass a successful checker process", () => {
  const result = checkBuildGate("checker finished without a measurement");
  assert.equal(result.status, 1);
  assert.equal(result.continued, false);
});
test("a measured TypeScript regression preserves its failure status", () => {
  const result = checkBuildGate("tscErrors=6000", 1);
  assert.equal(result.status, 1);
  assert.equal(result.continued, false);
});
test("a completed accepted TypeScript measurement permits the next validation stage", () => {
  const result = checkBuildGate("tscErrors=5830");
  assert.equal(result.status, 77);
  assert.equal(result.continued, true);
});

test("a Google account regression failure blocks production before packaging", () => {
  const result = checkBuildGate("tscErrors=5830", 0, 91);
  assert.equal(result.status, 91);
  assert.equal(result.continued, false);
});
