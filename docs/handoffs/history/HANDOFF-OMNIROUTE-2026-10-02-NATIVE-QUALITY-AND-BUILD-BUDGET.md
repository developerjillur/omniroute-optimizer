> **ঐতিহাসিক নথি — public copy, ২০২৬-১০-১৭।** মূল ঘটনার তারিখ ও ফল এই নথির নিজস্ব সময়ের জন্য প্রযোজ্য; পরের সংযোজন থাকতে পারে। বর্তমান অবস্থা ও কাজের নিয়মের জন্য [বর্তমান handoff](../CURRENT-STATUS-2026-10-17.md) পড়ুন। Private reference ও identifier সরানো হয়েছে; স্থানীয় evidence এখানে অন্তর্ভুক্ত নেই। পুরোনো cleanup, build, deploy বা service command বর্তমান অনুমতি হিসেবে ব্যবহার করবেন না।

# OmniRoute native quality and build budget handoff

Owner: Jillur Rahman<br>
Review date: 2026-10-02, Asia/Dhaka

## 1. Current result

Local cached quota filtering OFF kora hoyeche. Duita connected Claude account-e alada minimal live request pathiye duitatei Anthropic-er actual HTTP 429 paowa geche. Tai ei muhurte shob native session-er successful response restore hoyeche bola jabe na. Local cache restriction ar provider subscription quota alada.

- Running package: `3.8.51`, build `0bda6c400`.
- Source commit: `c1cfafb8f`, local `nexalance` branch-e integrated.
- Live gateway health HTTP 200; existing Bridge PID 23027 running chhilo final check-e.
- Notun quality patches source/overlay-te committed, running package-e ekhono deploy hoyni.
- Installed updater entrypoint notun bounded-build version-er sathe hash-verified. Konno build ba service restart trigger kora hoyni.

## 2. Error-gulor evidence

| Error | Ki verify hoyeche | Current state |
| --- | --- | --- |
| Cached quota exhausted, no upstream attempt | Cached quota filtering UI-te ON chhilo | Browser diye OFF, reload-er por saved OFF verified |
| Rate limit / weekly limit | Duita connection-e pinned minimal request, duitatei actual 429 | Upstream quota availability dorkar |
| `claude-opus-5-5[1m]` model error | Parser suffix support ache; native CLI probe 35 second-e timeout | Successful native extended-context inference ekhono unverified |
| Coding payload quality | Native text-e U+200D insert ebong 150 tools theke 128 tools truncate reproduce hoyeche | Scoped fixes + regression tests committed; package promotion baki |
| Build-e beshi RAM | Inherited large heap ebong parallel work-er jonno limit dorkar | Managed build guard installed; full production build ei profile-e ekhono run hoyni |

Observed quota snapshot-e account A-r weekly remaining 0%, reset 2026-10-06 08:59:59 Asia/Dhaka; account B-r five-hour remaining 0%, reset 2026-10-03 00:09:59 Asia/Dhaka. Egulo provider telemetry-r point-in-time value, successful recovery-r guarantee noy. Account B-r weekly quota oi snapshot-e baki chhilo. Paid extra usage enable kora hoyni. Password, access token ba full account identifiers ei report-e rakha hoyni.

## 3. Live configuration review

- Cached quota filtering OFF, quota preflight OFF.
- Session affinity 86400 seconds; current strategy Priority.
- Prompt compression OFF; semantic/vector response cache OFF.
- Claude system-transform pipeline disabled, background degradation OFF.
- Zero-latency hedging/fallback compression OFF.
- Native model/effort choice client-er control-e; client cache markers Auto preservation.
- Existing local API-key quotas/session caps ebong configured local rate protection disabled chhilo. Provider-er quota tule dewa hoyni.
- Official Claude app, account, history, projects ba app bundle ei pass-e modify kora hoyni.

## 4. Permanent overlay changes

