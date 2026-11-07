import assert from "node:assert/strict";
import { after, test } from "node:test";
import { REGISTRY } from "../../open-sse/config/providerRegistry.ts";
import { getDbInstance, resetDbInstance } from "../../src/lib/db/core.ts";
import {
  getMappingsForAgent,
  setMappings,
  syncAgentBridgeMappingsToMitmAlias,
} from "../../src/lib/db/agentBridgeMappings.ts";
import { getMitmAlias } from "../../src/lib/db/models/mitmAlias.ts";

after(() => resetDbInstance());

test("reading native default mappings follows the registry without persisting rows", () => {
  const before = getDbInstance().prepare("SELECT COUNT(*) AS n FROM agent_bridge_mappings").get();
  const rows = getMappingsForAgent("claude-code");
  for (const model of REGISTRY.claude.models) {
    assert.equal(rows.find((row) => row.source_model === model.id)?.target_model, `cc/${model.id}`);
  }
  assert.deepEqual(
    getDbInstance().prepare("SELECT COUNT(*) AS n FROM agent_bridge_mappings").get(),
    before
  );
  assert.deepEqual(getMappingsForAgent("kiro"), []);
});

test("explicit native mappings survive registry defaults and normal alias synchronization", async () => {
  setMappings("claude-code", [{ source: "claude-sonnet-5-5", target: "cx/gpt-6.1-sol" }]);
  const rows = getMappingsForAgent("claude-code");
  assert.equal(
    rows.find((row) => row.source_model === "claude-sonnet-5-5")?.target_model,
    "cx/gpt-6.1-sol"
  );
  syncAgentBridgeMappingsToMitmAlias("claude-code");
  const aliases = await getMitmAlias("claude-code");
  assert.equal(aliases["claude-sonnet-5-5"], "cx/gpt-6.1-sol");
  assert.equal(aliases["claude-haiku-5-5"], "cc/claude-haiku-5-5");
});

test("a configured wildcard prevents implicit exact defaults from overriding the operator route", async () => {
  setMappings("claude-code", [{ source: "*", target: "cx/gpt-6.1-sol" }]);
  assert.equal(getMappingsForAgent("claude-code").length, 1);
  syncAgentBridgeMappingsToMitmAlias("claude-code");
  assert.deepEqual(await getMitmAlias("claude-code"), { "*": "cx/gpt-6.1-sol" });
});
