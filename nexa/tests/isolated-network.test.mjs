import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const guard = new URL("./isolated-network.mjs", import.meta.url).href;
test("fixture guard blocks outbound sockets even after fetch is replaced", () => {
  const result = spawnSync(
    process.execPath,
    [
      "--import",
      guard,
      "--input-type=module",
      "--eval",
      `import assert from 'node:assert/strict';
       import net from 'node:net';
       import tls from 'node:tls';
       globalThis.fetch = () => Promise.resolve(new Response('mock'));
       assert.throws(() => net.connect({host:'example.test',port:443}), /Fixture socket guard/);
       assert.throws(() => new net.Socket().connect(443,'127.0.0.1'), /Fixture socket guard/);
       assert.throws(() => tls.connect({host:'example.test',port:443}), /Fixture socket guard/);
       console.log('blocked-before-connect');`,
    ],
    { encoding: "utf8" }
  );
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /blocked-before-connect/);
});
