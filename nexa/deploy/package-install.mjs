import path from "node:path";

export function packageInstallArgs(prefix, archive) {
  return [
    "install",
    "-g",
    "--prefix",
    prefix,
    "--no-fund",
    "--no-audit",
    // Global installs ignore the project .npmrc used by the pinned build.
    "--legacy-peer-deps",
    path.resolve(archive),
  ];
}

export function packageInstallEnvironment(env = process.env) {
  const options = (env.NODE_OPTIONS || "")
    .replace(/--max[-_]old[-_]space[-_]size(?:=|\s+)\d+/g, "")
    .trim();
  return {
    ...env,
    NODE_OPTIONS: `${options} --max-old-space-size=1024`.trim(),
    npm_config_maxsockets: "2",
    npm_config_foreground_scripts: "true",
  };
}
