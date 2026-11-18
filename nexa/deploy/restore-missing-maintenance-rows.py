"""Restore startup-pruned records without replacing any newer live value."""
from pathlib import Path
import sqlite3
import stat

TABLES = {'audit_log': None, 'proxy_logs': None, 'key_value': 'session_account_affinity'}

def restore(source, destination, tables=None, after_table=None):
    source, destination = [Path(p).absolute() for p in [source, destination]]
    assert source.is_file() and destination.is_file() and not source.is_symlink() and not destination.is_symlink()
    assert source.stat().st_ino != destination.stat().st_ino or source.stat().st_dev != destination.stat().st_dev
    selected = list(TABLES) if tables is None else list(tables)
    assert selected and set(selected).issubset(TABLES), 'Only reviewed maintenance tables can be restored'
    before = destination.stat()
    db = sqlite3.connect(destination.as_uri() + '?mode=rw', uri=True, timeout=2)
    quote = lambda value: '"' + value.replace('"', '""') + '"'
    result = {}
    try:
        db.execute('PRAGMA cache_size=-1024')
        db.execute('PRAGMA mmap_size=0')
        db.execute('ATTACH DATABASE ? AS saved', (source.as_uri() + '?mode=ro',))
        db.execute('BEGIN IMMEDIATE')
        for table in selected:
            info = db.execute('PRAGMA saved.table_info(' + quote(table) + ')').fetchall()
            current = db.execute('PRAGMA main.table_info(' + quote(table) + ')').fetchall()
            assert info and current
            columns = [row[1] for row in info]
            assert set(columns).issubset(row[1] for row in current)
            primary = [row[1] for row in sorted(info, key=lambda row: row[5]) if row[5]]
            assert primary, 'Restore requires a stable declared row identity'
            match = ' AND '.join('present.' + quote(key) + ' IS original.' + quote(key) for key in primary)
            eligibility = '' if TABLES[table] is None else "original.namespace = 'session_account_affinity' AND "
            missing = 'SELECT ' + ','.join('original.' + quote(col) for col in columns) + ' FROM saved.' + quote(table) + ' original WHERE ' + eligibility + 'NOT EXISTS (SELECT 1 FROM main.' + quote(table) + ' present WHERE ' + match + ')'
            db.execute('INSERT OR IGNORE INTO main.' + quote(table) + '(' + ','.join(map(quote, columns)) + ') ' + missing)
            inserted = db.execute('SELECT changes()').fetchone()[0]
            assert db.execute('SELECT COUNT(*) FROM (' + missing + ')').fetchone()[0] == 0, 'A conflicting live record prevents complete restoration'
            result[table] = inserted
            if after_table:
                after_table(table)
        db.commit()
    except BaseException:
        db.rollback()
        raise
    finally:
        db.close()
    after = destination.stat()
    assert (before.st_dev, before.st_ino, before.st_uid, before.st_gid, stat.S_IMODE(before.st_mode)) == (after.st_dev, after.st_ino, after.st_uid, after.st_gid, stat.S_IMODE(after.st_mode))
    return {'status': 'PASS', 'restoredMissingRows': result, 'existingValuesOverwritten': False,
            'newerRowsRetained': True, 'databasePathAndInodePreserved': True}
