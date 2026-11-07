#!/usr/bin/env python3
"""Read-only promotion gate for configuration affected by upstream migration 207."""
import argparse
import json
import pathlib
import sqlite3
import time


def check(database):
    database = pathlib.Path(database).resolve(strict=True)
    deadline = time.monotonic() + 2
    connection = sqlite3.connect(database.as_uri() + "?mode=ro", uri=True, timeout=1)
    try:
        connection.execute("PRAGMA query_only=ON")
        connection.execute("PRAGMA cache_size=-128")
        connection.execute("PRAGMA mmap_size=0")
        connection.set_progress_handler(lambda: int(time.monotonic() > deadline), 1000)
        queries = {
            "provider_connections": "SELECT COUNT(*) FROM provider_connections WHERE provider IN ('opencode','oc')",
            "registered_keys": "SELECT COUNT(*) FROM registered_keys WHERE provider IN ('opencode','oc')",
            "provider_key_limits": "SELECT COUNT(*) FROM provider_key_limits WHERE provider IN ('opencode','oc')",
            "discovery_results": "SELECT COUNT(*) FROM discovery_results WHERE provider_id IN ('opencode','oc')",
            "key_value": """SELECT COUNT(*) FROM key_value
                WHERE (namespace IN ('customModels','modelCompatOverrides','providerAliases') AND key IN ('opencode','oc'))
                OR (namespace='syncedAvailableModels' AND (substr(key,1,9)='opencode:' OR substr(key,1,3)='oc:'))""",
        }
        counts = {name: connection.execute(query).fetchone()[0] for name, query in queries.items()}
        return {"readOnly": True, "migration": "207_remove_opencode_free_provider",
                "affectedCounts": counts, "safeToPromote": all(value == 0 for value in counts.values()),
                "privateValuesExported": False}
    finally:
        connection.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--database", required=True)
    arguments = parser.parse_args()
    try:
        receipt = check(arguments.database)
    except (OSError, sqlite3.Error):
        print(json.dumps({"readOnly": True, "safeToPromote": False, "error": "Cannot complete the read-only configuration inventory"}))
        raise SystemExit(2)
    print(json.dumps(receipt, indent=2))
    raise SystemExit(0 if receipt["safeToPromote"] else 2)
