#!/usr/bin/env python3
"""Create an isolated Google-only acceptance candidate without rotating live credentials."""
import argparse
from datetime import datetime, timezone
import importlib.util
import json
import os
from pathlib import Path
import shutil
import sqlite3

spec = importlib.util.spec_from_file_location("cloud_config", Path(__file__).with_name("prepare-config.py"))
config = importlib.util.module_from_spec(spec)
spec.loader.exec_module(config)


def prepare(root, destination):
    root = Path(root).resolve(strict=True)
    destination = Path(destination).resolve()
    environment = root / "private/runtime.env"
    database = root / "data/storage.sqlite"
    if not environment.is_file() or environment.stat().st_mode & 0o077:
        raise ValueError("Live environment must be private (mode 0600)")
    if not database.is_file():
        raise ValueError("Live database is missing")
    if destination.exists():
        raise ValueError("Candidate destination must be new")
    for protected in [root / "data", root / "private"]:
        if destination == protected or protected in destination.parents:
            raise ValueError("Candidate cannot be created inside live data or secrets")
    destination.mkdir(mode=0o700)
    data = destination / "data"
    data.mkdir(mode=0o700)
    snapshot = destination / "snapshot.sqlite"
    source = sqlite3.connect(database.as_uri() + "?mode=ro", uri=True, timeout=10)
    backup = sqlite3.connect(snapshot)
    try:
        source.backup(backup, pages=512, sleep=0.05)
        if backup.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
            raise ValueError("Snapshot integrity check failed")
    finally:
        source.close()
        backup.close()
    snapshot.chmod(0o600)
    exported = config.prepare(snapshot, data / "storage.sqlite")
    source = sqlite3.connect(snapshot.as_uri() + "?mode=ro&immutable=1", uri=True)
    target = sqlite3.connect(data / "storage.sqlite")
    try:
        # Existing private API-key records stay inside this loopback candidate.
        # No production key is created or changed.
        columns = [row[1] for row in source.execute("PRAGMA table_info(api_keys)")]
        keys = source.execute("SELECT * FROM api_keys").fetchall() if columns else []
        if keys:
            names = ",".join('"' + column.replace('"', '""') + '"' for column in columns)
            target.executemany("INSERT INTO api_keys(" + names + ") VALUES(" + ",".join("?" for _ in columns) + ")", keys)
        columns = {row[1] for row in target.execute("PRAGMA table_info(provider_connections)")}
        sensitive = {"access_token", "refresh_token", "id_token", "api_key", "provider_specific_data", "expires_at", "token_expires_at"}
        assignments = ["is_active=0", *(field + "=NULL" for field in sorted(sensitive & columns))]
        target.execute("UPDATE provider_connections SET " + ",".join(assignments) + " WHERE provider NOT IN ('antigravity','agy')")
        target.commit()
        if target.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
            raise ValueError("Candidate database integrity check failed")
        active = dict(target.execute("SELECT provider,count(*) FROM provider_connections WHERE is_active=1 GROUP BY provider"))
    finally:
        source.close()
        target.close()
    shutil.copyfile(environment, destination / "runtime.env")
    (destination / "runtime.env").chmod(0o600)
    (data / "storage.sqlite").chmod(0o600)
    if os.geteuid() == 0:
        os.chown(data, 1000, 1000)
        os.chown(data / "storage.sqlite", 1000, 1000)
    receipt = {"schema_version": "1.0", "created_at": datetime.now(timezone.utc).isoformat(),
               "integrity": "ok", "api_key_records": len(keys), "active_providers": active,
               "rotating_oauth_credentials_copied": False, "configuration_export": exported,
               "public_ingress": False, "live_database_modified": False}
    (destination / "receipt.json").write_text(json.dumps(receipt, indent=2) + "\n")
    (destination / "receipt.json").chmod(0o600)
    return receipt


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path("/opt/nexaomni"))
    parser.add_argument("--destination", type=Path, required=True)
    args = parser.parse_args()
    print(json.dumps(prepare(args.root, args.destination)))
