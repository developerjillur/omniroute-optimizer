import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("watch", Path(__file__).parents[1] / "cloud/watch-build.py")
watch = importlib.util.module_from_spec(spec)
spec.loader.exec_module(watch)
GIB = 1024**3


class CloudWatchTests(unittest.TestCase):
    def test_pressure_stops_the_captured_id_instead_of_a_reused_name(self):
        identity = "a" * 64
        samples = [{"availableBytes": 20*GIB, "swapBytes": 0, "diskFreeBytes": 100*GIB},
                   {"availableBytes": 7*GIB, "swapBytes": 0, "diskFreeBytes": 100*GIB}]
        def inspect(target):
            return {"Id": identity, "Config": {"Labels": {"nexalance.job": "my-build"}},
                    "State": {"Status": "running", "Running": True, "ExitCode": 0}}
        with tempfile.TemporaryDirectory(prefix="nexa-watch-") as folder, patch.object(watch, "inspect", side_effect=inspect), patch.object(watch, "sample", side_effect=samples), patch.object(watch.subprocess, "run") as stop:
            report = watch.monitor("nexaomni-build", Path(folder)/"new.json", "my-build")
            self.assertTrue(report["stoppedForPressure"])
            self.assertEqual(stop.call_args.args[0], ["docker", "stop", "--timeout", "10", identity])

    def test_an_unrelated_container_label_is_rejected_before_stop(self):
        with patch.object(watch, "inspect", return_value={"Id": "b"*64, "Config": {"Labels": {"nexalance.job": "other"}}}), patch.object(watch.subprocess, "run") as stop:
            with self.assertRaisesRegex(ValueError, "ownership"):
                watch.monitor("nexaomni-build", Path("must-not-be-written.json"), "my-build")
            stop.assert_not_called()

    def test_a_previous_resource_receipt_is_not_overwritten(self):
        with tempfile.TemporaryDirectory(prefix="nexa-watch-") as folder, patch.object(watch, "inspect", return_value={"Id": "c"*64, "Config": {"Labels": {}}}):
            report = Path(folder)/"existing.json"
            report.write_text("preserve")
            with self.assertRaises(FileExistsError): watch.monitor("nexaomni-build", report)
            self.assertEqual(report.read_text(), "preserve")

    def test_swap_and_disk_bounds_remain_enforced(self):
        base = {"availableBytes": 20*GIB, "swapBytes": 0, "diskFreeBytes": 100*GIB}
        self.assertIn("swap", watch.pressure({**base, "swapBytes": 2*GIB}, base))
        self.assertIn("disk", watch.pressure({**base, "diskFreeBytes": 14*GIB}, base))


if __name__ == "__main__": unittest.main()
