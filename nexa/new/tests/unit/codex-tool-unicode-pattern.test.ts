import test from "node:test";
import assert from "node:assert/strict";
import { normalizeCodexTools } from "../../open-sse/executors/codex/tools.ts";

const controlAndSurrogatePattern = "^[^\\x00-\\x09\\x0b-\\x1f\\x7f\\ud800-\\udfff]*$";

test("Codex accepts native MCP schemas containing unsupported surrogate escapes", () => {
  const schema = {
    type: "object",
    properties: {
      text: { type: "string", pattern: controlAndSurrogatePattern, maxLength: 4096 },
      key: { type: "string", pattern: "^[A-Z][A-Z_0-9]{0,31}$" },
    },
    required: ["text"],
    additionalProperties: false,
  };
  const body = {
    tools: [{ type: "function", name: "mcp__mixar__mixar_ui_act", parameters: schema }],
  };
  normalizeCodexTools(body);
  const projected = body.tools[0].parameters;
  assert.equal(projected.properties.text.pattern, "^[^\\x00-\\x09\\x0b-\\x1f\\x7f]*$");
  const pattern = new RegExp(projected.properties.text.pattern, "u");
  assert.equal(pattern.test("Synthetic বাংলা 😀"), true);
  assert.equal(pattern.test("invalid\u0000control"), false);
  assert.equal(projected.properties.text.maxLength, 4096);
  assert.equal(projected.properties.key.pattern, "^[A-Z][A-Z_0-9]{0,31}$");
  assert.deepEqual(projected.required, ["text"]);
  assert.equal(projected.additionalProperties, false);
  assert.equal(schema.properties.text.pattern, controlAndSurrogatePattern);
});

test("Codex projects every schema branch while leaving literal metadata intact", () => {
  const leaf = { type: "string", pattern: "^[\\ud800-\\udfff]$" };
  const schema = {
    type: "object",
    $defs: { text: leaf },
    dependentSchemas: { text: { properties: { item: leaf } } },
    if: { properties: { text: leaf } },
    then: { properties: { item: leaf } },
    else: { properties: { item: leaf } },
    properties: { items: { type: "array", contains: leaf, items: leaf } },
    description: controlAndSurrogatePattern,
    const: { pattern: controlAndSurrogatePattern },
  };
  const body = { tools: [{ type: "function", name: "native_tool", parameters: schema }] };
  normalizeCodexTools(body);
  const projected = body.tools[0].parameters;
  assert.equal(projected.$defs.text.pattern, undefined);
  assert.equal(projected.dependentSchemas.text.properties.item.pattern, undefined);
  for (const branch of [projected.if, projected.then, projected.else]) {
    assert.equal(Object.values(branch.properties)[0].pattern, undefined);
  }
  assert.equal(projected.properties.items.contains.pattern, undefined);
  assert.equal(projected.properties.items.items.pattern, undefined);
  assert.equal(projected.description, controlAndSurrogatePattern);
  assert.deepEqual(projected.const, { pattern: controlAndSurrogatePattern });
});

test("Codex preserves scalar Unicode patterns and escaped literal backslashes", () => {
  for (const pattern of ["^[\\u0020-\\u007e]+$", "^😀+$", "^\\\\ud800$"]) {
    const body = {
      tools: [{ type: "function", name: "native_tool", parameters: { type: "string", pattern } }],
    };
    normalizeCodexTools(body);
    assert.equal(body.tools[0].parameters.pattern, pattern);
  }
});
