import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import net from "node:net";
import vm from "node:vm";

const candidate = fs.readFileSync(
  process.env.NEXA_DNS_TEST_SOURCE || new URL("../deploy/bridge-upstream-dns.cjs", import.meta.url),
  "utf8"
);

function fixture(source = candidate) {
  let now = 1_000_000;
  const queries = [];
  const delegated = [];
  const dns = {
    lookup(...args) { delegated.push(args); },
    Resolver: class {
      constructor(options) { this.options = options; }
      setServers(servers) { this.servers = servers; }
      resolve4(host, options, callback) {
        if (typeof options === "function") { callback = options; options = undefined; }
        queries.push({ family: 4, host, options, callback });
      }
      resolve6(host, options, callback) {
        if (typeof options === "function") { callback = options; options = undefined; }
        queries.push({ family: 6, host, options, callback });
      }
    },
  };
  vm.runInNewContext(source, {
    require: (name) => name === "node:dns" ? dns : name === "node:net" ? net : assert.fail(name),
    process: { nextTick: queueMicrotask },
    Date: { now: () => now },
  });
  const lookup = (options = {}) => new Promise((resolve) => {
    dns.lookup("api.anthropic.com", options, (error, value, family) => resolve({ error, value, family }));
  });
  return { dns, queries, delegated, lookup, advance: (ms) => { now += ms; } };
}

test("concurrent Anthropic lookups share a single resolver query", async () => {
  const f = fixture();
  const lookups = Array.from({ length: 20 }, () => f.lookup());
  assert.equal(f.queries.length, 1);
  f.queries[0].callback(null, [{ address: "1.2.3.4", ttl: 30 }]);
  for (const result of await Promise.all(lookups)) {
    assert.equal(result.error, null);
    assert.equal(result.value, "1.2.3.4");
    assert.equal(result.family, 4);
  }
});

test("cache honours DNS TTL and returns independently allocated all-results", async () => {
  const f = fixture();
  const first = f.lookup({ all: true });
  f.queries[0].callback(null, [{ address: "1.2.3.4", ttl: 2 }]);
  const answer = await first;
  answer.value[0].address = "127.0.0.1";
  f.advance(1_999);
  const cached = await f.lookup({ all: true });
  assert.equal(cached.value[0].address, "1.2.3.4");
  assert.equal(f.queries.length, 1);
  f.advance(2);
  const refreshed = f.lookup();
  assert.equal(f.queries.length, 2);
  f.queries[1].callback(null, [{ address: "1.2.3.5", ttl: 20 }]);
  assert.equal((await refreshed).value, "1.2.3.5");
});

test("transient DNS outage may reuse a known address only within the bounded grace period", async () => {
  const f = fixture();
  const first = f.lookup();
  f.queries[0].callback(null, [{ address: "1.2.3.4", ttl: 1 }]);
  await first;
  f.advance(1_001);
  const duringOutage = f.lookup();
  f.queries[1].callback(Object.assign(new Error("resolver timeout"), { code: "ETIMEOUT" }));
  assert.equal((await duringOutage).value, "1.2.3.4");
  f.advance(300_000);
  const expired = f.lookup();
  f.queries[2].callback(Object.assign(new Error("resolver timeout"), { code: "ETIMEOUT" }));
  assert.equal((await expired).error.code, "ETIMEOUT");
});

test("authoritative DNS errors and cold-start failures are preserved", async () => {
  const f = fixture();
  const cold = f.lookup();
  f.queries[0].callback(Object.assign(new Error("timeout"), { code: "ETIMEOUT" }));
  assert.equal((await cold).error.code, "ETIMEOUT");
  const good = f.lookup();
  f.queries[1].callback(null, [{ address: "1.2.3.4", ttl: 1 }]);
  await good;
  f.advance(1_001);
  const missing = f.lookup();
  f.queries[2].callback(Object.assign(new Error("not found"), { code: "ENOTFOUND" }));
  assert.equal((await missing).error.code, "ENOTFOUND");
});

test("IPv6 cache is independent and loopback responses cannot recurse into the bridge", async () => {
  const f = fixture();
  const ipv6 = f.lookup(6);
  assert.equal(f.queries[0].family, 6);
  f.queries[0].callback(null, [{ address: "2606:4700::1111", ttl: 40 }]);
  assert.equal((await ipv6).family, 6);
  const ipv4 = f.lookup(4);
  f.queries[1].callback(null, [{ address: "127.0.0.1", ttl: 30 }]);
  assert.equal((await ipv4).error.code, "ENOTFOUND");
});

test("other hosts retain the original lookup and no HTTP request is performed", () => {
  const f = fixture();
  const callback = () => {};
  f.dns.lookup("example.test", { all: true }, callback);
  assert.equal(f.delegated.length, 1);
  assert.equal(f.delegated[0][0], "example.test");
  assert.equal(f.queries.length, 0);
});
