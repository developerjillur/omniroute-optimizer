"""Install an already verified, quiescent SQLite image without a raw overwrite.

The operator must unload the owned service and retain a verified external
rollback snapshot before invoking this helper. No database is created, deleted,
renamed or copied without its existing SQLite destination transaction.
"""
from pathlib import Path
import hashlib
import os
import shutil
import sqlite3
import stat
import subprocess
import time


def file_hash(filename, canonical=False):
    digest = hashlib.sha256()
    with Path(filename).open('rb') as stream:
        header = bytearray(stream.read(100))
        if canonical:
            if header[:16] != b'SQLite format 3\0':
                raise RuntimeError('Invalid SQLite image')
            # Destination change/schema counters and last-writer version may
            # change when SQLite publishes the same backed-up page image.
            for start, end in [(24, 28), (40, 44), (92, 100)]:
                header[start:end] = b'\0' * (end - start)
        digest.update(header)
        for chunk in iter(lambda: stream.read(256 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def quiescent_regular_file(filename):
    p = Path(filename).absolute()
    info = p.lstat()
    if not stat.S_ISREG(info.st_mode):
        raise RuntimeError('An existing regular SQLite file is required')
    for suffix in ['-wal', '-journal']:
        sidecar = Path(str(p) + suffix)
        if sidecar.exists() and sidecar.stat().st_size:
            raise RuntimeError('An uncheckpointed journal prevents installation')
    result = subprocess.run(['/usr/sbin/lsof', '-t', str(p)], capture_output=True, text=True)
    if result.returncode not in (0, 1) or result.stdout.strip():
        raise RuntimeError('An open database handle prevents installation')
    return p, info


def checkpoint_owned_image(filename, allowed_root):
    root = Path(allowed_root).resolve()
    work = Path('/Volumes/NexaWork/Work')
    p = Path(filename).absolute()
    if not os.path.ismount('/Volumes/NexaWork') or not root.is_relative_to(work) or not p.is_relative_to(root):
        raise RuntimeError('Only the owned external migration image may be checkpointed')
    if p.resolve() != p or p.is_symlink():
        raise RuntimeError('The migration image may not redirect elsewhere')
    before = p.lstat()
    if not stat.S_ISREG(before.st_mode) or before.st_uid != os.getuid():
        raise RuntimeError('An owned regular migration image is required')
    handles = subprocess.run(['/usr/sbin/lsof', '-t', str(p)], capture_output=True, text=True)
    if handles.returncode != 1 or handles.stdout.strip():
        raise RuntimeError('An open migration image may not be checkpointed')
    journal = Path(str(p) + '-journal')
    if journal.exists() and journal.stat().st_size:
        raise RuntimeError('An unfinished rollback journal requires recovery first')
    wal = Path(str(p) + '-wal')
    wal_before = wal.stat().st_size if wal.exists() else 0
    db = sqlite3.connect(p.as_uri() + '?mode=rw', uri=True, timeout=2)
    try:
        db.execute('PRAGMA cache_size=-1024')
        db.execute('PRAGMA mmap_size=0')
        mode = db.execute('PRAGMA journal_mode').fetchone()[0]
        if mode not in ('wal', 'delete'):
            raise RuntimeError('Unreviewed migration image journal mode')
        result = db.execute('PRAGMA wal_checkpoint(TRUNCATE)').fetchone()
        if result[0] != 0 or db.execute('PRAGMA journal_mode').fetchone()[0] != mode:
            raise RuntimeError('The migration image could not checkpoint cleanly')
    finally:
        db.close()
    _, after = quiescent_regular_file(p)
    identity = lambda value: (value.st_dev, value.st_ino, value.st_uid, value.st_gid, stat.S_IMODE(value.st_mode))
    if identity(before) != identity(after):
        raise RuntimeError('Checkpoint changed the migration image identity')
    return {'status': 'PASS', 'walBytesBefore': wal_before,
            'walBytesAfter': wal.stat().st_size if wal.exists() else 0,
            'journalModePreserved': mode, 'pathAndInodePreserved': True,
            'liveDatabaseTouched': False}


def install(source, destination, expected_source_sha256, progress=None):
    source, source_stat = quiescent_regular_file(source)
    destination, before = quiescent_regular_file(destination)
    if (source_stat.st_dev, source_stat.st_ino) == (before.st_dev, before.st_ino):
        raise RuntimeError('Source and destination must be separate files')
    if file_hash(source) != expected_source_sha256:
        raise RuntimeError('The source checksum differs from its reviewed receipt')
    expected_image = file_hash(source, canonical=True)
    disk = shutil.disk_usage(destination.parent)
    journal_reserve = source_stat.st_size + max(0, source_stat.st_size - before.st_size) + 128 * 1024**2
    if disk.free - journal_reserve < 20 * 1024**3:
        raise RuntimeError('Insufficient space for a fully journaled installation')
    if before.st_dev in {os.stat('/').st_dev, os.stat(Path.home()).st_dev} and disk.used + journal_reserve >= 400_000_000_000:
        raise RuntimeError('The internal-disk hard limit would be exceeded')

    incoming = sqlite3.connect(source.as_uri() + '?mode=ro', uri=True)
    outgoing = sqlite3.connect(destination.as_uri() + '?mode=rw', uri=True, timeout=2)
    started = time.monotonic()
    try:
        for connection in [incoming, outgoing]:
            connection.execute('PRAGMA cache_size=-1024')
            connection.execute('PRAGMA mmap_size=0')
        source_mode = incoming.execute('PRAGMA journal_mode').fetchone()[0]
        destination_mode = outgoing.execute('PRAGMA journal_mode').fetchone()[0]
        if source_mode != destination_mode:
            raise RuntimeError('Preserve the destination journal mode')
        if incoming.execute('PRAGMA page_size').fetchone() != outgoing.execute('PRAGMA page_size').fetchone():
            raise RuntimeError('Preserve the destination SQLite page size')
        if incoming.execute('PRAGMA integrity_check').fetchone()[0] != 'ok':
            raise RuntimeError('The migrated image is not valid SQLite')

        def on_progress(status, remaining, total):
            if status in (getattr(sqlite3, "SQLITE_BUSY", 5), getattr(sqlite3, "SQLITE_LOCKED", 6)):
                raise RuntimeError('A concurrent database handle prevents installation')
            if time.monotonic() - started > 1200:
                raise TimeoutError('Database installation exceeded its bounded window')
            if progress:
                progress(status, remaining, total)

        incoming.backup(outgoing, pages=64, progress=on_progress, sleep=0.01)
        if outgoing.execute('PRAGMA integrity_check').fetchone()[0] != 'ok':
            raise RuntimeError('Installed database integrity failed')
        if outgoing.execute('PRAGMA journal_mode').fetchone()[0] != destination_mode:
            raise RuntimeError('The destination journal mode changed')
        if destination_mode == 'wal':
            checkpoint = outgoing.execute('PRAGMA wal_checkpoint(TRUNCATE)').fetchone()
            if checkpoint[0] != 0:
                raise RuntimeError('The installed image did not checkpoint cleanly')
    finally:
        incoming.close()
        outgoing.close()

    after = destination.stat()
    if (before.st_dev, before.st_ino, before.st_uid, before.st_gid, stat.S_IMODE(before.st_mode)) != (
        after.st_dev, after.st_ino, after.st_uid, after.st_gid, stat.S_IMODE(after.st_mode)
    ):
        raise RuntimeError('The database path metadata changed')
    if file_hash(source) != expected_source_sha256 or file_hash(destination, canonical=True) != expected_image:
        raise RuntimeError('The installed page image differs from the verified source')
    return {'databaseIntegrity': 'ok', 'pathAndInodePreserved': True,
            'permissionsAndOwnerPreserved': True, 'sourceSHA256': expected_source_sha256,
            'installedSHA256': file_hash(destination), 'canonicalImageSHA256': expected_image,
            'journalMode': destination_mode, 'transactionalBackupAPI': True}
