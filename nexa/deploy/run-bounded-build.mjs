import { spawn, execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";

const GiB = 1024 ** 3;

export function vmHeadroom(vmStat) {
  const pageSize = Number(vmStat.match(/page size of (\d+) bytes/)?.[1]);
  const pages = ["free", "inactive", "speculative"].map((name) =>
    Number(vmStat.match(new RegExp(`Pages ${name}:\\s+(\\d+)\\.`))?.[1])
  );
  if (!Number.isFinite(pageSize) || pageSize <= 0 || pages.some((n) => !Number.isFinite(n)))
    throw Error("Cannot measure physical memory headroom");
  // Purgeable pages overlap active/inactive pages and must not be counted twice.
  return pages.reduce((sum, n) => sum + n, 0) * pageSize;
}

export function readSystemBudget() {
  if (process.platform !== "darwin") return null;
  const run = (file, args) => execFileSync(file, args, { encoding: "utf8", timeout: 2000 });
  const pressure = Number(
    run("/usr/sbin/sysctl", ["-n", "kern.memorystatus_vm_pressure_level"]).trim()
  );
  const swapMiB = Number(
    run("/usr/sbin/sysctl", ["vm.swapusage"]).match(/used =\s*([\d.]+)M/)?.[1]
  );
  const disk = fs.statfsSync(os.homedir());
  const result = {
    pressure,
    headroomBytes: vmHeadroom(run("/usr/bin/vm_stat", [])),
    swapBytes: swapMiB * 1024 ** 2,
    diskFreeBytes: Number(disk.bavail) * Number(disk.bsize),
  };
  if (Object.values(result).some((value) => !Number.isFinite(value)))
    throw Error("Cannot measure system build budget");
  return result;
}

export function systemBudgetReason(sample, baseline, limitMiB, preflight = false) {
  if (!sample) return "";
  if (sample.pressure !== 1) return "System memory pressure is not normal";
  const memoryMinimum = preflight ? 10 * GiB + limitMiB * 1024 ** 2 : 8 * GiB;
  if (sample.headroomBytes < memoryMinimum)
    return `Physical memory headroom below ${(memoryMinimum / GiB).toFixed(1)} GiB`;
  if (sample.diskFreeBytes < (preflight ? 20 : 15) * GiB)
    return `Internal disk below ${preflight ? 20 : 15} GiB`;
  if (baseline && sample.swapBytes - baseline.swapBytes > GiB) return "Swap grew more than 1 GiB";
  return "";
}

export function buildEnvironment(env = process.env) {
  const heap = Number(env.NEXA_BUILD_HEAP_MB || 6144);
  const workers = Number(env.NEXA_BUILD_WORKERS || 1);
  if (!Number.isInteger(heap) || heap < 1024 || heap > 6144)
    throw Error("Build heap must be 1024..6144 MiB");
  if (!Number.isInteger(workers) || workers < 1 || workers > 2)
    throw Error("Build workers must be 1 or 2");
  const options = (env.NODE_OPTIONS || "")
    .replace(/--max[-_]old[-_]space[-_]size(?:=|\s+)\d+/g, "")
    .trim();
  return {
    ...env,
    PATH:
      process.platform === "darwin"
        ? `/usr/local/bin:${env.PATH || process.env.PATH || "/usr/bin:/bin"}`
        : env.PATH,
    NODE_OPTIONS: `${options} --max-old-space-size=${heap}`.trim(),
    OMNIROUTE_BUILD_MEMORY_MB: String(heap),
    NEXA_BUILD_WORKERS: String(workers),
    OMNIROUTE_USE_TURBOPACK: "0",
    UV_THREADPOOL_SIZE: "2",
    // SWC's native Rayon pool is independent of Next.js and webpack worker limits.
    RAYON_NUM_THREADS: "1",
  };
}

export function descendantRss(ps, rootPid) {
  const rows = ps
    .trim()
    .split("\n")
    .map((line) => line.trim().split(/\s+/).map(Number))
    .filter((r) => r.length === 3 && r.every(Number.isFinite));
  const owned = new Set([rootPid]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const [pid, parent] of rows)
      if (owned.has(parent) && !owned.has(pid)) {
        owned.add(pid);
        changed = true;
      }
  }
  return rows.filter(([pid]) => owned.has(pid)).reduce((sum, row) => sum + row[2] * 1024, 0);
}

export function ownedGroupActive(ps, groupPid, userId) {
  const members = ps
    .trim()
    .split("\n")
    .map((line) => line.trim().split(/\s+/))
    .filter((row) => row.length === 3 && Number(row[0]) === groupPid && !row[2].startsWith("Z"));
  if (members.some((row) => Number(row[1]) !== userId))
    throw Error("Build group ownership changed");
  return members.length > 0;
}

