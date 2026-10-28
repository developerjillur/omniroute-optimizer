#!/bin/sh
set -eu
: "${JWT_SECRET:?JWT_SECRET must be configured}"
: "${API_KEY_SECRET:?API_KEY_SECRET must be configured}"
: "${STORAGE_ENCRYPTION_KEY:?STORAGE_ENCRYPTION_KEY must be configured}"
if [ "${REQUIRE_API_KEY:-}" != "true" ] || [ "${AUTH_COOKIE_SECURE:-}" != "true" ]; then
  printf '%s\n' 'Public cloud startup requires API authentication and secure cookies.' >&2
  exit 1
fi
exec node server-ws.mjs
