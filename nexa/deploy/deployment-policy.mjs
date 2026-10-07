import path from "node:path";
import { pathToFileURL } from "node:url";

function enabled(env, name) {
  const value = env[name] ?? "0";
  if (value !== "0" && value !== "1") throw new Error(`${name} must be 0 or 1`);
  return value === "1";
}

export function deploymentPolicy(env = process.env) {
  return {
    buildDesktop: enabled(env, "NEXA_BUILD_DESKTOP"),
    deployDesktop: enabled(env, "NEXA_DEPLOY_DESKTOP"),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const policy = deploymentPolicy();
  console.log(`${Number(policy.buildDesktop)} ${Number(policy.deployDesktop)}`);
}
