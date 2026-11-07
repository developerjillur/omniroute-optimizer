"use strict";

const catalog = require("./claudeModels.json");

function normalizeClaudeModelId(value) {
  if (typeof value !== "string") return value;
  return value.trim().replace(/^(?:cc|claude)\/(claude-[A-Za-z0-9._-]+)$/, "$1");
}

function versionOf(id, family) {
  const match = id.match(new RegExp(`^claude-${family}-(\\d+(?:[.-]\\d+)*)(?:-latest)?$`));
  if (!match) return null;
  const parts = match[1].split(/[.-]/).map(Number);
  const date = parts.length > 1 && String(parts.at(-1)).length === 8 ? parts.pop() : 0;
  return { parts, date };
}

function compareVersions(a, b) {
  for (let i = 0; i < Math.max(a.parts.length, b.parts.length); i++) {
    const delta = (a.parts[i] || 0) - (b.parts[i] || 0);
    if (delta) return delta;
  }
  return a.date - b.date;
}

function selectClaudeFamilyModels(models) {
  const selected = { fable: "", opus: "", sonnet: "", haiku: "" };
  for (const family of ["fable", "opus", "sonnet", "haiku"]) {
    let best = null;
    for (const model of models) {
      const version = typeof model.id === "string" ? versionOf(model.id, family) : null;
      if (version && (!best || compareVersions(version, best.version) > 0)) {
        best = { id: model.id, version };
      }
    }
    selected[family] = best?.id || "";
  }
  return selected;
}

function resolveClaudeMapping(model, mappings, models = catalog) {
  const plain = normalizeClaudeModelId(model);
  for (const key of [model, plain, "*"]) {
    if (typeof key === "string" && Object.hasOwn(mappings, key) && mappings[key]) {
      return mappings[key];
    }
  }
  return models.some((entry) => entry.id === plain) ? { model: `cc/${plain}` } : null;
}

function unmappedClaudeModelError(model) {
  return {
    type: "error",
    error: {
      type: "invalid_request_error",
      message: `Model ${JSON.stringify(String(model ?? "").slice(0, 200))} is not mapped in Agent Bridge for Claude Code. Configure a source model mapping.`,
    },
  };
}

module.exports = {
  normalizeClaudeModelId,
  selectClaudeFamilyModels,
  resolveClaudeMapping,
  unmappedClaudeModelError,
  catalog,
};
