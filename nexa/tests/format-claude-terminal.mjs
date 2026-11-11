import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

assert.equal(process.env.GITHUB_ACTIONS, "true");
const fixture = process.argv[2];
assert.ok(fixture && path.isAbsolute(fixture));
const application = [
  "src/shared/constants/cliTools.ts", "src/shared/constants/featureFlagDefinitions.ts",
  "src/shared/services/claudeCliConfig.ts", "src/lib/cliTools/checkToolConfigStatus.ts",
  "src/app/api/cli-tools/claude-settings/route.ts", "src/app/api/cli-tools/backups/route.ts",
  "src/app/(dashboard)/dashboard/cli-code/components/ClaudeToolCard.tsx",
  "src/app/(dashboard)/dashboard/cli-code/components/CliProfileAutoSyncToggles.tsx",
  "src/i18n/messages/en.json",
];
const repository = [
  "nexa/deploy/claude-terminal-launcher.mjs", "nexa/deploy/claude-terminal-tunnel.mjs",
  "nexa/deploy/install-claude-terminal.mjs", "nexa/tests/claude-terminal-profile.test.mjs",
  "nexa/tests/verify-claude-terminal-red.mjs", "nexa/tests/format-claude-terminal.mjs",
  "nexa/new/src/mitm/_internal/claudeTerminalProfile.cjs",
  "nexa/new/tests/unit/claude-model-id-routing.test.ts", "nexa/new/tests/unit/claude-model-settings-route.test.ts",
  "nexa/docs/CLAUDE-TERMINAL-PROFILES-2026-11-11.md", ".github/workflows/focused-v3.8.53.yml",
];
const entries = [
  ...application.map(relative => ({ group: "application", root: fixture, relative })),
  ...repository.map(relative => ({ group: "repository", root: process.cwd(), relative })),
];
const before = entries.map(item => fs.readFileSync(path.join(item.root, item.relative)));
execFileSync(process.execPath, [path.join(fixture, "node_modules/prettier/bin/prettier.cjs"),
  "--write", "--print-width", "100", "--trailing-comma", "es5",
  ...entries.map(item => path.join(item.root, item.relative))], { stdio: "inherit" });
const output = path.join(process.env.RUNNER_TEMP, "terminal-formatted-source");
const changed = [];
for (const [index, item] of entries.entries()) {
  const content = fs.readFileSync(path.join(item.root, item.relative));
  if (!content.equals(before[index])) changed.push(item.group + "/" + item.relative);
  const target = path.join(output, item.group, item.relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}
const record = { sourceCommit: process.env.GITHUB_SHA, changed, formattedFiles: entries.length };
fs.writeFileSync(path.join(output, "format-report.json"), JSON.stringify(record, null, 2) + "\n");
console.log(JSON.stringify(record));
assert.equal(changed.length, 0, "Apply the reviewable formatting artifact and validate the exact source again");
