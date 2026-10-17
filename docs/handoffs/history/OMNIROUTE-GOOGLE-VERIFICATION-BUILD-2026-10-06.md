> **ঐতিহাসিক নথি — public copy, ২০২৬-১০-১৭।** মূল ঘটনার তারিখ ও ফল এই নথির নিজস্ব সময়ের জন্য প্রযোজ্য; পরের সংযোজন থাকতে পারে। বর্তমান অবস্থা ও কাজের নিয়মের জন্য [বর্তমান handoff](../CURRENT-STATUS-2026-10-17.md) পড়ুন। Private reference ও identifier সরানো হয়েছে; স্থানীয় evidence এখানে অন্তর্ভুক্ত নেই। পুরোনো cleanup, build, deploy বা service command বর্তমান অনুমতি হিসেবে ব্যবহার করবেন না।

# OmniRoute Google verification, routing ও production build: 2026-10-06

লেখক: Jillur Rahman

এই রিপোর্ট 2026-10-06 রাত 22:19 বাংলাদেশ সময়ের পর্যবেক্ষণ এবং source preparation-এর অবস্থা ধরে লেখা। নতুন source fix production-এ deploy হয়নি। Live configuration-এ verification-blocked connection pause করা হয়েছে; বাকি usable connection-গুলো চলছে।

## ১. সমস্যার কারণ ও এখনকার ফল

একই Google identity-এর AGY এবং Antigravity connection আলাদা OAuth token রাখে। Google-এর `403 Verify your account to continue` credential expiry অথবা quota exhaustion-এর সমান নয়। OAuth refresh সফল হলেও account-এর inference eligibility স্বয়ংক্রিয়ভাবে প্রমাণ হয় না।

Fresh log এবং database readback-এ পাওয়া গেছে, verification 403-এর পরেও তিনটি connection আবার `active` health নিয়ে routing pool-এ ছিল। একটি 25-minute pre-pause observation-এ AGY #5-এ 14, Antigravity #4-এ 13, AGY #7-এ 19টি verification 403 দেখা গেছে। এই সংখ্যা উল্লিখিত নির্দিষ্ট window-এর; আগের এক ঘণ্টার screenshot-এর সংখ্যার বিকল্প নয়।

পাশাপাশি individual model test requested connection-এর বদলে session-affinity sibling-এ যাওয়ার আলাদা gap পাওয়া গেছে। আগের চারটি Flash Low test একই challenged AGY #7-এ গিয়েছিল। সেই ফল দিয়ে অন্য connection-এর model support বা failure ঘোষণা করা যায় না।

Live management API দিয়ে সঠিক তিনটি connection pause করা হয়েছে। প্রতিটি update HTTP 200; independent read-only SQLite readback-এ `isActive=false`, `googleAccountVerification.required=true`, `operatorDisabledAt` উপস্থিত। 13টি Google connection-এর মধ্যে 10টি active আছে: AGY 5 এবং Antigravity 5। Active connection-গুলো 6টি পৃথক Google identity-এর।

## ২. কোন connection pause করা হয়েছে

পূর্ণ email, token, API key অথবা account verification URL এখানে রাখা হয়নি। নিচের tag হলো connection ID-এর SHA-256-এর প্রথম 8 অক্ষর। Priority নম্বর বর্তমান snapshot-এর; পরবর্তী account reorder হলে tag দিয়ে মেলাতে হবে।

| Provider | Priority | Connection tag | কারণ |
| --- | ---: | --- | --- |
| agy | 5 | `private-id-003` | `developerjillur0…` পরিচয়ের verification 403 |
| antigravity | 4 | `private-id-004` | একই Google identity-এর verification 403 |
| agy | 7 | `private-id-002` | `amo***@gmail.com` পরিচয়ের verification 403 |

Pause account delete বা credential logout নয়। এটি challenged connection-এ বারবার নতুন generation request পাঠানো বন্ধ রাখার reversible configuration। Google-এ প্রয়োজনীয় verification শেষ হলে genuine inference Retest সফল করে পরে Enable করতে হবে। Operator pause নিজে থেকে সরানো source fix-এর অংশ নয়।

## ৩. Live log observation ও সীমাবদ্ধতা

Observation window: `2026-10-06T16:03:32.584Z` থেকে `2026-10-06T16:19:31.815Z`, বাংলাদেশ সময় 22:03:32 থেকে 22:19:31।

