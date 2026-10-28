#!/usr/bin/env python3
"""Export a private, consistent SQLite snapshot into an independent cloud configuration."""
import argparse
import json
import os
from pathlib import Path
import sqlite3

TABLES = {
    "provider_connections", "provider_nodes", "combos", "key_value",
    "_omniroute_migrations", "db_meta", "domain_fallback_chains",
    "provider_key_limits", "model_combo_mappings", "model_context_overrides",
    "model_capability_overrides", "reasoning_routing_rules", "auto_candidate_overrides",
    "provider_plans", "provider_quota_state", "model_intelligence", "tier_config",
    "compression_combos", "compression_combo_assignments", "quota_schedules",
    "quota_groups", "quota_pools", "quota_allocations", "quota_pool_connections",
    "quota_allocation_model_caps", "quota_consumption",
}
LOCAL_NAMESPACES = {
    "native_claude_thread_owners", "gemini_thought_signatures",
    "session_account_affinity", "scheduler", "apiKeySelfService",
    "gamification:streaks", "arena_elo",
}


def prepare(snapshot, destination):
    snapshot = Path(snapshot).resolve(strict=True)
    destination = Path(destination).resolve()
    if destination == snapshot:
        raise ValueError("Snapshot and destination must differ")
    if snapshot.with_name(snapshot.name + "-wal").exists():
        raise ValueError("Use a completed SQLite backup, not a live WAL database")
    # Immutable is safe only for this completed backup, never for the live WAL database.
    source = sqlite3.connect(snapshot.as_uri() + "?mode=ro&immutable=1", uri=True)
    source.row_factory = sqlite3.Row
    fd = os.open(destination, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    os.close(fd)
    target = sqlite3.connect(destination)
    try:
        shadows = {row[1] for row in source.execute("PRAGMA table_list") if row[2] == "shadow"}
        objects = source.execute(
            "SELECT type,name,sql FROM sqlite_master WHERE sql IS NOT NULL ORDER BY rowid"
        ).fetchall()
        for row in objects:
            if row["type"] == "table" and row["name"] not in shadows and not row["name"].startswith("sqlite_"):
                target.execute(row["sql"])
        counts = {}
        available = {row["name"] for row in objects if row["type"] == "table"}
        for table in sorted(TABLES & available):
            rows = source.execute('SELECT * FROM "' + table + '"').fetchall()
            if table == "key_value":
                rows = [row for row in rows if row["namespace"] not in LOCAL_NAMESPACES]
            if rows:
                columns = list(rows[0].keys())
                query = ('INSERT INTO "' + table + '" (' + ','.join('"' + column + '"' for column in columns)
                         + ') VALUES (' + ','.join('?' for _ in columns) + ')')
                target.executemany(query, [tuple(row) for row in rows])
            counts[table] = len(rows)
        for row in objects:
            if row["type"] in {"index", "trigger", "view"} and row["name"] not in shadows:
                target.execute(row["sql"])
        # Rotating refresh tokens cannot safely be shared with the running local gateway.
        for provider in ("claude", "codex"):
            target.execute(
                "UPDATE provider_connections SET is_active=0,access_token=NULL,refresh_token=NULL,"
                "id_token=NULL,provider_specific_data=NULL,expires_at=NULL,token_expires_at=NULL,test_status=?,last_error=? WHERE provider=?",
                ("unavailable", "Independent cloud login required; local rotating credentials were not copied.", provider),
            )
        for key, value in {"requireLogin": True, "setupComplete": True, "cloudEnabled": False}.items():
            target.execute("INSERT OR REPLACE INTO key_value(namespace,key,value) VALUES(?,?,?)",
                           ("settings", key, json.dumps(value)))
        target.commit()
        integrity = target.execute("PRAGMA integrity_check").fetchone()[0]
        if integrity != "ok":
            raise ValueError("Configuration integrity check failed")
        return {"copiedCounts": counts, "independentLoginRequired": ["claude", "codex"], "integrity": integrity}
    finally:
        source.close()
        target.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--snapshot", required=True)
    parser.add_argument("--destination", required=True)
    arguments = parser.parse_args()
    print(json.dumps(prepare(arguments.snapshot, arguments.destination)))
