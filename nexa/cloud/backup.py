#!/usr/bin/env python3
"""Create a consistent private database and environment backup with bounded retention."""
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import re
import shutil
import sqlite3

ROOT = Path("/opt/nexaomni")
BACKUPS = ROOT / "backups"
BACKUPS.mkdir(mode=0o700, exist_ok=True)
os.chmod(BACKUPS, 0o700)
name = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
directory = BACKUPS / name
directory.mkdir(mode=0o700)
source = sqlite3.connect((ROOT / "data/storage.sqlite").as_uri() + "?mode=ro", uri=True, timeout=10)
target = sqlite3.connect(directory / "storage.sqlite")
try:
    source.backup(target, pages=512, sleep=0.05)
    if target.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
        raise RuntimeError("Backup integrity check failed")
finally:
    source.close()
    target.close()
shutil.copyfile(ROOT / "private/runtime.env", directory / "runtime.env")
(directory / "receipt.json").write_text(json.dumps({"deployment": "nexaomni", "integrity": "ok"}) + "\n")
for path in directory.iterdir():
    os.chmod(path, 0o600)
# Only this deployment's generated backup directories qualify for retention.
expired = sorted(path for path in BACKUPS.iterdir() if path.is_dir() and not path.is_symlink()
                 and re.fullmatch(r"\d{8}T\d{6}Z", path.name)
                 and (path / "receipt.json").is_file()
                 and json.loads((path / "receipt.json").read_text()).get("deployment") == "nexaomni")[:-7]
for path in expired:
    print(json.dumps({"expiredBackup": str(path), "action": "remove"}), flush=True)
    shutil.rmtree(path)
print(json.dumps({"backup": str(directory), "integrity": "ok", "retained": 7}))
