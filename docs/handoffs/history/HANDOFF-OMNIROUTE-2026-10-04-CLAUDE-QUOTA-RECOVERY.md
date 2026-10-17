> **ঐতিহাসিক নথি — public copy, ২০২৬-১০-১৭।** মূল ঘটনার তারিখ ও ফল এই নথির নিজস্ব সময়ের জন্য প্রযোজ্য; পরের সংযোজন থাকতে পারে। বর্তমান অবস্থা ও কাজের নিয়মের জন্য [বর্তমান handoff](../CURRENT-STATUS-2026-10-17.md) পড়ুন। Private reference ও identifier সরানো হয়েছে; স্থানীয় evidence এখানে অন্তর্ভুক্ত নেই। পুরোনো cleanup, build, deploy বা service command বর্তমান অনুমতি হিসেবে ব্যবহার করবেন না।

# OmniRoute Claude quota recovery: live setup ebong verification

Maintainer: Jillur Rahman. Date: 2026-10-04. Timezone: Asia/Dhaka. Final report saved: 2026-10-04T21:31:29+06:00.

## 1. Final result

Claude Opus 5.5-er available account-ke cached quota state diye bhul HTTP 429 dewar bug fix kora hoyeche. Fix-ta `nexa/` overlay-te commit kora, bounded production package build kora, isolated runtime-e test kora ebong live OmniRoute-e deploy kora hoyeche. Native Claude Desktop-er Code session, native Claude CLI, parallel JSON/SSE requests ebong controlled OmniRoute service restart-er verification pass koreche.

Eta local usage budget off korar setup. Actual Anthropic quota, throughput limit ba service outage-ke unlimited kore dewar setup noy. Ei run-er accepted tests current version-er tested workflow-er evidence; 24-hour soak ba future version-er guarantee noy.

Ei dated supplement current quota incident-er authoritative handoff. Purono handoff file overwrite kora hoyni. `OMNIROUTE-GPT-6.1-SOL-SUPPORT-2026-10-04.md`-er install-pending state ei report-er deployed package ebong live GPT tests diye superseded.

## 2. Root cause: critical alert ar actual exhaustion ek noy

Provider-er usage response-e available account-er weekly usage chhilo `90% used`, `10% remaining`. Sei window-e Anthropic `active: true` ebong `severity: critical` label-o diyechhilo. OmniRoute critical warning-ke quota exhaustion dhore upstream request pathanor agei puro Claude pool block korchhilo.

User-er supplied official usage screenshot-o 90% used dekhachhilo. Sei account-e allowance baki thaka shotteo error chhilo:

```text
All claude accounts have exhausted their quota
(cached quota state, no upstream attempt)
```

Controlled reproduction:

| State | Result | Elapsed | Evidence |
| --- | --- | --- | --- |
| Old runtime, cached filter ON | HTTP 429; upstream attempt hoyni | 97 ms | `available-account-before.json` |
| Identical available-account request, filter temporarily OFF | HTTP 200; `QUOTA_AVAILABLE_OK` | 2,184 ms | `available-account-with-cache-bypassed.json` |
| Fixed isolated package, filter ON | HTTP 200; `QUOTA_AVAILABLE_CRITICAL_OK` | 2,687 ms | `isolated-runtime-tests.json` |
| Fixed live package, filter ON | HTTP 200; `PROD_CRITICAL_AVAILABLE_OK` | 2,724 ms | `production-claude-tests.json` |

Tai ei specific error-ta available account-er real allowance shesh howar evidence chhilo na. Eta OmniRoute-er pre-dispatch interpretation bug chhilo.

## 3. Connected Claude pool

Emails, OAuth tokens ebong API keys ei report-e nei. Account duita anonymous label diye identify kora holo.

| Account | Routing priority | Acceptance test-er quota | Reset shown by provider, Dhaka time |
| --- | --- | --- | --- |
| Available Claude Max | 1 | Session 94% left; weekly 10% left | Weekly 2026-10-04 prai 23:00 |
| Actually depleted Claude Max | 2 | Session 100% left; weekly 0% left | Weekly 2026-10-06 prai 09:00 |

Final browser observation-e available account-er session 89% left ebong weekly 9% left dekhachhilo. Eta ongoing usage-er change; test receipt-er 10% left ekta ager point-in-time reading.

Actually depleted account-er session balance thakleo exhausted global weekly allowance reopen hoy na. Duita connection active rakha ache; available account age select hoy. Exhausted account-er preferred connection hint thakleo unrestricted pool request healthy sibling-e fallback korte pare.