- 10টি active connection-এর প্রত্যেকটিতে একটি করে `connection-test` HTTP 200 log আছে। এই log-এ success condition `result.valid`; এগুলো newly prepared source regression নয়। কিছু connection check cached হতে পারে, তাই সবগুলোকে fresh নির্দিষ্ট-model generation বলা হচ্ছে না।
- 8টি connection থেকে 98টি actual model request HTTP 200: `gemini-3.1-pro-high` 53টি এবং `gemini-3.7-flash-high` 45টি। এগুলো চলমান live traffic-এর পর্যবেক্ষণ; এই turn-এ নতুন 98টি synthetic QA request চালানো হয়নি।
- Active AGY #1 এবং Antigravity #1-এ এই window-এ connection-test success আছে, কিন্তু ওই দুটি model-এ generation success নেই।
- `gemini-3.8-flash-low`-এর সব connection-এ নতুন exact-account live test এখনও সম্পন্ন হয়নি।

| Provider | Priority | Tag | বর্তমান routing | Connection check 200 | Pro High 200 | Flash High 200 |
| --- | ---: | --- | --- | ---: | ---: | ---: |
| agy | 1 | private-id-005 | চালু | 1 | 0 | 0 |
| agy | 2 | private-id-006 | চালু | 1 | 8 | 6 |
| agy | 3 | private-id-007 | চালু | 1 | 7 | 6 |
| agy | 4 | private-id-008 | চালু | 1 | 8 | 4 |
| agy | 5 | private-id-003 | verification-এর জন্য pause | 0 | 0 | 0 |
| agy | 6 | private-id-009 | চালু | 1 | 4 | 4 |
| agy | 7 | private-id-002 | verification-এর জন্য pause | 0 | 0 | 0 |
| antigravity | 1 | private-id-014 | চালু | 1 | 0 | 0 |
| antigravity | 2 | private-id-015 | চালু | 1 | 10 | 5 |
| antigravity | 3 | private-id-016 | চালু | 1 | 6 | 8 |
| antigravity | 4 | private-id-004 | verification-এর জন্য pause | 0 | 0 | 0 |
| antigravity | 5 | private-id-017 | চালু | 1 | 5 | 4 |
| antigravity | 6 | private-id-018 | চালু | 1 | 5 | 8 |

Pause-এর পরে Antigravity #4-এ দুটি verification 403 log এসেছে, শেষ `16:03:39.185Z`। Recorded duration অনুযায়ী দুটির আনুমানিক শুরু `16:03:15.475Z` এবং `16:02:44.332Z`, অর্থাৎ pause-এর আগে। এটি duration থেকে নির্ণয়; independent request-start trace নয়। ওই দুটি শেষ হওয়ার পরে observation window-এ আর verification 403 নেই। Pause-কে ইতিমধ্যে শুরু হওয়া request cancel করার ব্যবস্থা হিসেবে গণনা করা যাবে না।

## ৪. স্থায়ী fix-এর প্রস্তুত source

সব customization `nexa/`-তে রাখা হয়েছে। Pristine base-এর বাইরে upstream source স্থায়ীভাবে পরিবর্তিত হয়নি।

### ৪.১ Verification barrier ও token refresh

- Google verification 403-এ pointless OAuth refresh/retry বাদ দেওয়ার rule। Genuine 401 এবং অন্য provider-এর credential refresh path বজায় রাখা।
- একই email identity-এর AGY/Antigravity connection-এ durable verification barrier সংরক্ষণ। Normal routing healthy identity বেছে নেবে।
- OAuth renewal, periodic health update অথবা stale successful response যেন নতুন verification barrier মুছে না দেয়।
- Refresh token usable হলে expiry renew হবে। প্রকৃত expired/revoked credential অথবা Google challenge-কে healthy হিসেবে দেখানোর জন্য error লুকানো হবে না।
- Quota, transport cooldown, ban এবং operator-disabled state token refresh-এর পরে অক্ষত রাখার rule।

এই foundation worktree commit `892551a41`-এ আছে; live runtime-এ নেই।

### ৪.২ Individual model test-এর connection isolation

- Management model test-এর জন্য internal `AsyncLocalStorage` connection scope। Public HTTP header দিয়ে এই scope বানানো যায় না।
- Scope active থাকলে exact requested connection-এর pool ব্যবহার; session-affinity বা failed-test sibling fallback অন্য account-কে test হিসেবে গণনা করতে পারবে না।
- Normal user session-এর affinity এবং fallback behaviour একই রাখার intent। Native regression দিয়ে তা এখনও যাচাই করা বাকি।
- Unique model-test session ID এবং response-এর actual selected connection ID প্রকাশ। Chat test-এর successful response requested connection-এর সঙ্গে না মিললে 409, false green নয়।
- Caller cancellation scheduled request ও response handling-এ পৌঁছাবে। Cancellation 499 হিসেবে report করার rule; তা local rate limit 429 হিসেবে ভুল শ্রেণিবিভাগ হবে না।

