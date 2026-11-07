import assert from "node:assert/strict";

export function parseTypeDiagnostics(output, readSourceLine) {
  const records = [];
  for (const line of output.split("\n")) {
    const match = line.match(/^(.+?)\((\d+),(\d+)\): error (TS\d+): (.*)$/);
    if (!match) continue;
    const [, file, row, column, code, message] = match;
    const source = readSourceLine(file, Number(row));
    assert.equal(typeof source, "string", `Missing compiler source: ${file}:${row}`);
    records.push({ file, row: Number(row), column: Number(column), code, message, source });
  }
  assert.equal(
    records.length,
    (output.match(/error TS\d+:/g) || []).length,
    "global/configuration compiler errors require review"
  );
  return records;
}

export function compareTypeDiagnostics(before, after) {
  const key = (record) => JSON.stringify([record.file, record.code, record.column, record.source]);
  const groups = (records) => {
    const map = new Map();
    for (const record of records) {
      const identity = key(record);
      const group = map.get(identity) || [];
      group.push(record);
      map.set(identity, group);
    }
    return map;
  };
  const previous = groups(before);
  const current = groups(after);
  const added = [];
  const changedMessages = [];
  for (const [identity, records] of current) {
    const old = previous.get(identity) || [];
    if (records.length > old.length) added.push(...records.slice(old.length));
    const oldMessages = [...new Set(old.map((record) => record.message))].sort();
    const messages = [...new Set(records.map((record) => record.message))].sort();
    if (old.length && JSON.stringify(oldMessages) !== JSON.stringify(messages)) {
      changedMessages.push({
        identity: JSON.parse(identity),
        before: oldMessages,
        after: messages,
      });
    }
  }
  return { pristine: before.length, applied: after.length, added, changedMessages };
}