1. Official `claude-cli/` user-agent shared helper-e native client hisebe recognize kora.
2. Native user/system text ebong tool descriptions-er moddhe zero-width obfuscation bondho kora.
3. Native Claude request-e generic optional system-block transform bypass.
4. Native tool list 128 ba learned cap diye chupchap truncate na kora. Real provider rejection thakle seta client dekhbe.
5. Claude OAuth-er `getNextFamilyFallback` path-e older/smaller same-family model substitution bondho kora. Eta shob possible fallback path disable korar claim noy.
6. Build memory guard, serial validation, one Next worker ebong one UI test worker.

Source paths:

- `~/Developer/OmniRoute/nexa/NATIVE-QUALITY-2026-10-02.md`
- `~/Developer/OmniRoute/nexa/deploy/BUILD-BUDGET.md`
- `~/Developer/OmniRoute/nexa/deploy/run-bounded-build.mjs`
- `~/Developer/OmniRoute/nexa/deploy/build-candidate.sh`
- `~/Developer/OmniRoute/nexa/patches/`
- `~/Developer/OmniRoute/nexa/new/tests/unit/agent-bridge-text-fidelity.test.ts`

## 5. Build RAM control

- Per-process Node heap: 5120 MiB.
- Next workers: 1.
- Build tree-er total RSS watchdog: 8192 MiB, 1 second interval.
- Webpack, UV thread pool 2, process priority nice +10.
- Limit exceed ba monitoring failure hole sudhu oi build process group terminate, exit 75.
- Onno app ba native chat process-ke name/port diye kill kora hoy na.
- Eta polling watchdog, OS hard memory limit noy; sample-er majhe short spike possible.
- Initial typecheck/ratchet run-er measured peak 4997 MiB. Corrected ratchet + Bridge/UI run-er peak 3251 MiB. Additional regression/helpers run-er peak 241 MiB.
- Real allocating-child test-e budget exceed kore process terminate howa verify kora hoyeche.
- Full production build under this budget ekhono unverified. Direct unmanaged `npm run build` ei wrapper use kore na; managed updater ba `node nexa/build.mjs` use korte hobe.

## 6. Validation evidence

| Check | Result |
| --- | --- |
| Core typecheck | PASS |
| Full TypeScript ratchet | 5830 measured = 5830 existing baseline, no added errors |
| Bridge regression | 539 PASS, 0 fail |
| Bridge UI | 21 PASS, 0 fail |
| Related native/model/security tests | 114 PASS, 0 fail |
| Deploy/resource helper tests | 21 PASS, 0 fail |
| Overlay apply/restore | 95 files byte-identical |
| Patch check | 64/64 clean |
| Real account A request | Anthropic 429 |
| Real account B request | Anthropic 429 |
| Native 1m CLI probe | 35-second timeout; no success claim |

Full repository typecheck zero-error noy; existing 5830-error backlog baseline use kora hoyeche. Full production build, isolated real successful inference, post-promotion native test ba multi-session live success ei pass-e complete hoyni.

Evidence folder: `~/Documents/Codex/2026-10-02/omniroute-stability-2245/`

- `validation.log`: initial core typecheck and first ratchet result.
- `validation-final.log`: corrected ratchet, Bridge and UI passes.
- `focused-and-deploy-validation.log`: native/model/security and deployment-helper passes.
- `overlay-roundtrip.json`: byte-for-byte roundtrip result.
- `native-1m-probe.json`: timeout result.
- `cached-quota-off.png`: saved browser settings proof.

## 7. Storage cleanup

Exact checked obsolete generated paths remove kora hoyeche:

- `~/.omniroute-builds/3.8.51-43bc71075`
- `~/.omniroute-builds/runtime-backups/20261002-150336`
- `~/.omniroute-builds/smoke-20261002-211555`

Praye 2.7 GB generated files reclaimed. Current 0bda6c400 package, previous f002e7654 package, previous-runtime reference-er 20261002-211555 runtime, immediate desktop rollback backup retained. T7 original files/backups delete ba overwrite kora hoyni. Ei pass-e new full runtime backup ba production build create kora hoyni.

