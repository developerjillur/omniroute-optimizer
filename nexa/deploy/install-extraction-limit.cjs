"use strict";

const path = require("node:path");
const fs = require("node:fs");
const { createRequire } = require("node:module");

function createLimitedExtraction(extract, limit) {
  if (
    typeof extract !== "function" ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 2
  )
    throw new Error("Installation extraction concurrency must be 1..2");
  const waiting = [];
  let active = 0;
  const drain = () => {
    while (active < limit && waiting.length) {
      const item = waiting.shift();
      active += 1;
      const finish = () => {
        active -= 1;
        drain();
      };
      Promise.resolve()
        .then(() => Reflect.apply(extract, item.receiver, item.args))
        .then(
          (value) => {
            item.resolve(value);
            finish();
          },
          (error) => {
            item.reject(error);
            finish();
          },
        );
    }
  };
  return function limitedExtraction(...args) {
    return new Promise((resolve, reject) => {
      waiting.push({ receiver: this, args, resolve, reject });
      drain();
    });
  };
}

const npmPackage = process.env.NEXA_INSTALL_NPM_PACKAGE_JSON;
const requested = process.env.NEXA_INSTALL_EXTRACT_CONCURRENCY;
if (requested !== undefined && npmPackage && process.argv[1]) {
  const cli = path.join(path.dirname(npmPackage), "bin/npm-cli.js");
  if (path.resolve(process.argv[1]) === cli) {
    const limit = Number(requested);
    const requireNpm = createRequire(npmPackage);
    const pacote = requireNpm("pacote");
    pacote.extract = createLimitedExtraction(pacote.extract, limit);
    const version = JSON.parse(fs.readFileSync(npmPackage, "utf8")).version;
    process.stderr.write(
      JSON.stringify({
        phase: "bounded-package-extraction",
        concurrency: limit,
        npm: version,
      }) + "\n",
    );
  }
}

module.exports = { createLimitedExtraction };
