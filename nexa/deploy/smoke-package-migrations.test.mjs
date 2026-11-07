import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { inspectNativeUsageSchema } from "./native-usage-schema.mjs";

const columns = [
  "tokens_cache_creation_5m",
  "tokens_cache_creation_1h",
  "native_session_tag",
  "native_cache_group_tag",
];
const nativeRow = ["legacy-197-native_claude_cache_details", "native_claude_cache_details"];
const upstreamRow = ["197", "upstream_migration_197"];

function fixture(rows, fields = columns) {
  const data = fs.mkdtempSync(path.join(os.tmpdir(), "native-package-schema-"));
  execFileSync(
    "python3",
    [
      "-c",
      `import json, sqlite3, sys
database, rows, fields = sys.argv[1], json.loads(sys.argv[2]), json.loads(sys.argv[3])
with sqlite3.connect(database) as connection:
    connection.execute('CREATE TABLE _omniroute_migrations (version TEXT PRIMARY KEY, name TEXT)')
    connection.executemany('INSERT INTO _omniroute_migrations VALUES (?, ?)', rows)
    connection.execute('CREATE TABLE call_logs (id INTEGER PRIMARY KEY' + ''.join(', "' + name + '" INTEGER' for name in fields) + ')')
`,
      path.join(data, "storage.sqlite"),
      JSON.stringify(rows),
      JSON.stringify(fields),
    ],
    { timeout: 5000 }
  );
  return data;
}

function inspect(data) {
  return inspectNativeUsageSchema(data);
}

test("package smoke accepts the namespaced native migration beside upstream slot 197", () => {
  const schema = inspect(fixture([upstreamRow, nativeRow]));
  assert.deepEqual(schema.migration, ["native_claude_cache_details"]);
  for (const column of columns) assert.ok(schema.columns.includes(column));
});

test("package smoke accepts a namespaced native ledger without relying on numeric 197", () => {
  assert.doesNotThrow(() => inspect(fixture([nativeRow])));
});

test("package smoke rejects the old numeric native slot on the new release", () => {
  assert.throws(
    () => inspect(fixture([["197", "native_claude_cache_details"]])),
    /did not apply native usage migration 197/
  );
});

test("package smoke rejects an upstream row without the native migration", () => {
  assert.throws(() => inspect(fixture([upstreamRow])), /did not apply native usage migration 197/);
});

test("package smoke rejects a conflicting namespaced migration name", () => {
  assert.throws(
    () => inspect(fixture([[nativeRow[0], "wrong_native_name"]])),
    /did not apply native usage migration 197/
  );
});

test("package smoke still rejects each missing native usage column", () => {
  for (const missing of columns) {
    assert.throws(
      () =>
        inspect(
          fixture(
            [nativeRow],
            columns.filter((column) => column !== missing)
          )
        ),
      /did not apply native usage migration 197/,
      missing
    );
  }
});

test("package schema inspection preserves the database bytes", () => {
  const data = fixture([upstreamRow, nativeRow]);
  const database = path.join(data, "storage.sqlite");
  const hash = () => createHash("sha256").update(fs.readFileSync(database)).digest("hex");
  const before = hash();
  inspect(data);
  assert.equal(hash(), before);
});
