import importlib.util
import json
from pathlib import Path
import sqlite3
import tempfile
import unittest

spec = importlib.util.spec_from_file_location("candidate", Path(__file__).parents[1] / "cloud/prepare-candidate.py")
candidate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(candidate)


def live_fixture(root):
    (root / "data").mkdir()
    (root / "private").mkdir()
    environment = root / "private/runtime.env"
    environment.write_text("STORAGE_ENCRYPTION_KEY=synthetic-paired-key\nREQUIRE_API_KEY=true\nAUTH_COOKIE_SECURE=true\n")
    environment.chmod(0o600)
    with sqlite3.connect(root / "data/storage.sqlite") as db:
        db.executescript("""
            CREATE TABLE provider_connections(id TEXT PRIMARY KEY,provider TEXT,is_active INTEGER,
              access_token TEXT,refresh_token TEXT,id_token TEXT,expires_at TEXT,token_expires_at TEXT,
              provider_specific_data TEXT,test_status TEXT,last_error TEXT);
            INSERT INTO provider_connections VALUES('google','antigravity',1,'google-token','google-refresh',NULL,NULL,NULL,'{}','ok',NULL);
            INSERT INTO provider_connections VALUES('claude','claude',1,'claude-token','rotating-refresh',NULL,NULL,NULL,'{}','ok',NULL);
            INSERT INTO provider_connections VALUES('other','copilot',1,'other-token','other-rotating-refresh',NULL,NULL,NULL,'{}','ok',NULL);
            CREATE TABLE key_value(namespace TEXT,key TEXT,value TEXT,PRIMARY KEY(namespace,key));
            CREATE TABLE api_keys(id TEXT,key TEXT);
            INSERT INTO api_keys VALUES('existing','synthetic-api-record');
            CREATE TABLE call_logs(id INTEGER,text TEXT);
            INSERT INTO call_logs VALUES(1,'private conversation');
        """)


class CloudCandidateTests(unittest.TestCase):
    def test_candidate_has_only_google_credentials_and_preserves_live_data(self):
        with tempfile.TemporaryDirectory(prefix="nexa-candidate-") as folder:
            root = Path(folder)
            live_fixture(root)
            before = (root / "data/storage.sqlite").read_bytes()
            result = candidate.prepare(root, root / "candidate")
            self.assertEqual((root / "data/storage.sqlite").read_bytes(), before)
            self.assertEqual(result["active_providers"], {"antigravity": 1})
            self.assertEqual(result["api_key_records"], 1)
            self.assertFalse(result["rotating_oauth_credentials_copied"])
            with sqlite3.connect(root / "candidate/data/storage.sqlite") as db:
                self.assertEqual(db.execute("SELECT count(*) FROM call_logs").fetchone()[0], 0)
                self.assertEqual(db.execute("SELECT key FROM api_keys").fetchone()[0], "synthetic-api-record")
                self.assertEqual(db.execute("SELECT access_token FROM provider_connections WHERE provider='antigravity'").fetchone()[0], "google-token")
                self.assertTrue(all(row == (0, None, None) for row in db.execute("SELECT is_active,access_token,refresh_token FROM provider_connections WHERE provider<>'antigravity'")))
            for name in ["runtime.env", "snapshot.sqlite", "receipt.json", "data/storage.sqlite"]:
                self.assertEqual((root / "candidate" / name).stat().st_mode & 0o777, 0o600)
            self.assertNotIn("synthetic-paired-key", json.dumps(result))
            self.assertNotIn("synthetic-api-record", json.dumps(result))

    def test_existing_candidate_is_never_overwritten(self):
        with tempfile.TemporaryDirectory(prefix="nexa-candidate-") as folder:
            root = Path(folder)
            live_fixture(root)
            target = root / "candidate"
            target.mkdir()
            keep = target / "keep"
            keep.write_text("keep")
            with self.assertRaisesRegex(ValueError, "must be new"):
                candidate.prepare(root, target)
            self.assertEqual(keep.read_text(), "keep")

    def test_candidate_cannot_go_inside_live_data(self):
        with tempfile.TemporaryDirectory(prefix="nexa-candidate-") as folder:
            root = Path(folder)
            live_fixture(root)
            with self.assertRaisesRegex(ValueError, "live data"):
                candidate.prepare(root, root / "data/candidate")
            self.assertFalse((root / "data/candidate").exists())


if __name__ == "__main__":
    unittest.main()
