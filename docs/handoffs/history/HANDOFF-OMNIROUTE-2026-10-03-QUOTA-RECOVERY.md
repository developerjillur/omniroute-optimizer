> **ঐতিহাসিক নথি — public copy, ২০২৬-১০-১৭।** মূল ঘটনার তারিখ ও ফল এই নথির নিজস্ব সময়ের জন্য প্রযোজ্য; পরের সংযোজন থাকতে পারে। বর্তমান অবস্থা ও কাজের নিয়মের জন্য [বর্তমান handoff](../CURRENT-STATUS-2026-10-17.md) পড়ুন। Private reference ও identifier সরানো হয়েছে; স্থানীয় evidence এখানে অন্তর্ভুক্ত নেই। পুরোনো cleanup, build, deploy বা service command বর্তমান অনুমতি হিসেবে ব্যবহার করবেন না।

# OmniRoute Agent Bridge: quota recovery, native verification, deployment

Date: 2026-10-03, Asia/Dhaka. Owner: Jillur Rahman.

Ei handoff 2026-10-02-er setup history ebong native-quality/build-budget addendum-er porer verified deployment record. Ager report-er pending promotion/native-test status ei deployment-e resolve hoyeche. Historical results ager file-e preserve kora ache.

## 1. Final installed state

| Item | Verified result |
| --- | --- |
| Source branch | `nexalance` |
| Source / runtime build | `f77079418d844a618fd0429afe0a62c86fbcb795` |
| Commit | `fix: schedule exhausted Claude accounts at verified quota resets` |
| OmniRoute version | `3.8.51` |
| Promotion completed | 2026-10-03 00:33:53 Asia/Dhaka |
| Dashboard | `http://omni.local/dashboard/tools/agent-bridge` |
| Gateway | `127.0.0.1:28128` |
| Agent Bridge backend | `8443`, Running, certificate trusted |
| Native ingress | Loopback `443`, target `claude-code`, scoped helper |
| Claude hosts/DNS | Enabled; native client resolves to loopback |
| Connected Claude pool | Two active OAuth accounts; one eligible sibling, one weekly-exhausted |
| Main source | Clean, pristine upstream base outside `nexa/` |
| Overlay | 102 manifest items: 67 patches, 33 new files, 2 tooling entries |

Source fork `origin/nexalance`-e push completed. Ei pass-e new upstream PR create kora hoyni. Current customizations durable child overlay-te ache.

Package:

`~/.omniroute-builds/3.8.51-f77079418/omniroute-3.8.51.tgz`

SHA-256:

`02c79139f69a9b7fe3b17a5739f344a97ba340973f0b8fcb641d5796ffebdecb`

## 2. Je problem fix hoyeche

Known Claude quota wall-er real reset 429-er pore five-minute generic cooldown diye replace hote parto. Restart-er pore old SQLite observations-e Claude scope metadata missing thakto. Clock-e reset time par hole fresh usage evidence charai account routing-e fire aste parto. Onno model-e success model-specific blocked scope-keo healthy kore dite parto. Ete same exhausted account-e retry, cached quota rejection ebong native rate-limit loops hoto.

Ekhon known exhausted account model routing theke skip hoy; requested model-er jonno eligible sibling select hoy. Kono eligible account na thakle real recovery deadline report hoy. Weekly/session subscription quota remove kora hoyni.

## 3. Automatic schedule-er behavior

1. Claude usage metadata ebong model-response quota evidence theke blocked scope identify hoy.
2. Sob global blocking window clear howa dorkar, tai latest global reset next check govern kore. Independent model scope-er earliest reset-e oi scope abar check kora jay.
3. Known future reset-er age quota-recovery worker model request ba repeated usage probe pathay na. Scheduled bulk quota sync-o saved cache thakle future Claude wall skip kore.
4. Reset-e usage read hoy. Token expire hole existing per-account OAuth refresh mutex diye refresh hoy; rotating token persistence existing mechanism-e thake.
5. Fresh usage recovery confirm korle routing eligible hoy ebong dashboard quota cache update hoy. Sudhu clock par howa activation evidence noy.
6. Usage check fail/unknown hole known wall retain hoy; check at most five-minute interval-e retry hoy. Worker-er one-minute tick-er karone deadline-er praye ek minute pore check hote pare.
7. Restart-e durable SQLite snapshots theke schedule hydrate hoy, first chat-er jonno wait kore na. Manually inactive account auto-enable hoy na.

