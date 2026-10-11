import assert from "node:assert/strict";
import { test } from "node:test";
import { smokeModel } from "./smoke-model.mjs";

test("keeps the existing Claude smoke by default", () => {
  assert.equal(smokeModel({}), "cc/claude-opus-5-5");
});

test("uses the explicitly configured provider without fallback", () => {
  assert.equal(smokeModel({ NEXA_SMOKE_MODEL: "codex/gpt-6.1-sol" }), "codex/gpt-6.1-sol");
  assert.equal(smokeModel({ NEXA_SMOKE_MODEL: " glmt/glm-5.3-max " }), "glmt/glm-5.3-max");
});

test("rejects empty, ambiguous and multi-model overrides", () => {
  for (const model of [
    "",
    " ",
    "gpt-6.1-sol",
    "codex/",
    "codex/gpt,codex/other",
    "../gpt",
    "codex/a/b",
  ])
    assert.throws(() => smokeModel({ NEXA_SMOKE_MODEL: model }), /explicit provider\/model/);
});
