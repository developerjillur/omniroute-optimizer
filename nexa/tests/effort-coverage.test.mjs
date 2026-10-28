import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const validator = fileURLToPath(new URL("./verify-effort-coverage.mjs", import.meta.url));
const titles = [
  "Responses Max normalization uses the same model capabilities as the Codex executor",
  "legacy and unverified models retain their existing safety ceilings",
  "other providers retain upstream literal max behavior for unknown models",
];
for (const variant of ["complete", "missing-completion", "missing-final-case"]) {
  test(`effort coverage rejects incomplete reporting: ${variant}`, () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "effort-report-"));
    const file = path.join(directory, "fixture.tap");
    const reported = variant === "missing-final-case" ? titles.slice(0, -1) : titles;
    const marker =
      variant === "missing-completion" ? "" : "# NEXA_EFFORT_COVERAGE_COMPLETE cases=50\n";
    fs.writeFileSync(
      file,
      reported.map((title) => `# Subtest: ${title}\n`).join("") +
        marker +
        "# tests 50\n# pass 50\n# fail 0\n# cancelled 0\n# skipped 0\n"
    );
    const result = spawnSync(process.execPath, [validator, file], { encoding: "utf8" });
    assert.equal(result.status === 0, variant === "complete", result.stderr);
  });
}