Account recovery porer request-er eligibility restore kore. Already failed background job ba native chat automatically replay kore na. Failed session-e ekbar `Try again` lagte pare. Mac awake ebong OmniRoute running thaka timed execution-er requirement.

## 4. Durable files in `nexa/`

| Child overlay file | Purpose |
| --- | --- |
| `nexa/patches/src__domain__quotaCache.ts.patch` | Real reset/429 evidence preserve, scope persist/hydrate, recovery verify, credential refresh, dashboard sync, scoped success protection |
| `nexa/patches/src__domain__quotaCacheState.ts.patch` | Shared refresh-attempt timestamps; failed checks every timer tick-e repeat na kora |
| `nexa/patches/src__lib__usage__providerLimits.ts.patch` | Future exhausted Claude bulk sync skip; manual Refresh available; unchanged successful cache result correctly count |
| `nexa/new/src/domain/claudeQuotaSchedule.ts` | Reset selection and refresh scheduling |
| `nexa/new/tests/unit/agent-bridge-quota-recovery.test.ts` | Fourteen targeted regressions |
| `nexa/docs/CLAUDE-QUOTA-RECOVERY-2026-10-03.md` | Source-level behavior, validation and operational contract |
| `nexa/manifest.json` | Build-time application inventory |

Upstream source-e temporary applied edits restore kore tarpor commit hoyeche. Current base outside `nexa/` byte-pristine. Installed runtime-only hotfix ei quota solution-er source noy.

## 5. Saved local configuration

- `Cached quota filtering`: ON. Ei option exhausted account skip korar jonno necessary.
- `Quota preflight`: OFF. Every chat-er age usage endpoint call add kora hoyni.
- Existing local user/API-key/session/concurrency/USD custom restrictions disabled ba unlimited thaka configuration retain kora hoyeche.
- Connected Claude accounts duita active. Weekly-exhausted account manual disable kore rakha hoyni, tai quota recovery-e pool-e eligible hote parbe.
- Low Priority Mode, auto limit-reset-credit redemption ebong paid extra usage enable kora hoyni.
- Claude native login/account, projects/history ebong application bundle alter kora hoyni. Native login remains `claude.ai`, Max subscription.
- Persistent Claude Code settings-e OmniRoute-specific `ANTHROPIC_BASE_URL`, API key ba auth-token override add kora hoyni. Native requests Agent Bridge path-e geche.

Original native account-er usage display original account-er quota-i dekhay. Onno connected account diye response asleo original account-er weekly usage UI 100% thakte pare. Model request-er actual route ebong response diye verification korte hobe.

## 6. Real native tests after promotion

| Test | Result |
| --- | --- |
| Claude Code CLI `claude-opus-5-5[1m]` | Exit 0, `is_error=false`, `NATIVE_OPUS_OK`, 5.67 seconds |
| Claude Code CLI `sonnet` | Exit 0, `is_error=false`, `NATIVE_SONNET_OK`, reported model `claude-sonnet-5-5`, 5.04 seconds |
| Concurrent execution | Duita CLI request ek sathe completed successfully |
| Native Claude.app Code tab | Existing Max login, Opus 5.5, Effort Extra; reply `NATIVE_APP_BRIDGE_OK` |
| Existing failed `Hello` session | `Try again` once; completed response ebong native ReadNotifications activity; session Idle |
| Actual routing log | `claude | quota-aware: 1 with quota, skipping 1 exhausted` |
| Production quota worker | Startup log `Quota cache background refresh started` present |
| Final native TLS/DNS gate | Backend 8443 + ingress 443 trusted TLS, `claude-code` target, native DNS loopback: PASS |

CLI tests empty test directory theke chhoto verification prompt diye kora hoyeche. Test-only effort low, tools empty, small output cap use hoyeche; user-er persistent defaults change hoyni. Desktop-er existing Opus/Extra settings retain kore test kora hoyeche. Original `Hello` session retry-te tar existing context theke reply diyeche; suggested subsequent project work start kora hoyni.

