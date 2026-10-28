import importlib.util
from pathlib import Path
import sqlite3
import tempfile
import unittest

spec = importlib.util.spec_from_file_location("cloud_config", Path(__file__).parents[1] / "cloud/prepare-config.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class CloudConfigTest(unittest.TestCase):
    def test_rejects_an_active_wal_database_before_export(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "active.sqlite"
            source.touch()
            source.with_name(source.name + "-wal").touch()
            with self.assertRaisesRegex(ValueError, "completed SQLite backup"):
                module.prepare(source, Path(directory) / "target.sqlite")
            self.assertFalse((Path(directory) / "target.sqlite").exists())

    def test_isolated_export_preserves_config_and_omits_local_sessions(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "source.sqlite"
            target = Path(directory) / "target.sqlite"
            db = sqlite3.connect(source)
            db.executescript("""
                CREATE TABLE provider_connections(id TEXT PRIMARY KEY, provider TEXT, is_active INTEGER,
                    access_token TEXT, refresh_token TEXT, id_token TEXT, expires_at TEXT,
                    token_expires_at TEXT, provider_specific_data TEXT, test_status TEXT, last_error TEXT);
                INSERT INTO provider_connections VALUES('google','antigravity',1,'encrypted-access','encrypted-refresh',NULL,NULL,NULL,'{}','ok',NULL);
                INSERT INTO provider_connections VALUES('claude','claude',1,'local-access','rotating-refresh',NULL,NULL,NULL,'secret','ok',NULL);
                INSERT INTO provider_connections VALUES('codex','codex',1,'local-access','rotating-refresh',NULL,NULL,NULL,'secret','ok',NULL);
                CREATE TABLE key_value(namespace TEXT,key TEXT,value TEXT,PRIMARY KEY(namespace,key));
                INSERT INTO key_value VALUES('settings','requireLogin','false');
                INSERT INTO key_value VALUES('modelAliases','alias','"ag/model"');
                INSERT INTO key_value VALUES('native_claude_thread_owners','session','private');
                CREATE TABLE call_logs(id INTEGER,private_content TEXT);
                INSERT INTO call_logs VALUES(1,'private conversation');
                CREATE TABLE api_keys(id TEXT,key TEXT);
                INSERT INTO api_keys VALUES('local','private-local-key');
                CREATE TABLE _omniroute_migrations(id INTEGER);
                INSERT INTO _omniroute_migrations VALUES(195);
            """)
            db.commit()
            db.close()
            before = source.read_bytes()
            receipt = module.prepare(source, target)
            out = sqlite3.connect(target)
            self.assertEqual(receipt["integrity"], "ok")
            self.assertEqual(out.execute("SELECT access_token FROM provider_connections WHERE id='google'").fetchone()[0], "encrypted-access")
            for provider in ("claude", "codex"):
                self.assertEqual(out.execute("SELECT is_active,access_token,refresh_token,provider_specific_data FROM provider_connections WHERE id=?", (provider,)).fetchone(), (0, None, None, None))
            self.assertEqual(out.execute("SELECT COUNT(*) FROM call_logs").fetchone()[0], 0)
            self.assertEqual(out.execute("SELECT COUNT(*) FROM api_keys").fetchone()[0], 0)
            self.assertEqual(out.execute("SELECT COUNT(*) FROM key_value WHERE namespace='native_claude_thread_owners'").fetchone()[0], 0)
            self.assertEqual(out.execute("SELECT value FROM key_value WHERE key='requireLogin'").fetchone()[0], "true")
            self.assertEqual(out.execute("SELECT COUNT(*) FROM _omniroute_migrations").fetchone()[0], 1)
            self.assertEqual(source.read_bytes(), before)
            self.assertEqual(target.stat().st_mode & 0o777, 0o600)
            out.close()
            with self.assertRaises(FileExistsError):
                module.prepare(source, target)


if __name__ == "__main__":
    unittest.main()
