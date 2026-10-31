import test from "node:test";
import assert from "node:assert/strict";
import { inspectCompiledCountRoute, inspectCompiledBridgeLifecycle } from "./bridge-gate.mjs";

const route =
  "f?.countTokens?.({model:b.model,body:d,credentials:c,clientHeaders:Object.fromEntries(a.headers.entries()),signal:a.signal,log:r})";
test("Webpack count route preserves native headers and request cancellation", () => {
  assert.equal(inspectCompiledCountRoute(route), true);
});

function compiledModules() {
  const root = "package/dist/src/mitm/";
  return {
    [root + "manager.js"]: 'export { startMitm } from "./manager-chunk.js";',
    [root + "manager-chunk.js"]:
      'import "./shared.js"; function startMitm() { getBridgeProcessState(); waitForBridgeReady(child); isOwnedBridgePid(pid); terminateBridgeChild(child); }',
    [root + "processLifecycle.js"]:
      'export { getBridgeProcessState, waitForBridgeReady, isOwnedBridgePid, terminateBridgeChild } from "./shared.js";',
    [root + "shared.js"]:
      'const key=Symbol.for("omniroute.mitm.process-lifecycle.v1"); child.exitCode; child.signalCode; child.once("exit", onExit); child.kill("SIGTERM"); child.kill("SIGKILL");',
  };
}

test("compiled ESM Bridge entries must reach the same lifecycle implementation", () => {
  assert.equal(inspectCompiledBridgeLifecycle(compiledModules()), true);
});

test("a missing reachable chunk remains a package failure", () => {
  const modules = compiledModules();
  delete modules["package/dist/src/mitm/shared.js"];
  assert.throws(() => inspectCompiledBridgeLifecycle(modules), /Missing or unsafe/);
});

test("an unreferenced lifecycle decoy cannot satisfy the compiled contract", () => {
  const modules = compiledModules();
  modules["package/dist/src/mitm/manager-chunk.js"] =
    "getBridgeProcessState(); waitForBridgeReady(child); isOwnedBridgePid(pid); terminateBridgeChild(child);";
  assert.equal(inspectCompiledBridgeLifecycle(modules), false);
});

test("compiled lifecycle cannot escape its reviewed module directory", () => {
  const modules = compiledModules();
  modules["package/dist/src/mitm/manager.js"] = 'import "../outside.js";';
  assert.throws(() => inspectCompiledBridgeLifecycle(modules), /Missing or unsafe/);
});

test("compiled Bridge stop and ownership requirements remain fail closed", () => {
  for (const missing of [
    'child.kill("SIGKILL")',
    'child.once("exit", onExit)',
    "child.exitCode",
    "child.signalCode",
  ]) {
    const modules = compiledModules();
    modules["package/dist/src/mitm/shared.js"] = modules["package/dist/src/mitm/shared.js"].replace(
      missing,
      ""
    );
    assert.equal(inspectCompiledBridgeLifecycle(modules), false);
  }
  for (const name of [
    "getBridgeProcessState",
    "waitForBridgeReady",
    "isOwnedBridgePid",
    "terminateBridgeChild",
  ]) {
    const modules = compiledModules();
    modules["package/dist/src/mitm/manager-chunk.js"] = modules[
      "package/dist/src/mitm/manager-chunk.js"
    ].replace(new RegExp(name + "\\([^)]*\\);"), "");
    assert.equal(inspectCompiledBridgeLifecycle(modules), false);
  }
});
test("count route without headers or cancellation still fails the contract", () => {
  assert.equal(
    inspectCompiledCountRoute(
      route.replace("clientHeaders:Object.fromEntries(a.headers.entries()),", "")
    ),
    false
  );
  assert.equal(inspectCompiledCountRoute(route.replace("signal:a.signal,", "")), false);
  assert.equal(inspectCompiledCountRoute('R.c("server/chunks/route-123.js")'), false);
});