### ৪.৩ Background Google quota token renewal

`quotaAccountRefresh` helper background quota polling-এর আগে Claude, AGY এবং Antigravity-এর existing serialized token renewal ব্যবহার করবে। একই connection-এর token renewal race এড়ানোর existing mutex পুনর্ব্যবহার করা হয়েছে। অন্য provider usage path বদলানোর intent নেই।

নতুন token দিয়ে quota fetch হলেও Google verification marker সরবে না। এই helper coding prompt, context window অথবা output quality transform করে না।

### ৪.৪ Genuine Retest recovery ও concurrent update

Retest শুরুর আগে challenged identity-এর প্রতিটি paired connection-এর barrier timestamp capture করা হয়। Successful inference-এর পরে কেবল একই observed version clear হবে।

- দুই connection-এ পূর্বের unequal timestamp থাকলেও valid recovery সম্ভব করার source change।
- Retest চলাকালে নতুন challenge এলে পুরোনো success দিয়ে সেটি clear হবে না।
- Recovery `isActive` বদলায় না; manually paused connection Enable করতে operator action প্রয়োজন।

### ৪.৫ Build gate ও data isolation

`nexa/deploy/build-candidate.sh`-এ isolated `DATA_DIR=$OUTDIR/build-data`, `MITM_AUTO_RECOVER=false` এবং sequential Google/model-test regression gate রাখা হয়েছে। Failed gate-এর পরে package/promote বন্ধ হবে। নতুন test fixture-গুলো exact temporary path এবং entries log করে, symlink check করে নিজেদের disposable data পরিষ্কার করবে। Live storage test database হিসেবে ব্যবহৃত হবে না।

## ৫. যাচাইয়ের প্রকৃত অবস্থা

| Check | ফল | সীমা |
| --- | --- | --- |
| `nexa/check/pristine-base.mjs` | PASS | `nexa/`-এর বাইরে upstream-main-এর সঙ্গে byte match |
| `nexa/apply.mjs --check` | PASS | 81টি patch pristine base-এ apply হয়; runtime behaviour test নয় |
| `bash -n nexa/deploy/build-candidate.sh` | PASS | shell syntax |
| `node --check nexa/deploy/build-candidate.test.mjs` | PASS | JavaScript syntax; test assertions চালানো হয়নি |
| Live 3-connection pause | PASS | API response এবং independent persisted-state readback |
| Live `/healthz` এবং `omni.local/healthz` | HTTP 200 | Gateway health; সব model/client-এর E2E নয় |
| Prepared Google health/routing/quota/model-test regressions | PENDING | Resource gate worker চালু করতে দেয়নি |
| Formatter / full typecheck / tsc-ratchet | PENDING | নতুন candidate-এর জন্য সম্পন্ন হয়নি |
| Full production candidate build ও package validation | PENDING | কোনও নতুন production artifact তৈরি হয়নি |
| Out-of-band smoke, promotion, rollback acceptance | PENDING | বর্তমান source deploy হয়নি |
| `gemini-3.8-flash-low` per-account matrix | PENDING | exact-connection routing fix deploy ও live test বাকি |
| Native client simultaneous session / resume / 24-hour acceptance | PENDING | এই incident fix-এর production acceptance হয়নি |

আগের report-এর 14টি isolated policy assertion অথবা অন্য model-এর HTTP 200-কে নতুন native/full QA gate pass হিসেবে ব্যবহার করা হয়নি।

Prepared regressions cover 2/3/5-account pool selection, paired identity quarantine, token refresh preservation, normal affinity বনাম exact probe, unequal barrier recovery, newer challenge survival, quota token renewal, selected connection reporting, failed probe sibling isolation, cancellation এবং fail-closed packaging। এদের ফল এখনও PENDING।

## ৬. RAM budget এবং build কেন হয়নি

Owner-এর নিয়ম অনুযায়ী user apps/tabs বন্ধ করা যাবে না। Large job-এর আগে normal memory pressure, system-এর জন্য 10 GiB headroom, job budget-এর অতিরিক্ত allowance এবং internal disk-এ অন্তত 20 GiB free প্রয়োজন।

একটি conservative 3 GiB total build budget-এর জন্য admission minimum 13 GiB। Focused test 512 MiB হলে minimum 10.5 GiB।

Focused test guard `2026-10-06T16:04:57.354Z`-এ exit 75 দিয়েছে, peak 0 MiB: `System memory pressure is not normal`। অর্থাৎ native test child শুরুই হয়নি। Formatter-ও admission পায়নি।

Latest resource snapshot `2026-10-06T16:19:12.797Z`:

| মাপ | ফল |
| --- | ---: |
| macOS pressure | 2, warning |
| Physical headroom | 3.71 GiB |
| Swap used | 15.75 GiB |
| Internal disk free | 70.82 GiB |

বর্তমানে disk build-এর প্রধান blocker নয়; RAM pressure এবং headroom blocker। কোনও safety limit override, apps quit, নতুন large environment/cache, large download বা unbounded build চালানো হয়নি। নিজের build/test worker admission-এর আগেই থেমেছে।

Overlay skill-এর exact rule: **“NEVER deploy without the validation gate green”**। [পড়া source](../../../nexa/skill/nexa-overlay/SKILL.md)। Validation বন্ধ থাকা অবস্থায় live runtime replace করলে এই rule এবং resource safety দুটোই ভাঙবে।

## ৭. Source, deployment ও data-এর আলাদা অবস্থা

| জায়গা | অবস্থা |
| --- | --- |
| Main source branch | `nexalance`, HEAD `a3571d5b29bf53e5fb4b23cbe43269596eb31122`, এই pass-এ অপরিবর্তিত ও clean |
| Isolated worktree | `~/Developer/OmniRoute/.claude/worktrees/deploy-resource-safety-2026-10-06` |
| Worktree branch | `fix/deploy-resource-safety-2026-10-06`, HEAD `892551a41` |
| এই report-এর নতুন source delta | Worktree-এর uncommitted `nexa/` changes; validation ছাড়া main-এ merge হয়নি |
| Live runtime | `~/.omniroute-runtime/lib/node_modules/omniroute` |
| Live `dist/BUILD_SHA` | `79412f0ec` |
| Live data | `~/.omniroute-local/storage.sqlite` |

Live data read-only inspection করা হয়েছে; configuration change authenticated management API দিয়ে। Credentials report-এ প্রকাশ করা হয়নি। নতুন API key বা credential scope বানানো হয়নি। Media/video project-এর download, transcript অথবা analysis files এই কাজে edit করা হয়নি।

## ৮. বাকি কাজ এবং acceptance criteria

1. Resource admission স্বাভাবিক হলে child overlay apply করে formatter, native Google/model-test regressions, existing probe-isolation/serialized-refresh regressions, typecheck, tsc-ratchet এবং deployment regressions সম্পূর্ণ করা। যে failure থাকবে source-এ fix করে পুনরায় প্রাসঙ্গিক gate চালানো।
2. Pristine base restore ও overlay guard pass করে validated child changes main-এর সঙ্গে reconcile করা। Working tree-এর staged/unstaged পরিবর্তন এবং attribution যাচাই ছাড়া commit বা updater নয়।
3. `nexa/deploy/`-এর bounded candidate flow দিয়ে sequential production build, package validation এবং out-of-band smoke করা। T7 kit-এর পুরোনো unbounded updater এই resume-এর shortcut নয়।
4. Promote-এর পরে actual runtime SHA, launchd/Bridge health, retained data, streaming/cancellation এবং normal session fallback যাচাই করা।
5. Active connection-গুলোর `gemini-3.8-flash-low` exact-account matrix আবার চালানো। Requested ID, actual selected ID, upstream result এবং returned output একসঙ্গে evidence হিসেবে রাখতে হবে।
6. Challenged Google identity দুটির প্রয়োজনীয় provider verification শেষ হওয়ার পরে genuine Retest। New source recovery rule এবং operator pause preservation যাচাই করে Enable। Verification unresolved থাকা অবস্থায় account চালু করে repeated 403 পরীক্ষা নয়।
7. Two, three এবং five connection pool দিয়ে one unavailable, mixed verification/quota, all exhausted এবং reset recovery-এর production acceptance। Genuine provider quota exhaustion-কে local unlimited setting দিয়ে সরানো যাবে না।

সব 13টি connection এখন error-free, Flash Low সব account-এ verified, নতুন build deployed অথবা 24-hour uninterrupted acceptance সম্পন্ন এমন কোনও দাবি এই report করে না।

## ৯. Evidence ও resume references

- Pause API ফল ও readback (স্থানীয় বা private reference; প্রকাশিত নয়)
- 16-minute live observation (স্থানীয় বা private reference; প্রকাশিত নয়)
- Paused/active persisted state (স্থানীয় বা private reference; প্রকাশিত নয়)
- Focused test admission (স্থানীয় বা private reference; প্রকাশিত নয়)
- Resource closeout (স্থানীয় বা private reference; প্রকাশিত নয়)
- [Source verification module](../../../nexa/new/src/sse/services/googleAccountVerification.ts)
- [Exact model-test scope](../../../nexa/new/src/lib/api/modelTestScope.ts)
- [Bounded build flow](../../../nexa/deploy/build-candidate.sh)


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
