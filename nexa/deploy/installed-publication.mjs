import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

export function verifyInstalledPublication(tree, lock) {
  assert.equal(lock.lockfileVersion, 3, "The package needs a version 3 publication lock");
  let count = 0;
  for (const node of tree.inventory.values()) {
    if (node.isRoot) continue;
    assert.ok(!node.isLink, "An installed publication cannot depend on a workspace link");
    const expected = lock.packages[node.location];
    assert.ok(
      expected && !expected.link,
      `Installed dependency is absent from the publication lock: ${node.location}`
    );
    assert.equal(
      node.version,
      expected.version,
      `Installed dependency version drift: ${node.location}`
    );
    count++;
  }
  assert.ok(count > 0, "The installed publication inventory must be populated");
  return { installedDependenciesVerified: count, dependencyVersionsMatchPublicationLock: true };
}

export async function inspectInstalledPublication(
  packageRoot,
  npmPackageJson = "/usr/local/lib/node_modules/npm/package.json"
) {
  const metadata = JSON.parse(fs.readFileSync(path.join(packageRoot, "package.json")));
  assert.equal(
    metadata._hasShrinkwrap,
    true,
    "Local archive shrinkwrap discovery metadata is missing"
  );
  const lock = JSON.parse(fs.readFileSync(path.join(packageRoot, "npm-shrinkwrap.json")));
  const require = createRequire(path.resolve(npmPackageJson));
  const tree = await new (require("@npmcli/arborist"))({
    path: packageRoot,
    legacyPeerDeps: true,
    audit: false,
  }).loadActual();
  return verifyInstalledPublication(tree, lock);
}
