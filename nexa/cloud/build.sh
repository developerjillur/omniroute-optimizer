#!/bin/bash
set -euo pipefail
cd /app
export NEXT_TELEMETRY_DISABLED=1 PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
export NEXA_BUILD_RSS_MB=8192 NEXA_BUILD_WORKERS=1 OMNIROUTE_MITM_STUB=1
export NODE_OPTIONS=--max-old-space-size=6144
node nexa/apply.mjs --check
node nexa/apply.mjs
npm ci --no-audit --no-fund
node nexa/deploy/run-bounded-build.mjs -- bash nexa/deploy/build-candidate.sh /output
