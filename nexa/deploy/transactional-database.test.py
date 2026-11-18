from pathlib import Path
import importlib.util
import json
import os
import shutil
import sqlite3
import tempfile
import unittest

j = Path(__file__).resolve().parent
scratch = Path(os.environ['NEXA_SQLITE_TEST_ROOT']).resolve()
assert scratch.is_relative_to(Path('/Volumes/NexaWork/Work')) and scratch.is_dir()
spec = importlib.util.spec_from_file_location('transactional_database', j / 'transactional-database.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class Checkpoint(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(dir=scratch)
        self.root = Path(self.temporary.name)
        print(json.dumps({'syntheticDatabaseDirectory': str(self.root)}), flush=True)

    def tearDown(self):
        self.temporary.cleanup()

    def image_with_wal(self):
        source = self.root / 'writer.sqlite'
        writer = sqlite3.connect(source)
        writer.execute('PRAGMA journal_mode=WAL')
        writer.execute('PRAGMA wal_autocheckpoint=0')
        writer.execute('CREATE TABLE rows(id INTEGER PRIMARY KEY, value TEXT)')
        writer.execute('INSERT INTO rows VALUES(1,\'retained-newest-value\')')
        writer.commit()
        target = self.root / 'migration.sqlite'
        shutil.copyfile(source, target)
        shutil.copyfile(Path(str(source) + '-wal'), Path(str(target) + '-wal'))
        writer.close()
        target.chmod(0o600)
        return target

    def test_uncheckpointed_image_is_refused_then_checkpoint_preserves_latest_rows(self):
        target = self.image_with_wal()
        inode = target.stat().st_ino
        with self.assertRaisesRegex(RuntimeError, 'uncheckpointed'):
            module.quiescent_regular_file(target)
        result = module.checkpoint_owned_image(target, scratch)
        self.assertGreater(result['walBytesBefore'], 0)
        self.assertEqual(result['walBytesAfter'], 0)
        self.assertEqual(target.stat().st_ino, inode)
        db = sqlite3.connect(target)
        self.assertEqual(db.execute('SELECT value FROM rows WHERE id=1').fetchone()[0], 'retained-newest-value')
        db.close()

    def test_open_image_is_refused_without_changing_its_values(self):
        target = self.image_with_wal()
        reader = sqlite3.connect(target)
        reader.execute('SELECT * FROM rows').fetchall()
        with self.assertRaisesRegex(RuntimeError, 'open migration image'):
            module.checkpoint_owned_image(target, scratch)
        self.assertEqual(reader.execute('SELECT COUNT(*) FROM rows').fetchone()[0], 1)
        reader.close()

    def test_checkpointed_image_installs_without_changing_existing_destination_inode(self):
        target = self.image_with_wal()
        module.checkpoint_owned_image(target, scratch)
        destination = self.root / 'destination.sqlite'
        db = sqlite3.connect(destination)
        db.execute('PRAGMA journal_mode=WAL')
        db.execute('CREATE TABLE old(value TEXT)')
        db.execute('INSERT INTO old VALUES(\'old\')')
        db.commit()
        db.close()
        inode = destination.stat().st_ino
        result = module.install(target, destination, module.file_hash(target))
        self.assertTrue(result['pathAndInodePreserved'])
        self.assertEqual(destination.stat().st_ino, inode)
        db = sqlite3.connect(destination)
        self.assertEqual(db.execute('SELECT value FROM rows').fetchone()[0], 'retained-newest-value')
        db.close()


if __name__ == '__main__':
    result = unittest.TextTestRunner(verbosity=1).run(unittest.defaultTestLoader.loadTestsFromTestCase(Checkpoint))
    receipt = {'status': 'PASS' if result.wasSuccessful() else 'FAIL', 'tests': result.testsRun,
               'failures': len(result.failures), 'errors': len(result.errors), 'liveChanged': False}
    print(json.dumps(receipt), flush=True)
    raise SystemExit(0 if result.wasSuccessful() else 1)
