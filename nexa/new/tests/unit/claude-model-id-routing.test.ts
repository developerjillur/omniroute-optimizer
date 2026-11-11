import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import { REGISTRY, getClaudeCodeDefaultModels } from "../../open-sse/config/providerRegistry.ts";
import { CLI_TOOLS } from "../../src/shared/constants/cliTools.ts";
import * as settings from "../../src/shared/services/claudeCliConfig.ts";

const require = createRequire(import.meta.url);
const routing = require("../../src/mitm/_internal/standaloneRouting.cjs");
const aliasConfigShim = require("../../src/mitm/_internal/aliasConfig.cjs");
const helperFile = new URL("../../src/mitm/_internal/claudeModels.cjs", import.meta.url);
const claudeModelsShim = fs.existsSync(helperFile) ? require(helperFile.pathname) : undefined;

function resolve(model: string, mappings: Record<string, unknown> = {}, agent = "claude-code") {
  return routing.resolveMappedOverride(model, agent, {
    fs: { existsSync: () => false },
    dbFile: "/unused",
    getSqliteDb: () => ({ prepare: () => ({ get: () => ({ value: JSON.stringify(mappings) }) }) }),
    aliasConfigShim,
  });
}

test("Claude CLI defaults expose Fable without making it the default model", () => {
  assert.deepEqual(getClaudeCodeDefaultModels(), {
    fable: "claude-fable-5-2",
    opus: "claude-opus-5-5",
    sonnet: "claude-sonnet-5-5",
    haiku: "claude-haiku-5-5",
  });
  const defaults = CLI_TOOLS.claude.defaultModels!;
  assert.equal(
    defaults.some((entry) => entry.envKey === "ANTHROPIC_DEFAULT_FABLE_MODEL"),
    true
  );
  assert.equal(defaults[0].defaultValue, "claude-sonnet-5-5");
  for (const entry of defaults) {
    assert.match(entry.defaultValue!, /^claude-(?:fable|opus|sonnet|haiku)-/);
    assert.equal(entry.defaultValue!.includes("/"), false);
  }
});

test("family versions compare numerically, ignore insertion order and exclude previews", () => {
  const original = REGISTRY.claude.models;
  try {
    REGISTRY.claude.models = [
      "claude-opus-4-8",
      "claude-opus-5-5",
      "claude-opus-5",
      "claude-sonnet-5-5",
      "claude-sonnet-5-10",
      "claude-sonnet-99-preview",
      "claude-haiku-4-5-20251001",
      "claude-haiku-5-5",
    ].map((id) => ({ id, name: id }));
    assert.equal(getClaudeCodeDefaultModels().opus, "claude-opus-5-5");
    assert.equal(getClaudeCodeDefaultModels().sonnet, "claude-sonnet-5-10");
    assert.equal(getClaudeCodeDefaultModels().haiku, "claude-haiku-5-5");
    REGISTRY.claude.models.reverse();
    assert.equal(getClaudeCodeDefaultModels().sonnet, "claude-sonnet-5-10");
    REGISTRY.claude.models = ["claude-sonnet-4-5-20250929", "claude-sonnet-4-5-20251001"].map(
      (id) => ({ id, name: id })
    );
    assert.equal(getClaudeCodeDefaultModels().sonnet, "claude-sonnet-4-5-20251001");
  } finally {
    REGISTRY.claude.models = original;
  }
});

for (const prefix of ["", "cc/", "claude/"]) {
  test(`Claude mapping normalizes the native source prefix ${prefix || "plain"}`, () => {
    assert.deepEqual(
      resolve(prefix + "claude-sonnet-5-5", {
        "claude-sonnet-5-5": { model: "cx/gpt-6.1-sol", reasoningEffort: "xhigh" },
      }),
      { model: "cx/gpt-6.1-sol", reasoningEffort: "xhigh" }
    );
  });
}

test("an explicit prefixed mapping and a wildcard retain priority over native defaults", () => {
  assert.deepEqual(
    resolve("cc/claude-sonnet-5-5", {
      "cc/claude-sonnet-5-5": "custom/combo",
      "claude-sonnet-5-5": "cc/claude-sonnet-5-5",
    }),
    { model: "custom/combo" }
  );
  assert.deepEqual(resolve("claude-haiku-5-5", { "*": "cx/gpt-6.1-sol" }), {
    model: "cx/gpt-6.1-sol",
  });
  assert.equal(resolve("unregistered-model"), null);
  assert.equal(resolve("cx/claude-sonnet-5-5"), null);
  assert.equal(resolve("cc/claude-sonnet-5-5", { "claude-sonnet-5-5": "cc/target" }, "kiro"), null);
});

test("new native registry entries work in the standalone Bridge without stored mapping writes", () => {
  assert.deepEqual(resolve("claude-haiku-5-5"), { model: "cc/claude-haiku-5-5" });
  const models = REGISTRY.claude.models;
  models.push({ id: "claude-sonnet-12-10", name: "Fixture future Sonnet" });
  try {
    assert.deepEqual(resolve("cc/claude-sonnet-12-10"), { model: "cc/claude-sonnet-12-10" });
    assert.equal(getClaudeCodeDefaultModels().sonnet, "claude-sonnet-12-10");
  } finally {
    models.pop();
  }
});

