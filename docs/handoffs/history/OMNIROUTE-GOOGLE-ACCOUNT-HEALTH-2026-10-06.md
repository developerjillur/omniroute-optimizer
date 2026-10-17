> **ঐতিহাসিক নথি — public copy, ২০২৬-১০-১৭।** মূল ঘটনার তারিখ ও ফল এই নথির নিজস্ব সময়ের জন্য প্রযোজ্য; পরের সংযোজন থাকতে পারে। বর্তমান অবস্থা ও কাজের নিয়মের জন্য [বর্তমান handoff](../CURRENT-STATUS-2026-10-17.md) পড়ুন। Private reference ও identifier সরানো হয়েছে; স্থানীয় evidence এখানে অন্তর্ভুক্ত নেই। পুরোনো cleanup, build, deploy বা service command বর্তমান অনুমতি হিসেবে ব্যবহার করবেন না।

# OmniRoute: Google account verification, Gemini quota ও token refresh

তারিখ: 2026-10-06। সর্বশেষ account snapshot: 20:16:56 বাংলাদেশ সময়, 14:16:56 UTC। এই রিপোর্টের live mitigation, source change, isolated checks এবং অসম্পূর্ণ deployment ধাপ আলাদা করে লেখা হয়েছে।

## ১. পাওয়া কারণ

বর্তমান incident-এর প্রধান কারণ access token expire হওয়া নয়। একই Google identity-এর priority #4 `agy` ও `antigravity` connection-এ upstream `403` এবং `verify your account to continue` এসেছে। অন্য connection-এ নির্দিষ্ট Gemini model-এর quota শেষ হয়ে `429` এসেছে। একই account-এর weekly allowance অবশিষ্ট থাকলেও সংশ্লিষ্ট model-এর allowance শেষ হতে পারে।

শেষ live snapshot-এ ১৪টি connection-এর access token এবং refresh token উপস্থিত, access-token expiry ভবিষ্যতে, এবং `expiresAt` / `tokenExpiresAt` সমান ছিল। আগের snapshot-এর তুলনায় একাধিক active connection-এর expiry নতুন করে এগিয়েছে। এটি চলমান automatic token refresh-এর প্রমাণ। সব account-এ inference অনুমোদিত আছে, এমন প্রমাণ এটি নয়।

