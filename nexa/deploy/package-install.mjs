import path from "node:path";
import { fileURLToPath } from "node:url";

export function packageInstallArgs(prefix, archive) {
  return [
    "install",
    "-g",
    "--prefix",
    prefix,
    "--no-fund",
    "--no-audit",
    "--omit=dev",
    // Global installs ignore the project .npmrc used by the pinned build.
    "--legacy-peer-deps",
    path.resolve(archive),
  ];
}

export function packageInstallEnvironment(env = process.env) {
  const heap = Number(env.NEXA_INSTALL_HEAP_MB ?? 1024);
  const sockets = Number(env.NEXA_INSTALL_MAX_SOCKETS ?? 2);
  if (!Number.isInteger(heap) || heap < 128 || heap > 1024)
    throw Error("Install heap must be 128..1024 MiB");
  if (!Number.isInteger(sockets) || sockets < 1 || sockets > 2)
    throw Error("Install connections must be 1..2");
  const extraction = env.NEXA_INSTALL_EXTRACT_CONCURRENCY;
  if (
    extraction !== undefined &&
    (!Number.isInteger(Number(extraction)) ||
      Number(extraction) < 1 ||
      Number(extraction) > 2)
  )
    throw Error("Installation extraction concurrency must be 1..2");
  const options = (env.NODE_OPTIONS || "")
    .replace(/--max[-_]old[-_]space[-_]size(?:=|\s+)\d+/g, "")
    .trim();
  return {
    ...env,
    NODE_OPTIONS:
      `${options} --max-old-space-size=${heap}${extraction === undefined ? "" : ` --require=${JSON.stringify(fileURLToPath(new URL("./install-extraction-limit.cjs", import.meta.url)))}`}`.trim(),
    npm_config_maxsockets: String(sockets),
    npm_config_foreground_scripts: "true",
  };
}
