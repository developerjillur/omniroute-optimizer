import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const server = fs.readFileSync(new URL("../../src/mitm/server.cjs", import.meta.url), "utf8");
const declaration = server.match(
  /    const body = (?:aliasConfigShim|nativeToolModelsShim)\.[\s\S]*?;\n\n    \/\/ Gap B/
);
assert.ok(declaration, "The production forward-body boundary must remain inspectable");
const helper = new URL("../../src/mitm/_internal/nativeToolModels.cjs", import.meta.url);
const nativeToolModelsShim = fs.existsSync(helper) ? require(helper.pathname) : undefined;
const aliasConfigShim = require("../../src/mitm/_internal/aliasConfig.cjs");

function forwarded(input, agentId = "claude-code", target = "cc/claude-opus-5-5") {
  const bodyBuffer = Buffer.from(JSON.stringify(input));
  const before = Buffer.from(bodyBuffer);
  const body = vm.runInNewContext(
    "(()=>{" + declaration[0].split("\n\n    // Gap B")[0] + ";return body;})()",
    {
      bodyBuffer,
      override: { model: target },
      agentId,
      aliasConfigShim,
      nativeToolModelsShim,
    }
  );
  assert.ok(bodyBuffer.equals(before), "The original native request buffer changed");
  return JSON.parse(JSON.stringify(body));
}

for (const prefix of ["cc/", "claude/"])
  for (const thread of [
    null,
    { type: "create" },
    { type: "continue", previous_message_id: "msg_parent" },
  ]) {
    test(`serializes a bare advisor model for ${prefix} and ${thread?.type ?? "full history"}`, () => {
      const original = {
        model: "claude-opus-5-5",
        stream: true,
        ...(thread ? { thread } : {}),
        output_config: { effort: "xhigh" },
        diagnostics: { previous_message_id: "msg_diagnostic" },
        messages: [
          {
            role: "assistant",
            content: [
              { type: "thinking", thinking: "fixture", signature: "opaque-native-signature" },
              {
                type: "tool_use",
                id: "toolu_existing",
                name: "Read",
                input: { file_path: "fixture.txt" },
              },
            ],
          },
          {
            role: "user",
            content: [
              { type: "tool_result", tool_use_id: "toolu_existing", content: "fixture result" },
            ],
          },
        ],
        tools: [
          {
            type: "advisor_20260301",
            name: "advisor",
            model: prefix + "claude-opus-5-5",
            cache_control: { type: "ephemeral" },
          },
          {
            name: "Read",
            input_schema: {
              type: "object",
              properties: { model: { type: "string", default: "cc/do-not-touch" } },
            },
          },
        ],
      };
      const expected = structuredClone(original);
      expected.model = "cc/claude-opus-5-5";
      expected.tools[0].model = "claude-opus-5-5";
      assert.deepEqual(forwarded(original), expected);
    });
  }
for (const model of [
  "claude-opus-5-5",
  "openrouter/anthropic/claude-opus-5-5",
  "cx/gpt-6.1-sol",
  "cc/not-a-claude-model",
]) {
  test(`preserves tool model outside the local Claude namespace: ${model}`, () => {
    assert.equal(
      forwarded({ model: "claude-opus-5-5", tools: [{ type: "advisor_20260301", model }] }).tools[0]
        .model,
      model
    );
  });
}
for (const [agent, target] of [
  ["antigravity", "cc/claude-opus-5-5"],
  ["kiro", "cc/claude-opus-5-5"],
  ["claude-code", "cx/gpt-6.1-sol"],
]) {
  test(`preserves another agent or target: ${agent} ${target}`, () => {
    assert.equal(
      forwarded(
        { tools: [{ type: "advisor_20260301", model: "cc/claude-opus-5-5" }] },
        agent,
        target
      ).tools[0].model,
      "cc/claude-opus-5-5"
    );
  });
}
test("preserves missing, non-array and malformed tool entries", () => {
  for (const tools of [
    undefined,
    null,
    {},
    [null, "keep", { model: 42 }, { type: "advisor_20260301" }],
  ]) {
    const input = {
      model: "claude-opus-5-5",
      ...(tools !== undefined ? { tools } : {}),
      messages: [{ role: "user", content: "fixture" }],
    };
    assert.deepEqual(forwarded(input), { ...input, model: "cc/claude-opus-5-5" });
  }
});
