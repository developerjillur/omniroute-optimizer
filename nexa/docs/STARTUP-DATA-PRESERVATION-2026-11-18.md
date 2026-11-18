# Startup data preservation — 2026-11-18

## Installed-package finding

The first full v3.8.54 cloud package passed compilation, native modules, registry
mitigation checks and two isolated production cold starts. It is not accepted for
live promotion: a complete private SQLite before/after comparison found changes
that a health response alone did not reveal. That initial archive was rejected. A later corrected C95 build is live; its separate Bridge startup omission is being repaired.

The private baseline hashed 147 tables and 8,447,119 rows. After startup and protocol
probes the clone contained 153 tables and 8,442,268 rows. Existing-column changes:

- `audit_log`: 465 to 435 rows.
- `proxy_logs`: 104,837 to 100,000 rows.
- `key_value`: five expired `session_account_affinity` rows removed. These were
  session-affinity cache records, not provider model-catalog rows.
- `api_keys`: one `last_used_at` changed after authenticated catalog/token-count
  probes. Existing credential, scope and key values did not change.
- Migration ledger: 224 to 242 rows, expected for the new schema.

Raw credentials, message bodies and account identifiers are absent from this report.
All failed test/resource receipts and the original clone snapshot remain private.

## Cause and correction

The real Next.js startup invoked `cleanupExpiredLogs()` unconditionally after
`initAuditLog()`. That path applies a separate seven-day application-log default
and 100,000-row proxy-log limit, even when background services are disabled. It
runs independently of the operator's configured general retention scheduler.

Nexa startup will initialize auditing without forcing this separate cleanup pass.
The configured retention scheduler and explicit maintenance APIs remain present;
existing settings are not rewritten. The session-affinity startup cleanup must
also honor the existing background-services guard. Expired affinities remain
unusable; this does not extend their routing lifetime or bypass account eligibility.

The retention change requires new red/green source assertions, normal existing
retention regressions, full validation, a newly sealed production build, and fresh
Mac installation/data-preservation acceptance. The earlier sealed archive must not
be promoted as though it contains this correction. A resource stop or environment
error is never counted as a reproduced assertion failure or a passing test.

## Remaining acceptance

Re-run the actual production package on a fresh copy of the preserved original
data. Compare every original typed row value; separate the authenticated probe's
monotonic `last_used_at` telemetry from credentials and configuration. Final live
migration uses no authenticated model/catalog probe, so its key rows must remain
strictly unchanged. Preserve the latest live writes with a new quiescent snapshot;
never promote an older smoke-test database.

## Session-identity compatibility

The first corrected-source run passed the new retention contract, native/protocol
regressions, full compiler comparison and remaining release checks, but one newly
selected upstream edge-case test expected `header:` for Claude's native header.
Nexa deliberately uses `claude:` for both native header and body session identity;
its existing cache-continuity and account-selection regressions require that
namespace. The test now expects the existing native identity and additionally
asserts that a generic explicit session ID with the same text cannot collide.
Generic-header precedence, distinct native-session separation and input hashing
assertions remain unchanged. No runtime routing behavior is changed for this
compatibility-test correction.

## C95 preservation accepted; Bridge startup registration restored

The corrected C95 installed-package comparison retained every original typed row
value in all 147 baseline tables (8,447,119 original rows), apart from the explicitly
allowed monotonic API-key last_used_at caused by authenticated protocol probes.
Credentials, scopes, mappings, settings and history remained unchanged. The final
live migration used a new current quiescent snapshot and retained the original
database inode. Failed/resource receipts remain immutable.

A separate live check found the prior Bridge startup registration absent from the
C95 overlay diff. Regenerating against an already-applied base had lost that hunk.
The complete instrumentation patch must always be based on pristine upstream:
retain audit initialization, suppress the separate destructive cleanup pass, honor
the affinity background guard, and schedule explicitly enabled Bridge recovery
before markServerReady(). A new startup assertion rejects the C95 omission.
Automatic recovery acceptance of the corrected production package is still required.