test("settings normalization preserves user data, explicit non-Claude routes and Fable", () => {
  assert.equal(typeof settings.planClaudeSettings, "function");
  const current = {
    permissions: { allow: ["Read"] },
    hooks: { UserPromptSubmit: [] },
    theme: "dark",
    env: {
      ANTHROPIC_DEFAULT_FABLE_MODEL: "owner-fable-choice",
      CUSTOM_ENV: "retain",
      ANTHROPIC_AUTH_TOKEN: "old-fixture-token",
      ANTHROPIC_DEFAULT_OPUS_MODEL: "claude-opus-4-8",
    },
  };
  const before = structuredClone(current);
  const requested = {
    ANTHROPIC_MODEL: "cc/claude-sonnet-5-5",
    ANTHROPIC_DEFAULT_HAIKU_MODEL: "claude/claude-haiku-5-5",
    ANTHROPIC_DEFAULT_FABLE_MODEL: "unrequested-default",
    ANTHROPIC_AUTH_TOKEN: "new-fixture-token",
    ANTHROPIC_BASE_URL: "https://omni.local/",
  };
  const plan = settings.planClaudeSettings(current, requested);
  assert.deepEqual(current, before);
  assert.equal(plan.settings.env.ANTHROPIC_MODEL, "claude-sonnet-5-5");
  assert.equal(plan.settings.env.ANTHROPIC_DEFAULT_HAIKU_MODEL, "claude-haiku-5-5");
  assert.equal(plan.settings.env.ANTHROPIC_DEFAULT_FABLE_MODEL, "owner-fable-choice");
  assert.equal(plan.settings.env.ANTHROPIC_DEFAULT_OPUS_MODEL, "claude-opus-4-8");
  assert.equal(plan.settings.env.ANTHROPIC_BASE_URL, "https://omni.local");
  assert.equal(plan.settings.env.CUSTOM_ENV, "retain");
  assert.deepEqual(plan.settings.hooks, current.hooks);
  assert.deepEqual(plan.settings.permissions, current.permissions);
  assert.equal(plan.settings.theme, "dark");
  assert.equal(JSON.stringify(plan.changes).includes("fixture-token"), false);
  assert.equal(
    plan.changes.some((change) => change.key === "ANTHROPIC_DEFAULT_FABLE_MODEL"),
    false
  );
  assert.equal(
    settings.planClaudeSettings({}, { ANTHROPIC_MODEL: "cx/gpt-6.1-sol" }).settings.env
      .ANTHROPIC_MODEL,
    "cx/gpt-6.1-sol"
  );
});

test("the production missing-mapping branch returns a named Anthropic error before upstream", async () => {
  const source = fs.readFileSync(new URL("../../src/mitm/server.cjs", import.meta.url), "utf8");
  const start = source.indexOf("    if (!mappedOverride) {");
  const end = source.indexOf("    stats.interceptedRequests++", start);
  assert.ok(start > 0 && end > start);
  let status = 0,
    body = "",
    upstream = 0;
  const context = {
    mappedOverride: null,
    agentId: "claude-code",
    model: "cc/claude-unmapped-99",
    claudeModelsShim,
    req: {},
    res: {
      writeHead: (value: number) => {
        status = value;
      },
      end: (value: string) => {
        body = value;
      },
    },
    captureToInspector: () => {},
    bodyBuffer: Buffer.from("{}"),
    startedAt: Date.now(),
    vlog: () => {},
    rawBodyBuffer: Buffer.from("{}"),
    passthrough: () => {
      upstream++;
    },
  };
  await vm.runInNewContext("(async()=>{" + source.slice(start, end) + "})()", context);
  assert.equal(upstream, 0);
  assert.equal(status, 400);
  const error = JSON.parse(body);
  assert.equal(error.type, "error");
  assert.equal(error.error.type, "invalid_request_error");
  assert.match(error.error.message, /cc\/claude-unmapped-99.*not mapped/);
});

test("an explicit Fable edit is normalized without changing the default model", () => {
  const original = {
    env: { ANTHROPIC_DEFAULT_FABLE_MODEL: "owner-choice", ANTHROPIC_MODEL: "claude-sonnet-5-5" },
  };
  const plan = settings.planClaudeSettings(
    original,
    { ANTHROPIC_DEFAULT_FABLE_MODEL: "cc/claude-fable-5-2" },
    { updateFable: true }
  );
  assert.equal(plan.settings.env.ANTHROPIC_DEFAULT_FABLE_MODEL, "claude-fable-5-2");
  assert.equal(plan.settings.env.ANTHROPIC_MODEL, "claude-sonnet-5-5");
  assert.equal(original.env.ANTHROPIC_DEFAULT_FABLE_MODEL, "owner-choice");
});
