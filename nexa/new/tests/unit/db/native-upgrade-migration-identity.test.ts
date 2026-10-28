import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import Database from "better-sqlite3";
import { createBetterSqliteAdapter } from "../../../src/lib/db/adapters/betterSqliteAdapter.ts";
import { resolveMigrationIdentity } from "../../../src/lib/db/migrationIdentity.ts";

const folder = fs.mkdtempSync(path.join(os.tmpdir(), "native-migration-upgrade-"));
const source = path.resolve("src/lib/db/migrations");
const files = ["197_proxy_subscription_core_config.sql", "198_proxy_subscription_core_binary.sql",
  "197_native_claude_cache_details.sql", "198_usage_history_cache_ttl.sql"];
for (const file of files) fs.copyFileSync(path.join(source, file), path.join(folder, file));
const previous = process.env.OMNIROUTE_MIGRATIONS_DIR;
process.env.OMNIROUTE_MIGRATIONS_DIR = folder;
const { runMigrations } = await import("../../../src/lib/db/migrationRunner.ts");
test.after(() => {
  if (previous === undefined) delete process.env.OMNIROUTE_MIGRATIONS_DIR;
  else process.env.OMNIROUTE_MIGRATIONS_DIR = previous;
});

function database() {
  const raw = new Database(":memory:");
  raw.exec(`CREATE TABLE provider_connections(id TEXT PRIMARY KEY, credentials TEXT);
    INSERT INTO provider_connections VALUES ('fixture-provider', 'encrypted-fixture-only');
    CREATE TABLE combos(id TEXT PRIMARY KEY);
    CREATE TABLE proxy_subscriptions(id TEXT PRIMARY KEY, original_path TEXT);
    INSERT INTO proxy_subscriptions VALUES ('fixture-subscription', '/unchanged/fixture');
    CREATE TABLE call_logs(id TEXT PRIMARY KEY, model TEXT, timestamp TEXT, status INTEGER);
    CREATE TABLE usage_history(id INTEGER PRIMARY KEY, tokens_cache_creation INTEGER);
    CREATE TABLE settings(key TEXT PRIMARY KEY, value TEXT);
    INSERT INTO settings VALUES ('fixture-setting','unchanged');`);
  return { raw, db: createBetterSqliteAdapter(raw) };
}

test("only the two exact legacy files receive namespaced identities", () => {
  assert.equal(resolveMigrationIdentity(files[0])?.version, "197");
  assert.equal(resolveMigrationIdentity(files[1])?.version, "198");
  assert.equal(resolveMigrationIdentity(files[2])?.version, "legacy-197-native_claude_cache_details");
  assert.equal(resolveMigrationIdentity(files[3])?.version, "legacy-198-usage_history_cache_ttl");
  assert.equal(resolveMigrationIdentity("197_unknown.sql")?.version, "197");
  assert.equal(resolveMigrationIdentity("198_usage_history_cache_ttl_copy.sql")?.version, "198");
  assert.equal(resolveMigrationIdentity("not-a-migration.sql"), null);
});

for (const legacy of [false, true]) {
  test(`${legacy ? "legacy 197/198" : "fresh"} schema retains every native value and applies upstream slots once`, () => {
    const { raw, db } = database();
    try {
      if (legacy) {
        for (const file of files.slice(2)) raw.exec(fs.readFileSync(path.join(source, file), "utf8"));
        raw.exec(`CREATE TABLE _omniroute_migrations(version TEXT PRIMARY KEY,name TEXT NOT NULL,applied_at TEXT NOT NULL);
          INSERT INTO _omniroute_migrations VALUES ('197','native_claude_cache_details','2026-10-19T00:00:00Z'),
          ('198','usage_history_cache_ttl','2026-10-19T00:00:00Z');
          INSERT INTO usage_history VALUES (17,30,10,20);
          INSERT INTO call_logs VALUES ('fixture-call','fixture-model','2026-10-19',200,10,20,'session-fixture','group-fixture');`);
      }
      runMigrations(db, { isNewDb: !legacy, databaseExistedBeforeInitialization: false });
      assert.equal(runMigrations(db), 0, "a repeat must be a read-only no-op");
      const versions = raw.prepare("SELECT version,name,applied_at FROM _omniroute_migrations ORDER BY version").all() as Array<{version:string;name:string;applied_at:string}>;
      assert.equal(versions.length, 4);
      assert.equal(versions.find((row) => row.version === "197")?.name, "proxy_subscription_core_config");
      assert.equal(versions.find((row) => row.version === "198")?.name, "proxy_subscription_core_binary");
      const columns = raw.prepare("PRAGMA table_info(proxy_subscriptions)").all() as Array<{name:string}>;
      for (const name of ["core_config_path","selector_last_switch_kind","core_binary_path"]) assert.ok(columns.some((column) => column.name === name));
      assert.deepEqual(raw.prepare("SELECT * FROM provider_connections").all(), [{id:"fixture-provider",credentials:"encrypted-fixture-only"}]);
      assert.deepEqual(raw.prepare("SELECT * FROM settings").all(), [{key:"fixture-setting",value:"unchanged"}]);
      assert.equal((raw.prepare("SELECT original_path FROM proxy_subscriptions").get() as {original_path:string}).original_path, "/unchanged/fixture");
      if (legacy) {
        assert.deepEqual(raw.prepare("SELECT * FROM usage_history").all(), [{id:17,tokens_cache_creation:30,tokens_cache_creation_5m:10,tokens_cache_creation_1h:20}]);
        assert.equal(versions.find((row) => row.version === "legacy-197-native_claude_cache_details")?.applied_at, "2026-10-19T00:00:00Z");
        assert.deepEqual(raw.prepare("SELECT native_session_tag,native_cache_group_tag,tokens_cache_creation_5m,tokens_cache_creation_1h FROM call_logs").get(), {native_session_tag:"session-fixture",native_cache_group_tag:"group-fixture",tokens_cache_creation_5m:10,tokens_cache_creation_1h:20});
      }
    } finally { db.close(); }
  });
}

test("an unrecognized duplicate numeric slot still fails closed", () => {
  fs.writeFileSync(path.join(folder, "197_unknown.sql"), "CREATE TABLE unexpected(id INTEGER);");
  const { db } = database();
  try { assert.throws(() => runMigrations(db), /Migration version collision/); }
  finally { db.close(); }
});
