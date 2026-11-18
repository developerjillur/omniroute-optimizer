import assert from "node:assert/strict";
import test from "node:test";
import { isDisabledDiscoveryModelId } from "../new/open-sse/config/discoveryAvailability.ts";
import {
  projectDashboardSyncedModel,
  mergeDashboardModelRows,
  buildAntigravityDiscoveryBody,
} from "../new/src/lib/providerModels/dashboardSyncedCatalog.ts";
import {
  versionFromAntigravityPlist,
  readInstalledAntigravityIdeVersion,
} from "../new/open-sse/services/installedAntigravityVersion.ts";
import { gemini4ThinkingConfig } from "../new/open-sse/services/gemini4Thinking.ts";
import {
  GPT_6_2_SOL_PRICING,
  GPT_6_2_ASTRA_PRICING,
  GPT_6_2_SOL_CODEX_PRICING,
  GPT_6_2_ASTRA_CODEX_PRICING,
  getGpt62ServiceTierMultiplier,
} from "../new/src/shared/constants/pricing/frontier-20261118.ts";

test("disabled discovery placeholders never become callable dashboard rows", () => {
  for (const id of [
    "gemini-4-hydrogen-disabled",
    "gemini-4-carbon-disabled",
    "gemini-4-argon-disabled",
    " GEMINI-4-ARGON-DISABLED ",
  ]) {
    assert.equal(isDisabledDiscoveryModelId(id), true);
    assert.equal(projectDashboardSyncedModel("agy", { id }), null);
  }
  assert.equal(isDisabledDiscoveryModelId("gemini-4-hydrogen-sonar"), false);
});

test("new live chat models keep provider-specific limits and all supported efforts", () => {
  const efforts = ["low", "medium", "high", "xhigh", "max", "ultra"];
  const model = {
    id: "gpt-6.2-sol",
    name: "GPT 6.2 Sol",
    apiFormat: "responses",
    supportedEndpoints: ["responses"],
    supportedThinkingEfforts: efforts,
    inputTokenLimit: 872000,
    supportsVision: true,
    accessToken: "must-never-leak",
  };
  const row = projectDashboardSyncedModel("codex", model, "cx");
  assert.equal(row.fullModel, "cx/gpt-6.2-sol");
  assert.equal(row.inputTokenLimit, 872000);
  assert.deepEqual(row.supportedThinkingEfforts, efforts);
  assert.equal(row.accessToken, undefined);
  assert.deepEqual(model.supportedThinkingEfforts, efforts);
});

test("internal, hidden, malformed and non-chat discoveries stay out of chat pickers", () => {
  for (const value of [
    null,
    [],
    {},
    { id: "x", isInternal: true },
    { id: "x", visibility: "hide" },
    { id: "x", visibility: "hidden" },
    { id: "x", supportedEndpoints: ["images"] },
  ]) {
    assert.equal(projectDashboardSyncedModel("p", value), null);
  }
});

test("catalog refresh deduplicates rows without losing operator aliases", () => {
  const old = [{ fullModel: "cx/gpt-6.2-sol", alias: "Selected Sol", available: false }];
  const fresh = projectDashboardSyncedModel("codex", { id: "gpt-6.2-sol" }, "cx");
  const merged = mergeDashboardModelRows(old, [fresh, fresh]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].alias, "Selected Sol");
  assert.equal(merged[0].available, true);
  assert.equal(old[0].available, false);
});

test("only native Cloud Code model discovery receives its assigned project", () => {
  assert.deepEqual(
    buildAntigravityDiscoveryBody(
      "https://cloudcode-pa.googleapis.com/v1internal:fetchAvailableModels",
      "assigned-project"
    ),
    { project: "assigned-project" }
  );
  assert.deepEqual(
    buildAntigravityDiscoveryBody(
      "https://cloudcode-pa.googleapis.com/v1internal:listModels",
      "assigned-project"
    ),
    {}
  );
  assert.deepEqual(
    buildAntigravityDiscoveryBody(
      "https://cloudcode-pa.googleapis.com/v1internal:fetchAvailableModels",
      " "
    ),
    {}
  );
  assert.deepEqual(buildAntigravityDiscoveryBody("invalid-url", "assigned-project"), {});
});

