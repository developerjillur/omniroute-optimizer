import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { stripTypeScriptTypes } from "node:module";
import { pathToFileURL } from "node:url";
import test from "node:test";

async function fixture(initial?: Record<string, unknown>) {
  const directory = await fs.mkdtemp(
    path.join(process.env.TMPDIR || os.tmpdir(), "claude-settings-route-")
  );
  const filename = path.join(directory, "settings.json");
  if (initial) await fs.writeFile(filename, JSON.stringify(initial));
  const state = { filename, backups: 0, saved: 0 };
  const key = `fixture${Date.now()}${Math.random().toString(36).slice(2)}`;
  Reflect.set(globalThis, key, state);
  const helper = pathToFileURL(path.resolve("src/shared/services/claudeCliConfig.ts")).href;
  const replacements: Record<string, string> = {
    "next/server": "export const NextResponse={json:(...args)=>Response.json(...args)};",
    "@/lib/api/requireCliToolsAuth": "export const requireCliToolsAuth=async()=>null;",
    "@/shared/services/cliRuntime": `export const ensureCliConfigWriteAllowed=()=>null,getCliPrimaryConfigPath=()=>globalThis['${key}'].filename,getCliRuntimeStatus=async()=>({installed:true,runnable:true});`,
    "@/shared/services/backupService": `export const createBackup=async()=>{globalThis['${key}'].backups++;};`,
    "@/shared/services/claudeCliConfig": `export * from '${helper}';`,
    "@/lib/db/cliToolState": `export const saveCliToolLastConfigured=()=>{globalThis['${key}'].saved++;},deleteCliToolLastConfigured=()=>{};`,
    "@/shared/validation/schemas": "export const cliSettingsEnvSchema={};",
    "@/shared/validation/helpers":
      "export const isValidationFailure=()=>false,validateBody=(_schema,body)=>({data:{env:{...body.env}}});",
    "@/lib/db/apiKeys":
      "export const getApiKeyById=async(id)=>id==='fixture-key-id'?{key:'fixture-resolved-token'}:null;",
    "../_lib/jsoncConfig": "export const readJsoncConfig=async()=>null;",
  };
  let source = await fs.readFile(
    path.resolve("src/app/api/cli-tools/claude-settings/route.ts"),
    "utf8"
  );
  source = stripTypeScriptTypes(source, { mode: "strip" }).replace(
    /from\s+(["'])([^"']+)\1/g,
    (match, _quote, specifier) => {
      const code = replacements[specifier];
      return code
        ? `from ${JSON.stringify("data:text/javascript," + encodeURIComponent(code))}`
        : match;
    }
  );
  const routeFile = path.join(directory, "route.mjs");
  await fs.writeFile(routeFile, source);
  const route = await import(pathToFileURL(routeFile).href);
  const post = (body: unknown) =>
    route.POST(
      new Request("http://localhost/api/cli-tools/claude-settings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      })
    );
  return { state, filename, post };
}

test("actual settings route previews without writes, then applies normalized IDs on a copy", async () => {
  const original = {
    hooks: { UserPromptSubmit: [] },
    permissions: { allow: ["Read"] },
    theme: "dark",
    env: {
      CUSTOM_ENV: "retain",
      ANTHROPIC_DEFAULT_FABLE_MODEL: "owner-choice",
      ANTHROPIC_DEFAULT_OPUS_MODEL: "claude-opus-4-8",
    },
  };
  const f = await fixture(original);
  const bytes = await fs.readFile(f.filename, "utf8");
  const request = {
    keyId: "fixture-key-id",
    env: {
      ANTHROPIC_MODEL: "cc/claude-sonnet-5-5",
      ANTHROPIC_DEFAULT_HAIKU_MODEL: "claude/claude-haiku-5-5",
      ANTHROPIC_DEFAULT_FABLE_MODEL: "do-not-replace",
      ANTHROPIC_BASE_URL: "https://omni.local/",
    },
  };
  const response = await f.post({ ...request, preview: true });
  assert.equal(response.status, 200);
  const preview = await response.json();
  assert.equal(preview.preview, true);
  assert.match(preview.revision, /^[a-f0-9]{64}$/);
  assert.equal(JSON.stringify(preview).includes("fixture-resolved-token"), false);
  assert.equal(await fs.readFile(f.filename, "utf8"), bytes);
  assert.equal(f.state.backups, 0);
  assert.equal(f.state.saved, 0);
  const applied = await f.post({ ...request, expectedRevision: preview.revision });
  assert.equal(applied.status, 200);
  const saved = JSON.parse(await fs.readFile(f.filename, "utf8"));
  assert.deepEqual(saved.hooks, original.hooks);
  assert.deepEqual(saved.permissions, original.permissions);
  assert.equal(saved.theme, "dark");
  assert.equal(saved.env.CUSTOM_ENV, "retain");
  assert.equal(saved.env.ANTHROPIC_DEFAULT_FABLE_MODEL, "owner-choice");
  assert.equal(saved.env.ANTHROPIC_DEFAULT_OPUS_MODEL, "claude-opus-4-8");
  assert.equal(saved.env.ANTHROPIC_MODEL, "claude-sonnet-5-5");
  assert.equal(saved.env.ANTHROPIC_DEFAULT_HAIKU_MODEL, "claude-haiku-5-5");
  assert.equal(saved.env.ANTHROPIC_AUTH_TOKEN, "fixture-resolved-token");
  assert.equal(saved.env.ANTHROPIC_BASE_URL, "https://omni.local");
  assert.equal(f.state.backups, 1);
  assert.equal(f.state.saved, 1);
});

test("a settings edit after preview is preserved and returns a conflict before backup", async () => {
  const f = await fixture({ env: { CUSTOM: "before" } });
  const body = { env: { ANTHROPIC_MODEL: "cc/claude-sonnet-5-5" } };
  const preview = await (await f.post({ ...body, preview: true })).json();
  const edited = JSON.stringify({ env: { CUSTOM: "edited by owner" }, hooks: { retained: true } });
  await fs.writeFile(f.filename, edited);
  const response = await f.post({ ...body, expectedRevision: preview.revision });
  assert.equal(response.status, 409);
  assert.equal(await fs.readFile(f.filename, "utf8"), edited);
  assert.equal(f.state.backups, 0);
  assert.equal(f.state.saved, 0);
});

test("preview does not create a missing settings file", async () => {
  const f = await fixture();
  const response = await f.post({
    preview: true,
    env: { ANTHROPIC_MODEL: "cc/claude-sonnet-5-5" },
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).preview, true);
  await assert.rejects(fs.stat(f.filename), { code: "ENOENT" });
  assert.equal(f.state.backups, 0);
});
