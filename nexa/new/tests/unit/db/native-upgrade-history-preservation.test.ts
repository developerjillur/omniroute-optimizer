import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import test from "node:test";
import Database from "better-sqlite3";
import { createBetterSqliteAdapter } from "../../../src/lib/db/adapters/betterSqliteAdapter.ts";

for (const release of [
  {
    version: "3.8.51",
    commit: "c1e30b7676975feb298b49eff6ff58923c04b89e",
    count: 193,
    env: "NEXA_PREVIOUS_MIGRATIONS_DIR",
  },
  {
    version: "3.8.52",
    commit: "ad6f33f66bda34eba98645d3bfdabbde294bc843",
    count: 209,
    env: "NEXA_PREVIOUS_MIGRATIONS_V52_DIR",
  },
]) {
  test(`the complete v${release.version} schema upgrades with native history, credentials, settings and artifact references intact`, async () => {
    const previousDirectory = process.env[release.env];
    assert.ok(
      previousDirectory && fs.statSync(previousDirectory).isDirectory(),
      `prepare the pinned v${release.version} schema fixture first`
    );
    const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "native-full-upgrade-"));
    const oldDirectory = path.join(workspace, "previous-migrations");
    fs.mkdirSync(oldDirectory);
    const manifest = JSON.parse(
      fs.readFileSync(`nexa/tests/fixtures/previous-migrations-v${release.version}.json`, "utf8")
    ) as {
      version: string;
      commit: string;
      bootstrap: { filename: string; gitBlob: string }[];
      files: { filename: string; gitBlob: string }[];
    };
    assert.equal(manifest.version, release.version);
    assert.equal(manifest.commit, release.commit);
    assert.equal(manifest.files.length, release.count);
    const discovered = fs
      .readdirSync(previousDirectory)
      .filter((file) => file.endsWith(".sql"))
      .sort();
    assert.deepEqual(
      discovered,
      manifest.files.map((file) => file.filename).sort(),
      "a reduced schema cannot stand in for the previous release"
    );
    for (const { filename, gitBlob } of manifest.files) {
      const content = fs.readFileSync(path.join(previousDirectory, filename));
      const actual = createHash("sha1")
        .update(`blob ${content.length}\0`)
        .update(content)
        .digest("hex");
      assert.equal(actual, gitBlob, `previous migration source: ${filename}`);
      fs.writeFileSync(path.join(oldDirectory, filename), content);
    }
    const currentDirectory = path.resolve("src/lib/db/migrations");
    for (const file of ["197_native_claude_cache_details.sql", "198_usage_history_cache_ttl.sql"]) {
      fs.copyFileSync(path.join(currentDirectory, file), path.join(oldDirectory, file));
    }
    const runnerUrl = pathToFileURL(path.resolve("src/lib/db/migrationRunner.ts")).href;
    const originalDirectory = process.env.OMNIROUTE_MIGRATIONS_DIR;
    const raw = new Database(":memory:");
    const db = createBetterSqliteAdapter(raw);
    try {
      // Match the pinned release's tables -> healers -> indexes startup sequence.
      const previousSources = new Map<string, string>();
      assert.deepEqual(manifest.bootstrap.map((entry) => entry.filename).sort(), [
        "core.ts",
        "schemaColumns.ts",
      ]);
      for (const { filename, gitBlob } of manifest.bootstrap) {
        const content = fs.readFileSync(path.join(previousDirectory, "..", filename));
        assert.equal(
          createHash("sha1").update(`blob ${content.length}\0`).update(content).digest("hex"),
          gitBlob,
          `previous bootstrap: ${filename}`
        );
        previousSources.set(filename, content.toString("utf8"));
      }
      const schema = previousSources.get("core.ts")?.match(/const SCHEMA_SQL = `([\s\S]*?)`;/)?.[1];
      assert.ok(
        schema && !schema.includes("${") && !schema.includes(String.fromCharCode(92)),
        "the old schema must be a static SQL literal"
      );
      const bootstrapTables: string[] = [];
      const bootstrapIndexes: string[] = [];
      for (const rawStatement of schema.split(";")) {
        const statement = rawStatement.trim();
        if (!statement) continue;
        const sql = statement.replace(/^(?:[ \t]*--[^\n]*\n)+/, "").trimStart();
        (/^CREATE\s+(?:UNIQUE\s+)?INDEX\b/i.test(sql) ? bootstrapIndexes : bootstrapTables).push(
          `${statement};`
        );
      }
      raw.exec(bootstrapTables.join("\n"));
      const healers = await import(
        pathToFileURL(path.join(previousDirectory, "..", "schemaColumns.ts")).href
      );
      healers.ensureProviderConnectionsColumns(db);
      healers.ensureUsageHistoryColumns(db);
      healers.ensureCallLogsColumns(db);
      raw.exec(bootstrapIndexes.join("\n"));
      raw.exec(`CREATE TABLE IF NOT EXISTS _omniroute_migrations(version TEXT PRIMARY KEY,name TEXT NOT NULL,applied_at TEXT NOT NULL DEFAULT(datetime('now')));
      INSERT OR IGNORE INTO _omniroute_migrations(version,name) VALUES ('001','initial_schema');`);
      process.env.OMNIROUTE_MIGRATIONS_DIR = oldDirectory;
      const previous = await import(`${runnerUrl}?full-upgrade=previous-${release.version}`);
      previous.runMigrations(db, { isNewDb: true, databaseExistedBeforeInitialization: false });
      healers.ensureUsageHistoryAccountIndex(db);
      if (release.version === "3.8.51") {
        raw.exec(`UPDATE _omniroute_migrations SET version='197' WHERE version='legacy-197-native_claude_cache_details';
        UPDATE _omniroute_migrations SET version='198' WHERE version='legacy-198-usage_history_cache_ttl';`);
      }
      const timestamp = "2026-10-18T12:34:56.000Z";
      raw
        .prepare(
          `INSERT INTO provider_connections(id,provider,auth_type,api_key,access_token,refresh_token,provider_specific_data,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?)`
        )
        .run(
          "fixture-connection",
          "claude",
          "oauth",
          "fixture-encrypted-key",
          "fixture-encrypted-access",
          "fixture-encrypted-refresh",
          '{"fixture":"preserve-byte-order","nested":{"enabled":true}}',
          timestamp,
          timestamp
        );
      raw
        .prepare("INSERT INTO api_keys(id,name,key,created_at) VALUES (?,?,?,?)")
        .run("fixture-key", "Fixture key", "fixture-only-key", timestamp);
      raw
        .prepare("INSERT INTO combos(id,name,data,created_at,updated_at) VALUES (?,?,?,?,?)")
        .run(
          "fixture-combo",
          "Fixture combo",
          '{"models":["cc/claude-opus-5-5"],"strategy":"priority"}',
          timestamp,
          timestamp
        );
      raw
        .prepare("INSERT OR REPLACE INTO key_value(namespace,key,value) VALUES (?,?,?)")
        .run(
          "settings",
          "fixture-preservation",
          '{"compressionEnabled":false,"path":"/unchanged/fixture","customModels":["fixture-model"]}'
        );
      raw
        .prepare(
          `INSERT INTO usage_history(provider,model,connection_id,api_key_id,tokens_input,tokens_output,tokens_cache_read,tokens_cache_creation,tokens_reasoning,timestamp,tokens_cache_creation_5m,tokens_cache_creation_1h)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
        )
        .run(
          "claude",
          "claude-opus-5-5",
          "fixture-connection",
          "fixture-key",
          112,
          7,
          10,
          100,
          5,
          timestamp,
          40,
          60
        );
      const artifact = path.join(workspace, "call_logs", "preserved", "fixture-artifact.json");
      fs.mkdirSync(path.dirname(artifact), { recursive: true });
      fs.writeFileSync(artifact, '{"type":"message","stop_reason":"refusal","content":[]}');
      const artifactHash = () =>
        createHash("sha256").update(fs.readFileSync(artifact)).digest("hex");
      raw
        .prepare(
          `INSERT INTO call_logs(id,timestamp,path,status,model,provider,artifact_relpath,artifact_sha256,native_session_tag,native_cache_group_tag,tokens_cache_creation_5m,tokens_cache_creation_1h)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
        )
        .run(
          "fixture-call",
          timestamp,
          "/v1/messages",
          200,
          "claude-opus-5-5",
          "claude",
          "preserved/fixture-artifact.json",
          artifactHash(),
          "fixture-session",
          "fixture-cache-group",
          40,
          60
        );
      raw
        .prepare(
          "INSERT INTO memories(id,api_key_id,type,key,content,created_at,updated_at) VALUES (?,?,?,?,?,?,?)"
        )
        .run(
          "fixture-memory",
          "fixture-key",
          "factual",
          "fixture-orchid",
          "The orchid বাংলা fixture content remains searchable.",
          timestamp,
          timestamp
        );
      const tables = [
        "provider_connections",
        "api_keys",
        "combos",
        "key_value",
        "usage_history",
        "call_logs",
      ];
      const before = new Map<string, Record<string, unknown>[]>(
        tables.map((table) => [
          table,
          raw.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all() as Record<string, unknown>[],
        ])
      );
      const memoryBefore = raw
        .prepare(
          "SELECT id,api_key_id,type,key,content,metadata,created_at,updated_at,expires_at FROM memories"
        )
        .all();
      const ledgerBefore = raw
        .prepare("SELECT version,name,applied_at FROM _omniroute_migrations")
        .all() as { version: string; name: string; applied_at: string }[];
      const hashBefore = artifactHash();
      // The current production startup runs tables, current healers, then indexes before migrations.
      const currentCore = fs.readFileSync(path.resolve("src/lib/db/core.ts"), "utf8");
      const currentSchema = currentCore.match(/const SCHEMA_SQL = `([\s\S]*?)`;/)?.[1];
      assert.ok(
        currentSchema &&
          !currentSchema.includes("${") &&
          !currentSchema.includes(String.fromCharCode(92))
      );
      const currentIndexes: string[] = [];
      for (const statement of currentSchema
        .split(";")
        .map((part) => part.trim())
        .filter(Boolean)) {
        const sql = statement.replace(/^(?:[ \t]*--[^\n]*\n)+/, "").trimStart();
        if (/^CREATE\s+(?:UNIQUE\s+)?INDEX\b/i.test(sql)) currentIndexes.push(`${statement};`);
        else raw.exec(`${statement};`);
      }
      const currentHealers = await import(
        pathToFileURL(path.resolve("src/lib/db/schemaColumns.ts")).href
      );
      currentHealers.ensureProviderConnectionsColumns(db);
      currentHealers.ensureUsageHistoryColumns(db);
      currentHealers.ensureCallLogsColumns(db);
      raw.exec(currentIndexes.join("\n"));
      process.env.OMNIROUTE_MIGRATIONS_DIR = currentDirectory;
      const current = await import(`${runnerUrl}?full-upgrade=current-${release.version}`);
      assert.ok(
        current.runMigrations(db, { isNewDb: false, databaseExistedBeforeInitialization: false }) >
          0
      );
      for (const [table, rows] of before) {
        const after = raw.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all() as Record<
          string,
          unknown
        >[];
        assert.equal(after.length, rows.length, `${table}: row count`);
        for (let index = 0; index < rows.length; index++) {
          for (const [column, value] of Object.entries(rows[index]))
            assert.deepEqual(after[index][column], value, `${table}.${column}`);
        }
      }
      assert.deepEqual(
        raw
          .prepare(
            "SELECT id,api_key_id,type,key,content,metadata,created_at,updated_at,expires_at FROM memories"
          )
          .all(),
        memoryBefore
      );
      assert.equal(
        (
          raw
            .prepare("SELECT COUNT(*) AS count FROM memory_fts WHERE memory_fts MATCH 'orchid'")
            .get() as { count: number }
        ).count,
        1
      );
      for (const row of ledgerBefore) {
        const version =
          row.version === "197" && row.name === "native_claude_cache_details"
            ? "legacy-197-native_claude_cache_details"
            : row.version === "198" && row.name === "usage_history_cache_ttl"
              ? "legacy-198-usage_history_cache_ttl"
              : row.version;
        assert.deepEqual(
          raw
            .prepare("SELECT name,applied_at FROM _omniroute_migrations WHERE version=?")
            .get(version),
          { name: row.name, applied_at: row.applied_at }
        );
      }
      const reference = raw
        .prepare("SELECT artifact_relpath FROM call_logs WHERE id='fixture-call'")
        .get() as { artifact_relpath: string };
      assert.equal(path.join(workspace, "call_logs", reference.artifact_relpath), artifact);
      assert.equal(artifactHash(), hashBefore);
      const changes = () =>
        (raw.prepare("SELECT total_changes() AS count").get() as { count: number }).count;
      const changesBefore = changes();
      assert.equal(current.runMigrations(db), 0);
      assert.equal(
        changes(),
        changesBefore,
        "a repeated complete upgrade must not mutate history or ledger"
      );
    } finally {
      raw.close();
      if (originalDirectory === undefined) delete process.env.OMNIROUTE_MIGRATIONS_DIR;
      else process.env.OMNIROUTE_MIGRATIONS_DIR = originalDirectory;
    }
  });
}
