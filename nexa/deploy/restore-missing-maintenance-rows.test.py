from pathlib import Path
import importlib.util
import sqlite3
import os
import json
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('restore', Path(__file__).with_name('restore-missing-maintenance-rows.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class RestoreTests(unittest.TestCase):
    def setUp(self):
        self.directory = Path(tempfile.mkdtemp(prefix='maintenance-restore-', dir=Path(os.environ['NEXA_SQLITE_TEST_ROOT'])))
        assert self.directory.resolve().is_relative_to(Path('/Volumes/NexaWork/Work'))
        print(json.dumps({'syntheticDatabaseDirectory':str(self.directory)}),flush=True)
        self.old, self.live = [self.directory / name for name in ['source.sqlite', 'destination.sqlite']]
        for filename in [self.old, self.live]:
            db = sqlite3.connect(filename)
            db.executescript('CREATE TABLE audit_log(id INTEGER PRIMARY KEY,value TEXT); CREATE TABLE proxy_logs(id INTEGER PRIMARY KEY,value TEXT); CREATE TABLE key_value(namespace TEXT,key TEXT,value TEXT,PRIMARY KEY(namespace,key));')
            db.commit()
            db.close()
        db = sqlite3.connect(self.old)
        db.executescript("INSERT INTO audit_log VALUES(1,'old missing'),(2,'old snapshot'); INSERT INTO proxy_logs VALUES(1,'old proxy'); INSERT INTO key_value VALUES('session_account_affinity','pin','evidence'),('settings','deleted-by-user','do not revive');")
        db.commit(); db.close()
        db = sqlite3.connect(self.live)
        db.executescript("INSERT INTO audit_log VALUES(2,'newer value'),(3,'new user row');")
        db.commit(); db.close()

    def test_missing_rows_return_and_newer_values_remain(self):
        result = module.restore(self.old, self.live)
        self.assertEqual(result['restoredMissingRows'], {'audit_log': 1, 'proxy_logs': 1, 'key_value': 1})
        db = sqlite3.connect(self.live)
        self.assertEqual(db.execute('SELECT * FROM audit_log ORDER BY id').fetchall(), [(1, 'old missing'), (2, 'newer value'), (3, 'new user row')])
        self.assertEqual(db.execute("SELECT COUNT(*) FROM key_value WHERE namespace='settings'").fetchone()[0], 0)
        db.close()
        self.assertEqual(sum(module.restore(self.old, self.live)['restoredMissingRows'].values()), 0)

    def test_interruption_rolls_back_all_inserts(self):
        def fail(_):
            raise InterruptedError('synthetic interrupted maintenance')
        with self.assertRaises(InterruptedError):
            module.restore(self.old, self.live, after_table=fail)
        db = sqlite3.connect(self.live)
        self.assertEqual(db.execute('SELECT id FROM audit_log ORDER BY id').fetchall(), [(2,), (3,)])
        self.assertEqual(db.execute('SELECT COUNT(*) FROM proxy_logs').fetchone()[0], 0)
        db.close()

    def test_unreviewed_table_is_refused(self):
        with self.assertRaises(AssertionError):
            module.restore(self.old, self.live, ['provider_connections'])

if __name__ == '__main__':
    unittest.main()
