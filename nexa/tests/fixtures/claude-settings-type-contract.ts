import { planClaudeSettings } from "../../../src/shared/services/claudeCliConfig.ts";

const original = {
  hooks: { UserPromptSubmit: ["retained fixture hook"] },
  permissions: { allow: ["Read"] },
  theme: "dark",
  env: { CUSTOM_ENV: "retain" },
};
const plan = planClaudeSettings(original, {
  ANTHROPIC_MODEL: "cc/claude-sonnet-5-5",
});

// Owner-defined fields remain available to typed callers after the merge.
const retained: typeof original = plan.settings;
const hooks: typeof original.hooks = plan.settings.hooks;
const permissions: typeof original.permissions = plan.settings.permissions;
const theme: typeof original.theme = plan.settings.theme;
void [retained, hooks, permissions, theme];
