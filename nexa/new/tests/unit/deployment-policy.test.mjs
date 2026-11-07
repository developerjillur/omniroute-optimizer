import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const tools = path.join(process.cwd(), "nexa/deploy");
const modulePath = path.join(tools, "deployment-policy.mjs");
const { deploymentPolicy } = await import(pathToFileURL(modulePath).href);

test("local gateway updates preserve the open desktop shell by default", () => {
  assert.deepEqual(deploymentPolicy({}), { buildDesktop: false, deployDesktop: false });
});

test("building a desktop artifact does not authorize closing or replacing the desktop app", () => {
  assert.deepEqual(deploymentPolicy({ NEXA_BUILD_DESKTOP: "1" }), {
    buildDesktop: true,
    deployDesktop: false,
  });
});

test("desktop promotion requires its independent explicit opt-in", () => {
  assert.deepEqual(deploymentPolicy({ NEXA_BUILD_DESKTOP: "1", NEXA_DEPLOY_DESKTOP: "1" }), {
    buildDesktop: true,
    deployDesktop: true,
  });
});

test("ambiguous opt-in values fail before the updater starts", () => {
  for (const value of ["true", "yes", "", "2"]) {
    assert.throws(() => deploymentPolicy({ NEXA_BUILD_DESKTOP: value }));
    assert.throws(() => deploymentPolicy({ NEXA_DEPLOY_DESKTOP: value }));
  }
});

test("the executable policy returns both defaults without reading user configuration", () => {
  const env = { ...process.env };
  delete env.NEXA_BUILD_DESKTOP;
  delete env.NEXA_DEPLOY_DESKTOP;
  const result = spawnSync(process.execPath, [modulePath], {
    env,
    encoding: "utf8",
  });
  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), "0 0");
});

test("local updater gates desktop operations and never publishes repository state", () => {
  const updater = fs.readFileSync(path.join(tools, "omni-updater.sh"), "utf8");
  assert.match(updater, /if \[ "\$BUILD_DESKTOP" = 1 \]; then/);
  assert.match(
    updater,
    /if \[ "\$DEPLOY_DESKTOP" = 1 \] && \[ -d "\$OUTDIR\/OmniRoute\.app" \]; then/
  );
  assert.doesNotMatch(updater, /\bgit\b[^\n]*\bpush\b/);
});
