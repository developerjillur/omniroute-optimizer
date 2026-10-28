import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const overlaySource = fileURLToPath(new URL("../lib/overlay.mjs", import.meta.url));

async function fixture({ locales = true, count = 2 } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "overlay-doc-counts-"));
  for (const relative of ["nexa/lib", "src/lib/db/migrations"]) {
    fs.mkdirSync(path.join(root, relative), { recursive: true });
  }
  for (let i = 0; i < count; i += 1) {
    fs.writeFileSync(path.join(root, "src/lib/db/migrations", `${i}.sql`), "-- fixture\n");
  }
  for (const relative of ["README.md", "AGENTS.md", "llm.txt"]) {
    fs.writeFileSync(path.join(root, relative), "# Reference\n\n1 SQL migration\n");
  }
  if (locales) fs.mkdirSync(path.join(root, "docs/i18n"), { recursive: true });
  const modulePath = path.join(root, "nexa/lib/overlay.mjs");
  fs.copyFileSync(overlaySource, modulePath);
  const { syncMigrationDocCounts } = await import(pathToFileURL(modulePath).href);
  return { root, syncMigrationDocCounts };
}

test("syncs all discovered locale counts, preserves headers and is idempotent", async () => {
  const { root, syncMigrationDocCounts } = await fixture();
  const header = "# বাংলা reference\n\nLocale metadata\n\n---\n\n";
  for (const locale of ["bn", "new-locale"]) {
    const directory = path.join(root, "docs/i18n", locale);
    fs.mkdirSync(directory);
    fs.writeFileSync(path.join(directory, "llm.txt"), header + "# Reference\n\n1 SQL migration\n");
  }
  const changed = syncMigrationDocCounts();
  assert.deepEqual(
    changed.sort(),
    [
      "AGENTS.md",
      "README.md",
      "llm.txt",
      "docs/i18n/bn/llm.txt",
      "docs/i18n/new-locale/llm.txt",
    ].sort()
  );
  for (const locale of ["bn", "new-locale"]) {
    assert.equal(
      fs.readFileSync(path.join(root, "docs/i18n", locale, "llm.txt"), "utf8"),
      header + "# Reference\n\n2 SQL migration\n"
    );
  }
  assert.deepEqual(syncMigrationDocCounts(), []);
});

test("rejects a locale file symlink and preserves its target", async () => {
  const { root, syncMigrationDocCounts } = await fixture({ count: 1 });
  const target = path.join(root, "outside-llm.txt");
  const directory = path.join(root, "docs/i18n/bn");
  fs.mkdirSync(directory);
  fs.writeFileSync(target, "1 SQL migration\n");
  fs.symlinkSync(target, path.join(directory, "llm.txt"));
  assert.throws(syncMigrationDocCounts, /Unsafe documentation path/);
  assert.equal(fs.readFileSync(target, "utf8"), "1 SQL migration\n");
});

test("does not traverse a symlink locale directory", async () => {
  const { root, syncMigrationDocCounts } = await fixture();
  const outside = path.join(root, "outside-locale");
  fs.mkdirSync(outside);
  fs.writeFileSync(path.join(outside, "llm.txt"), "1 SQL migration\n");
  fs.symlinkSync(outside, path.join(root, "docs/i18n/bn"));
  assert.equal(syncMigrationDocCounts().length, 3);
  assert.equal(fs.readFileSync(path.join(outside, "llm.txt"), "utf8"), "1 SQL migration\n");
});

test("keeps root-only fixtures compatible when i18n is absent", async () => {
  const { root, syncMigrationDocCounts } = await fixture({ locales: false });
  assert.equal(syncMigrationDocCounts().length, 3);
  assert.equal(
    fs.readFileSync(path.join(root, "llm.txt"), "utf8"),
    "# Reference\n\n2 SQL migration\n"
  );
});
