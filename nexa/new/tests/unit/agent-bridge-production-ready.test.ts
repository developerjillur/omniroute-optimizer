import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { ChildProcess } from "node:child_process";
import { PassThrough } from "node:stream";
import { waitForBridgeReady } from "../../src/mitm/processLifecycle.ts";

const source = fs.readFileSync(new URL("../../src/mitm/server.cjs", import.meta.url), "utf8");
const listener = source.match(/  server\.listen\(LOCAL_PORT,[\s\S]*?\(\) => \{([\s\S]*?)\n  \}\);/);
assert.ok(listener, "The production listen callback must remain inspectable");

for (const port of [8443, 18123]) {
  for (const split of [false, true]) {
    test(`production listener readiness is accepted by its real parent: ${port}, split=${split}`, async () => {
      const child = new ChildProcess();
      const stdout = new PassThrough();
      const stderr = new PassThrough();
      Object.assign(child, { stdout, stderr });
      const result = waitForBridgeReady(child, port, 150);
      vm.runInNewContext(listener[1], {
        stats: {},
        writeStats() {},
        LOCAL_PORT: port,
        ROUTER_URL: "http://127.0.0.1:28128/v1/chat/completions",
        console: {
          log(message: string) {
            const output = Buffer.from(message + "\n");
            if (split) {
              stdout.write(output.subarray(0, 15));
              stdout.write(output.subarray(15));
            } else stdout.write(output);
          },
        },
      });
      assert.equal(
        await result,
        true,
        "A bound production listener must not enter recovery shutdown"
      );
      assert.equal(stdout.listenerCount("data"), 0);
      assert.equal(stderr.listenerCount("data"), 0);
      stdout.destroy();
      stderr.destroy();
    });
  }
}