Google access token-এর সীমিত মেয়াদ থাকে। বৈধ refresh token দিয়ে নতুন access token নেওয়া যায়; Google refresh token revoke বা expire-ও করতে পারে। তাই স্থায়ী ব্যবস্থা হলো সঠিক renewal এবং প্রয়োজন হলে প্রকৃত reauthentication, expiry লুকিয়ে রাখা নয়। [Google OAuth 2.0 documentation](https://developers.google.com/identity/protocols/oauth2)

Dashboard-এর `Token Short` control token refresh action-এর label। এই label দেখেই account expired ধরে নেওয়া যাবে না; প্রকৃত expiry, HTTP status এবং inference ফল দেখতে হবে।

### নির্দিষ্ট এক ঘণ্টার retained log

পরীক্ষিত window: 12:45–13:45 UTC, 18:45–19:45 বাংলাদেশ সময়।

| Provider / model | HTTP 200 | HTTP 403 | HTTP 429 | HTTP 499 |
| --- | ---: | ---: | ---: | ---: |
| `antigravity/gemini-3.1-pro-high` | 94 | 18 | 78 | 7 |
| `antigravity/gemini-3.7-flash-high` | 52 | 37 | 70 | 4 |
| `agy/connection-test` | 10 | 2 | 0 | 0 |
| `antigravity/connection-test` | 10 | 2 | 0 | 0 |

এই window-তে inference `403` মোট ৫৫ এবং `429` মোট ১৪৮। উল্লেখিত আগের ১০৫ / ৮৩ সংখ্যার exact time window জানা নেই, তাই সেগুলোকে এই window-এর সঙ্গে এক করে দেখানো হয়নি। `gemini-3.8-flash-high`-এর আগের records আলাদা সময়ে ছিল; নতুন live request-এ model-টি সরাসরি পরীক্ষা করা হয়েছে। `499`-কে verification বা token-expiry প্রমাণ হিসেবে ব্যবহার করা হয়নি।

পাঁচটি failed video ও transcript-এর প্রতিটি gap আলাদা request trace-এর সঙ্গে মেলানো বা পুনরায় video/transcription চালানো এই pass-এ হয়নি। উপরের error-গুলো failure-এর বাস্তব কারণ হতে পারে, তবে প্রতিটি video-এর সম্পূর্ণ causal trace এখনো যাচাই করা হয়নি।

## ২. কেন একই 403 বারবার হচ্ছিল

পুরোনো credential retry path কিছু `403`-কেও সাধারণ authentication failure হিসেবে token refresh করে আবার চেষ্টা করত। কিন্তু নতুন token পেলেও Google account verification বাধা কাটে না। স্বল্প cooldown শেষ হলে account পুনরায় চেষ্টা পেত। উপরন্তু successful OAuth refresh inference-এর error/health state মুছে দিতে পারত। একই identity দুই provider record-এ থাকায় শুধু এক connection-এর সাময়িক error যথেষ্ট ছিল না।

ফলে valid token থাকা, dashboard-এ active দেখানো এবং Google inference permission না থাকা একসঙ্গে ঘটছিল। এই distinction হারিয়ে গেলে অপ্রয়োজনীয় refresh ও repeated failed request হয়।

## ৩. এখন production configuration-এ যা করা হয়েছে

- Priority #4 Google identity-এর `agy` ও `antigravity` connection দুইটিই dashboard দিয়ে disable করা হয়েছে। এই পরিবর্তন reversible এবং `operatorDisabledAt` সংরক্ষিত আছে।
- প্রতিটি provider-এর #1, #2, #3, #5, #6 সক্রিয় রাখা হয়েছে। আগের #7 manually disabled record অপরিবর্তিত আছে।
- #4 account-এর access token বৈধ হলেও verification 403 দিয়েছিল; তাই valid token দেখিয়ে সেটিকে আবার eligible করা হয়নি।
- API key scope, model selection, context/compression configuration অথবা প্রকৃত Google quota পরিবর্তন করা হয়নি। Google-এর সীমা provider নির্ধারণ করে। [Antigravity plans documentation](https://antigravity.google/docs/plans)

Account শনাক্তকরণে email বা credential প্রকাশ না করে priority এবং non-secret tag ব্যবহার করা হচ্ছে। #4 tags: `agy/fa22f8da`, `antigravity/5f97a20d`।

Dashboard পরিবর্তনের screenshot: AGY connection state (স্থানীয় বা private reference; প্রকাশিত নয়)।

## ৪. live request ও reset যাচাই

Active `agy` priority #2-এর inference Retest 14:10:13 UTC-তে `HTTP 200` দিয়েছে। এরপর provider-এর 14:11:16 UTC reset পার হওয়ার পরে তার Flash quota snapshot প্রায় 14:12 UTC-তে আবার `100%` হয়েছে। Cache বা quota value হাতে বদলানো হয়নি।

একই active connection দিয়ে existing local API key ব্যবহার করে নিম্নোক্ত ছোট real request দেওয়া হয়েছে। Key value রিপোর্টে রাখা হয়নি।

```json
{
  "model": "antigravity/gemini-3.8-flash-high",
  "messages": [{"role": "user", "content": "Reply exactly OK."}],
  "max_tokens": 128,
  "stream": false
}
```

| যাচাই | ফল |
| --- | --- |
| Endpoint | `http://127.0.0.1:28128/v1/chat/completions` |
| Existing key | `local-default`; নতুন key তৈরি হয়নি |
| Connection tag | `d811621d`, `agy` priority #2 |
| Requested model | `antigravity/gemini-3.8-flash-high` |
| Returned model | `gemini-3.8-flash-high` |
| HTTP status | **200** |
| Completion | **OK** |
| সময় | **4.08 seconds** |
| Receipt time | 20:13:25 বাংলাদেশ সময়, 14:13:25 UTC |

এই request বর্তমান installed runtime-এর routing ও inference সফল হওয়া প্রমাণ করে। নতুন source patch deployment, সব account/model, native application, parallel session অথবা দীর্ঘ video processing-এর পূর্ণ acceptance প্রমাণ করে না।

`http://omni.local/healthz` ও `http://127.0.0.1:28128/healthz` final check-এ `HTTP 200`। কোনো live service restart হয়নি।

## ৫. nexa/ source fix

Private local source commit: **`892551a41f804decd6abcf3631e15f607ce0beda`**। Branch: `fix/deploy-resource-safety-2026-10-06`, পূর্বে অনুমোদিত `nexalance` base-এর বিদ্যমান worktree। Author ও committer: Jillur Rahman। Public PR, issue, comment বা push করা হয়নি।

এই commit-এ সব custom source, tests ও patch `nexa/`-এর মধ্যে আছে। Applied upstream source restore করা হয়েছে এবং owned worktree clean। Main checkout `nexalance` এখনো `a3571d5b29bf53e5fb4b23cbe43269596eb31122`; নতুন commit main-এ promote করা হয়নি। Installed `dist/BUILD_SHA` **`79412f0ec`**, runtime version `3.8.51`।

Source fix-এর আচরণ:

1. শুধু `agy` / `antigravity`-এর verification-specific `403` চিনে futile token refresh ও একই credential retry বন্ধ করে। সাধারণ `401`, generic `403` এবং অন্য provider-এর refresh path স্বাভাবিক থাকে।
2. `providerSpecificData.googleAccountVerification`-এ durable marker রাখে। একই normalized Google identity-এর AGY ও Antigravity record selection-এ একই বাধা পায়। অজানা email-এর connection নিজের id দিয়ে আলাদা থাকে।
3. OAuth renewal token ও প্রকৃত expiry update করে। Renewal verification barrier, model quota/transport cooldown অথবা manually disabled connection মুছে দেয় না। প্রকৃত credential-expiry failure successful refresh দিয়ে recover করতে পারে।
4. শুধু genuine inference `2xx` Retest matching verification marker clear করতে পারে। Metadata-only validation অথবা inconclusive probe দিয়ে barrier clear হয় না।
5. পুরোনো successful probe নতুন verification failure মুছে ফেলতে পারে না; marker timestamp মিলিয়ে recovery apply হয়। Passing test operator-disabled account নিজে থেকে enable করে না।
6. Remaining healthy accounts eligible থাকে। সব active account verification blocked হলে actionable verification error দেয়; ভুলভাবে পুরো pool-এর quota শেষ বলা হয় না। Terminal expired/banned status-এর precedence বজায় থাকে।

প্রধান source: [googleAccountHealth.ts](../../../nexa/new/src/lib/providers/googleAccountHealth.ts), [googleAccountVerification.ts](../../../nexa/new/src/sse/services/googleAccountVerification.ts), [regression tests](../../../nexa/new/tests/unit/nexa-google-account-health.test.ts)।

## ৬. validation-এর সঠিক অবস্থা

| Check | ফল ও সীমা |
| --- | --- |
| Pristine base | PASS; `nexa/`-এর বাইরে upstream base intact |
| Overlay apply check | সব 79 patch PASS |
| Isolated JavaScript policy / refresh checks | **14 PASS** |
| 2 / 3 / 5 account policy cases | Isolated checks-এ শুধু challenged identity blocked, healthy peers eligible |
| Native Node regression suite | 10 test লেখা হয়েছে; **চালানো হয়নি** |
| Native test admission | Exit 75, child launched false, peak 0 MiB, reason `System memory pressure is not normal` |
| Full TypeScript / ratchet | এই change-এর জন্য pending |
| Full package / smoke / production promotion | Pending |
| New-package native application / parallel / restart acceptance | Pending |

Isolated checks actual helper source নিয়ে type annotation সরিয়ে JavaScript হিসেবে পরীক্ষা করেছে। Refresh gate-এর Response mocked ছিল। এগুলো native Node test runner, full TypeScript compile অথবা production package test হিসেবে গণ্য নয়। Authoritative tested helper SHA-256: `5e8c3e273b7e8d2eb5462d3cbc06a82a2ab7ffd1c6d0361430de79813ebc7837`।

## ৭. resource guard ও deployment resume

Latest saved admission sample: pressure `2` / warning; physical headroom প্রায় **4.92 GiB**; swap প্রায় **19.21 GiB**; internal disk free প্রায় **25.15 GiB**। Targeted 256 MiB test-ও guard-এ admit হয়নি। তাই বড় build অথবা পুরোনো failed full compiler profile আবার চালানো হয়নি। সব user apps ও tabs খোলা রাখা হয়েছে; unrelated task/service বন্ধ করা হয়নি।

প্রাসঙ্গিক skill-এর বাধ্যতামূলক instruction: **“NEVER deploy without the validation gate green”**। Source: [nexa-overlay/SKILL.md](../../../nexa/skill/nexa-overlay/SKILL.md)। পূর্ণ gate green না থাকায় এই source fix-কে deployed বলা যাবে না। সরাসরি installed runtime edit, reduced dashboard package অথবা guard bypass করা হয়নি।

পরবর্তী release ধাপ:

1. Fresh pressure / physical memory / swap / internal disk মাপতে হবে। Normal pressure, user apps-এর অন্তত 10 GiB reserve এবং নির্ধারিত job budget একসঙ্গে fit হতে হবে। Large job-এর internal free অন্তত 20 GiB; updater-এর অধিকতর conservative disk gate-ও মানতে হবে।
2. Main/worktree SHA ও clean/pristine state যাচাই করে existing caches ব্যবহার করতে হবে। Duplicate dependency environment বা বড় backup তৈরি নয়।
3. এই 10-test native suite, full TypeScript/ratchet ও সংশ্লিষ্ট provider regression gate চালাতে হবে। Actual ফলসহ receipt সংরক্ষণ করতে হবে।
4. Authorized `nexa/` source integration, full-dashboard package, isolated smoke, snapshot/rollback এবং safe promotion সম্পূর্ণ করতে হবে। Installed SHA দিয়ে promotion যাচাই করতে হবে।
5. Post-deploy native request, multiple sessions, restart/resume, token renewal, Google verification quarantine এবং provider reset recovery পৃথক acceptance হিসেবে পরীক্ষা করতে হবে।

বর্তমান T7 mounted আছে; এই pass-এ report/handoff ছাড়া T7 files মুছে বা সরানো হয়নি। পুরোনো report-এর disk/memory sample ঐতিহাসিক, fresh admission-এর বিকল্প নয়।

## ৮. Google verification account recovery

Priority #4-এর Google account-এ Google যে normal verification flow দিয়েছে, সেটি সম্পূর্ণ করতে হবে। তার আগে এই account-এর দুই connection disabled রাখাই যুক্তিসংগত। Token renewal দিয়ে Google verification, revoked credential অথবা বাস্তব provider quota কাটানো যায় না।

Verification সম্পূর্ণ হলে সংশ্লিষ্ট connection enable করে inference Retest-এ বাস্তব `HTTP 200` নিশ্চিত করতে হবে। নতুন source deployed হলে genuine passing inference paired verification marker clear করবে, তবে operator-disabled record স্বয়ংক্রিয়ভাবে enable হবে না। Google refresh token সত্যিই revoke / `invalid_grant` হলে স্বাভাবিক reconnect/reauth প্রয়োজন।

## ৯. evidence ও handoff

Credential value, password, login code বা পূর্ণ private account id এই রিপোর্টে নেই। Sanitized evidence directory:

`~/Library/Caches/NexaLance/omniroute-google-account-health-2026-10-06`

- Real Gemini API result (স্থানীয় বা private reference; প্রকাশিত নয়)
- Final live token/account state (স্থানীয় বা private reference; প্রকাশিত নয়)
- Fixed-window error evidence (স্থানীয় বা private reference; প্রকাশিত নয়)
- 14 isolated policy checks (স্থানীয় বা private reference; প্রকাশিত নয়)
- Native test admission (স্থানীয় বা private reference; প্রকাশিত নয়)
- Final resource sample (স্থানীয় বা private reference; প্রকাশিত নয়)

এই ফল [মূল handoff](HANDOFF-OMNIROUTE-2026-10-02.md) এবং [consolidated handoff](HANDOFF-OMNIROUTE-2026-10-03-CONSOLIDATED.md)-এ append করা হয়েছে। আগের incident-এর source preparation বা deployment claim এই নতুন change-এর release evidence হিসেবে ব্যবহার করা যাবে না।

## ১০. পরবর্তী individual account live test: 20:29–20:37 বাংলাদেশ সময়

আগের pass-এ সব account-এ successful completion পরীক্ষা হয়নি। এই follow-up-এ পাঁচটি active Google identity-এর দশটি connection-এ dashboard দিয়ে একটির পরে আরেকটি `Retest` চালানো হয়েছে। #4 verification quarantine এবং আগে থেকে manually disabled #7 চালু করা হয়নি। Enabled/disabled state initial snapshot-এর সঙ্গে মিলিয়ে অক্ষত থাকার প্রমাণ রাখা হয়েছে।

| Account priority | AGY Retest log | Antigravity Retest log | বর্তমান generation যাচাই |
| --- | --- | --- | --- |
| #1 | 200, 987 ms | 200, 2547 ms | Fresh AGY Flash quota 0%; আলাদা completion পাঠানো হয়নি |
| #2 | 200, 1252 ms | 200, 1932 ms | নতুন real Antigravity completion **429**; AGY fresh quota 0% হওয়ায় request skipped |
| #3 | 200, 1615 ms | 200, 2509 ms | Fresh Flash quota 0%; আলাদা completion পাঠানো হয়নি |
| #4 | নতুন test skipped | নতুন test skipped | আগের নিশ্চিত verification 403; দুই connection disabled |
| #5 | 200, 1134 ms | 200, 2120 ms | Fresh Flash quota 0%; আলাদা completion পাঠানো হয়নি |
| #6 | 200, 1466 ms | 200, 2101 ms | Fresh Flash quota 0%; আলাদা completion পাঠানো হয়নি |
| #7 | নতুন test skipped | নতুন test skipped | আগে থেকে operator-disabled; enabled করা হয়নি |

**Retest ফলের গুরুত্বপূর্ণ সীমা:** installed provider probe বাস্তব Cloud Code surface ব্যবহার করে, তবে generic HTTP 400-কে `probe_inconclusive` হিসেবে accepted ধরে `call_logs`-এ logical 200 লিখতে পারে। এই দশটি connection-test log থেকে underlying দশটি upstream response-এর exact status বা দশটি successful completion প্রমাণ হয় না। তাই আগের #2 Retest-ও accepted connection-probe result হিসেবে পড়তে হবে। Actual successful completion-এর প্রমাণ section 4-এর 20:13:25-এর API result।

20:36:05–20:36:29-এ নতুন `antigravity/gemini-3.8-flash-high` request priority #2 tag `fa38af23`-এর call log-এ **HTTP 429**, duration 23.85 seconds। Error: `Antigravity upstream error (429): Resource has been exhausted (e.g. check quota).` Content পাওয়া যায়নি। এটি upstream error record; শুধু cached no-upstream-attempt refusal নয়। এই result নতুন successful completion হিসেবে গণ্য নয়।

নতুন generation worker sequential ছিল, normal pressure / memory headroom যাচাই করেছে এবং live watchdog ছিল। API key existing `local-default`; নতুন key বা permission তৈরি হয়নি। User apps/tabs বন্ধ করা হয়নি; build চালানো হয়নি।

### পাওয়া অতিরিক্ত quota freshness gap

20:37:45-এর snapshot-এ AGY #2-এর Flash quota 0% record সময় 20:36:00, কিন্তু একই Google identity-এর Antigravity #2 record তখনও 20:12:12-এর 100% দেখাচ্ছিল। #1-এর Antigravity record-ও পুরোনো ছিল। ফলে একই identity-এর দুই provider card সমসাময়িক allowance দেখাচ্ছে না। নতুন 429 actual availability নির্ধারণে ওই পুরোনো 100% snapshot-এর চেয়ে নির্ভরযোগ্য।

Fresh AGY snapshots অনুযায়ী পাঁচটি সক্রিয় identity-র নির্বাচিত Flash allowance বর্তমানে 0%। Recorded resets: #3 20:50:20, #5 20:50:49, #6 20:50:50, #1 21:17:16, #2 পরদিন 01:11:16 বাংলাদেশ সময়। এগুলো provider snapshot-এর reset সময়, এখনই allowance ফিরে এসেছে এমন প্রমাণ নয়। Reset-এর পরে fresh telemetry ও real request প্রয়োজন। অন্য model-এর পুরো catalog এই pass-এ পরীক্ষা হয়নি।

Verification-specific source commit `892551a41` quota snapshot sharing-এর এই অতিরিক্ত gap সমাধান করেছে বলা যাবে না। একই identity-এর AGY/Antigravity quota freshness / shared cooldown এবং reset recovery release validation-এ পৃথকভাবে যাচাই করতে হবে। Main ও installed SHA অপরিবর্তিত; নতুন source এখনো deployed নয়।

Evidence: initial state (স্থানীয় বা private reference; প্রকাশিত নয়), দশটি Retest ও fresh quota matrix (স্থানীয় বা private reference; প্রকাশিত নয়), নতুন completion ফল (স্থানীয় বা private reference; প্রকাশিত নয়), Retest dashboard screenshot (স্থানীয় বা private reference; প্রকাশিত নয়)।


## 11. Re-login Flash Low account test ও routing mismatch

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
