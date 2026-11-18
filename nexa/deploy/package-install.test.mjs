import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import {
  packageInstallArgs,
  packageInstallEnvironment,
} from "./package-install.mjs";
const { createLimitedExtraction } = createRequire(import.meta.url)(
  "./install-extraction-limit.cjs",
);

test("managed archive install retains the pinned project's peer policy", () => {
  const args = packageInstallArgs("/private prefix", "candidate.tgz");
  assert.deepEqual(args, [
    "install",
    "-g",
    "--prefix",
    "/private prefix",
    "--no-fund",
    "--no-audit",
    "--omit=dev",
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
  assert.equal(
    original.NODE_OPTIONS,
    "--require=/owned/network.cjs --max-old-space-size=6144",
  );
  assert.equal(original.npm_config_maxsockets, "15");
  assert.equal(
    result.NODE_OPTIONS,
    "--require=/owned/network.cjs --max-old-space-size=1024",
  );
  assert.equal(result.DATA_DIR, original.DATA_DIR);
  assert.equal(result.npm_config_maxsockets, "2");
  assert.equal(result.npm_config_foreground_scripts, "true");
});

test("installer also replaces the alternate Node heap spellings", () => {
  for (const NODE_OPTIONS of [
    "--max_old_space_size=8192",
    "--max-old-space-size 4096",
    "",
  ]) {
    assert.equal(
      packageInstallEnvironment({ NODE_OPTIONS }).NODE_OPTIONS,
      "--max-old-space-size=1024",
    );
  }
});

test("small installation profiles reach the actual npm Node environment", () => {
  const original = {
    ...process.env,
    NODE_OPTIONS: "--max-old-space-size=6144 --max-semi-space-size=8",
    NEXA_INSTALL_HEAP_MB: "384",
    NEXA_INSTALL_MAX_SOCKETS: "1",
  };
  const environment = packageInstallEnvironment(original);
  assert.equal(environment.npm_config_maxsockets, "1");
  assert.equal(environment.npm_config_foreground_scripts, "true");
  assert.equal(
    original.NODE_OPTIONS,
    "--max-old-space-size=6144 --max-semi-space-size=8",
  );
  const actual = Number(
    execFileSync(
      process.execPath,
      [
        "-e",
        "process.stdout.write(String(require('node:v8').getHeapStatistics().heap_size_limit / 1024**2))",
      ],
      { env: environment, encoding: "utf8" },
    ),
  );
  assert.ok(
    actual >= 384 && actual < 440,
    `The child received ${actual} MiB instead of the small profile`,
  );
});

test("installation profiles cannot raise the existing maximum or use invalid budgets", () => {
  for (const heap of ["0", "127", "1025", "NaN", "Infinity", "384.5", ""])
    assert.throws(
      () => packageInstallEnvironment({ NEXA_INSTALL_HEAP_MB: heap }),
      /Install heap/,
    );
  for (const sockets of ["0", "3", "NaN", "1.5", ""])
    assert.throws(
      () => packageInstallEnvironment({ NEXA_INSTALL_MAX_SOCKETS: sockets }),
      /Install connections/,
    );
});

test("cached package extraction is serial and retains exact arguments and results", async () => {
  let active = 0;
  let peak = 0;
  const receiver = {};
  const options = { integrity: "unchanged", ignoreScripts: false };
  const extract = createLimitedExtraction(async function (id, target, passed) {
    assert.equal(this, receiver);
    assert.equal(passed, options);
    active += 1;
    peak = Math.max(peak, active);
    await new Promise((resolve) => setImmediate(resolve));
    active -= 1;
    return target + id;
  }, 1);
  assert.deepEqual(
    await Promise.all(
      [1, 2, 3, 4].map((id) => extract.call(receiver, id, "target-", options)),
    ),
    ["target-1", "target-2", "target-3", "target-4"],
  );
  assert.equal(peak, 1);
});

test("extraction failures remain failures and do not discard subsequent work", async () => {
  const failure = new Error("original extraction error");
  const extract = createLimitedExtraction((id) => {
    if (id === 1) throw failure;
    return id;
  }, 1);
  const results = await Promise.allSettled([extract(1), extract(2)]);
  assert.equal(results[0].status, "rejected");
  assert.equal(results[0].reason, failure);
  assert.deepEqual(results[1], { status: "fulfilled", value: 2 });
  assert.throws(
    () => packageInstallEnvironment({ NEXA_INSTALL_EXTRACT_CONCURRENCY: "3" }),
    /concurrency/,
  );
});
