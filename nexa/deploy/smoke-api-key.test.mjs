import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { selectSmokeApiKey, loadPackagedEncryption } from "./smoke-api-key.mjs";

const secret = "synthetic-inference-credential-1234567890";
const row = {
  key: "enc:v1:synthetic-envelope",
  key_hash: createHash("sha256").update(secret).digest("hex"),
  scopes: '["self:usage"]',
  is_active: 1,
  is_banned: 0,
  revoked_at: null,
  expires_at: null,
  model_access_mode: "all",
};
const now = Date.parse("2026-11-06T00:00:00Z");
test("encrypted storage uses the decrypted credential with a matching fingerprint", () => {
  assert.equal(
    selectSmokeApiKey([row], () => secret, now),
    secret
  );
});
test("ciphertext is never sent as an inference credential", () => {
  assert.throws(() => selectSmokeApiKey([row], (value) => value, now), /No usable/);
});
test("legacy plaintext credentials remain usable", () => {
  assert.equal(
    selectSmokeApiKey([{ ...row, key: secret, key_hash: null }], (value) => value, now),
    secret
  );
});
for (const [name, change] of [
  ["inactive", { is_active: 0 }],
  ["banned", { is_banned: 1 }],
  ["revoked", { revoked_at: "2026-11-05T00:00:00Z" }],
  ["expired", { expires_at: "2026-11-05T23:59:59Z" }],
  ["malformed expiry", { expires_at: "not-a-date" }],
  ["quota bypass permission", { scopes: '["self:usage","policy:bypass-provider-quota"]' }],
  ["malformed scopes", { scopes: "not-json" }],
  ["restricted model access", { model_access_mode: "allowlist" }],
  ["fingerprint mismatch", { key_hash: "0".repeat(64) }],
]) {
  test(`the ${name} row is not eligible`, () => {
    assert.throws(() => selectSmokeApiKey([{ ...row, ...change }], () => secret, now), /No usable/);
  });
}
test("an undecryptable envelope cannot authenticate", () => {
  assert.throws(() => selectSmokeApiKey([row], () => null, now), /No usable/);
});
test("a later ordinary eligible key is selected without quota bypass", () => {
  const disallowed = { ...row, scopes: '["policy:bypass-provider-quota"]' };
  assert.equal(
    selectSmokeApiKey([disallowed, row], () => secret, now),
    secret
  );
});
test("the shipped TypeScript crypto module loads from an installed dependency path", async () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "smoke-key-module-"));
  const packageRoot = path.join(fixture, "node_modules/omniroute");
  const directory = path.join(packageRoot, "src/lib/db");
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(
    path.join(directory, "fixture.ts"),
    "export function unseal(value: string): string { return value.slice(7); }\n"
  );
  fs.writeFileSync(
    path.join(directory, "encryption.ts"),
    'import { unseal } from "./fixture";\n' +
      "export function decrypt(value: string): string { return unseal(value); }\n" +
      'export function looksEncrypted(value: string): boolean { return value.startsWith("enc:v1:"); }\n'
  );
  const module = await loadPackagedEncryption(packageRoot);
  assert.equal(module.looksEncrypted("enc:v1:fixture"), true);
  assert.equal(module.decrypt("enc:v1:fixture"), "fixture");
});
