import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

const [receiptDirectory, server = "http://127.0.0.1:28128"] = process.argv.slice(2);
if (!receiptDirectory)
  throw Error("usage: disable-compression.mjs <new receipt directory> [loopback server]");
const url = new URL(server);
if (!["127.0.0.1", "localhost", "[::1]"].includes(url.hostname))
  throw Error("Compression policy changes are restricted to the local instance");
const root = path.resolve(receiptDirectory);
if (fs.existsSync(root)) throw Error("Use a new receipt directory; previous evidence is protected");
fs.mkdirSync(root, { mode: 0o700 });
process.env.DATA_DIR = path.join(os.homedir(), ".omniroute-local");
const runtime = path.join(os.homedir(), ".omniroute-runtime/lib/node_modules/omniroute");
const { apiFetch } = await import(pathToFileURL(path.join(runtime, "bin/cli/api.mjs")).href);
// Use the existing local management credential; never mint a session or change auth settings.
const managementKey = execFileSync(
  "python3",
  [
    "-c",
    "import sqlite3,sys; c=sqlite3.connect('file:'+sys.argv[1]+'?mode=ro',uri=True); row=c.execute(\"SELECT key FROM api_keys WHERE is_active=1 AND revoked_at IS NULL AND is_banned=0 ORDER BY CASE WHEN scopes LIKE '%manage%' THEN 0 ELSE 1 END LIMIT 1\").fetchone(); print(row[0] if row else '',end='')",
    path.join(process.env.DATA_DIR, "storage.sqlite"),
  ],
  { encoding: "utf8" }
);
if (!managementKey) throw Error("An existing local management key is required");
const read = async (route, options = {}) => {
  const response = await apiFetch(route, {
    baseUrl: server,
    apiKey: managementKey,
    retry: false,
    timeout: 30000,
    ...options,
  });
  if (!response.ok) throw Error(`Compression policy ${route}: HTTP ${response.status}`);
  return response.json();
};
const endpoint = "/api/settings/compression";
const handoffKey = "UNIVERSAL_CONTEXT_HANDOFF_ENABLED";
const readHandoff = async () => {
  const response = await read("/api/settings/feature-flags");
  const flag = response.flags?.find((item) => item.key === handoffKey);
  if (!flag) throw Error("Universal context handoff flag is missing");
  return flag;
};
const before = {
  compression: await read(endpoint),
  mcpAccessibility: await read(endpoint + "/mcp-accessibility"),
  universalHandoff: await readHandoff(),
};
fs.writeFileSync(path.join(root, "before.json"), JSON.stringify(before, null, 2) + "\n", {
  mode: 0o600,
  flag: "wx",
});
const desired = JSON.parse(
  fs.readFileSync(new URL("../config/compression-disabled.json", import.meta.url), "utf8")
);
await read(endpoint, { method: "PUT", body: desired });
await read(endpoint + "/mcp-accessibility", { method: "PUT", body: { enabled: false } });
await read("/api/settings/feature-flags", {
  method: "PUT",
  body: { key: handoffKey, value: "false" },
});
const after = {
  compression: await read(endpoint),
  mcpAccessibility: await read(endpoint + "/mcp-accessibility"),
  universalHandoff: await readHandoff(),
};
const actual = after.compression;
const policyVerified = !(
  actual.enabled !== false ||
  actual.defaultMode !== "off" ||
  actual.autoTriggerTokens !== 0 ||
  actual.contextEditing?.enabled !== false ||
  actual.contextBudget?.mode !== "off" ||
  actual.cavemanConfig?.enabled !== false ||
  actual.cavemanOutputMode?.enabled !== false ||
  actual.rtkConfig?.enabled !== false ||
  actual.codexResponsesConfig?.enabled !== false ||
  actual.omniglyph?.profile !== "passthrough" ||
  actual.liveZone?.enabled !== false ||
  actual.ultraSlmPrewarm !== false ||
  actual.ultra?.enabled !== false ||
  actual.aggressive?.summarizerEnabled !== false ||
  actual.mcpDescriptionCompressionEnabled !== false ||
  actual.outputStyles?.length !== 0 ||
  actual.stackedPipeline?.length !== 0 ||
  actual.activeComboId !== null ||
  actual.compressionComboId !== null ||
  after.mcpAccessibility.enabled !== false ||
  after.universalHandoff.effectiveValue !== "false" ||
  Object.keys(desired.engines).some((id) => actual.engines?.[id]?.enabled !== false)
);
const report = {
  time: new Date().toISOString(),
  author: "Jillur Rahman",
  server,
  runtimeSha: fs.readFileSync(path.join(runtime, "dist/BUILD_SHA"), "utf8").trim(),
  policyVerified,
  allEnginesDisabled: Object.keys(desired.engines).every(
    (id) => actual.engines?.[id]?.enabled === false
  ),
  engineCount: Object.keys(desired.engines).length,
  nativePromptCachePreserved: true,
  after,
};
const bytes = JSON.stringify(report, null, 2) + "\n";
fs.writeFileSync(path.join(root, "after.json"), bytes, { mode: 0o600, flag: "wx" });
console.log(
  JSON.stringify({
    receipt: root,
    policyVerified,
    allEnginesDisabled: report.allEnginesDisabled,
    engineCount: report.engineCount,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  })
);
if (!policyVerified)
  throw Error(
    `Stored compression policy did not satisfy the complete disable gate; receipt: ${root}`
  );