## 4. Fix-er exact behavior

Shared predicate `isBlockingClaudeQuotaWindow` reported positive remainder thakle critical warning-ke pre-dispatch block bole dhore na. Ekhon 90%, 99% ebong 99.9% used-er known positive balance available thake.

Global session/weekly window ebong model-scoped weekly window dui path-ei same predicate use hoy. Actual zero-remainder blocking window provider reset porjonto parked thake. Percentage report na kora active critical window-er existing conservative interpretation rakha ache; missing telemetry theke allowance invent kora hoyni.

Actual upstream HTTP 429 ashle existing error classification, retry/reset evidence ebong cooldown handling intact thake. Pre-dispatch critical alert-er sathe actual rejected upstream request-ke ek kora hoyni.

## 5. Automatic refresh ebong exhausted account scheduling

Backend quota refresh timer prai proti minute tick kore. Available entry normal prai five-minute usage-refresh cadence use kore. Known exhausted global window-er reset-er age repeated periodic usage probes-er dorkar hoy na; reset due hole usage read schedule hoy. Multiple global walls thakle sob wall clear howar time consider hoy; independent model scopes aladabhabe recover korte pare.

Refresh failure ba stale reset still active thakle bounded retry cadence use hoy. Service startup durable snapshots theke Claude quota state hydrate kore, jate restart-er poreo exhausted account abar blindly use na hoy.

Dashboard-er `autoRefreshProviderQuota=false` optional browser UI polling setting. Eta backend quota scheduler bondho kore na. Stored UI interval 180 seconds; backend scheduling alada.

Ei run-e future real reset porjonto live wait kora hoyni. Reset scheduling, positive-balance refresh ebong restart hydration regression tests diye verify kora hoyeche; post-restart real request-o successful.

## 6. Final local limit configuration

```json
{
  "quotaPreflight": {
    "enabled": false,
    "cachedQuotaFilteringEnabled": true,
    "defaultThresholdPercent": 0,
    "warnThresholdPercent": 20,
    "providerWindowDefaults": {}
  },
  "providerCooldown": { "enabled": false },
  "quotaShareConcurrencyLimit": { "enabled": false }
}
```

`warnThresholdPercent=20` ekta warning level; eta remaining quota 20% hole routing stop korar cutoff noy. Final runtime-e cached filter ON rakha hoyeche actual depleted account skip korar jonno. Old runtime-er temporary filter-OFF workaround ar final configuration noy.

Final audit-e:

- Sob 3-ti API key-te usage-limit enforcement OFF, daily/weekly USD budget `null`, requests per minute/day `null`, `maxSessions=0`, rate limits `null`, throttle delay 0 ebong access schedule `null`.
- Sob 20-ti provider connection-e `rateLimitProtection=false`, `maxConcurrent=null`, `rateLimitOverrides=null`; age inactive thaka duita unrelated connection inactive-i ache.
- Duita Claude account-er Session, Weekly ebong Weekly Fable cutoff explicit `0%`. Browser modal-e provider default-o `0%` verify kora hoyeche.
- Claude policy: `disableCooling=true`, `lowPriorityMode=false`, `autoLimitReset=false`. `blockExtraUsage=true` retained, jate subscription allowance shesh hole extra paid usage silently start na hoy.
- Adaptive admission `shadow` mode; eta count cap enforce korchhe na. Final snapshot-e rejected count 0.
- Chat admission `countCapEnabled=false`; final snapshot-e sheds 0, active/waiting count 0.
- Stored request-queue defaults-e 60 RPM/6 concurrent ache, kintu provider rate-limit protection OFF ebong automatic API-key-provider queue enable OFF. Ei stored defaults ei Claude route-er active request cap noy. Final rate-limit status empty.

Memory safety-r `maxInflightBytes=2 GiB` retained. Eta RAM exhaustion theke Mac-ke protect kore; eta user quota, token budget ba subscription cutoff noy. Extreme resource pressure hole protection trigger korte pare. Sob OS/memory protection tule diye unrestricted RAM allocation kora hoyni.

Full filtered, secret-free audit: final-limits-audit.json (স্থানীয় বা private reference; প্রকাশিত নয়).

## 7. Coding quality ebong context policy

