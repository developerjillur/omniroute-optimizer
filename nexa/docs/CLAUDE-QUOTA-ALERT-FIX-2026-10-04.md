# Claude usage alert and actual quota exhaustion

Date: 2026-10-04. Maintainer: Jillur Rahman.

## Problem and live evidence

The usage endpoint returned an active, critical weekly window at 90% used,
with 10% remaining. The native usage screen also reported 90% used. Routing
treated the critical label as exhaustion and returned HTTP 429 before sending
anything upstream. The identical Opus request succeeded with HTTP 200 when the
cached quota filter was temporarily disabled.

A second connected account had an actual exhausted weekly window at 100% used.
Its remaining session allowance does not reopen the depleted weekly allowance.

## Overlay change

`nexa/new/src/domain/claudeQuotaSchedule.ts` owns the shared pre-dispatch
predicate. A reported positive remainder keeps the connection usable even when
Anthropic labels the usage band active/critical. The quota-cache patch uses the
same predicate for global and model-specific dispatch checks.

Available accounts retain the ordinary five-minute usage refresh. Confirmed
zero-remainder windows keep their provider reset schedule. An active critical
window without a reported percentage retains its existing interpretation;
this change does not invent a remaining allowance from missing telemetry.

After an actual upstream 429, the existing error classification and reset
evidence handling still apply. A pre-dispatch alert is not sufficient evidence
to reject an otherwise available account.

## Local configuration

Use `quotaPreflight.enabled=false` to disable optional proactive cutoffs and
`defaultThresholdPercent=0` for the operator's minimum remaining allowance.
The two Claude connections already have explicit zero cutoffs for all displayed
windows. API-key budgets, session limits, request limits, provider cooldown policy,
and quota-share concurrency limits were inspected separately.

`cachedQuotaFilteringEnabled=false` is the immediate configuration workaround
for an older runtime. It also bypasses known depleted accounts, so it should
only remain necessary until the fixed runtime is installed and tested. In the
fixed runtime, enabling this filter skips actual exhaustion without imposing
the critical warning band as an additional local quota.

## Regression validation

The new six-test suite reproduced five failures before the fix. It covers
90%, 99%, and 99.9% critical alerts, ordinary refresh scheduling, actual 100%
exhaustion, model-specific alerts, restart hydration, and 20 parallel credential
selections with one depleted and one available account.

The focused regression run passed 64 tests, including existing scoped Claude
quota/error/reset handling, Bridge quota recovery and limit settings, usage
normalization, model matching, and the previously implemented GPT 6.1 Sol support.

Before promoting a new package, run the existing typecheck/ratchet, Bridge,
protocol, and security gates under the bounded build wrapper. Smoke the package
with a separate data directory and ports. Verify real streaming, parallel
requests, native CLI and Desktop Code routing, then verify again after restart.

Production builds explicitly clear backend/contributor-only flags. The packaged
quota and Agent Bridge client chunks must include their real controls; a null-page
stub cannot pass the dashboard gate. Builds use one worker and a bounded heap/RSS
budget, without an Electron or Docker build.

## Update and scope

All source changes are retained under `nexa/`; the upstream tree stays pristine.
The standard overlay build reapplies the fix, and patch drift is checked before
an update can be built. Future provider payload changes still require validation.
Real Anthropic quota, throughput restrictions, and service failures remain
provider-controlled and cannot be removed by an OmniRoute setting.