Weekly-exhausted account `private-id-023`-er saved reset `2026-10-06T03:00:00.053Z`, orthat October 6 09:00 Asia/Dhaka. Eligible sibling `70075336`-er session reset-er por fresh usage-e session 100% ebong weekly 68% remaining observed hoyechhilo. Pore active requests session headroom consume koreche; ei percentages permanent capacity claim noy.

Live service-e Claude OAuth usage endpoint-er independent 429-o observed hoyeche, while model requests successful. Ei karone successful scheduled dashboard refresh ba future weekly reset-er live recovery ei pass-e claim kora hochhe na. Timer startup live verified; reset-to-recovery, OAuth rotation ebong no-early-probe behavior deterministic regression tests-e verified. Future reset real time-e ekhono hoyni.

## 7. Validation gates

| Gate | Result |
| --- | --- |
| Fourteen quota-recovery regressions | PASS |
| Focused quota + healthy-override/preflight suite | 19 PASS, 0 fail |
| Related quota suite | 28 PASS, 0 fail |
| Bulk quota sync suite | 8 PASS, 0 fail |
| Managed deployment helper/resource tests | 23 PASS, 0 fail |
| Managed Bridge regression gate | 553 PASS, 0 fail |
| Bridge UI gate | 21 PASS, 0 fail |
| Native fidelity gate | 72 PASS, 0 fail |
| Related security gate | 34 PASS, 0 fail |
| Core typecheck / focused lint | PASS |
| Full TypeScript ratchet | 5830 measured = 5830 existing baseline; not skipped; no new errors accepted |
| Production package policy / Bridge contract | PASS |
| Fresh installed package isolated smoke | Real small Claude inference successful; overall PASS |
| Post-promotion native tests | CLI Opus + Sonnet + Desktop Code + existing session recovery PASS |
| Final patch applicability | 67/67 clean |

Test counts overlap: focused regressions are included in the managed Bridge run. Egulo add kore independent test total bola jabe na. Full repository zero-TypeScript-error claim kora hoyni; upstream backlog baseline unchanged.

## 8. Build resource and cleanup results

Managed runner Node 24 use kore; Node heap 6144 MiB, total descendant RSS watchdog 8192 MiB, Next worker 1, Webpack module parallelism 8, nice priority +10.

- Complete production build PASS. Observed peak 5730 MiB, praye 5.6 GiB.
- Subsequent CLI packaging PASS, observed peak 463 MiB.
- Watchdog exceed koreni. Eta sampled process-tree watchdog, OS hard reservation noy; short spikes between samples possible.
- Settings-only adjustment-e production rebuild dorkar nei.

Printed inventory ebong generated-only source status check-er pore ei exact completed generated paths remove kora hoyeche:

- `~/Developer/OmniRoute/.claude/worktrees/bridge-build-20261003-002337`
- `~/.omniroute-builds/smoke-20261003-002337`
- `~/.omniroute-builds/3.8.51-7a2186f62`

Isolated smoke verification/install/server log evidence age preserve kora hoyeche. Net filesystem available space praye 7.6 GiB bereche; cleanup-er pore available praye 65.7 GiB. Hardlinks ebong concurrent apps-er activity-r karone directory size ar net free-space change same noy.

Current package, immediate previous package, previous complete runtime ebong current deployment-er one recovery snapshot retained. Onno worktree ba T7 originals/backups delete kora hoyni.

## 9. Update safety and recovery

Managed entry point `omni-ctl update` ba configured dashboard updater. Updater isolated worktree-e overlay apply kore; type/regression/resource/package gates run kore; actual installed package-e successful inference smoke-er por live promotion kore. Config/database/secrets ebong required runtime extras preserve hoy. Current deployment-e local proxy/binder/updater extras preservation log-e confirmed.

Current archive reference: `~/.omniroute-builds/current` -> `3.8.51-f77079418/omniroute-3.8.51.tgz`.

Immediate previous archive reference: `~/.omniroute-builds/previous` -> `3.8.51-0bda6c400/omniroute-3.8.51.tgz`.

Previous complete runtime: `~/.omniroute-builds/runtime-backups/20261003-002337`.

Deployment recovery snapshot: `~/.omniroute-local/update-backups/20261003-002337`.

Previous package predates ei new quota scheduler. Oitate rollback korle previous Bridge behavior fire asbe; f770 quota behavior-er recovery-r jonno current f770 archive/source retain kora necessary. Stock global npm install ba installed files manually replace kore child overlay bypass kora uchit noy.

