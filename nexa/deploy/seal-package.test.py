import importlib.util
import io
import json
from pathlib import Path
import tarfile
import tempfile
import unittest

spec = importlib.util.spec_from_file_location("seal_package", Path(__file__).with_name("seal-package.py"))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class PublicationLockTest(unittest.TestCase):
    def setUp(self):
        self.root = Path(tempfile.mkdtemp(prefix="package-seal-"))
        self.archive = self.root / "before.tgz"
        self.source = self.root / "source.json"
        self.lock = self.root / "publication.json"
        self.output = self.root / "after.tgz"
        self.metadata = {"name": "omniroute", "version": "3.8.52", "dependencies": {"dompurify": "3.4.17"}}
        self.data = {
            "name": "omniroute", "version": "3.8.52", "lockfileVersion": 3,
            "packages": {"": self.metadata, "node_modules/dompurify": {
                "version": "3.4.17", "resolved": "https://registry.npmjs.org/dompurify/-/dompurify-3.4.17.tgz",
                "integrity": "sha512-synthetic",
            }},
        }
        self.make_archive()
        self.source.write_text(json.dumps(self.data))
        self.lock.write_text(json.dumps(self.data))

    def make_archive(self, extra=None):
        with tarfile.open(self.archive, "w:gz") as stream:
            entries = {"package/package.json": json.dumps(self.metadata).encode(),
                       "package/dist/server.js": b"preserved compiled application", **(extra or {})}
            for name, data in entries.items():
                info = tarfile.TarInfo(name)
                info.size, info.mode = len(data), 0o644
                stream.addfile(info, io.BytesIO(data))

    def run_seal(self):
        return module.seal(self.archive, self.source, self.lock, self.output)

    def test_only_the_publication_lock_is_added(self):
        result = self.run_seal()
        self.assertTrue(result["compiledAssetsUnchanged"])
        self.assertEqual(result["addedMembers"], ["package/npm-shrinkwrap.json"])
        self.assertTrue(result["actualGlobalInstallAuditRequired"])
        with tarfile.open(self.output, "r:gz") as stream:
            metadata = json.load(stream.extractfile("package/package.json"))
            self.assertTrue(metadata.pop("_hasShrinkwrap"))
            self.assertEqual(metadata, self.metadata)
            self.assertEqual(stream.extractfile("package/dist/server.js").read(),
                             b"preserved compiled application")

    def test_undeclared_dependency_metadata_change_is_rejected(self):
        self.data["packages"]["node_modules/dompurify"]["dependencies"] = {"unexpected": "1.0.0"}
        self.lock.write_text(json.dumps(self.data))
        with self.assertRaisesRegex(ValueError, "reviewed effective edges"):
            self.run_seal()

    def test_only_a_recorded_effective_override_may_change_a_dependency_edge(self):
        self.metadata["overrides"] = {"editor": {"dompurify": "3.4.17"}}
        self.data["packages"]["node_modules/editor"] = {
            "version": "1.0.0", "dependencies": {"dompurify": "3.4.8"},
        }
        self.data["packages"][""] = self.metadata
        self.source.write_text(json.dumps(self.data))
        recipe = {"sourceLockSHA256": module.sha(self.source),
                  "sourceOverrides": self.metadata["overrides"], "changes": [{
                      "location": "node_modules/editor", "field": "dependencies", "name": "dompurify",
                      "before": "3.4.8", "effectiveSpec": "3.4.17", "after": "3.4.17",
                      "targetLocation": "node_modules/dompurify",
                  }]}
        self.data["packages"]["node_modules/editor"]["dependencies"]["dompurify"] = "3.4.17"
        self.lock.write_text(json.dumps(self.data))
        self.make_archive()
        recipe_file = self.root / "effective-edges.json"
        recipe_file.write_text(json.dumps(recipe))
        result = module.seal(self.archive, self.source, self.lock, self.output, recipe_file)
        self.assertEqual(result["effectiveSourceOverrideEdges"], 1)

    def test_dependency_drift_is_rejected(self):
        self.data["packages"]["node_modules/dompurify"]["version"] = "3.4.8"
        self.lock.write_text(json.dumps(self.data))
        with self.assertRaisesRegex(ValueError, "dependency drift"):
            self.run_seal()

    def test_root_dependency_mismatch_is_rejected(self):
        self.data["packages"][""]["dependencies"] = {"dompurify": "3.4.8"}
        self.lock.write_text(json.dumps(self.data))
        with self.assertRaisesRegex(ValueError, "runtime dependencies differ"):
            self.run_seal()

    def test_workspace_links_are_rejected(self):
        self.data["packages"]["node_modules/dompurify"]["link"] = True
        self.lock.write_text(json.dumps(self.data))
        with self.assertRaisesRegex(ValueError, "workspace links"):
            self.run_seal()

    def test_unreviewed_registry_is_rejected(self):
        self.data["packages"]["node_modules/dompurify"]["resolved"] = "https://untrusted.invalid/package.tgz"
        self.source.write_text(json.dumps(self.data))
        self.lock.write_text(json.dumps(self.data))
        with self.assertRaisesRegex(ValueError, "public registry"):
            self.run_seal()

    def test_existing_output_is_preserved(self):
        self.output.write_bytes(b"keep this archive")
        with self.assertRaisesRegex(ValueError, "existing archive"):
            self.run_seal()
        self.assertEqual(self.output.read_bytes(), b"keep this archive")

    def test_traversal_member_is_rejected(self):
        self.make_archive({"package/../outside": b"unsafe"})
        with self.assertRaisesRegex(ValueError, "escapes"):
            self.run_seal()

    def test_existing_publication_lock_is_not_overwritten(self):
        self.make_archive({"package/npm-shrinkwrap.json": b"old lock"})
        with self.assertRaisesRegex(ValueError, "already has"):
            self.run_seal()


if __name__ == "__main__":
    unittest.main()
