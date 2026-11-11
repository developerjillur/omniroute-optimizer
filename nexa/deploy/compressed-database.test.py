from pathlib import Path
import importlib.util
import os
import sqlite3
import tempfile
import unittest

spec = importlib.util.spec_from_file_location("compressed_database", Path(__file__).with_name("compressed-database.py"))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class CompressedDatabaseTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory(prefix="nexa-compressed-database-")
        self.root = Path(self.directory.name)
        self.database = self.root / "source.sqlite"
        connection = sqlite3.connect(self.database)
        connection.execute("CREATE TABLE important(value TEXT)")
        connection.execute("INSERT INTO important VALUES(?)", ("preserved " * 10000,))
        connection.commit()
        connection.close()
        self.database.chmod(0o600)
        self.original = module.sha_file(self.database)
        self.inode = self.database.stat().st_ino
        self.archive = self.root / "snapshot.sqlite.gz"
        self.metadata = module.compress(self.database, self.archive)

    def tearDown(self):
        self.directory.cleanup()

    def test_exact_sqlite_round_trip_keeps_inode_and_permissions(self):
        connection = sqlite3.connect(self.database)
        connection.execute("UPDATE important SET value=?", ("changed",))
        connection.commit()
        connection.close()
        result = module.restore(self.archive, self.database, self.metadata)
        self.assertEqual(result["databaseIntegrity"], "ok")
        self.assertEqual(module.sha_file(self.database), self.original)
        self.assertEqual(self.database.stat().st_ino, self.inode)
        self.assertEqual(self.database.stat().st_mode & 0o777, 0o600)

    def test_bad_checksum_cannot_modify_destination(self):
        with self.assertRaises(RuntimeError):
            module.restore(self.archive, self.database, dict(self.metadata, sha256="0" * 64))
        self.assertEqual(module.sha_file(self.database), self.original)

    def test_nonempty_journal_cannot_modify_destination(self):
        Path(str(self.database) + "-wal").write_bytes(b"uncheckpointed")
        with self.assertRaises(RuntimeError):
            module.restore(self.archive, self.database, self.metadata)
        self.assertEqual(module.sha_file(self.database), self.original)

    def test_truncated_gzip_cannot_modify_destination(self):
        truncated = self.root / "truncated.sqlite.gz"
        truncated.write_bytes(self.archive.read_bytes()[:-8])
        with self.assertRaises((EOFError, OSError, RuntimeError)):
            module.restore(truncated, self.database, self.metadata)
        self.assertEqual(module.sha_file(self.database), self.original)

    def test_existing_archive_is_never_overwritten(self):
        before = module.sha_file(self.archive)
        with self.assertRaises(FileExistsError):
            module.compress(self.database, self.archive)
        self.assertEqual(module.sha_file(self.archive), before)

if __name__ == "__main__":
    unittest.main()
