import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "haiku-native-effort-"));
process.env.DISABLE_SQLITE_AUTO_BACKUP = "true";

const { BaseExecutor } = await import("../../open-sse/executors/base.ts");
const { supportsClaudeMaxEffort } = await import("../../open-sse/config/providerModels.ts");
const { isClaudeHaiku55 } = await import("../../open-sse/config/claudeHaikuCapabilities.ts");
const { getThinkingBudgetConfig, setThinkingBudgetConfig } =
  await import("../../open-sse/services/thinkingBudget.ts");
const core = await import("../../src/lib/db/core.ts");
const initialThinkingConfig = { ...getThinkingBudgetConfig() };

test.afterEach(() => setThinkingBudgetConfig(initialThinkingConfig));
test.after(() => core.resetDbInstance());

class Executor extends BaseExecutor {
  constructor() {
    super("claude", { format: "claude", baseUrls: ["https://api.anthropic.com/v1/messages"] });
  }
  needsRefresh() {
    return false;
  }
  transformRequest(_model: string, body: Record<string, unknown>) {
    return structuredClone(body);
  }
}

async function captureDispatch(body: Record<string, unknown>) {
  const originalFetch = globalThis.fetch;
  const sent: Record<string, unknown>[] = [];
  globalThis.fetch = async (_url, init: RequestInit = {}) => {
    sent.push(JSON.parse(String(init.body)));
    return new Response(JSON.stringify({ id: "msg_fixture", content: [] }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
  try {
    const result = await new Executor().execute({
      model: String(body.model),
      body,
      stream: false,
      credentials: { accessToken: "haiku-effort-fixture" },
      clientHeaders: { "x-app": "cli" },
    });
    assert.ok(!(result instanceof Response));
    await result.response.text();
    assert.equal(sent.length, 1, "one client request must produce one dispatch");
    return sent[0];
  } finally {
    globalThis.fetch = originalFetch;
  }
}

test("Haiku 5.5 effort recognition includes routed and dotted IDs without matching older versions", () => {
  for (const model of ["claude-haiku-5-5", "cc/claude-haiku-5.5", "ANTHROPIC.CLAUDE-HAIKU-5-5"])
    assert.equal(isClaudeHaiku55(model), true, model);
  for (const model of [
    "claude-haiku-4-5-20251001",
    "claude-haiku-5-50",
    "claude-haiku-6",
    "claude-sonnet-5-5",
  ])
    assert.equal(isClaudeHaiku55(model), false, model);
  assert.equal(isClaudeHaiku55(null), false);
  assert.equal(supportsClaudeMaxEffort("claude-haiku-5-5"), true);
  assert.equal(supportsClaudeMaxEffort("cc/claude-haiku-5.5"), true);
  assert.equal(supportsClaudeMaxEffort("claude-haiku-4-5-20251001"), false);
});

for (const effort of ["low", "medium", "high", "xhigh", "max"]) {
  test(`native Haiku 5.5 preserves explicit ${effort} effort`, async () => {
    setThinkingBudgetConfig({ mode: "passthrough" });
    const outputConfig = { effort };
    const thinking = { type: "adaptive" };
    const sent = await captureDispatch({
      model: "claude-haiku-5-5",
      messages: [{ role: "user", content: "fixture" }],
      output_config: outputConfig,
      thinking,
    });
    assert.deepEqual(sent.output_config, outputConfig);
    assert.deepEqual(sent.thinking, thinking);
  });
}

test("Haiku 5.5 preserves structured output and an explicit thinking disable", async () => {
  setThinkingBudgetConfig({ mode: "passthrough" });
  const outputConfig = {
    effort: "low",
    format: { type: "json_schema", schema: { type: "object", properties: {} } },
  };
  const sent = await captureDispatch({
    model: "claude-haiku-5-5",
    messages: [{ role: "user", content: "fixture" }],
    output_config: outputConfig,
    thinking: { type: "disabled" },
  });
  assert.deepEqual(sent.output_config, outputConfig);
  assert.deepEqual(sent.thinking, { type: "disabled" });
});

test("an unset native Haiku 5.5 effort remains unset rather than being forced to high", async () => {
  setThinkingBudgetConfig({ mode: "passthrough" });
  const sent = await captureDispatch({
    model: "claude-haiku-5-5",
    messages: [{ role: "user", content: "fixture" }],
  });
  assert.equal(sent.output_config, undefined);
  assert.equal(sent.thinking, undefined);
});

test("legacy Haiku keeps its manual thinking and legacy effort exclusion", async () => {
  setThinkingBudgetConfig({ mode: "custom", customBudget: 8192 });
  const thinking = { type: "enabled", budget_tokens: 8192 };
  const sent = await captureDispatch({
    model: "claude-haiku-4-5-20251001",
    messages: [{ role: "user", content: "fixture" }],
    output_config: { effort: "medium" },
    thinking,
  });
  assert.equal(sent.output_config, undefined);
  assert.deepEqual(sent.thinking, thinking);
});

test("an explicit operator auto budget strips request overrides on Haiku 5.5", async () => {
  setThinkingBudgetConfig({ mode: "auto" });
  const sent = await captureDispatch({
    model: "claude-haiku-5-5",
    messages: [{ role: "user", content: "fixture" }],
    output_config: { effort: "high" },
    thinking: { type: "adaptive" },
  });
  assert.equal(sent.output_config, undefined);
  assert.equal(sent.thinking, undefined);
});
