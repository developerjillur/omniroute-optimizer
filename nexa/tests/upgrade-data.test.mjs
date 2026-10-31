import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("../deploy/check-upgrade-data.py", import.meta.url));
for (const affected of [false, true]) {
  test(`upgrade preflight ${affected ? "blocks affected configuration" : "accepts unaffected configuration"} without writing`, () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "upgrade-data-"));
    const database = path.join(directory, "fixture.sqlite");
    const setup = spawnSync(
      "python3",
      [
        "-c",
        `import sqlite3,sys
db=sqlite3.connect(sys.argv[1])
db.executescript("CREATE TABLE provider_connections(provider TEXT); CREATE TABLE registered_keys(provider TEXT); CREATE TABLE provider_key_limits(provider TEXT); CREATE TABLE discovery_results(provider_id TEXT); CREATE TABLE key_value(namespace TEXT,key TEXT,value TEXT);")
db.execute("INSERT INTO provider_connections VALUES (?)", ('oc' if sys.argv[2]=='true' else 'fixture-other',))
db.execute("INSERT INTO key_value VALUES ('providerAliases', ?, 'private-fixture-value')", ('oc' if sys.argv[2]=='true' else 'fixture-other',))
db.commit(); db.close()`,
        database,
        String(affected),
      ],
      { encoding: "utf8" }
    );
    assert.equal(setup.status, 0, setup.stderr);
    const hash = () => createHash("sha256").update(fs.readFileSync(database)).digest("hex");
    const before = hash();
    const result = spawnSync("python3", [script, "--database", database], { encoding: "utf8" });
    assert.equal(result.status, affected ? 2 : 0, result.stderr);
    const receipt = JSON.parse(result.stdout);
    assert.equal(receipt.safeToPromote, !affected);
    assert.equal(receipt.privateValuesExported, false);
    assert.equal(receipt.affectedCounts.provider_connections, affected ? 1 : 0);
    assert.equal(receipt.affectedCounts.key_value, affected ? 1 : 0);
    assert.ok(!result.stdout.includes("private-fixture-value"));
    assert.equal(hash(), before);
  });
}

test("a missing database fails closed and is never created", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "upgrade-data-missing-"));
  const file = path.join(directory, "missing.sqlite");
  const result = spawnSync("python3", [script, "--database", file], { encoding: "utf8" });
  assert.equal(result.status, 2);
  assert.equal(fs.existsSync(file), false);
});
