import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { parseEnv } from "node:util";
import { pathToFileURL } from "node:url";
import { registerHooks, stripTypeScriptTypes } from "node:module";

export async function loadPackagedEncryption(packageRoot) {
  const filename = path.join(packageRoot, "src/lib/db/encryption.ts");
  const prefix = pathToFileURL(path.resolve(packageRoot) + path.sep).href;
  const hooks = registerHooks({
    resolve(specifier, context, nextResolve) {
      if (context.parentURL?.startsWith(prefix) && specifier.startsWith("@omniroute/open-sse/")) {
        const directory = path.resolve(packageRoot, "open-sse") + path.sep;
        const candidate = path.resolve(directory, specifier.slice("@omniroute/open-sse/".length));
        if (
          !candidate.startsWith(directory) ||
          !fs.statSync(candidate, { throwIfNoEntry: false })?.isFile()
        )
          throw Error(
            "Packaged streaming source import escapes or is absent from the installed package"
          );
        return nextResolve(pathToFileURL(candidate).href, context);
      }
      if (
        context.parentURL?.startsWith(prefix) &&
        specifier.startsWith(".") &&
        !path.extname(specifier)
      ) {
        const candidate = new URL(specifier + ".ts", context.parentURL);
        if (candidate.href.startsWith(prefix) && fs.existsSync(candidate)) {
          return nextResolve(candidate.href, context);
        }
      }
      return nextResolve(specifier, context);
    },
    load(url, context, nextLoad) {
      if (url.startsWith(prefix) && url.endsWith(".ts")) {
        return {
          format: "module",
          shortCircuit: true,
          source: stripTypeScriptTypes(fs.readFileSync(new URL(url), "utf8"), {
            mode: "strip",
            sourceUrl: url,
          }),
        };
      }
      return nextLoad(url, context);
    },
  });
  try {
    return await import(pathToFileURL(filename).href);
  } finally {
    hooks.deregister();
  }
}

export function selectSmokeApiKey(rows, decryptStoredKey, now = Date.now()) {
  for (const row of rows) {
    if (row.is_active !== 1 || row.is_banned || row.revoked_at) continue;
    if (row.expires_at && !(Date.parse(row.expires_at) > now)) continue;
    let scopes;
    try {
      scopes = typeof row.scopes === "string" ? JSON.parse(row.scopes) : row.scopes;
    } catch {
      continue;
    }
    if (!Array.isArray(scopes) || scopes.includes("policy:bypass-provider-quota")) continue;
    if (row.model_access_mode && row.model_access_mode !== "all") continue;
    const raw = decryptStoredKey(row.key);
    if (typeof raw !== "string" || raw.length < 20 || raw.startsWith("enc:v1:")) continue;
    // Verify a random client credential against its persisted authentication fingerprint.
    const fingerprint = createHash("sha256").update(raw).digest("hex");
    if (row.key_hash && fingerprint !== row.key_hash) continue;
    return raw;
  }
  throw Error(
    "No usable ordinary inference key is available for isolated smoke; credentials were not changed"
  );
}

export async function readSmokeApiKey(data, packageRoot) {
  const envFile = path.join(data, ".env");
  const environment = fs.existsSync(envFile) ? parseEnv(fs.readFileSync(envFile, "utf8")) : {};
  if (environment.STORAGE_ENCRYPTION_KEY) {
    process.env.STORAGE_ENCRYPTION_KEY = environment.STORAGE_ENCRYPTION_KEY;
  }
  const { decrypt, looksEncrypted } = await loadPackagedEncryption(packageRoot);
  const rows = JSON.parse(
    execFileSync(
      "/usr/bin/python3",
      [
        "-c",
        "import sqlite3,json,sys; c=sqlite3.connect('file:'+sys.argv[1]+'?mode=ro',uri=True); c.row_factory=sqlite3.Row; c.execute('PRAGMA query_only=ON'); print(json.dumps([dict(r) for r in c.execute('SELECT key,key_hash,scopes,is_active,is_banned,revoked_at,expires_at,model_access_mode FROM api_keys ORDER BY created_at,id')])) ; c.close()",
        path.join(data, "storage.sqlite"),
      ],
      { encoding: "utf8", maxBuffer: 1024 * 1024 }
    )
  );
  return selectSmokeApiKey(rows, (stored) => (looksEncrypted(stored) ? decrypt(stored) : stored));
}
