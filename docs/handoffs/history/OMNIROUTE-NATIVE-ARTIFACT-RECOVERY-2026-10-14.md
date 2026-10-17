> **ঐতিহাসিক নথি — public copy, ২০২৬-১০-১৭।** মূল ঘটনার তারিখ ও ফল এই নথির নিজস্ব সময়ের জন্য প্রযোজ্য; পরের সংযোজন থাকতে পারে। বর্তমান অবস্থা ও কাজের নিয়মের জন্য [বর্তমান handoff](../CURRENT-STATUS-2026-10-17.md) পড়ুন। Private reference ও identifier সরানো হয়েছে; স্থানীয় evidence এখানে অন্তর্ভুক্ত নেই। পুরোনো cleanup, build, deploy বা service command বর্তমান অনুমতি হিসেবে ব্যবহার করবেন না।

# Native Artifacts, thinking progress, Thread recovery ও GPT-6.1 Sol pricing

তারিখ: 2026-10-14। লেখক: Jillur Rahman।

বর্তমান অবস্থা: source ও regression tests প্রস্তুত; চূড়ান্ত validation, নতুন production build, real native QA ও deployment বাকি। চালু runtime `0c0d3b1d4`। বর্তমান source-কে deployed বা সম্পূর্ণ যাচাইকৃত বলা যাবে না।

## পর্যবেক্ষণ ও কারণের সীমা

সংশ্লিষ্ট native session-এর gateway log-এ প্রায় 600 সেকেন্ড পরে দুইটি content-stall failure পাওয়া গেছে। প্রতিবার কয়েকশ `content_block_delta` এসেছিল, কিন্তু usable output শনাক্ত হয়নি। পরবর্তী non-streaming fallback প্রায় 540 সেকেন্ড পরে বন্ধ হয়েছে। একই session-এ owning Thread অনুপস্থিত হওয়ার 404 এবং full replay-এর পরে সফল Artifact creation-ও পাওয়া গেছে।

পুরোনো request-এর raw SSE subtype payload রাখা ছিল না। তাই প্রত্যেক historical failure কেবল hidden thinking-এর জন্য হয়েছিল—এ দাবি প্রমাণিত নয়। তবে isolated regression-এ তিনটি নির্দিষ্ট implementation gap পুনরুৎপাদিত হয়েছে: hidden-thinking activity-কে content inactivity ধরা, `message_start`-এই Thread owner সংরক্ষণ, এবং native buffered fallback-এর headers deadline শেষ হওয়া। Artifact create ও read-এর প্রমাণ পাওয়া গেলেও পরবর্তী edit বা পুরো reconnect সমস্যার সমাধানের প্রমাণ পাওয়া যায়নি।

## সংরক্ষিত source পরিবর্তন

- First-party Anthropic stream-এ matching open thinking block-এর বৈধ `thinking_delta` ও `signature_delta` activity content inactivity window নবায়ন করে। Ping, lifecycle frame, অজানা block এবং closed block এই সুযোগ পায় না। Absolute active deadline, empty-completion guard ও client cancellation বজায় থাকে। `adaptive`, `enabled` ও `between_tools` mode রাখা হয়েছে; client configuration পাল্টানো হয় না।
- Thread owner কেবল completed response-এর পরে রাখা হয়। Interrupted/cancelled SSE owner তৈরি করে না। Upstream-confirmed missing বা mismatched Thread-এর recovery-তে নির্দিষ্ট session, message ও connection-এর owner সরিয়ে native `thread_not_found` দিয়ে full conversation replay চাওয়া হয়। Sparse continuation অন্য account/model-এ পাঠানো হয় না। Signature, quota বা model-not-found error-কে Thread error বানানো হয় না।
- Native Claude thinking-এর `stream:false` fallback-এ Bridge ভিতরে streaming request নেয় এবং সম্পূর্ণ response থেকে native JSON বানায়। Opaque thinking signatures, tool arguments, citations, compaction content, usage, diagnostics ও context-management metadata রাখা হয়। Partial tool JSON, open block, transport failure বা missing completion-কে HTTP 200 বলা হয় না। Buffer সর্বোচ্চ 32 MiB। সম্পূর্ণ native JSON upstream-ও গ্রহণযোগ্য।
- Backend active budget 21 মিনিট; native buffered Bridge budget 21.5 মিনিট; শুধু সংশ্লিষ্ট local native ingress-এর idle budget 22 মিনিট। ছোট `MITM_ROUTER_TIMEOUT_MS` override ছোটই থাকে। Bounded failure-এ `x-should-retry:false` দেওয়া হয়; real CLI এটি মানে কি না live QA-তে যাচাই বাকি। সাধারণ streaming এবং public TLS fallback-এর আচরণ বদলানোর উদ্দেশ্য নেই।
- Package gate নতুন helper-এর `src` ও `dist/src` bytes একই কি না পরীক্ষা করে। পুরোনো rollback package-এ নতুন helper থাকা বাধ্যতামূলক করা হয়নি।

