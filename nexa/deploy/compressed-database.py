"""Checksum-verified gzip copies for an exclusively held, stopped SQLite database.

The caller must first prove that all database handles are closed. These helpers
reject nonempty WAL/journals and preserve destination paths and inodes. They
never remove source files, journals, snapshots, or rejected data.
"""
from pathlib import Path
import gzip
import hashlib
import os
import sqlite3


CHUNK_BYTES = 1024 * 1024
SCRATCH_RESERVE_BYTES = 2 * 2**30


def sha_file(filename):
    digest = hashlib.sha256()
    with Path(filename).open("rb") as stream:
        for chunk in iter(lambda: stream.read(CHUNK_BYTES), b""):
            digest.update(chunk)
    return digest.hexdigest()


def clean_database(filename):
    database = Path(filename)
    for suffix in ["-wal", "-journal"]:
        journal = Path(str(database) + suffix)
        if journal.exists() and journal.stat().st_size:
            raise RuntimeError("Nonempty database journal prevents quiescent copy")
    return database


def verify(archive, metadata):
    digest = hashlib.sha256()
    size = 0
    with gzip.open(archive, "rb") as stream:
        for chunk in iter(lambda: stream.read(CHUNK_BYTES), b""):
            digest.update(chunk)
            size += len(chunk)
    if digest.hexdigest() != metadata["sha256"] or size != metadata["bytes"]:
        raise RuntimeError("Compressed database checksum mismatch")
    return True


def compress(source, archive):
    source = clean_database(source)
    archive = Path(archive)
    if archive.exists():
        raise FileExistsError("Preserve the previous compressed snapshot")
    before = source.stat()
    digest = hashlib.sha256()
    size = 0
    with source.open("rb") as incoming, archive.open("xb") as raw:
        os.chmod(archive, 0o600)
        with gzip.GzipFile(fileobj=raw, mode="wb", compresslevel=1, mtime=0) as outgoing:
            for chunk in iter(lambda: incoming.read(CHUNK_BYTES), b""):
                disk = os.statvfs(archive.parent)
                if disk.f_bavail * disk.f_frsize < SCRATCH_RESERVE_BYTES:
                    raise RuntimeError("Scratch reserve would fall below 2 GiB")
                digest.update(chunk)
                size += len(chunk)
                outgoing.write(chunk)
        raw.flush()
        os.fsync(raw.fileno())
    after = source.stat()
    if (before.st_ino, before.st_size, before.st_mtime_ns) != (
        after.st_ino, after.st_size, after.st_mtime_ns
    ):
        raise RuntimeError("Stopped database changed while copying")
    metadata = {
        "sha256": digest.hexdigest(),
        "bytes": size,
        "compressedBytes": archive.stat().st_size,
        "compression": "gzip-level-1",
        "sourceQuiescent": True,
    }
    verify(archive, metadata)
    return metadata


def restore(archive, destination, metadata):
    # Validate the complete stream before changing the stopped destination.
    verify(archive, metadata)
    destination = clean_database(destination)
    if not destination.is_file() or destination.is_symlink():
        raise RuntimeError("Restore requires the existing regular database file")
    before = destination.stat()
    with gzip.open(archive, "rb") as incoming, destination.open("r+b") as outgoing:
        for chunk in iter(lambda: incoming.read(CHUNK_BYTES), b""):
            outgoing.write(chunk)
        outgoing.truncate(metadata["bytes"])
        outgoing.flush()
        os.fsync(outgoing.fileno())
    if destination.stat().st_ino != before.st_ino:
        raise RuntimeError("Database inode changed during restore")
    if sha_file(destination) != metadata["sha256"]:
        raise RuntimeError("Restored database checksum mismatch")
    connection = sqlite3.connect(destination.as_uri() + "?mode=ro&immutable=1", uri=True)
    try:
        if connection.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
            raise RuntimeError("Restored database integrity failed")
    finally:
        connection.close()
    return {
        "databaseIntegrity": "ok",
        "bytesRestored": metadata["bytes"],
        "pathAndInodePreserved": True,
    }
