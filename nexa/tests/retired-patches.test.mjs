import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { verifyRetiredPatches } from "../lib/retiredPatches.mjs";

const base = "a".repeat(40);
const blob = "b".repeat(40);
const data = Buffer.from("--- a/src/example.ts\n+++ b/src/example.ts\n");
const item = {
  patch: "example.patch",
  target: "src/example.ts",
  upstreamBlob: blob,
  patchSha256: createHash("sha256").update(data).digest("hex"),
  reason: "Covered by the pinned upstream implementation",
};
const verify = (registry, sha = base, names = [item.patch], bytes = data, target = blob) =>
  verifyRetiredPatches(
    registry,
    sha,
    names,
    () => bytes,
    () => target
  );
test("retirement requires the exact reviewed base, original patch and upstream target", () => {
  assert.deepEqual([...verify({ upstreamBase: base, patches: [item] })], [item.patch]);
});
for (const [name, registry, sha, names, bytes, target] of [
  ["another base", { upstreamBase: base, patches: [item] }, "c".repeat(40)],
  ["unknown patch", { upstreamBase: base, patches: [item] }, base, []],
  ["duplicate patch", { upstreamBase: base, patches: [item, item] }],
  [
    "changed original bytes",
    { upstreamBase: base, patches: [item] },
    base,
    [item.patch],
    Buffer.from("changed"),
  ],
  [
    "changed target blob",
    { upstreamBase: base, patches: [item] },
    base,
    [item.patch],
    data,
    "c".repeat(40),
  ],
  ["path traversal", { upstreamBase: base, patches: [{ ...item, patch: "../example.patch" }] }],
  ["mismatched target", { upstreamBase: base, patches: [{ ...item, target: "src/other.ts" }] }],
]) {
  test(`retirement refuses ${name}`, () =>
    assert.throws(() => verify(registry, sha, names, bytes, target)));
}