## GPT-6.1 Sol cost display

Model catalog-এ routing থাকলেও default pricing row ছিল না। তাই retained token usage থাকা সত্ত্বেও estimate $0.00 হচ্ছিল।

[OpenAI model pricing](https://developers.openai.com/api/docs/models/gpt-6.1-sol)-এর 2026-10-14 তথ্য অনুযায়ী প্রতি 1M token-এ Standard input $2, cached input $0.10, cache writes $2.50 ও output $10। এক request-এর input 272K ছাড়ালে input/cache 2× এবং output 1.5×। Fast 2×, Ultrafast 6×, Flex 0.5×। Regional বা অন্য provider-specific charge-এর নতুন সমর্থন এই পরিবর্তনের অংশ নয়।

`cx`/`codex` base ও effort aliases এবং `openai` base pricing যোগ হয়েছে। Analytics, provider-window estimate ও legacy stats-এ long-context bucket প্রতিটি raw request থেকে নির্ধারিত হয়; অনেক ছোট request-এর যোগফল দিয়ে premium লাগানো হয় না। Stored historical rollup cost বজায় থাকে; পুরোনো rollup-এ request dimensions না থাকলে তার exact long-context cost পুনর্গঠনের দাবি করা যাবে না।

Subscription-এর billed-cost semantics বজায় থাকে। API-equivalent estimate কোনো subscription invoice, অতিরিক্ত charge বা weekly allowance মাপ নয়। Retained pricing baseline-এর নির্দিষ্ট cutoff-এ 19,951 rows / 17,134 successful requests এবং 8,497 successful long-context requests পাওয়া গেছে; independent estimate $1,583.4206430। এটি live চলমান মোটের স্থায়ী মান নয়। Cutoff ও token-dimension hash receipt-এ আছে; deployment-এর পরে একই cutoff-এর estimate তুলনা করতে হবে।

## প্রমাণ ও validation অবস্থা

Local evidence directory:

`~/Library/Caches/NexaLance/omniroute-native-artifacts-2026-10-14/`

| পরীক্ষা                                                                                        | অবস্থা                                                                        |
| ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Old-source regressions                                                                         | প্রথম batch-এ 5 failure; isolated native buffered TLS fixture-এ আরও 1 failure |
| Intermediate focused tests                                                                     | `focused-after-1.log`: 48/48 PASS, প্রায় 6.64 সেকেন্ড                         |
| Final buffer safety, metadata, `between_tools`, Thread replay ও SQL/context grouping additions | Source প্রস্তুত; শেষ পরিবর্তনের পরে চালানো হয়নি                               |
| Final native, analytics, deployment regressions; core typecheck; full ratchet; lint            | Resource admission-এর অপেক্ষায়                                                |
| নতুন full dashboard build / CLI generation / package / strict Bridge gate                      | হয়নি                                                                          |
| নতুন build-এ real Claude native Artifact create/edit/reopen ও CLI Artifact request             | হয়নি                                                                          |
| নতুন runtime promotion ও postdeploy retained-data comparison                                   | হয়নি                                                                          |

Intermediate test sequence-এ preflight disk check ব্যর্থ হওয়ার পর shell sequence পরবর্তী ছোট batch চালিয়ে ফেলেছিল। Batch শেষ হয়েছে; আর test চলছে না। `resource-admission-audit.json`-এ ঘটনা রাখা হয়েছে। Final validation এবং build অবশ্যই একই fail-closed bounded runner-এর অধীনে চালাতে হবে; failed admission-এর পরে পৃথক shell command চালিয়ে যাওয়া যাবে না।

## Resource ও release continuation

সর্বশেষ ব্যবহারকারীর নির্দেশ: **apps চালু রাখুন; source প্রস্তুত করে অপেক্ষা করুন**। পুরোনো app-quit অনুমতি এখন প্রযোজ্য নয়। কোনো app, browser tab, session, render বা unrelated service বন্ধ করা যাবে না।

নতুন কাজ শুরুর আগে memory pressure, free+inactive+speculative physical headroom, swap, internal disk এবং Blender/render/batch পরীক্ষা করতে হবে। Full build-এর conservative total RSS cap 8 GiB; এর বাইরে 10 GiB reserve ও internal disk-এ অন্তত 20 GiB প্রয়োজন। চলার সময় pressure warning/critical, headroom <8 GiB, swap growth >1 GiB বা disk <15 GiB হলে শুধু নিজের heavy job নিরাপদে থামবে। Unchanged waiting অবস্থায় notification নয়।

Source worktree:

`~/Developer/OmniRoute/.claude/worktrees/native-artifact-recovery-2026-10-14`

Branch: `fix/native-artifact-recovery-2026-10-14`। সব customization `nexa/`-তে export করে `upstream-main` base pristine রাখতে হবে। Normal commit hooks ব্যবহার হবে; `--no-verify` বা stash নয়। Source প্রস্তুত থাকা commit/build/deployment প্রমাণ নয়। Main worktree বা অন্য session-এর source পরিবর্তন করা যাবে না।

Release-এর আগে বর্তমান overlay inventory/hash ও final gate receipt মিলতে হবে। সফল পুরোনো `.tgz`, `.build/dist`, source, database ও rollback অক্ষত থাকবে। নতুন source-এর জন্য নতুন immutable artifact directory লাগবে। Desktop build/deploy flags 0 থাকবে। Verified নতুন package দিয়ে resource-bounded main updater-এর `NEXA_DEPLOY_ARTIFACT` redeploy হবে; পুরোনো artifact-কে এই fix-এর build বলা যাবে না।

Updated `nexa/deploy/native-ingress.mjs` package promotion-এর সঙ্গে আলাদাভাবে installed copy-তে নিতে হবে; `install-native-ingress.sh`-এর backup ও launchd behavior আগে review করতে হবে। শুধু runtime package বদলালে পুরোনো ingress idle deadline থেকে যাবে। Service reload-এর আগে সংশ্লিষ্ট active request drain ও rollback path যাচাই প্রয়োজন।

Real QA matrix: native app ও normal Claude Code session থেকে ছোট Artifact create → read/edit → follow-up → reopen; thinking progress; recoverable Thread full replay; ordinary tools ও একটি read-only connector; approved GPT/GLM/Claude route-switch regression। Existing user session, mapping বা official app/config edit করা যাবে না। প্রয়োজনীয় পরিবর্তিত test mapping snapshot নিয়ে restore করতে হবে। Native app UI না দেখে UI success বলা যাবে না।

Deployment-এর আগে consistent database snapshot, complete previous runtime preservation ও operator-state inventory; পরে runtime SHA, health, native Bridge TLS, retained provider/API-key ID sets, usage continuity এবং cutoff-matched pricing comparison লাগবে। Private optimizer repository-তে sync হবে final verified overlay; public OSS push/PR নয়।

## Protocol references

- [Anthropic thinking display ও signatures](https://platform.claude.com/docs/en/build-with-claude/thinking)
- [Anthropic context editing metadata](https://platform.claude.com/docs/en/build-with-claude/context-editing)
- [OpenAI GPT-6.1 Sol model ও pricing](https://developers.openai.com/api/docs/models/gpt-6.1-sol)

এই নথির source/test অবস্থা নতুন evidence হলে append করতে হবে; পুরোনো evidence overwrite করা যাবে না।

## Source প্রস্তুতির অতিরিক্ত নোট

Strict patch check-এ পূর্বের `scripts/dev/run-standalone.mjs` patch-এর context mismatch পাওয়া যায়। একই public-bind security guard রেখে patch-টি বর্তমান pristine base থেকে পুনরায় কাটা হয়েছে। পুরোনো patch, pristine bytes, নতুন applied bytes ও hash receipt `launcher-patch-recut/` evidence directory-তে রাখা আছে। Upstream source বা live launcher পাল্টানো হয়নি। এই structural check application regression test-এর বিকল্প নয়।


## Source প্রস্তুতির receipt

- Source inventory SHA-256: `cdc08f33f684654a29eeff1fb6e249102e1942830e3c2d462621ef9968460ad0`
- 329টি overlay file inventory-তে আছে; 157/157 patch বর্তমান pristine base-এ strict apply check PASS। এটি application validation নয়।
- Main checkout clean; production `0c0d3b1d4`। নতুন source commit হয়নি।
- Receipt: `~/Library/Caches/NexaLance/omniroute-native-artifacts-2026-10-14/source-prepared.json`
- Latest instruction: apps চালু রেখে অপেক্ষা। Full validation, build, deploy ও নতুন real native QA বাকি।


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