Future upstream release patch region change korle applicability check promotion stop korbe; current live build replace howar age review lagbe. Future Claude app/API protocol change-er 100% compatibility guarantee dewa jay na. Post-update native response/TLS/DNS verification continue korte hobe. Ei pass-e full Mac reboot, new upstream release install ba future Claude version test kora hoyni.

## 10. Evidence index

Evidence directory: `~/Documents/Codex/2026-10-02/omniroute-stability-2245/`.

| Evidence file | Contents |
| --- | --- |
| `quota-deployment.log` | Complete validation/build/package/install/promotion/push record |
| `quota-final-type-gates.log` | Core typecheck and full ratchet |
| `quota-recovery-before.log` | Failing regressions before fix |
| `quota-healthy-scope-before.log` | Scoped-success bug reproduced before fix |
| `quota-recovery-after.log` | Final focused pass |
| `quota-related-tests.log`, `quota-bulk-regressions.log` | Related quota coverage |
| `quota-isolated-package-verification.json` | Installed candidate smoke PASS |
| `native-cli-parallel-results.json` | Actual concurrent native CLI responses |
| `native-claude-code-quota-ok.png` | Native app successful Code response |
| `native-existing-hello-recovered.png` | Existing failed chat recovered |
| `native-routing-log-evidence.json` | Actual eligible-sibling/exhausted-skip routing |
| `quota-worker-live-evidence.json` | Production worker startup, safe quota snapshots and usage endpoint limitation |
| `quota-final-two-active-accounts.png` | Saved pool state |
| `agent-bridge-final-running.png` | Running/trusted Claude DNS-on dashboard |
| `quota-final-live-tls.json` | Final native ingress, TLS and DNS gate |
| `quota-completed-build-cleanup.json` | Exact cleanup paths and protected rollback refs |

## 11. Verification scope

Ei fix real account selection, known quota scheduling, durable state, native Code response ebong parallel CLI path verify kore. Native Cloud Chat, cloud Routines, sob effort/model combination ba unlimited concurrent capacity ei pass-er verified scope noy. Both accounts depleted hole Anthropic quota availability-r jonno wait ba eligible connected account lagbe. Temporary upstream rate limits ba usage API failures completely eliminate kora possible bole claim kora hoyni.


## Addendum: coding quality configuration, 2026-10-03

Porer configuration-only validation: [HANDOFF-OMNIROUTE-2026-10-03-CODING-QUALITY.md](HANDOFF-OMNIROUTE-2026-10-03-CODING-QUALITY.md). Native passthrough/context preserve policy save kora hoyeche; quota recovery ebong cached exhausted-account skip on ache. Native CLI parallel Read tests ebong existing Desktop Code conversation-er follow-up successful. Runtime f770 unchanged; ei configuration pass-e build/restart kora hoyni. Exact saved fields, browser proof, actual large-context observation ebong remaining coverage oi report-e ache.


<!-- handoff-consolidation-2026-10-03 -->

## Latest consolidated handoff: 2026-10-03

Puro setup, Agent Bridge connection/lifecycle fixes, Local coexistence/DNS, durable nexa overlay, quota recovery, coding/context configuration, build RAM/disk control, tests, update/rollback ebong remaining gaps ekshathe: [HANDOFF-OMNIROUTE-2026-10-03-CONSOLIDATED.md](HANDOFF-OMNIROUTE-2026-10-03-CONSOLIDATED.md).

Latest recorded deployment/source/runtime f77079418, OmniRoute 3.8.51; final native CLI Opus/Sonnet ebong Desktop Code response successful. Tar pore coding settings-er 14 checks, native Read/follow-up, large-context observation ebong TLS/DNS gate successful. Ei file-er earlier builds, pending promotion ba cached-quota OFF descriptions historical; latest policy cached exhausted-account skip ON, preflight OFF. Future reset live recovery, remaining Thread mismatch telemetry, full 24-hour soak/new reboot ebong every native feature ekhono separate scope.

Documentation consolidation-e earlier content preserve kora hoyeche; new build ba live service mutation hoyni. User-er 2026-10-03 rule onujayi other people's public repositories-e PR/issue action designated owner session-er; help findings/patch oss-contrib/inbox-e hand over korte hobe. Purono direct-PR workflow latest authorization noy.
