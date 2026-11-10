import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

assert.equal(process.env.GITHUB_ACTIONS, "true");
const require = createRequire(path.join(process.cwd(), "package.json"));
const { transformSync } = require("esbuild");
const manifest = JSON.parse(fs.readFileSync("nexa/manifest.json", "utf8"));
const files = [
  ...new Set(
    manifest.items
      .filter((item) => ["patch", "new"].includes(item.layer))
      .map((item) => item.target)
  ),
].filter((file) => /\.(?:ts|tsx|js|jsx|mjs|cjs)$/.test(file) && !file.endsWith(".d.ts"));
const failures = [];
for (const file of files) {
  const extension = path.extname(file).slice(1);
  const loader =
    extension === "tsx" ? "tsx" : extension === "ts" ? "ts" : extension === "jsx" ? "jsx" : "js";
  try {
    transformSync(fs.readFileSync(file, "utf8"), {
      loader,
      sourcefile: file,
      target: "esnext",
      logLevel: "silent",
      tsconfigRaw: { compilerOptions: { experimentalDecorators: true } },
    });
  } catch (error) {
    failures.push({ file, message: error.message });
  }
}
console.log(
  JSON.stringify({
    parsedFiles: files.length,
    failures,
    applicationCodeExecuted: false,
    outputFilesWritten: false,
  })
);
assert.equal(failures.length, 0, "overlaid source must parse before functional validation");
