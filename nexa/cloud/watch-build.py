#!/usr/bin/env python3
"""Monitor one named build container and stop only that container if host headroom falls."""
import argparse
from datetime import datetime, timezone
import json
import os
import re
from pathlib import Path
import shutil
import subprocess
import time



def sample():
    info = {line.split(":")[0]: int(line.split()[1]) * 1024 for line in Path("/proc/meminfo").read_text().splitlines() if len(line.split()) >= 2 and line.split()[1].isdigit()}
    return {"availableBytes": info["MemAvailable"], "swapBytes": info["SwapTotal"] - info["SwapFree"], "diskFreeBytes": shutil.disk_usage("/opt/nexaomni").free}


def inspect(target):
    return json.loads(subprocess.check_output(["docker", "inspect", target], text=True))[0]


def pressure(current, baseline):
    return ("Host memory below 8 GiB" if current["availableBytes"] < 8 * 1024**3 else
            "Host swap grew more than 1 GiB" if current["swapBytes"] - baseline["swapBytes"] > 1024**3 else
            "Server free disk below 15 GiB" if current["diskFreeBytes"] < 15 * 1024**3 else "")


def monitor(container, report_path, expected_job=None):
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_.-]{0,127}", container):
        raise ValueError("Invalid container identity")
    original = inspect(container)
    identity = original["Id"]
    if not re.fullmatch(r"[a-f0-9]{64}", identity):
        raise ValueError("Docker did not provide an immutable container ID")
    if expected_job is not None and original["Config"].get("Labels", {}).get("nexalance.job") != expected_job:
        raise ValueError("Container ownership label does not match this build")
    report_path = Path(report_path)
    fd = os.open(report_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    os.close(fd)
    baseline = sample()
    report = {"container": container, "containerId": identity, "baseline": baseline, "stoppedForPressure": False,
              "minimumAvailableBytes": baseline["availableBytes"], "maximumSwapBytes": baseline["swapBytes"]}
    while True:
        current = sample()
        state = inspect(identity)["State"]
        reason = pressure(current, baseline)
        report.update({"last": current, "containerState": state["Status"], "exitCode": state["ExitCode"],
                       "oomKilled": state.get("OOMKilled", False), "at": time.time(),
                       "minimumAvailableBytes": min(report["minimumAvailableBytes"], current["availableBytes"]),
                       "maximumSwapBytes": max(report["maximumSwapBytes"], current["swapBytes"])})
        if reason and state["Running"]:
            subprocess.run(["docker", "stop", "--timeout", "10", identity], check=True, stdout=subprocess.DEVNULL)
            report.update({"stoppedForPressure": True, "reason": reason})
            stopped = inspect(identity)["State"]
            report.update({"containerState": stopped["Status"], "exitCode": stopped["ExitCode"], "oomKilled": stopped.get("OOMKilled", False)})
        report_path.write_text(json.dumps(report, indent=2) + "\n")
        if reason or not state["Running"]:
            return report
        time.sleep(2)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--container", default="nexaomni-build")
    parser.add_argument("--expected-job")
    parser.add_argument("--report", type=Path)
    args = parser.parse_args()
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S.%fZ")
    output = args.report or Path("/opt/nexaomni/evidence") / ("resource-guard-" + stamp + ".json")
    print(json.dumps(monitor(args.container, output, args.expected_job)))
