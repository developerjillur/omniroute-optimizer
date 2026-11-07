import { execFileSync } from "node:child_process";
import path from "node:path";

export function inspectNativeUsageSchema(data) {
  const nativeUsageSchema = JSON.parse(
    execFileSync(
      "python3",
      [
        "-c",
        "import sqlite3,json,sys; c=sqlite3.connect('file:'+sys.argv[1]+'?mode=ro',uri=True); print(json.dumps({'columns':[r[1] for r in c.execute('PRAGMA table_info(call_logs)')],'migration':c.execute(\"SELECT name FROM _omniroute_migrations WHERE version='legacy-197-native_claude_cache_details'\").fetchone()}))",
        path.join(data, "storage.sqlite"),
      ],
      { encoding: "utf8" }
    )
  );
  if (
    !nativeUsageSchema.migration ||
    nativeUsageSchema.migration[0] !== "native_claude_cache_details" ||
    [
      "tokens_cache_creation_5m",
      "tokens_cache_creation_1h",
      "native_session_tag",
      "native_cache_group_tag",
    ].some((column) => !nativeUsageSchema.columns.includes(column))
  )
    throw Error("Isolated installed package did not apply native usage migration 197");
  return nativeUsageSchema;
}
