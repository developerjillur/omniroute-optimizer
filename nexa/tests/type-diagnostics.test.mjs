import test from "node:test";
import assert from "node:assert/strict";
import { parseTypeDiagnostics, compareTypeDiagnostics } from "../lib/typeDiagnostics.mjs";

const record = { file: "src/route.ts", row: 12, column: 3, code: "TS2322",
  source: "  return credentials;", message: "Type A is not assignable to type B." };

test("existing diagnostic identity survives line insertions and expanded type text", () => {
  const result = compareTypeDiagnostics([record], [{ ...record, row: 20, message: "Type A | C is not assignable to type B." }]);
  assert.equal(result.added.length, 0);
  assert.equal(result.changedMessages.length, 1);
  assert.equal(result.pristine, result.applied);
});

test("new location, statement, code, column and repeated errors remain regressions", () => {
  for (const mutation of [
    { file: "src/new.ts" }, { source: "  return changed;" }, { code: "TS2339" }, { column: 4 },
  ]) assert.equal(compareTypeDiagnostics([record], [{ ...record, ...mutation }]).added.length, 1);
  assert.equal(compareTypeDiagnostics([record], [record, record]).added.length, 1);
  assert.equal(compareTypeDiagnostics([], [record]).added.length, 1);
});

test("compiler parsing requires actual source and rejects global or partial evidence", () => {
  const output = "src/route.ts(12,3): error TS2322: Type mismatch\n";
  const parsed = parseTypeDiagnostics(output, (file, row) => {
    assert.equal(file, record.file);
    assert.equal(row, record.row);
    return record.source;
  });
  assert.equal(parsed[0].column, 3);
  assert.equal(parsed[0].source, record.source);
  assert.throws(() => parseTypeDiagnostics(output, () => undefined), /Missing compiler source/);
  assert.throws(() => parseTypeDiagnostics("error TS5083: Cannot read configuration.", () => ""), /configuration compiler errors/);
});
