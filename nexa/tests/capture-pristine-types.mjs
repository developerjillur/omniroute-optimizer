import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

assert.equal(process.env.GITHUB_ACTIONS, "true");
const root = process.cwd();
const directory = path.join(root, "nexa/.work");
fs.mkdirSync(directory, { recursive: true });
const base = JSON.parse(fs.readFileSync("tsconfig.json", "utf8"));
const config = path.join(directory, "tsconfig.pristine.json");
fs.writeFileSync(config, JSON.stringify({
  extends: "../../tsconfig.json",
  exclude: [...base.exclude.map((name) => path.resolve(root, name)), path.join(root, "nexa")],
}), { flag: "wx" });
const result = spawnSync(process.execPath, ["--optimize-for-size", "--max-semi-space-size=8",
  "node_modules/typescript/bin/tsc", "--noEmit", "--incremental", "false", "--pretty", "false", "-p", config],
  { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const output = `${result.stdout || ""}${result.stderr || ""}`;
fs.writeFileSync(path.join(process.env.RUNNER_TEMP, "pristine-tsc-diagnostics.log"),
  JSON.stringify({status:result.status,signal:result.signal,error:result.error?.code})+"\n"+output, { flag: "wx" });
const count = (output.match(/error TS\d+:/g) || []).length;
assert.equal(result.signal, null, "an interrupted compiler is not a measurement");
assert.ok(!result.error && (result.status === 0 || (result.status === 2 && count > 0)), "compiler must complete");
console.log(JSON.stringify({pristineDiagnostics:count,excludedOverlayDirectory:true}));
