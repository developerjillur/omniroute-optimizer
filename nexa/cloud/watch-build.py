#!/usr/bin/env python3
"""Monitor one named build container and stop only that container if host headroom falls."""
import json
from pathlib import Path
import shutil
import subprocess
import time

CONTAINER = "nexaomni-build"
REPORT = Path("/opt/nexaomni/evidence/resource-guard.json")


def sample():
    info = {line.split(":")[0]: int(line.split()[1]) * 1024 for line in Path("/proc/meminfo").read_text().splitlines() if len(line.split()) >= 2 and line.split()[1].isdigit()}
    return {"availableBytes": info["MemAvailable"], "swapBytes": info["SwapTotal"] - info["SwapFree"], "diskFreeBytes": shutil.disk_usage("/opt/nexaomni").free}


baseline = sample()
report = {"container": CONTAINER, "baseline": baseline, "stoppedForPressure": False}
while True:
    current = sample()
    state = json.loads(subprocess.check_output(["docker", "inspect", "--format", "{{json .State}}", CONTAINER], text=True))
    reason = ("Host memory below 8 GiB" if current["availableBytes"] < 8 * 1024**3 else
              "Host swap grew more than 1 GiB" if current["swapBytes"] - baseline["swapBytes"] > 1024**3 else
              "Server free disk below 15 GiB" if current["diskFreeBytes"] < 15 * 1024**3 else "")
    report.update({"last": current, "containerState": state["Status"], "exitCode": state["ExitCode"], "at": time.time()})
    if reason and state["Running"]:
        subprocess.run(["docker", "stop", "--timeout", "10", CONTAINER], check=True, stdout=subprocess.DEVNULL)
        report.update({"stoppedForPressure": True, "reason": reason})
    REPORT.write_text(json.dumps(report, indent=2) + "\n")
    if reason or not state["Running"]:
        break
    time.sleep(2)
