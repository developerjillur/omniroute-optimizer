"use strict";

const { normalizeClaudeModelId, selectClaudeFamilyModels, catalog } = require("./claudeModels.cjs");
const PROFILE_DIRECTORY = "omniroute-terminal";
const PROFILE_FLAG = "OMNIROUTE_AUTO_SYNC_CLAUDE_PROFILES";
const MODEL_KEYS = ["ANTHROPIC_MODEL", "ANTHROPIC_DEFAULT_FABLE_MODEL", "ANTHROPIC_DEFAULT_OPUS_MODEL",
  "ANTHROPIC_DEFAULT_SONNET_MODEL", "ANTHROPIC_DEFAULT_HAIKU_MODEL", "CLAUDE_CODE_SUBAGENT_MODEL",
  "ANTHROPIC_SMALL_FAST_MODEL"];
const GATEWAY_KEYS = ["ANTHROPIC_BASE_URL", "ANTHROPIC_AUTH_TOKEN", "ANTHROPIC_API_KEY",
  "CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY", "CLAUDE_CODE_AUTO_COMPACT_WINDOW"];

/** @returns {Record<string, any>} */
function parseSettingsJson(content) {
  // Strip JSONC comments/trailing commas only outside strings.
  let out = "", quoted = false, escaped = false;
  for (let i = 0; i < content.length; i++) {
    const c = content[i], next = content[i + 1];
    if (quoted) {
      out += c;
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === '"') quoted = false;
    } else if (c === '"') { quoted = true; out += c; }
    else if (c === "/" && next === "/") {
      while (i < content.length && content[i] !== "\n") i++;
      out += "\n";
    } else if (c === "/" && next === "*") {
      const end = content.indexOf("*/", i + 2);
      if (end < 0) throw Error("Unterminated settings comment");
      i = end + 1; out += " ";
    } else out += c;
  }
  let clean = ""; quoted = false; escaped = false;
  for (let i = 0; i < out.length; i++) {
    const c = out[i];
    if (quoted) {
      clean += c;
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === '"') quoted = false;
    } else if (c === '"') { quoted = true; clean += c; }
    else if (c === "," && /^[\s]*[}\]]/.test(out.slice(i + 1))) continue;
    else clean += c;
  }
  const settings = JSON.parse(clean);
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) throw Error("Expected settings object");
  if (settings.env !== undefined && (!settings.env || typeof settings.env !== "object" || Array.isArray(settings.env) ||
      Object.values(settings.env).some(value => typeof value !== "string"))) throw Error("Expected string settings environment");
  return settings;
}

/** @returns {Record<string, any>} */
function mergeTerminalProfile(globalSettings = {}, terminalSettings = {}) {
  const inherited = globalSettings.env || {};
  const env = {};
  for (const key of [...GATEWAY_KEYS, ...MODEL_KEYS]) {
    if (typeof inherited[key] === "string") env[key] = inherited[key];
  }
  // This is a separate Terminal choice. Never change the native app's global file.
  env.ANTHROPIC_DEFAULT_FABLE_MODEL = selectClaudeFamilyModels(catalog).fable || "claude-fable-5-2";
  Object.assign(env, terminalSettings.env || {});
  return { ...terminalSettings, env };
}

function isNativeModel(value) {
  const id = normalizeClaudeModelId(String(value || ""));
  return /^(?:claude-[a-z0-9][a-z0-9.\-]*(?:\[[^\]\r\n]+\])?|default|opus|sonnet|haiku|fable|opusplan|sonnetplan)(?:\[1m\])?$/i.test(id);
}

function buildTerminalLaunchSettings(mode, globalSettings, terminalSettings, additional = {}) {
  if (mode !== "native" && mode !== "gateway") throw Error("Unknown Terminal routing mode");
  const profile = mergeTerminalProfile(globalSettings, terminalSettings);
  const settings = { ...profile, ...additional, env: { ...profile.env, ...(additional.env || {}) } };
  for (const key of MODEL_KEYS) {
    if (settings.env[key]) settings.env[key] = normalizeClaudeModelId(settings.env[key]);
  }
  if (mode === "gateway") {
    const url = new URL(String(settings.env.ANTHROPIC_BASE_URL || ""));
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password)
      throw Error("Configure a valid OmniRoute URL before enabling Terminal routing");
    if (!settings.env.ANTHROPIC_AUTH_TOKEN && !settings.env.ANTHROPIC_API_KEY)
      throw Error("Configure an OmniRoute key before enabling Terminal routing");
    settings.env.CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY = "1";
    settings.env.CLAUDE_CODE_OAUTH_TOKEN = "";
  } else {
    settings.env.ANTHROPIC_BASE_URL = "https://api.anthropic.com";
    settings.env.ANTHROPIC_AUTH_TOKEN = "";
    settings.env.ANTHROPIC_API_KEY = "";
    settings.env.CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY = "";
    settings.env.CLAUDE_CODE_AUTO_COMPACT_WINDOW = "";
    settings.apiKeyHelper = "";
    for (const key of ["CLAUDE_CODE_USE_BEDROCK", "CLAUDE_CODE_USE_VERTEX", "CLAUDE_CODE_USE_FOUNDRY"])
      settings.env[key] = "";
    for (const key of MODEL_KEYS) {
      if (settings.env[key]) settings.env[key] = isNativeModel(settings.env[key])
        ? normalizeClaudeModelId(settings.env[key]) : "";
    }
    if (settings.model && !isNativeModel(settings.model)) delete settings.model;
    if (!settings.model && globalSettings.model && !isNativeModel(globalSettings.model)) settings.model = "default";
  }
  return settings;
}

module.exports = { PROFILE_DIRECTORY, PROFILE_FLAG, MODEL_KEYS, GATEWAY_KEYS,
  mergeTerminalProfile, buildTerminalLaunchSettings, isNativeModel, parseSettingsJson, normalizeClaudeModelId };
