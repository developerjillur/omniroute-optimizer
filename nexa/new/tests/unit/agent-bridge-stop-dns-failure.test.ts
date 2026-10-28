import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { EventEmitter } from "node:events";
import type { ChildProcess } from "node:child_process";

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "bridge-stop-dns-failure-"));
const manager = await import("../../src/mitm/manager.ts");
const { getBridgeProcessState } = await import("../../src/mitm/processLifecycle.ts");
const { readBridgeIntent, writeBridgeIntent } = await import("../../src/mitm/runtimeState.ts");
const { resolveMitmDataDir } = await import("../../src/mitm/dataDir.ts");
const { hasAnyDNSEntries, removeDNSEntries } = await import("../../src/mitm/dns/dnsConfig.ts");

for (const failAt of ["default", "collect", "managed"]) {
  test(`Stop preserves the listener and enabled intent when ${failAt} DNS teardown fails`, async () => {
    const events: string[] = [];
    const child = Object.assign(new EventEmitter(), {
      pid: process.pid,
      killed: false,
      exitCode: null as number | null,
      signalCode: null as string | null,
      kill(signal: string) {
        events.push(`kill:${signal}`);
        this.killed = true;
        this.signalCode = signal;
        queueMicrotask(() => this.emit("exit", null, signal));
        return true;
      },
    });
    const state = getBridgeProcessState();
    const dir = path.join(resolveMitmDataDir(), "mitm");
    const failure = new Error(`synthetic-${failAt}-dns-failure`);
    writeBridgeIntent(dir, true);
    manager.__setServerProcessForTest(child as unknown as ChildProcess, process.pid);
    manager.setCachedPassword("synthetic-password");
    const deps = {
      removeDNSEntry: async () => {
        events.push("default");
        if (failAt === "default") throw failure;
      },
      collectManagedHosts: () => {
        events.push("collect");
        if (failAt === "collect") throw failure;
        return ["synthetic-claude.example.test"];
      },
      removeDNSEntries: async () => {
        events.push("managed");
        if (failAt === "managed") throw failure;
      },
    };
    try {
      await assert.rejects(manager.stopMitm("synthetic-password", deps), (e) => e === failure);
      assert.equal(child.killed, false, "a failed Stop must not strand DNS at a dead listener");
      assert.equal(state.serverProcess, child);
      assert.equal(readBridgeIntent(dir), true, "automatic recovery intent must remain enabled");
      assert.equal(state.stopping, false, "the operator must be able to retry Stop");
      assert.equal(manager.getCachedPassword(), "synthetic-password");

      events.length = 0;
      await manager.stopMitm("synthetic-password", {
        removeDNSEntry: async () => {
          events.push("default");
        },
        collectManagedHosts: () => ["synthetic-claude.example.test"],
        removeDNSEntries: async () => {
          events.push("managed");
        },
      });
      assert.deepEqual(events, ["default", "managed", "kill:SIGTERM"]);
      assert.equal(readBridgeIntent(dir), false);
      assert.equal(state.serverProcess, null);
    } finally {
      manager.__setServerProcessForTest(null, null);
      manager.clearCachedPassword();
    }
  });
}

for (const missingPassword of [true, false]) {
  test(`Stop keeps the listener when managed DNS ${missingPassword ? "needs elevation" : "remains after cleanup"}`, async () => {
    let dnsWrites = 0;
    let killed = false;
    const child = Object.assign(new EventEmitter(), {
      pid: process.pid,
      killed: false,
      exitCode: null,
      signalCode: null as string | null,
      kill(signal: string) {
        killed = true;
        this.killed = true;
        this.signalCode = signal;
        queueMicrotask(() => this.emit("exit", null, signal));
        return true;
      },
    });
    const dir = path.join(resolveMitmDataDir(), "mitm");
    writeBridgeIntent(dir, true);
    manager.__setServerProcessForTest(child as unknown as ChildProcess, process.pid);
    const deps = {
      removeDNSEntry: async () => {
        dnsWrites++;
      },
      removeDNSEntries: async () => {
        dnsWrites++;
      },
      collectManagedHosts: () => ["synthetic-claude.example.test"],
      hasManagedDnsEntries: () => true,
      canRunPrivilegedMitmSteps: () => !missingPassword,
    };
    try {
      await assert.rejects(
        manager.stopMitm(missingPassword ? "" : "synthetic-password", deps),
        /DNS|sudoPassword/i
      );
      assert.equal(killed, false);
      assert.equal(dnsWrites, missingPassword ? 0 : 2);
      assert.equal(readBridgeIntent(dir), true);
      assert.equal(getBridgeProcessState().stopping, false);
    } finally {
      manager.__setServerProcessForTest(null, null);
    }
  });
}

