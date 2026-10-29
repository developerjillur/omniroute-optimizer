#!/bin/bash
set -euo pipefail
if [ "$#" -gt 0 ]; then cd "$1"; fi
export NODE_ENV=test DISABLE_SQLITE_AUTO_BACKUP=true MITM_AUTO_RECOVER=false
export OMNIROUTE_SKIP_SYSTEM_TRUST=1 OMNIROUTE_SKIP_DNS_WRITE=1 OMNIROUTE_SSE_COMMENTS=false
node --import tsx/esm --import ./open-sse/utils/setupPolyfill.ts \
  --import ./tests/_setup/isolateDataDir.ts --test --test-reporter=tap --test-concurrency=1 \
  tests/unit/native-gemini-cloud-contract.test.ts \
  tests/unit/native-gemini-buffer.test.ts \
  tests/unit/antigravity-streaming-passthrough.test.ts \
  tests/unit/antigravity-native-toolcall-collect.test.ts \
  tests/unit/antigravity-format-detection.test.ts \
  tests/unit/chatcore-request-format.test.ts \
  tests/unit/chatcore-target-format.test.ts \
  tests/unit/translator-antigravity-to-openai.test.ts \
  tests/unit/translator-resp-antigravity-thinking-boundary.test.ts \
  tests/unit/nonstreaming-gemini-family-response-projection.test.ts \
  tests/unit/non-streaming-client-translate.test.ts
