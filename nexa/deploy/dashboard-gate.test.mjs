import test from "node:test";
import assert from "node:assert/strict";
import { dashboardChunks, inspectDashboardPage } from "./dashboard-gate.mjs";

test("dashboard manifest selects only this page's packaged client chunks", () => {
  const chunk = "static/chunks/app/(dashboard)/dashboard/quota/page-abc.js";
  const source = `globalThis.__RSC_MANIFEST={};globalThis.__RSC_MANIFEST["/dashboard/quota/page"]=${JSON.stringify(
    {
      clientModules: { page: { chunks: ["123", chunk, chunk, "static/chunks/vendor.js"] } },
    }
  )};`;
  assert.deepEqual(dashboardChunks(source, "quota"), [chunk]);
});
test("missing dashboard client assets fail the production package gate", () => {
  assert.throws(() => dashboardChunks("globalThis.__RSC_MANIFEST={};", "quota"));
  assert.throws(() =>
    dashboardChunks('globalThis.__RSC_MANIFEST["/quota"]={"clientModules":{}};', "quota")
  );
});
test("null-page backend stubs cannot pass dashboard control validation", () => {
  assert.throws(() => inspectDashboardPage("function Page(){return null}", "quota"));
  assert.throws(() => inspectDashboardPage("function Page(){return null}", "tools/agent-bridge"));
});
test("compiled quota and Agent Bridge controls pass", () => {
  assert.doesNotThrow(() =>
    inspectDashboardPage('fetch("/api/settings").autoRefreshProviderQuotaInterval', "quota")
  );
  assert.doesNotThrow(() =>
    inspectDashboardPage('fetch("/api/tools/agent-bridge/state")', "tools/agent-bridge")
  );
});
