#!/usr/bin/env python3
"""Create a private, consistent local backup without logging credential values."""
from pathlib import Path
import sys, sqlite3, shutil, json, subprocess, importlib.util

module_path = Path(__file__).resolve().parent / "compressed-database.py"
spec = importlib.util.spec_from_file_location("compressed_database", module_path)
compressed = importlib.util.module_from_spec(spec)
spec.loader.exec_module(compressed)


def copy_mitm_configuration(source, target):
    # The PID record is transient process bookkeeping. It can disappear during
    # bounded shutdown and must never be restored as configuration.
    shutil.copytree(source, target, ignore=shutil.ignore_patterns('.mitm.pid'))


def quiescent_database_uri(database):
    journals = [Path(str(database) + suffix) for suffix in ('-wal', '-journal')]
    if any(p.exists() and p.stat().st_size for p in journals):
        raise RuntimeError('A nonempty journal prevents an immutable stopped-data snapshot')
    handles = subprocess.run(['/usr/sbin/lsof', '-t', str(database)], capture_output=True, text=True)
    if handles.returncode not in (0, 1) or handles.stdout.strip():
        raise RuntimeError('Open database handles prevent a stopped-data snapshot')
    return database.as_uri() + '?mode=ro&immutable=1'


def snapshot(home, target, quiescent=False):
    target.mkdir(mode=0o700, parents=True, exist_ok=False)
    sources = [home/'.omniroute-local/.env', home/'.omniroute-local/bridge-upstream-dns.cjs', home/'Library/LaunchAgents/com.nexalance.omniroute.plist', home/'Library/Application Support/Local/run/router/nginx/conf/route.api-anthropic-bridge.conf', Path('/etc/hosts'), Path('/Library/LaunchDaemons/com.nexalance.omniroute-native-ingress.plist'), Path('/Library/Application Support/OmniRoute-Native-Ingress/native-ingress.mjs'), home/'.local/bin/omni-ctl', home/'.omniroute-runtime/updater/omni-updater.sh']
    for source in sources:
        if source.is_file():
            relative = source.relative_to(home) if source.is_relative_to(home) else Path('system')/source.relative_to('/')
            dest = target/relative
            dest.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
            shutil.copyfile(source, dest)
            dest.chmod(0o600)
    certs = home/'.omniroute-local/mitm'
    if certs.is_dir():
        copy_mitm_configuration(certs, target/'.omniroute-local/mitm')
        for p in (target/'.omniroute-local/mitm').rglob('*'):
            p.chmod(0o700 if p.is_dir() else 0o600)
    db = home/'.omniroute-local/storage.sqlite'
    if db.exists():
        if not quiescent:
            raise RuntimeError('Compressed release snapshot requires a stopped database')
        uri = quiescent_database_uri(db)
        source = sqlite3.connect(uri, uri=True)
        try:
            source.execute('PRAGMA query_only=ON')
            source.execute('PRAGMA cache_size=-1024')
            source.execute('PRAGMA mmap_size=0')
            if source.execute('PRAGMA integrity_check').fetchone()[0] != 'ok':
                raise RuntimeError('Stopped database integrity failed')
        finally:
            source.close()
        metadata = compressed.compress(db, target/'storage.sqlite.gz')
        with (target/'database-compression.json').open('x') as stream:
            json.dump(metadata, stream, indent=2)
    print(json.dumps({'ok': True, 'backup': str(target), 'databaseIntegrity': 'ok'}))


if __name__ == '__main__':
    snapshot(Path.home(), Path(sys.argv[1]).resolve(), quiescent='--quiescent' in sys.argv[2:])
