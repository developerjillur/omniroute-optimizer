> **ঐতিহাসিক নথি — public copy, ২০২৬-১০-১৭।** মূল ঘটনার তারিখ ও ফল এই নথির নিজস্ব সময়ের জন্য প্রযোজ্য; পরের সংযোজন থাকতে পারে। বর্তমান অবস্থা ও কাজের নিয়মের জন্য [বর্তমান handoff](../CURRENT-STATUS-2026-10-17.md) পড়ুন। Private reference ও identifier সরানো হয়েছে; স্থানীয় evidence এখানে অন্তর্ভুক্ত নেই। পুরোনো cleanup, build, deploy বা service command বর্তমান অনুমতি হিসেবে ব্যবহার করবেন না।

<!-- handoff-current-state-2026-10-06 -->
# সর্বশেষ হ্যান্ডঅফ নির্দেশনা: 2026-10-06

রক্ষণাবেক্ষণ: Jillur Rahman / NexaLance। সর্বশেষ source, live package, configuration, test, cleanup, recovery ও remaining release gate-এর authoritative entry point এখন [মূল handoff-এর শুরু](HANDOFF-OMNIROUTE-2026-10-02.md), বিশেষ করে [2026-10-06 সংযোজন](HANDOFF-OMNIROUTE-2026-10-02.md#handoff-2026-10-06)। আগের সব report-এর index ওই file-এর শুরুতে আছে।

Source HEAD `a3571d5b29bf53e5fb4b23cbe43269596eb31122`, clean/pristine `nexalance`। Upstream-error/quota fallback, Cost Analyzer, resource safeguard ও Desktop-preserving local updater source-এ আছে; নতুন package build/deploy হয়নি। Installed build এখনও `79412f0ec`, OmniRoute `3.8.51`। আগের a15864e12-এর 761 execution/core/Cost lint এবং নতুন a3571d5b2-এর 15 targeted policy/gate execution পাস; পূর্ণ measured TypeScript ratchet, production package/isolated smoke এবং নতুন package-এর native/restart acceptance বাকি।

শেষ saved setting: Cached quota filtering ON, per-request preflight OFF, cutoff 0; current key-তে local usage cap নেই। Diagnosis-time OFF superseded। Quota, resource এবং live-health values point-in-time evidence; পরের action-এর আগে fresh verification দরকার।

User সব apps খোলা রাখতে বলেছেন। তিনটি obsolete runtime/smoke copy archive/read-back hash verification-এর পরে internal disk থেকে সরিয়ে removal interval-এ 3.37 GiB recovered। Cache-reusing 1 GiB-heap full TypeScript attempt signal-এ incomplete হয়েছে; green gate নয়। Latest saved headroom প্রায় 9.70 GiB, internal free 23.19 GiB; পরের বড় job-এর আগে fresh normal-pressure budget প্রয়োজন। বিকেলের database read-এ তিন active Claude account, একটি account-এর session remainder 99%; নতুন-package native acceptance এর দ্বারা প্রতিষ্ঠিত নয়।

বিস্তারিত [বিকেলের deployment সংযোজন](HANDOFF-OMNIROUTE-2026-10-02.md#deployment-preparation-2026-10-06), নতুন receipt (স্থানীয় বা private reference; প্রকাশিত নয়), [বাংলা report](OMNIROUTE-CLAUDE-QUOTA-AND-CLEANUP-2026-10-06.md), সকালের validation receipt (স্থানীয় বা private reference; প্রকাশিত নয়) ও [source recovery guide](backup/omniroute-worktrees-2026-10-06-092216/RESTORE-QUOTA-COST-UPDATE-2026-10-06.md) retained। Latest delta patch দিয়ে a15864e12 থেকে a3571d5b2 recover করা যায়। নিচের 2026-10-04 ও পূর্ববর্তী sections ইতিহাস।

---

<!-- handoff-current-state-2026-10-04 -->
# 2026-10-04-এর production verification: ইতিহাস

Owner: Jillur Rahman / NexaLance. Documentation updated: 2026-10-04T21:34:37+06:00.

Ei consolidated file-er latest addendum [section 20](#20-complete-quota-solution-and-production-update-2026-10-04). Accepted deployed source/build ekhon `79412f0ec61a9d000862705e5c57b75f26181313`, OmniRoute `3.8.51`. Ager `f77079418` state historical; quota critical-alert fix ebong GPT 6.1 Sol integration latest package-e deployed.

Puro 21-section solution primary [main handoff-er section 14](HANDOFF-OMNIROUTE-2026-10-02.md#14-complete-solution-2026-10-04)-e jukto. Standalone [Claude quota recovery report](HANDOFF-OMNIROUTE-2026-10-04-CLAUDE-QUOTA-RECOVERY.md)-o retained. Nicher ager documentation date, current-state label ebong pending items-ke oi tarikh-er snapshot hisebe porte hobe.

Ei update documentation-only; notun runtime test/build/service/configuration mutation hoyni. Latest verification-er scope section 20 ebong detailed report-e ache.

---

# OmniRoute local setup, Agent Bridge ebong coding workflow: consolidated handoff

Owner: Jillur Rahman / NexaLance<br>
Documentation updated: 2026-10-03, Asia/Dhaka<br>
Scope: 2026-10-02 theke 2026-10-03 porjonto ei setup-er recorded work, fixes, deployment, saved settings, native tests ebong remaining gaps.

## 1. Ei file kivabe use korte hobe

Ei file holo puro kajer current consolidated entry point. Detailed handoff-gulo section 16-te linked ache. Purono files-er content history hisebe preserve kora hoyeche; segulor shuru-te thaka build, account count, pending deployment ba PR workflow-ke latest state dhora jabe na.

Latest recorded application deployment holo `f77079418`, OmniRoute `3.8.51`. Tar pore coding-quality configuration save ebong native validation hoyeche, rebuild chara. Ei documentation update-e source HEAD ebong installed `dist/BUILD_SHA` abar `f77079418` paowa geche; source checkout clean. Ei documentation pass-e live inference, reboot, update ba 24-hour soak abar run kora hoyni. Ager actual tests-er scope niche alada kore deya ache.

User-er updated 2026-10-03 contribution ownership rule section 15-te ache. Eta purono handoff-er public PR instructions supersede kore.

## 2. User-er uddeshyo ebong preserved native state

- Existing Claude Max login, native history, projects ebong sessions rekhe connected provider pool diye model requests chalano.
- Agent Bridge Start-e OmniRoute route active; Stop-e native/default vendor path available thaka.
- Selected Claude model, effort, tools ebong model-er real context/output capability preserve kora; silent cheaper-model substitution ba extra lossy optimization avoid kora.
- Multiple simultaneous coding sessions ebong long unattended work-e avoidable local caps remove kora.
- Fixes `nexa/` build overlay-te durable rakha; settings-only kaj-e rebuild avoid kora.
- Local by Flywheel sites, `omni.local` ebong native ingress ekshathe coexist kora.
- Build-er RAM/disk control, checked generated-file cleanup, evidence ebong recovery paths preserve kora.

Official Claude app bundle ebong Claude Code binary patch kora hoyni. Persistent native configuration-e alternate `ANTHROPIC_BASE_URL`, `ANTHROPIC_API_KEY` ba `ANTHROPIC_AUTH_TOKEN` diye notun account profile rekhe deya hoyni. Earlier alternative Gateway setup theke original native account path-e fera hoyeche. Native login, project/history data ebong official update path preserve kora hoyeche.

Native UI-te `Running a command` group dekha gele seti ekai transport failure-er evidence noy. Official UI grouping customize kora hoyni; response/tool activity ebong matching routing logs diye behavior assess korte hobe.

## 3. Last verified deployment ebong path inventory

| Item | Last recorded value |
|---|---|
| Source | `~/Developer/OmniRoute`, branch `nexalance` |
| Source / installed application build | `f77079418d844a618fd0429afe0a62c86fbcb795` |
| OmniRoute | `3.8.51` |
| Promotion completed | 2026-10-03 00:33:53 Asia/Dhaka |
| Dashboard | `http://omni.local/dashboard/tools/agent-bridge` |
| Gateway | `127.0.0.1:28128` |
| Other local proxy ports | `28131` embedded-service WS; `28132` dashboard WS |
| Agent Bridge | Backend `8443`; native target `claude-code` |
| Native ingress | IPv4/IPv6 loopback HTTPS `443`, hostname-scoped forwarder |
| Active Claude pool at native acceptance | Two OAuth connections; one eligible, one weekly-exhausted; third not connected |
| Overlay inventory at final deployment | 102 manifest items: 67 patches, 33 new files, 2 tooling entries |
| Source base outside overlay | Pristine; final patch applicability 67/67 clean |

| Path | Purpose |
|---|---|
| `~/.omniroute-runtime/` | Installed runtime prefix |
| `~/.omniroute-local/` | DATA_DIR, `.env`, encrypted storage, Bridge certificates and logs |
| `~/.omniroute-local/storage.sqlite` | Settings, provider connections, quota state and other local data |
| `~/.omniroute-local/mitm/ca.crt` | Previously approved/trusted local Bridge CA |
| `~/.omniroute-local/bridge-upstream-dns.cjs` | Provider egress public-DNS shim; versioned source `nexa/deploy/bridge-upstream-dns.cjs` |
| `~/.omniroute-local/logs/application/app.log` | Application/routing log; private |
| `~/Library/Logs/OmniRoute/` | Service and updater logs |
| `~/Developer/OmniRoute/nexa/` | Durable patches, new files, deploy helpers, docs and QA |
| `/Library/Application Support/OmniRoute-Native-Ingress/` | Installed privileged ingress and binder |
| `/Library/LaunchDaemons/com.nexalance.omniroute-native-ingress.plist` | Boot ingress job |
| `/Library/Application Support/OmniRoute-Local/` | Local domain forwarder and coexistence support |
| `<local-setup>/` | Portable setup kit, docs, original assets and historical backups |

Launch jobs: `com.nexalance.omniroute` service LaunchAgent; `com.nexalance.omniroute-updater` managed update LaunchAgent; `com.nexalance.omni-local` local-domain LaunchDaemon; `com.nexalance.omniroute-native-ingress` native HTTPS LaunchDaemon.

Credential values ekhane nei. `.env`, encryption key, OAuth storage, API key, dashboard credentials ebong raw logs public share kora jabe na. Template diye existing secret environment replace kora uchit noy.

## 4. Native request path ebong Start/Stop

```text
Existing Claude Code / Claude Desktop Code tab
  -> api.anthropic.com HTTPS :443
  -> hostname-scoped localhost ingress
  -> Agent Bridge :8443
  -> OmniRoute :28128, native Anthropic messages route
  -> eligible connected Claude account / selected model
```

Ingress encrypted TLS bytes forward kore; Bridge trusted local CA diye TLS terminate kore. Provider egress public DNS path use kore jate intercepted hostname localhost-e ghure loop na hoy. Native model/auth request path ebong native app data layer alada.

Forwarder sudhu selected Anthropic SNI Bridge-e pathay. Other SNI Local router-er route use kore. Bridge unavailable hole native vendor TLS fallback ache. Original account exhausted hole Stop-er default connection-eo genuine provider quota error hote pare.

Dashboard Stop intentional state; auto-recovery explicit Stop-ke undo kore na. Earlier Stop/Start three cycles successful. Restart/promotion incomplete stream close korte pare; eta zero-downtime active-stream transfer solution noy.

## 5. Work timeline ebong ki ki fix hoyeche

| Phase / issue | Work ebong recorded outcome |
|---|---|
| Base install, local domain, updater | Local runtime/DATA_DIR, loopback dashboard, login service, `omni.local`, fork ebong versioned child overlay/update command setup |
| Original account path | Alternative account/profile behavior review kore native login path retain; binary/app bundle patch noy |
| CLI 401 / existing VS Code sessions | New requests successful; stale process/session environment issue-e full VS Code reopen-er pore user confirmed recovery; history delete noy |
| CA trust ebong dashboard routing | User administrator prompts complete kore previously approved local CA/Claude-only hosts routing activate korechhen |
| Restart/login `ECONNREFUSED` | Missing/unready native :443 ingress identify; stable boot helper and fallback add |
| `8443 already in use`, PID missing | Shared lifecycle state, Start/Stop locks, readiness before PID publication, exact ownership, exiting child sudhu nijer PID clear kore; duplicate starts surviving listener replace kore na |
| Mid-response disconnect / 502 | Request-local async error/abort isolation, raw bytes/backpressure preserve, foreign JSON SSE-te append bondho; bad DNS request-e listener survives |
| `Bootstrap failed: 5` | launchd loaded-state check, teardown wait and bounded bootstrap retries; repeated bare bootstrap-ke solution dhora hoyni |
| Shutdown process alive / closed port | Tracked connections, idle cleanup, bounded shutdown; updater exact owned process stop kore; unrelated PID untouched |
| Native negotiated headers | Client thread, inline tool ebong Advisor beta eligibility preserve; count route-e header/cancellation forward |
| Token counting | Native count path/query provider count endpoint-e jay; generation/estimated-count substitute noy |
| Legacy model compatibility | Unsupported adaptive injection ebong forced legacy 1M beta avoid |
| Cache/thread marker overflow | Thread/server slot budget ebong final serialization marker limit; client markers arbitrary unlimited kora hoyni |
| False model cooldown | Thread-resource 404-ke model-not-found lockout dhora bondho; actual client recovery preserve |
| Session/account continuity | Session affinity rolling 24h enable; earlier round-robin-er thread state mismatch diagnosis recorded |
| Native text/tool fidelity | Native client recognition; zero-width text obfuscation off; optional system pipeline bypass; silent native tool-list truncation off |
| Older/smaller family fallback | Claude OAuth `getNextFamilyFallback` substitution off; eta every possible fallback path disable claim noy |
| Known quota retry loops | Durable blocked scopes, actual reset schedule, fresh usage confirmation, bounded retries, startup hydration |
| Runtime-only fix lost on update | Custom work versioned `nexa/` overlay-te; build/package/isolated/live gates and rollback |
| Build RAM / ENOSPC | Managed bounded runner, serial validation, Node 24, reduced workers, RSS watchdog, disk guards and checked cleanup |
| Final coding configuration | Passthrough, buffers off/zero, compression/trimming/injection/response cache off; native tests successful without rebuild |

Intermediate failed candidate, OOM, smoke 429 ebong rejected deployment-ke successful deployment hisebe count kora hoyni. Final application promotion-er gate successful real inference require korechhe.

## 6. Local by Flywheel coexistence ebong DNS

Local router nginx wildcard `*:80` / `*:443` bind kore. Earlier root-owned specific sockets Local-er user-owned wildcard bind block korechhilo; reboot-er start order-e outage visible hoy. Installed socket binder privileged bind kore user-owned sockets inherited forwarder-e dey, tarpor forwarder `nobody` hisebe runs. `SO_REUSEADDR` ebong checked inherited descriptors diye coexistence preserve hoy.

`scripts/omni-bind.pl`, `scripts/omni-local-proxy.mjs`, `scripts/omni-local-root.sh` portable kit-e ache; ingress support `nexa/deploy/`-te versioned. pf redirect attempt unsuccessful chhilo ebong rolled back; active design socket coexistence. Historical checks-e Sagrilo wp-admin 302, HTTPS 200, Acima 200, Byars wp-admin 302 ebong omni.local health 200 chhilo.

Hosts entry thaka sotteo macOS client DNS public IP resolve kora alada problem chhilo. Forced-loopback TLS health-ke native acceptance dhora hoyni. Versioned installer DNS refresh kore; enabled Bridge live gate actual OS DNS loopback require kore, jate native client Bridge bypass kore quota error dile dhora pore. Later quota/coding native acceptance-e DNS/TLS gate PASS recorded.

Earlier system-wide `.local` lookup latency roughly five seconds observed. Continuous domain performance, Local router regeneration ebong final new full-Mac reboot alada acceptance scope; documentation pass-e egulo retest hoyni. Domain `omni.local` retain kora hoyeche; public `omni.com` use kora hoyni.

## 7. Final coding-quality settings

| Setting / feature | Final saved/effective state |
|---|---|
| Thinking Budget | Explicit `mode: passthrough` |
| Usage Token Buffer | `0`, extra context-budget margin remove |
| Combo reasoning token buffer | Off |
| Prompt Compression / effective pipeline | Off / off |
| Adaptive context budget / Context Editing | Off / normalized default off |
| Gateway MCP accessibility trimming | Off |
| Gateway Skills injection | Off; native client tools/skills unchanged |
| Global System Prompt / Memory / Qdrant | Off |
| Claude system transform pipeline | Disabled, empty |
| Payload default/override/filter/defaultRaw rules | Empty |
| Terse / Less code / Ponytail / action-first styles | Off |
| Background degradation / adaptive volume routing | Off |
| Zero-latency hedging / fallback compression | Off |
| Exact and vector response cache | Off |
| Upstream prompt-prefix cache | On, strategy Auto |
| Client cache_control | Auto |
| Prompt-cache locality / session stickiness | Retained |
| Selected model | Existing exact Claude mapping, no cost downgrade rule |
| Fast Mode spoofing / paid fast override | Off |
| Quota reserve/preflight cutoff | Off |
| Cached exhausted-account filtering | On |

Stored `customBudget: 10240` ebong `effortLevel: medium` Custom/Adaptive mode-er dormant fields. Passthrough-e native effort/thinking cap hoy na. Usage Buffer UI-r reported-metering wording current implementation-er exact explanation noy; source extra `context_budget_*` headroom create kore. Zero mane provider capacity barano noy.

Cache consistency finding: UI master `databaseSettings/cache.semanticCacheEnabled` read kore, exact response handler `settings.semanticCacheEnabled` read kore, missing hole enabled. Runtime flag false ebong legacy `databaseSettings.semanticCacheEnabled` false align kora hoyeche; normal save-er pore effective settings verified. Future master-switch change-e both stores check korte hobe. Eta known-settings DB correction; ei step-e source/build/PR change hoyni.

Raw model-er trained intelligence increase ba statistically better-than-native output ei settings pass-er verified result noy. Extra rewriting/trimming avoid kora ebong native controls preserve kora-i purpose. Provider executor-er protocol adaptation ache; universal byte-identical requests claim kora hoyni.

## 8. Context window ebong long-session interpretation

Final controlled native tests-e `claude-opus-5-5[1m]` xhigh ebong `claude-sonnet-5-5` high metadata: context `1,000,000`, max output `128,000`. Both actual Read tool use kore exact fixture text preserve korechhe. Existing user traffic-e Opus input `846,739`, HTTP 200, upstream cache read `846,255` observed; eta synthetic saturation test noy.

System, tools, results, history ebong generated output window share kore. Prompt cache input-er context occupancy komay na. Native auto-compaction retained; fixed maximum-thinking/output ba auto-compaction threshold force kora hoyni. Smaller/legacy model-ke false 1M override deya hoyni. Model capacity metadata mane every request-e 128k output force kora noy.

References already used in the coding review: [Claude Code model configuration](https://code.claude.com/docs/en/model-config), [Claude context windows](https://platform.claude.com/docs/en/build-with-claude/context-windows), [Gateway requirements](https://code.claude.com/docs/en/llm-gateway). Ei documentation pass-e source websites-er new verification hoyni.

## 9. Local limits, concurrency ebong 24-hour work

- Local-default API key: active-session cap 0, throttle 0, custom rate limits empty, access schedule off, no expiry, USD quota off; token/allocation tables empty.
- Both Claude connections: rate protection off, max concurrency null, overrides null. Auto rate queue enable off. Dormant queue defaults active Claude throttling-er evidence noy.
- `STREAM_ACTIVE_TIMEOUT_MS=0`: active stream-er local total-time watchdog off.
- Stream idle/readiness ebong MITM cleanup 600,000 ms. Egulo dead/idle individual request cleanup, full conversation-er 24-hour cap noy.
- Session affinity 86,400,000 ms: protiti eligible use-e refresh; rolling inactivity lifetime, continuous-chat shutdown timer noy.
- Earlier body/admission budgets raised and context-window gateway check disabled; actual provider capacity enforce hoy. Local memory/security/resource safeguards-ke unlimited capacity hisebe dhora hoyni.

Mac awake, service running, network working ebong eligible provider quota dorkar. Machine sleep, genuine provider rate/weekly/session limit, model capacity, auth expiry/failure ebong native-client lifecycle locally remove kora jay na. Paid extra usage or reset credits enable kora hoyni. Full 24-hour soak ekhono unverified.

## 10. Automatic quota recovery contract

1. Usage metadata ebong model-response evidence theke real blocked account/scope persist hoy.
2. Known future reset-er age repeated model request ba worker usage probe pathano hoy na. Bulk scheduled sync saved future wall skip kore; manual Refresh available.
3. Global blocking windows sob clear hote hobe; scope-specific resets independently recheck kora jay.
4. Reset deadline-e fresh usage read hoy; required OAuth refresh existing per-account mutex/persistence path use kore.
5. Fresh recovery confirm hole account eligible ebong dashboard quota cache update hoy. Clock par howa alone enough noy.
6. Unknown/failed check-e known wall retain; at most five-minute interval-e retry. Worker one-minute tick-e deadline-er praye ek minute por check hote pare.
7. Restart-e SQLite snapshots theke schedule hydrate hoy. Manually inactive account auto-enable hoy na.

Account recovery already failed native/background job auto-replay kore na; failed chat-e `Try again` lagte pare. Original native account-er usage UI tar nijer quota dekhay, even sibling provider response dileo. Earlier weekly reset recorded October 6 09:00 Asia/Dhaka; future real reset successful recovery observed hoyni. Usage endpoint-er independent HTTP 429 observed while model calls successful; scheduler startup live verified, reset behavior regression-tested.

Durable quota files: `nexa/patches/src__domain__quotaCache.ts.patch`, `src__domain__quotaCacheState.ts.patch`, `src__lib__usage__providerLimits.ts.patch`; new `nexa/new/src/domain/claudeQuotaSchedule.ts`, `nexa/new/tests/unit/agent-bridge-quota-recovery.test.ts`; source behavior doc `nexa/docs/CLAUDE-QUOTA-RECOVERY-2026-10-03.md`.

## 11. QA record, scope ebong exceptions

| Test / gate | Recorded result and boundary |
|---|---|
| Earlier native model matrix | 12/13; Sonnet 4.5 quota/availability exception |
| Earlier model/effort/count matrix | 23/24; same exception; not every legacy effort combination |
| Four simultaneous sessions + four resumes | PASS; own conversation markers retained |
| One stream cancel + three surviving streams | PASS; listener PID retained |
| Native CLI Agent tools / Desktop two parallel Agents | PASS; expected 99/89 results recorded |
| Native token count / tools / headers | Provider-sourced count and Read/Write/stream/resume coverage PASS |
| Stop/Start | Three successful cycles; intentional Stop not undone |
| Final f770 managed Bridge regression | 553 PASS, 0 fail |
| Final UI / native fidelity / security gates | 21 / 72 / 34 PASS respectively |
| Final deploy/resource helper gate | 23 PASS |
| Quota focused / related / bulk coverage | 19 / 28 / 8 PASS; overlapping counts |
| Core typecheck / focused lint | PASS |
| Full TypeScript ratchet | 5830 measured = 5830 existing baseline; not full repo error-free |
| Final patch applicability | 67/67 clean |
| Fresh installed f770 candidate | Isolated real Claude inference + contract gates PASS before promotion |
| Post-promotion native CLI pair | Opus [1m] and Sonnet concurrent, exit 0; NATIVE_OPUS_OK / NATIVE_SONNET_OK |
| Native Desktop Code | Existing account, Opus Extra, NATIVE_APP_BRIDGE_OK; failed Hello conversation recovered on retry |
| Final coding Read pair | Opus xhigh 11.78s, Sonnet high 8.40s; exact text/marker + Read, both exit 0 |
| Final existing Desktop follow-up | NATIVE_SETTINGS_FINAL_OK + FULL_CONTEXT_CODING_OK; Idle |
| Saved coding settings | 14 checks true |
| Last native TLS/DNS gate | Backend, ingress, hostname scope, client DNS PASS |
| Coding configuration process continuity | Bridge PID record unchanged; no rebuild/restart |

Suites overlap, tai counts jog kore independent total bola jabe na. Old full repository suite-e inherited failures chhilo; focused green gates-ke full repository/CI green bola hoyni. Public PR/CI latest state ei documentation pass-e inspect kora hoyni.

Some mixed live traffic-e recoverable Thread mismatch 400 (anthropic-beta/cache_control/system) observed, followed by 200. Sob such retry-ke synthetic fixture-e attribute ba direct-vs-Bridge root cause confirm kora hoyni. Known header/cache/thread fixes ebong remaining mismatch telemetry alada record.

Still separate acceptance scope: latest full Mac reboot, new upstream/native version, 24-hour soak, full 1M saturation/128k generation, every model/effort, final verified two-account thread rotation under exhaustion, third account, actual local scheduled task, Cloud Routine, ordinary Chat/Cowork parity and coding-quality benchmark.

## 12. Build budget, disk cleanup ebong retained recovery

Final managed profile: Node 24, Node heap 6144 MiB, descendant RSS watchdog 8192 MiB, Next worker 1, Webpack parallelism 8, serial gates, nice +10. Earlier 5 GiB/Node 26 attempts OOM hoyechhilo; not promoted. Successful pre-quota candidate peak 6530 MiB; final f770 production build peak 5730 MiB, packaging peak 463 MiB. Sampled watchdog OS hard reservation noy; short between-sample spike possible.

Build free-space guards source stage-e 24 GiB, staged install-e 6 GiB. Current settings-only change ebong handoff update-e build dorkar hoyni. Direct unmanaged build wrapper-er resource controls bypass korte pare.

Checked generated-only cleanup-e old build worktrees, smoke installs ebong obsolete candidates remove hoyeche; personal data/T7 originals delete hoyni. Earlier broad cleanup free space 3.7 GiB theke roughly 81 GiB korechhilo; later f770 cleanup net roughly 7.6 GiB reclaimed, final then-observed available roughly 65.7 GiB. Egulo point-in-time results, current free-space guarantee noy.

Retained recovery record:

| Artifact | Recorded path |
|---|---|
| Current package | `~/.omniroute-builds/3.8.51-f77079418/omniroute-3.8.51.tgz` |
| Current package SHA-256 | `02c79139f69a9b7fe3b17a5739f344a97ba340973f0b8fcb641d5796ffebdecb` |
| Immediate previous package | `~/.omniroute-builds/3.8.51-0bda6c400/omniroute-3.8.51.tgz` |
| Previous complete runtime | `~/.omniroute-builds/runtime-backups/20261003-002337` |
| Matching deployment recovery snapshot | `~/.omniroute-local/update-backups/20261003-002337` |

Previous 0bda package new quota scheduler-er age; rollback korle f770 quota behavior thakbe na. Current archive/source retain kora necessary. Historical backup/delete lists current inventory noy; future cleanup-e exact current paths print/check korte hobe.

## 13. Update ebong rollback procedure

Managed entry point Dashboard Update ba `omni-ctl update`. Eta user-triggered updater; continuously nijer theke release install scheduler claim noy. Source isolated worktree-e apply, pristine/dirty checks, patch applicability, type/regression/resource/package checks, installed candidate real inference, then promotion/live gates. Required gate fail hole working runtime retain or matching prefix/database recovery.

Saved DB, `.env`, encryption key, provider connections/model mappings, certificate state and required runtime extras preserve korte hobe. Template ba stock npm package diye live state replace kora managed path noy. Compatibility failure-e patch review lagbe; unknown future releases 100% compatible claim kora jabe na.

```sh
omni-ctl status
omni-ctl update-status
omni-ctl logs
```

Actual update request-er jonno `omni-ctl update`; committed local source redeploy-er jonno `omni-ctl redeploy`; live promotion chara candidate validation-er jonno `omni-ctl build-only`. Documentation update nijer theke ei commands trigger kore na. Active stream cholakalin runtime promotion interruption korte pare.

Post-update acceptance: version/BUILD_SHA, owned backend/ingress listeners and launch jobs, actual OS DNS, trusted TLS, eligible model/effort, tools/count/headers, streaming/resume/concurrent/cancel, Desktop Code response, Local sites and explicit Stop/default path. Dashboard Running ba `/healthz` 200 alone enough noy. Earlier reboot evidence final f770 deployment-er new full-reboot proof noy.

## 14. Remaining gaps ebong troubleshooting priority

1. Provider real quota/rate/usage-API failures remain external limits. Cached exhausted skip off kore loop recreate kora uchit noy.
2. Remaining Thread mismatch telemetry root cause full captured direct-vs-Bridge comparison-e verify korte hobe; old fixed thread 404/header/cache bugs-er sathe blanket same issue dhora jabe na.
3. Third account login and true multi-account exhaustion/rotation acceptance pending. Unrelated account/history change noy.
4. Full 24-hour soak, final cold reboot, local scheduled task ebong cloud/Chat/Cowork scopes separately test korte hobe.
5. Future cache UI/runtime switch consistency source fix review candidate; current false flags aligned, implementation gap documented.
6. `.local` DNS latency and cold Local router behavior retest necessary before universal boot-order/performance claim.
7. Certificate renewal/regeneration-e adapter/CA/leaf synchronization verify; TLS verification disable kora solution noy.

Existing session loading/401-e first fresh process/resume ebong actual route check; user-er earlier VS Code reopen recovery recorded. Missing native route-e hosts content alone enough noy; normal DNS, port owner, native request and matching log require. Raw logs/screenshots public share-er age secrets ebong private project content remove korte hobe.

## 15. Repository attribution ebong public contribution ownership

2026-10-03 user rule: other people's public repositories-e PR/issue open, push, comment, edit ba close kora jabe na. Public contribution work-er designated session `NexaLance All Projects/nexa-media`-te owns end to end. Help-er findings/patch `~/Desktop/NexaLance All Projects/oss-contrib/inbox/`-e hand over kore stop korte hobe.

Ei rule purono handoff-er direct PR/issue workflow supersede kore. Old PR references historical evidence; current approval ba new public action-er authorization noy. Ei documentation pass-e kono public repository/PR/issue action, source commit, push ba build hoyni.

Repository author/committer: `Jillur Rahman <22579419+developerjillur@users.noreply.github.com>` alone. No tool attribution/footer/coauthor. Existing historical filename preserve kora hoyeche; attribution owner-er.

## 16. Detailed handoff index

| Record | Kothay ki detail |
|---|---|
| [Main setup/history](HANDOFF-OMNIROUTE-2026-10-02.md) | Base installation, service/domain/fork/updater, Local outage, limits, cleanup, later deployment and quality addenda |
| [Initial Bridge setup](CODEX-AGENT-BRIDGE-SETUP-HANDOFF-2026-10-02.md) | Original-account restoration, CA/hosts, early runtime compatibility, mapping, Start/Stop, native update and scheduled scope |
| [Durability](AGENT-BRIDGE-DURABILITY-HANDOFF-2026-10-02.md) | Boot ingress, stable installer/path, managed update and rollback |
| [Connection/lifecycle repair](AGENT-BRIDGE-CONNECTION-FIX-HANDOFF-2026-10-02.md) | ECONNREFUSED, port conflict, isolation, bootstrap, shutdown, ENOSPC and live tests |
| [Full QA](AGENT-BRIDGE-FULL-QA-HANDOFF-2026-10-02.md) | 13-model matrix, effort/count, four-session resume/cancellation, Agent tools, exceptions |
| [Local/DNS follow-up](AGENT-BRIDGE-LOCAL-COEXISTENCE-DNS-HANDOFF-2026-10-02.md) | Flywheel coexistence, inherited sockets, actual DNS mismatch and installer/gate fixes |
| [Native quality/build budget](HANDOFF-OMNIROUTE-2026-10-02-NATIVE-QUALITY-AND-BUILD-BUDGET.md) | Text/tool fidelity, family fallback, recovered source changes, bounded build failures/passes and cleanup |
| [Quota recovery/deployment](HANDOFF-OMNIROUTE-2026-10-03-QUOTA-RECOVERY.md) | Final f770 promotion, durable schedule, native response, test counts, archive and recovery |
| [Coding-quality settings](HANDOFF-OMNIROUTE-2026-10-03-CODING-QUALITY.md) | Exact settings, cache-store mismatch, context/coding tests, long-session interpretation and evidence |

Bangla full-text explanation ei chat-e deya hoyeche. New consolidated file Banglish-e user-er latest global language instruction follow kore. Historical documents rewrite/rename kora hoyni.

## 17. Evidence index ebong documentation verification

| Private evidence directory | Main record |
|---|---|
| `~/Documents/Codex/2026-10-02/omniroute-agent-bridge-config-074223` | Initial approved configuration, compatibility evidence, early native Start/Stop |
| `~/Documents/Codex/2026-10-02/omniroute-configuration-review-082544` | Earlier quality, updater, app integrity and state audit |
| `~/Documents/Codex/2026-10-02/agent-bridge-lifecycle-1128` | Shutdown, request isolation, duplicate start and package/native regression evidence |
| `~/Documents/Codex/2026-10-02/agent-bridge-full-qa-1300` | Model/effort/Agent/count/concurrency/resume/cancellation QA |
| `~/Documents/Codex/2026-10-02/agent-bridge-local-coexistence-1859` | DNS/Local coexistence investigation and targeted tests |
| `~/Documents/Codex/2026-10-02/omniroute-stability-2245` | Source reconciliation, bounded builds, quota regressions, f770 deployment and actual native acceptance |
| `~/Documents/Codex/2026-10-03/omniroute-coding-quality-0130` | Redacted settings, 14 checks, CLI Read pair, Desktop proof, large-context metadata, live TLS/DNS and PID continuity |
| `~/Documents/Codex/2026-10-03/omniroute-handoff-consolidation` | Before inventory and documentation append/links validation receipt |

Native settings proof: `ai-settings-final.jpg`, `gateway-skills-final.jpg`, `context-settings-final.jpg`. Coding verification: `native-parallel-summary.json`, `quality-configuration-checks.json`, `bridge-live-final.json`, `bridge-pid-continuity.json`, `observed-large-context-live.json`. Quota deployment verification: `native-cli-parallel-results.json`, `quota-final-live-tls.json`, `quota-isolated-package-verification.json`, `quota-worker-live-evidence.json`.

Documentation update-e original files-er exact byte prefixes and SHA-256 verify kore append kora hoyeche. Existing handoffs + README latest entry point-e link kore. Credential values ba raw private conversation ekhane copy hoyni; large runtime backup, recursive cleanup ba service mutation hoyni.


## 18. Codex image API experiment, 2026-10-03

Browser diye `codex-imagegen-experiment-2026-10-03` name-er notun API key create kora hoyeche. Key-ti 3-ti Codex image routing model, current ekta Codex connection ar Images inference endpoint-e restricted; management, compression ar auto combos off. Credential value protected home file-e mode 600-e ache, report/T7 archive-e nei.

Client-er sudhu oi OmniRoute key diye `POST http://omni.local/v1/images/generations`-e Sol, Terra ar Luna protita ekbar HTTP 200 diye PNG return koreche. Existing `codex-imagegen` skill-er API mode diye fourth generation-o successful; audit-e local Codex CLI runs 0. Four image-e requested 1024x1024-er jaygay actual 1254x1254 return hoyeche. Key page counter 0 reqs dekhaleo key-attributed call log-e four successful requests ache. Cost metadata 0 unlimited/provider-quota-free usage-er proof noy. Image edit/batch/parallel/exact engine selection test kora hoyni.

Full report: [OMNIROUTE-CODEX-IMAGEGEN-EXPERIMENT-2026-10-03.md](OMNIROUTE-CODEX-IMAGEGEN-EXPERIMENT-2026-10-03.md). Evidence: `evidence/image-api-experiment-2026-10-03/`, four original PNG ar 22 hash-verified artifacts. Current source/runtime f77079418; ei experiment-e source edit, rebuild, restart ba Agent Bridge/native account configuration change hoyni.


## 19. Explicit image-model matrix, 2026-10-03

Same experiment key diye Responses API-te GPT-5.5 ar GPT-5.6 Sol/Terra/Luna protitar sathe GPT Image 2, 2.5 Sunburst ar 2.5 Flare selector pathiye 12 real generations, plus 1 invalid-model control run kora hoyeche. All 13 successful PNG/completed streams. Requested backing GPT model protita match; returned image tool sob khetre `gpt-image-2-codex`. Invalid image-model name-o generate koreche, tai request-er name ba HTTP 200 specific 2.5 engine use howar proof noy.

12 matrix output-er 6 low, 6 medium quality metadata, 0 high; requested 1024x1024-er bodole sob 1254x1254. Actual 2.5 Sunburst/Flare quality/speed/editing comparison verified hoyni. One red-mug brief-e Sol-er 3 sample clean background, Terra-r 2, GPT-5.5/Luna-r 0; eta single-brief observation, universal ranking noy.

Same key-r temporary Responses/backing-model permission restore kore original image-only scope verify kora hoyeche: image catalog 200/3 original entries, Responses 403 intentional endpoint restriction. Call logs-e 13 successful Responses request same Codex connection-e attributed. Source/runtime f77079418; no rebuild, restart ba native configuration change.

Detailed method, 12-row result, server-returned model/quality fields, official 2.5 access method, scope restoration ar limitations experiment report-er sections 10-17-e append kora hoyeche: [OMNIROUTE-CODEX-IMAGEGEN-EXPERIMENT-2026-10-03.md](OMNIROUTE-CODEX-IMAGEGEN-EXPERIMENT-2026-10-03.md). New evidence: image-model-matrix-2026-10-03 (স্থানীয় বা private reference; প্রকাশিত নয়), original PNG, redacted JSON, comparison sheet/HTML ar SHA-256 manifest. Exact credential value archive/report-e nei.

<!-- claude-quota-summary-2026-10-04 -->

## 20. Complete quota solution and production update, 2026-10-04

Puro solution primary [HANDOFF-OMNIROUTE-2026-10-02.md-er section 14](HANDOFF-OMNIROUTE-2026-10-02.md#14-complete-solution-2026-10-04)-e 21-ti subsection hisebe integrated. Detailed dated record: [HANDOFF-OMNIROUTE-2026-10-04-CLAUDE-QUOTA-RECOVERY.md](HANDOFF-OMNIROUTE-2026-10-04-CLAUDE-QUOTA-RECOVERY.md).

| Topic | Latest accepted result |
| --- | --- |
| False quota error | 90% used/10% left critical alert ar actual exhaustion alada; available account pre-dispatch block hoy na |
| Local usage policy | 3-ti API key-r budget/RPM/day/session caps OFF; all provider concurrency caps absent; Claude window cutoff `0%` |
| Account scheduling | Available connection priority 1; actual depleted connection provider reset porjonto skipped; healthy sibling fallback retained |
| Quota cache | Filtering ON with fixed predicate; optional preflight OFF; known depleted account-e repeated doomed request noy |
| Quality/context | Thinking passthrough, buffer 0, Claude transform pipeline OFF; native context/model/effort test evidence preserved |
| Durable source | All changes `nexa/` under-e; main source clean; `e06ca004e` and `79412f0ec` commits |
| Full production UI | Quota/Agent Bridge compiled controls package gate-e required; null dashboard stubs rejected |
| Bounded build | One worker, 6 GiB RSS limit; observed peak 5,268 MiB; no Electron/Docker build |
| Regression | Focused 64, helper 27, Bridge 553, UI 21, protocol/identity 72, security 34 pass; suite overlap ache |
| Isolated acceptance | 10/10 cases accepted, including six parallel JSON/SSE responses and expected depleted-only cached 429 |
| Native/live acceptance | Production 5/5 request/CLI cases; low/max native CLI concurrent success; native Desktop Opus 5.5/Extra response, displayed 110k/1M |
| Service restart | Real API/native CLI successful after restart; cutoffs/cache policy persisted; native and ingress file hashes unchanged |
| GPT 6.1 Sol | Live 6/6 integrated checks and native CLI success; image experiment key policy unchanged |
| Disk cleanup | 8.83 GiB generated output reclaimed; receipt showed 26.21 GiB free; source/live data/rollback retained |

Verified production package:

```text
~/.omniroute-builds/3.8.51-79412f0ec/omniroute-3.8.51.tgz
SHA-256: befbbd894c4b9004f3abe32fbdb3f28b97e14b1a270ef24d7a8ccb5b81617ef5
```

Matching pre-deploy data backup and previous runtime:

```text
~/.omniroute-local/update-backups/20261004-151007-claude-quota
~/.omniroute-builds/runtime-backups/20261004-151007-claude-quota
```

Primary evidence: validation-summary.json (স্থানীয় বা private reference; প্রকাশিত নয়), final-limits-audit.json (স্থানীয় বা private reference; প্রকাশিত নয়), restart-verification.json (স্থানীয় বা private reference; প্রকাশিত নয়), native app screenshot (স্থানীয় বা private reference; প্রকাশিত নয়).

Actual provider quota/throughput limits ebong memory safety protection retained. Dashboard critical badge eka routing block-er evidence noy. Native app-er original-account weekly badge-o whole connected pool-er balance noy. Old failed tasks automatically resume kora hoyni.

Accepted scope-er baire: 24-hour soak, full 1M/872K context stress, ei run-e Mac reboot, live future reset wait, rollback drill, every native feature ebong future app/provider versions. Future update-e overlay patch drift, resource/space guard, package/full-dashboard gate ebong actual native acceptance checks continue korte hobe.

Ei documentation update-te purono records preserved, source/runtime/configuration unchanged. Latest public contribution ownership rule retained; kono public PR/issue action kora hoyni.

## 2026-10-06: Google verification incident-এর সর্বশেষ অবস্থা

এই section আগের release history অক্ষত রেখে নতুন Google incident-এর বর্তমান status যোগ করে। পূর্ণ বাংলা বিশ্লেষণ: [OMNIROUTE-GOOGLE-ACCOUNT-HEALTH-2026-10-06.md](OMNIROUTE-GOOGLE-ACCOUNT-HEALTH-2026-10-06.md)।

বর্তমান 403-এর কারণ priority #4 Google identity-এর verification challenge; model-specific 429 quota আলাদা। 20:16:56 বাংলাদেশ সময়ের fresh snapshot-এ সব 14 record-এর token expiry বৈধ ও mirrored; automatic renewal চলেছে। Dashboard active / valid OAuth token প্রকৃত inference eligibility-এর নিশ্চয়তা নয়।

Live dashboard-এ #4-এর AGY ও Antigravity connection disabled করা হয়েছে। অন্য eligible account বজায় আছে; #7 পূর্বের manual disable অক্ষত। #2-এর genuine inference Retest HTTP 200, provider reset-এর পরে Flash quota 100%, এবং `antigravity/gemini-3.8-flash-high` real API completion `OK` / HTTP 200 / 4.08 seconds পেয়েছে। Google verification স্বাভাবিকভাবে সম্পূর্ণ না হওয়া পর্যন্ত #4 recover হয়েছে বলা যাবে না।

Private source fix **`892551a41`** `nexa/` overlay-এ commit করা: verification 403 আর futile token refresh করে না; same Google identity barrier shared; OAuth renewal quota/transport/verification/manual-disable state মুছে দেয় না; genuine inference success timestamp মিলিয়ে recovery করে। Main `a3571d5b2`, installed runtime `79412f0ec`। **এই নতুন fix deploy হয়নি।**

79 patch apply check এবং pristine base PASS; 14 isolated JavaScript checks PASS। 10 native tests লেখা হলেও memory warning-এর কারণে child launch হয়নি, guard exit 75। Full TypeScript/ratchet/package/smoke ও post-deploy native/parallel/restart acceptance pending। Skill-এর **“NEVER deploy without the validation gate green”** instruction প্রযোজ্য: [nexa-overlay/SKILL.md](../../../nexa/skill/nexa-overlay/SKILL.md)। Latest headroom 4.92 GiB, pressure warning, swap 19.21 GiB, internal free 25.15 GiB; user apps খোলা রেখে build স্থগিত আছে।

রিপোর্টে sanitized evidence, live screenshot এবং নিরাপদ release resume ধাপ আছে। পূর্বের production `79412f0ec` acceptance এই source change-এর acceptance হিসেবে গণ্য নয়। Official native app পরিবর্তন, quota value edit, credential exposure বা public repository action হয়নি।

### 2026-10-06 20:37: all-active-connection probe-এর ফল

পাঁচটি active Google identity-এর দশটি AGY / Antigravity connection sequential Retest করা হয়েছে, logical connection-test HTTP 200 দশটিতেই। Generic 400 probe inconclusive হিসেবে accepted হতে পারে; তাই এগুলো দশটি successful completion নয়। #4 verification quarantine ও #7 পূর্বের manual disable অক্ষত।

নতুন real #2 Antigravity `gemini-3.8-flash-high` completion upstream quota-exhausted HTTP 429 দিয়েছে; fresh AGY #2 quota 0% হওয়ায় সেই connection-এ আর request যায়নি। বর্তমান fresh Flash snapshots সক্রিয় পাঁচ identity-তেই 0%। আগের 20:13-এর API success বর্তমান allowance প্রমাণ করে না।

Paired #2 provider records-এ stale quota mismatch পাওয়া গেছে: Antigravity 20:12-এর 100%, AGY 20:36-এর 0%। এই freshness / shared cooldown gap পৃথকভাবে resolve ও validate করতে হবে; verification-only commit `892551a41` দিয়ে সমাধান হয়েছে বলা হয়নি। Main/runtime/source deployment status অপরিবর্তিত, সব user apps খোলা, কোনো build/restart হয়নি। Updated [পূর্ণ রিপোর্ট](OMNIROUTE-GOOGLE-ACCOUNT-HEALTH-2026-10-06.md) ও live matrix receipt (স্থানীয় বা private reference; প্রকাশিত নয়) দেখুন।


### 2026-10-06: Re-login Flash Low account test ও routing mismatch

AGY ৭টি ও Antigravity ৬টি active connection, মোট ৮টি Google identity পাওয়া গেছে। `gemini-3.8-flash-low`-এর চারটি initial Dashboard test requested AGY #1–#4-এ না গিয়ে একই AGY #7 (`private-id-002`, `amo***@gmail.com`)-এ গেছে; চারটি upstream log-ই Google verification HTTP 403। অন্য ১২টি account-এর নির্দিষ্ট-model pass/fail নিশ্চিত হয়নি। Token expiry এই #7 error-এর কারণ হিসেবে পাওয়া যায়নি।

Memory pressure warning ও headroom <8 GiB হলে নিজস্ব ছোট worker থেমেছে। সর্বশেষ sample-এ headroom 5.12 GiB, swap 30.50 GiB এবং internal free 17.24 GiB। নতুন scoped test runner প্রস্তুত, কিন্তু resource gate blocked হওয়ায় নতুন key বা আরও inference request তৈরি হয়নি। Last `/healthz` check পাঁচ সেকেন্ডে timeout করেছে। Build/deploy/restart হয়নি; runtime `79412f0ec`, main source clean।

Dashboard account-pinning/affinity mismatch নতুন unresolved QA gap হিসেবে রাখা হয়েছে। বাকি ১২টি targeted test এবং Google #7 verification recovery সম্পূর্ণ করা প্রয়োজন। পুরো matrix, observed routing ও সীমাবদ্ধতা [Flash Low account test report](OMNIROUTE-FLASH-LOW-ACCOUNT-TEST-2026-10-06.md) এবং reconciled evidence (স্থানীয় বা private reference; প্রকাশিত নয়)-এ আছে।


**21:09:28 Dhaka closeout:** নতুন resource sample-এ pressure normal ও headroom প্রায় 13.94 GiB হলেও swap প্রায় 40.43 GiB এবং internal disk free মাত্র 6.60 GiB। এটি owner-এর 15 GiB stop floor-এর নিচে। তাই আরও inference request বা setup শুরু হয়নি; বাকি ১২টি targeted account test pending। নতুন test key তৈরি হয়নি। পূর্বের 21:06 resource sample-টি ঐতিহাসিক; এই sample closeout-এর সর্বশেষ অবস্থা।


## 2026-10-06 রাত 22:19: Google verification routing ও build-এর বর্তমান handoff

নতুন dated report: [Google verification ও production build-এর সম্পূর্ণ অবস্থা](OMNIROUTE-GOOGLE-VERIFICATION-BUILD-2026-10-06.md)। পুরোনো report/section-এর content অক্ষত রেখে এই update যোগ হয়েছে।

- Live verification-blocked AGY #5 `private-id-003`, Antigravity #4 `private-id-004`, AGY #7 `private-id-002` authenticated API দিয়ে pause; তিনটি API HTTP 200 এবং independent readback-এ `isActive=false`, verification marker ও operator-disabled flag। 13 connection-এর মধ্যে AGY 5 + Antigravity 5 active, 6 distinct identity।
- 22:03:32–22:19:31 বাংলাদেশ সময়ে দশটি active connection-এর `connection-test` HTTP 200 এবং আটটি connection-এ 98টি model request HTTP 200: Pro High 53, Flash High 45। Connection checks cached হতে পারে; এগুলো Flash Low-এর per-account full generation test নয়। Pause-এর আগে শুরু হয়েছে বলে duration থেকে অনুমান করা দুটি in-flight 403 শেষ হওয়ার পরে নতুন verification 403 নেই।
- স্থায়ী child source: Google verification barrier/token-refresh protection, exact management model-test scope, selected connection reporting, cancellation 499, background Google quota token renewal এবং version-checked paired Retest recovery। সব `nexa/`-তে। 2/3/5 pool, normal affinity, newer challenge এবং expired usage-token regressions prepared; native run PENDING।
- 81 patch dry-apply ও pristine-base guard PASS। Build shell এবং build-gate test file syntax PASS। Formatter/typecheck/tsc-ratchet/native regression/full candidate build/smoke/promotion এখনও সম্পন্ন হয়নি। Focused test budget guard exit 75, child peak 0 MiB।
- শেষ RAM snapshot: pressure warning 2, headroom 3.71 GiB, swap 15.75 GiB, disk free 70.82 GiB। Conservative 3 GiB build admission minimum 13 GiB; user apps/tabs বন্ধ হয়নি। Safety gate bypass করে build হয়নি।
- Main clean `nexalance` HEAD `a3571d5b29bf53e5fb4b23cbe43269596eb31122`; worktree branch `fix/deploy-resource-safety-2026-10-06`, HEAD `892551a41` এবং uncommitted child delta। Live runtime SHA এখনও `79412f0ec`; নতুন fix deployed নয়।
- Exact-model `gemini-3.8-flash-low` live matrix, full production QA, native multi-session acceptance এবং দুটি challenged identity-এর Google verification/Retest/Enable বাকি। Existing data ও user apps রেখে bounded validation/build/promotion করতে হবে; পুরোনো unbounded kit updater দিয়ে shortcut নয়।


## শেষ lightweight verification: 22:23 বাংলাদেশ সময়

Node `v26.7.0` দিয়ে ছয়টি নতুন/পরিবর্তিত TypeScript module ও test file-এর `node --check` syntax PASS। এটি imports resolve, typecheck অথবা test assertions execute করেনি। Pristine-base guard ও 81-patch dry apply আবার PASS; main checkout clean এবং live `/healthz` HTTP 200।

`git diff --check`-এর দুটি warning unified patch file-এর অপরিহার্য blank-context marker (একটি space) হিসেবে যাচাই করা হয়েছে; actual upstream source-এ trailing whitespace যোগ হওয়ার evidence নয়। Patch marker strip করলে patch নষ্ট হবে। Full formatter/typecheck/native regression এখনও PENDING।

শেষ resource admission `2026-10-06T16:23:21.050Z`: pressure 2 warning, headroom 4.33 GiB, swap 15.76 GiB, internal free 69.84 GiB। Focused tests এবং conservative production build দুটোই blocked। New runtime SHA, promotion অথবা full QA pass তৈরি হয়নি।


## Production build পুনরায় চালানোর যাচাই, 2026-10-06 23:18 বাংলাদেশ সময়

### প্রস্তুত ও পরীক্ষিত source

Child branch `fix/deploy-resource-safety-2026-10-06`-এর HEAD `43f2b4c27`। Google verification barrier, exact-connection model probe, token renewal এবং cancellation guard-এর স্থায়ী পরিবর্তন শুধু `nexa/`-তে রাখা হয়েছে। Managed webpack parallelism 8 থেকে 1 করা হয়েছে; Next.js worker-ও 1। Official Claude app বা account configuration এ পর্যায়ে সম্পাদনা করা হয়নি।

সম্পূর্ণ application validation-এ 826টি assertion PASS, কোনো FAIL নেই: Google/model 58, deployment 50, Bridge 576, UI 36, fidelity 72, security 34। Core typecheck PASS। Full TypeScript ratchet 5830/5830; inherited diagnostics বৃদ্ধি পায়নি। পরে worker-exit/cancellation guard-এর 13টি পরীক্ষা PASS এবং GPT-6.1/command-updater-এর 12টি পরীক্ষা PASS। Verified log SHA-256 দিয়ে application-validation reuse পরীক্ষা করা হয়েছে। পরবর্তী পরিবর্তন application request/payload code-এ নয়, build scheduling ও guard-এ।

### Build-এর বাস্তব ফল

- `69d0d2e9c` compilation: 5120 MiB heap, 7168 MiB RSS cap; সর্বোচ্চ মোট RSS 7065 MiB। V8 heap ceiling-এ compilation ব্যর্থ হয়েছে। System pressure স্বাভাবিক ছিল। Package তৈরি হয়নি।
- `43f2b4c27` compilation: 6144 MiB heap, 9216 MiB RSS cap, parallelism 1। শুরুতে প্রায় 22.5 GiB headroom ছিল। Compilation-এর মাঝে অন্য কাজের `splinter-v2` Blender film render শুরু হয়। Available RAM 8 GiB-এর নিচে গেলে watchdog শুধু নিজস্ব build process group বন্ধ করে। Peak 5272 MiB; exit 75। Runtime, apps বা render বন্ধ করা হয়নি।
- পরবর্তী observation-এ build বন্ধ থাকা সত্ত্বেও headroom 6.2 থেকে প্রায় 12 GiB ছিল। এই profile শুরু করতে মোট cap-এর বাইরে 10 GiB reserve প্রয়োজন, অর্থাৎ অন্তত 19 GiB physical headroom। অন্য render batch-এর পরবর্তী job সাময়িক আটকে রাখার অনুমতি চাওয়া হয়েছে; উত্তর না আসা পর্যন্ত অন্য কাজ থামানো হচ্ছে না।

### Production ও account অবস্থা

Production এখনও `79412f0ec`; `/healthz` HTTP 200 এবং Bridge port 8443-এর listener পাওয়া গেছে। নতুন artifact, isolated smoke বা production promotion এখনো PASS নয়। Main `nexalance` checkout এখনও পরিবর্তন করা হয়নি। কোনো production database rewrite, account deletion বা API-key replacement হয়নি।

Authenticated provider inventory-এ 20 connection, Google-এর 13 connection, তার মধ্যে 10 active এবং 3 operator-paused পাওয়া গেছে। Paused tags: AGY `private-id-003`, Antigravity `private-id-004`, AGY `private-id-002`। Google-এর genuine verification challenge কাটাতে provider-side verification এবং সফল Retest প্রয়োজন। OAuth token renewal দিয়ে সেই challenge মুছে ফেলা যাবে না।

### বাকি acceptance

Stable RAM ও render sequencing পাওয়া গেলে একই child source দিয়ে compilation, full dashboard/package gates, isolated install/inference smoke, rollback-preserving promotion, actual runtime SHA/Bridge TLS/data checks এবং 10 active connection-এ sequential `gemini-3.8-flash-low` generation চালাতে হবে। প্রত্যেক test-এ requested connection ও actual selected connection মিলতে হবে। তারপর native Claude Code CLI এবং native app-এর read-only response যাচাই করতে হবে। Google challenge থাকা 3 connection-কে error-free বলা যাবে না।

Evidence: `~/.omniroute-builds/3.8.51-43f2b4c27/validation-reuse.json`, `candidate-build.log`, এবং `~/Library/Caches/NexaLance/omniroute-google-account-health-2026-10-06/build-verification-2026-10-06/`।


## Render শেষ হলে automatic build continuation, 2026-10-06

ব্যবহারকারী স্পষ্টভাবে বলেছেন: “Render চলুক; শেষ হলে build করুন”। তাই render worker, batch, apps অথবা অন্য task থামানোর অনুমতি নেই। আগের pause-permission প্রশ্ন আর pending নয়; উত্তর হলো অপেক্ষা করা।

এই একই chat-এ `omniroute-build-deployment` automatic follow-up ACTIVE করা হয়েছে। প্রতি পাঁচ মিনিটে background render completion, memory pressure, physical headroom, swap ও internal disk পরীক্ষা করবে। Render চললে অথবা resource admission fail হলে কোনো build শুরু করবে না। Admission PASS হলে পরীক্ষিত child source `43f2b4c27` দিয়ে compilation, package gates, isolated smoke, rollback-preserving deployment, actual runtime/native checks ও active Google account matrix সম্পন্ন করবে। একই application source থাকলে hash-verified 826-test validation reuse করবে। Source পরিবর্তন হলে প্রাসঙ্গিক validation প্রয়োজন।

অপরিবর্তিত অপেক্ষার সময়ে নতুন notification পাঠাবে না। Meaningful completion, নতুন failure বা প্রয়োজনীয় user action-এ জানাবে। সত্যি build/deploy/live QA সম্পন্ন হলে follow-up pause করতে হবে। এই scheduling confirmation package তৈরি বা deployment completion-এর evidence নয়; production এখনও `79412f0ec`, নতুন artifact এখনও pending।


## Production build-এর নতুন resource পরীক্ষা, 2026-10-07, 01:49 বাংলাদেশ সময়

পরীক্ষিত child branch-এর নতুন clean HEAD `29329aa46`; author ও committer Jillur Rahman। Main `nexalance` এখনও `a3571d5b2`, production `79412f0ec`। স্থায়ী পরিবর্তন শুধু `nexa/`। Normal commit hooks PASS; bypass হয়নি।

- Render শেষ হওয়ার পরে 01:31-এ 19 GiB-এর বেশি headroom, normal pressure ও প্রায় 77 GiB internal free disk পাওয়া যায়। Compilation শুরু হলেও পরে physical headroom 8 GiB-এর নিচে নামায় watchdog শুধু নিজের process group থামিয়েছে। Peak 1238 MiB, exit 75। হঠাৎ system memory কমার কারণ নিশ্চিত হয়নি। কোনও app, tab, render বা অন্য service থামানো হয়নি।
- Build scheduling-এ SWC native Rayon pool-এর জন্য `RAYON_NUM_THREADS=1` যোগ হয়েছে। Next.js worker 1, webpack module parallelism 1, heap 6144 MiB, total RSS cap 9216 MiB, semispace 8। মূল 19 GiB admission minimum এবং running reserve, pressure, swap, disk ও RSS stop guards অক্ষত। [Rayon-এর official control](https://docs.rs/rayon/latest/rayon/struct.ThreadPoolBuilder.html#method.num_threads)।
- নতুন environment guard-সহ 13 regression PASS, formatter/test peak 194 MiB। Normal commit hooks-এর peak 457 MiB। Installed SWC-এর ছোট fixture-এ configured 4 ও 1 thread-এর output SHA-256 সমান; process thread count উভয় ক্ষেত্রে 22। Fixture পূর্ণ compilation-এর memory savings প্রমাণ করে না।
- Application routing/payload source বদলায়নি। Original validation log-এর SHA-256 মিলেছে; changed-file allowlist শুধু চারটি `nexa/` build/doc file। তাই 826 assertions, core typecheck PASS ও ratchet 5830/5830 evidence পুনর্ব্যবহার করা হয়েছে; tests অযথা পুনরায় চালানো হয়নি।
- নতুন SHA-এর attempt-এ preflight-এর সময় headroom 18.64 GiB হয়। Minimum 19 GiB না থাকায় compilation child শুরুই হয়নি, peak 0 MiB, exit 75। Artifact নেই। Applied 48 copy byte-match করে pristine restore হয়েছে; source/data/rollback অক্ষত।

নতুন evidence directory: `~/.omniroute-builds/3.8.51-29329aa46`। এখানে `validation-reuse.json`, `generated-inventory.json`, `build-result.json`, `resource-trace.ndjson`, `candidate-build.log` এবং reusable `guarded-resume.mjs` আছে। Future helper invocation নতুন timestamp-সহ result/trace রাখবে, পুরোনো evidence overwrite করবে না। আগের actual cancellation ও native compiler probe evidence `~/.omniroute-builds/3.8.51-43f2b4c27/`-তে অক্ষত।

`omniroute-build-deployment` follow-up ACTIVE এবং নতুন source SHA/evidence path অনুযায়ী আপডেট করা হয়েছে। Stable admission হলে compilation, dashboard/package gates, isolated inference smoke, rollback-preserving deployment, actual runtime/native checks এবং 10 active Google connection-এর exact `gemini-3.8-flash-low` matrix বাকি। তিনটি operator-paused Google verification connection enable করা হয়নি। Build/deploy/live QA সত্যি সম্পন্ন হলে follow-up pause করতে হবে। Production-ready বা deployed হওয়ার দাবি এই checkpoint করে না।


## Full build সম্পূর্ণ, production deployment বাকি — 2026-10-07

Full production build এখন সত্যি সম্পূর্ণ। Child branch `fix/deploy-resource-safety-2026-10-06` ও main `nexalance` উভয়ের clean HEAD `29329aa46`। Ancestry, clean source ও 24টি `nexa/`-এর পরিবর্তন যাচাই করে main fast-forward হয়েছে। সমস্ত নতুন commit-এর author ও committer Jillur Rahman; normal hooks PASS। Upstream base pristine আছে।

### Artifact ও build evidence

- Package: `~/.omniroute-builds/3.8.51-29329aa46/omniroute-3.8.51.tgz`। আকার 99,593,668 bytes। SHA-256 `6d9d439d5e6851c175c4fae44539ab1b2f658ad7d3744f7d7c5745e2747dbd4e`। Archive-এর `dist/BUILD_SHA` ঠিক `29329aa46`।
- Full dashboard compilation PASS; 620টি static page তৈরি হয়েছে। Dashboard gate, CLI API generation, CLI build, pack-artifact validation এবং npm pack-সহ পুরো sequential pipeline exit 0। npm package-এ 8,466টি file আছে।
- Managed build: worker 1, webpack parallelism 1, heap 6144 MiB, total RSS cap 9216 MiB, semispace 8 এবং native `RAYON_NUM_THREADS=1`। Watchdog-এর peak total RSS 7662 MiB। Minimum physical headroom 8.2657 GiB, memory pressure সবসময় normal, swap বৃদ্ধি হয়নি, render overlap হয়নি। কোনো app বা অন্য task থামানো হয়নি।
- Strict Bridge package gate PASS: packaged source ও dist match, shared lifecycle confirmed। এই gate-এর peak RSS 60 MiB।
- Applied 81টি patch ও 48টি new copy যাচাই করে restore হয়েছে। Build-এর তৈরি 31টি tracked CLI command pristine ref থেকে restore এবং 94টি disposable new CLI command exact inventory/hash দেখে সরানো হয়েছে। সফল artifact ও generated distribution অক্ষত আছে। Main ও child source clean এবং pristine।
- Application source অপরিবর্তিত থাকায় hash-verified 826 PASS, core typecheck PASS ও full ratchet 5830/5830 evidence reuse হয়েছে। Worker/native-pool guard 13 PASS এবং GPT-6.1/command-updater 12 PASS। Tests অযথা পুনরাবৃত্তি হয়নি।

পূর্ণ evidence: `build-complete-and-predeploy-20261006.json`, `build-result-2026-10-06T20-27-49-987Z.json`, `resource-trace-2026-10-06T20-27-49-987Z.ndjson`, `full-build-20261006-202748.log`, `source-restore-inventory-20261006-2034.json` এবং `validation-reuse.json`, সব একই artifact directory-তে। সফল package, build output ও আগের evidence overwrite বা cleanup করা যাবে না।

### বর্তমান live state ও বাকি acceptance

Production এখনও `79412f0ec`। নতুন package-এর isolated install/inference smoke, consistent database snapshot, rollback-preserving promotion, actual runtime SHA, health ও native Bridge TLS যাচাই এখনো বাকি। Package তৈরি হওয়া deployment-এর প্রমাণ নয়। আপনার নির্ধারিত 9 GiB process cap-এর বাইরে 10 GiB reserve পেলে নতুন main `nexa/deploy/omni-updater.sh redeploy`-এ verified artifact দিয়ে কাজ চলবে; full compilation আবার হবে না। Desktop shell build/deploy নয়।

Fresh predeploy inventory: 25টি provider connection ও 3টি API key। Provider/API-key ID-set hashes এবং usage baseline 43,488 row receipt-এ রাখা হয়েছে; credential values প্রকাশ করা হয়নি। Google-এর বর্তমান 18টি connection: AGY 8 active/1 paused, Antigravity 8 active/1 paused। আগে paused AGY tag `private-id-002` এখন active এবং verificationRequired=false দেখা গেছে; এই run কোনো account enable বা provider configuration write করেনি। AGY `private-id-003` ও Antigravity `private-id-004` এখনও paused ও verificationRequired=true। Live account state পরিবর্তন হতে পারে; operator state অক্ষত রেখে নতুন inference দিয়ে যাচাই করতে হবে।

Deploy-এর পরে বর্তমান সব active Google connection-এ sequential `gemini-3.8-flash-low` test হবে; requested ও actual selected connection এবং returned output মিলতে হবে। Paused verification connection enable হবে না। Real Claude Code CLI, native app এবং concurrent session acceptance-ও বাকি। সকল provider account error-free, native QA PASS অথবা 24-hour uninterrupted use-এর দাবি এই checkpoint করে না।

`omniroute-build-deployment` follow-up ACTIVE এবং সফল artifact, নতুন main SHA ও fresh inventory অনুযায়ী আপডেট হয়েছে। Resource অপেক্ষার অপরিবর্তিত অবস্থায় notification থাকবে না। Deployment ও live QA সত্যি সম্পূর্ণ হলেই follow-up pause হবে।

### Deployment preflight ও resource watchdog প্রস্তুত — 2026-10-07 04:55 Asia/Dhaka

Full build PASS এবং package `29329aa46` অক্ষত আছে। নতুন করে compile বা pack করা হয়নি। Main ও পরীক্ষিত child checkout একই clean/pristine `29329aa46d1aa3c8d23377225175365219f8edb6`। Package-এর 99,593,668 bytes, SHA-256 `6d9d439d5e6851c175c4fae44539ab1b2f658ad7d3744f7d7c5745e2747dbd4e` এবং archive BUILD_SHA আবার মিলেছে। Runtime/data/current/previous/previous-runtime paths ও symlinks inventory সম্পূর্ণ; live production এখনও `79412f0ec`।

Deployment-এর task-local watchdog প্রস্তুত: `~/.omniroute-builds/3.8.51-29329aa46/deploy-watch-20261007.mjs`। Syntax এবং live process inventory parser যাচাই হয়েছে। এটি নতুন main updater-এ verified artifact ও desktop flags 0 দিয়ে redeploy চালায়। 9 GiB owned-process RSS cap এবং system pressure/headroom/swap/disk/render নজরদারি করে। Resource failure হলে শুধু owned smoke/install/server child process থামে; updater parent-এ signal দেয় না, যাতে promotion/rollback-এর critical moves শেষ হতে পারে। নতুন timestamp-এ deployment log, resource trace ও receipt রাখে। শুরু করার মুহূর্তেও আবার 19 GiB admission পরীক্ষা করে।

প্রথম resource check-এ 19.66 GiB পাওয়া গেলেও প্রস্তুতির শেষে physical headroom 16.75 GiB-এ নেমেছে; pressure normal, render/batch নেই এবং internal disk প্রায় 72.92 GiB free। তাই isolated install, provider smoke বা runtime promotion শুরু হয়নি; rollback/live service অক্ষত। পর্যাপ্ত headroom পাওয়া গেলে প্রস্তুত watchdog দিয়েই কাজ চলবে।

Fresh read-only inventory-তে 25 provider connection ও 3 API key আছে। AGY `private-id-003` ও Antigravity `private-id-004` paused এবং nested `googleAccountVerification.required=true`; এই run account enable/config write করেনি। `~/.omniroute-builds/3.8.51-29329aa46/predeploy-inventory-20261006-2254.json` নতুন baseline ধরে। ID-set hash তুলনায় একই serialization ব্যবহার করতে হবে; আলাদা serialization-এর hash mismatch account loss-এর প্রমাণ নয়। Active Google matrix, native CLI/app/concurrency এবং deployment acceptance এখনও বাকি। Follow-up ACTIVE থাকবে।


## 2026-10-07 05:38 ঢাকা — 3 GiB deployment অনুমোদন ও bounded install evidence

Full production build সম্পূর্ণ এবং PASS; পুনরায় compile বা npm pack চালানো হয়নি। Verified package `3.8.51-29329aa46/omniroute-3.8.51.tgz` অক্ষত: 99,593,668 bytes, SHA-256 `6d9d439d5e6851c175c4fae44539ab1b2f658ad7d3744f7d7c5745e2747dbd4e`, archive BUILD_SHA `29329aa46`। Main/child clean source একই `29329aa46d1aa3c8d23377225175365219f8edb6`। আগের 826 PASS, core typecheck PASS, ratchet 5830/5830 ও resource/native-pool validation evidence reuse করা হয়েছে।

ব্যবহারকারীর সরাসরি নির্দেশ: **“3 GiB cap-এ deployment শেষ করুন”**। Deployment admission এখন 13 GiB physical headroom = 3 GiB process budget + 10 GiB system reserve; normal pressure, internal disk অন্তত 20 GiB এবং render/batch overlap নেই থাকতে হবে। Live watchdog-এ total job RSS 3072 MiB, minimum system reserve 10 GiB, pressure normal, swap growth সর্বোচ্চ 1 GiB ও disk floor 15 GiB। Resource/render violation হলে কেবল নিজের isolated install/smoke process থামে; promotion/rollback-এর parent updater signal পায় না। কোনো user app, browser, render, অন্য task বা unrelated service বন্ধ করা হয়নি।

এই চারটি isolated install attempt-এ এখনও promotion হয়নি:

| Attempt | UTC start | Peak RSS | ফল |
| --- | --- | ---: | --- |
| 1 | 2026-10-06T23:26:31.998Z | 3446 MiB | Install cap ছাড়ায়; নিজের smoke/install stopped; live service untouched |
| 2 | 2026-10-06T23:29:38.960Z | 3566 MiB | Heap/socket/native job কমিয়েও cached unpack parallel ছিল; cap-এ safely stopped |
| 3 | 2026-10-06T23:31:56.222Z | 694 MiB | Actual package extraction concurrency 1 করার পর RSS কমে; background render শুরু হওয়ায় নিজের install stopped |
| 4 | 2026-10-06T23:35:35.493Z | 215 MiB | Background Blender process শনাক্ত; নিজের install stopped; reserve/pressure/swap সীমা অক্ষত |

Task-local `npm-extraction-budget-1.cjs` installed npm-এর `pacote.extract` queue একবারে একটি করে চালায়; package/dependency বাদ যায় না এবং official npm/source/config edit করা হয়নি। ছয়টি queued extraction-এর check-এ max concurrency 1 ও ছয়টির result retention PASS। Full isolated install এখনও PASS প্রমাণিত নয়। চতুর্থ trace-এ render PID 48388, parent 48386, executable Blender পাওয়া গেছে; এটি কেবল source-text match ছিল না। আগের তিন attempt-এর static Bridge gate evidence uniquely named `deploy-evidence-attempt1-*`, `deploy-evidence-attempt2-*`, `deploy-evidence-attempt3-*` location-এ hash অক্ষত রেখে preserved। Partial install prefixes ও সব logs/results অক্ষত; কোনো cleanup করা হয়নি।

প্রস্তুত runner: `~/.omniroute-builds/3.8.51-29329aa46/deploy-watch-install-3g-extraction-20261007.mjs`। নতুন main `nexa/deploy/omni-updater.sh redeploy`, exact `NEXA_DEPLOY_ARTIFACT`, desktop flags 0; heap 1024 MiB, semispace 8, Rayon/UV/socket/native jobs/extraction 1। Artifact/source/critical runtime-data-build paths ও symlink checks আবার PASS। কোনো duplicate updater চালানো যাবে না; existing static evidence overwrite-এর আগে exact path/hash যাচাই করে preserve করতে হবে।

**বর্তমান production এখনও `79412f0ec`; build `29329aa46` এখনও deployed হয়নি।** Isolated Anthropic smoke, consistent deploy DB snapshot, runtime preservation/promotion, নতুন runtime SHA, health/TLS/data proof এবং postdeploy Google/CLI/native/concurrent QA বাকি। Predeploy inventory 25 provider connection/3 API key; Google 18 = 16 active/2 operator-paused। Paused AGY tag `private-id-003` ও Antigravity tag `private-id-004`-এর nested Google verification required; enable/verification clearing করা হয়নি। কোনো credentials/private verification URL report-এ নেই। Render চললে quiet wait; render শেষে fresh resource admission নিয়ে deployment resume হবে। Follow-up এখনো ACTIVE; সত্যিকারের deployment ও live QA completion ছাড়া pause নয়।

Evidence directory: `~/.omniroute-builds/3.8.51-29329aa46/`; চারটি `deploy-result-<UTC>.json`, `deploy-resource-<UTC>.ndjson` ও `deploy-<UTC>.log` এই অবস্থার পৃথক receipts।


## 2026-10-07 — production deployment সম্পন্ন; Google live matrix আংশিক সফল

**Production এখন `29329aa46`। Full production build এবং actual deployment উভয়ই PASS।** আগের `79412f0ec` runtime ও package rollback-এর জন্য অক্ষত। সব নির্ধারিত live পরীক্ষা চালানো হয়েছে; CLI/native acceptance PASS, কিন্তু সব Google account সুস্থ নয়। এই append পূর্বের checkpoint-এর অপেক্ষমাণ deployment অবস্থার পরে বর্তমান ফল নথিবদ্ধ করে; আগের লেখা পরিবর্তন করা হয়নি।

| যাচাই | চূড়ান্ত পর্যবেক্ষণ |
|---|---|
| Production compilation/package | পূর্বের সম্পূর্ণ PASS artifact reuse; নতুন compile বা npm pack চালানো হয়নি |
| Dashboard/CLI/package gates | 620 static pages, dashboard gate, CLI generation, strict Bridge package gate ও pack validation PASS |
| Deployment | ষষ্ঠ attempt exit 0; isolated install, real Anthropic inference এবং promotion PASS |
| Runtime | version `3.8.51`, `dist/BUILD_SHA = 29329aa46`; health HTTP `200` |
| Native Bridge | backend TLS, ingress TLS, scoped native ingress ও client DNS PASS |
| Real Claude Code CLI | দুটি পৃথক concurrent session; exact response ও actual gateway model match PASS |
| Native app | নতুন exact response PASS; প্রথম thread-state `404`-এর পরে retry সফল |
| Google `gemini-3.8-flash-low` | 16 active পরীক্ষা: 6 PASS, 10 FAIL; 2 operator-paused SKIPPED |
| Retained data/rollback | 25 provider connection, 3 API key, operator active state, `.env` এবং previous runtime অক্ষত |

### Artifact, source ও actual deployment

Protected package: `~/.omniroute-builds/3.8.51-29329aa46/omniroute-3.8.51.tgz`, 99,593,668 bytes; SHA-256 `6d9d439d5e6851c175c4fae44539ab1b2f658ad7d3744f7d7c5745e2747dbd4e` আবার মিলেছে। Main `nexalance` এবং child `fix/deploy-resource-safety-2026-10-06` উভয়ই clean `29329aa46d1aa3c8d23377225175365219f8edb6`। পূর্বের main থেকে 24টি changed file সব `nexa/`-তে; author/committer Jillur Rahman। Application source অপরিবর্তিত হওয়ায় hash-verified 826 PASS, core typecheck PASS, ratchet 5830/5830, guard/native-pool 13 PASS ও command-updater 12 PASS evidence reuse হয়েছে। Public OSS push/PR বা desktop shell build/deploy হয়নি।

নতুন main `nexa/deploy/omni-updater.sh redeploy` exact `NEXA_DEPLOY_ARTIFACT` দিয়ে চালানো হয়েছে; desktop flags 0। Total own RSS cap 3072 MiB, heap 1024 MiB, semispace 8, Rayon/UV/native jobs/socket/extraction 1 ছিল। Dependency/package বাদ না দিয়েই isolated install-এ 1164 package যোগ হয়েছে। Real Anthropic isolated smoke `ISOLATED_BRIDGE_OK`, management auth/model catalog/CORS এবং Bridge PASS।

পঞ্চম attempt background Blender PID 50620 শুরু হওয়ায় 315 MiB peak-এ শুধু নিজের install থামিয়েছিল; promotion হয়নি। ষষ্ঠ সফল attempt-এর শুরু `2026-10-06T23:41:30.440Z`, শেষ `2026-10-06T23:50:38.573Z` (ঢাকা 2026-10-07 05:41–05:50)। Peak total job RSS 1339 MiB, minimum physical headroom 13.9966 GiB, pressure সবসময় normal, swap growth 0; resource stop হয়নি। RAM খালি করার জন্য কোনো user app/tab বা unrelated task kill করা হয়নি। আগে শনাক্ত blocking worker নিজেই exit করেছিল; identity recheck failed হওয়ায় তাকে signal দেওয়া হয়নি। Partial prefixes, successful build output ও সব attempt evidence preserved; cleanup করা হয়নি।

Deployment evidence: `deploy-result-2026-10-06T23-41-30.440Z.json`, matching deploy log/resource trace; isolated smoke `~/.omniroute-builds/smoke-20261007-054130/verification.json`। Smoke prefix পরে live runtime-এ promoted হয়েছে; পুরোনো smoke prefix-এ package না থাকা এই move-এর ফল।

### Consistent snapshot ও rollback

Live runtime `~/.omniroute-runtime/lib/node_modules/omniroute`-এ নতুন SHA confirmed। Previous complete runtime `~/.omniroute-builds/runtime-backups/20261007-054130`, BUILD_SHA `79412f0ec`, non-symlink এবং অক্ষত। `current`, `previous`, `previous-runtime` pointer সঠিক নতুন package/পুরোনো package/পুরোনো runtime নির্দেশ করছে। Previous extra runtime scripts preserved। Consistent database snapshot `~/.omniroute-local/update-backups/20261007-054130/storage.sqlite`; integrity `ok` receipt retained।

Immediate prepromotion থেকে post-client read-only inventory-তে provider ID-set SHA-256 `a34bc6f26ec596c8a1b533638ae5674bec07e0288f91770a668120438ec2c178`, API-key ID-set SHA-256 `11de2144abd3b7d6de621ed50792118157a5ab051ad65f485d8332f9ec407851` অপরিবর্তিত। 25 provider/3 API key retained; তিনটি key active, banned/revoked নয়। `.env` hash একই; Google operator `isActive` state একই। Historical usage 44135 থেকে 44292 হয়েছে, earliest `2026-10-01T19:13:17.241Z` অক্ষত; live requests-এর কারণে usage বেড়েছে। এই count `2026-10-07T00:03:19.858Z` observation, স্থির total-এর দাবি নয়।

### Google exact-connection live matrix

Prepared `postdeploy-google-matrix.mjs` বর্তমান inventory নিয়ে sequential `gemini-3.8-flash-low` পরীক্ষা করেছে; কোনো paused connection enable করা হয়নি। Run `2026-10-06T23:52:25.603Z` থেকে `23:55:21.982Z`। Matrix process exit 1 provider failures-এর জন্য; RSS peak 108 MiB, resource stop নয়। Requested/selected connection এবং output মিললে তবেই PASS।

| Provider | Connection tag | ফল |
|---|---|---|
| AGY | `private-id-005` | PASS — selected connection exact match; output `pong` |
| AGY | `private-id-006` | PASS — selected connection exact match; output `pong` |
| AGY | `private-id-007` | PASS — selected connection exact match; output `pong` |
| AGY | `private-id-008` | PASS — selected connection exact match; output `pong` |
| AGY | `private-id-009` | PASS — selected connection exact match; output `pong` |
| AGY | `private-id-010` | PASS — selected connection exact match; output `pong` |
| AGY | `private-id-002` | FAIL — upstream verification `403` |
| AGY | `private-id-011` | FAIL — upstream verification `403` |
| Antigravity | `private-id-012` | FAIL — upstream verification `403` |
| Antigravity | `private-id-013` | FAIL — upstream verification `403` |
| Antigravity | `private-id-014` | FAIL — upstream quota `429` |
| Antigravity | `private-id-015` | FAIL — upstream quota `429` |
| Antigravity | `private-id-016` | FAIL — upstream quota `429` |
| Antigravity | `private-id-017` | FAIL — upstream quota `429` |
| Antigravity | `private-id-018` | FAIL — upstream quota `429` |
| Antigravity | `private-id-019` | FAIL — upstream quota `429` |
| AGY | `private-id-003` | SKIPPED — operator-paused, verification required |
| Antigravity | `private-id-004` | SKIPPED — operator-paused, verification required |

চারটি active verification response-এর আসল upstream ভাষা `Verify your account to continue.`; local matrix wrapper HTTP 502-এর ভিতরে upstream 403 পাওয়া গেছে। Quota failure-এ upstream 429 `Resource has been exhausted (e.g. check quota).`; local wrapper 502। Failed rows-এ selected connection/output নেই, তাই এগুলো match/PASS হিসেবে গণনা করা হয়নি। আগে বলা “২টি” ছিল কেবল AGY অংশের আংশিক ফল; পুরো current matrix-তে 4 active verification challenge। Paused দুটির challenge আলাদা এবং unchanged।

**Verification কেন trigger হয়েছে তার নির্দিষ্ট কারণ provider জানায়নি।** Stored metadata-তে শুধু `required` ও `detectedAt`; কোনো নির্দিষ্ট CAPTCHA/phone/IP/security কারণ প্রতিষ্ঠিত নয়। Genuine provider verification ও quota resolution unresolved। Flag/quota forced clearing, operator state change বা paused account enable করে success বানানো হয়নি। `private-id-002` আগে operator-active ছিল; এই run তাকে enable করেনি। Matrix `accountInventoryRetained = true`। Private verification URL বা credential values এখানে প্রকাশ করা হয়নি।

Protected Google evidence: `~/Library/Caches/NexaLance/omniroute-google-account-health-2026-10-06/build-verification-2026-10-06/postdeploy-google-matrix.json`; budget `postdeploy-google-budget-20261007.json` artifact directory-তে। পুরোনো ফল overwrite করে repeated test চালানো হয়নি। নতুন genuine verification/reset হওয়ার পরে failed account-এর scoped retest প্রয়োজন; unchanged challenge-এ বারবার request নয়।

### Real CLI, native response ও concurrency

দুটি actual Claude Code CLI `claude-opus-5-5` request একসঙ্গে চালিয়ে `CLI_BRIDGE_QA_29329AA46_A` ও `CLI_BRIDGE_QA_29329AA46_B` exact response পাওয়া গেছে; exit 0, পৃথক session ID, invocation overlap confirmed। Gateway successful request-গুলির actual execution interval-ও প্রায় 524 ms overlap করেছে। Actual selected connection tags পৃথক `private-id-020` ও `private-id-021`; actual model চাওয়া `claude-opus-5-5`। CLI peak total RSS 539 MiB; reserve/pressure guard PASS। Evidence `cli-qa-2026-10-07T00-00-26.498Z/verification.json`।

Native Claude app-এর সংযোগ পরীক্ষার session-এ নতুন request `2026-10-07T00:01:54.324Z`; actual assistant response `2026-10-07T00:01:56.468Z`-এ `NATIVE_BRIDGE_QA_29329AA46` exact। Transcript model `claude-opus-5-5`, কোনো tool use হয়নি। Screenshot ও transcript evidence `native-qa-20261007-0603/`-এ। Native worker family + watcher peak 1510 MiB, minimum system headroom 13.6836 GiB, stop/failure নেই। Official app/config edit হয়নি; অন্য task/draft overwrite করা হয়নি।

Native প্রথম request connection `private-id-021`-এ upstream thread-state `404`: `No thread state was found for the requested previous_message_id.` পরের retry একই conversation-এ `private-id-020` থেকে HTTP 200 এবং exact response দিয়েছে। তাই native end-to-end response PASS, কিন্তু সব attempt error-free বলা হচ্ছে না। Thread-state 404-এর মূল feature আচরণ এই deployment run-এ পরিবর্তন/সমাধান করা হয়নি। Concurrent acceptance-এর নির্দিষ্ট scope দুটি real CLI session; native response আলাদা নতুন request হিসেবে যাচাই হয়েছে। 24-hour uninterrupted use-এর দাবি নেই।

Gateway call artifact-এর request marker, response marker, actual model ও connection মিলিয়ে তিনটি client test সত্যি live gateway দিয়ে গেছে confirmed। `client-gateway-trace-verified-20261007.json`-এ evidence। Legacy `artifact_sha256` database field বাস্তবে FNV-1a-32 checksum রাখে; সেই documented checksum এবং byte size মিলেছে, পাশাপাশি নতুন SHA-256 সংরক্ষিত। প্রথম diagnostic receipt-এর ভুল SHA-256 তুলনা corrected receipt supersede করেছে; পুরোনো diagnostic অক্ষত।

### চূড়ান্ত অবস্থান ও follow-up

Final receipt `~/.omniroute-builds/3.8.51-29329aa46/deployment-and-live-qa-final-20261007.json`: build PASS, deployment PASS, live client QA PASS, Google matrix PARTIAL এবং `allProviderAccountsHealthy = false`। Source/artifact/runtime/native TLS/health/data/rollback final checks PASS। এই release-এর build/deployment ও নির্ধারিত live পরীক্ষা সম্পন্ন হওয়ায় `omniroute-build-deployment` follow-up PAUSED করা হয়েছে; পুরোনো build/deploy পুনরাবৃত্তি দরকার নেই। Google provider verification/quota এবং নথিবদ্ধ upstream thread-state retry limitation স্পষ্টভাবে unresolved; এগুলো repaired বা সব account healthy বলা হচ্ছে না।


## 2026-10-07 08:53:16 Asia/Dhaka — Claude token/weekly usage তদন্ত

লেখক: Jillur Rahman। বর্তমান runtime `29329aa46`-এর logs, native transcripts এবং shipped source/bundle মিলিয়ে read-only তদন্ত সম্পন্ন। পূর্ণ বাংলা রিপোর্ট: [OMNIROUTE-TOKEN-USAGE-INVESTIGATION-2026-10-07.md](OMNIROUTE-TOKEN-USAGE-INVESTIGATION-2026-10-07.md)।

প্রধান ফল: Sonnet 5.5-এর mid-conversation system support allowlist-এ বাদ থাকায় native system text top-level-এ উঠে cache prefix বদলাচ্ছে। একই account-এর 43টি sample pair-এ offline reproduction হয়েছে। 00:00–08:37 Dhaka-এ Sonnet input-এর cache read 8.93%, write 90.86%; Opus read 95.61%। মোট cache creation-এর 91.16% Sonnet। Implicit subagent TTL one-hour-এ normalize হচ্ছে; transcript Sonnet writes-এর 99.79% one-hour।

06:30–06:40 Dhaka-এ 624 সফল inference; native transcript-এর 589 response-এর 534টি background child। Sonnet child sample-এর সব 1,347 request MAX effort; reported output-এর 86.31% thinking। Provider weekly remaining-এর 28%→23% পতন 06:33:24–06:44:40, অর্থাৎ 11 মিনিট 15.938 সেকেন্ডে। আগে progress-এ বলা 7 মিনিট 11 সেকেন্ড ভুল; নির্ভুল interval দিয়ে সংশোধিত। ঠিক 10 মিনিটে 5-point পতন retained snapshots-এ পাওয়া যায়নি।

Thread failure 2,261টি 404 ও 1,402টি 400; তাদের logged usage zero, তাই অতিরিক্ত billable inference ধরে যোগ করা হয়নি। 261টি unique input/cache native join-এর 255টির output-ও মিলে গেছে; ছয়টির persisted counters-এর সীমাবদ্ধতা report-এ আছে। Exact historical native-versus-gateway 3–4 multiplier matched baseline ছাড়া অনির্ধারিত।

এই run-এ নতুন Claude inference, config edit, code/deployment change বা process kill হয়নি। Main/child clean HEAD অপরিবর্তিত, source/data/rollback সংরক্ষিত। Investigation সম্পন্ন; cache compatibility fix ও bounded native/gateway live comparison এখনও আলাদা বাকি কাজ। Completion evidence (স্থানীয় বা private reference; প্রকাশিত নয়)।


## ২০২৬-১০-০৭: Native cache repair ও সব OmniRoute compression OFF — deployment/live QA সম্পন্ন

লেখক: Jillur Rahman। আগের handoff bytes অক্ষত রেখে এই ফল যোগ করা হলো।

**বর্তমান production `65c6c608a`**, main/child clean full SHA `65c6c608a9a6e78b206c8f1cd199f7cf0e062ddf`। ১৮টি স্থায়ী file change শুধু `nexa/`-তে; normal hooks ও Jillur Rahman attribution PASS। Native supported mid-system/directive preservation, implicit TTL preservation এবং account-scoped stable native session identity shipped। Compression master/default OFF, ১২ engine OFF, context editing/budget, summarizer, MCP compaction, output-style, universal handoff OFF; live read-back PASS। Native prompt cache retained।

নতুন পূর্ণ build/pack PASS: dashboard ৬২০ static page, CLI, strict package gate, `npm pack`, exit 0। Artifact omniroute-3.8.51.tgz (স্থানীয় বা private reference; প্রকাশিত নয়), 99,611,075 bytes; SHA-256 `caff39e15e0e104ef2841ff5183e212a17d870f648ce800cd405fe96df802cba`। Build peak ৭৮২১ MiB/৯২১৬ cap, minimum headroom ১৫.৩১২ GiB, pressure normal, swap growth 0, render overlap নেই। Pristine source restoration ও exact ১৩৯ validated source hash PASS। Regression: focused ২৪, related ২৯৮, Bridge ৬০০/UI ৩৬, Google ৫৮, deployment ৫২, native fidelity ৮৪, security events ৩৪ PASS; overlapping counts। Core typecheck PASS; full ratchet ৫৮৩০/৫৮৩০ baseline PASS।

Verified artifact দিয়ে main updater redeploy PASS; desktop build/deploy flags 0। প্রথম install attempt ৩ GiB RSS ছাড়িয়েছিল, নিজের install/smoke stopped ও old live runtime retained। npm extraction concurrency 1-এর পরীক্ষিত task-local preload দিয়ে পরের install/deploy PASS: ১১৬৪ package, real Anthropic smoke, peak ১৩৮১ MiB, minimum headroom ১৪.১৩০ GiB, swap growth 0, exit 0। পুরোনো complete runtime `29329aa46`: runtime-backups/20261007-095622 (স্থানীয় বা private reference; প্রকাশিত নয়)। Consistent DB snapshot/integrity PASS: storage.sqlite (স্থানীয় বা private reference; প্রকাশিত নয়)।

Real CLI-এর দুই concurrent session ও দুই resume PASS: correct marker, stable account/native session/system prefix, প্রত্যেক resume input ২০৪৮, cache read ১৪৯০, cache write ৫২২, fresh ৩৬, output ২৪; peak ৫৫৬ MiB। Native app-এর তিন main turn exact marker ও wire/transcript usage join PASS; second turn 101,225/103,051 (**৯৮.২৩%**) এবং third 103,073/103,185 (**৯৯.৮৯%**) input cache reuse। Whole-app helper-inclusive প্রথম watchdog ৩১৪৩ MiB-এ failed ছিল; সেটি PASS বলা হয়নি। Exact SDK task worker identity দিয়ে পরের ৩ GiB-capped QA PASS: peak ১৮০১ MiB, reserve minimum ১৪.০২৮ GiB, কোনো process stop হয়নি।

শেষ health 200, native ingress 443/Bridge 8443 verified TLS PASS। ২৫ connection/৩ API-key ID sets, active/paused/verification operator state ও আগের ৪৯,৬১৪ usage row-এর canonical full-field hash retained। `.env`, CA, DNS shim, launch agent, `.claude/settings.json` unchanged। Native app নিজের first UI turn-এ desktop preference config লিখেছে; app log/file mtime আছে। সেই file-কে byte-identical বলা হয়নি; manual official config edit বা forced restore হয়নি।

Google matrix: ১৮ total, ১৬ active, **৬ PASS / ৪ genuine verification 403 / ৬ quota 429**, ২ paused skipped। Requested/actual tag ও `pong` ছয় passing row-এ মিলে। Paused AGY `private-id-003` ও ANT `private-id-004` untouched। Active verification tags AGY `private-id-002`, `private-id-011`; ANT `private-id-012`, `private-id-013`। Provider rejection unresolved; account enable/forced quota বা verification clearing হয়নি। Credential/private verification link প্রকাশ হয়নি।

Native app নিজে প্রথম ছোট prompt-এ প্রায় ১০১k context, ৪৯ tool ও `Extra` effort পাঠিয়েছে; auxiliary/suggestion request আছে। আগের parent/child fan-out ও thinking workload gateway compression OFF দিয়ে মুছে যায় না। Bounded cache regression repaired/deployed/live-verified; সারাদিনের ৩–৪× savings বা weekly quota না-শেষ হওয়ার guarantee নয়।

Evidence: [সম্পূর্ণ তদন্ত ও fix report](OMNIROUTE-TOKEN-USAGE-INVESTIGATION-2026-10-07.md), deploy receipt (স্থানীয় বা private reference; প্রকাশিত নয়), native app proof (স্থানীয় বা private reference; প্রকাশিত নয়), final live attestation (স্থানীয় বা private reference; প্রকাশিত নয়), Google matrix (স্থানীয় বা private reference; প্রকাশিত নয়)। Automation `omniroute-build-deployment` PAUSED; এই সফল build/deploy/live QA পুনরাবৃত্তি করবেন না।


---

## 2026-10-07 — নতুন OmniRoute Native Thread/usage release `a535572e5`

লেখক: Jillur Rahman। Latest attachment-এর OmniRoute scope অনুযায়ী নতুন source fix, পূর্ণ build/package ও production deploy সম্পন্ন। Source/live `a535572e5` (`a535572e52f54d557391e57087bac9ef0e08e6bc`), main/child clean/pristine, 87 changed path সব `nexa/`, তিন normal-hook owner commit।

Artifact (স্থানীয় বা private reference; প্রকাশিত নয়): 99,648,283 bytes, SHA-256 `7a83f3996b62ae64010ad627c1c2cc5cd5c4708096c9f769759224f1478756fd`। Full dashboard 620 pages, native gate 81/81, CLI/package/Bridge validation ও npm pack PASS, exit 0। Build whole-job peak 7943 MiB / 9216 cap, minimum headroom 14.212 GiB। Verified package bounded deploy 2026-10-07 10:24:51Z / 16:24:51 Dhaka-এ exit 0; real Anthropic smoke, installed migration 197/schema, consistent snapshot, complete previous runtime ও native TLS PASS; deploy peak 1547 MiB / 3072 cap, minimum reserve 18.596 GiB। Pressure normal, swap growth 0, render overlap নেই।

Native beta/system/cache marker drift, sparse directive hoisting ও passthrough provider usage/TTL loss ঠিক হয়েছে। `b53c1cea3` marker response সফল হলেও 6 provider request-এর 2টি continuation 400/replay হয়েছিল; সেটিকে final success বলা হয়নি। নতুন real concurrent Sonnet/Opus high CLI দুই turn করে **ঠিক 4 provider request, সব 200, create→continue, zero 400/404/replay**। Same owner/group, correct marker/model ও Bridge PID retained। Real stream 5m/1h/read/write counters SQLite-এর সঙ্গে exact match। API max/max ও fresh Haiku control PASS। Migration-directory issue-ও source/smoke gate-এ স্থায়ীভাবে ঠিক হয়েছে।

Dashboard actual DOM/screenshot PASS; token read/rewrite, 5m/1h/unknown TTL ও hourly alerts আছে। [Official pricing](https://platform.claude.com/docs/en/about-claude/pricing) যাচাই করে supported pricing API দিয়ে শুধু missing Sonnet/Opus 5.5 entry যোগ হয়েছে; old prices retained, pre-change consistent snapshot আছে। Numeric API-equivalent cost দেখা যায়; weekly-point conversion নেই। Compression master, 12 engines, contextEditing/liveZone সব OFF; official Claude settings byte hash unchanged।

Native gate 81, related 100, core/full type ratchet 5824≤5830, lint/complexity/hooks PASS। Broad Node sweep 45115 PASS/4 FAIL/28 skip exit 1, failed-file recovery 31 PASS/1 skip। UI broad 2844 PASS/6 FAIL exit 1, focused recovery 14 PASS। Dashboard 134, serial 23, MCP 493 PASS। Hash evidence reuse হয়েছে; failed sweep-কে full green বলা হয়নি।

25 provider connection/3 API key ID sets ও operator active/paused state retained। Predeploy-এর 52,083 usage row-এর full-field canonical hash current rows-এর সঙ্গে মিলে, differences 0। Complete prior `b53c1cea3` runtime preserved (স্থানীয় বা private reference; প্রকাশিত নয়); predeploy snapshot (স্থানীয় বা private reference; প্রকাশিত নয়)। Final health 200 `ok`, native 443/8443 CA+hostname+SNI verification PASS।

Google current 18 total/16 active: **5 PASS, 4 genuine verification 403, 6 quota 429, 1 client timeout; 2 paused skipped**। Passing requested/actual connection/output exact match; all inventory retained। Timeout connection backend later 200 `pong` দিয়েছে, কিন্তু original matrix FAIL retained; one 90-second recheck-ও abort। কোনো verification/paused/quota forced clearing হয়নি।

**বাকি evidence:** নতুন release-এর actual Claude app UI turn/continue QA macOS screen lock-এর কারণে blocked; Mac unlock প্রয়োজন। পুরোনো release-এর app proof reuse করে নতুন app PASS বলা হয়নি। Real এক ঘণ্টার error/rewrite/cache threshold ও matched multi-day quota savings এখনও pending; পুরোনো Haiku weekly-limit বার্তার root cause matching trace ছাড়া unresolved। Skill/global settings ও public OSS work এই scope নয়। পুরোনো follow-up **PAUSED** আছে।

[নতুন সম্পূর্ণ appendix](OMNIROUTE-TOKEN-USAGE-INVESTIGATION-2026-10-07.md), build receipt (স্থানীয় বা private reference; প্রকাশিত নয়), strict CLI proof (স্থানীয় বা private reference; প্রকাশিত নয়), priced dashboard proof (স্থানীয় বা private reference; প্রকাশিত নয়), history retention (স্থানীয় বা private reference; প্রকাশিত নয়), final attestation (স্থানীয় বা private reference; প্রকাশিত নয়)।


## ২০২৬-১০-০৯ — মূল native tool fix-এর production deployment ও live QA

আগের build/deployment-pending অবস্থাটি এই প্রমাণ দিয়ে হালনাগাদ করা হলো। মূল fix-এর production runtime এখন `770a768b1` (`770a768b11d154020518a540cc7276fd41817a1f`)। Package: `~/.omniroute-builds/3.8.51-770a768b1/omniroute-3.8.51.tgz`, 99,624,494 bytes; SHA-256 `1de0840db17131336c86a578e06c098de45568d01c2893f57d096e4b7a9b19be`। Full production build, 620 static pages, dashboard gate, package validation এবং Strict Bridge gate PASS; pipeline exit 0। Resource trace-এ peak total RSS 6,990 MiB, minimum physical headroom 14.515 GiB, pressure normal এবং swap বৃদ্ধি 0। প্রাথমিক build receipt-এ CLI generation-এর পরে restoration-pending লেখা আছে; পরবর্তী `source-restored-final.json` ও clean/pristine check দিয়ে সেটি নিষ্পত্তি হয়েছে।

মূল কারণ ছিল native Anthropic Thread continuation-এ tools/system বাদ থাকা। GPT/GLM ওই Anthropic Thread state পায় না। স্বীকৃত `thread_not_found` response দিয়ে native client-কে পুরো history/system/tools replay করানো হয়েছে; upstream-এ শূন্য-tool continuation পাঠানো বন্ধ হয়েছে। Model বা account mapping বদলানো হয়নি।

Bounded updater দিয়ে isolated install ও real Anthropic smoke PASS হওয়ার পরে ১৬:৫২ Dhaka-তে promotion সম্পন্ন। Deployment peak RSS 1,471 MiB, minimum headroom 19.001 GiB, pressure normal, swap বৃদ্ধি 0। Runtime SHA, loopback ও `omni.local` health, native Bridge TLS/DNS PASS। পূর্ণ আগের runtime `~/.omniroute-builds/runtime-backups/20261009-165100` এবং consistent database snapshot `~/.omniroute-local/update-backups/20261009-165100/storage.sqlite` সংরক্ষিত। Desktop build/deploy flags 0 ছিল। Provider 25, API key 3, Bridge mapping 13, ID sets, account operator state এবং পূর্বের 71,574 usage row অক্ষত। Startup-এর `_settingsRevision` ও `codex_catalog_revalidated_version` ছাড়া settings-এর অন্য key অপরিবর্তিত।

| প্রকৃত client / source selection | নির্বাচিত upstream | Live ফল |
| --- | --- | --- |
| Claude Code CLI, Opus 5.5 | Codex / `gpt-6.1-sol` | `Read` + `Bash`, প্রত্যাশিত marker PASS |
| Claude Code CLI, Fable 5 | Codex / `gpt-6-astra` | `Read` + `Bash`, প্রত্যাশিত marker PASS |
| Claude Code CLI, Sonnet 5.5 | GLM Coding / `glm-5.3-max` | `Read` + `Bash`, প্রত্যাশিত marker PASS |
| Native app, Opus 5.5 | Codex / `gpt-6.1-sol` | `Read` + `Bash` PASS |
| একই native app conversation, Fable 5.1 | Codex / `gpt-6-astra` | প্রকৃত `Skill` call ও `NATIVE_SKILL_OK` PASS |
| একই native app conversation, Sonnet 5.5 | GLM Coding / `glm-5.3-max` | `Read` + `Bash` এবং আগের Skill marker মনে রাখা PASS |

Native app-এর Astra turn-এ Skill fixture-এর ‘শুধু marker দাও, আর tool নয়’ নির্দেশ মানা হয়েছে; ওই app turn-এ `Bash` চলেছে দাবি করা হচ্ছে না। Astra CLI-তে `Read`/`Bash` আলাদাভাবে PASS। Evidence: `primary-live-qa-evidence.json`, `live-cli-2026-10-09T10-53-01.562Z/summary.json`, native app resource receipt। Native app-এর 49 tool definition প্রতিটি replay-তে ছিল। ব্যক্তিগত পরিচয়/credential প্রকাশ করা হয়নি।

Validation clarification: আগের MCP 493/493 PASS হয়েছিল test process-এ explicit `OMNIROUTE_MCP_COMPRESS_DESCRIPTIONS=0` দিয়ে। Live `.env`-এ flag unset; ওই test-কে live config-এর সমতা বা এই run-এ compression বন্ধ করার প্রমাণ বলা যাবে না। প্রথম default-mode 492/493 ফলও সংরক্ষিত। Initial CLI `--bare` test-এ authentication ব্যর্থ হয়ে zero-token failure হয়েছিল; normal OAuth path-এ পুনরায় প্রকৃত live test PASS হয়েছে।

### Live QA-তে পাওয়া সম্পর্কিত prompt suggestion retry

মূল tool call সফল হওয়ার পরে native app-এর একই session-এ ঐচ্ছিক `[SUGGESTION MODE: ...]` request ৮ বার HTTP 502 হয়েছে—প্রথমটি streaming, পরের ৭টি non-streaming। Request-টি স্পষ্টভাবে প্রয়োজন না হলে নীরব থাকতে বলেছিল, কিন্তু gateway-এর empty-response guard সেই completed খালি উত্তরকে failure ধরেছে। 49 tool ও history-সহ পুনরায় request যাওয়ার একটি নির্দিষ্ট বাড়তি খরচের পথ এটি; শুধু এই নমুনা দিয়ে মোট weekly quota পতনের কারণ বা সাশ্রয়ের শতাংশ নির্ধারণ করা হচ্ছে না।

আলাদা child worktree `native-suggestion-silence-2026-10-09`-এ narrow fix তৈরি করা হয়েছে। Streaming ও non-streaming regression আগে FAIL; fix-এর পরে নতুন 16 case-সহ related 101/101, stream/thread 73/73 এবং core typecheck PASS। সাধারণ খালি উত্তর, zero-byte body, truncated stream, incomplete/error response ও non-native caller-এর সুরক্ষা বজায় আছে; প্রকৃত text/tool call অক্ষত। এই সম্পর্কিত দ্বিতীয় fix এখনো build/deploy করা হয়নি। Mac locked থাকায় native UI ও অনুমোদিত স্বাভাবিক quit করা যায়নি; unlock চাওয়া হয়েছে, এর মধ্যে source/gate কাজ চলছে। মূল runtime `770a768b1` live আছে।


### ২০২৬-১০-০৯ — suggestion fix source checkpoint

সম্পর্কিত suggestion retry fix local commit `8d8c52e3b2bde5ac1b9c329441fe15355c2a3322` (`fix/native-suggestion-silence-2026-10-09`)-এ সংরক্ষিত। Normal commit hooks PASS; Jillur Rahman author/committer; child source clean ও pristine; সব 140 overlay patch dry-run PASS। নতুন 16 regression case-সহ related 101/101, stream/thread 73/73 এবং core typecheck PASS। Evidence hashes `suggestion-source-progress-8d8c52e3b.json`-এ আছে।

এই দ্বিতীয় commit-এর full TypeScript ratchet, production build, deployment এবং native app acceptance এখনও বাকি। Mac locked; native UI-তে দুবার একই lock বাধা পাওয়া গেছে। সর্বশেষ physical headroom প্রায় 13.7 GiB, pressure normal, swap used 1,079.56 MiB, internal disk free প্রায় 42 GiB। Ratchet-এর 6 GiB cap + 10 GiB reserve এবং build-এর পরীক্ষিত 7 GiB cap + 10 GiB reserve admission হয়নি। নতুন heavy build শুরু হয়নি। Unlock-এর জন্য user action pending; app স্বাভাবিকভাবে quit করার আগের অনুমতি এখনও আছে, নতুন অনুমতি চাওয়া হয়নি।

মূল fix-এর live runtime `770a768b1` এবং loopback/`omni.local` health আবার HTTP 200 যাচাই হয়েছে। সফল package-এর bytes ও SHA-256 পুনরায় মিলে গেছে। দ্বিতীয় fix main-এ merge হয়নি এবং live runtime-এ নেই। পুরোনো deployment heartbeat আগে থেকেই `PAUSED`; এই checkpoint-এ automation পরিবর্তন করা হয়নি। Unlock হলে নিজস্ব test session idle যাচাই করে অনুমোদিত স্বাভাবিক quit, resource admission, ratchet, আলাদা artifact build, bounded promotion এবং suggestion-এর প্রকৃত native QA সম্পন্ন করতে হবে।


## ২০২৬-১০-০৯ — CLI/native tools, সব connection ও Nexa Skills-এর বিস্তৃত audit

পূর্ণ ফল: [OMNIROUTE-NATIVE-TOOLS-INTEGRATIONS-QA-2026-10-09.md](OMNIROUTE-NATIVE-TOOLS-INTEGRATIONS-QA-2026-10-09.md)। প্রতি tool, integration ও Skill-এর সীমা এবং evidence সেখানে আছে।

CLI-তে ১০ feature × ৩ target: Sol ৯/১০, Astra ৯/১০, GLMT Max ৮/১০; মোট ২৬/৩০ = ৮.৭/১০ bounded feature score। ৩০ CLI session-এর trace-এ ১০৭ HTTP 200, দুই GLMT image 400; routing verified। WebFetch-এর internal `claude-haiku-5-5` alias অনুপস্থিত ছিল; consistent DB snapshot-এর পরে exact Sol mapping যোগ করে তিন route-এ WebFetch PASS, আগের ১৩ mapping অক্ষত, এখন ১৪। WebSearch এখনও semantic failure; GLMT Max-এর image input এখনও unsupported।

Native catalog ৪৯ declaration, ৪৮ client tool-এ ১৪৪ protocol check PASS; এটি সব native tool execution নয়। CLI/native unique tool-এর ৬৪-row CSV, ৪১৩ Skill metadata validation, ২৯ Nexa registration, ১৮ Nexa suite-এ ১,৮৮০ PASS/৩ skipped এবং তিন বাস্তব Skill load/helper PASS আছে। `nexa-blender` metadata fix `450c2c3` installed; body/scripts অপরিবর্তিত। Enabled ৯ plugin manifest, ১৭ hook syntax এবং configured/embedded MCP catalog যাচাই হয়েছে; full browser/device/outbound workflow pending। অতিরিক্ত CronList/ListAgents/নিজের background Bash/TaskStop তিন route-এ PASS।

২৫ provider connection-এর মধ্যে ২৩ active: ৮ নতুন ছোট inference PASS + ২ verified CLI reuse; ১৩ failure (৯ quota/rate-limit, ৪ Google verification), ২ operator-paused skip। Canonical nested `googleAccountVerification.required` অনুযায়ী চার active ও দুই paused Google account verification-required; flat legacy inventory flag-এর false মানকে final সিদ্ধান্ত হিসেবে ব্যবহার করা হয়নি। Paused/enable/priority state অক্ষত; কোনো account enable, quota/verification clear বা private verification URL প্রকাশ হয়নি।

Live runtime/main clean `770a768b1`; পরবর্তী child clean/pristine `6e3dd8d50`-এ suggestion silence, server-advisor boundary ও hosted-search unsupported guard প্রস্তুত। ৩১৬ distinct source regression case, core typecheck, ratchet ৫,৮১০/৫,৮৩০ এবং ১৪১/১৪১ patch apply PASS; normal hooks ও Jillur Rahman attribution বজায়। Parent-এর ৩.৫/৪ GiB heap build OOM-এর evidence সংরক্ষিত; candidate-এর সফল production artifact নেই। নতুন runner পরীক্ষিত ৫ GiB heap/৭ GiB RSS profile ব্যবহার করবে।

শেষ checkpoint: 12:46:14 UTC headroom ১৪.৯১৮ GiB < ১৭ GiB start requirement, pressure normal, swap স্থির, internal disk ৪০.৩৫২ GiB, render নেই। Mac locked; manual unlock দরকার। তাই candidate build/deploy এবং পূর্ণ native UI acceptance pending। দুই healthz 200; শেষ usage rows ৭১,৭৭৩; provider ২৫/API key ৩, mapping ১৪ ও ID sets/settings/operator state fingerprint retained। Source, successful package, live data ও rollback অক্ষত; আগের report bytes রেখে এই অংশ append করা হয়েছে।


## ২০২৬-১০-০৯, ২৩:১৫ Dhaka — নতুন release বাস্তবে deploy ও native QA সম্পন্ন

**Production এখন `6e3dd8d50`।** Unlock-এর পরে বাস্তব native UI, production build, isolated install ও real Anthropic smoke, consistent DB snapshot, complete prior-runtime preservation, promotion, health ও Bridge TLS/DNS যাচাই সম্পন্ন হয়েছে। আগের pending checkpoint-এর পরের সম্পন্ন ফল এটি। পূর্ণ প্রমাণ ও provider সীমা: [সম্পূর্ণ native/CLI QA রিপোর্ট](OMNIROUTE-NATIVE-TOOLS-INTEGRATIONS-QA-2026-10-09.md)।

প্রথম ৭ GiB build cap sample-এ ৭,১৭০ MiB হওয়ায় নিরাপদে code 75 stop; system OOM/pressure warning হয়নি। তারপর ৮ GiB cap/৫ GiB heap/one worker-এ ৬২০ page-সহ whole pipeline exit 0; total peak ৭,৮৪৬ MiB, minimum headroom ১৬.০৪৮ GiB, swap growth ০। Child/main clean `6e3dd8d50`, pristine upstream base retained, ১২৯ generated CLI file restore। Deploy ৩ GiB cap-এ peak ১,৫০৬ MiB, minimum headroom ১৮.৫৬০ GiB, exit 0; 23:00:03.921 Dhaka-তে promotion সফল।

Artifact `~/.omniroute-builds/3.8.51-6e3dd8d50-attempt2/omniroute-3.8.51.tgz`, 99,631,665 bytes; SHA-256 `5a889ed25b6afd0fe62325810aa8dd0f4fd55fa2c030e1c7dd4ea8ec035496f3`। পূর্বের `770a768b1` package ও complete runtime `~/.omniroute-builds/runtime-backups/20261009-225858` এবং consistent DB `~/.omniroute-local/update-backups/20261009-225858/storage.sqlite` অক্ষত।

Postdeploy Sol/Astra/GLMT CLI-তে Write/Read/Edit/Bash/Bash—১৫ actual tool call, ৩/৩ fixture PASS; selected gateway models verified। একই native chat-এ GLMT→Sol→Astra switch-এর পরে browser, file tools, ToolSearch, Artifact list, SVG widget, AskUserQuestion fixture, context7, memory এবং Nexa Skill/helper পরীক্ষা হয়েছে। Restart-এর পর fresh Read/Bash exact marker ও আগের context PASS। Valid silent streaming native suggestion এখন HTTP 200; nonstream Sol/Astra native-template case-ও empty/end_turn 200। আগের native sample-এর ১১ optional-suggestion 502 retained; নতুন ৫ native request-এ ০টি 502। একটি আলাদা minimal synthetic Sol suggestion ৯০-second timeout/499 unresolved outlier retained—সব probe PASS বলা হয়নি।

Anthropic-hosted WebSearch/advisor এখনও GPT/GLMT-এ unsupported; নতুন guard স্পষ্ট 400 দেয়, feature parity তৈরি করে না। Browser/MCP বিকল্প পরীক্ষা হয়েছে। GLMT image unsupported; native Bash exact requested marker mismatch ও ১২১-second first response-ও report-এ আছে। তাই official-native সব feature/quality সমান বা zero-error guarantee নেই। Bounded CLI rating Sol ৯/১০, Astra ৯/১০, GLMT ৮/১০, মোট **৮.৭/১০**; এটি সব native workflow-এর rating নয়।

Immediate deploy retention ১৩/১৩ PASS: provider ২৫, API key ৩, mapping ১৪, ID sets/operator state/usage retained। Full settings hash-এর তিন startup-bookkeeping change source দিয়ে resolved। পরে বাস্তব client run-এর শেষে `.claude/settings.json` hash একই; `.claude.json` hash বদলেছে, origin নির্দিষ্ট না করে রিপোর্টে রাখা হয়েছে। এই task official config edit করেনি। Canonical Google verification ৪ active + ২ paused; আগের connection matrix-এ ১০ active success, ৯ quota/rate-limit ও ৪ verification failure, ২ paused skip। Enable বা forced clearing হয়নি।

Private optimizer commit [`7bc9d1c`](https://github.com/developerjillur/omniroute-optimizer/commit/7bc9d1cbf4d5baa4e8215959dbeafc66018ad1c2) push/remote verify: ২৯২ nexa file/source tree exact, Gitleaks PASS। Public OSS push/PR হয়নি। Jillur Rahman author/committer এবং normal hooks বজায়। Final release receipt (স্থানীয় বা private reference; প্রকাশিত নয়)।

অনুমোদিত স্বাভাবিক quit-এ Chrome/Claude বন্ধ হয়; Claude dialog-এর অন্য research session interrupted হয়েছে, force-kill হয়নি। পরে Claude reopen করে own QA করা হয়েছে; অন্য session resume/message করা হয়নি। পুরোনো deployment follow-up আগে থেকেই PAUSED, আবার যাচাই হয়েছে। সফল output, source/data/rollback, failed evidence এবং এই append-এর আগের সব report bytes অক্ষত রাখা হয়েছে।


---

## ২০২৬-১০-১০ — GPT selected effort fix live, Claude session restored

Updated: 2026-10-10T10:26:32+06:00

**Full production build এবং local deployment সম্পূর্ণ।** Live executable `0b62ea8e7`; deployment tooling `1152adf27`, clean/pristine main `nexalance`। Package `omniroute-3.8.51.tgz` 99,590,811 bytes, SHA-256 `11ca693d43f523e5275cb8b02ec43445e99772e3f07a0aa288a8075a897109d5`। সফল package পুনরায় build/pack করা হয়নি।

Responses translation-এ supported GPT Max downgrade ঠিক হয়েছে। ৯৫ focused, ১০৮ related, operator compression-off profile-এ ৪৯৩ MCP test PASS; core PASS; ratchet ৫৮১৭/৫৮৩০। Full dashboard/৬২০ page, CLI, package ও strict Bridge gate PASS। Build peak ৭৬২৮ MiB, minimum system headroom ১৩.৫১০২ GiB, pressure normal, swap বৃদ্ধি নেই।

প্রথম isolated smoke hardcoded Claude cached quota gate-এ 429 পেয়ে live untouched রেখেছিল। Configurable real `codex/gpt-6.1-sol` Anthropic-format smoke যোগ করে একই artifact দিয়ে সব health/auth/CORS/Bridge/migration gate PASS। Deployment peak ১৪৮৮ MiB / cap ৩ GiB, minimum headroom ১৩.৮৯২৫ GiB। Consistent DB snapshot integrity `ok`; complete previous runtime `6e3dd8d50` রাখা আছে `~/.omniroute-builds/runtime-backups/20261010-101645`-এ। Snapshot `~/.omniroute-local/update-backups/20261010-101645`। Loopback ও `omni.local` health 200, trusted native ingress/backend TLS PASS।

Provider ২৩, API key ৩, mapping ১৪, pre-promotion usage ৭৬,৫৮৮ retained। ID sets, operator/verification flags, mappings, alias models, prior usage, `.env`, DNS shim ও CA material অক্ষত। শুধু catalog revision fields স্বাভাবিকভাবে বদলেছে।

Live saved native aliases: Sol `max→max`, Sol `low→low`, Astra `high→high`, Astra `max→max`—চারটিই HTTP 200/exact marker/verified trace PASS। Real Claude Code CLI-র দুই-turn `Read` round trip-এও দুই request-এ upstream `max`, actual Sol/Codex, HTTP 200। GLMT pinned Max আচরণ বজায় আছে। সব upstream model বা পূর্ণ native feature parity fresh-test হয়েছে এমন দাবি নয়।

Claude অনুমোদিত স্বাভাবিক quit-এর পরে reopen হয়েছে। পূর্বের ইমেজ গবেষণা, 3D ও original local GitHub/Remotion session তিনটি আবার Running দেখা গেছে; তিন native runner ও ১৩টি saved transcript preserved। অন্য user work resume হওয়ার পরে আর বড় local job শুরু হয়নি।

আলাদা পূর্ববর্তী সমস্যা logs-এ রয়েছে: কিছু `previous_message_id`-এ eligible owning account-এর thread state নেই বলে `POST /v1/messages` 404। Frozen observation-এ আগে ২৪১, পরে ১৩ entry; selected connection নেই, counters 0। Effort fix এই thread-continuity সমস্যাটি সমাধান দাবি করছে না; full replay/account-state tracing আলাদা বাকি।

নিজস্ব generated `.build` ও failed isolated attempt পুরো file/hash/mode/symlink inventory যাচাই করে নতুন T7 archive-এ রাখা হয়েছে; কেবল internal duplicate সরানো। সফল release/dist, source/data/rollback ও আগের report bytes রক্ষিত।

বিস্তারিত: [GPT selected effort final report](OMNIROUTE-GPT-SELECTED-EFFORT-FIX-2026-10-10.md)

Durable receipt: `backup/omniroute-gpt-effort-build-2026-10-10/release-acceptance-20261010.json`।

### ২০২৬-১০-১০ — GPT routing-এর misleading 502-এর নিশ্চিত কারণ

Sagrilo Claude Code transcript-এর দুইটি visible 502 gateway call-এর সঙ্গে মিলেছে। আসল upstream error `context_length_exceeded`; non-streaming Claude translation-এ error হারিয়ে generic `upstream_empty_response` হয়। Frozen Dhaka 11:53:00–12:09:12 window-এ 2টি সঠিক streaming 400 এবং 22টি ভুল non-streaming 502 পাওয়া গেছে; সব artifact checksum যাচাই হয়েছে। History entry 1,849; tool definition 112। নির্বাচিত effort max→max ঠিক ছিল। Byte-identical runtime helper দিয়ে reproduction exit 0; নতুন upstream inference হয়নি।

[পূর্ণ diagnosis ও প্রয়োজনীয় fix](OMNIROUTE-GPT-EMPTY-RESPONSE-ROOT-CAUSE-2026-10-10.md)। Production code/config/routing বা deployment এই investigation-এ পরিবর্তিত হয়নি। স্থায়ী fix-এ translation-এর আগে error code দেখে 400 invalid_request_error ফেরানো এবং native context recovery budget যাচাই প্রয়োজন। OmniRoute compression engine চালু করা হয়নি।

## ২০২৬-১০-১০ — GPT context overflow fix, source validation ও অনুমোদিত resource সংরক্ষণ

`fix/native-context-error-2026-10-10` branch-এ commit `7dd92427f391f592cc1914bec54ae0e7feb97f88` সম্পন্ন। Author ও committer Jillur Rahman; স্বাভাবিক commit hooks PASS। পরিবর্তন শুধু চারটি `nexa/` path-এ। Upstream base pristine আছে; ১৪৩/১৪৩ overlay patch প্রয়োগের check PASS। Shared `nexalance` ও live runtime এখনও বদলানো হয়নি—এই addendum লেখা পর্যন্ত production `0b62ea8e7`।

মূল সংশোধন: Responses API-এর HTTP 200 body/stream-এর ভেতরে `context_length_exceeded` এলে non-streaming leg এখন translation ও empty-output fallback-এর আগেই `400 / invalid_request_error / context_length_exceeded` ফেরত দেয়। একই check recovery response-এর success tail-এও আছে। Raw upstream message প্রকাশ না করে native client চেনার উপযোগী নিরাপদ `prompt is too long` message ব্যবহার হয়। Provider usage, selected connection ও error receipt রাখা হয়; request log-এ sanitized upstream body এবং সঠিক client error code/type সংরক্ষিত হয়। সত্যিকারের empty output ও আলাদা server failure-এর 502 আচরণ বহাল। Effort, routing mapping, compression, account activation বা official app configuration পরিবর্তন হয়নি।

প্রমাণ ও validation:

- পরিবর্তনের আগে নতুন ১১টি regression-এর ৭টি fail; সংশোধনের পরে ১১/১১ PASS। JSON, buffered SSE, NDJSON, missing status, partial output, valid tool response ও error-log sanitization অন্তর্ভুক্ত।
- সংশ্লিষ্ট মোট ২১০/২১০ test PASS; এই মোটের মধ্যেই উপরের ১১টি আছে। Core typecheck PASS।
- Full TypeScript ratchet পর্যাপ্ত heap-এ exit 0: measured `5822`, baseline `5830`; error count বাড়েনি। প্রথম 1536 MiB compiler run heap cap-এ SIGABRT হওয়ায় সেটিকে PASS ধরা হয়নি; পৃথক evidence রাখা আছে।
- আসল installed Claude Code CLI `2.1.294`-এর isolated local fixture-এ ঠিক একটি message request হয়েছে, error status 400, terminal reason `prompt_too_long`, `is_error=true`। ভুল transient 502 বা retry loop দেখা যায়নি। CLI exit 1 এই deliberate error fixture-এর প্রত্যাশিত ফল; এটি live inference সফল হওয়ার দাবি নয়। এই fixture-এ provider quota ব্যবহার হয়নি।
- Source ও validation log hash যাচাই করা receipt: `~/Library/Caches/NexaLance/omniroute-gpt-empty-response-2026-10-10/validated-source-7dd92427f.json`।

ব্যবহারকারীর নির্দিষ্ট অনুমতি অনুযায়ী Chrome menu-এর Quit দিয়ে স্বাভাবিকভাবে বন্ধ করা হয়েছে। অনুমোদিত সাতটি পুরোনো rollback runtime-এর নতুন archive T7-এর `backup/context-error-fix-2026-10-10/older-runtime-archives/`-এ রাখা হয়েছে। প্রতিটি archive-এর সব file content SHA-256, symlink, hardlink ও mode যাচাই, সম্পূর্ণ inventory coverage এবং removal-এর আগে source আবার hash মিলিয়ে শুধু internal duplicate সরানো হয়েছে। নতুনতম `20261009-225858` ও `20261010-101645` rollback internal disk-এ আছে। Live runtime, database এবং release `.tgz` অক্ষত। এই relocation-এ মেপে internal free space প্রায় ১৬.১২ GiB বেড়ে ২৯.১২ GiB হয়েছে; archive process peak 603.39 MiB, pressure সর্বদা normal, swap বৃদ্ধি শূন্য। পূর্ণ receipt: `~/Library/Caches/NexaLance/omniroute-gpt-empty-response-2026-10-10/approved-runtime-relocation-result.json`।

আগের সফল worktree `dist` মুছে বা overwrite করা হয়নি। একই volume-এ নতুন `~/.omniroute-builds/3.8.51-0b62ea8e7/preserved-worktree-dist-20261010-context-error` path-এ রাখা হয়েছে; ১৯,৭২৩টি entry-এর পূর্ণ content/mode/symlink ও একই inode/device যাচাই PASS।

এই addendum লেখা পর্যন্ত নতুন production build/deployment সম্পন্ন নয়। একটি resource preflight compile শুরু করতে দেয়নি; ৩ GiB ও ৪ GiB heap-এর দুই full compile চেষ্টা compiler-এর নিজস্ব heap limit-এ থেমেছে। কোনো system pressure warning বা swap বৃদ্ধি হয়নি। উভয় failed attempt, partial output ও log সংরক্ষিত; source auto-restore শেষে clean/pristine। আগে সফল ৫ GiB heap ও এক worker profile-এর জন্য ৭ GiB job cap-এর বাইরে ১০ GiB system reserve মেপে admission নেওয়া হচ্ছে। Guard bypass বা অন্য app বন্ধ করা হয়নি। সফল package, isolated smoke, promotion ও live QA-এর ফল পরের addendum-এ আলাদাভাবে যোগ করতে হবে; source commit বা artifact উপস্থিতিকে deployment complete ধরা যাবে না।


## ২০২৬-১০-১০ — GPT context-overflow fix: full build, production deployment ও bounded live QA সম্পূর্ণ

`7dd92427f391f592cc1914bec54ae0e7feb97f88` এখন production-এ চলছে। Main `nexalance` এবং পরীক্ষিত `fix/native-context-error-2026-10-10` worktree একই commit-এ clean ও pristine। বাস্তবায়ন ও commit attribution: Jillur Rahman। Public OSS push বা PR করা হয়নি।

### সংশোধিত আচরণ

Responses API-এর buffered response-এ `error.code=context_length_exceeded` থাকলে translation-এর আগে তা শনাক্ত করা হয়। Claude client এখন HTTP `400`, `invalid_request_error`, `context_length_exceeded` এবং native client চেনার উপযোগী `prompt is too long…` বার্তা পায়। এই deterministic context failure আর ভুল `upstream_empty_response` 502 হয় না। Native client-এর ভুল transient-error retry বন্ধ হওয়ার contract পরীক্ষা PASS। Partial output, missing status এবং recovery tail-এর ক্ষেত্রও regression-এ অন্তর্ভুক্ত। প্রকৃত empty response ও server failure-এর বিদ্যমান 502 handling রাখা হয়েছে।

Routing, selected effort, account enable/disable, quota বা compression configuration বদলানো হয়নি। Context limit পেরোনো অত্যন্ত দীর্ঘ পুরোনো conversation-এ ব্যবহারকারীকে Claude-এর `/compact` বা নতুন session ব্যবহার করতে হতে পারে।

### Source validation ও পূর্ণ release build

- Focused regression ১১/১১ PASS; related regression মোট ২১০/২১০ PASS, যার মধ্যে ওই ১১টি অন্তর্ভুক্ত। Core typecheck PASS। Full TypeScript ratchet ৫৮২২, baseline ৫৮৩০: PASS। Hash-verified source evidence পুনর্ব্যবহার করা হয়েছে।
- ২০২৬-১০-১০ ১৩:২০:২১ Dhaka-তে সম্পূর্ণ production pipeline exit `0`: webpack production compilation, ৬২০ static page, standalone output, dashboard gate, CLI API ও command generation, pack-artifact policy, final `npm pack`, strict Bridge package gate—সব PASS।
- Strict Bridge receipt: `sourceAndDistMatch=true`, `sharedLifecycle=true`; packaged server SHA-256 `c77f5535a65f45e0e5a75b8cc010fa1bde4cff750ba9c4049b38e8909d8af8db`।
- সফল profile: one worker, webpack memory optimizations, ৫১২০ MiB heap, ৮১৯২ MiB total process cap, semispace ৮, `RAYON_NUM_THREADS=1`; desktop build/deploy flags `0`।
- Build watchdog-এর সর্বোচ্চ মাপা child-group RSS ৭৪১৯ MiB; outer sample peak ৭৪০৬ MiB। Minimum physical headroom ১৬.৩৪৩৯ GiB। Pressure সবসময় normal; swap-এর সর্বোচ্চ মাপা বৃদ্ধি প্রায় ০.০৭ MiB। Render overlap বা guard bypass হয়নি।
- আগের ৩ GiB ও ৪ GiB compiler-heap failure ও preflight evidence অক্ষত রাখা হয়েছে। সফল profile-এ ওই compiler failure আর হয়নি। Build শেষে ১২৯টি generated/changed CLI file exact inventory অনুযায়ী restore হয়েছে; source clean/pristine। সফল `.build`, `dist` ও release artifact সংরক্ষিত।

Verified artifact:

```text
~/.omniroute-builds/3.8.51-7dd92427f/omniroute-3.8.51.tgz
bytes: 99592471
SHA-256: 226898f0199bd6c99c35c1050ca56fc508f8be30cd79ea4d147c69c0fc8d1951
archive dist/BUILD_SHA: 7dd92427f
```

### Production promotion ও data preservation

Main-এর নতুন `nexa/deploy/omni-updater.sh redeploy`-এ exact `NEXA_DEPLOY_ARTIFACT` ব্যবহার হয়েছে। Isolated package install, real Anthropic-format `codex/gpt-6.1-sol` smoke, consistent database snapshot, complete previous runtime preservation, promotion, runtime SHA, health ও native Bridge TLS checks সফল হয়েছে। Deployment ১৩:২২:০৪ Dhaka-তে exit `0`।

Deployment watchdog: ৩০৭২ MiB cap, peak ১৫০৯ MiB, minimum system headroom ১৮.৬৬৫৬ GiB, normal pressure, swap growth ০। Resource failure বা promotion-এর মধ্যে updater interruption হয়নি।

- Live runtime `BUILD_SHA`: `7dd92427f`; `http://127.0.0.1:28128/healthz` এবং `http://omni.local/healthz` HTTP `200`।
- Complete previous runtime: `~/.omniroute-builds/runtime-backups/20261010-132044`, `BUILD_SHA 0b62ea8e7`। `previous-runtime` pointer সেখানেই আছে; previous package-ও রাখা হয়েছে।
- Consistent snapshot: `~/.omniroute-local/update-backups/20261010-132044`; SQLite backup API এবং `PRAGMA integrity_check` → `ok`।
- Fresh pre/post deployment inventory: ২৩ provider connection, ২২ active; ৩ API key; ১৪ Bridge mapping। Provider ID/state, API-key ID/value/state এবং mapping content hashes মিলেছে। Usage history ৭৯৩৭৭ retained; live QA-পরবর্তী count ৭৯৩৮০।
- CA certificate, private key ও runtime intent-এর hash অপরিবর্তিত। `targets.json` এবং `bypass.json`-এ শুধু `generatedAt` বদলেছে; timestamp বাদ দিয়ে configuration সমান। Credential values প্রকাশ করা হয়নি।

### Actual client ও live routing checks

| পরীক্ষা | ফল |
| --- | --- |
| Trusted native TLS `api.anthropic.com` → saved `claude-opus-5-5` alias | HTTP ২০০, exact marker; actual provider `codex`, model `gpt-6.1-sol`; selected `low` → upstream `low`; trace checksum ও SHA-256 verified |
| আসল installed Claude Code CLI দিয়ে `Read` | PASS; ২ turn, exact private fixture content, ২ successful request; trace-এ actual `Read` tool call ও tool result পাওয়া গেছে |
| একই live CLI request-এর effort | দুই request-এই requested `max` → upstream `max`, actual `gpt-6.1-sol`; ৫০২ বা tool error হয়নি |
| Deployed package-এর overflow handler + installed CLI `2.1.294` | Local fixture PASS; সঠিক ৪০০ context failure শনাক্ত; ১ message request; misleading ৫০২ ও retry loop নেই |
| একই deployed handler + VS Code extension-এর actual bundled binary `2.1.295` | Local fixture PASS; সঠিক ৪০০ context failure শনাক্ত; ১ message request; misleading ৫০২ ও retry loop নেই |

Live CLI read test ৫.৮৭৬ সেকেন্ডে শেষ হয়েছে; measured peak ২০৪ MiB। Error fixture-গুলো isolated local endpoint/database ব্যবহার করেছে, upstream quota খরচ করেনি। Test harness-এর package-alias import সমস্যা local bootstrap-এ সমাধান হয়েছে; deployed application file বদলানো হয়নি। Fixture-তে CLI exit `1` প্রত্যাশিত error outcome; harness assertions PASS ও overall exit `0`। দ্রুত শেষ হওয়া VS Code fixture-তে memory sample ধরা পড়েনি; receipt-এর peak `0` কোনো zero-memory দাবি নয়।

এই run-এর যাচাই scope হলো নির্দিষ্ট buffered context error, native TLS, actual CLI `Read`, selected GPT effort এবং দুই installed client-এর error contract। Claude Desktop GUI-এর সম্পূর্ণ feature suite এই run-এ পুনরায় পরীক্ষা করা হয়নি; বৃহৎ পুরোনো conversation provider-এ আবার পাঠানো হয়নি।

### অনুমোদিত resource কাজ ও সংরক্ষণ

আগে অনুমোদিত সাতটি পুরোনো rollback runtime T7-এ নতুন archive হিসেবে রাখা হয়েছে। File/hash/mode/link inventory যাচাই করে শুধু internal duplicate সরানো হয়েছে; সেই cleanup-এ measured internal free-space বৃদ্ধি ১৬.১২০৪৫ GiB। Live runtime, database, protected package ও তখনকার নতুনতম দুই rollback রাখা হয়েছে। সফল আগের worktree `dist` একই volume-এ নতুন preservation path-এ সরিয়ে পূর্ণ inventory/hash মিলিয়ে রাখা হয়েছে।

ব্যবহারকারীর নির্দিষ্ট অনুমতিতে Chrome, এরপর Sublime Text ও WhatsApp স্বাভাবিকভাবে quit হয়েছে। শেষ দুই app-এ `Quit and Keep Windows` ব্যবহার হয়েছে; unsaved content discard করার action নেওয়া হয়নি। অন্য app/session/service বন্ধ করা হয়নি। Final resource check-এ normal pressure, physical headroom ১৫.৪১ GiB ও internal free disk প্রায় ২৪.৫১ GiB ছিল; heavy কাজ তখন শেষ। Task evidence/cache প্রায় ৪০.৯ MiB। Existing heartbeat status `PAUSED` আছে।

### Evidence locations

- Completion receipt: `~/Library/Caches/NexaLance/omniroute-gpt-empty-response-2026-10-10/completion-receipt-7dd92427f.json`
- Full build receipt: `~/.omniroute-builds/3.8.51-7dd92427f/full-build-receipt.json`
- Full build log: `~/Library/Caches/NexaLance/omniroute-gpt-empty-response-2026-10-10/full-build-7dd92427f-20261010-proven-profile.log`
- Deployment receipt: `~/.omniroute-builds/3.8.51-7dd92427f/deploy-result-2026-10-10T07-20-44.201Z.json`
- TLS receipt: `~/Library/Caches/NexaLance/omniroute-gpt-empty-response-2026-10-10/postdeploy-native-tls-2026-10-10T07-22-20.128Z/summary.json`
- Live CLI receipt ও trace: `~/Library/Caches/NexaLance/omniroute-gpt-empty-response-2026-10-10/real-cli-live-read-8FB5nS/`
- Packaged error fixtures: `~/Library/Caches/NexaLance/omniroute-gpt-empty-response-2026-10-10/packaged-cli-contract-HmaE2J/receipt.json` এবং `~/Library/Caches/NexaLance/omniroute-gpt-empty-response-2026-10-10/packaged-cli-contract-d3xxPC/receipt.json`
- Retained data/rollback receipt: `~/Library/Caches/NexaLance/omniroute-gpt-empty-response-2026-10-10/postdeploy-preservation-receipt.json`



## Native `/compact` সংশোধন — ২০২৬-১০-১১, source প্রস্তুত; deployment বাকি

Jillur Rahman। Incident-এর retained log-এ Mixar MCP text regex-এর lone-surrogate range GPT-তে schema rejection ঘটাচ্ছে: সংশ্লিষ্ট session-এ ২০টি schema error ও ১০টি aborted request পাওয়া গেছে। Final `500 fetch failed`-এর underlying transport code পুরোনো log-এ নেই; timeout handling-এর ত্রুটি পৃথকভাবে পুনরুৎপাদিত। বাস্তব context overflow-কে network error বলা হয়নি।

Commit `e8e602568`, branch `fix/native-compaction-2026-10-11`, private worktree `~/Developer/OmniRoute/.claude/worktrees/gpt-effort-passthrough-2026-10-10`। ছয়টি `nexa/` file-এ schema projection ও bounded native router transport fix; normal hooks PASS, source clean/pristine। Related regression ১১৩ PASS, core typecheck PASS। Desktop bundled client `2.1.295` ও VS Code bundled client `2.1.296`-এর synthetic `/compact` PASS; provider token ব্যবহার হয়নি। Full ratchet, release build/deploy এবং real GPT `/compact` এখনও বাকি।

পুরোনো `7dd92427f` `.build`/`dist` protected internal release directory-তে atomic move করে সব file hash/inode যাচাই করা হয়েছে; মুছিনি। `7dd92427f` production-এ আছে। Current source বা fixture-কে live deployment complete বলা যাবে না।

Mixar background `render_mixar_d2.py` এখন সক্রিয়; heavy validation/build render শেষ হওয়ার অপেক্ষায়। Physical headroom সর্বশেষ প্রায় ১১.১ GiB; পূর্ণ build-এর admission ১৮ GiB। Chrome/Mixar/Claude স্বাভাবিকভাবে quit করার নির্দিষ্ট অনুমতির প্রশ্ন pending; app বা render বন্ধ করা হয়নি। Watchdog-এ Mixar background render detection-ও আছে।

বিস্তারিত রিপোর্ট: [OMNIROUTE-NATIVE-COMPACTION-ROOT-CAUSE-2026-10-11.md](OMNIROUTE-NATIVE-COMPACTION-ROOT-CAUSE-2026-10-11.md)। Evidence ও resume scripts: `~/Library/Caches/NexaLance/omniroute-native-compaction-2026-10-11`।


## Native `/compact` fix — build/deploy/live QA সম্পন্ন — 2026-10-11T15:17:31+06:00

Production এখন **`e26be697f`**। Exact verified package দিয়ে deployment exit 0 (2026-10-11T15:08:28+06:00); native Bridge TLS, backend TLS/DNS, loopback ও `omni.local` health PASS। Main/child source একই final commit-এ clean ও upstream pristine; পরিবর্তন শুধু ৮টি `nexa/` file, normal hooks PASS।

Retained incident-এ Mixar `mcp__mixar__mixar_ui_act` tool-এর lone-surrogate regex GPT schema validation-এ প্রত্যাখ্যাত হচ্ছিল। Codex projection-এ scalar-safe guard এবং paired `undici` transport/timeout handling production-এ এসেছে। Original `500 fetch failed`-এর underlying cause code retained ছিল না; নির্দিষ্ট original socket cause নিশ্চিত নয়।

Validation: related **১১৩ PASS**, core typecheck PASS; existing fixture typing correction-এর পরে সংশ্লিষ্ট ২৭ PASS (overlap আছে)। Full ratchet **৫৮২৬/৫৮৩০ PASS**, baseline অপরিবর্তিত। Full build **৬২০ static page**, dashboard/CLI/pack/strict Bridge/compaction package gate PASS। Artifact **99,597,882 bytes**, SHA-256 `2b47157186432557b47dade4157b8e9f7b289be0fb529554c9e9a31236e5e3f8`।

Live proof: আগের exact failing Mixar schema native TLS route-এ HTTP 200 ও exact marker পেয়েছে। VS Code/installed CLI `2.1.296` এবং Desktop bundled engine `2.1.295`-এ seed → `/compact` → resume **দুটিতেই PASS**; boundary ১, marker retained। Compaction যথাক্রমে **২১.৯৯৯** ও **২১.৮৮৬ সেকেন্ড**। ছয় client trace-এ actual provider `codex`, target `gpt-6.1-sol`, effort `low` → `low`, সব status 200 ও artifact checksums মেলে। Standalone/VS Code binary একই hash, Desktop আলাদা binary।

Retained inventory: **২৫ provider / ৩ API key / ১৪ routing mapping**, সব ID/content/operator-active-state hash মেলে; CA/config অক্ষত। Usage **৯৪২১৮ → ৯৪২২৫**। Complete previous runtime `~/.omniroute-builds/runtime-backups/20261011-145841`-এ preserved; root inode/device, file/directory/symlink counts, bytes ও critical hashes verified। Consistent snapshot `~/.omniroute-local/update-backups/20261011-145841/storage.sqlite` integrity `ok`, mode0600, provider/API-key sets ও usage retained।

অনুমোদিত apps স্বাভাবিকভাবে quit, unsaved Mixar scene saved। Build/deploy measured peak **৭৭০৯ / ১৩৭৬ MiB**, minimum headroom **১৫.৯১৫ / ১৭.৪৫৬ GiB**, pressure normal ও swap বৃদ্ধি ০। Completed isolated smoke-copy-র ৮টি payload নতুন T7 archive-এ hash-verified রেখে শুধু internal duplicate সরানো হয়েছে; **১.৫৫২ GiB** measured free increase। Live data/snapshot/release/build/rollback preserved। Final physical headroom **19.497 GiB**, internal free **20.047 GiB**।

Original giant chat/iPhone GUI replay করা হয়নি; Desktop bundled engine-এর live compaction tested। Actual target context limit এবং external upstream outage-এর সীমা থাকে। অতিরিক্ত OmniRoute compression চালু করা হয়নি। পুরোনো অপেক্ষা/prebuild status ঐতিহাসিক; এই অংশ সর্বশেষ completed status।

বিস্তারিত: [OMNIROUTE-NATIVE-COMPACTION-ROOT-CAUSE-2026-10-11.md](OMNIROUTE-NATIVE-COMPACTION-ROOT-CAUSE-2026-10-11.md)। Evidence directory: `~/Library/Caches/NexaLance/omniroute-native-compaction-2026-10-11`।


## সব বর্তমান `nexa/` fixes GitHub-এ সংরক্ষিত — 2026-10-11T15:30:04+06:00

Private repository [developerjillur/omniroute-optimizer](https://github.com/developerjillur/omniroute-optimizer)-এর `main` branch-এ commit [`092dd30`](https://github.com/developerjillur/omniroute-optimizer/commit/092dd30e2e7cc93a1be5f530eb1820ea38e1eeba) push এবং remote verification সম্পন্ন হয়েছে। Source snapshot `e26be697ffa2f4ffdfe548ff582b2a060da1712a`।

বর্তমান সব **৩০২টি tracked overlay file** byte/mode/blob hash অনুযায়ী সংরক্ষিত; manifest-এর **২৩০ entry = ১৪৪ patch + ৮১ new file + ৫ tooling**। GPT selected effort, buffered context-overflow/empty-response classification, native tool Unicode schema projection, Bridge `/compact` timeout/transport এবং selected-provider deployment smoke-এর সাম্প্রতিক fixes ও regression tests অন্তর্ভুক্ত আছে। আগের published snapshot থেকে ১০টি নতুন ও ৮টি সংশোধিত overlay file; README, NOTICE ও পূর্ণ inventory-ও আপডেট হয়েছে।

Remote-এর সব **৩০৭টি blob**-এর mode, size ও Git hash local publication commit-এর সঙ্গে মিলে গেছে। Remote `nexa/` tree এবং original source `nexa/` tree একই: `3a35a49b401a850930b1ab3daf711cce7b81a918`। সব ১৪৪টি patch cleanভাবে apply হয়; original source ও publication checkout clean। Export এবং পুরো ৩-commit publication history-র Gitleaks scan: no leaks found। Commit author/committer Jillur Rahman।

প্রকাশিত scope: source/test/deployment overlay এবং documentation/license/inventory metadata। Credential values, database, runtime, local request logs বা build archives export-এর অংশ নয়। Production build/deploy/live QA-এর ফল উপরের completion section-এ আছে; প্রকাশিত README-তেও evidence ও তার সীমা উল্লেখ আছে।

Publication evidence: `~/Library/Caches/NexaLance/omniroute-optimizer-publication-2026-10-11/remote-verification.json`, `export-verification.json`, `staged-verification.json`, `gitleaks-export.json`, `gitleaks-history.json`।


## Native connector ও Bridge switching follow-up — 2026-10-11T19:40:14+06:00

Jillur Rahman-এর source fix `b03f80bca` clean/pristine `nexalance`-এ fast-forward হয়েছে। Private `omniroute-optimizer/main` remote `c8bf669c8e229dd0573b40107c0543e137656cd3` নিশ্চিত; ৩১০টি overlay file source-এর সঙ্গে hash/mode/tree verified এবং secret scan PASS।

Build-এর আগে তিনটি প্রশ্ন পরীক্ষা: (১) Stop DNS বনাম global Stop ও direct Claude fallback, (২) saved GPT→Claude→GLM mapping পরের request-এ পড়া, (৩) newly discovered deferred connector schema এবং tool history transport। Normal Stop-এ managed DNS cleanup failure, missing elevation এবং partial IPv4/IPv6 entry-র নিরাপত্তা fix হয়েছে। Hosts/custom inventory না পড়তে পারলে listener বন্ধ হবে না। Live operator mapping বা production Bridge এই পরীক্ষায় বদলানো হয়নি।

QA group: discovery/suggestion 107 PASS; routing/namespace/TLS 18 PASS; final DNS/Stop/lifecycle 46 PASS; password/page/server-card UI 18 PASS; কিছু overlap আছে। Current core typecheck ও focused lint PASS। Actual native GPT connector smoke-এ ১৮টি callable binding-এর মধ্যে ১৭টিতে read-only operation PASS; Vercel teams PASS/profile 404। GitHub-এর callable schema ও একটি zero-tool custom binding functional PASS নয়; GLM fixture-কে live GLM proof বলা হয়নি।

বিস্তারিত: `OMNIROUTE-NATIVE-CONNECTORS-QA-2026-10-11.md` এবং source `nexa/docs/NATIVE-CONNECTORS-2026-10-11.md`। Current source-এর full-scope ratchet, full production build/deploy/postdeploy এখনও pending; পূর্বের verified artifact, live runtime, database ও rollback এই source/publication কাজে পরিবর্তিত হয়নি।


## ২০২৬-১০-১১ — b03f80bca full production release ও native QA সম্পন্ন

সর্বশেষ source `b03f80bca5656e397db13235edf5093039383882` দিয়ে full production pipeline exit 0; 620 static pages এবং dashboard/CLI/package/Bridge/connector gates PASS। Core typecheck PASS; full TypeScript ratchet 5826 ≤ 5830 baseline PASS, zero-error দাবি নয়। Source restore শেষে clean/pristine।

Verified artifact `omniroute-3.8.51.tgz`: 99631494 byte, SHA-256 `ddbe2864eada761afed7d597ca0b7a1746939804be9ca620eb09b63c5da63048`। নতুন bounded updater দিয়ে local production deploy শেষ `2026-10-11T14:01:26.192Z` / ঢাকা ২০:০১:২৬; runtime `b03f80bca`। Isolated real inference, consistent database snapshot, সম্পূর্ণ previous runtime preservation ও postdeploy 16 integrity check PASS। Provider/API key/mapping/operator state ও retained usage অক্ষত।

Build peak total RSS 7622 MiB, minimum physical headroom 20.403854 GiB; deploy peak 1481 MiB, minimum headroom 23.723328 GiB। দুই run-এ pressure স্বাভাবিক, swap বৃদ্ধি 0; কোনো parent-updater force-kill হয়নি। অনুমোদিত app-গুলো build-এর আগে স্বাভাবিকভাবে quit করা হয়েছিল।

বর্তমান runtime-এ trusted native TLS + original Mixar schema/deferred discovery probe PASS। Real VS Code CLI 2.1.296 ও Desktop engine 2.1.295-এ পৃথক session-এর seed → `/compact` → resume PASS; compaction 23.223 / 22.533 s, marker retained। Original giant/iPhone UI replay নয়।

Claude native GUI থেকে Higgsfield discovery/model call এবং Higgsfield Bridge/official Blender read-only calls PASS। Main request actual `codex/gpt-6.1-sol`, effort `xhigh → xhigh`; পৃথক no-tool auxiliary `gpt-6-luna` request-কে main routing বলা হয়নি। Blender preferences backup নিয়ে official Auto Start ও Higgsfield MCP control ফিরিয়ে single-instance cold restart যাচাই হয়েছে: official `9876`, Higgsfield `9877`, উভয় worker running; remote Blender host true এবং উভয় connector-এ 3 object। মাঝের non-pass multiple-instance diagnostic-ও রাখা হয়েছে; duplicate instance বা preference reset-এর কারণ নিশ্চিত দাবি নয়।

Private GitHub release report push: `54caf416879ba768b38191766e7da13b9bb25408`; 310টি nexa file source-এর exact hash/mode/tree match; Gitleaks PASS। আগের complete runtime ও consistent database rollback, সফল package/output অক্ষত। Follow-up automation ইতিমধ্যে PAUSED।

সম্পূর্ণ বর্তমান ফল ও vendor/operator সীমা: `OMNIROUTE-NATIVE-CONNECTORS-QA-2026-10-11.md` এবং private repo `reports/RELEASE-2026-10-11.md`। সব model/connector-এর পূর্ণ feature parity বা সব vendor issue ঠিক হওয়ার দাবি নেই।


### শেষ verification — 2026-10-11T14:23:35.976602+00:00

Runtime `b03f80bca`, localhost ও `omni.local` health HTTP 200; final receipt-এর 17টি check PASS। Provider/operator state, 3 API key ও 14 mapping fingerprint অক্ষত। Retained usage 96325 থেকে পরের live traffic-এ 96381 হয়েছে; সব নতুন usage শুধু এই QA-এর বলে attribution করা হচ্ছে না। Certificate bytes ও Bridge configuration semantics অক্ষত; targets/bypass-এর generated timestamp বদলেছে। Own QA শেষে Claude ও Blender process অনুপস্থিত যাচাই করা হয়েছে। Main source clean/pristine, private GitHub main `54caf416879ba768b38191766e7da13b9bb25408`-এর সঙ্গে remote মিলে; Gitleaks PASS।

Final receipt: `~/Library/Caches/NexaLance/omniroute-native-connectors-2026-10-11/release-b03f80bca/release-final-receipt.json`। Evidence directory 2.9 MiB; সফল outputs, source ও rollback সংরক্ষিত।


## ২০২৬-১০-১২ — Native thinking signature fix, production ও real switch QA সম্পন্ন

GPT → Claude routing switch-এর `400 messages.N.content.M: Invalid signature in thinking block` failure-এর source fix `0c0d3b1d4` production-এ deployed। Missing/empty/synthetic thinking signature ও explicitly rejected thinking suffix native final dispatch/count_tokens-এ safely handled; valid native signature, সাধারণ history, tools/results ও effort preserved। Sparse Thread restore-এর পরেও fix চলে।

নতুন regression 15/15, related 376/376, MCP 493/493, core typecheck, focused lint এবং full ratchet `5826 ≤ 5830` PASS। Full Next compile ও 620 pages PASS; Finder `.DS_Store` metadata failure-এর পরে completed Next output দিয়ে packaging resume/gates PASS। প্রথম failed receipts সংরক্ষিত, Next compile repeat হয়নি। Verified artifact SHA-256 `8f26dcab9a7ce1b6d60deac0702cd07afe6c65ec503a2e1acd459ec663448854` (99593490 bytes)।

Production runtime `0c0d3b1d4`; health/native TLS ও 16 integrity checks PASS। 25 provider connections, 3 API keys, 14 mappings, operator states ও retained usage সংরক্ষিত। সম্পূর্ণ previous runtime এবং consistent database snapshot verified। অনুমোদিত 9+2 পুরোনো copies এবং task-created smoke DB verified archive হয়েছে; live data মুছে জায়গা করা হয়নি।

Real GPT ↔ Claude pending tool cycle, signed replay, rejected signature, count_tokens PASS। VS Code CLI `2.1.296` ও Desktop engine `2.1.295`-এ Read/Bash → switch → `/compact` → native resume → GPT reverse switch PASS; compact boundary একটি করে, prior marker retained। Native app-এ Higgsfield discovery, Bridge host/scene ও official Blender summary—চার read-only call success; দুই reader-এর same scene/442 object মিলে, saved `.blend` অপরিবর্তিত। Actual provider/effort trace checksums verified। GUI শেষে RAM reserve কমায় শুধু own QA turn-এ Stop পাঠানো হয়; সব results ও final response retained, অন্য session/service বন্ধ করা হয়নি।

Private GitHub source snapshot push: [`d9a4c33`](https://github.com/developerjillur/omniroute-optimizer/commit/d9a4c33069350171d7c19bbf0d1b23d832d511dd)। 314 tracked `nexa/` files source bytes/hash-এর সঙ্গে মিলে; secret scan PASS। বিস্তারিত evidence, paths, failure preservation ও সীমা: [OMNIROUTE-NATIVE-THINKING-SIGNATURE-2026-10-12.md](OMNIROUTE-NATIVE-THINKING-SIGNATURE-2026-10-12.md)। Original giant chat/iPhone UI এবং সব third-party feature-এর নিঃশর্ত parity test হয়নি।


শেষ যাচাই — ২০২৬-১০-১২ ঢাকা সময়: source main ও দুই internal child clean/pristine `0c0d3b1d4`; private GitHub-এর `nexa/` Git tree-ও হুবহু একই `6de575f468844841d0377598d03cc5dc48c34e75`। Verified artifact bytes/SHA-256 আবার মিলে, localhost ও omni.local health HTTP 200। Follow-up automation `PAUSED`। এই point-in-time check-এ memory pressure normal, physical headroom 11.51 GiB, internal disk free 15.12 GiB; completed QA-এর পরে আর নতুন heavy job শুরু হয়নি। বর্তমান free space পরের বড় কাজের 20 GiB admission threshold-এর নিচে থাকলে আগে আবার resource admission যাচাই প্রয়োজন। Final receipt: `final-release-verification-receipt.json`।


## ২০২৬-১০-১৩ — OmniRoute storage cleanup সম্পন্ন

Source folder-এর hard-link-inclusive file-path size 38.81 → 14.18 GB; hard-link-aware allocated size 25.89 → 9.73 GB। 13টি পুরোনো generated folder এবং 5টি clean/merged duplicate worktree সরানো হয়েছে; source refs/branches ও small original test evidence সংরক্ষিত। Old runtime `20261011-145841`-এর 129741 entry T7-এ দুই archive অংশে file/hash/mode/link verified; শুধু internal copy সরানো হয়েছে। Newest two complete runtime rollbacks internal-এ আছে। Latest `.build/dist`, release packages, shared dependency environment, source, live runtime/database, keys, certificate ও usage অক্ষত।

Final 20 checks PASS: runtime `0c0d3b1d4`, health HTTP 200, trusted native TLS, 26 providers, 3 API keys এবং retained usage। Resource guard interruptions-এর পরে checkpoint পুনর্ব্যবহার করে কাজ শেষ হয়েছে; কোনো অন্য app/service/task বন্ধ করা হয়নি। শেষ মাপে internal free 30.08 GB (28.02 GiB); concurrent swap/other work-এর কারণে free-space delta-কে পুরোপুরি cleanup recovery বলা হয়নি। বিস্তারিত: [OMNIROUTE-STORAGE-CLEANUP-2026-10-13.md](OMNIROUTE-STORAGE-CLEANUP-2026-10-13.md)।


## 2026-10-14 — Native Artifacts ও GPT-6.1 Sol pricing source প্রস্তুত; release অপেক্ষায়

ব্যবহারকারীর সর্বশেষ নির্দেশ: **Apps চালু রাখুন; source প্রস্তুত করে অপেক্ষা করুন**। কোনো app/session/service বন্ধ করা হয়নি।

Thinking progress, complete-only Thread ownership, fenced Thread replay, bounded native buffered fallback ও per-request GPT pricing-এর source এবং regression tests `nexa/`-তে সংরক্ষিত। 157/157 strict patch applicability PASS; upstream base pristine, main checkout clean। Source branch `fix/native-artifact-recovery-2026-10-14`; source commit এখনো বাকি। চালু runtime `0c0d3b1d4`।

Intermediate batch 48/48 PASS; পরের safety/SQL/route tests চালানো হয়নি। Final validation, নতুন full build/package, deployment এবং native Artifact create/edit/reopen QA হয়নি। Small test batch-এর failed-preflight shell-sequence ঘটনাটি evidence-এ আছে; future runner fail-closed।

রিসোর্সের অপেক্ষায়: receipt snapshot-এ normal pressure, physical headroom প্রায় 14.42 GiB, internal free প্রায় 11.47 GiB। Build cap 8 GiB-এর বাইরে 10 GiB reserve ও internal 20 GiB দরকার। এই লেখাকে deployment complete বলা যাবে না।

বিস্তারিত: [OMNIROUTE-NATIVE-ARTIFACT-RECOVERY-2026-10-14.md](OMNIROUTE-NATIVE-ARTIFACT-RECOVERY-2026-10-14.md)। Source receipt: `~/Library/Caches/NexaLance/omniroute-native-artifacts-2026-10-14/source-prepared.json`।


2026-10-14 follow-up: `omniroute-build-deployment` এখন ACTIVE; নতুন source receipt ও বর্তমান apps-চালু-রাখার নির্দেশ অনুযায়ী resource admission-এর অপেক্ষা করবে। অপরিবর্তিত অপেক্ষায় notification নয়। পুরোনো completed release-এর prompt বদলানো হয়েছে; নতুন validation/build/deploy/native QA সম্পন্ন হওয়ার দাবি করা হয়নি।


## 2026-10-14 14:55 Dhaka — ব্যবহারকারীর status ও build অনুরোধের যাচাই

Latest measured physical headroom 17.883 GiB, normal memory pressure, internal disk free 12.637 GiB; swap used 18846.38 MiB। এর আগের মাপে headroom 20.150 GiB ছিল, তাই RAM ওঠানামা করছে। Build admission 18 GiB physical headroom ও 20 GiB internal disk: latest shortfall 0.117 GiB RAM ও 7.363 GiB disk। Validation/deploy memory requirement 13 GiB; disk requirement 20 GiB। Background Blender render বা অন্য build প্রথম preflight-এ পাওয়া যায়নি; T7 mounted।

329 overlay file hash receipt-এর সঙ্গে মিলে গেছে; base pristine, 30টি change শুধু nexa/তে, main clean, runtime 0c0d3b1d4। Validation runner hash মিলে গেছে; নতুন validation attempt নেই। Retained intermediate log সরাসরি পড়ে 48 tests / 48 pass / 0 fail নিশ্চিত হয়েছে; এটি latest added changes-এর final validation নয়।

Final relevant regression, core typecheck, ratchet ও lint; normal-hook commit; full dashboard/CLI build ও package gate; isolated smoke ও database/rollback preservation; promotion/ingress update; real native/CLI Artifact QA; private optimizer sync বাকি। Resource admission ব্যর্থ বলে tests/build/deploy শুরু হয়নি। Storage inventory read-only পরীক্ষা হয়েছে; protected source, successful outputs, release packages বা newest rollback সরানো হয়নি।


## 2026-10-14 অনুমোদিত archive এবং final validation অগ্রগতি 20261014T092726Z

Human approval `private-id-022` অনুযায়ী di[REDACTED].json-এর ১৮টি exact internal copy নতুন T7 archive-এ সংরক্ষিত। প্রতিটি file SHA-256, symlink, permission এবং macOS extended metadata archive পড়ে যাচাইয়ের পরে matching internal copy সরানো হয়েছে। মূল source, live data/runtime, installed app ও সংরক্ষিত দুইটি rollback আছে। Archive RSS peak 112.31 MiB; মাপা internal free-space বৃদ্ধি 5.80238 GiB, শেষে 21.22670 GiB খালি ছিল। এটি বর্তমান free-space-এর স্থায়ী মান নয়।

Archive: `<local-setup>/rollback-archives/native-artifacts-di[REDACTED]`। Receipt: `~/Library/Caches/NexaLance/omniroute-native-artifacts-2026-10-14/archive-final-receipt-20261014T091338Z.json`। নতুন full build/package gate সফল হলে কেবল current-task `.build` ও `dist`-ও একইভাবে archive করার consent আছে; নতুন `.tgz` internal-এ থাকবে।

Final source fixture corrections-এর পরে native 119/119, analytics/streams 132/132 ও deployment 22/22 PASS; core typecheck PASS। Evidence: `validation-2026-10-14T09-21-34.535Z/validation-receipt.json`। Codex intentional API-equivalent display এবং completed Thread-only ownership test রাখা হয়েছে। Full TypeScript ratchet 1536 ও 2560 MiB heap-এ SIGABRT দিয়েছে; unmeasured gate reject হয়েছে, PASS নয়। Stateless compiler measurement-এ incremental cache বন্ধ করা হয়েছে; full tsconfig ও সব checks একই থাকবে। নতুন runner `validate-prepared-v4.mjs`-এর প্রথম admission internal disk <20 GiB হওয়ায় fail-closed; lint/optimized ratchet এখনো চলেনি।

Latest prepared receipt `source-prepared-v3.json`, 329 overlay files, inventory `54dbcc3d454071deaf16965b67b50849469c7a097b2aa22b3fe8f1914e8b6b0c`। Base pristine; commit/new build/deploy/native QA হয়নি। RAM/disk guard বহাল; apps/session/render বন্ধ করা হয়নি। Final validation incomplete হওয়ায় live runtime এখনও `0c0d3b1d4`।


## 2026-10-14 — Native usage audit ও অতিরিক্ত release fixes

<!-- usage-audit-2026-10-14-cutoff-20261014T102906Z -->

Window cutoff `2026-10-14T10:29:06.166Z`: 99,570 usage rows, 93,283 call rows, 836 transcript prefixes/12.2 GB, 75,372 deduplicated native responses, 20 retained logs পরীক্ষা করা হয়েছে। Current runtime `0c0d3b1d4`।

নতুন নিশ্চিত কারণ: sparse native Thread context reference sanity check-এ অনুপস্থিত থাকায় actual cache/input usage local estimate দিয়ে rewrite হচ্ছিল; 51,350 valid iteration responses-এর 36,401-এ top-level metering আলাদা। Stream cumulative/cache-creation accounting এবং native tool-only content/correlation-ও সংশোধনের source প্রস্তুত। Generation POST-এর ambiguous response-start/socket failure-এ automatic transport replay-এর ঝুঁকি বন্ধ করার guard প্রস্তুত। 475 exact replay diagnostic line (137 Anthropic host) actual duplicated billing count নয়। Cache-group account transition 19টির মধ্যে 9টির কারণ unresolved; blanket no-waste guarantee দেওয়া হয়নি।

পূর্ণ report: `OMNIROUTE-USAGE-AUDIT-2026-10-14.md`। Latest source receipt `source-prepared-v5.json`,341 overlay files,inventory `c89bbd4d317af6a5d9e55d957ed16146976fc64540ad505e137e71ffa5c86345`; application base pristine/uncommitted। নতুন affected source-এর জন্য আগের273-test/core evidence current validation নয়। `validate-prepared-v5.mjs` source/runner/exporter hashes verify করে bounded formatter → baseline red reproduction → native/usage/stream/transport/core/full lint/full ratchet চালাবে; এখনো run হয়নি। Unchanged deployment22 regression শুধু exact dependency/log hash মিলে reuse করা যাবে। New full build/deploy/native UI QA pending; old0c package নতুন fix নয়। Apps চালু থাকবে; physical validation/deploy13GiB, build18GiB এবং internal20GiB admission বহাল।


## 2026-10-14 18:20 Dhaka — source validation ও নতুন build

<!-- source-validated-build-started-2b4158371-20261014T121828Z -->

Source commit `2b4158371223293db12d3a6de00a9b22d44600fb` normal hooks-সহ সম্পন্ন; author/committer Jillur Rahman। Commit-এর পরে 41টি application hash validated bytes-এর সঙ্গে মিলেছে; source clean/pristine।

Final gate `validation-2026-10-14T12-10-59.202Z/validation-receipt.json`: strict applicability 166/166; old7 baseline-এ native usage/POST replay failing assertions reproduce; new native 131/131, related usage/stream/analytics/transport 284/284, core typecheck ও full ESLint PASS। Unchanged deployment 22/22 exact source/test/log hashes মিলে reused। 10 unused suppressions removed, none added/widened। Usage payload export, new test narrowing ও SQLite row boundary typing corrected।

Full TypeScript ratchet measured 5806, established baseline 5830, PASS; known upstream backlog থেকে zero-error full typecheck দাবি নয়। 3 GiB ও 5 GiB profiles SIGABRT/SKIP-এ rejected ছিল। Human approval-এ শুধু full ratchet heap6144MiB/RSS8192MiB-এ সম্পূর্ণ হয়েছে, peak5195MiB; reserve10GiB এবং সব stop guards বহাল। অন্য validation/deploy cap3GiB।

Authoritative source receipt: `~/Library/Caches/NexaLance/omniroute-native-artifacts-2026-10-14/validated-source-2b4158371.json`। Full dashboard/CLI/package build এখন চলছে `~/.omniroute-builds/3.8.51-2b4158371`-এ; log `full-build-launch-2b4158371-20261014T121828Z.log`। Build preflight-এ physical18.697GiB, internal73.409GiB, pressure normal। Desktop build/deploy flags0। এই entry build completion/deployment/native QA প্রমাণ নয়।

Live package promotion, installed ingress update, pricing cutoff comparison, real native app/normal CLI Artifact/thinking/Thread/connector/route QA এবং final private optimizer sync বাকি। Audit-এর unresolved9 account transitions এবং missing direct equivalent-workload baseline-এর কারণে zero-extra-usage guarantee দেওয়া হয়নি।


## build-complete-2b4158371-20261014T124414Z

পূর্ণ dashboard build (620 static pages), CLI generation, npm pack validation, strict Bridge এবং compaction/connector/thinking package gates PASS। Source commit `2b4158371223293db12d3a6de00a9b22d44600fb`; normal hooks ও post-hook application hashes verified। নতুন package `3.8.51-2b4158371/omniroute-3.8.51.tgz`, 99,699,156 bytes, SHA-256 `02f6e6dfe3e27b712341e32f6338e0f9308bf24a3026e8bba75de909141dc7ad`, packaged BUILD_SHA `2b4158371`। Authoritative receipt: internal artifact directory-এর `build-completion-receipt.json`। Original build receipt-এ successful pack-এর পর পুরোনো verifier contract failure সংরক্ষিত; corrected external behavioral verifier ও resumed package gates PASS, compile/pack পুনরাবৃত্তি হয়নি।

Build peak RSS 7166 MiB, minimum physical headroom 14.8304 GiB, swap growth 0, pressure normal। Source worktree clean/pristine; main `nexalance` exact source-এ fast-forward হয়েছে। Deployment-এর প্রথম launch 13 GiB physical admission-এ fail-closed হয়েছে; updater চালেনি। Live runtime তখনও prior release। Fresh admission-এর পরে deploy, updated installed native ingress, retained data/rollback verification এবং Claude native UI/normal Claude Code QA বাকি। Audit-এর নয়টি unexplained account transition এবং direct native comparison gap এখনো unresolved; blanket no-extra-usage guarantee দেওয়া হয়নি। Apps বন্ধ হয়নি।


## 2026-10-14 — deployment, ingress ও native QA ফল

Source ও live runtime `2b4158371`। Verified নতুন package পুনর্ব্যবহার করে deployment 13:06:29 UTC-এ code 0। Isolated Anthropic-format smoke, management auth, Bridge, migration, model ও CORS gates PASS। Active request স্বাভাবিকভাবে শেষ হওয়ার পরে drain এবং consistent snapshot নিয়ে promotion হয়েছে। Deploy peak 1345 MiB, minimum physical 11.9219 GiB, pressure normal, swap growth 0।

User-authenticated installer-এর পরে installed root native-ingress.mjs committed bytes-এর সঙ্গে exact match, idle timeout 1320000 ms; পুরোনো source/plist/binder backup retained। Live health ও উভয় native TLS gate PASS। Source SHA-256: `216dc5db4600c3596fe14c9393dcedc03959d755ecfec5a6e6e64029b08fa891`।

২৬ provider ও ৩ API-key IDs retained। Operator settings/mappings/combos semantic comparison PASS। Previous runtime inode/device অক্ষত। Snapshot-এর আগের usage_history 141305 rows ও call_logs 93584 IDs exact prefix hashes মিলে। Credential refresh/last-used counters ও catalog timestamps স্বাভাবিকভাবে বদলেছে।

GPT-6.1 Sol-এর exact cutoff `2026-10-14T06:20:59.934376+00:00`, dimension hash `2a4932b6c96b47ca3c496fe56aed505dfc0e0037e33edc1aeef9927c1c334016`, 19951 rows-এর historical API-equivalent estimate `$1583.4206430` exact মিলে। Live dashboard gpt-6.1-sol `$1578.28` দেখায়; এটি subscription invoice নয়।

নতুন native app QA Artifact create/publish/read, follow-up edit ও reopen PASS: `QA EDIT OK version 2` actual UI-তে দেখা গেছে। Read ও Context7 public read-only documentation connector PASS। Native progress `Working…`/token counter ও completed result observed। Normal interactive Claude Code Read/Edit/Read ও saved-session resume PASS; normal hooks ও manual permissions বহাল। Thread continuation এবং restart-এর full-history create request trace retained।

User session-এর comment-monitor warning bundled native client 2.1.295 থেকে এসেছে। পরে [private-artifact].html তৈরি ও publish observed, এবং নতুন watch state `armed` লেখা হয়েছে। Automatic comment reply tested নয়; specific inner exception পাওয়া যায়নি। Existing user session/Artifact edit বা response stop করা হয়নি।

Full QA এখনও incomplete: native custom-model access check GPT নামটি প্রত্যাখ্যান করেছিল; process-scoped existing-key gateway mode-এ response এসেছে কিন্তু Read কাজ সম্পন্ন হয়নি। Small tool fidelity probe, GLM ও return-Claude regression pending। Private optimizer copy prepared; final metadata/commit/push pending। Historical 9 unresolved account transitions ও direct-native billing baseline gap রয়ে গেছে; blanket zero-extra-usage guarantee দেওয়া হয়নি।


## ২০২৬-১০-১৪ — private sync সম্পূর্ণ, native monitor QA অবশিষ্ট

- Verified deployed source `2b4158371`-এর সব 342টি `nexa/` file private `developerjillur/omniroute-optimizer` repository-তে sync হয়েছে। Private commit `6acab81de3dbb89962c2571de5f0d369b874be6a` normal hooks ও Jillur Rahman author/committer দিয়ে তৈরি; normal push-এর পরে remote `main` একই SHA, working tree clean এবং সব 342 file-এর hash exact। Public OSS-এ কোনো push/PR/issue হয়নি।
- ছোট GPT forced-Read control probe-এর HTTP 200/exact `Read` tool-use PASS evidence পুনর্ব্যবহার হয়েছে; নতুন probe request হয়নি। Broad normal CLI Read এখনও unresolved; focused GPT/GLM/return-Claude tool regression বাকি।
- ব্যবহারকারী live functionality কাজ করছে বলে জানিয়েছেন। পরে running research chat-এ পাঁচটি saved Artifact-এর generic comment-monitor resume notice এসেছে; একই Artifact-এর ২৫–২৮ সেপ্টেম্বরের host logs পাওয়া গেছে। Installed native engine recovery gate denial বা caught startup failure একাধিক carried monitor-এর জন্য এই generic notice দিতে পারে। Specific underlying cause, automatic comment reply এবং permanent watcher recovery এখনও verified নয়; notice থেকে পাঁচটি নতুন generation failure বা extra billing দাবি করা হয়নি।
- OWN native Artifact monitor QA করতে গিয়ে Mac locked পাওয়া গেছে; automatic unlock ব্যর্থ, manual unlock প্রয়োজন। Existing user chat, Artifact, saved files, official config বা চলমান jobs বদলানো/বন্ধ করা হয়নি। নতুন inference বা native monitor test শুরু হয়নি।
- সফল source validation/full build/runtime deployment/root ingress/pricing/data-retention evidence বহাল ও পুনর্ব্যবহৃত। Compile, pack, installer বা updater পুনরায় চালানো হয়নি। Direct-native equivalent-workload billing baseline ও 9 historical account transition-এর আগের সীমাবদ্ধতা বহাল; blanket zero-extra-usage guarantee নেই।
- Full real native QA এখনও incomplete। Follow-up ACTIVE থাকবে; resource admission এবং Mac unlock-এর পরে own Artifact comment/reconnect test ও route regression চালানো হবে।

Evidence: `private-overlay-push-20261014T154258Z.json`, `native-comment-monitor-recurrence-20261014T150753Z.json`, `native-qa-locked-mac-blocker-20261014T154051Z.json` (internal task cache; credentials/private Artifact URLs omitted)।


## 2026-10-14 21:02:54 UTC — focused normal CLI route QA সম্পন্ন; Artifact monitor এখনও অসম্পূর্ণ

**Focused CLI matrix: PASS. Full native QA: INCOMPLETE.** Source `2b4158371223293db12d3a6de00a9b22d44600fb`; private sync commit `6acab81de3dbb89962c2571de5f0d369b874be6a`।

- GPT `codex/gpt-6.1-sol`: normal interactive CLI-তে actual Read এবং `OMNI_NATIVE_QA_READ_V2` result যাচাই হয়েছে। 20:17 UTC-তে অন্য heavy কাজ শুরু হওয়ায় resource guard নিজস্ব CLI বন্ধ করে; final request-এর 499 সেই interruption-এর সঙ্গে মিলে। 20:52 UTC-তে saved tool result থেকে resume করে exact assistant final `QA_GPT_FOCUSED_READ_OK_20261014T2016Z` পাওয়া গেছে। Read আবার চালানো হয়নি। Read ও final-এর exact gateway response/provider trace HTTP 200 মিলেছে। এটি resumed sequence-এর PASS; uninterrupted run দাবি নয়।
- GLM `glmt/glm-5.3-max`: একই নিজস্ব session resume করে নতুন actual Read, সঠিক fixture result, exact final `QA_GLM_FOCUSED_READ_OK_20261014T2056Z` এবং `glmt` provider-এর দুইটি exact HTTP 200 trace যাচাই হয়েছে। CLI response model `glm-5.3`; route argument ও provider catalog model `glm-5.3-max`।
- return-Claude `claude-sonnet-5-5`: native default credentials-এ ফিরে নতুন actual Read, fixture result এবং exact final `QA_RETURN_CLAUDE_READ_OK_20261014T2058Z` যাচাই হয়েছে। Final provider request-এ exact Read tool-result ID ও fixture content আছে; `claude` provider response HTTP 200-তে final marker মিলেছে। Retained Read response summary empty text/no tool_calls; raw Read-response retention fidelity দাবি নয়। Actual execution নিজস্ব CLI transcript ও পরবর্তী provider request দিয়ে প্রতিষ্ঠিত।

তিনটি successful CLI exit code 0, guard failure null। Peak RSS যথাক্রমে GPT 464.23 MiB, GLM 488.06 MiB, return-Claude 640.81 MiB; minimum physical headroom 16.81/16.39/15.80 GiB; swap growth 0। Manual permissions/usual hooks ও process-only updater disabling ছিল; official client/config/login এবং operator policy বদলায়নি। Hosted connector parity দাবি নয়।

Own native Artifact comment/reconnect test এখনও অসম্পূর্ণ। Fresh admitted resource windows-এর পরে 20:16 ও 20:51 UTC CUA access Mac locked জানিয়েছে; সেই attempts-এ UI navigation/edit হয়নি। Human-এর আগের unlock confirmation সংরক্ষিত; পুনরায় unlock প্রশ্ন করা হয়নি। পুরোনো carried monitor notice-এর specific inner cause এখনও অজানা। Armed monitor record বা CLI route PASS automatic comment-reply recovery-এর প্রমাণ নয়।

এই QA-তে application source, build, pack, installation, updater বা ingress reload পুনরাবৃত্তি হয়নি; successful package, rollback, live data ও পূর্বের evidence সংরক্ষিত। Tiny forced-Read probe এবং private source sync পুনরাবৃত্তি হয়নি। Follow-up ACTIVE থাকবে কেবল অবশিষ্ট own Artifact monitor/reconnect QA-এর জন্য; completed CLI route test আর চালানো প্রয়োজন নেই।

Evidence: `~/Library/Caches/NexaLance/omniroute-native-artifacts-2026-10-14/focused-cli-route-matrix-20261014T210151Z.json`; `~/Library/Caches/NexaLance/omniroute-native-artifacts-2026-10-14/focused-gpt-cli-resume-qa-20261014T205505Z.json`; `~/Library/Caches/NexaLance/omniroute-native-artifacts-2026-10-14/focused-glm-cli-qa-20261014T205742Z.json`; `~/Library/Caches/NexaLance/omniroute-native-artifacts-2026-10-14/focused-return-claude-cli-qa-20261014T210151Z.json`।
