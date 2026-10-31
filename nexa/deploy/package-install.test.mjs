import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { packageInstallArgs, packageInstallEnvironment } from "./package-install.mjs";

test("managed archive install retains the pinned project's peer policy", () => {
  const args = packageInstallArgs("/private prefix", "candidate.tgz");
  assert.deepEqual(args, [
    "install",
    "-g",
    "--prefix",
    "/private prefix",
    "--no-fund",
    "--no-audit",
    "--legacy-peer-deps",
    path.resolve("candidate.tgz"),
  ]);
  assert.equal(args.includes("--ignore-scripts"), false);
  assert.equal(args.includes("--dangerously-allow-all-scripts"), false);
});

test("installer bounds resolver heap and concurrency without mutating caller settings", () => {
  const original = {
    NODE_OPTIONS: "--require=/owned/network.cjs --max-old-space-size=6144",
    DATA_DIR: "/private/data",
    npm_config_maxsockets: "15",
  };
  const result = packageInstallEnvironment(original);
  assert.equal(original.NODE_OPTIONS, "--require=/owned/network.cjs --max-old-space-size=6144");
  assert.equal(original.npm_config_maxsockets, "15");
  assert.equal(result.NODE_OPTIONS, "--require=/owned/network.cjs --max-old-space-size=1024");
  assert.equal(result.DATA_DIR, original.DATA_DIR);
  assert.equal(result.npm_config_maxsockets, "2");
  assert.equal(result.npm_config_foreground_scripts, "true");
});

test("installer also replaces the alternate Node heap spellings", () => {
  for (const NODE_OPTIONS of ["--max_old_space_size=8192", "--max-old-space-size 4096", ""]) {
    assert.equal(
      packageInstallEnvironment({ NODE_OPTIONS }).NODE_OPTIONS,
      "--max-old-space-size=1024"
    );
  }
});