Claude route-e thinking budget `passthrough`, `usageTokenBuffer=0`, semantic cache OFF, injected memory OFF, custom system prompt OFF ebong Claude system-transform pipeline disabled/empty ache. Client-er model/effort request-ke ei quota fix diye lower tier-e force kora hoyni.

Native Desktop test-e Opus 5.5, Extra effort ebong displayed context `110k / 1M` chhilo. Eta existing context-bearing session-er continuation-er real evidence; full 1M context load stress test noy. Quota fix context truncate/compress korar feature add kore na.

Image experiment key-r model/endpoint policy unchanged. Sei key-r existing compression flag-ke Claude route-er quality setting bole dhora hoyni. Whole gateway sob model-er every transformation byte-for-byte identical, ba native output-er cheye guaranteed better, emon claim ei report kore na.

## 8. Source ebong durable overlay

Repository: `~/Developer/OmniRoute`.
Production branch: `nexalance`.
Production source commit: `79412f0ec61a9d000862705e5c57b75f26181313`.

Relevant local commits:

| Commit | Change |
| --- | --- |
| `e06ca004e` | Keep critical Claude usage alerts usable until actual exhaustion |
| `79412f0ec` | Keep quota and Agent Bridge dashboard controls in production packages |

Permanent changes:

```text
nexa/new/src/domain/claudeQuotaSchedule.ts
nexa/patches/src__domain__quotaCache.ts.patch
nexa/new/tests/unit/claude-quota-alert-vs-exhaustion.test.ts
nexa/manifest.json
nexa/docs/CLAUDE-QUOTA-ALERT-FIX-2026-10-04.md
nexa/deploy/dashboard-gate.mjs
nexa/deploy/dashboard-gate.test.mjs
nexa/deploy/build-candidate.sh
```

All source changes `nexa/`-r under-e. Main checkout clean; `upstream-main`-er tulonay non-`nexa/` source tree unchanged. Author ebong committer Jillur Rahman. Public upstream PR, issue, comment ba push kora hoyni.

## 9. Production build protection

Production build wrapper explicitly contributor/backend-only flags clear kore. Quota page-er client chunk-e actual quota controls ebong Agent Bridge page-er chunk-e real state API integration thaka mandatory. Null-page dashboard stub ba missing manifest/chunk package gate pass korte pare na.

Build budget: one worker, 6 GiB heap/RSS guard, reduced scheduling priority. Actual observed build process-group peak `5,268 MiB`, prai `5.14 GiB`, configured RSS limit `6,144 MiB`. Budget guard production build terminate koreni. Full dashboard build-e 620 static routes generate hoyeche. Electron ba Docker build kora hoyni.

Core typecheck pass. Full-project TypeScript ratchet measured 5,830, accepted existing baseline 5,830; eta zero overall upstream TypeScript diagnostic-er claim noy. Packaged Bridge contract, dashboard control gate ebong live requests verify kora hoyeche.

## 10. Accepted regression gates

| Gate | Final result |
| --- | --- |
| New alert/exhaustion cases | 6 tests pass |
| Focused quota/model regression | 64 tests pass |
| Deployment helper regression | 27 tests pass |
| Agent Bridge regression | 553 tests pass |
| UI regression | 21 tests pass |
| Protocol/identity regression | 72 tests pass |
| Security regression | 34 tests pass |
| Core typecheck | Pass |
| TypeScript ratchet | Baseline unchanged, 5,830 |
| Packaged Bridge and dashboard contract | Pass |

Suite overlap ache; count-gulo jog kore unique test count bola uchit noy. New cases-er before-fix run-e 5 failure ebong 1 pass bug reproduce korechhilo. Final focused run-e 64/64 pass.

## 11. Isolated package acceptance

Separate data directory, SQLite clone ebong random HTTP port use kora hoyechhilo. Isolated package auto-start diye live MITM routing change koreni. Final accepted receipt `10/10` cases pass:

- Available critical Opus request HTTP 200.
- Pool streaming request HTTP 200, text reconstruct hoyeche ebong `message_stop` complete.
- Six simultaneous JSON/SSE requests sob HTTP 200, elapsed prai 1.54-2.09 seconds.
- GPT 6.1 Sol max regression HTTP 200.
- Actually depleted account-only isolated key-e cached HTTP 429 in 13 ms, upstream attempt chara. Eta expected pass: known exhausted account-e repeated doomed requests pathano hoyni.

## 12. Live Claude acceptance

Live runtime-e final `5/5` request/CLI cases pass:

