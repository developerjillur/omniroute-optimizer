import test from "node:test";
import assert from "node:assert/strict";
import {
  buildEnvironment,
  descendantRss,
  ownedGroupActive,
  waitForOwnedGroupExit,
  vmHeadroom,
  systemBudgetReason,
  runBounded,
} from "./run-bounded-build.mjs";

const GiB = 1024 ** 3;
const healthy = { pressure: 1, headroomBytes: 20 * GiB, diskFreeBytes: 30 * GiB, swapBytes: 0 };
const isolatedBudget = () => null;

test("build defaults replace an inherited large heap without dropping other options", () => {
  const env = buildEnvironment({
    NODE_OPTIONS: "--require=/tmp/shim.cjs --max-old-space-size=16384",
    RAYON_NUM_THREADS: "64",
  });
  assert.equal(env.NODE_OPTIONS, "--require=/tmp/shim.cjs --max-old-space-size=6144");
  assert.equal(env.NEXA_BUILD_WORKERS, "1");
  assert.equal(env.RAYON_NUM_THREADS, "1");
  if (process.platform === "darwin") assert.ok(env.PATH.startsWith("/usr/local/bin:"));
  assert.equal(env.OMNIROUTE_USE_TURBOPACK, "0");
  assert.throws(() => buildEnvironment({ NEXA_BUILD_WORKERS: "13" }));
});
test("memory accounting includes nested build children but excludes other apps", () => {
  assert.equal(descendantRss("10 1 30\n12 11 40\n11 10 50\n99 1 999999", 10), 120 * 1024);
});
test("an exited build group is ignored and another user's group is never signalled", () => {
  assert.equal(ownedGroupActive("11 501 S\n12 501 S", 10, 501), false);
  assert.equal(ownedGroupActive("10 501 S\n10 501 S\n12 0 S", 10, 501), true);
  assert.equal(ownedGroupActive("10 501 Z", 10, 501), false);
  assert.throws(() => ownedGroupActive("10 0 S", 10, 501), /ownership changed/);
});
test("group cleanup waits for delayed worker exits and has a finite deadline", async () => {
  let samples = 0;
  assert.equal(
    await waitForOwnedGroupExit(() => ++samples < 3, { timeoutMs: 100, intervalMs: 1 }),
    true
  );
  assert.equal(samples, 3);
  assert.equal(await waitForOwnedGroupExit(() => true, { timeoutMs: 5, intervalMs: 1 }), false);
});
test("physical memory uses page counts without double-counting purgeable pages", () => {
  assert.equal(
    vmHeadroom(
      "page size of 16384 bytes\nPages free: 100.\nPages inactive: 200.\nPages speculative: 5.\nPages purgeable: 150."
    ),
    305 * 16384
  );
  assert.throws(() => vmHeadroom("percentage free: 60%"), /Cannot measure/);
});
test("preflight reserves the whole job budget plus ten GiB for user apps", () => {
  assert.equal(systemBudgetReason(healthy, null, 8192, true), "");
  assert.match(
    systemBudgetReason({ ...healthy, headroomBytes: 17 * GiB }, null, 8192, true),
    /18.0 GiB/
  );
});
test("system pressure, headroom, disk and swap independently stop a running build", () => {
  assert.match(systemBudgetReason({ ...healthy, pressure: 2 }, healthy, 8192), /pressure/);
  assert.match(
    systemBudgetReason({ ...healthy, headroomBytes: 7 * GiB }, healthy, 8192),
    /headroom/
  );
  assert.match(systemBudgetReason({ ...healthy, diskFreeBytes: 14 * GiB }, healthy, 8192), /disk/);
  assert.match(systemBudgetReason({ ...healthy, swapBytes: 2 * GiB }, healthy, 8192), /Swap/);
});
test("a failed preflight never starts the command", async () => {
  const result = await runBounded(process.execPath, ["-e", "process.exit(99)"], {
    limitMiB: 512,
    measureBudget: () => ({ ...healthy, pressure: 2 }),
  });
  assert.equal(result.code, 75);
  assert.equal(result.peakMiB, 0);
  assert.equal(result.stopped, true);
});
test("a pressure warning after preflight cancels only the owned command", async () => {
  let samples = 0;
  const result = await runBounded(process.execPath, ["-e", "setInterval(()=>{},100)"], {
    limitMiB: 512,
    intervalMs: 100,
    measureBudget: () => (++samples === 1 ? healthy : { ...healthy, pressure: 2 }),
  });
  assert.equal(result.code, 75);
  assert.match(result.reason, /System memory pressure/);
});
test("successful commands keep their real exit status", async () => {
  const result = await runBounded(process.execPath, ["-e", "process.exit(7)"], {
    limitMiB: 512,
    measureBudget: isolatedBudget,
  });
  assert.equal(result.code, 7);
  assert.equal(result.stopped, false);
});
test("a real allocating child is stopped when its process group exceeds the budget", async () => {
  const result = await runBounded(
    process.execPath,
    ["-e", "const b=Buffer.alloc(180*1024*1024,1); setInterval(()=>b[0]++,100)"],
    { limitMiB: 120, intervalMs: 100, measureBudget: isolatedBudget }
  );
  assert.equal(result.code, 75);
  assert.equal(result.stopped, true);
  assert.match(result.reason, /RSS budget exceeded/);
});
test("cancellation records a stopped result after the owned group has exited", async () => {
  const timer = setTimeout(() => process.emit("SIGTERM"), 100);
  try {
    const result = await runBounded(process.execPath, ["-e", "setInterval(()=>{},100)"], {
      limitMiB: 512,
      measureBudget: isolatedBudget,
    });
    assert.equal(result.code, 75);
    assert.equal(result.stopped, true);
    assert.equal(result.reason, "Build cancelled");
  } finally {
    clearTimeout(timer);
  }
});

test("a cancelled parent waits for its worker's SIGTERM cleanup without a group-exit race", async () => {
  const worker =
    'process.on("SIGTERM",()=>setTimeout(()=>process.exit(0),100));setInterval(()=>{},100)';
  const parent = `require("node:child_process").spawn(process.execPath,["-e",${JSON.stringify(worker)}],{stdio:"ignore"});setInterval(()=>{},100)`;
  const timer = setTimeout(() => process.emit("SIGTERM"), 400);
  try {
    const result = await runBounded(process.execPath, ["-e", parent], {
      limitMiB: 512,
      measureBudget: isolatedBudget,
    });
    assert.equal(result.code, 75);
    assert.equal(result.stopped, true);
    assert.equal(result.reason, "Build cancelled");
  } finally {
    clearTimeout(timer);
  }
});
