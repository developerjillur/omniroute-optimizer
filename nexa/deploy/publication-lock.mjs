import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const edgeFields = {
  prod: "dependencies",
  optional: "optionalDependencies",
  dev: "devDependencies",
  peer: "peerDependencies",
  peerOptional: "peerDependencies",
};

export function compilePublicationLock(source, tree) {
  assert.equal(source.lockfileVersion, 3, "A validated version 3 source lock is required");
  const lock = structuredClone(source);
  const changes = [];
  for (const [location, entry] of Object.entries(lock.packages)) {
    if (location && (!location.startsWith("node_modules/") || entry.link)) {
      delete lock.packages[location];
    }
  }
  delete lock.packages[""].workspaces;
  for (const node of tree.inventory.values()) {
    if (node.isRoot || node.isLink || !lock.packages[node.location]) continue;
    for (const edge of node.edgesOut.values()) {
      if (edge.spec === edge.rawSpec) continue;
      assert.ok(edge.valid && edge.to && !edge.to.isLink, "Unresolved source override");
      const field = edgeFields[edge.type];
      assert.ok(field, "Unknown source dependency edge type");
      assert.equal(
        lock.packages[node.location][field]?.[edge.name],
        edge.rawSpec,
        "Source dependency declaration differs from its virtual tree"
      );
      assert.equal(
        source.packages[edge.to.location]?.version,
        edge.to.version,
        "Override target differs from the validated source lock"
      );
      assert.equal(
        edge.to.packageName,
        edge.name,
        "Alias overrides need an explicit publication policy"
      );
      lock.packages[node.location][field][edge.name] = edge.to.version;
      changes.push({
        location: node.location,
        field,
        name: edge.name,
        before: edge.rawSpec,
        effectiveSpec: edge.spec,
        after: edge.to.version,
        targetLocation: edge.to.location,
      });
    }
  }
  return { lock, changes };
}

export async function createPublicationLock(sourceRoot, npmPackageJson, outputDirectory) {
  const sourceBytes = fs.readFileSync(path.join(sourceRoot, "package-lock.json"));
  const manifestBytes = fs.readFileSync(path.join(sourceRoot, "package.json"));
  const source = JSON.parse(sourceBytes);
  const manifest = JSON.parse(manifestBytes);
  for (const field of ["dependencies", "optionalDependencies"]) {
    assert.deepEqual(
      source.packages[""][field] ?? {},
      manifest[field] ?? {},
      "Source manifest and lock disagree"
    );
  }
  const require = createRequire(path.resolve(npmPackageJson));
  const Arborist = require("@npmcli/arborist");
  // loadVirtual reads the existing source lock and the effective root override rules.
  // It neither resolves a new ideal tree nor installs or downloads packages.
  const tree = await new Arborist({
    path: sourceRoot,
    legacyPeerDeps: true,
    audit: false,
  }).loadVirtual();
  const { lock, changes } = compilePublicationLock(source, tree);
  assert.equal(
    digest(fs.readFileSync(path.join(sourceRoot, "package-lock.json"))),
    digest(sourceBytes)
  );
  assert.equal(
    digest(fs.readFileSync(path.join(sourceRoot, "package.json"))),
    digest(manifestBytes)
  );
  assert.ok(!fs.existsSync(outputDirectory), "Preserve earlier publication attempts");
  fs.mkdirSync(outputDirectory, { mode: 0o700 });
  const recipe = {
    method: "npm Arborist.loadVirtual effective override edges pinned to validated source targets",
    sourceLockSHA256: digest(sourceBytes),
    sourceManifestSHA256: digest(manifestBytes),
    sourceOverrides: manifest.overrides ?? {},
    changes,
  };
  fs.writeFileSync(
    path.join(outputDirectory, "npm-shrinkwrap.json"),
    JSON.stringify(lock, null, 2) + "\n",
    { flag: "wx", mode: 0o600 }
  );
  fs.writeFileSync(
    path.join(outputDirectory, "effective-edges.json"),
    JSON.stringify(recipe, null, 2) + "\n",
    { flag: "wx", mode: 0o600 }
  );
  return {
    status: "PUBLICATION_LOCK_CREATED_NOT_ACCEPTED",
    changedEdges: changes.length,
    sourceLockSHA256: recipe.sourceLockSHA256,
    outputDirectory,
    networkCalls: 0,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [sourceRoot, npmPackageJson, outputDirectory] = process.argv.slice(2);
  assert.ok(
    sourceRoot && npmPackageJson && outputDirectory,
    "Usage: node publication-lock.mjs SOURCE_ROOT NPM_PACKAGE_JSON NEW_OUTPUT_DIRECTORY"
  );
  console.log(
    JSON.stringify(await createPublicationLock(sourceRoot, npmPackageJson, outputDirectory))
  );
}
