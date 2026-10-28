"use strict";
// Keep this process's Anthropic provider connection on public DNS while local
// clients use the Agent Bridge hosts entry. TLS verification stays enabled.
const dns = require("node:dns");
const net = require("node:net");
const originalLookup = dns.lookup.bind(dns);
const resolver = new dns.Resolver({ timeout: 2000, tries: 1 });
resolver.setServers(["8.8.8.8", "1.1.1.1"]);
const cache = new Map();
const pending = new Map();
const transientErrors = new Set(["ETIMEOUT", "ETIMEDOUT", "ECONNREFUSED", "ESERVFAIL"]);
const MAX_TTL_MS = 60_000;
const STALE_GRACE_MS = 300_000;

function result(callback, config, family, addresses) {
  // lookup callbacks stay asynchronous even when an address is already cached.
  process.nextTick(() => {
    if (config.all) callback(null, addresses.map((address) => ({ address, family })));
    else callback(null, addresses[0], family);
  });
}

dns.lookup = function bridgeUpstreamLookup(hostname, options, callback) {
  if (typeof options === "function") {
    callback = options;
    options = {};
  }
  if (String(hostname).toLowerCase() !== "api.anthropic.com") {
    return originalLookup(hostname, options, callback);
  }
  const config = typeof options === "number" ? { family: options } : (options || {});
  const family = config.family === 6 ? 6 : 4;
  const previous = cache.get(family);
  if (previous && Date.now() < previous.expiresAt) {
    return result(callback, config, family, previous.addresses);
  }

  const waiting = pending.get(family);
  if (waiting) {
    waiting.push({ callback, config });
    return;
  }
  pending.set(family, [{ callback, config }]);
  const resolve = family === 6 ? resolver.resolve6.bind(resolver) : resolver.resolve4.bind(resolver);
  const finish = (error, records) => {
    const callbacks = pending.get(family) || [];
    pending.delete(family);
    let addresses;
    if (!error) {
      const valid = (Array.isArray(records) ? records : []).filter((record) => {
        if (!record) return false;
        const address = typeof record === "string" ? record : record.address;
        return net.isIP(address) === family &&
          !address.startsWith("127.") && address !== "::1" &&
          !address.toLowerCase().startsWith("fd6f:6d6e:");
      }).slice(0, 16);
      addresses = valid.map((record) => typeof record === "string" ? record : record.address);
      if (!addresses.length) {
        error = Object.assign(new Error("No public Anthropic address"), { code: "ENOTFOUND" });
      } else {
        const ttl = Math.min(MAX_TTL_MS, ...valid.map((record) => {
          const seconds = typeof record === "object" ? record.ttl : 60;
          return Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : MAX_TTL_MS;
        }));
        const expiresAt = Date.now() + ttl;
        cache.set(family, { addresses, expiresAt, staleUntil: expiresAt + STALE_GRACE_MS });
      }
    }
    if (error && previous && transientErrors.has(error.code) && Date.now() < previous.staleUntil) {
      // Only a previously resolved address may bridge a short resolver outage.
      // The TLS connection still verifies the original Anthropic hostname.
      addresses = previous.addresses;
      error = null;
    }
    for (const waiter of callbacks) {
      if (error) process.nextTick(() => waiter.callback(error));
      else result(waiter.callback, waiter.config, family, addresses);
    }
  };
  try {
    resolve(hostname, { ttl: true }, finish);
  } catch (error) {
    finish(error);
  }
};
