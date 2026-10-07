import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { compressionSettingsUpdateSchema } from "../../src/shared/validation/compressionConfigSchemas.ts";
import { ENGINE_IDS, type CompressionConfig } from "../../open-sse/services/compression/types.ts";
import { selectCompressionStrategy } from "../../open-sse/services/compression/strategySelector.ts";
import { updateCompressionSettings, getCompressionSettings } from "../../src/lib/db/compression.ts";
import { resolveCompressionSettings } from "../../open-sse/handlers/chatCore/compressionSettings.ts";
import { DEFAULT_CONTEXT_BUDGET } from "../../open-sse/services/compression/adaptiveCompression/types.ts";

const disabled = JSON.parse(
  fs.readFileSync(new URL("../../nexa/config/compression-disabled.json", import.meta.url), "utf8")
) as CompressionConfig;
test("the complete compression-off policy is accepted by the management API schema", () => {
  assert.equal(compressionSettingsUpdateSchema.safeParse(disabled).success, true);
  assert.deepEqual(Object.keys(disabled.engines).sort(), [...ENGINE_IDS].sort());
});
test("request headers, named profiles, auto-trigger and combo overrides cannot bypass master off", () => {
  const config: CompressionConfig = {
    ...disabled,
    autoTriggerTokens: 1,
    autoTriggerMode: "ultra",
    activeComboId: "expensive",
    comboOverrides: { route: "ultra" },
    engines: Object.fromEntries(ENGINE_IDS.map((id) => [id, { enabled: true }])),
    contextBudget: { ...DEFAULT_CONTEXT_BUDGET, mode: "replace-autotrigger" },
  };
  for (const header of [null, "rtk", "ultra", "stacked", "expensive"])
    assert.equal(
      selectCompressionStrategy(
        config,
        "route",
        900000,
        { messages: [{ role: "user", content: "preserve exactly" }] },
        {},
        { expensive: [{ engine: "ultra" }] },
        header
      ),
      "off"
    );
});
test("global off also disables delegated context editing when a stale sub-toggle remains enabled", async () => {
  await updateCompressionSettings({ enabled: false, contextEditing: { enabled: true } });
  const result = await resolveCompressionSettings();
  assert.equal(result.enabled, false);
  assert.equal(result.contextEditingEnabled, false);
});
test("all engine and output-style flags stay off after persistence and normalization", async () => {
  await updateCompressionSettings(disabled);
  const current = await getCompressionSettings();
  assert.equal(current.enabled, false);
  assert.equal(current.defaultMode, "off");
  assert.ok(ENGINE_IDS.every((id) => current.engines[id].enabled === false));
  assert.equal(current.cavemanConfig?.enabled, false);
  assert.equal(current.contextEditing?.enabled, false);
  assert.deepEqual(current.outputStyles, []);
  assert.deepEqual(current.stackedPipeline, []);
});
test("a fallback target cannot rewrite context while the global compression switch is off", async () => {
  await updateCompressionSettings({ enabled: false });
  const { handleComboChat } = await import("../../open-sse/services/combo.ts");
  const messages = [
    { role: "user", content: "keep the complete tool result unchanged" },
    { role: "tool", content: "original tool output ".repeat(500) },
  ];
  const received: unknown[] = [];
  const noop = () => {};
  const response = await handleComboChat({
    body: { messages },
    combo: {
      name: "compression-master-off-fallback",
      strategy: "priority",
      models: ["fixture-a/model-a", "fixture-b/model-b"],
      config: {
        maxRetries: 0,
        retryDelayMs: 0,
        fallbackDelayMs: 0,
        zeroLatencyOptimizationsEnabled: true,
        fallbackCompressionMode: "lite",
        fallbackCompressionThreshold: 1,
      },
    },
    handleSingleModel: async (payload: Record<string, unknown>) => {
      received.push(structuredClone(payload.messages));
      return new Response(
        JSON.stringify(
          received.length === 1
            ? { error: { message: "fixture unavailable" } }
            : { choices: [{ message: { content: "ok" } }] }
        ),
        {
          status: received.length === 1 ? 500 : 200,
          headers: { "content-type": "application/json" },
        }
      );
    },
    isModelAvailable: async () => true,
    log: { info: noop, warn: noop, error: noop, debug: noop },
    settings: null,
    allCombos: null,
  });
  assert.equal(response.status, 200);
  assert.equal(received.length, 2);
  assert.deepEqual(received[1], messages);
});
