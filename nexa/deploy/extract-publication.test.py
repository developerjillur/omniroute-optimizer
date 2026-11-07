import importlib.util
import io
from pathlib import Path
import tarfile
import tempfile
import unittest

spec = importlib.util.spec_from_file_location("extract_publication", Path(__file__).with_name("extract-publication.py"))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class ExtractPublicationTest(unittest.TestCase):
    def setUp(self):
        self.root = Path(tempfile.mkdtemp(prefix="extract-publication-"))
        self.archive = self.root / "input.tgz"
        self.output = self.root / "package"

    def write_archive(self, name="package/index.cjs", kind=tarfile.REGTYPE, linkname=""):
        with tarfile.open(self.archive, "w:gz") as stream:
            member = tarfile.TarInfo(name)
            member.type, member.linkname, member.mode = kind, linkname, 0o755
            content = b"preserved executable"
            if kind == tarfile.REGTYPE:
                member.size = len(content)
            stream.addfile(member, io.BytesIO(content) if kind == tarfile.REGTYPE else None)

    def test_files_and_executable_modes_survive(self):
        self.write_archive()
        module.extract(self.archive, self.output)
        self.assertEqual((self.output / "index.cjs").read_bytes(), b"preserved executable")
        self.assertEqual((self.output / "index.cjs").stat().st_mode & 0o777, 0o755)

    def test_existing_destination_is_preserved(self):
        self.output.mkdir()
        marker = self.output / "keep"
        marker.write_text("existing runtime")
        self.write_archive()
        with self.assertRaisesRegex(ValueError, "Preserve"):
            module.extract(self.archive, self.output)
        self.assertEqual(marker.read_text(), "existing runtime")

    def test_traversal_cannot_write_outside(self):
        self.write_archive("package/../escaped")
        with self.assertRaisesRegex(ValueError, "Unsafe"):
            module.extract(self.archive, self.output)
        self.assertFalse(self.output.exists())
        self.assertFalse((self.root / "escaped").exists())

    def test_absolute_path_is_rejected_before_writing(self):
        self.write_archive("/package/escaped")
        with self.assertRaisesRegex(ValueError, "Unsafe"):
            module.extract(self.archive, self.output)
        self.assertFalse(self.output.exists())

    def test_external_symlink_is_rejected_before_writing(self):
        self.write_archive(kind=tarfile.SYMTYPE, linkname="../../escaped")
        with self.assertRaisesRegex(ValueError, "escapes"):
            module.extract(self.archive, self.output)
        self.assertFalse(self.output.exists())

    def test_special_device_entry_is_rejected(self):
        self.write_archive(kind=tarfile.FIFOTYPE)
        with self.assertRaisesRegex(ValueError, "Special"):
            module.extract(self.archive, self.output)
        self.assertFalse(self.output.exists())


if __name__ == "__main__":
    unittest.main()