| Case | Result |
| --- | --- |
| Available critical account request | HTTP 200 |
| Depleted preferred connection with healthy pool fallback | HTTP 200 |
| Pool SSE response | HTTP 200, complete |
| Native Claude CLI, low effort | `NATIVE_CLI_QUOTA_LOW_OK` |
| Native Claude CLI, max effort | `NATIVE_CLI_QUOTA_MAX_OK` |

Duita native CLI test parallel run hoyeche. Existing OAuth/configuration use hoyeche; external API base/key override diye native path avoid kora hoyni. Bridge intercepted count 0 theke 2 hoyeche, ja native CLI model traffic local Bridge diye jawar evidence.

Native Claude Desktop-er existing `Local Agent Bridge verification` Code session-e real response:

```text
NATIVE_APP_QUOTA_RECOVERY_OK
```

App-e model Opus 5.5, effort Extra ebong context 110k/1M chhilo. Ei test kono project file read/edit koreni. App bundle signature valid on disk/designated requirement.

Native Claude Desktop successful response (স্থানীয় image; প্রকাশিত নয়)

Original logged-in native account-er weekly 100% badge history-te thakte pare, jokhon Bridge connected pool-er available account diye response dichhe. Oi badge-ke entire OmniRoute pool exhausted bole interpret kora uchit noy. Purono failed background tasks automatically resume kora hoyni; nijer session-e Continue/Try again lagte pare.

## 13. Restart durability verification

Production service restart-er age three consecutive idle checks kora hoy. Restart-er pore manual usage refresh-er age actual Opus request `QUOTA_RESTART_HYDRATION_OK` return koreche. Native Claude CLI-o `NATIVE_CLI_AFTER_RESTART_OK` return koreche.

Post-restart verified: Bridge enabled, backend TLS, ingress TLS, Claude-scoped native ingress ebong client DNS. Cache filtering ON, preflight OFF ebong cutoff 0 persisted. Final Bridge running port 8443, certificate trusted, DNS configured, orphaned state false.

Ei run-e SHA comparisons-e unchanged:

```text
~/.claude/settings.json
~/.codex/config.toml
~/.omniroute-local/bridge-upstream-dns.cjs
/Library/Application Support/OmniRoute-Native-Ingress/native-ingress.mjs
```

Native GUI acceptance restart-er age hoyechhe; native CLI post-restart test hoyechhe. Mac reboot ei run-e kora hoyni.

## 14. GPT 6.1 Sol integration-o deployed

Previous model-support overlay ei package-e included. Live integrated `6/6` checks pass: `codex/gpt-6.1-sol` low, `cx/gpt-6.1-sol` max, `gpt-6.1-sol-ultra` SSE, existing `codex/gpt-6-astra`, existing Claude Opus ebong native Codex CLI.

Native CLI response: `GPT61_PRODUCTION_NATIVE_CLI_OK`. Catalog-e 21 relevant aliases/effort entries ebong configured 872,000 maximum input/context metadata verify kora hoyeche. Eta 872K full-load stress result noy. Temporary provider client-version/User-Agent overrides remove kora hoyeche; compiled defaults use hoy. Image experiment key-r permissions unchanged.

## 15. Package, deployment ebong rollback evidence

Verified package:

```text
~/.omniroute-builds/3.8.51-79412f0ec/omniroute-3.8.51.tgz
SHA-256: befbbd894c4b9004f3abe32fbdb3f28b97e14b1a270ef24d7a8ccb5b81617ef5
Size: 99,576,540 bytes
```

Canonical installed runtime:

```text
~/.omniroute-runtime/lib/node_modules/omniroute
```

Consistent pre-deploy data/config backup ebong previous runtime:

```text
~/.omniroute-local/update-backups/20261004-151007-claude-quota
~/.omniroute-builds/runtime-backups/20261004-151007-claude-quota
```

Promotion-er age staged package, private backup ebong idle checks complete hoyeche. Owned Bridge/service stop kore staged runtime promote hoyeche; runtime extras preserve hoyeche. Native ingress/root helper, CA trust, Local by Flywheel setup ebong account history edit kora hoyni. Live promotion-er jonno rollback execute korte hoyni. Ei run-e actual rollback drill-o kora hoyni.

## 16. Space cleanup

Only generated build paths age list/check kora, retained package-er BUILD_ID/hash match kora ebong live process/pointer overlap reject kora hoyeche. Tarpor ei duita task-er `.build`/`dist` ebong superseded isolated runtime output remove kora hoyeche. Source worktrees, dependencies, verified archives, live data, previous runtime ebong rollback database retained.

