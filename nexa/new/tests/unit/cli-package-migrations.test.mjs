import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { pinPackageMigrations } from "../../bin/cli/utils/packageMigrations.mjs";

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "package-migrations-"));
const installed = path.join(scratch, "installed");
const migrations = path.join(installed, "src/lib/db/migrations");
fs.mkdirSync(migrations, { recursive: true });
fs.writeFileSync(path.join(migrations, "197_native_claude_cache_details.sql"), "SELECT 197;");

test("installed package migrations win over a residual build checkout", () => {
  const env = {};
  assert.equal(pinPackageMigrations(installed, env), migrations);
  assert.equal(env.OMNIROUTE_MIGRATIONS_DIR, migrations);
  assert.deepEqual(fs.readdirSync(env.OMNIROUTE_MIGRATIONS_DIR), [
    "197_native_claude_cache_details.sql",
  ]);
});

test("explicit migration directory remains authoritative", () => {
  const env = { OMNIROUTE_MIGRATIONS_DIR: "/custom/migrations" };
  assert.equal(pinPackageMigrations(installed, env), "/custom/migrations");
  assert.equal(env.OMNIROUTE_MIGRATIONS_DIR, "/custom/migrations");
});

test("empty override selects the installed package without changing other settings", () => {
  const env = { OMNIROUTE_MIGRATIONS_DIR: " ", DATA_DIR: "/retained/data" };
  pinPackageMigrations(installed, env);
  assert.deepEqual(env, { OMNIROUTE_MIGRATIONS_DIR: migrations, DATA_DIR: "/retained/data" });
});

test("missing package migrations leave default resolution available", () => {
  const env = {};
  assert.equal(pinPackageMigrations(path.join(scratch, "missing"), env), null);
  assert.deepEqual(env, {});
});

test("CLI pins migrations after loading configured environment and before command imports", () => {
  const source = fs.readFileSync(new URL("../../bin/omniroute.mjs", import.meta.url), "utf8");
  assert.ok(source.indexOf("loadEnvFile();") < source.indexOf("pinPackageMigrations(ROOT);"));
  assert.ok(
    source.indexOf("pinPackageMigrations(ROOT);") < source.indexOf("const { createProgram }")
  );
});
