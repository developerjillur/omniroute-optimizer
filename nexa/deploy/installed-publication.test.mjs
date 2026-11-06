import test from "node:test";
import assert from "node:assert/strict";
import { verifyInstalledPublication } from "./installed-publication.mjs";

function fixture() {
  const lock = { lockfileVersion: 3, packages: { "node_modules/sanitizer": { version: "1.0.1" } } };
  const node = { location: "node_modules/sanitizer", version: "1.0.1" };
  const tree = {
    inventory: new Map([
      ["root", { isRoot: true }],
      [node.location, node],
    ]),
  };
  return { lock, node, tree };
}
test("the actual installed graph matches the publication lock", () => {
  const { lock, tree } = fixture();
  assert.equal(verifyInstalledPublication(tree, lock).installedDependenciesVerified, 1);
});
test("a nested older sanitizer cannot pass a clean source-only audit", () => {
  const { lock, tree } = fixture();
  const node = { location: "node_modules/editor/node_modules/sanitizer", version: "1.0.0" };
  tree.inventory.set(node.location, node);
  assert.throws(() => verifyInstalledPublication(tree, lock), /absent from the publication lock/);
});
test("an older version at a locked location is rejected", () => {
  const { lock, tree, node } = fixture();
  node.version = "1.0.0";
  assert.throws(() => verifyInstalledPublication(tree, lock), /version drift/);
});
test("workspace links cannot count as installed release dependencies", () => {
  const { lock, tree, node } = fixture();
  node.isLink = true;
  assert.throws(() => verifyInstalledPublication(tree, lock), /workspace link/);
});
test("an empty dependency inventory cannot count as verification", () => {
  const { lock } = fixture();
  assert.throws(() => verifyInstalledPublication({ inventory: new Map() }, lock), /populated/);
});
