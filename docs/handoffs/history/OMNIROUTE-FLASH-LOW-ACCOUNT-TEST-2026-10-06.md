> **ঐতিহাসিক নথি — public copy, ২০২৬-১০-১৭।** মূল ঘটনার তারিখ ও ফল এই নথির নিজস্ব সময়ের জন্য প্রযোজ্য; পরের সংযোজন থাকতে পারে। বর্তমান অবস্থা ও কাজের নিয়মের জন্য [বর্তমান handoff](../CURRENT-STATUS-2026-10-17.md) পড়ুন। Private reference ও identifier সরানো হয়েছে; স্থানীয় evidence এখানে অন্তর্ভুক্ত নেই। পুরোনো cleanup, build, deploy বা service command বর্তমান অনুমতি হিসেবে ব্যবহার করবেন না।

# Gemini 3.8 Flash Low: পুনরায় connected account পরীক্ষার রিপোর্ট

তারিখ: 2026-10-06, Asia/Dhaka। লেখক: Jillur Rahman।

**অবস্থা: আংশিক পরীক্ষা; সব account যাচাই সম্পূর্ণ হয়নি।**

অনুরোধ ছিল AGY ও Antigravity-এর প্রতিটি connected account-এ `gemini-3.8-flash-low` দিয়ে একবার ছোট request পাঠিয়ে কার্যকারিতা যাচাই করা। নতুন inventory-তে AGY-তে ৭টি এবং Antigravity-তে ৬টি connection আছে। এগুলো ৮টি আলাদা Google identity; দুই provider-এর একই priority একই identity ধরে নেওয়া যাবে না।

## নিশ্চিত ফল

নির্দিষ্ট model-এর চারটি upstream call-এর logs পাওয়া গেছে। সবগুলো একই AGY #7 connection `private-id-002`-এ গেছে, এবং প্রত্যেকটি Google-এর `403: Verify your account to continue` পেয়েছে। এই account-এর masked email `amo***@gmail.com`। API/model test-এ প্রথম তিনটি response HTTP 502 ছিল; embedded upstream error এবং call log HTTP 403 ছিল। এটি চারটি আলাদা account-এর failure নয়।

এই run-এ কোনো successful exact-account completion নিশ্চিত হয়নি। বাকি ১২টি connection-এর এই model-এ সফলতা বা failure ঘোষণা করার মতো পরীক্ষার প্রমাণ নেই।

## Account matrix

| Provider | তালিকার account | Connection tag | `gemini-3.8-flash-low`-এর ফল |
|---|---:|---|---|
| agy | #1 | `private-id-005` | Dashboard test অন্য account-এ গেছে; নির্দিষ্ট account test বাকি |
| agy | #2 | `private-id-006` | Dashboard test অন্য account-এ গেছে; নির্দিষ্ট account test বাকি |
| agy | #3 | `private-id-007` | Dashboard test অন্য account-এ গেছে; নির্দিষ্ট account test বাকি |
| agy | #4 | `private-id-008` | Dashboard test অন্য account-এ গেছে; নির্দিষ্ট account test বাকি |
| agy | #5 | `private-id-003` | নির্দিষ্ট account test বাকি |
| agy | #6 | `private-id-009` | নির্দিষ্ট account test বাকি |
| agy | #7 | `private-id-002` | নিশ্চিত upstream 403; Google account verification প্রয়োজন |
| antigravity | #1 | `private-id-014` | নির্দিষ্ট account test বাকি |
| antigravity | #2 | `private-id-015` | নির্দিষ্ট account test বাকি |
| antigravity | #3 | `private-id-016` | নির্দিষ্ট account test বাকি |
| antigravity | #4 | `private-id-004` | নির্দিষ্ট account test বাকি |
| antigravity | #5 | `private-id-017` | নির্দিষ্ট account test বাকি |
| antigravity | #6 | `private-id-018` | নির্দিষ্ট account test বাকি |

সব ১৩টি connection inventory-তে active এবং access/refresh token present ছিল। AGY #7-এর token expiry `2026-10-06T15:59:31.440Z`, অর্থাৎ Dhaka সময় 21:59:31; পরীক্ষার সময় সেটি expired ছিল না। Token থাকা বা নতুন login সফল হওয়া এই model-এর inference সফল হওয়ার প্রমাণ নয়।

## Dashboard test-এ routing mismatch

`POST /api/models/test`-এ প্রথমে AGY #1, #2, #3 এবং #4-এর `connectionId` দেওয়া হয়েছিল। #1–#3-এর test response ফিরেছে; #4-এর client resource guard-এর কারণে abort করেছে। তবে ওই server-side request পরে শেষ হয়ে একই #7-এর 403 log করেছে। চারটির requested connection ও actual selected connection মেলেনি।

| প্রকৃত upstream সময়, UTC | অনুরোধ করা account | প্রকৃত account | Model | HTTP |
|---|---:|---:|---|---:|
| 2026-10-06T14:58:09.367Z | AGY #1 | AGY #7 | `gemini-3.8-flash-low` | 403 |
| 2026-10-06T14:58:14.524Z | AGY #2 | AGY #7 | `gemini-3.8-flash-low` | 403 |
| 2026-10-06T14:58:20.265Z | AGY #3 | AGY #7 | `gemini-3.8-flash-low` | 403 |
| 2026-10-06T14:58:26.519Z | AGY #4 | AGY #7 | `gemini-3.8-flash-low` | 403 |

