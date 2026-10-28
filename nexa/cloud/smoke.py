#!/usr/bin/env python3
"""Check public TLS, authentication and catalog without displaying credentials."""
import argparse
import http.cookiejar
import json
import os
from pathlib import Path
import time
import urllib.error
import urllib.request


def environment(path):
    result = {}
    for line in Path(path).read_text().splitlines():
        if "=" in line and not line.lstrip().startswith("#"):
            key, value = line.split("=", 1)
            result[key.strip()] = value.strip().strip('"').strip("'")
    return result


def request(base, path, *, payload=None, key=None, opener=None):
    headers = {"Accept": "application/json", "User-Agent": "nexaomni-client/1.0"}
    if key:
        headers["Authorization"] = "Bearer " + key
    if payload is not None:
        headers["Content-Type"] = "application/json"
    item = urllib.request.Request(base + path, data=json.dumps(payload).encode() if payload is not None else None, headers=headers)
    started = time.monotonic()
    try:
        with (opener.open(item, timeout=45) if opener else urllib.request.urlopen(item, timeout=45)) as response:
            raw = response.read()
            try:
                value = json.loads(raw)
            except json.JSONDecodeError:
                value = raw.decode(errors="replace")
            return response.status, value, round(time.monotonic() - started, 3)
    except urllib.error.HTTPError as error:
        return error.code, error.read().decode(errors="replace")[:2000], round(time.monotonic() - started, 3)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", default="https://nexaomni.nexaconnect.cloud")
    parser.add_argument("--environment", required=True)
    parser.add_argument("--credentials", required=True)
    parser.add_argument("--evidence", required=True)
    args = parser.parse_args()
    if not args.base.startswith("https://"):
        raise SystemExit("Public smoke checks require certificate-verified HTTPS")
    report = {"base": args.base, "checks": {}}
    for name, path in {"health": "/healthz", "unauthenticatedCatalog": "/v1/models", "unauthenticatedManagement": "/api/providers"}.items():
        status, value, seconds = request(args.base, path)
        report["checks"][name] = {"status": status, "seconds": seconds}
    if report["checks"]["health"]["status"] != 200:
        Path(args.evidence).write_text(json.dumps(report, indent=2) + "\n")
        raise SystemExit("Public health failed before application authentication")
    status, _, seconds = request(args.base, "/v1/models", key="invalid-cloud-smoke-key")
    report["checks"]["invalidKey"] = {"status": status, "seconds": seconds}
    private = Path(args.credentials)
    if private.exists():
        credentials = environment(private)
        key = credentials["NEXAOMNI_API_KEY"]
    else:
        env = environment(args.environment)
        opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
        status, body, seconds = request(args.base, "/api/auth/login", payload={"password": env["INITIAL_PASSWORD"]}, opener=opener)
        report["checks"]["dashboardLogin"] = {"status": status, "seconds": seconds}
        if status != 200:
            raise SystemExit("Dashboard login failed; credentials were not changed")
        status, created, seconds = request(args.base, "/api/keys", payload={"name": "NexaOmni application", "modelAccessMode": "all", "noLog": True, "scopes": ["self:usage"]}, opener=opener)
        if status != 201 or not isinstance(created, dict) or not isinstance(created.get("key"), str):
            raise SystemExit("API key creation failed; no key was displayed")
        key = created["key"]
        fd = os.open(private, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
        with os.fdopen(fd, "w") as handle:
            handle.write("NEXAOMNI_BASE_URL=" + args.base + "/v1\nNEXAOMNI_API_KEY=" + key + "\n")
            handle.write("NEXAOMNI_DASHBOARD_PASSWORD=" + env["INITIAL_PASSWORD"] + "\n")
        report["checks"]["keyCreation"] = {"status": status, "seconds": seconds}
    status, catalog, seconds = request(args.base, "/v1/models", key=key)
    report["checks"]["authenticatedCatalog"] = {"status": status, "seconds": seconds, "models": len(catalog.get("data", [])) if isinstance(catalog, dict) else 0}
    if status == 200 and isinstance(catalog, dict):
        report["fastGoogleModels"] = [item["id"] for item in catalog.get("data", []) if "flash" in item.get("id", "").lower() and (item["id"].startswith(("ag/", "agy/", "antigravity/")))][:16]
    Path(args.evidence).write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, ensure_ascii=False))
    if report["checks"]["health"]["status"] != 200 or status != 200:
        raise SystemExit(1)
    if any(report["checks"][name]["status"] not in {401, 403} for name in ("unauthenticatedCatalog", "unauthenticatedManagement", "invalidKey")):
        raise SystemExit("Authentication gate failed")