test("installed IDE version is bounded, strict, read-only and platform-scoped", () => {
  const plist = "<key>CFBundleShortVersionString</key><string>2.28.2</string>";
  assert.equal(versionFromAntigravityPlist(plist), "2.28.2");
  assert.equal(versionFromAntigravityPlist(plist + "x".repeat(65536)), null);
  assert.equal(versionFromAntigravityPlist(plist.replace("2.28.2", "2.28.2;execute")), null);
  let reads = 0;
  const readText = (filename) => {
    reads++;
    assert.ok(filename.endsWith("Antigravity.app/Contents/Info.plist"));
    return plist;
  };
  assert.equal(readInstalledAntigravityIdeVersion({ platform: "linux", readText }), null);
  assert.equal(reads, 0);
  assert.equal(readInstalledAntigravityIdeVersion({ platform: "darwin", readText }), "2.28.2");
  assert.equal(reads, 1);
  assert.equal(
    readInstalledAntigravityIdeVersion({
      platform: "darwin",
      readText: () => {
        throw Error("absent");
      },
    }),
    null
  );
});

test("Gemini 4 emits no numeric thinking budget, including zero, and retains native defaults", () => {
  for (const model of ["gemini-4-hydrogen", "gemini-4-carbon", "agy/gemini-4-argon"]) {
    assert.deepEqual(gemini4ThinkingConfig(model, 0, {}), {});
    assert.deepEqual(gemini4ThinkingConfig(model, 8192, {}), {});
    assert.deepEqual(
      gemini4ThinkingConfig(model, 0, { thinking: { type: "enabled", budget_tokens: 0 } }),
      {}
    );
  }
  assert.equal(gemini4ThinkingConfig("gemini-3.8-flash", 0, {}), null);
});

test("Hydrogen keeps explicit XHIGH/max while lower supported efforts remain unchanged", () => {
  for (const level of ["low", "medium", "high", "xhigh"]) {
    assert.equal(
      gemini4ThinkingConfig("gemini-4-hydrogen", 24576, { reasoning_effort: level }).thinkingLevel,
      level
    );
  }
  assert.equal(
    gemini4ThinkingConfig("gemini-4-hydrogen", 24576, { output_config: { effort: "max" } })
      .thinkingLevel,
    "xhigh"
  );
  assert.equal(
    gemini4ThinkingConfig("gemini-4-carbon", 24576, { output_config: { effort: "max" } })
      .thinkingLevel,
    "high"
  );
  assert.deepEqual(
    gemini4ThinkingConfig("gemini-4-hydrogen", 1024, {
      reasoning_budget: 1024,
      includeThoughts: false,
    }),
    { thinkingLevel: "low", includeThoughts: false }
  );
});

test("GPT 6.2 API and Codex cost estimates preserve separate cache-write rules", () => {
  assert.equal(GPT_6_2_SOL_PRICING.input, 2);
  assert.equal(GPT_6_2_SOL_PRICING.output, 10);
  assert.equal(GPT_6_2_SOL_PRICING.cached, 0.1);
  assert.equal(GPT_6_2_SOL_PRICING.cache_creation, 2.5);
  assert.equal(GPT_6_2_ASTRA_PRICING.input, 8);
  assert.equal(GPT_6_2_ASTRA_PRICING.output, 40);
  assert.equal(GPT_6_2_ASTRA_PRICING.cached, 0.4);
  assert.equal(GPT_6_2_ASTRA_PRICING.cache_creation, 10);
  assert.equal(GPT_6_2_SOL_CODEX_PRICING.cache_creation, 0);
  assert.equal(GPT_6_2_ASTRA_CODEX_PRICING.cache_creation, 0);
  assert.equal(GPT_6_2_ASTRA_PRICING.long_context_threshold, 272000);
});

test("Codex credit cost estimates apply the dated 6.2 speed multiplier, not a quota estimate", () => {
  for (const model of ["gpt-6.2-sol", "gpt-6.2-astra"]) {
    assert.equal(getGpt62ServiceTierMultiplier(model, "standard"), 1);
    assert.equal(getGpt62ServiceTierMultiplier(model, "fast"), 2);
    assert.equal(
      getGpt62ServiceTierMultiplier(model, "ultrafast", Date.parse("2027-03-01T07:59:59Z")),
      3
    );
    assert.equal(
      getGpt62ServiceTierMultiplier(model, "ultrafast", Date.parse("2027-03-01T08:00:00Z")),
      6
    );
  }
  assert.equal(getGpt62ServiceTierMultiplier("gpt-6.1-sol", "fast"), null);
});
