> **ঐতিহাসিক নথি — public copy, ২০২৬-১০-১৭।** মূল ঘটনার তারিখ ও ফল এই নথির নিজস্ব সময়ের জন্য প্রযোজ্য; পরের সংযোজন থাকতে পারে। বর্তমান অবস্থা ও কাজের নিয়মের জন্য [বর্তমান handoff](../CURRENT-STATUS-2026-10-17.md) পড়ুন। Private reference ও identifier সরানো হয়েছে; স্থানীয় evidence এখানে অন্তর্ভুক্ত নেই। পুরোনো cleanup, build, deploy বা service command বর্তমান অনুমতি হিসেবে ব্যবহার করবেন না।

<!-- handoff-current-state-2026-10-06 -->
# সর্বশেষ হ্যান্ডঅফ: 2026-10-06

রক্ষণাবেক্ষণ: Jillur Rahman / NexaLance। Documentation update: 2026-10-06, Asia/Dhaka।

পরের session এখান থেকে শুরু করবে। মূল source-এর clean `nexalance` branch এখন `a3571d5b29bf53e5fb4b23cbe43269596eb31122`। Quota fallback ও Cost Analyzer-এর সঙ্গে local updater-এর Desktop-preservation policy সংরক্ষিত হয়েছে। **নতুন package তৈরি বা live deploy হয়নি।** Installed runtime-এর `dist/BUILD_SHA` এখনও `79412f0ec`, OmniRoute `3.8.51`। নিজের isolated worktree `deploy-resource-safety-2026-10-06`-এ APPLIED source ও compiler cache retained; main checkout pristine।