## 8. Remaining work and source ownership

Main checkout-e VS Code session-er ei unfinished changes intact ache:

- `open-sse/services/modelFamilyFallback.ts`
- `open-sse/services/toolLimitDetector.ts`
- `tests/unit/model-family-fallback-notation.test.ts`
- `tests/unit/nexa-claude-code-text-fidelity.test.ts`

Overlay commit integrate korar age ebong pore char-ti file-er SHA-256 same chhilo. Session-er useful intent review kore scoped fixes overlay-te rakha hoyeche; uncommitted originals discard kora hoyni. Generic tool limit arbitrary 10000 kora hoyni. Oi session source edit shesh koreche kina user-ke clarification dewa hoyeche. Dirty-tree guard ei files reconcile na howa porjonto updater-ke stop korbe.

Promotion-er age dorkar: source ownership reconcile, complete bounded build, artifact gate, available-quota Claude account diye isolated successful completion, tarpor production promotion + native request verification. Current smoke gate HTTP 200 ebong expected test reply require kore. 429 diye oi gate bypass kora hoyni.

Future OmniRoute/native app release-er 100% compatibility guarantee dewa jay na. Overlay preserve hoy, kintu new upstream changes-er sathe patch applicability, model protocol, streaming ebong native request test korte hobe. Native-er cheye better output quality-r benchmark ei review-te kora hoyni.

## 9. Primary references

- https://code.claude.com/docs/en/model-config
- https://code.claude.com/docs/en/llm-gateway
- https://support.claude.com/en/articles/11647753-how-do-usage-and-length-limits-work
- Local build requirement: `~/Developer/OmniRoute/nexa/skill/nexa-overlay/SKILL.md`

## 10. Final follow-up: source reconciled, full bounded build passed

Ei section ager sections-er pending source/build status update kore. Existing text evidence history hisebe rekhe sudhu ei section append kora holo.

- VS Code session-er last event 22:38 Asia/Dhaka-te API error chhilo; kono unmatched/pending tool call chhilo na. Source files 21:48-21:51-er por unchanged chhilo.
- Original three-file diff `recovered-vscode-work.patch`-e save ebong original new test `recovered-vscode-text-fidelity.test.ts`-e move kora hoyeche. Hashes ebong diff re-apply check successful. Main checkout abar clean/pristine; ei source blocker resolved.
- Initial 5 GiB heap production attempt OOM hoyechhilo, observed peak 5162 MiB. Direct 6 GiB retry shell-er Node 26 use kore OOM hoyechhilo. Ei failure-gulo live service-ke replace koreni.
- Revised profile: Node 24 `/usr/local/bin`, Node heap 6144 MiB, total RSS watchdog 8192 MiB, Next worker 1, Webpack module parallelism 8, compilation cache disabled, nice +10.
- Revised profile-e complete production build PASS, observed peak 6530 MiB (about 6.4 GiB). CLI/API packaging PASS, packaging peak 1094 MiB.
- Candidate archive: `~/.omniroute-builds/3.8.51-7a2186f62/omniroute-3.8.51.tgz`, about 95 MiB. Build SHA `7a2186f62`.
- Native package contract PASS for both this Webpack candidate and current Turbopack package. Validator now checks token-count headers/cancellation in either direct route code or its referenced chunks; missing header/cancellation tests still reject. Two new validator regression tests PASS.
- Isolated candidate installed and booted, then real Anthropic inference returned HTTP 429. Smoke overall FAIL at the provider-inference gate. Candidate production-e promote kora hoyni. No live restart or runtime replacement occurred.
- Latest source HEAD `048a59e1c`; candidate-er porer change sudhu validation/deployment tooling ebong documentation. Runtime source patches candidate `7a2186f62`-te ache.
- Extra evidence: `bounded-production-build-serial.log`, `package-validation.log`, `package-gate.json`, `package-gate-previous.json`, `isolated-package-smoke.log`, `source-reconciliation.json`.
- Current source already contains the updated build runner. Installed dashboard updater uses these managed tools. Settings-only changes-er jonno rebuild dorkar nei.

