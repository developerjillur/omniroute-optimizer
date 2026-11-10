import importlib.util
from pathlib import Path
import tempfile
import sqlite3
from types import SimpleNamespace
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('snapshot_local', Path(__file__).with_name('snapshot-local.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class SnapshotConfigurationTest(unittest.TestCase):
    def test_a_closed_database_can_be_read_without_creating_journal_sidecars(self):
        root = Path(tempfile.mkdtemp(prefix='snapshot-closed-db-'))
        database = root / 'storage.sqlite'
        with sqlite3.connect(database) as db:
            db.execute('CREATE TABLE retained(value TEXT)')
            db.execute("INSERT INTO retained VALUES ('preserved')")
        before = set(root.iterdir())
        with patch.object(module.subprocess, 'run', return_value=SimpleNamespace(returncode=1, stdout='')):
            uri = module.quiescent_database_uri(database)
        with sqlite3.connect(uri, uri=True) as db:
            self.assertEqual(db.execute('SELECT value FROM retained').fetchone()[0], 'preserved')
        self.assertEqual(set(root.iterdir()), before)

    def test_nonempty_journals_and_active_handles_reject_immutable_snapshots(self):
        root = Path(tempfile.mkdtemp(prefix='snapshot-active-db-'))
        database = root / 'storage.sqlite'
        database.write_bytes(b'fixture')
        wal = root / 'storage.sqlite-wal'
        wal.write_bytes(b'uncheckpointed transaction')
        with self.assertRaisesRegex(RuntimeError, 'nonempty journal'):
            module.quiescent_database_uri(database)
        wal.write_bytes(b'')
        with patch.object(module.subprocess, 'run', return_value=SimpleNamespace(returncode=0, stdout='12345\n')):
            with self.assertRaisesRegex(RuntimeError, 'Open database handles'):
                module.quiescent_database_uri(database)

    def test_configuration_is_preserved_but_stale_pid_is_not_restored(self):
        root = Path(tempfile.mkdtemp(prefix='snapshot-config-'))
        source, target = root / 'source', root / 'snapshot'
        source.mkdir()
        (source / 'ca.key').write_bytes(b'synthetic private certificate fixture')
        (source / 'targets.json').write_bytes(b'{"route":"fixture"}')
        (source / '.mitm.pid').write_text('12345')
        module.copy_mitm_configuration(source, target)
        self.assertEqual((target / 'ca.key').read_bytes(), (source / 'ca.key').read_bytes())
        self.assertEqual((target / 'targets.json').read_bytes(), (source / 'targets.json').read_bytes())
        self.assertFalse((target / '.mitm.pid').exists())
        self.assertEqual((source / '.mitm.pid').read_text(), '12345')

    def test_a_pid_disappearing_during_directory_discovery_does_not_break_snapshot(self):
        root = Path(tempfile.mkdtemp(prefix='snapshot-pid-race-'))
        source, target = root / 'source', root / 'snapshot'
        source.mkdir()
        (source / '.mitm.pid').write_text('12345')
        (source / 'ca.crt').write_bytes(b'synthetic certificate')
        ignore_patterns = module.shutil.ignore_patterns

        def disappearing_pid(*patterns):
            original = ignore_patterns(*patterns)

            def ignore(directory, names):
                if '.mitm.pid' in names:
                    (Path(directory) / '.mitm.pid').unlink()
                return original(directory, names)

            return ignore

        with patch.object(module.shutil, 'ignore_patterns', side_effect=disappearing_pid):
            module.copy_mitm_configuration(source, target)
        self.assertEqual((target / 'ca.crt').read_bytes(), b'synthetic certificate')
        self.assertFalse((target / '.mitm.pid').exists())


if __name__ == '__main__':
    unittest.main()