Logs-এর canonical provider `antigravity`, কিন্তু `connection_id` AGY #7-এর record-এর সঙ্গে মেলে। তাই এটি Antigravity তালিকার ৬টি connection পরীক্ষা হওয়ার প্রমাণ নয়।

বর্তমান source-এ account selection-এর আগে eligible session affinity explicit pin-এর ওপর অগ্রাধিকার পেতে পারে; quota/cooldown হলে forced pin release-ও হতে পারে। একই model-test prompt `Reply with exactly: pong` ব্যবহার করা হয়। এই code paths routing mismatch-এর সম্ভাব্য ব্যাখ্যা; এই run-এর নির্বাচনের চূড়ান্ত কারণ tracing দিয়ে আরও নিশ্চিত করতে হবে। প্রমাণিত বিষয় হলো selected account requested account-এর সঙ্গে মেলেনি।

## নির্দিষ্ট account-এ পরীক্ষা সম্পূর্ণ করার প্রস্তুতি

একটি ছোট test runner প্রস্তুত করা হয়েছে, যা পরীক্ষার credential-কে একবারে একটি connection এবং শুধু দুটি Flash Low model-এ সীমাবদ্ধ করবে। প্রতি request-এ আলাদা prompt/session, selected-connection response header এবং সেই test key-এর correlated call log মেলাবে। অন্য account দিয়ে success আসলে সেটিকে pass বলবে না।

অস্থায়ী key-এর পরিকল্পিত মেয়াদ এক ঘণ্টা, management access নেই; runner শেষে শুধু নিজের key inactive করবে। Resource preflight blocked হওয়ায় এই runner কোনো নতুন key তৈরি করেনি এবং কোনো inference request পাঠায়নি। Script প্রস্তুত থাকা validated fix বা completed test নয়।

AGY #7-এর verification failure ইতিমধ্যে পাওয়া গেছে; ওই account-এ আর একই probe পাঠানোর পরিকল্পনা নেই। বাকি ১২টি connection-এর targeted test প্রয়োজন।

## RAM ও disk-এর কারণে পরীক্ষা থামানো হয়েছে

কোনো build, download, local model load বা render চালানো হয়নি। Network probe worker-এর পর্যবেক্ষিত RSS সর্বোচ্চ প্রায় 89.2 MiB। Request-গুলো ধারাবাহিক ছিল; ব্যবহারকারীর apps/services বন্ধ করা হয়নি।

পরীক্ষার আগে ও চলাকালে macOS memory pressure warning বারবার এসেছে। Worker headroom ৮ GiB-এর নিচে নামলে নিজেকে বন্ধ করেছে। পরে swap প্রায় 32.7 GiB এবং internal disk free প্রায় 15.0 GiB পর্যন্ত নেমেছিল।

সর্বশেষ recorded sample `2026-10-06T15:06:48.075Z`-এ pressure `1`, headroom `5.12 GiB`, swap `30.50 GiB`, internal free `17.24 GiB`। ছোট remote test শুরুর জন্য normal pressure, অন্তত 8.5 GiB headroom এবং 20 GiB internal free রাখা হয়েছে; চলাকালে owner-এর 8 GiB/15 GiB/1 GiB swap-growth stop thresholds বজায় থাকবে। Large build-এর 10 GiB plus workload admission আলাদাভাবে বহাল।

শেষ health check-এ `http://127.0.0.1:28128/healthz` পাঁচ সেকেন্ডে response দেয়নি; curl exit 28 ছিল। এই অবস্থায় production healthy বলে নিশ্চয়তা দেওয়া হয়নি। Source checkout clean এবং installed BUILD_SHA `79412f0ec` অপরিবর্তিত ছিল; এই task-এ deploy বা service restart করা হয়নি।

## অবশিষ্ট কাজ

1. Mac resource headroom ও service responsiveness স্বাভাবিক হলে বাকি ১২টি account-এর scoped test চালানো।
2. AGY #7-এর Google account verification সমস্যা সমাধান না হওয়া পর্যন্ত পুনরাবৃত্ত generation probe এড়ানো।
3. Dashboard `Test Model`-এর requested/selected account mismatch child overlay-তে ঠিক করে regression ও real account trace দিয়ে যাচাই করা।
4. Token refresh/verification source fix `892551a41` এবং quota-sharing freshness gap-এর deployment/QA status আলাদাভাবে বহাল; এই আংশিক test দিয়ে সেগুলো deployed বা production validated বলা যাবে না।

## Evidence

- পুনর্মিলিত account ও exact-model call logs (স্থানীয় বা private reference; প্রকাশিত নয়)
- প্রাথমিক test ফল ও resource stop (স্থানীয় বা private reference; প্রকাশিত নয়)
- শেষ resource sample (স্থানীয় বা private reference; প্রকাশিত নয়)
- নির্দিষ্ট scope-এ পরীক্ষার প্রস্তুত runner (স্থানীয় বা private reference; প্রকাশিত নয়)

Evidence-এ API key/token value রাখা হয়নি। সংক্ষিপ্ত connection/identity tags ব্যবহার করা হয়েছে।


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