for (const address of ["127.0.0.1", "::1"]) {
  test(`DNS removal handles a leftover ${address} entry without requiring its other address family`, async (t) => {
    // Both privileged writers are injected below; no system file can be changed.
    const previousGuard = process.env.OMNIROUTE_SKIP_DNS_WRITE;
    delete process.env.OMNIROUTE_SKIP_DNS_WRITE;
    t.after(() => {
      if (previousGuard === undefined) delete process.env.OMNIROUTE_SKIP_DNS_WRITE;
      else process.env.OMNIROUTE_SKIP_DNS_WRITE = previousGuard;
    });
    const read = fs.readFileSync.bind(fs);
    t.mock.method(fs, "readFileSync", ((file: fs.PathOrFileDescriptor, ...args: unknown[]) => {
      if (/(?:\/|\\)hosts$/.test(String(file)))
        return `${address} synthetic-claude.example.test\n127.0.0.1 localhost\n`;
      return Reflect.apply(read, fs, [file, ...args]);
    }) as typeof fs.readFileSync);
    const writes: string[][] = [];
    assert.equal(hasAnyDNSEntries(["synthetic-claude.example.test"]), true);
    await removeDNSEntries(["synthetic-claude.example.test"], "synthetic-password", {
      execFileWithPassword: async (_command, args) => {
        writes.push(args);
        return "";
      },
      runElevatedPowerShell: async () => {
        writes.push(["windows-fixture"]);
        return "";
      },
    });
    assert.equal(
      writes.length,
      1,
      "single-address remnants must not keep routing to a stopped bridge"
    );
  });
}

test("DNS teardown reports an unreadable hosts file instead of false success", async (t) => {
  const previousGuard = process.env.OMNIROUTE_SKIP_DNS_WRITE;
  delete process.env.OMNIROUTE_SKIP_DNS_WRITE;
  t.after(() => {
    if (previousGuard === undefined) delete process.env.OMNIROUTE_SKIP_DNS_WRITE;
    else process.env.OMNIROUTE_SKIP_DNS_WRITE = previousGuard;
  });
  const failure = new Error("synthetic-hosts-read-failure");
  const read = fs.readFileSync.bind(fs);
  t.mock.method(fs, "readFileSync", ((file: fs.PathOrFileDescriptor, ...args: unknown[]) => {
    if (/(?:\/|\\)hosts$/.test(String(file))) throw failure;
    return Reflect.apply(read, fs, [file, ...args]);
  }) as typeof fs.readFileSync);
  assert.throws(
    () => hasAnyDNSEntries(["synthetic-claude.example.test"]),
    (e) => e === failure
  );
  await assert.rejects(
    removeDNSEntries(["synthetic-claude.example.test"], "synthetic-password", {
      execFileWithPassword: async () => {
        assert.fail("must not write after an unreadable inventory");
      },
      runElevatedPowerShell: async () => {
        assert.fail("must not write after an unreadable inventory");
      },
    }),
    (e) => e === failure
  );
});

test("Stop requires a complete custom-host inventory while repair can remain best-effort", async (t) => {
  const { getDbInstance } = await import("../../src/lib/db/core.ts");
  const db = getDbInstance();
  const prepare = db.prepare.bind(db);
  const failure = new Error("synthetic-custom-host-inventory-failure");
  t.mock.method(db, "prepare", ((sql: string, ...args: unknown[]) => {
    if (sql.includes("FROM inspector_custom_hosts")) throw failure;
    return Reflect.apply(prepare, db, [sql, ...args]);
  }) as typeof db.prepare);
  assert.ok(manager.collectManagedHosts().includes("api.anthropic.com"));
  assert.throws(
    () => manager.collectManagedHosts({ requireCustomHosts: true }),
    (e) => e === failure
  );
});