Reclaimed: 8.83 GiB. Cleanup receipt-er free disk space: 26.21 GiB. Next full-build 24 GiB space guard pass; installer-er separate lower guard-o ache. T7 originals, reports, source ba user data delete/overwrite kora hoyni.

## 17. Investigation corrections ebong known diagnostics

Acceptance harness-er first iteration-e preferred exhausted connection-ke hard pin dhora hoyechhilo; actual product policy healthy sibling fallback allow kore. Exhausted-only behavior validate korte only isolated cloned key-r connection permissions restrict kora hoy. Production key-r permissions change kora hoyni.

Key update endpoint `PATCH`, `PUT` noy. SSE marker multiple deltas-e split hote pare; final parser text reconstruct kore complete message boundary verify kore. Earlier unsuccessful harness receipts retained ache; final accepted receipt-e `ok:true` ebong 10 cases pass.

Ekta pre-restart monitoring poll 10-second timeout korechhilo. Tarpor healthz successful ebong subsequent monitoring/restart acceptance pass hoyeche. Ei transient poll-ke never-failing 24-hour health proof bola hoyni.

## 18. Future update rules

Local update build-e `nexa/` overlay reapply, patch drift validation, bounded resources, space guard, typecheck/ratchet, Bridge/protocol/security tests ebong packaged full-dashboard gate maintain korte hobe. New package live promote-er age separate data/ports diye acceptance run, then native request ebong restart checks dorkar.

Eta runtime-only handwritten fix noy; normal overlay build-e fix ebong regression test included. Upstream payload/API/client protocol change hole gate ba live test failure update stop korbe. Future provider change test chara automatically compatible, ba native app-er every future feature guaranteed same, emon promise kora jay na.

## 19. Troubleshooting interpretation

Critical badge sathe positive quota: fixed runtime-e account selectable. Warning label matro routing stop korar karon noy.

Known zero global allowance: account provider reset schedule-e parked. Onno available connection thakle pool use hoy. Sob connection genuinely exhausted hole cached 429 expected; eta local arbitrary usage cap noy.

Actual upstream 429: provider request reject korechhe. Usage screen-e allowance thakleo independent throughput/short-window restriction thakte pare. Sei evidence alada kore inspect korte hobe. Retry hints/error reset data-ke unlimited promise diye suppress kora hoyni.

Issue fire ashle timestamp, model, selected connection label ebong upstream-attempt/no-upstream distinction collect korun. Native account logout, app reinstall, certificate validation OFF ba repeated blind rebuild first troubleshooting step noy.

## 20. Evidence index ebong acceptance boundaries

Evidence folder:

```text
~/Documents/Codex/2026-10-04/omniroute-claude-quota-recovery
```

Main receipts: `validation-summary.json`, `final-limits-audit.json`, `production-package-build.log`, `focused-final.log`, `isolated-runtime-tests.json`, `production-deployment.json`, `production-claude-tests.json`, `native-desktop-success.json`, `native-desktop-success.png`, `quota-cutoffs-zero.png`, `production-model-tests.json`, `restart-verification.json`, `generated-output-cleanup.json`.

Machine-readable final validation summary (স্থানীয় বা private reference; প্রকাশিত নয়).

Not tested in this run: 24-hour soak, full 1M/872K context stress, Mac reboot, future app/provider releases, future real quota reset wait, live rollback drill, every native feature/effort/model combination. Six concurrent short requests ebong two concurrent native CLI sessions successful; arbitrary large concurrent jobs-er resource/performance guarantee noy.

## 21. Related existing handoffs

- `HANDOFF-OMNIROUTE-2026-10-02.md`: original setup/update design.
- `HANDOFF-OMNIROUTE-2026-10-03-CONSOLIDATED.md`: previous consolidated state.
- `HANDOFF-OMNIROUTE-2026-10-03-QUOTA-RECOVERY.md`: prior quota behavior; current alert/exhaustion correction ei supplement-e.
- `HANDOFF-OMNIROUTE-2026-10-03-CODING-QUALITY.md`: quality/context policy.
- `OMNIROUTE-GPT-6.1-SOL-SUPPORT-2026-10-04.md`: previous GPT support evidence; production deployment ekhon complete.

Existing handoff-gulo history hisebe preserved. Ei dated supplement-e current deployed state ebong actual test evidence ek jaygay ache.
