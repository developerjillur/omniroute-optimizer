import fs from "node:fs";
import path from "node:path";

export function pinPackageMigrations(packageRoot, env = process.env) {
  if (typeof env.OMNIROUTE_MIGRATIONS_DIR === "string" && env.OMNIROUTE_MIGRATIONS_DIR.trim())
    return env.OMNIROUTE_MIGRATIONS_DIR;
  const directory = path.join(packageRoot, "src", "lib", "db", "migrations");
  if (!fs.existsSync(directory) || !fs.statSync(directory).isDirectory()) return null;
  // Bundled import.meta.url can retain the build checkout. Use the installed package.
  env.OMNIROUTE_MIGRATIONS_DIR = directory;
  return directory;
}