Final deployment gate remaining: available quota diye successful isolated Claude response, then production promotion and native/multi-session validation. Tritiyo account-e usable quota ache kina user-ke jiggesh kora hoyeche; kono new account ba paid overage automatically enable kora hoyni.

Official build references: https://webpack.js.org/configuration/other-options/#parallelism and https://nextjs.org/docs/app/guides/memory-usage

## 11. Completed-build cleanup and final runtime boundary

Completed owned worktree `bridge-build-20261002-232100` (including `.build`, `dist` and linked build dependencies) ebong completed isolated test prefix `smoke-20261002-233600` remove kora hoyeche. Candidate archive, full review logs, original-work recovery patch, current package ebong immediate rollback package/runtime preserve kora hoyeche. Cleanup-er exact receipt `completed-build-cleanup.json`-e ache. Final observed system free-memory percentage 65%, Data volume available praye 73 GiB. Ei value point-in-time; onno applications ebong swap-er karone bodlate pare.

Running service final check-e HTTP 200, build `0bda6c400`. Prepared candidate `7a2186f62` production-e promote hoyni. Main source checkout `048a59e1c` clean. Usable provider quota chara successful native response-er final acceptance complete kora jayni.

## 12. 2026-10-03 follow-up: promotion and native acceptance completed

Ei historical report-er ager blocked deployment status latest verified state noy. [HANDOFF-OMNIROUTE-2026-10-03-QUOTA-RECOVERY.md](HANDOFF-OMNIROUTE-2026-10-03-QUOTA-RECOVERY.md)-e final deployment, quota scheduling, tests ebong cleanup details ache.

Runtime/source `f77079418` production-e promote hoyeche; isolated real Claude response PASS-er pore promotion hoy. Actual native Claude Code CLI Opus `1m` ebong Sonnet concurrently successful; Desktop Code tab ebong existing failed `Hello` session-o successful. Managed Bridge gate 553 PASS; full type ratchet 5830 existing baseline unchanged. Ei production build-er observed peak 5730 MiB, 8192 MiB sampled cap-er moddhe.

Obsolete unpromoted `7a2186f62` archive, completed quota build worktree ebong smoke data checked cleanup-e remove hoyeche. Current f770 package ebong immediate 0bda rollback package/runtime retained. New quota fix `nexa/` overlay-te ache, installed runtime-only edit noy. Future weekly reset, new upstream release/native version ebong full Mac reboot-er verification scope new report-e explicitly separate kora ache.


<!-- handoff-consolidation-2026-10-03 -->

## Latest consolidated handoff: 2026-10-03

Puro setup, Agent Bridge connection/lifecycle fixes, Local coexistence/DNS, durable nexa overlay, quota recovery, coding/context configuration, build RAM/disk control, tests, update/rollback ebong remaining gaps ekshathe: [HANDOFF-OMNIROUTE-2026-10-03-CONSOLIDATED.md](HANDOFF-OMNIROUTE-2026-10-03-CONSOLIDATED.md).

Latest recorded deployment/source/runtime f77079418, OmniRoute 3.8.51; final native CLI Opus/Sonnet ebong Desktop Code response successful. Tar pore coding settings-er 14 checks, native Read/follow-up, large-context observation ebong TLS/DNS gate successful. Ei file-er earlier builds, pending promotion ba cached-quota OFF descriptions historical; latest policy cached exhausted-account skip ON, preflight OFF. Future reset live recovery, remaining Thread mismatch telemetry, full 24-hour soak/new reboot ebong every native feature ekhono separate scope.

Documentation consolidation-e earlier content preserve kora hoyeche; new build ba live service mutation hoyni. User-er 2026-10-03 rule onujayi other people's public repositories-e PR/issue action designated owner session-er; help findings/patch oss-contrib/inbox-e hand over korte hobe. Purono direct-PR workflow latest authorization noy.
