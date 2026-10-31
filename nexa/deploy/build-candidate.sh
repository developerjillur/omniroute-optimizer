#!/bin/bash
set -euo pipefail
OUTDIR="$1"
export DATA_DIR="$OUTDIR/build-data"
export MITM_AUTO_RECOVER=false
mkdir -p "$DATA_DIR"
# Production includes the dashboard used to manage native routing and quotas.
unset OMNIROUTE_BUILD_BACKEND_ONLY OMNIROUTE_BUILD_PROFILE OMNIROUTE_SKIP_STANDALONE
npx --no-install fumadocs-mdx
npm run typecheck:core
node --import tsx/esm --test --test-concurrency=1 tests/unit/nexa-google-account-health.test.ts tests/unit/nexa-google-account-routing.test.ts tests/unit/nexa-google-quota-token-refresh.test.ts tests/unit/nexa-model-test-connection.test.ts tests/unit/model-test-route.test.ts tests/unit/model-test-runner.test.ts tests/unit/probe-testall-isolation.test.ts tests/unit/token-refresh-serialized-stale-rotation.test.ts
node --test --test-concurrency=1 nexa/deploy/bootstrap-launchdaemon.test.mjs nexa/deploy/native-ingress.test.mjs nexa/deploy/ensure-free-space.test.mjs nexa/deploy/stop-owned-bridge.test.mjs nexa/deploy/run-bounded-build.test.mjs nexa/deploy/bridge-gate.test.mjs nexa/deploy/dashboard-gate.test.mjs nexa/deploy/build-candidate.test.mjs nexa/deploy/tsc-ratchet.test.mjs nexa/deploy/smoke-package-migrations.test.mjs tests/unit/deployment-policy.test.mjs
node scripts/check/check-tsc-ratchet.mjs --ratchet | tee "$OUTDIR/tsc-ratchet.log"
if grep -q 'tscErrors=SKIP' "$OUTDIR/tsc-ratchet.log" || ! grep -Eq '^tscErrors=[0-9]+$' "$OUTDIR/tsc-ratchet.log"; then
  printf '%s\n' 'TypeScript ratchet did not complete; production build blocked.' >&2
  exit 1
fi
node nexa/deploy/run-bridge-tests.mjs
node --import tsx/esm --test --test-concurrency=1 tests/unit/chatcore-upstream-body.test.ts tests/unit/model-family-fallback-notation.test.ts tests/unit/claude-code-obfuscation.test.ts tests/unit/claude-native-passthrough-tools.test.ts tests/unit/claude-code-tool-casing-identity-echo.test.ts tests/unit/claude-codex-identity-version-sync.test.ts
node --import tsx/esm --test --test-concurrency=1 tests/unit/traffic-inspector-event-stream.test.ts tests/unit/security/audit-remediation.test.ts tests/unit/security/audit-remediation-guards.test.ts tests/unit/provider-validation-ssrf-guard.test.ts tests/unit/combo-diagnostics-trace.test.ts tests/unit/idempotency-fusion-collision.test.ts
npm run build:release
node nexa/deploy/dashboard-gate.mjs dist/.build/next
npm run build:cli-api
npm run build:cli
OMNIROUTE_ALLOW_CANARY_BUILD=1 npm run check:pack-artifact
/usr/local/bin/node /usr/local/lib/node_modules/npm/bin/npm-cli.js pack --pack-destination "$OUTDIR"
