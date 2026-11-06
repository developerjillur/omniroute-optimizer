import test from "node:test";
import assert from "node:assert/strict";
import { compilePublicationLock } from "./publication-lock.mjs";

function fixture() {
  const source = {
    name: "fixture",
    version: "1.0.0",
    lockfileVersion: 3,
    packages: {
      "": {
        dependencies: { editor: "1.0.0" },
        devDependencies: { workspace: "*" },
        workspaces: ["packages/*"],
      },
      "node_modules/editor": { version: "1.0.0", dependencies: { sanitizer: "1.0.0" } },
      "node_modules/sanitizer": { version: "1.0.1", integrity: "sha512-source-target" },
      "node_modules/workspace": { link: true, resolved: "packages/workspace" },
      "packages/workspace": { version: "1.0.0" },
    },
  };
  const edge = {
    name: "sanitizer",
    rawSpec: "1.0.0",
    spec: "1.0.1",
    type: "prod",
    valid: true,
    to: { location: "node_modules/sanitizer", version: "1.0.1", packageName: "sanitizer" },
  };
  const tree = {
    inventory: new Map([
      ["editor", { location: "node_modules/editor", edgesOut: new Map([[edge.name, edge]]) }],
    ]),
  };
  return { source, edge, tree };
}

test("an overridden exact dependency publishes the validated safe target instead of the original range", () => {
  const { source, tree } = fixture();
  const before = structuredClone(source);
  const { lock, changes } = compilePublicationLock(source, tree);
  assert.equal(lock.packages["node_modules/editor"].dependencies.sanitizer, "1.0.1");
  assert.equal(lock.packages["node_modules/sanitizer"].integrity, "sha512-source-target");
  assert.equal(changes.length, 1);
  assert.deepEqual(source, before);
  assert.deepEqual(lock.packages[""].dependencies, source.packages[""].dependencies);
  assert.equal(lock.packages[""].devDependencies, undefined);
  assert.equal(lock.packages[""].workspaces, undefined);
  assert.equal(lock.packages["node_modules/workspace"], undefined);
  assert.equal(lock.packages["packages/workspace"], undefined);
});

test("unmodified dependency edges retain their original declarations", () => {
  const { source, tree, edge } = fixture();
  edge.spec = edge.rawSpec;
  const { lock, changes } = compilePublicationLock(source, tree);
  assert.equal(lock.packages["node_modules/editor"].dependencies.sanitizer, "1.0.0");
  assert.deepEqual(changes, []);
});

test("an unresolved override cannot become a publication pin", () => {
  const { source, tree, edge } = fixture();
  edge.valid = false;
  assert.throws(() => compilePublicationLock(source, tree), /Unresolved source override/);
});

test("a resolved target outside the validated lock is rejected", () => {
  const { source, tree, edge } = fixture();
  edge.to.version = "9.0.0";
  assert.throws(() => compilePublicationLock(source, tree), /validated source lock/);
});

test("a virtual tree with a different declared dependency cannot authorize a rewrite", () => {
  const { source, tree, edge } = fixture();
  edge.rawSpec = "0.1.0";
  assert.throws(() => compilePublicationLock(source, tree), /declaration differs/);
});

test("alias overrides are rejected until they have an explicit publication policy", () => {
  const { source, tree, edge } = fixture();
  edge.to.packageName = "different-sanitizer";
  assert.throws(() => compilePublicationLock(source, tree), /Alias overrides/);
});