সর্বশেষ deployment প্রস্তুতি এই file-এর [বিকেলের সংযোজন](#deployment-preparation-2026-10-06) ও নতুন receipt (স্থানীয় বা private reference; প্রকাশিত নয়)-এ আছে। আগের [2026-10-06 সংযোজন](#handoff-2026-10-06), [বাংলা report](OMNIROUTE-CLAUDE-QUOTA-AND-CLEANUP-2026-10-06.md) ও 761-test receipt (স্থানীয় বা private reference; প্রকাশিত নয়) retained। সকাল 10:52-এর quota/resource evidence এবং বিকেলের fresh snapshot আলাদা। নতুন runtime promotion, inference acceptance বা service restart এই deployment attempt-এ হয়নি।

| বিষয় | সর্বশেষ সংরক্ষিত ফল |
| --- | --- |
| False cached exhaustion | Usable account-এ upstream 502/520 হওয়ার পরে request-level exclusion-কে whole-pool exhaustion ধরা বন্ধ করার source fix |
| একাধিক account | 2, 3 ও 5 distinct account-এর 17টি regression case পাস; বিকেলের fresh database read-এ তিন active account, একটি account-এর session allowance 99% |
| Local usage policy | Cached quota filtering ON, per-request preflight OFF, cutoff 0; current key-তে local USD/token/request/session cap নেই |
| Cost Analyzer | Current-key বনাম old-key filter ব্যাখ্যা; source-এ visible polling, Refresh, stale-result protection ও unsaved-edit preservation |
| QA | সকাল a15864e12-এর 761 test execution/core/Cost lint পাস; নতুন a3571d5b2 policy/gate-এর 15 targeted execution পাস, যার 6টি নতুন policy case |
| বাকি release gate | পূর্ণ measured TypeScript ratchet, production package, packaged dashboard gate, isolated smoke, promotion, নতুন package-এর native/restart acceptance |
| Cleanup ও recovery | আগের checkout cleanup-এর পরে আরও তিন obsolete runtime/smoke copy hash-verified external archive; removal interval-এ 3.37 GiB recovered; current/previous package ও immediate rollback retained |

User-এর নির্দেশ: সব apps খোলা থাকবে; কোনো app/tabs বন্ধ করে room তৈরি নয়। কম RAM-এ cache-reusing full TypeScript attempt-এ `tscErrors=SKIP reason=tsc-signal-SIGABRT`, exit 75 হয়েছে; পূর্ণ measurement নয়। Latest saved resource snapshot-এ pressure normal হলেও physical headroom প্রায় 9.70 GiB, internal free প্রায় 23.19 GiB। Default candidate-এর 10 GiB reserve + 8 GiB process budget = 18 GiB headroom এবং updater-এর 24 GiB disk দরকার। Guard বা measurement বাদ দিয়ে promotion অনুমোদিত নয়। Provider-এর সত্যিকারের exhaustion বা throughput error local unlimited configuration দিয়ে সরানো যায় না।

পুরোনো recovery note-এর diagnosis-time `Cached quota filtering OFF` শেষ setting নয়; final setting ON। নতুন source restore-এর জন্য [2026-10-06 recovery guide](backup/omniroute-worktrees-2026-10-06-092216/RESTORE-QUOTA-COST-UPDATE-2026-10-06.md) পড়তে হবে। নিচের পুরোনো build, quota, free-space ও test ফল তাদের নিজস্ব তারিখের ইতিহাস।

## সম্পূর্ণ কাজের document index

এই index-এ আগের বিস্তারিত report ও পরীক্ষার reference একত্র করা হয়েছে। প্রতিটি report-এর তারিখ ও acceptance boundary অনুযায়ী ফল পড়তে হবে; image experiment বা পুরোনো package-এর সফলতা নতুন source-এর production acceptance নয়।

| কাজ | বিস্তারিত document |
| --- | --- |
| Agent Bridge স্থায়ী startup, update ও recovery | [Durability handoff](AGENT-BRIDGE-DURABILITY-HANDOFF-2026-10-02.md) |
| Native transport ও পূর্ণ QA | [Full QA handoff](AGENT-BRIDGE-FULL-QA-HANDOFF-2026-10-02.md) |
| Local by Flywheel coexistence ও DNS | [Coexistence handoff](AGENT-BRIDGE-LOCAL-COEXISTENCE-DNS-HANDOFF-2026-10-02.md), [DNS recovery verification](AGENT-BRIDGE-NATIVE-DNS-RECOVERY-VERIFIED-2026-10-02.md) |
| Native quality ও build budget | [Quality/build handoff](HANDOFF-OMNIROUTE-2026-10-02-NATIVE-QUALITY-AND-BUILD-BUDGET.md) |
| Coding quality, context ও configuration | [Coding-quality handoff](HANDOFF-OMNIROUTE-2026-10-03-CODING-QUALITY.md) |
| Quota scheduling ও recovery | [প্রথম recovery handoff](HANDOFF-OMNIROUTE-2026-10-03-QUOTA-RECOVERY.md), [deployed correction ও acceptance](HANDOFF-OMNIROUTE-2026-10-04-CLAUDE-QUOTA-RECOVERY.md) |
| Multi-account fallback, Cost Analyzer, resource guard ও cleanup | [2026-10-06 বাংলা report](OMNIROUTE-CLAUDE-QUOTA-AND-CLEANUP-2026-10-06.md) |
| Fable usage তদন্ত | [Fable investigation](REPORT-FABLE-USAGE-INVESTIGATION-2026-10-05.md); পরবর্তী সীমিত log check নিচের 2026-10-06 সংযোজনে |
| GPT 6.1 Sol support | [Model-support report](OMNIROUTE-GPT-6.1-SOL-SUPPORT-2026-10-04.md) |
| OmniRoute key দিয়ে Codex image generation | [প্রথম experiment](OMNIROUTE-CODEX-IMAGEGEN-EXPERIMENT-2026-10-03.md), [model matrix, image examples ও research](OMNIROUTE-IMAGE-GENERATION-COMPLETE-RESEARCH-2026-10-03.md) |
| Antigravity / agy image generation | [Provider research ও results](OMNIROUTE-ANTIGRAVITY-AGY-IMAGE-GENERATION-RESEARCH-2026-10-03.md) |
| পূর্ববর্তী consolidated setup | [2026-10-03 consolidated handoff](HANDOFF-OMNIROUTE-2026-10-03-CONSOLIDATED.md) |

---

<!-- handoff-current-state-2026-10-04 -->
# 2026-10-04-এর verified setup ও complete solution: ইতিহাস

Owner: Jillur Rahman / NexaLance. Documentation updated: 2026-10-04T21:34:37+06:00.

Latest accepted production state: OmniRoute `3.8.51`, source/build `79412f0ec61a9d000862705e5c57b75f26181313`. Available Claude account-er critical warning-ke actual quota exhaustion dhorar false 429 bug fixed ebong deployed. Extra local usage caps OFF, Claude cutoffs `0%`, actual depleted-account scheduling ebong healthy-account fallback retained.

Puro solution ei file-er [section 14](#14-complete-solution-2026-10-04)-e ache: root cause, exact settings, `nexa/` overlay files/commits, bounded full-dashboard build, parallel/native CLI/Desktop tests, service restart, GPT 6.1 Sol live tests, package hash, backups, cleanup ebong update/rollback rules.

Detailed standalone report: [2026-10-04 Claude quota recovery handoff](HANDOFF-OMNIROUTE-2026-10-04-CLAUDE-QUOTA-RECOVERY.md). Consolidated entry point: [complete setup handoff](HANDOFF-OMNIROUTE-2026-10-03-CONSOLIDATED.md).

Evidence accepted 2026-10-04; ei documentation update-te notun build, inference, service restart ba live configuration change kora hoyni. Nicher 2026-10-02/03 state, package path, open-item ebong test sections historical. Current state-er jonno section 14 ebong latest dated receipts use korte hobe. Purono public PR workflow current action authorization noy; designated contribution-owner rule unchanged.

---

# Final production overlay সংযোজন: ২০২৬-১০-০২

লেখক: Jillur Rahman<br>
Source documentation/QA commit: `986ba64e8`। Deployed application code: `f002e7654`, OmniRoute `3.8.51`। শেষ source commits-এ documentation, QA tooling এবং আগে চালু থাকা support source সংরক্ষিত হয়েছে; application executable বা live configuration পরিবর্তন করা হয়নি।

সব application fixes `nexa/`-এর ৫৩টি build-time patch ও ২৮টি copied new file-এ আছে; manual runtime-only fix বাকি নেই। Source pristine; patch applicability ও deployed archive/live TLS checks পাস। পূর্ণ report, test record ও পুনরায় parallel QA script repository-তে versioned হয়েছে। নতুন script-এর চার simultaneous session, চার context resume, এক cancellation ও তিন surviving stream মিলিয়ে ১২/১২ case সফল। Native settings/account অপরিবর্তিত।

Current runtime package: `~/.omniroute-builds/3.8.51-f002e7654/omniroute-3.8.51.tgz`। Rollback prefix ও matching database backup stamp: `20261002-150336`। Managed update-এর source `~/Developer/OmniRoute/nexa/deploy/`; installed `omni-ctl` বা dashboard Update ব্যবহার করতে হবে। নিচের পুরোনো setup history-তে portable scripts/stock npm rollback লেখা থাকলেও সেগুলো final update path নয়।

OmniRoute-এর নতুন release-এ patch/test/package/isolated/live gates fail হলে candidate গ্রহণ নয়; working runtime অক্ষত রাখা এবং প্রয়োজনে matching prefix/database restore করতে হবে। Native app update vendor-এর স্বাভাবিক পথে হয়; OmniRoute সেটি আটকে দেয় না। নতুন native version-এ model/effort, tool headers/count, streaming, parallel/resume/cancellation ও Desktop Agent acceptance আবার চালাতে হবে। সব ভবিষ্যৎ version-এ zero-error quality parity নিশ্চয়তা নেই।

Final model matrix ১২/১৩ এবং model/effort/count matrix ২৩/২৪: Sonnet 4.5 current pool availability/quota exception খোলা। Final two-account rotation প্রমাণ হয়নি; তৃতীয় OAuth account, scheduled/cloud Routine এবং সব Chat/Cowork feature এখনও পৃথক acceptance scope। এই সীমাগুলো বাদ দিয়ে complete/100% parity দাবি করা যাবে না।

Versioned references:

- `nexa/docs/AGENT-BRIDGE-PRODUCTION-HANDOFF-2026-10-02.md`: পূর্ণ বাংলা fixing/QA/analysis।
- `nexa/qa/production-acceptance-2026-10-02.json`: credential ছাড়া frozen code/package/test record।
- `nexa/qa/native-concurrency.mjs`: পুনরায় real native concurrency QA; prerequisites `nexa/qa/README.md`।
- `nexa/deploy/README.md`: managed update ও rollback gates।

আগের handoff-গুলোর অপরিবর্তিত backup: `~/Documents/Codex/2026-10-02/agent-bridge-final-overlay`-এর `.before-update` files। পুরোনো T7 patch মুছে বা overwrite করা হয়নি; final cumulative patch NEXA-AGENT-BRIDGE-PRODUCTION-OVERLAY-FINAL-2026-10-02.patch এবং final test record AGENT-BRIDGE-PRODUCTION-ACCEPTANCE-FINAL-2026-10-02.json আলাদা file-এ রাখা হয়েছে।

---

# Agent Bridge: পূর্ণ QA ও স্থায়ী setup handoff

লেখক: Jillur Rahman<br>
তারিখ: ২০২৬-১০-০২, Asia/Dhaka<br>
এটি আগের handoff-গুলোর পরবর্তী যাচাইকৃত সংযোজন। Final consolidation-এ T7-এর মূল handoff ও QA documents backup রেখে আপডেট করা হয়েছে; প্রথম setup-এর তথ্য ইতিহাস হিসেবে সংরক্ষিত।

## ১. যাচাইকৃত বর্তমান ফলাফল

OmniRoute Agent Bridge-এর বর্তমান native Claude Code workflow production runtime-এ পরীক্ষা করে ঠিক করা হয়েছে। Final build-এ ১৩টি configured model-এর ১২টিতে পূর্ণ native CLI request সফল। Sonnet 4.5-এর normal pool request সফল হয়নি: একটি connection-কে upstream usage API active-critical weekly limit দেখাচ্ছে, অন্য connection exact model-এ 404 দিচ্ছে। এই exception সমাধান হয়েছে বলা যাবে না। আগে একই model সফল হয়েছিল; quota/availability সময়ের সঙ্গে বদলেছে। একসঙ্গে চারটি পৃথক conversation, তাদের নিজস্ব context resume এবং একটি streaming request বাতিল করার পর বাকি তিনটি stream সম্পন্ন হওয়ার পরীক্ষা সফল। এই ফল নির্দিষ্ট বর্তমান build ও account/provider অবস্থার প্রমাণ; ভবিষ্যৎ app, provider বা model-এর সব পরিবর্তন সফল হবে এমন নিশ্চয়তা নয়।

বর্তমান runtime: OmniRoute `3.8.51`, compiled `BUILD_SHA=f002e7654`; production Node `24.15.0`; native Claude Code `2.1.287`। Runtime code এবং overlay fix worktree-এর tested commit `f002e7654`। Production source branch `nexalance`-এ তার পরে documentation/QA tooling commits আছে; সেগুলো executable code পরিবর্তন করে না। Generic upstream branch `fix/native-agent-bridge-transport`-এর tested commit `ef90346e2`।

## ২. আমরা configuration-এর বাইরে code পরিবর্তন করেছি কি?

হ্যাঁ। শুধু dashboard option বদলালে boot routing, lifecycle, streaming এবং legacy model compatibility-এর সমস্যাগুলো ঠিক হতো না। Generic fixes OmniRoute-এর manager/server/provider executor/cache constraints-এ করা হয়েছে; স্থানীয় customization ও durability `nexa/` overlay/build/deploy স্তরে রাখা হয়েছে। এই QA-তে native Claude app binary, native login, persistent Claude settings, OS hosts বা certificate trust বদলানো হয়নি। UI পরীক্ষা নিজের নতুন No folder Code session-এ হয়েছে; verification view-এর জন্য sidebar collapse করা হয়েছে। আগে অনুমোদিত localhost ingress, CA এবং hosts routing আগের মতো আছে।

সব repository commit-এর author এবং committer Jillur Rahman। স্বাভাবিক commit hooks চালানো হয়েছে; hooks bypass করা হয়নি। Applied overlay-এর source commit করা হয়নি; build/pack শেষে worktree pristine অবস্থায় ফিরেছে।

## ৩. মূল সমস্যা ও সমাধান

| সমস্যা                                                        | সংশোধন ও ফল                                                                                                                                                                                                                                |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Restart-এর পরে `api.anthropic.com: ECONNREFUSED`              | পূর্বে installed localhost ingress boot helper `443` গ্রহণ করে enabled Bridge-এর `8443`-এ পাঠায়। Bridge off থাকলে original vendor TLS fallback থাকে। বর্তমান helper অপরিবর্তিত; bootstrap race ও routing regression tests পাস।             |
| `8443 already in use`, PID state হারানো বা duplicate listener | shared process state, exact owned Node executable/server path যাচাই, ready marker পাওয়া পর্যন্ত Start সফল না দেখানো এবং প্রকৃত process exit-এর জন্য অপেক্ষা। পাঁচটি concurrent duplicate Start request পুরোনো listener/PID বদলায়নি।        |
| চলমান response হঠাৎ বিচ্ছিন্ন বা JSON মিশে যাওয়া              | raw bytes এবং backpressure অক্ষুণ্ণ রাখা; inspector decoding মূল stream পরিবর্তন করে না; SSE শুরু হয়ে গেলে foreign JSON error append করা বন্ধ।                                                                                             |
| upstream disconnect/cancellation-এ পুরো Bridge দুর্বল হওয়া    | প্রতি-request error/abort cleanup, response/request destroy এবং listener অক্ষত রাখা। ইচ্ছাকৃত upstream DNS failure-এ sanitized `502` এসেছে, listener/PID টিকে ছিল।                                                                         |
| token count generation endpoint-এ চলে যাওয়া                   | `/v1/messages/count_tokens` ও query অপরিবর্তিত রেখে provider count endpoint-এ পাঠানো। Provider-sourced count যাচাইকৃত।                                                                                                                     |
| legacy Claude 4.5-এ unsupported adaptive thinking             | legacy model-এ adaptive injection/manual-to-adaptive remap বন্ধ; আধুনিক model-এর নিয়ম আগের মতো রাখা।                                                                                                                                       |
| native Opus 4.5-এ long-context entitlement error              | supported model-এর eligibility যাচাই এবং client beta negotiation সম্মান করা। অযোগ্য legacy model-এ `context-1m` আর জোর করে যোগ হয় না। পূর্ণ CLI test-এ এই bug ধরা পড়েছিল; minimal API smoke যথেষ্ট ছিল না।                                 |
| native thread/cache marker conflict                           | Thread request-এ server-এর জন্য এক slot reserve করে client marker সর্বোচ্চ তিনটি; final wire serialization-এর আগে limit enforce এবং tool markers-ও budget-এ count করা। অতিরিক্ত marker-এর `400` retry ঠেকানোর regression ও live proof আছে। |
| Inline tool ও Advisor protocol header হারানো                  | native first-party client-এর negotiated beta অক্ষুণ্ণ রাখা; model/context/skills eligibility gates বহাল। Token-count route-এও একই headers ও cancellation পৌঁছায়; original client credentials provider-এ পাঠানো হয় না।                      |
| update-এ installed fix হারিয়ে যাওয়া                           | durable overlay, বাধ্যতামূলক regression suite, archive/source-dist verification, isolated smoke, live TLS gate এবং পূর্ণ runtime/database rollback পথ।                                                                                     |

Archive gate-এর প্রথম candidate token-count source path package-এ না থাকায় reject হয়েছিল। Gate compiled route ও তার header/cancellation contract যাচাইয়ে সংশোধন করা হয়েছে; live runtime ঐ rejected candidate দিয়ে বদলানো হয়নি। Body-dependent header eligibility-ও count path-এ পৌঁছায়। Rejected archive রাখা হয়েছে, final verified archive আলাদা SHA-তে।

## ৪. পূর্ণ test evidence

| যাচাই                                                    | ফল                                                                               |
| -------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Production Bridge Node suite                             | ৫২৮/৫২৮ পাস; fail/skip শূন্য                                                     |
| Bridge UI component suite                                | ২১/২১ পাস                                                                        |
| Generic upstream targeted regression suite               | ৮৯/৮৯ পাস                                                                        |
| Ingress/bootstrap/storage/owned-stop tests               | ১৫/১৫ পাস                                                                        |
| Core typecheck                                           | পাস                                                                              |
| Full repository TypeScript ratchet                       | measured ৫৮৩০ / baseline ৫৮৩০; নতুন error যোগ হয়নি; পুরো repo error-free দাবি নয় |
| Production build ও package policy                        | পাস; compiled SHA এবং packaged source/dist Bridge contract যাচাইকৃত              |
| Managed isolated package install/smoke/deploy            | সফল                                                                              |
| Final native CLI model matrix                            | ১২/১৩ পাস; Sonnet 4.5 quota/availability blocked                                 |
| Final API models/modern efforts/count matrix             | 23/24 পাস; একই Sonnet 4.5 availability exception                                 |
| চার concurrent session + চার context resume              | সব সফল; অন্য conversation-এর marker reply-তে মেশেনি                              |
| এক stream বাতিল + তিন concurrent surviving stream        | সফল; listener PID অক্ষত                                                          |
| Native inline/Advisor token counting                     | provider-sourced count; estimate fallback নয়                                     |
| Actual native CLI Agent tools                            | দুই Agent call সফল; synthetic ফল 99 ও 89 যাচাই                                   |
| Native Desktop parallel Agents                           | app-এ Ran 2 agents, received 2 messages; ফল 99/89 এবং exact marker সফল           |
| Managed update final recheck                             | latest verified build no-op; archive/live TLS gates সফল; service restart হয়নি    |
| Native tool Read/Write, streaming, resume, parallel pair | সফল; শুধু private synthetic workspace ব্যবহার হয়েছে                              |
| Bridge Stop/Start                                        | তিন cycle সফল; explicit Stop recovery timer-এ নিজে চালু হয়নি                     |
| Configuration/database                                   | fingerprint অপরিবর্তিত; SQLite integrity `ok`                                    |

উপরের overlapping suites যোগ করে আলাদা মোট test সংখ্যা দাবি করা যাবে না। Raw private evidence: `~/Documents/Codex/2026-10-02/agent-bridge-full-qa-1300`। Tests real requests ব্যবহার করেছে; account quota কিছু খরচ হয়েছে।

## ৫. Native CLI-তে সব configured model

| Model ID                     | Final result                                                |
| ---------------------------- | ----------------------------------------------------------- |
| `claude-fable-5`             | final native CLI সফল                                        |
| `claude-fable-5-1`           | final native CLI সফল                                        |
| `claude-haiku-4-5-20251001`  | final native CLI সফল                                        |
| `claude-opus-4-5-20251101`   | final native CLI সফল                                        |
| `claude-opus-4-6`            | final native CLI সফল                                        |
| `claude-opus-4-7`            | final native CLI সফল                                        |
| `claude-opus-4-8`            | final native CLI সফল                                        |
| `claude-opus-5`              | final native CLI সফল                                        |
| `claude-opus-5-5`            | final native CLI সফল                                        |
| `claude-sonnet-4-5-20250929` | বর্তমান pool-এ quota/availability blocked; final CLI সফল নয় |
| `claude-sonnet-4-6`          | final native CLI সফল                                        |
| `claude-sonnet-5`            | final native CLI সফল                                        |
| `claude-sonnet-5-5`          | final native CLI সফল                                        |

Model alias `sonnet`/`opus`, latest Sonnet ও Opus-এর `low`, `medium`, `high`, `xhigh`, `max` effort options-ও যাচাই হয়েছে। Legacy model-এর সব effort combination এই দাবির অংশ নয়। API matrix-এ requested model ID এবং returned ID মিলেছে; fallback দিয়ে অন্য model-এর success দেখানো হয়নি।

## ৬. একাধিক chat, session ও account

চারটি পৃথক session একসঙ্গে latest Sonnet, latest Opus, Sonnet 4.6 এবং Opus 4.5 দিয়ে চালানো হয়েছে। প্রত্যেকটির আলাদা private marker ও session ID ছিল। সব stream শেষ হয়েছে; চারটির resume নিজস্ব marker ফিরিয়েছে। পরে একটি বড় stream partial content আসার পরে বাতিল করে অন্য তিনটি concurrent stream সম্পন্ন করা হয়েছে; Bridge PID বদলায়নি।

দুটি active Claude OAuth connection আছে। আগের candidate-এ দুই পৃথক provider connection দিয়ে একই conversation resume ও context বজায় থাকা verified হয়েছিল। Final build-এর continuity retest-এ উভয় turn সফল ও native thread বজায় ছিল, কিন্তু provider logs অনুযায়ী quota-eligible একই connection বেছে নেওয়া হয়েছে। তাই final অবস্থায় দুই-account rotation সফল হয়েছে দাবি নয়। এই test-এ child process-এ অস্থায়ী request header দেওয়া হয়েছিল; persistent native settings বদলানো হয়নি। তৃতীয় Claude account এই pool-এ এখনও configured নয়। প্রথম synthetic “private marker” পরীক্ষায় দুই legacy model instruction প্রত্যাখ্যান করেছিল; transport সম্পূর্ণ হয়েছিল। সাধারণ project name দিয়ে পরীক্ষা পুনরায় করা হয়েছে। প্রথম cancellation fixture দীর্ঘ thinking শেষ হওয়া পর্যন্ত অপেক্ষা করছিল; final fixture partial stream content পাওয়া মাত্র ওই test client বন্ধ করে। পুরোনো পরীক্ষার ব্যর্থ assertions evidence-এ সংরক্ষিত।

Final pool-এ Sonnet 4.5-এর exact request ব্যর্থ হয়েছে। অন্য connection-এ direct diagnostic request 200 হলেও তার live usage payload-এ weekly_all is_active=true, severity=critical; percent=92। Normal OmniRoute routing এই upstream explicit blocking state সম্মান করে। Eligible অন্য connection exact model-এ 404 দেয়। Manual usage refresh-এর পরেও সেই active-critical state ছিল; stale cache বলে ধরে নেওয়া ঠিক নয়। Quota guard বা paid extra-usage policy বদলানো হয়নি; model বদলেও সফল দেখানো হয়নি। এই account/model availability exception এখনও খোলা। Automatic quota exhaustion/rotation-এর সব পরিস্থিতির stress test বা unlimited concurrency-এর নিশ্চয়তা দেওয়া হয়নি।

Native GUI-তে আগে response সফল দেখালেও logs-এ inline tool এবং Advisor header বাদ পড়ার কারণে `400` ও retry দেখা গিয়েছিল। এই failure evidence রাখা হয়েছে। Final protocol fix-এর পরে নতুন native GUI turn, app-এর প্রকৃত দুই parallel Agent এবং synthetic tool-count requests আলাদা করে যাচাই করা হয়েছে; corresponding GUI requests সব 200 ছিল। UI success একা যথেষ্ট evidence হিসেবে ধরা হয়নি। প্রথম inline-count synthetic fixture-এ tool block-এর role/order ভুল ছিল; direct provider 400 দিয়ে তা শনাক্ত করেছে। User message-এর পরে system tool-addition message দিয়ে সংশোধিত valid fixture provider-sourced count দিয়েছে। এটি fixture correction, নতুন runtime patch নয়।

## ৭. Original Claude app/account সংরক্ষণ

`claude auth status`: logged in, `claude.ai`, `firstParty`, `max`। Original Claude app-এর deep/strict code signature verification সফল। Native account/history/projects/user workspace মুছে বা migrate করা হয়নি। Test-এর Read/Write শুধু private synthetic files-এ চালানো হয়েছে।

Provider pool বদলানো আর native app-এর account বদলানো আলাদা বিষয়। Native cloud UI/entitlements original login account-এর ওপর থাকতে পারে। একটি স্থানীয় model request সফল হওয়া থেকে Chat, Cowork, সব integration বা সব cloud feature-এর parity প্রমাণ হয় না।

## ৮. Start/Stop ও ports

- OmniRoute service: `127.0.0.1:28128`।
- Agent Bridge: `8443`, selected target `claude-code`।
- Existing root-owned ingress: localhost `443`। SNI `api.anthropic.com`-এর traffic Claude route-এ যায়; অন্য hostname-কে সেই route-এ পাঠায় না।
- Start readiness ও verified TLS-এর পরে active হয়। Stop explicit intent সংরক্ষণ করে।
- Stop-এ `443` helper original vendor TLS-এ fallback করে; default account-এর quota/entitlement আবার প্রযোজ্য। Default inference exhausted account-এ সফল হবে এমন দাবি নয়।
- Start/Stop/deploy চলমান request শেষ করে দিতে পারে। Native app তা stream interruption হিসেবে দেখাতে পারে; update বা restart শান্ত সময়ে করা উচিত।

## ৯. Update durability: সঠিক পথ

Managed dashboard Update বা `omni-ctl update` ব্যবহার করতে হবে। Unmanaged global npm replacement এই tested durability path নয়। Update-triggered workflow-তে overlay applicability, core typecheck, ingress/helper tests, TypeScript ratchet, full Bridge regression, security/inspector tests, production build এবং package policy বাধ্যতামূলক।

Archive gate packaged Bridge source ও dist-এর মিল, lifecycle/readiness/ownership, streaming/error isolation, count endpoint, legacy thinking/context eligibility এবং compiled inspector route যাচাই করে। New package আগে isolated runtime-এ install ও authenticated smoke/inference দিয়ে পরীক্ষা হয়। তারপর consistent SQLite snapshot এবং পূর্ণ installed prefix backup করে promote হয়। Live service health ও `443/8443` TLS ব্যর্থ হলে পূর্ণ পূর্বের runtime/database ফেরানোর পথ আছে।

প্রথম final isolated smoke-এ model catalog 503 হয়েছিল; candidate live-এ promote হয়নি। Same candidate diagnostic পুনরায় catalog/auth/inference/CORS পাস করেছে, তারপর fresh isolated install-সহ managed redeploy সফল হয়েছে। Initial failure log ও rejected candidate retained। Cold catalog startup timeout source-এ আছে, তবে প্রথম 503-এর response body capture না হওয়ায় নিশ্চিত root cause দাবি করা হয়নি।

Latest deploy backup stamp: `20261002-150336`। Runtime backup: `~/.omniroute-builds/runtime-backups/20261002-150336`। Private database/config snapshot: `~/.omniroute-local/update-backups/20261002-150336`। Verified package: `~/.omniroute-builds/3.8.51-f002e7654/omniroute-3.8.51.tgz`।

`.env`, encryption material, provider connections, local DNS shim, existing CA/key, ১৩ mappings ও selected targets preserved। Backups/archives মুছে দেওয়া হয়নি। Future upstream change-এ patch conflict বা gate fail হলে update বন্ধ করে পুরোনো service ধরে রাখা উদ্দেশ্য; নতুন version-এর compatibility হাতে review লাগতে পারে। এটি update-safe fallback, ভবিষ্যতের সব version-এ zero-issue promise নয়। Updater ব্যবহারকারী-triggered; নিজে continuous release install scheduler নয়। Final f002e7654 build-এ 15:26 Dhaka-তে installed omni-ctl update পুনরায় চালানো হয়েছে; final state ok, already running the newest verified build। Archive guard, patch applicability এবং live ingress/backend TLS পাস হয়েছে; no-op হওয়ায় service restart হয়নি।

## ১০. Quality ও latest native app updates

Prompt compression off। Streaming transport bytes preserve করা হয়েছে। Modern effort options সফল। তবে provider executor কিছু headers/system/tool schema/metadata transform করে; native request এবং upstream provider request সম্পূর্ণ byte-identical নয়। এই QA response quality-এর statistical benchmark নয় এবং সব prompt-এ original subscription path-এর সমমানের output নিশ্চয়তা দেয় না।

Native app bundle বা login/update mechanism এই fixes-এ পরিবর্তিত হয়নি। নতুন Claude app/CLI version endpoint, beta headers, model IDs বা streaming contract বদলালে একই gates এবং real native request আবার চালাতে হবে। নতুন native app version install করে এই QA-তে পরীক্ষা করা হয়নি।

## ১১. Routine, scheduled কাজ এবং verification gaps

Mac প্রথমে locked ছিল; পরে live UI access পাওয়া গেছে। Original native account-এর weekly display ১০০% অবস্থায় নিজের আলাদা No folder Code QA session-এ response পাওয়া গেছে। Final build-এর পরে সেই QA conversation resume এবং dashboard Diagnose/Restart যাচাইয়ের ফল accompanying UI evidence-এ আছে। CLI ও backend/component tests-ও করা হয়েছে। Latest full Mac reboot এই QA-তে চালানো হয়নি; boot helper-এর prior installation ও current bootstrap regression/live LaunchAgent restart আলাদা evidence। Scheduled execution end-to-end, সব Desktop Chat/Cowork features, Windows live environment এবং অন্য সব local website browser workflow যাচাই হয়নি।

Default cloud Routine remote runner-এ execute হলে এই Mac-এর localhost Bridge দিয়ে যায় না; original account-এর quota relevant থাকে। Official documentation self-hosted Routine option-ও বর্ণনা করে; এই setup-এর Routine runner integration configured/tested নয়।

Official references: [Claude environment variables](https://code.claude.com/docs/en/env-vars), [Claude Desktop](https://code.claude.com/docs/en/desktop), [Routines](https://code.claude.com/docs/en/routines), [OmniRoute stable release](https://github.com/diegosouzapw/OmniRoute/releases/tag/v3.8.51)।

## ১২. Upstream PR ও review status

[PR #15323](https://github.com/diegosouzapw/OmniRoute/pull/15323): generic native transport/lifecycle, count endpoint, thread cache budget, legacy thinking এবং inline/Advisor/native beta compatibility fixes। Personal nexa deployment/helper configuration upstream PR-এ নেই। PR draft আছে; merge হয়নি। Latest GitHub API-route typecheck ও Semgrep পাস। Heavy required jobs draft হওয়ায় skipped; Gate/CI এবং Gate/Quality logs-এ `draft or unknown PR readiness` আছে। তাই upstream CI green বলা যাবে না।

## ১৩. Troubleshooting ও handoff ব্যবহার

Connection error হলে আগে dashboard server state, live health, Bridge TLS gate, PID ownership ও provider quota পৃথকভাবে দেখুন। `8443` occupied হলে unrelated process kill করবেন না। `401`/entitlement error-এ original native auth এবং provider connection/headers দেখুন; repeated logout দিয়ে session ইতিহাস বদলাবেন না। Mid-response loss হলে ওই request log ও lifecycle/deploy timing তুলনা করুন।

Configuration export/report-এ API keys, OAuth tokens, CA private key, account email বা raw private prompts রাখবেন না। Recovery-এর জন্য বর্তমান verified package, পূর্ণ runtime backup এবং matching database snapshot ধরে রাখুন। Normal updates managed updater দিয়েই করুন। এই follow-up-এর patch শুধু `nexa/` durability changes বহন করে; pristine base-এর version/context অনুযায়ী review/apply করতে হবে।

## ১৪. Final overlay সংরক্ষণ ও পরবর্তী version গ্রহণের নিয়ম

এই পূর্ণ বাংলা report এখন `nexa/docs/AGENT-BRIDGE-PRODUCTION-HANDOFF-2026-10-02.md`-এ versioned। Credential ছাড়া frozen test/build record `nexa/qa/production-acceptance-2026-10-02.json`। Parallel-session QA পুনরায় চালানোর script `nexa/qa/native-concurrency.mjs`; সাহায্য ও prerequisites `nexa/qa/README.md`। Production transport code `f002e7654`-এর; documentation/QA tooling-এর পরবর্তী commit নিজে deployed executable পরিবর্তন করে না। Runtime পরিবর্তন হয়েছে বলতে actual BUILD_SHA ও archive/deploy evidence লাগবে।

Local upstream DNS shim-এর হুবহু source copy `nexa/deploy/bridge-upstream-dns.cjs`-এ আছে; installed DATA_DIR shim-এর সঙ্গে bytes মিলেছে। Secret ছাড়া Bridge environment reference `nexa/config/agent-bridge.env.example`। Updater বর্তমান DATA_DIR ও secret .env preserve করে; এই example দিয়ে live .env replace করা যাবে না। Model mappings/provider connections encrypted database-এ থাকবে; credentials বা secret configuration repository-তে রাখা হয়নি।

OmniRoute update-এর আগে clean source ও ৫৩টি patch applicability যাচাই হয়। তারপর measured core/ratchet/regression, compiled package contract, isolated authentication/catalog/inference/CORS এবং live TLS acceptance প্রয়োজন। কোনও বাধ্যতামূলক gate fail করলে candidate গ্রহণ করা যাবে না। Native Claude app/CLI update vendor-এর স্বাভাবিক পথে আসতে পারে; তার installation OmniRoute updater আটকে দেয় না। তাই নতুন native version-এ model/effort, native headers/count, tools, streaming, চার session/resume/cancellation ও Desktop-এর প্রকৃত Agent কাজ আবার পরীক্ষা করা প্রয়োজন। Fail হলে Bridge Stop-এর verified vendor TLS fallback দিয়ে original account ব্যবহার করা যায়; original quota/entitlement তখন প্রযোজ্য থাকে।

এই setup-এর production acceptance bounded native Code transport-এর জন্য। Sonnet 4.5 availability, final two-account rotation, তৃতীয় OAuth connection, actual scheduled Routine runner, সব Chat/Cowork feature এবং নতুন full Mac reboot এখনও পৃথক acceptance scope। Quality-এর statistical benchmark বা সব ভবিষ্যৎ version-এ zero-error parity দাবি নেই। Backup ও rejected candidates সংরক্ষিত থাকবে। Actual update/deploy request-এর শান্ত সময় বেছে নিতে হবে; active stream চলাকালীন restart continuity নিশ্চিত নয়।


---

# ঐতিহাসিক প্রথম setup record: বর্তমান state হিসেবে ব্যবহার করবেন না

# OmniRoute local setup: session handoff (2026-10-02)

Owner: Jillur Rahman (NexaLance). Machine: Mac Studio, macOS 26.6.1, Apple Silicon.
Session window: 2026-10-02 00:43 to about 08:30, Asia/Dhaka (UTC+6). All times below are local unless marked UTC.
This file records everything this session did for OmniRoute, from the first look at the repo to the upstream PR.
It holds no secrets: it names where they live, never their values.

---

## 1. Current state at a glance

| Item | Value |
|---|---|
| OmniRoute version | 3.8.51 (latest upstream release), fork overlay build `0bda6c400`, deployed 21:25 local (thread-404 fix + limit settings; section 3.11). Rollback package: `f002e7654` |
| Dashboard / API | http://omni.local and http://127.0.0.1:28128, API at `/v1` (OpenAI compatible) |
| Ports | 28128 main, 28131 embedded-service WS proxy, 28132 live dashboard WS. All loopback only |
| Auth | `REQUIRE_API_KEY=true`; dashboard password set by the owner at 01:47 (the `INITIAL_PASSWORD` in `.env` is now stale) |
| Auto-start | LaunchAgent `com.nexalance.omniroute` (login), restarts on crash |
| Desktop app | `/Applications/OmniRoute.app` 3.8.51, built from the fork, Remote Server Mode to 127.0.0.1:28128 |
| One-click update | Dashboard Update button -> `AUTO_UPDATE_MODE=command` -> updater LaunchAgent `com.nexalance.omniroute-updater` |
| Fork | `github.com/developerjillur/OmniRoute`: `nexalance` = `0bda6c400` (pushed by the updater at deploy); `upstream-main` = `c1e30b767` (v3.8.51) |
| Upstream PR | #15321 `feat(api): AUTO_UPDATE_MODE=command ...`: OPEN, MERGEABLE, at 20:55 local 35 pass / 8 fail / 8 skipping; base `release/v3.8.52` is itself red (#15306) |
| Providers | Claude OAuth x2 (`[private-email]`, `[private-email]`), Antigravity, AGY, all active |
| Limits | OmniRoute-side throttles removed or raised for many concurrent agent sessions (section 3.10); `.env` part takes effect at the next restart |
| Session affinity | `sessionAffinityTtlMs` = private-id-001 (24 h). It was 0 (off), which moved a Claude Code thread between the two accounts (section 3.10) |
| Health when written | `/healthz` 200 on 127.0.0.1 and omni.local; Local (Flywheel) sites up; overlay status: pristine base, all patches apply |
| Agent Bridge | installed by another session (section 9), kept and in active use by the owner |

Control everything with `omni-ctl`. `~/.local/bin/omni-ctl` is now a regular file identical to `scripts/omni-ctl.sh` (section 3.9), no longer a symlink. `omni-ctl help` lists the commands.

---

## 2. Where everything lives

### Internal disk (runtime; works with the T7 drive unplugged)

| Path | What |
|---|---|
| `~/.omniroute-runtime/` | npm prefix holding the deployed omniroute package (now the fork build tarball) |
| `~/.omniroute-runtime/updater/` | staged `omni-updater.sh`, `request-update.sh` (the button hook), `mode` |
| `~/.omniroute-runtime/omni-local-proxy.mjs`, `omni-local-root.sh` | staged copies for the omni.local root step |
| `~/.omniroute-local/` | DATA_DIR: `storage.sqlite`, `.env` (mode 600, secrets), `local-default.key` (mode 600, gateway API key), `logs/application/app.log`, `db_backups/` (official scheduled backups), `plugins/`, `update-status.json`, `mitm/` and `bridge-upstream-dns.cjs` (both from the Agent Bridge session, section 9) |
| `~/Library/Logs/OmniRoute/` | `service.out.log`, `service.err.log`, `update.log` |
| `~/Developer/OmniRoute/` | git clone of the fork (origin = fork over https, upstream = diegosouzapw), branch `nexalance` |
| `~/Developer/OmniRoute/.claude/worktrees/auto-update-command/` | worktree for PR #15321 (branch `feat/auto-update-command-mode`) |
| `~/.omniroute-builds/` | `3.8.51-01dcc9ff4/` (tgz + built OmniRoute.app), `current` (path of the deployed tgz), `app-previous/` (the official 3.8.51 app that was replaced), lockfile stamps, `.lock` while an update runs |
| `/Library/Application Support/OmniRoute-Local/omni-local-proxy.mjs` | root-owned copy of the omni.local forwarder |
| `/Library/Logs/OmniRoute-Local/proxy.log` | omni.local forwarder log |
| `~/.omniroute/` | residue of an older run (2026-09-30, upstream test plugin fixtures, no providers or keys). Not used by the service; only the desktop app's `electron-preferences.json` lives here. Left untouched on purpose |

### This kit (T7: `<local-setup>/`)

| Path | What |
|---|---|
| `README.md` | Bangla user guide (daily commands, update flow, omni.local, security, known issues) |
| `HANDOFF-OMNIROUTE-2026-10-02.md` | this file |
| `scripts/omni-ctl.sh` | control script (status, start/stop, update, redeploy, backup, features, hostproxy, cli ...) |
| `scripts/omni-updater.sh` | one-click update / redeploy pipeline (source of the staged copy) |
| `scripts/omni-bind.pl`, `scripts/omni-local-proxy.mjs`, `scripts/omni-local-root.sh` | socket helper (opens privileged-port sockets owned by the Local user), omni.local forwarder, and the root installer (v3, section 3.9) |
| `config/omniroute.env.template` | shape of `~/.omniroute-local/.env`, no secrets |
| `config/com.nexalance.omniroute.plist` | reference copy of the service plist as this session rendered it. Stale since the Agent Bridge edits (section 9) |
| `releases/v3.8.51/` | official `OmniRoute-3.8.51-arm64.dmg`, `latest-mac.yml` (sha512), changelog, SBOM |
| `source/OmniRoute/` | shallow clone of upstream at tag v3.8.51 (read-only reference) |
| `backups/omniroute-20261002-011914/` | first database snapshot (`sqlite3 .backup`, integrity ok) |

Other `.md` files in this folder (`OMNIROUTE-AGENT-BRIDGE-*`, `OMNIROUTE-CLAUDE-*`, `OMNIROUTE-REVIEW-*`, `OMNIROUTE-DOCUMENT-MAP-*`, `OMNIROUTE-EXISTING-CLAUDE-ACCOUNT-BRIDGE-*`, `Ami OmniRoute ta setup korchi kebol matr.md`) were written by other sessions between 06:23 and 07:49. This session did not write or verify them.

### launchd jobs

| Label | Type | Purpose |
|---|---|---|
| `com.nexalance.omniroute` | LaunchAgent | the service: `/usr/local/bin/node ~/.omniroute-runtime/lib/node_modules/omniroute/bin/omniroute.mjs serve --no-open`, `RunAtLoad`, `KeepAlive {SuccessfulExit=false}`, `ThrottleInterval 15`, `ExitTimeOut 40` |
| `com.nexalance.omniroute-updater` | LaunchAgent | runs the updater on kickstart only (`RunAtLoad false`) |
| `com.nexalance.omni-local` | LaunchDaemon (root) | adds lo0 aliases 127.0.0.2 and fd6f:6d6e::2; `omni-bind.pl` opens the omni.local sockets owned by developerjillur (so Local can still bind `*:80`), drops to `nobody` and runs the forwarder (section 3.9) |
| `com.nexalance.omniroute-native-ingress` | LaunchDaemon (root) | Agent Bridge ingress, installed by another session. Since section 3.9 it also starts through `omni-bind.pl` (127.0.0.1:443 and [::1]:443 owned by developerjillur) |

Removed during the session (first attempts): LaunchAgent `com.nexalance.omniroute-hostproxy`, LaunchDaemon `com.nexalance.loopback-alias`.

### Secrets (locations only)

- `~/.omniroute-local/.env`: `JWT_SECRET`, `API_KEY_SECRET`, `STORAGE_ENCRYPTION_KEY` (losing it means re-entering every provider login), `INITIAL_PASSWORD` (stale), `MACHINE_ID_SALT`.
- `~/.omniroute-local/local-default.key`: gateway API key `local-default`.
- `~/Library/LaunchAgents/com.nexalance.omniroute.plist`: holds an `INSPECTOR_INTERNAL_INGEST_TOKEN` in plain text since the Agent Bridge edit, file mode 644.
- Forgotten dashboard password: `DATA_DIR=~/.omniroute-local ~/.omniroute-runtime/bin/omniroute-reset-password`.

---

## 3. Timeline: what was done, in order

### 3.1 Research (00:43 to 01:00)

- Upstream `diegosouzapw/OmniRoute`: MIT, TypeScript, about 72k stars. Latest release v3.8.51 (2026-09-30), the same version as npm `latest`. Node engines `>=22.22.2 <23 || >=24 <27`. Release assets include `OmniRoute-3.8.51-arm64.dmg`.
- Read the README, the Electron README, `.env.example`, `bin/cli/commands/serve.mjs`, `bin/cli/tray/autostart.mjs`, `src/lib/runtime/ports.ts`.
- Finding: upstream's macOS autostart (`omniroute autostart enable`) writes a plist with `KeepAlive=false`, no logs or env, and the Node realpath hard-coded, so it was not used.
- Finding: the PATH `node` is Hermes's private Node 26 (`~/.hermes/node`). The standalone Node 24.15.0 at `/usr/local/bin/node` was chosen so Hermes updates cannot break the service.
- Found `~/.omniroute/` residue (2026-09-30, plugin test fixtures, no providers, no keys). A copy of its DB was inspected read-only in the session scratchpad. Left in place.

### 3.2 First install from the official npm package (01:00 to 01:20)

- `npm install -g --prefix ~/.omniroute-runtime omniroute@3.8.51` with Node 24 (1161 packages).
- DATA_DIR `~/.omniroute-local` with a generated `.env` (mode 600): port 28128, `OMNIROUTE_SERVER_HOST=127.0.0.1`, `REQUIRE_API_KEY=true`, fresh secrets, `OMNIROUTE_MEMORY_MB=8192`.
- LaunchAgent written and loaded; `/healthz` 200. Crash test: `kill -9` of the supervisor, launchd respawned it in 2 s and `/healthz` was 200 again at 3 s.
- Security checks: the LAN IP is refused; `/v1` without a key returns 401, with a wrong key 401, with the key 200. Nothing listens on the stock 20128.
- Desktop app: the official arm64 dmg, sha512 verified against `latest-mac.yml`, installed to `/Applications`, and pointed at the service through Remote Server Mode (`~/.omniroute/electron-preferences.json` -> `remoteServerUrl: http://127.0.0.1:28128`), so no second server and one set of provider logins.
- Gateway API key `local-default` created through the management API (CLI machine token), stored in `local-default.key` (mode 600).
- Smoke test: `/v1/models` returned 474 models. A chat with `model: auto` returned 403: the keyless OpenCode Free tier upstream advertises now refuses use outside OpenCode. A provider has to be connected for chats to work (the gateway itself works).
- Features enabled: MCP (streamable-http, `/api/mcp/stream`), A2A (`/a2a`, through the same settings PATCH the dashboard uses), and the official scheduled backup (03:00 daily, keep 14). Compression left at the upstream default (off) because it changes prompts.
- Hardening added along the way:
  - Service logs moved to `~/Library/Logs/OmniRoute/`: on first boot OmniRoute's legacy-log migration zipped and removed every file in `DATA_DIR/logs/`, including the launchd logs.
  - `MACHINE_ID_SALT` pinned in `.env`. Only a precaution: 3.8.51 ships the constant `endpoint-proxy-salt`.
  - `LIVE_WS_PORT=28132`, `EMBED_WS_PROXY_PORT=28131` (were the stock 20132/20131).
  - `OMNIROUTE_PLUGINS_DIR=~/.omniroute-local/plugins`: the plugin scanner ignores DATA_DIR and read `~/.omniroute/plugins` (nothing had loaded: `loadAll count 0`).
  - `omni-ctl` wraps the CLI with the right DATA_DIR and base URL, and filters about 15 lines of env-loader noise per call.
- Kit written: `omni-ctl.sh`, README (Bangla), env template, plist reference, first DB backup.

### 3.3 Independent review of `omni-ctl.sh` and fixes (01:20 to 01:40)

A code-review pass found no high-severity issue (no data deletion, no runtime dependency on T7, no secret printed). Fixed:
- `ensure_env` refuses to generate new secrets when `storage.sqlite` exists without `.env` (that would lock out every stored credential).
- `update-npm` validates the version on npm before stopping the service. Rollback reinstalls, checks the version and health, and says `ROLLBACK FAILED` when it fails.
- `start`, `restart` and `enable` exit 1 when the server never becomes ready.
- `install-desktop` re-downloads once on a sha512 mismatch (half-finished download).
- README claim about `MACHINE_ID_SALT` corrected.

### 3.4 Login (owner)

- The owner logged in and changed the dashboard password at 01:47 (audit log: `settings.update` with a password diff, then a successful login). `INITIAL_PASSWORD` in `.env` only applied to the first boot.

### 3.5 http://omni.local (01:40 to 01:55)

Goal: open the dashboard at http://omni.local without a port.
- `*:80` belongs to Local (Flywheel)'s router nginx, which regenerates its config, so it was not touched. omni.local got its own loopback addresses instead.
- First attempt failed twice:
  - The root script never ran: root processes cannot read the external T7 drive (macOS privacy, "Operation not permitted"), so the hosts line was missing and the browser showed `NXDOMAIN`.
  - A user-level proxy cannot bind port 80 on a specific address on macOS (`EACCES`; unprivileged binds below 1024 work only on the wildcard address).
- Final design:
  - `/etc/hosts`: `127.0.0.2 omni.local` and `fd6f:6d6e::2 omni.local`. The IPv6 line removes a 5 s `.local` lookup delay; lookups now take about 4 ms. Backups: `/etc/hosts.bak-omniroute-*`.
  - Root LaunchDaemon `com.nexalance.omni-local`: adds both lo0 aliases at boot and runs the TCP forwarder (80 -> 28128, 28131 -> 28131, 28132 -> 28132), which drops to `nobody` once bound.
  - Installed by `omni-ctl hostproxy`, which stages the files on the internal disk and asks for the admin password through the macOS dialog.
- Verified: `/healthz` 200, dashboard redirect, login, `/v1/models`, the live WS port. Not reachable from the LAN. Local sites `project-02.local` and `project-03.local` still 200 (`project-04.local` returns 502 because that Local site is stopped, not because of this change).

### 3.6 Fork + child-theme overlay + one-click updater (02:00 to 07:00)

Owner's choices: show the button for **stable releases only**; **ask before opening every upstream PR**; start with the fork, the source build and the one-click updater.

- The fork `developerjillur/OmniRoute` already existed with a child-theme overlay on branch `nexalance` (default branch, GitHub Actions disabled):
  - Upstream files are never edited on the branch.
  - Customizations live in `nexa/`: `patches/` (one diff per file), `new/` (net-new files), `update.mjs`, `apply.mjs`, `restore.mjs`, `build.mjs`, `status.mjs`, the pristine guard, `manifest.json`.
  - Details: `~/Developer/OmniRoute/nexa/README.md` and `nexa/skill/nexa-overlay/SKILL.md`.
- Cloned to `~/Developer/OmniRoute` over https, added the `upstream` remote, and created local `upstream-main` and `pre-child-theme-migration` branches. The overlay engine needs the local `upstream-main`.
- Rollback tag `nexa-preupdate-20261002` (local only), then `node nexa/update.mjs`: base v3.8.48 -> v3.8.51.
- Patch re-cut, commit `c7eb5ea74`:
  - 37 patches needed attention, although the engine reported 21 (see the engine fix below).
  - 19 were dropped because their fix is now upstream, mostly the owner's merged PRs (#6451, #6452, #6541, #6542, #6543, #6545, #6553, #6554, #6558).
  - 19 were re-cut onto the new files. The catalog cache was renamed to `nexaCatalogCache.ts` because upstream added a file at the same path.
  - One new patch was added (advisor labels in `en.json`).
  - Result: 31 patches + 13 new files, all applying.
- New overlay feature, commit `b2694cc03`, `AUTO_UPDATE_MODE=command`:
  - Patches `src/lib/system/autoUpdate.ts` and `src/app/api/system/version/route.ts`.
  - When the mode is `command`, the dashboard Update button runs `AUTO_UPDATE_COMMAND <version>` detached (same path as docker-compose mode). The command is validated (empty or missing executable -> button disabled with a reason).
  - Test `nexa/new/tests/unit/auto-update-command-mode.test.ts` (6 tests).
- Validation gate on the applied tree:
  - `npm ci` ok.
  - New tests 6/6; upstream auto-update tests 35/35; overlay security regression tests 6/6 + 6/6.
  - `typecheck:core` clean. The tsc ratchet was skipped by the script itself (`tsc-absent`).
- Engine fix, commit `01dcc9ff4`, in `nexa/lib/overlay.mjs` `checkPatches`:
  - `git apply --check --3way` passes a patch even when its 3-way merge leaves conflict markers.
  - Now it runs a strict `--check` first, then the real 3-way apply in a throwaway worktree of `upstream-main`.
  - Proven with a probe patch that the old check passed and the new one rejects.
- Updater, `scripts/omni-updater.sh`, staged to `~/.omniroute-runtime/updater/`, run by LaunchAgent `com.nexalance.omniroute-updater`:
  1. Refuse to run on a dirty tree or the wrong branch. Take a lock.
  2. `update` mode only: tag `nexa-prelease-<stamp>`, run `node nexa/update.mjs`. Stop before touching the service if any patch needs a re-cut.
  3. Apply the overlay. Build the way upstream publishes: `npm ci` (only when the lockfile changed), `build:release`, `build:cli-api`, `build:cli`, `check:pack-artifact` with `OMNIROUTE_ALLOW_CANARY_BUILD=1` (the provenance gate rejects any commit not on upstream's release branch), `npm pack`, then Electron `prepare:bundle` + `electron-builder --dir --arm64`.
  4. Restore the overlay and reset the generated `bin/cli/api-commands/`.
  5. Stop the service, install the tarball into `~/.omniroute-runtime`, start, health check (180 s). On failure, reinstall the previous tarball and report.
  6. Swap `/Applications/OmniRoute.app` (old one kept in `~/.omniroute-builds/app-previous`) and relaunch it if it was open.
  7. Push `nexalance` and `upstream-main` to the fork (never to upstream). Keep the current build plus the two newest others.
  8. Write `~/.omniroute-local/update-status.json` and show a macOS notification.
- Wiring: `.env` has `AUTO_UPDATE_MODE=command`, `AUTO_UPDATE_COMMAND=~/.omniroute-runtime/updater/request-update.sh` (kickstarts the updater job), `AUTO_UPDATE_LOG_PATH`.
- First real run (`omni-ctl redeploy`):
  - Attempt 1 stopped at the provenance gate. Attempt 2 stopped on uncommitted generated files. The service was untouched both times.
  - Attempt 3 deployed the service build `01dcc9ff4`. The Electron step failed because upstream's `electron/package-lock.json` is out of sync in v3.8.51 (`npm ci` refuses). The updater now falls back to `npm install` and restores the tracked lockfile.
  - The app was then built (unsigned, ad-hoc; 2.6 GB) and installed, and it reconnected to 28128 with no second server.
- Button path test: running `request-update.sh` started the updater, which answered "already on the latest release, nothing to do".
- Not yet verified:
  - The full update against a real new release: the first one will be v3.8.52.
  - The dashboard's "auto-update supported" display: the version endpoint accepts only a login session, so the owner should glance at the Home page.

### 3.7 Upstream PR #15321 (08:00 to 08:30)

- The owner selected only the `AUTO_UPDATE_MODE=command` change for upstream, and approved opening it.
- No release freeze was open. The active branch was `release/v3.8.52`, whose tip is red (#15306), so the PR body carries `⚠️ base-red inherited: #15306`.
- Worktree `.claude/worktrees/auto-update-command`, branch `feat/auto-update-command-mode` from `upstream/release/v3.8.52`. The two files are unchanged between v3.8.51 and that tip.
- Same change as the overlay patch plus the 6-test file. Only the feature hunks were kept: an unrelated prettier reformat was reverted to keep the diff minimal.
- Checks: 6/6 new tests, 35/35 auto-update tests, eslint, prettier, `typecheck:core` (0 errors), `check-env-doc-sync`.
- Commits `8858b9d42` (feature) and `d1fe09dac` (changelog fragment `changelog.d/features/15321-auto-update-command-mode.md`). Author Jillur Rahman (noreply), no trailers, no tool mentions anywhere.
- PR: https://github.com/diegosouzapw/OmniRoute/pull/15321 , base `release/v3.8.52`.

### 3.8 Agent Bridge discovered (about 08:20)

See section 9. The owner saw `SELF_SIGNED_CERT_IN_CHAIN` in Claude Code and the cause was traced to another session's work.

---

### 3.9 Local (Flywheel) outage and the fix (18:20 to 18:50)

Symptom (owner screenshot): every Local site, e.g. `project-01.local/wp-admin`, showed `ERR_CONNECTION_REFUSED`.

Root cause, from Local's router log `~/Library/Application Support/Local/run/router/nginx/logs/error.log` (first at 09:42, again at 18:17): `bind() to 0.0.0.0:80 / [::]:80 / 0.0.0.0:443 / [::]:443 failed (48: Address already in use)`.
- macOS rejects a non-root WILDCARD bind (Local's router nginx: `*:80`, `*:443`) while a socket owned by ANOTHER uid holds the same port on a specific address. A socket's owner is the effective uid that created it.
- Two root daemons held such sockets: this session's omni.local forwarder (`127.0.0.2:80`, `[fd6f:6d6e::2]:80`) and the Agent Bridge native ingress from another session (`127.0.0.1:443`, `[::1]:443`).
- Before the 11:53 reboot Local had bound first, so nothing showed. After the reboot the root daemons started first and Local could not bind again.
- Proved on high ports without root: a root-owned specific socket makes a user wildcard bind fail with `EADDRINUSE`; a socket owned by the same user lets the wildcard bind succeed in either order.

What was tried and what is installed:
1. v2, pf redirects (no sockets on 80/443): the anchor `com.apple/250.nexalance` loaded, but its `rdr` rules never matched loopback traffic (no pf state, `000`). Rolled back automatically; v3 removed the anchor file.
2. v3 (installed): `scripts/omni-bind.pl` (system Perl) creates each socket with euid = developerjillur, binds it as root (needed below 1024 on a specific address), sets `SO_REUSEADDR`, drops to `nobody` and execs the program with the sockets inherited (`OMNI_LISTEN_FDS`). While old root-owned connections are still closing it retries the bind for up to 150 s; this happened once on IPv6 because the browser had omni.local open.
   - `com.nexalance.omni-local` runs `omni-bind.pl` with the forwarder, which listens on the inherited sockets (80 -> 28128, 28131, 28132).
   - The Agent Bridge ingress `/Library/Application Support/OmniRoute-Native-Ingress/native-ingress.mjs` got a small patch: it listens on inherited sockets when `OMNI_LISTEN_FDS` is set, and is otherwise unchanged. Its plist `ProgramArguments` now start it through `omni-bind.pl`. Routing is unchanged: `api.anthropic.com` goes to the MITM :8443, any other SNI goes to Local's router.
   - Backups of everything changed: `/Library/Application Support/OmniRoute-Local/backup-20261002-184554/`. Root run log: `/Library/Logs/OmniRoute-Local/root-20261002-184554.log`.
3. Local's router had given up at 18:17, so the running site `sagrilo-photography` was restarted through Local's own local API (`restartSite`), which started the router again.

Verified after the fix:
- Local's router nginx listens on `*:80` and `*:443` next to the two daemons.
- `project-01.local/wp-admin` -> 302 (login redirect), `[private-reference]` -> 200, `project-05.local/wp-admin` -> 302.
- `omni.local/healthz` -> 200; `api.anthropic.com` through the bridge -> 404 (reached the real API).
- Wildcard bind probe as developerjillur: `0.0.0.0:80`, `[::]:80`, `0.0.0.0:443`, `[::]:443` all OK, so the boot order no longer matters.

Also found: `~/.local/bin/omni-ctl` had been replaced at 10:17 by another session's modified copy (fixed KIT path, plist `chmod 600`, updater sourced from the fork's `nexa/deploy/`, `build-only`, `update-npm` and a second `install` blocked). Kit edits therefore never reached the `omni-ctl` command. Their changes were kept and merged with the hostproxy changes; the same file now sits in both places (`scripts/omni-ctl.sh` and `~/.local/bin/omni-ctl`, a regular file, not a symlink). Edit one, copy it to the other.

Open: `.local` names take about 5 s to resolve system-wide (macOS asks mDNS first, and it reports "Not Reachable"), for Local sites and omni.local alike. This is not caused by the port fix. Chrome reads /etc/hosts itself, so browsers are mostly unaffected; `omni-ctl` checks now use `--resolve` to skip it.

### 3.10 "All credentials are cooling down" and removing OmniRoute's limits (20:30 to 21:00)

**Symptom.** In Claude Code (through the Agent Bridge): `API Error: Server is temporarily limiting requests (not your usage limit) · All credentials for model claude-opus-5-5 are cooling down`. It is an OmniRoute message, not an Anthropic usage limit.

**Root cause.** From `call_logs` and `GET /api/resilience/model-cooldowns`:
1. Claude Code now uses server-side message threads (`previous_message_id`). A thread exists only on the Claude account that created it.
2. `sessionAffinityTtlMs` was `0`, which means session-to-account pinning was OFF (`src/sse/services/sessionAffinityPin.ts`, `resolveSessionAffinityTtlMs`: 0 = disabled). `stickyRoundRobinLimit` is 3, so requests moved between `amortuj@` and `developerjillur05@` every few calls. A turn sent to the other account got `404: No thread state was found for the requested previous_message_id`.
3. The running build `f002e7654` classifies that 404 as `model_not_found` and locks the account+model (lockout of about 120 s). Once every Claude credential for `claude-opus-5-5` was locked, OmniRoute answered "cooling down".
4. Evidence: in the 12 minutes before the fix, 326 Claude calls, 27 thread-404s and 101 `400: thread ... differing field(s): system`. `developerjillur05@` serves `claude-opus-5-5` normally (437 successes that day), so the lockouts were wrong, not a missing model.

**What was done (all live, no restart).**
- Cleared the lockouts and breakers: `POST /api/resilience/reset` and `DELETE /api/resilience/model-cooldowns {"all":true}`.
- Temporary guard: a background script cleared ONLY `claude` lockouts with reason `model_not_found`, every 10 s, stopping by itself after 90 min (started about 20:44 local). It cleared 29 of them by 20:55. It runs inside this session and dies with it.
- Turned on session affinity: `PATCH /api/settings {"sessionAffinityTtlMs":private-id-001}` (24 h, the schema maximum).
- Honest early reading: 4 minutes after the change, 26 Claude calls, 5 thread-404s and 4 system-400s. The sample is too small to judge, and threads that were already created on the other account keep failing until those sessions end. Re-measure over a longer window (the query is below).
- The lasting fix is the Agent Bridge session's overlay commit `140948ee0` (`open-sse/services/errorClassifier.ts`: the thread-404 counts as a request-resource 404, so no lockout and no fallback; the error goes back to Claude Code, which replays the thread). It was never deployed: builds `140948ee0` failed the TypeScript ratchet (5835 > 5830); `9bec4d826` and `0bda6c400` passed it, and the `0bda6c400` build was stopped at the owner's request at 20:30. A stale half-built folder was moved aside to `~/.omniroute-builds/3.8.51-0bda6c400.stopped-20261002-204235`, and `omni-ctl build-only` was started again at 20:42 (`.claude/worktrees/bridge-build-20261002-204236`). Once it passes, deploy with `omni-ctl redeploy` (one restart of 10 to 20 s; during it the Agent Bridge ingress sends Claude Code straight to Anthropic).
- The `400 ... differing field(s): system` errors are a separate issue, not investigated. The nexa reasoning-elicitation patch only touches `/v1/chat/completions`, not `/v1/messages`, so it is not that.

**OmniRoute-side limits changed.** An inventory of every limit came from the source, with file:line for each. Backups of all settings before the change: the session scratchpad `limits-backup/` (temporary) and `~/.omniroute-local/.env.bak-before-limits-20261002-204944`.

| Limit | Before | Now | How | Effective |
|---|---|---|---|---|
| Auto rate-limit on API-key providers (Bottleneck: 60 RPM, 6 parallel, 350 ms gap) | on | off | `PATCH /api/resilience {"requestQueue":{"autoEnableApiKeyProviders":false}}` and `.env RATE_LIMIT_AUTO_ENABLE=false` | live / restart |
| Queue and concurrency-gate wait (`maxWaitMs`) | 30 s | 600 s | same PATCH (`maxWaitMs`), `.env RATE_LIMIT_MAX_WAIT_MS=600000` (0 would fail immediately when a gate is full) | live |
| Route body limit (`/v1/messages` used 10 MB) | 10 MB | 500 MB (maximum) | `PATCH /api/settings {"maxBodySizeMb":500}` | live |
| Chat hard body cap | 50 MB | 500 MB | `.env OMNIROUTE_CHAT_HARD_MAX_BODY_BYTES=524288000` | restart |
| Context-window / max-input check | on | off | feature flag `DISABLE_CONTEXT_WINDOW_CHECKS=true`, source db. That route accepts only a dashboard session or a `manage`-scope key, so a temporary manage key was created, used and revoked within one script | live |
| Round-robin combo semaphore | 3 per model, queue 20 | 20, queue 100 | `PATCH /api/settings/combo-defaults`. This PATCH REPLACES the whole object: the 11 other keys were dropped and restored from the backup | live |
| Round-robin semaphore env cap | 3 | 32 | `.env COMBO_CONCURRENCY_PER_MODEL=32` | restart |
| Stream total lifetime (cut healthy streams at 21 min) | 1260000 ms | 0 = no limit | `.env STREAM_ACTIVE_TIMEOUT_MS=0` | restart |
| Node heap | 8192 MB | 16384 MB (the maximum; 17000 or more silently falls back to 4096) | `.env OMNIROUTE_MEMORY_MB=16384` | restart |
| Chat admission byte budget (heap x 0.25 / 8, about 262 MB, 503 after 250 ms) | about 262 MB | 2 GiB (the hard maximum) | `.env OMNIROUTE_CHAT_MAX_INFLIGHT_BYTES=2147483648` | restart |

Already off and left off: `OMNI_MAX_CONCURRENT_CONNECTIONS`, global and connection concurrency, queue depth, per-key rate limits, `maxSessions`, budgets and quotas, adaptive admission (shadow), provider cooldown, quota preflight. Per-connection `rateLimitProtection` is off on all four connections, and the API key `local-default` has no limits.

Kept on purpose:
- The 10-minute stream idle, readiness and first-byte timeouts: they only end dead connections.
- Circuit breakers, connection cooldown and `waitForCooldown` / `comboCooldownWait`: they skip or wait for a failing account instead of throttling. With them off, a failure would surface at once.
- The tool list cap of 128: not configurable.
- Auth (`REQUIRE_API_KEY`, loopback bind, dashboard login): security, not throughput.

Provider quotas (Claude 5-hour and weekly windows, per-account concurrency, 429/529) cannot be lifted by OmniRoute; more accounts spread the load.

Also noticed, not changed: `cloudEnabled` is `true` in settings (cloud sync). Confirm with the owner whether that is intended.

**Verify / revert.**
- Lockouts now: `GET /api/resilience/model-cooldowns`. Clear: `POST /api/resilience/reset`.
- Thread errors since a time T: `sqlite3 -readonly ~/.omniroute-local/storage.sqlite "SELECT sum(status=200), sum(status=404 AND error_summary LIKE '%No thread state%'), sum(status=400 AND error_summary LIKE '%differing field%'), count(*) FROM call_logs WHERE provider='claude' AND timestamp >= 'T';"`
- Revert `.env`: copy `~/.omniroute-local/.env.bak-before-limits-20261002-204944` back (mode 600) and restart. Revert settings: PATCH the old values listed in the "Before" column.
- Management calls from a script: import `apiFetch` from `~/.omniroute-runtime/lib/node_modules/omniroute/bin/cli/api.mjs` with `DATA_DIR=~/.omniroute-local`. It sends the loopback machine token, which `requireManagementAuth` routes accept; `isAuthenticated` routes such as feature flags do not.

**Browser.** The Chrome extension was not connected. The Playwright browser reached the dashboard login page, but signing in needs the owner's own password, which this session neither knows nor types. All changes were made and read back through the API. A visual check needs the owner to log in once in that window. (Playwright writes `.playwright-mcp/` logs into this kit folder.)

### 3.11 Disk cleanup, fix deployed, results (21:00 to 21:35)

**Disk.** The `0bda6c400` build-only run passed every gate but stopped at the isolated install: only 3.7 GiB was free on the internal disk (the updater needs 6 GiB). The Agent Bridge updater keeps every build, smoke install and full runtime backup ("cleanup is an explicit owner operation"), and they had grown to about 40 GB plus about 30 GB of build worktrees. The owner asked to remove everything unneeded.
- Removed, after printing the exact list (53 entries) and validating every path against a fixed keep-list:
  - 8 worktrees, removed with `git worktree remove`, so their branches stay: `bridge-build-*` x4, `bridge-prechange-suite-baseline`, `bridge-typescript-baseline`, `agent-bridge-update-durability`, `native-agent-bridge-transport`. None had uncommitted source changes.
  - Old `~/.omniroute-builds/3.8.51-*` package folders, `bridge-candidate-*`, `bridge-fault-*`, `bridge-smoke-*`, all `smoke-*`, `app-previous`, the `legacy-runtime` and `current-before-first-promotion-*` markers, and runtime backups except the newest.
  - `electron/dist-electron` in the main checkout.
- Kept: `current`, `previous`, `previous-runtime`; packages `3.8.51-f002e7654` (rollback), `3.8.51-43bc71075` (`previous`) and `3.8.51-0bda6c400`; `runtime-backups/20261002-150336`; the PR #15321 worktree; `~/.omniroute-runtime`; `~/.omniroute-local`.
- Free space went from 3.7 GiB to 81 GiB. Each future deploy adds one runtime backup (about 2.5 GB) and one package, so prune occasionally the same way.

**Deploy.** `omni-ctl redeploy` reused the verified `0bda6c400` artifact (same commit, built at 20:56), re-ran the bridge gate and the isolated smoke, and promoted it at 21:25. Checks: native ingress, client DNS and TLS ok, fork pushed. After the restart: `/healthz` 200; chat admission budget 2147483648 bytes (`override`); `sessionAffinityTtlMs` private-id-001 and `maxBodySizeMb` 500 kept. The temporary lockout guard was stopped at about 21:33; it cleared nothing after the deploy (51 clears before).

**Measured, first 5 minutes after the deploy, against the 12 minutes before the first fix:**

| | Before | After deploy |
|---|---|---|
| Claude calls | 326 | 198 |
| Success | 197 (60%) | 190 (96%) |
| Thread-404 | 27 | 0 |
| "cooling down" errors | yes | 0 |
| `400 thread ... differing field(s): system` | 101 (31%) | 6 (3%) |
| Lockouts the guard had to clear | 26 | 0 |

Routing: almost all traffic went to `developerjillur05@`; `amortuj@` had 2 real Anthropic 429s.

**Still open (likely cause found, not changed yet).** The remaining `differing field(s): system` 400s: for Claude OAuth requests `open-sse/executors/base.ts` (around line 1184) strips the client's billing line and sentinel from `system`, prepends its own `x-anthropic-billing-header: cc_version=...; cc_entrypoint=cli; cch=00000;`, then `signRequestBody` (around line 1404) replaces `cch` with a hash of the whole serialized body. That makes `system[0]` differ on every turn, which conflicts with a stored message thread. Not yet confirmed against a captured request. Planned fix: an overlay patch that keeps the client's own `system` blocks unchanged for Agent Bridge native `/v1/messages` passthrough, plus strict thread-to-account pinning (a request carrying `previous_message_id` goes only to the account that owns the thread, and returns its 429 instead of switching). Native Claude Code then waits and retries, as it does without OmniRoute.

## 4. Daily operations

| Command | Does |
|---|---|
| `omni-ctl status` / `health` / `logs [-f]` | state, `/healthz`, service + app logs |
| `omni-ctl start` / `stop` / `restart` | service control (`stop` lasts until the next login) |
| `omni-ctl enable` / `disable` | auto-start on/off. Rewriting the plist now keeps env keys added by other tools (`keep_extra_env`) |
| `omni-ctl open` / `desktop` | dashboard in the browser / desktop app (strips `ELECTRON_RUN_AS_NODE`, which VS Code terminals set and which makes the app exit silently) |
| `omni-ctl update` (= `upgrade`) | same as the dashboard button: pull the newest release into the overlay, build, deploy, rebuild the app |
| `omni-ctl redeploy` | build + deploy the current `nexalance` commit after a customization change |
| `omni-ctl update-status` | last update result |
| `omni-ctl backup [--with-secrets]` | DB snapshot to `backups/` in this kit (`--with-secrets` also copies `.env`) |
| `omni-ctl features` | (re)enable MCP, A2A, scheduled backup |
| `omni-ctl hostproxy` | (re)install omni.local (admin password dialog) |
| `omni-ctl updater-install` | (re)install the updater job and the button hook |
| `omni-ctl update-npm [v]` | legacy: stock npm package, drops the customizations |
| `omni-ctl cli <args>` | the official `omniroute` CLI against this instance |

Adding a customization:
1. Edit the upstream file in `~/Developer/OmniRoute`.
2. `git diff upstream-main -- <file> > nexa/patches/<path with / replaced by __>.patch`; new files go to `nexa/new/<same path>`.
3. `git checkout upstream-main -- <file>`.
4. `node nexa/check/pristine-base.mjs` and `node nexa/apply.mjs --check`, commit (`node nexa/gen-manifest.mjs` first).
5. `omni-ctl redeploy`.

Never commit from an applied tree; `node nexa/status.mjs` shows the state.

Do not run `omniroute autostart enable`, `npm i -g omniroute`, or `omniroute update --apply`: they create a second instance on 20128 or a copy in Hermes's `~/.local` prefix.

---

## 5. Upstream PR workflow (agreed rules)

- Ask the owner before opening any PR. Branch from the active `release/v*` (check `gh issue list --label release-freeze` first), in a worktree under `.claude/worktrees/`. Include tests, a `changelog.d/<type>/<PR>-<slug>.md` fragment, and Conventional Commits.
- Author Jillur Rahman only. No `Co-Authored-By`, no tool or AI mention in commits, PR bodies or changelog (owner's global rule and upstream Hard Rule #16).
- If the base is red, add `⚠️ base-red inherited: #<issue>` to the PR body.
- Never `git stash` in that repo (upstream Hard Rule #22).
- When a PR merges and ships in a release, delete the matching overlay patch on the next `omni-ctl update`.

PR candidates found but NOT approved yet (each needs a yes first):

| Bug | Where |
|---|---|
| `electron/package-lock.json` out of sync with `package.json` in v3.8.51, `npm ci` fails | `electron/` |
| `omniroute mcp call` falls back to a hard-coded `http://localhost:20128` | `bin/cli/commands/mcp.mjs` |
| `omniroute a2a status` prints "stopped" while REST `/api/a2a/status` says enabled and online | CLI display |
| Plugin scanner ignores DATA_DIR | `src/lib/plugins/scanner.ts` |
| First-boot legacy-log migration archives and removes every file in `DATA_DIR/logs/`, not only OmniRoute's | log migration |

---

## 6. Known issues and traps

- **Chats need a provider.** `auto` (OpenCode Free) returns 403 since October 2026. Connect one in Dashboard -> Providers. When this session last checked, none was configured; the Agent Bridge session may have added one.
- **Port 80** belongs to Local's nginx. omni.local works through 127.0.0.2. Do not edit Local's router config: Local regenerates it.
- **Root and T7:** any script run as root must be staged on the internal disk first.
- **`launchctl bootout` is asynchronous:** `bootstrap` right after it fails with error 5. `omni-ctl` waits in its `unload` helper.
- **bash 3.2** (`/usr/bin/env bash` here) cannot `source <(...)`.
- **Desktop app** is unsigned (ad-hoc). No quarantine flag, so Gatekeeper does not block it; if it ever does: `xattr -cr /Applications/OmniRoute.app`.
- **A2A agent card** name and description are hard-coded in Chinese upstream.
- **Disk:** the internal disk had about 46 GB free. Each build keeps a tarball (132 MB) and an app (2.6 GB); the updater keeps 3 builds.
- **Overlay notes from the re-cut** (worth a later look):
  - The Dockerfile still pins npm 11.16.0, though upstream now calls node-gyp directly, so the pin and the `.npmrc` allow-scripts may be removable.
  - The catalog patch (#6544, closed unmerged) now wraps upstream's own coalescing cache, so it is a second cache and a deletion candidate.
  - Dropping the `agent.json` patch removed the `x-forwarded-proto` handling: set `OMNIROUTE_BASE_URL` if the card shows `http://` behind a proxy.
  - Hermes MoA now has upstream roles (`moa_reference`, `moa_aggregator`) next to ours.
  - The re-cut patches were validated by the gate above and a successful build and boot, not by their full upstream test suites.

---

## 7. Rollback and undo

| Want | Do |
|---|---|
| Back to the stock npm package | `omni-ctl update-npm 3.8.51` |
| Back to a previous fork build | `omni-ctl stop`, then `/usr/local/bin/node /usr/local/lib/node_modules/npm/bin/npm-cli.js install -g --prefix ~/.omniroute-runtime <older tgz from ~/.omniroute-builds>`, then `omni-ctl start` |
| Previous desktop app | quit the app, move `~/.omniroute-builds/app-previous` back to `/Applications/OmniRoute.app` (it is the official 3.8.51 build); or `omni-ctl install-desktop 3.8.51` |
| Overlay before this session | `cd ~/Developer/OmniRoute && git reset --hard nexa-preupdate-20261002`; the tag is local only, and `origin/nexalance` would need a force push, so ask first |
| Remove omni.local | `sudo launchctl bootout system/com.nexalance.omni-local`, delete `/Library/LaunchDaemons/com.nexalance.omni-local.plist` and `/Library/Application Support/OmniRoute-Local/`, remove the two `omni.local` lines from `/etc/hosts` (backups: `/etc/hosts.bak-omniroute-*`) |
| Remove everything | `omni-ctl uninstall` (stops the service, removes its plist, lists what is left), then by hand after `omni-ctl backup --with-secrets` |
| Restore the database | official: `omni-ctl cli restore --help`; kit snapshot: stop, move the current `storage.sqlite` aside, copy the snapshot in, start (needs the same `STORAGE_ENCRYPTION_KEY`) |

---

## 8. Open items for the next session

1. **Done 21:25:** thread-404 fix deployed with the `.env` limit changes (section 3.11). Next: the overlay patch for the remaining `differing field(s): system` 400s and strict thread-to-account pinning (end of 3.11), then the coding-quality configuration the owner asked for (a research inventory of quality-affecting features was started).
2. **Re-measure the thread errors** after affinity has run for an hour (query in 3.10). If thread-404s continue, check that Claude Code requests carry a stable session key (`extractSessionAffinityKey` in `src/sse/handlers/chat.ts`).
3. **Investigate `400 thread ... differing field(s): system`** (about 30% of Claude calls before the change). Something changes the system prompt between turns of one thread.
4. **PR #15321 checks:** 8 failing at 20:55 local (Build, Docs Sync (Strict), Fast Quality Gates, Gate / CI, Gate / Quality, Lint, Merge integrity, Vitest). The base `release/v3.8.52` is red (#15306), so first separate inherited failures from ours, then fix ours and reply in the owner's voice.
5. **Housekeeping (ask before deleting):** `.claude/worktrees/bridge-build-*` worktrees (4 at 20:55, with hard-linked node_modules), `~/.omniroute-builds/3.8.51-0bda6c400.stopped-*`, `.playwright-mcp/` in this kit.
6. **`cloudEnabled: true`:** confirm with the owner that cloud sync is wanted.
7. **Agent Bridge:** kept by the owner. Its ingress now starts through `omni-bind.pl` (section 3.9); any reinstall of the bridge must keep that, or Local (Flywheel) breaks again after a reboot.
8. **PR #15321 after merge:** watch CI and reviews; reply in the owner's voice. After it merges and ships, drop `nexa/patches/src__lib__system__autoUpdate.ts.patch`, `nexa/patches/src__app__api__system__version__route.ts.patch` and `nexa/new/tests/unit/auto-update-command-mode.test.ts`.
9. **First real one-click update** when v3.8.52 is released: watch `~/Library/Logs/OmniRoute/update.log` and confirm the app rebuild and relaunch.
10. **Dashboard check:** the Home page should report auto-update as supported (`channel: command`); this session could not read that endpoint without a browser session.
11. Ask the owner about the five unapproved upstream PR candidates (section 5).
12. Optional: refresh `config/com.nexalance.omniroute.plist`, which predates the bridge edits; do not copy the token into the kit. Consider `chmod 600` on the live plist.
13. `~/.omniroute/` residue: leave it unless the owner asks (the desktop app reads its prefs file there).

---

## 9. Agent Bridge (installed by another session, not by this one)

Evidence:
- A working folder `~/Documents/Codex/2026-10-02/omniroute-agent-bridge-config-074223-...` appeared at 07:42; the MITM files appeared at 07:47.
- The OmniRoute audit log has no entry for it.
- No upstream or overlay code writes the nginx bridge.

What it set up:
- `/etc/hosts`: `127.0.0.1 api.anthropic.com` and `::1 api.anthropic.com`.
- `~/Library/Application Support/Local/run/router/nginx/conf/route.api-anthropic-bridge.conf`: Local's nginx terminates TLS for `api.anthropic.com` on 443 (loopback only) and proxies to the OmniRoute MITM on `127.0.0.1:8443`.
- "OmniRoute MITM CA" added to the System keychain as trusted for SSL (valid 2026-10-02 to 2036-10-02); files in `~/.omniroute-local/mitm/`.
- Service plist env added: `NODE_OPTIONS=--require=~/.omniroute-local/bridge-upstream-dns.cjs` (resolves `api.anthropic.com` through 8.8.8.8 / 1.1.1.1 so the service itself still reaches the real API), `MITM_*`, `NEXALANCE_AGENT_BRIDGE_*` (agent `claude-code`, port 8443, selected only), `INSPECTOR_INTERNAL_INGEST_TOKEN`. The service was restarted at 08:05.

Effect:
- Claude Code traffic on this Mac now goes through OmniRoute's MITM. Stats at 08:20: 82 requests, 13 intercepted, so some requests may be served by providers other than Anthropic.
- Claude Code's Node does not trust the CA, which explains the `SELF_SIGNED_CERT_IN_CHAIN` error the owner saw.

This session did not change or undo any of it. It only made `omni-ctl` keep foreign plist env keys when it rewrites the plist (tested on a scratch copy: the rewritten plist equals the live one).

---

## 10. Commits and refs made in this session

| Repo / ref | Commit | What |
|---|---|---|
| fork `nexalance` | `c7eb5ea74` | overlay updated to v3.8.51 (19 patches dropped, 19 re-cut) |
| fork `nexalance` | `b2694cc03` | `AUTO_UPDATE_MODE=command` overlay patch + tests |
| fork `nexalance` | `01dcc9ff4` | overlay engine: `checkPatches` catches 3-way conflicts |
| fork `upstream-main` | `c1e30b767` | fast-forwarded to upstream v3.8.51 |
| fork `feat/auto-update-command-mode` | `8858b9d42`, `d1fe09dac` | PR #15321 (feature, changelog fragment) |
| local tags | `nexa-preupdate-20261002`, `nexa-prelease-20261002-065555` | rollback anchors, not pushed |

Nothing was pushed to `diegosouzapw/OmniRoute` except the PR itself, which was opened from the fork.

---

## 11. 2026-10-03 follow-up: quota recovery deployed and native tests passed

Latest verified state ebong detailed report: [HANDOFF-OMNIROUTE-2026-10-03-QUOTA-RECOVERY.md](HANDOFF-OMNIROUTE-2026-10-03-QUOTA-RECOVERY.md).

- Runtime/source `f77079418`, OmniRoute `3.8.51`, managed promotion completed 00:33:53 Asia/Dhaka; source fork push complete.
- Claude known quota walls actual reset porjonto skip hoy. Reset-e usage verification, bounded retry, startup hydration ebong scoped quota protection `nexa/` child overlay-te stored.
- Cached quota filtering ON, per-request preflight OFF. Duita connected Claude account active; weekly-exhausted account skip hoy, eligible sibling response dey.
- Actual native CLI Opus `1m` ebong Sonnet concurrent requests PASS. Native Claude.app Code tab response PASS; existing rate-limited `Hello` chat retry-e response completed.
- Managed gate: Bridge 553, UI 21, native fidelity 72, security 34, deployment helpers 23 PASS. Full type ratchet 5830 baseline unchanged, not skipped.
- Complete bounded production build PASS, observed peak 5730 MiB under 8192 MiB sampled RSS cap. Completed owned build/smoke files ebong obsolete unpromoted candidate cleanup done; current package/immediate rollback retained.
- Ager source reconciliation/promotion/native-response open items ei follow-up-e resolved. Historical section 3.9, 6, 8 ebong 9-er descriptions point-in-time history; current state-er jonno new handoff dekha necessary.
- Live quota worker startup verified. Usage endpoint independent 429 thakte pare; future October 6 weekly reset-er successful live recovery ekhono elapsed/tested hoyni. Regression coverage ebong actual native response evidence alada kore report kora ache.

Future upstream/native version compatibility ba full-Mac reboot ei pass-e test kora hoyni. Managed updater compatibility gates continue korte hobe; current successful deployment unlimited provider quota claim noy.


## 12. 2026-10-03 follow-up: coding quality ebong maximum-context configuration

Detailed current configuration, exact changes, native test evidence ebong limits: [HANDOFF-OMNIROUTE-2026-10-03-CODING-QUALITY.md](HANDOFF-OMNIROUTE-2026-10-03-CODING-QUALITY.md).

Thinking passthrough explicitly saved; usage buffer zero; combo reasoning-budget rewrite off; independent MCP output trimming ebong gateway Skills injection off. Exact response-cache runtime flag-o cache master-off policy-r sathe align kora hoyeche. Prompt-prefix caching, native effort, selected model, rolling session affinity ebong actual exhausted-account recovery retain kora hoyeche.

Parallel native Opus 5.5 [1m] xhigh ebong Sonnet 5.5 high Read tests passed; both model metadata 1M context / 128k max output. Existing Desktop Code session-e tool response ebong final-settings follow-up passed. Existing user traffic-e ~847k logged input context-er Opus request 200 observed. Saved-setting 14 checks ebong live Bridge TLS/DNS/ingress gate passed; Bridge PID unchanged. Ei pass-e rebuild ba service restart kora hoyni; runtime f770 unchanged.

Provider Thread mismatch retry telemetry observed ebong 24-hour soak/full-window saturation benchmark kora hoyni. Ei tests-ke 100% error-free future compatibility ba raw model-er cheye proven coding-quality improvement bola hoyni.


<!-- handoff-consolidation-2026-10-03 -->

## 13. Consolidated complete work record, 2026-10-03

Ei setup-e kora sob phase-er consolidated handoff: [HANDOFF-OMNIROUTE-2026-10-03-CONSOLIDATED.md](HANDOFF-OMNIROUTE-2026-10-03-CONSOLIDATED.md). Read section 1 first; detailed historical files-er index section 16-te, private evidence section 17-te.

- Setup, original native account path, approved CA/hosts, native ingress, Start/Stop and default fallback.
- ECONNREFUSED, duplicate 8443/PID/lifecycle, launchd bootstrap, stream/DNS isolation, count/headers, thread/cache and legacy-model compatibility fixes.
- Local by Flywheel coexistence, actual client DNS checks and durable nexa support.
- Native text/tool fidelity, exact model/context settings, automatic exhausted-account schedule and final f770 deployment.
- Multiple sessions, resume/cancellation, native Agents, latest CLI/Desktop Read tests, build memory/storage results and retained rollback.
- Remaining provider/protocol/24-hour/new-reboot/scheduled-feature gaps, current update gates and public contribution ownership.

Last recorded runtime 3.8.51/f77079418; documentation pass-e source HEAD and installed BUILD_SHA match, checkout clean. Previous test evidence reviewed; ei pass-e tests/build/service change repeat hoyni. Earlier PR workflow sections historical: user-er latest rule public PR/issue action designated nexa-media owner session-er, help findings/patch oss-contrib/inbox-e hand over kore stop. Owner Jillur Rahman alone.

<!-- claude-quota-full-solution-2026-10-04 -->

## 14. Complete solution, 2026-10-04

Documentation integration: 2026-10-04T21:34:37+06:00. Nicher 21-ti subsection-e completed solution ebong accepted evidence purotai jukto ache. Runtime/test timestamps original receipts-er; documentation save-er time-ke notun test result bola hoyni.

### 1. Final result

Claude Opus 5.5-er available account-ke cached quota state diye bhul HTTP 429 dewar bug fix kora hoyeche. Fix-ta `nexa/` overlay-te commit kora, bounded production package build kora, isolated runtime-e test kora ebong live OmniRoute-e deploy kora hoyeche. Native Claude Desktop-er Code session, native Claude CLI, parallel JSON/SSE requests ebong controlled OmniRoute service restart-er verification pass koreche.

Eta local usage budget off korar setup. Actual Anthropic quota, throughput limit ba service outage-ke unlimited kore dewar setup noy. Ei run-er accepted tests current version-er tested workflow-er evidence; 24-hour soak ba future version-er guarantee noy.

Ei section-e dated solution-er puro record jukto kora holo; main handoff-er ager history preserved ache. `OMNIROUTE-GPT-6.1-SOL-SUPPORT-2026-10-04.md`-er install-pending state ei report-er deployed package ebong live GPT tests diye superseded.

### 2. Root cause: critical alert ar actual exhaustion ek noy

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

### 3. Connected Claude pool

Emails, OAuth tokens ebong API keys ei report-e nei. Account duita anonymous label diye identify kora holo.

| Account | Routing priority | Acceptance test-er quota | Reset shown by provider, Dhaka time |
| --- | --- | --- | --- |
| Available Claude Max | 1 | Session 94% left; weekly 10% left | Weekly 2026-10-04 prai 23:00 |
| Actually depleted Claude Max | 2 | Session 100% left; weekly 0% left | Weekly 2026-10-06 prai 09:00 |

Final browser observation-e available account-er session 89% left ebong weekly 9% left dekhachhilo. Eta ongoing usage-er change; test receipt-er 10% left ekta ager point-in-time reading.

Actually depleted account-er session balance thakleo exhausted global weekly allowance reopen hoy na. Duita connection active rakha ache; available account age select hoy. Exhausted account-er preferred connection hint thakleo unrestricted pool request healthy sibling-e fallback korte pare.

### 4. Fix-er exact behavior

Shared predicate `isBlockingClaudeQuotaWindow` reported positive remainder thakle critical warning-ke pre-dispatch block bole dhore na. Ekhon 90%, 99% ebong 99.9% used-er known positive balance available thake.

Global session/weekly window ebong model-scoped weekly window dui path-ei same predicate use hoy. Actual zero-remainder blocking window provider reset porjonto parked thake. Percentage report na kora active critical window-er existing conservative interpretation rakha ache; missing telemetry theke allowance invent kora hoyni.

Actual upstream HTTP 429 ashle existing error classification, retry/reset evidence ebong cooldown handling intact thake. Pre-dispatch critical alert-er sathe actual rejected upstream request-ke ek kora hoyni.

### 5. Automatic refresh ebong exhausted account scheduling

Backend quota refresh timer prai proti minute tick kore. Available entry normal prai five-minute usage-refresh cadence use kore. Known exhausted global window-er reset-er age repeated periodic usage probes-er dorkar hoy na; reset due hole usage read schedule hoy. Multiple global walls thakle sob wall clear howar time consider hoy; independent model scopes aladabhabe recover korte pare.

Refresh failure ba stale reset still active thakle bounded retry cadence use hoy. Service startup durable snapshots theke Claude quota state hydrate kore, jate restart-er poreo exhausted account abar blindly use na hoy.

Dashboard-er `autoRefreshProviderQuota=false` optional browser UI polling setting. Eta backend quota scheduler bondho kore na. Stored UI interval 180 seconds; backend scheduling alada.

Ei run-e future real reset porjonto live wait kora hoyni. Reset scheduling, positive-balance refresh ebong restart hydration regression tests diye verify kora hoyeche; post-restart real request-o successful.

### 6. Final local limit configuration

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

### 7. Coding quality ebong context policy

Claude route-e thinking budget `passthrough`, `usageTokenBuffer=0`, semantic cache OFF, injected memory OFF, custom system prompt OFF ebong Claude system-transform pipeline disabled/empty ache. Client-er model/effort request-ke ei quota fix diye lower tier-e force kora hoyni.

Native Desktop test-e Opus 5.5, Extra effort ebong displayed context `110k / 1M` chhilo. Eta existing context-bearing session-er continuation-er real evidence; full 1M context load stress test noy. Quota fix context truncate/compress korar feature add kore na.

Image experiment key-r model/endpoint policy unchanged. Sei key-r existing compression flag-ke Claude route-er quality setting bole dhora hoyni. Whole gateway sob model-er every transformation byte-for-byte identical, ba native output-er cheye guaranteed better, emon claim ei report kore na.

### 8. Source ebong durable overlay

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

### 9. Production build protection

Production build wrapper explicitly contributor/backend-only flags clear kore. Quota page-er client chunk-e actual quota controls ebong Agent Bridge page-er chunk-e real state API integration thaka mandatory. Null-page dashboard stub ba missing manifest/chunk package gate pass korte pare na.

Build budget: one worker, 6 GiB heap/RSS guard, reduced scheduling priority. Actual observed build process-group peak `5,268 MiB`, prai `5.14 GiB`, configured RSS limit `6,144 MiB`. Budget guard production build terminate koreni. Full dashboard build-e 620 static routes generate hoyeche. Electron ba Docker build kora hoyni.

Core typecheck pass. Full-project TypeScript ratchet measured 5,830, accepted existing baseline 5,830; eta zero overall upstream TypeScript diagnostic-er claim noy. Packaged Bridge contract, dashboard control gate ebong live requests verify kora hoyeche.

### 10. Accepted regression gates

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

### 11. Isolated package acceptance

Separate data directory, SQLite clone ebong random HTTP port use kora hoyechhilo. Isolated package auto-start diye live MITM routing change koreni. Final accepted receipt `10/10` cases pass:

- Available critical Opus request HTTP 200.
- Pool streaming request HTTP 200, text reconstruct hoyeche ebong `message_stop` complete.
- Six simultaneous JSON/SSE requests sob HTTP 200, elapsed prai 1.54-2.09 seconds.
- GPT 6.1 Sol max regression HTTP 200.
- Actually depleted account-only isolated key-e cached HTTP 429 in 13 ms, upstream attempt chara. Eta expected pass: known exhausted account-e repeated doomed requests pathano hoyni.

### 12. Live Claude acceptance

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

### 13. Restart durability verification

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

### 14. GPT 6.1 Sol integration-o deployed

Previous model-support overlay ei package-e included. Live integrated `6/6` checks pass: `codex/gpt-6.1-sol` low, `cx/gpt-6.1-sol` max, `gpt-6.1-sol-ultra` SSE, existing `codex/gpt-6-astra`, existing Claude Opus ebong native Codex CLI.

Native CLI response: `GPT61_PRODUCTION_NATIVE_CLI_OK`. Catalog-e 21 relevant aliases/effort entries ebong configured 872,000 maximum input/context metadata verify kora hoyeche. Eta 872K full-load stress result noy. Temporary provider client-version/User-Agent overrides remove kora hoyeche; compiled defaults use hoy. Image experiment key-r permissions unchanged.

### 15. Package, deployment ebong rollback evidence

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

### 16. Space cleanup

Only generated build paths age list/check kora, retained package-er BUILD_ID/hash match kora ebong live process/pointer overlap reject kora hoyeche. Tarpor ei duita task-er `.build`/`dist` ebong superseded isolated runtime output remove kora hoyeche. Source worktrees, dependencies, verified archives, live data, previous runtime ebong rollback database retained.

Reclaimed: 8.83 GiB. Cleanup receipt-er free disk space: 26.21 GiB. Next full-build 24 GiB space guard pass; installer-er separate lower guard-o ache. T7 originals, reports, source ba user data delete/overwrite kora hoyni.

### 17. Investigation corrections ebong known diagnostics

Acceptance harness-er first iteration-e preferred exhausted connection-ke hard pin dhora hoyechhilo; actual product policy healthy sibling fallback allow kore. Exhausted-only behavior validate korte only isolated cloned key-r connection permissions restrict kora hoy. Production key-r permissions change kora hoyni.

Key update endpoint `PATCH`, `PUT` noy. SSE marker multiple deltas-e split hote pare; final parser text reconstruct kore complete message boundary verify kore. Earlier unsuccessful harness receipts retained ache; final accepted receipt-e `ok:true` ebong 10 cases pass.

Ekta pre-restart monitoring poll 10-second timeout korechhilo. Tarpor healthz successful ebong subsequent monitoring/restart acceptance pass hoyeche. Ei transient poll-ke never-failing 24-hour health proof bola hoyni.

### 18. Future update rules

Local update build-e `nexa/` overlay reapply, patch drift validation, bounded resources, space guard, typecheck/ratchet, Bridge/protocol/security tests ebong packaged full-dashboard gate maintain korte hobe. New package live promote-er age separate data/ports diye acceptance run, then native request ebong restart checks dorkar.

Eta runtime-only handwritten fix noy; normal overlay build-e fix ebong regression test included. Upstream payload/API/client protocol change hole gate ba live test failure update stop korbe. Future provider change test chara automatically compatible, ba native app-er every future feature guaranteed same, emon promise kora jay na.

### 19. Troubleshooting interpretation

Critical badge sathe positive quota: fixed runtime-e account selectable. Warning label matro routing stop korar karon noy.

Known zero global allowance: account provider reset schedule-e parked. Onno available connection thakle pool use hoy. Sob connection genuinely exhausted hole cached 429 expected; eta local arbitrary usage cap noy.

Actual upstream 429: provider request reject korechhe. Usage screen-e allowance thakleo independent throughput/short-window restriction thakte pare. Sei evidence alada kore inspect korte hobe. Retry hints/error reset data-ke unlimited promise diye suppress kora hoyni.

Issue fire ashle timestamp, model, selected connection label ebong upstream-attempt/no-upstream distinction collect korun. Native account logout, app reinstall, certificate validation OFF ba repeated blind rebuild first troubleshooting step noy.

### 20. Evidence index ebong acceptance boundaries

Evidence folder:

```text
~/Documents/Codex/2026-10-04/omniroute-claude-quota-recovery
```

Main receipts: `validation-summary.json`, `final-limits-audit.json`, `production-package-build.log`, `focused-final.log`, `isolated-runtime-tests.json`, `production-deployment.json`, `production-claude-tests.json`, `native-desktop-success.json`, `native-desktop-success.png`, `quota-cutoffs-zero.png`, `production-model-tests.json`, `restart-verification.json`, `generated-output-cleanup.json`.

Machine-readable final validation summary (স্থানীয় বা private reference; প্রকাশিত নয়).

Not tested in this run: 24-hour soak, full 1M/872K context stress, Mac reboot, future app/provider releases, future real quota reset wait, live rollback drill, every native feature/effort/model combination. Six concurrent short requests ebong two concurrent native CLI sessions successful; arbitrary large concurrent jobs-er resource/performance guarantee noy.

### 21. Related existing handoffs

- `HANDOFF-OMNIROUTE-2026-10-02.md`: original setup/update design.
- `HANDOFF-OMNIROUTE-2026-10-03-CONSOLIDATED.md`: previous consolidated state.
- `HANDOFF-OMNIROUTE-2026-10-03-QUOTA-RECOVERY.md`: prior quota behavior; current alert/exhaustion correction ei supplement-e.
- `HANDOFF-OMNIROUTE-2026-10-03-CODING-QUALITY.md`: quality/context policy.
- `OMNIROUTE-GPT-6.1-SOL-SUPPORT-2026-10-04.md`: previous GPT support evidence; production deployment ekhon complete.

Existing handoff-gulo history hisebe preserved. Ei dated supplement-e current deployed state ebong actual test evidence ek jaygay ache.


<a id="handoff-2026-10-06"></a>

## 2026-10-06: multi-account quota, Cost Analyzer এবং source cleanup

রক্ষণাবেক্ষণ: Jillur Rahman। এই section আগের deployed ফলের পরবর্তী বর্তমান অবস্থা; পুরোনো history অপরিবর্তিত।

সম্পূর্ণ বাংলা report: [OMNIROUTE-CLAUDE-QUOTA-AND-CLEANUP-2026-10-06.md](OMNIROUTE-CLAUDE-QUOTA-AND-CLEANUP-2026-10-06.md)। Machine-readable evidence: final-validation-summary.json (স্থানীয় বা private reference; প্রকাশিত নয়)।

- পুরোনো false cached exhaustion-এর নতুন কারণ isolated test-এ পাওয়া গেছে: usable account-এ upstream 502/520-এর পরে request-level exclusion-কে whole-pool exhaustion ধরে নেওয়া। Fix `nexa/patches/src__sse__services__auth.ts.patch`-এ। Available authorized sibling থাকলে মূল upstream error অক্ষত থাকে বা অন্য usable sibling নির্বাচিত হয়।
- 2, 3 ও 5 distinct account, 1% remaining allowance, exhausted forced pin, 20 concurrent selections, earliest reset, confirmed quota recovery ও API-key allowlist পরীক্ষা হয়েছে। Expanded suite-এ 17টি case পাস। বাস্তব live pool এখনও দুই account; পাঁচ real subscription account-এর live test হয়নি।
- 2026-10-06 10:34 বাংলাদেশ সময়ের snapshot-এ incident সত্যিকারের provider exhaustion: account 1 weekly 0%; account 2 session 0%, weekly 73%। দ্বিতীয়টির provider-reported reset 2026-10-06 14:00 বাংলাদেশ সময়। এটি তখনকার reset hint; নির্ধারিত সময়ের পরে allowance ফিরে এসেছে দাবি করা হয়নি। Fresh allowance নিশ্চিত হওয়ার আগে optimistic activation নয়।
- `Cached quota filtering` diagnosis-এ সাময়িক OFF, এরপর genuine exhaustion নিশ্চিত করে আবার ON; UI ও database-এ saved। Per-request quota preflight OFF, default cutoff 0, current key-এর local USD/token/request/session budget cap নেই। Paid extra usage protection retained।
- Cost URL পুরোনো `local-default` key-তে filtered ছিল; তার শেষ request Oct 4। Current native traffic `Nexa-Skill-Family-Key`-তে। Browser all-key view-এ নতুন usage দেখা গেছে। নতুন source-এ 30-second visible polling, Refresh, selected key label/all-key link, abort/stale-filter protection ও unsaved quota-edit preservation আছে। Old component-এ দুই case ব্যর্থ, fixed component-এ পাস। Subscription estimate actual paid bill নয়। নতুন UI এখনও live deploy হয়নি।
- Core typecheck ও focused Cost ESLint পাস। Backend/Bridge 576, UI 36, deployment guard 43, protocol/security 106: মোট 761 test execution পাস। Full TypeScript ratchet অসম্পূর্ণ। নতুন final compiler attempt actual RAM preflight-এ exit 75; compiler শুরু হয়নি।
- Source `a15864e120e58f5f2c5a82fe46e974c3bfc30952`, branch `nexalance`, clean ও upstream base pristine। Manifest 115 items: 74 patch, 39 new, 2 tooling। 74 patch apply check পাস। সব customization `nexa/`-তে; public push/PR/issue করা হয়নি।
- RAM guard physical free/inactive/speculative page হিসাব করে; user apps-এর 10 GiB reserve ও পূর্ণ job budget লাগে। Pressure warning/critical, low headroom, swap growth ও low disk-এ শুধু নিজস্ব build process group থামে। Missing/crashed/partial TypeScript measurement production gate পাস করতে পারে না। User apps বা unrelated job বন্ধ করা হয়নি।
- **নতুন package build/deploy হয়নি।** Current package এখনও `3.8.51-79412f0ec/omniroute-3.8.51.tgz`; previous/rollback pointer retained। Full ratchet, production build, packaged dashboard gate, isolated smoke এবং promotion/native/restart acceptance বাকি। শেষ verification-এর internal free প্রায় 23 GiB; updater build disk prerequisite 24 GiB। পরের build-এর আগে live RAM/disk আবার যাচাই করতে হবে।
- Quota থাকার সময়ে native single CLI, তিন concurrent CLI session এবং desktop Code response সফল হয়েছে। এগুলো current installed package-এর test; undeployed source-এর live acceptance নয়। 24-hour soak, full-context stress, Mac reboot ও real future reset পরীক্ষা হয়নি।
- চার inactive checkout T7 backup-এ SHA-verified archive, 96,151 file verified; main/dependencies/runtime/data retained। Original checkout removal-এ প্রায় 2.16 GiB এবং পরবর্তী quota-fix worktree cleanup-এ প্রায় 0.71 GiB observed free-space বৃদ্ধি। Branches ও partial-clone local Git metadata আছে; full historical Git bundle নেই।
- দুই নিজস্ব fix worktree merge/source verification-এর পরে সরানো; cost worktree-এর 24,047 tracked file main-এর সঙ্গে matched। Shared dependencies retained। 33-byte incomplete-build log preserve করে obsolete directory এবং 60 task-created fixture/cache root সরানো হয়েছে। Successful outputs ও rollback files retained।
- Latest source backup `nexa-overlay-a15864e12.tar`: 182 tracked overlay file read-back hash verified। Five-commit recovery patch, screenshots, logs ও receipts একই backup folder-এ। আগের T7 archives overwrite করা হয়নি।
- 2026-10-06 final receipt-এর live checks: দুই health endpoint HTTP 200; Bridge 8443 সচল; native 443-এ CA/hostname-verified TLS এবং native hostname DNS localhost। আট protected non-overlay file hash unchanged। Official native app/account login/CA trust/Local configuration edit করা হয়নি। এই documentation pass-এ live request পুনরায় চালানো হয়নি।
- ওই verification-এর আগের 8 ঘণ্টার retained OmniRoute Claude logs-এ Fable `model` বা `requested_model` পাওয়া যায়নি। Provider-এর অন্য product/accounting usage সম্পর্কে এই সীমিত evidence থেকে সিদ্ধান্ত নেওয়া যাবে না।
- Routing priority analysis-এর জন্য `call_logs.connection_id JOIN provider_connections.priority` ব্যবহার করা হয়েছে। `account_label_priority` display metadata; পুরোনো exploratory receipt-এর বদলে `live-routing-verification-corrected.json` ব্যবহার করুন।

পরে resources যথেষ্ট হলে normal isolated `omni-ctl build-only`/`redeploy` flow দিয়ে mandatory gates পাস করে promote করতে হবে। Account-এর quota শেষ হলে reset বা অন্য eligible same-model capacity প্রয়োজন; local unlimited configuration provider quota বাড়ায় না।

### পরের session-এর কাজের ক্রম

1. T7 mounted, main source `a15864e12` বা তার যাচাইকৃত successor, clean `nexalance` এবং active worktree তালিকা মিলিয়ে নিন। Installed `dist/BUILD_SHA` ও package receipt আলাদাভাবে পড়ুন; source HEAD দেখে নতুন deployment ধরে নেবেন না।
2. Live memory pressure, physical headroom, swap ও internal disk মাপুন। User apps-এর জন্য 10 GiB reserve-এর সঙ্গে পুরো job budget লাগবে। 4 GiB compiler job-এর আগে অন্তত 14 GiB physical headroom এবং updater build-এর আগে অন্তত 24 GiB internal free প্রয়োজন। Heavy jobs sequential; user apps বন্ধ করে room তৈরি নয়।
3. Versioned [deployment guide](README.md) অনুযায়ী `omni-ctl build-only` ব্যবহার করুন। Entry point যেন canonical `nexa/deploy/omni-updater.sh` stage করে এবং নতুন physical-memory/measurement safeguards ব্যবহার করে তা আগে মিলিয়ে নিন। এই command live promotion করে না।
4. Core typecheck, সম্পূর্ণ measured TypeScript ratchet, regression suites, release package/dashboard/Bridge contract এবং cloned-data isolated smoke সব পাস হওয়া পর্যন্ত candidate গ্রহণ নয়। Missing measurement, crash, signal বা resource-preflight exit 75 পাসের ফল নয়; পুরোনো 5,830 baseline দিয়ে নতুন measurement বাদ দেওয়া যাবে না।
5. Provider allowance fresh evidence দিয়ে নিশ্চিত করুন। 2/3/5 account-এর fixtures পাস হলেও পাঁচ বাস্তব account যুক্ত আছে ধরে নেবেন না। Actual all-exhausted state-এ provider reset schedule বজায় রাখুন; paid extra usage protection অথবা নির্বাচিত model পরিবর্তন করে success দেখাবেন না।
6. সব gate green হলে rollback prefix ও consistent database snapshot রেখে normal `omni-ctl redeploy` flow-তে promotion করুন। User-এর active session চলার সময় service interruption এড়াতে idle verification প্রয়োজন। CLI, Desktop, parallel/resume/cancellation, live routing logs, certificate-verified ingress এবং service restart পরীক্ষা করে নতুন package-এর acceptance আলাদাভাবে লিখুন।
7. New Cost Analyzer-এর current-key ও all-key view, fresh usage/cost, background Refresh এবং unsaved quota-edit behavior যাচাই করুন। পুরোনো key-তে নতুন key-এর traffic বসাবেন না; subscription estimate ও paid bill আলাদা রাখুন।
8. নতুন source/package SHA, build resource peak, exact test receipts, live setting snapshot, native acceptance, rollback path ও unresolved gaps এই handoff-এ dated addition হিসেবে লিখুন। 24-hour soak, full-context stress, reboot, future provider/native release বা বাস্তব quota-reset wait পরীক্ষা না হলে সেগুলো verified লিখবেন না।

### Source commits ও artifact index

Base `79412f0ec` থেকে পাঁচটি local commit retained:

| Commit | পরিবর্তন |
| --- | --- |
| `19bb33bc2` | Upstream failure-এর পরে false whole-pool cached exhaustion classification correction |
| `06a5a6722` | Missing/incomplete full TypeScript measurement-এ gate failure নিশ্চিত |
| `e5711fd72` | Compiler memory profile ও completed-process cleanup |
| `e67dc1898` | Physical-memory budget ও pressure watchdog |
| `a15864e12` | Cost Analyzer refresh ও expanded multi-account regression |

Backup root: `backup/omniroute-worktrees-2026-10-06-092216/`। নিচের files একই root-এ আছে; archive extract বা source restore প্রয়োজন হলে প্রথমে hash verification এবং খালি isolated destination যাচাই করতে হবে। Main source উপস্থিত থাকলে অপ্রয়োজনীয় restore নয়।

| Artifact | ব্যবহার |
| --- | --- |
| final-validation-summary.json (স্থানীয় বা private reference; প্রকাশিত নয়) | Source, 761 test execution, live snapshot ও pending gates |
| nexa-overlay-a15864e12.tar (স্থানীয় বা private reference; প্রকাশিত নয়) | 182 tracked overlay file-এর hash-verified copy |
| quota-cost-update-a15864e12.patch (স্থানীয় বা private reference; প্রকাশিত নয়) | Base থেকে পাঁচ source commit-এর recovery patch |
| SOURCE-UPDATE-SHA256SUMS-2026-10-06.txt (স্থানীয় বা private reference; প্রকাশিত নয়) | Supplement artifacts-এর SHA-256 verification |
| quota-cost-source-recovery-a15864e12.json (স্থানীয় বা private reference; প্রকাশিত নয়) | Source archive/evidence size ও content hashes |
| [RESTORE-FINAL.md](backup/omniroute-worktrees-2026-10-06-092216/RESTORE-FINAL.md) | মূল চার archived checkout-এর recovery |
| [RESTORE-QUOTA-COST-UPDATE-2026-10-06.md](backup/omniroute-worktrees-2026-10-06-092216/RESTORE-QUOTA-COST-UPDATE-2026-10-06.md) | Latest source recovery, final ON setting ও release boundary |
| cleanup-receipt.json (স্থানীয় বা private reference; প্রকাশিত নয়) | মূল checkout archive/cleanup verification |
| fix-worktree-cleanup-receipt.json (স্থানীয় বা private reference; প্রকাশিত নয়), cost-worktree-cleanup-receipt.json (স্থানীয় বা private reference; প্রকাশিত নয়) | দুই নিজস্ব fix worktree ও task-created fixture cleanup |
| bridge-cost-multi-account-final.log (স্থানীয় বা private reference; প্রকাশিত নয়), core-deploy-security-final.log (স্থানীয় বা private reference; প্রকাশিত নয়) | সর্বশেষ passing regression/core logs |
| cost-before-fix.log (স্থানীয় বা private reference; প্রকাশিত নয়), cost-ui-final-regression.log (স্থানীয় বা private reference; প্রকাশিত নয়) | Cost UI-এর reproduced failure ও fixed regression evidence |
| ratchet-physical-budget-final.log (স্থানীয় বা private reference; প্রকাশিত নয়) | Compiler শুরু হওয়ার আগেই resource guard exit 75 |
| native-parallel-smoke.json (স্থানীয় বা private reference; প্রকাশিত নয়), native-desktop-smoke.jpg (স্থানীয় বা private reference; প্রকাশিত নয়) | Installed package-এর quota থাকা অবস্থার native evidence |
| live-routing-verification-corrected.json (স্থানীয় বা private reference; প্রকাশিত নয়) | প্রকৃত connection routing priority ও quota evidence |

Author ও committer Jillur Rahman; source customization `nexa/`-তে। Public upstream contribution ownership আলাদা থাকে। Sensitive database/OAuth/password/API-key value এই handoff-এ যোগ করা হয়নি।

---

<a id="deployment-preparation-2026-10-06"></a>
## 2026-10-06 বিকেল: production deployment প্রস্তুতি ও resource blocker

User নতুন source production-এ deploy করতে বলেছেন এবং RAM প্রসঙ্গে স্পষ্ট নির্দেশ দিয়েছেন: **সব apps খোলা থাকবে; কম RAM-এ সম্ভব কাজ চলবে।** এই নির্দেশ বহাল। Browser, native apps, অন্য কাজের service বা unrelated process বন্ধ করা হয়নি। Source fix ও deployment readiness-কে completed production promotion হিসেবে পড়া যাবে না।

### Source ও updater correction

Main clean/pristine `nexalance` এখন `a3571d5b29bf53e5fb4b23cbe43269596eb31122`। Commit `Keep gateway deployments local and preserve open desktop apps`-এ ছয়টি `nexa/` file বদলেছে। Jillur Rahman author/committer; remote push হয়নি।

- `nexa/deploy/deployment-policy.mjs`: default gateway update-এ Desktop artifact build এবং Desktop close/replace দুটিই false। `NEXA_BUILD_DESKTOP=1` artifact তৈরির opt-in; `NEXA_DEPLOY_DESKTOP=1` আলাদা promotion opt-in। শুধু build opt-in app বন্ধ করার অনুমতি নয়। Ambiguous flag value শুরুতেই rejected।
- `nexa/deploy/omni-updater.sh`: explicit policy অনুযায়ী Desktop কাজ gated; automatic Git push সরানো। Native Claude app bundle বদলায় না।
- `nexa/deploy/build-candidate.sh`: নতুন ছয়-case policy suite mandatory gate-এ যোগ। `nexa/deploy/README.md` updated; manifest 116 item: 74 patch, 40 new, 2 tooling।
- Main-এ fast-forward landing-এর আগে নিজস্ব worktree ব্যবহার হয়েছে। Main pristine check, diff whitespace check, shell syntax এবং 74 patch applicability পাস।

নতুন policy/gate targeted run: 15/15 execution পাস, fail/skip/cancel শূন্য, total job peak 105 MiB। এর মধ্যে ছয়টি নতুন policy case; বাকিগুলি existing candidate/ratchet guards-এর rerun। আগের 761 test execution-এর সঙ্গে এগুলো যোগ করে নতুন full-suite acceptance দাবি নয়।

### Resource-safe cleanup

নিচের exact obsolete path-এর কোনো active runtime/service/open handle reference পাওয়া যায়নি। Current/previous package, immediate prior rollback, live data, root helper, native settings ও shared dependencies protect করে archive/read-back hash verification করা হয়েছে।

| পুরোনো internal path | যাচাইকৃত T7 artifact | Verified entries |
| --- | --- | ---: |
| `~/.omniroute-builds/runtime-backups/20261003-002337` | `20261003-002337.tar` | 147713 |
| `~/.omniroute-builds/smoke-gpt-6-1-sol-20261004` | `smoke-gpt-6-1-sol-20261004.tar` | 40 |
| `~/.omniroute-builds/smoke-claude-quota-20261004` | `smoke-claude-quota-20261004.tar` | 33 |

Artifact root: `backup/omniroute-production-deploy-2026-10-06/`। Streaming manifest/SQLite index দিয়ে archive contents, file hashes, links ও entry counts যাচাই হয়েছে; originals এরপরই internal disk থেকে সরানো হয়েছে। Remove interval-এর observed free-space increase 3,617,525,760 bytes = প্রায় 3.37 GiB। তখন internal free 24.47 GiB; অন্য apps-এর পরবর্তী I/O-এ latest receipt-এ প্রায় 23.19 GiB হয়েছে। 24.47 GiB-কে permanent/current value ধরা যাবে না।

Archive verification worker peak 53 MiB এবং removal worker peak 54 MiB। প্রথম full-memory-index attempt RSS 432 MiB-এ 384 MiB budget ছাড়িয়ে guard-এ থেমেছিল; originals তখন অক্ষত। Complete archive checkpoint reuse করে streaming verifier চালানো হয়েছে; T7 archive duplicate/overwrite হয়নি। প্রথম low-budget worktree creation-ও guard-এ থেমেছিল; পরের bounded setup peak 328 MiB-এ সফল। সব interrupted attempts receipt-এ আছে।

Immediate previous runtime `runtime-backups/20261004-151007-claude-quota` এবং current/previous TGZ retained। Protected settings/helper/package-pointer hashes matched; removal-এর আগে/পরে দুই health endpoint HTTP 200। কোনো live database history বা source file cleanup হয়নি।

### Compiler attempt ও deployment boundary

নিজস্ব `deploy-resource-safety-2026-10-06` worktree-এ main-এর dependencies hard-linked হয়েছে; নতুন dependency install হয়নি। Overlay apply peak 55 MiB। পুরোনো archived TypeScript 6.0.3 `tsconfig.tsbuildinfo`-এর SHA-256 যাচাই করে ওই এক cache file reuse করা হয়েছে। Current compiler unchanged full `tsconfig.json` scope-এর file versions ও diagnostics যাচাই করে; পুরোনো error count গ্রহণ করা হয়নি।

Full ratchet attempt: heap 1024 MiB, total process RSS budget 1280 MiB, peak 1113 MiB। Result `tscErrors=SKIP reason=tsc-signal-SIGABRT`, exit 75। **এই attempt পাস নয়।** Full numeric measurement পাওয়া যায়নি। এরপর MDX inputs generation peak 153 MiB-এ সফল; পরের full ratchet ওই generated inputs নিয়ে চলবে। একই incomplete 1 GiB profile অপরিবর্তিতভাবে বারবার চালানো যাবে না।

Latest saved resource receipt-এ physical headroom প্রায় 9.70 GiB, internal free 23.19 GiB, pressure normal; আগের checks-এ warning ছিল। Full default candidate RSS budget 8 GiB; guard user apps-এর 10 GiB reserve যোগ করে 18 GiB physical headroom চায়। Low-memory compiler profile-এর জন্যও reserve + পুরো নির্ধারিত RSS budget প্রয়োজন। Updater build disk gate 24 GiB। Warning/critical, headroom under 8 GiB, swap growth over 1 GiB বা disk under 15 GiB হলে শুধু current-task job stop হয়।

Validation skill-এর explicit gate: **“NEVER deploy without the validation gate green”**। Source: [nexa-overlay/SKILL.md](../../../nexa/skill/nexa-overlay/SKILL.md)। Full ratchet, full-dashboard package, packaged contract এবং isolated smoke অসম্পূর্ণ থাকায় live prefix promotion হয়নি। Ratchet baseline বৃদ্ধি, dashboard বাদ, backend-only package, direct runtime edit বা resource guard bypass দিয়ে deployment সম্পূর্ণ দেখানো হয়নি।

### Fresh live state

- Installed `dist/BUILD_SHA`: `79412f0ec`; source `a3571d5b2` installed নয়। Runtime version `3.8.51`।
- `http://omni.local/healthz` এবং `http://127.0.0.1:28128/healthz`: HTTP 200। Native ingress CA/hostname-verified TLS ও Bridge health contract পাস। শুধু transport health; নতুন-package inference acceptance নয়।
- Database-এ এখন তিন active Claude connection। Priority 2-এর 14:10:49 বাংলাদেশ সময়ের usage snapshot-এ session 99%, weekly 73%, Fable 100% remaining; session reset 19:00 বাংলাদেশ সময়। অন্য দুটি connection-এর weekly allowance 0%। Retained snapshot নিজস্ব timestamp অনুযায়ী পড়তে হবে; নতুন native completion এই pass-এ করা হয়নি।
- Manual quota/settings/account-login mutation হয়নি। User apps খোলা। Live service restart, rollout অথবা post-rollout native/parallel/restart test হয়নি।

### Resume ও recovery

1. Main SHA/clean/pristine state, installed SHA, own worktree ownership এবং fresh RAM/pressure/swap/internal disk মাপুন। User-এর সব apps খোলা রাখার নির্দেশ বহাল। T7 mounted/free space-ও যাচাই করুন; latest T7 free প্রায় 15 GiB, অতিরিক্ত বড় backup তৈরি নয়।
2. Prepared own worktree APPLIED আছে; source commit করার আগে `node nexa/restore.mjs` বাধ্যতামূলক। Main-এ development অথবা applied source commit নয়। Cache/MDX inputs already ready; duplicate checkout/dependency download/cache creation এড়ান।
3. Compiler budget সত্যিকারের headroom-এ fit হলে complete full-scope measured ratchet চালান। আগের numeric baseline দিয়ে failed measurement replace নয়। Then complete candidate gates এবং full-dashboard release/CLI/package policy। `omni-ctl build-only`/`redeploy` canonical source updater ব্যবহার করে; default Desktop operations off।
4. Package contract ও cloned-data isolated real-model smoke পাসের পরে fresh eligible allowance ও idle traffic নিশ্চিত করে snapshot/rollback সহ promotion। চলমান session-এর request মাঝপথে service বন্ধ নয়। নতুন runtime SHA যাচাই, native CLI/Desktop, parallel/resume/cancel, Cost Analyzer Refresh ও restart acceptance আলাদা receipt-এ লিখুন।
5. Source delta recovery: আগের a15864e12 archive/patch restore-এর পরে a3571d5b2 delta patch (স্থানীয় বা private reference; প্রকাশিত নয়) hash/check করে apply করুন। Main/source বর্তমানে intact হলে restore প্রয়োজন নেই। Archived historical runtime/smoke folders immediate rollout rollback হিসেবে ব্যবহার নয়।

Evidence: নতুন deployment receipt (স্থানীয় বা private reference; প্রকাশিত নয়), cleanup final receipt (স্থানীয় বা private reference; প্রকাশিত নয়), [resume/recovery guide](backup/omniroute-production-deploy-2026-10-06/DEPLOYMENT-RESUME-2026-10-06.md)। Credentials, password, token বা request contents এই handoff-এ রাখা হয়নি।

## 2026-10-06: Antigravity / AGY verification ও token refresh তদন্ত

সম্পূর্ণ তদন্ত, code change, validation এবং pending release ধাপ: [Google account health report](OMNIROUTE-GOOGLE-ACCOUNT-HEALTH-2026-10-06.md)।

20:16:56 বাংলাদেশ সময়ের snapshot-এ সব 14 connection-এর access-token expiry বৈধ, expiry fields mirrored এবং refresh credentials উপস্থিত। একাধিক connection-এর expiry automatic refresh-এ এগিয়েছে। Incident-এর 403 ছিল Google verification; 429 ছিল model quota। Token renewal successful হওয়া inference eligibility প্রমাণ করে না।

Live mitigation: verification 403 দেওয়া priority #4 Google identity-এর AGY ও Antigravity দুই connection dashboard-এ disable করা হয়েছে। আগের #7 disabled record অক্ষত; #1, #2, #3, #5, #6 সক্রিয়। Provider quota/context/model/অন্য account-এর configuration বদলায়নি। Normal Google verification প্রয়োজন; token refresh দিয়ে challenge কাটে না।

Active AGY #2-এর Retest HTTP 200; provider reset-এর পরে Flash quota 100% হয়েছে। ওই connection দিয়ে `antigravity/gemini-3.8-flash-high` real OmniRoute API request HTTP 200, completion `OK`, 4.08 seconds। এটি current runtime-এর এক ছোট inference success; নতুন source deployment বা পূর্ণ native/parallel/video acceptance নয়।

New private source commit **`892551a41`**, branch `fix/deploy-resource-safety-2026-10-06`, clean owned worktree। সব customization `nexa/`-এ। Verification-specific 403-এর refresh/retry বন্ধ, paired Google identity durable barrier, stale-probe-safe recovery এবং OAuth refresh-এ operator disable / quota / transport health preservation যোগ হয়েছে। Main এখনো `a3571d5b2`; installed runtime এখনো `79412f0ec`। নতুন commit main-এ integrate বা production-এ deploy হয়নি।

Validation: pristine base PASS; 79 patch apply check PASS; 14 isolated JavaScript policy checks PASS। Mocked Response / erased type annotations ব্যবহৃত, native TypeScript বা full Node suite নয়। 10 native regression test লেখা, তবে resource guard exit 75-এ child launch বন্ধ করেছে; peak 0 MiB। Full TypeScript/ratchet/package/smoke/post-deploy acceptance pending।

Latest resource receipt-এ pressure warning, headroom 4.92 GiB, swap 19.21 GiB, internal free 25.15 GiB। সব user apps খোলা আছে; heavy build হয়নি। Skill-এর **“NEVER deploy without the validation gate green”** instruction বহাল: [nexa-overlay/SKILL.md](../../../nexa/skill/nexa-overlay/SKILL.md)। পর্যাপ্ত headroom ও normal pressure হলে full gate, package, smoke, safe promotion এবং native/parallel/restart checks সম্পূর্ণ করতে হবে। আগের resource/disk sample ও APPLIED worktree status ঐতিহাসিক; এই commit-এর worktree এখন restored ও clean।

Evidence: real API result (স্থানীয় বা private reference; প্রকাশিত নয়), final account state (স্থানীয় বা private reference; প্রকাশিত নয়), isolated checks (স্থানীয় বা private reference; প্রকাশিত নয়), resource admission (স্থানীয় বা private reference; প্রকাশিত নয়)। দুই health endpoint HTTP 200; live restart/public contribution action হয়নি।

### 20:37 বাংলাদেশ সময়: individual Google account test follow-up

পাঁচটি active identity-এর সব দশটি AGY / Antigravity connection dashboard-এ sequential Retest করা হয়েছে; connection-test logs 10/10 logical HTTP 200। #4 verification-blocked ও #7 আগে থেকে manually disabled রেখে enabled state অক্ষত থাকার যাচাই হয়েছে। Retest generic 400-কে inconclusive হিসেবে accepted করতে পারে; তাই এই 10টি log 10টি successful completion-এর সমতুল্য নয়। আগের #2 Retest-এর claim-ও accepted probe হিসেবেই পড়তে হবে।

নতুন real `antigravity/gemini-3.8-flash-high` #2 request 20:36:29-এ upstream quota-exhausted HTTP 429 দিয়েছে। AGY #2-তেও fresh Flash quota 0% হওয়ায় আর request পাঠানো হয়নি। আগের 20:13:25-এর API 200 সময়ভিত্তিক success; বর্তমান allowance নয়। Active identities-এর fresh Flash snapshots 0%।

একই Google identity-এর #2 Antigravity quota snapshot 20:12-এর 100%, AGY snapshot 20:36-এর 0%; এই stale cross-provider quota gap শনাক্ত হয়েছে। Verification commit `892551a41` এই additional quota sharing gap সমাধান করেছে বলা যাবে না। Reset recovery / shared cooldown আলাদা release gate হিসেবে প্রয়োজন। Main `a3571d5b2` ও runtime `79412f0ec` অপরিবর্তিত; build/restart হয়নি।

পূর্ণ matrix ও ব্যাখ্যা [Google account health report-এর section 10](OMNIROUTE-GOOGLE-ACCOUNT-HEALTH-2026-10-06.md), fresh receipt (স্থানীয় বা private reference; প্রকাশিত নয়) এবং completion result (স্থানীয় বা private reference; প্রকাশিত নয়)-এ রাখা হয়েছে।


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
