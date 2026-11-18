import test from "node:test";
import assert from "node:assert/strict";
import { createProviderConnection, updateProviderConnection } from "../../src/lib/db/providers.ts";
import {
  replaceSyncedAvailableModelsForConnection,
  setModelAlias,
} from "../../src/lib/db/models.ts";
import { mergeModelCompatOverride } from "../../src/lib/db/models/compat.ts";
import { handleGetModels } from "../../src/app/api/models/route.ts";

test("dashboard lists newly synced releases and preserves exclusions, hidden rows and aliases", async () => {
  assert.ok(
    process.env.DATA_DIR?.includes("model-release"),
    "must use the isolated model-release fixture"
  );
  const connection = await createProviderConnection({
    provider: "codex",
    name: "Model release fixture",
    authType: "oauth",
    isActive: true,
    providerSpecificData: { excludedModels: ["gpt-6.2-blocked-fixture"] },
  });
  assert.ok(connection.id);
  const rows = [
    "gpt-6.2-sol",
    "gpt-6.2-astra",
    "gpt-6.2-future-fixture",
    "gpt-6.2-hidden-fixture",
    "gpt-6.2-blocked-fixture",
    "gpt-6.2-image-fixture",
  ].map((id) => ({
    id,
    name: id,
    apiFormat: "responses" as const,
    supportedEndpoints: id.includes("image") ? ["images"] : ["responses"],
    supportsVision: true,
    inputTokenLimit: 872000,
  }));
  await replaceSyncedAvailableModelsForConnection("codex", String(connection.id), rows);
  await setModelAlias("cx/gpt-6.2-sol", "Selected Sol");
  mergeModelCompatOverride("codex", "gpt-6.2-hidden-fixture", { isHidden: true });
  mergeModelCompatOverride("codex", "gpt-6.2-astra", { isHidden: true });
  const response = await handleGetModels(new Request("http://fixture.local/api/models"));
  assert.equal(response.status, 200);
  const { models } = (await response.json()) as { models: Array<Record<string, unknown>> };
  const ids = new Set(models.map((row) => row.fullModel));
  assert.ok(ids.has("cx/gpt-6.2-sol"));
  assert.ok(ids.has("cx/gpt-6.2-future-fixture"));
  for (const id of [
    "gpt-6.2-astra",
    "gpt-6.2-hidden-fixture",
    "gpt-6.2-blocked-fixture",
    "gpt-6.2-image-fixture",
  ])
    assert.equal(ids.has(`cx/${id}`), false, id);
  assert.equal(models.filter((row) => row.fullModel === "cx/gpt-6.2-sol").length, 1);
  assert.equal(models.find((row) => row.fullModel === "cx/gpt-6.2-sol")?.alias, "Selected Sol");
  assert.equal(
    models.find((row) => row.fullModel === "cx/gpt-6.2-future-fixture")?.inputTokenLimit,
    872000
  );
  await updateProviderConnection(String(connection.id), { isActive: false });
  const disabled = await handleGetModels(new Request("http://fixture.local/api/models"));
  assert.equal(disabled.status, 200);
  assert.equal(
    ((await disabled.json()) as { models: Array<Record<string, unknown>> }).models.some(
      (row) => row.fullModel === "cx/gpt-6.2-future-fixture"
    ),
    false
  );
});