export async function waitForOwnedGroupExit(isActive, { timeoutMs = 2000, intervalMs = 50 } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (isActive()) {
    if (Date.now() >= deadline) return false;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return true;
}

export async function runBounded(
  command,
  args,
  {
    env = process.env,
    limitMiB = Number(env.NEXA_BUILD_RSS_MB || 8192),
    intervalMs = 1000,
    measureBudget = readSystemBudget,
  } = {}
) {
  if (!command || !Number.isFinite(limitMiB) || limitMiB <= 0)
    throw Error("A command and positive RSS limit are required");
  let baseline;
  let preflightReason;
  try {
    baseline = measureBudget();
    preflightReason = systemBudgetReason(baseline, null, limitMiB, true);
  } catch (e) {
    preflightReason = e.message;
  }
  if (preflightReason) {
    const report = {
      code: 75,
      signal: null,
      peakMiB: 0,
      limitMiB,
      stopped: true,
      reason: preflightReason,
    };
    console.error(`[build-budget] ${JSON.stringify(report)}`);
    return report;
  }
  const child = spawn("/usr/bin/nice", ["-n", "10", command, ...args], {
    env: buildEnvironment(env),
    detached: true,
    stdio: "inherit",
  });
  let peakBytes = 0,
    stopped = false,
    reason = "",
    forceKill;
  const groupActive = () =>
    ownedGroupActive(
      execFileSync("/bin/ps", ["-axo", "pgid=,uid=,stat="], { encoding: "utf8", timeout: 2000 }),
      child.pid,
      process.getuid()
    );
  const signalGroup = (signal) => {
    if (!groupActive()) return;
    try {
      process.kill(-child.pid, signal);
    } catch (e) {
      if (e.code !== "ESRCH" && !(e.code === "EPERM" && !groupActive())) throw e;
    }
  };
  const stop = (why) => {
    if (stopped) return;
    stopped = true;
    reason = why;
    console.error(`[build-budget] ${why}; stopping only this build process group`);
    signalGroup("SIGTERM");
    forceKill = setTimeout(() => signalGroup("SIGKILL"), 2000);
  };
  const cancel = () => stop("Build cancelled");
  process.on("SIGINT", cancel);
  process.on("SIGTERM", cancel);
  const timer = setInterval(() => {
    try {
      const rss = descendantRss(
        execFileSync("/bin/ps", ["-axo", "pid=,ppid=,rss="], { encoding: "utf8", timeout: 2000 }),
        child.pid
      );
      peakBytes = Math.max(peakBytes, rss);
      if (rss > limitMiB * 1024 ** 2)
        stop(`RSS budget exceeded (${Math.ceil(rss / 1024 ** 2)} > ${limitMiB} MiB)`);
      const systemReason = systemBudgetReason(measureBudget(), baseline, limitMiB);
      if (systemReason) stop(systemReason);
    } catch (e) {
      stop(`Cannot monitor build memory: ${e.code || "measurement failed"}`);
    }
  }, intervalMs);
  const result = await new Promise((resolve) => {
    child.once("error", (e) => resolve({ code: 1, error: e.code }));
    child.once("exit", (code, signal) => resolve({ code: code ?? 1, signal }));
  });
  clearInterval(timer);
  if (stopped) {
    clearTimeout(forceKill);
    // The shell can exit before its worker processes finish handling SIGTERM.
    // Give those owned workers their grace period before another group signal.
    if (!(await waitForOwnedGroupExit(groupActive))) {
      try {
        signalGroup("SIGKILL");
      } catch (error) {
        // On macOS a disappearing process group can briefly report EPERM.
        if (
          error.code !== "EPERM" ||
          !(await waitForOwnedGroupExit(groupActive, { timeoutMs: 500 }))
        )
          throw error;
      }
      if (!(await waitForOwnedGroupExit(groupActive)))
        throw Error("Owned build workers did not exit after cancellation");
    }
  }
  process.off("SIGINT", cancel);
  process.off("SIGTERM", cancel);
  const report = {
    ...result,
    code: stopped ? 75 : result.code,
    peakMiB: Math.ceil(peakBytes / 1024 ** 2),
    limitMiB,
    stopped,
    reason,
  };
  console.log(`[build-budget] ${JSON.stringify(report)}`);
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  if (args.shift() !== "--") throw Error("Usage: run-bounded-build.mjs -- command [args]");
  const result = await runBounded(args.shift(), args);
  process.exitCode = result.code;
}
