# Claude fallback ও cached quota classification

তারিখ: 2026-10-06। রক্ষণাবেক্ষণ: Jillur Rahman।

## ত্রুটি

একটি active account-এর weekly quota শেষ এবং অন্য active account-এর quota
অবশিষ্ট ছিল। অবশিষ্ট quota থাকা account-এ সাময়িক upstream `502/520` হওয়ার পরে
fallback ওই account-কে বর্তমান request-এর candidate pool থেকে বাদ দিতে পারে।
এরপর credential selection শুধু অবশিষ্ট exhausted account দেখে ভুলভাবে
`All claude accounts have exhausted their quota` ও cached reset time ফিরিয়ে দিত।
Request থেকে সাময়িক exclusion কোনো account-এর quota শেষ হওয়ার প্রমাণ নয়।

এই পরিস্থিতি isolated database-এ পুনরুৎপাদিত হয়েছে। তিনটি regression case
fix-এর আগে ব্যর্থ এবং fix-এর পরে সফল হয়েছে। সত্যিকারের exhausted pool এবং
API-key account allowlist-এর আরও দুটি regression case সফল হয়েছে।

## স্থায়ী পরিবর্তন

`nexa/patches/src__sse__services__auth.ts.patch` credential selection সংশোধন করে।
Current authorized connection pool-এ excluded account-এর quota থাকলে cached
exhaustion-কে পুরো pool-এর সিদ্ধান্ত হিসেবে ব্যবহার করা হয় না। Existing chat
handler মূল upstream status ও error সংরক্ষণ করে। অন্য request-এ ওই account
আবার eligible হতে পারে; activation, quota ও provider reset evidence বদলায় না।

সত্যিকারের exhausted account-গুলো আগের reset schedule অনুসরণ করে। API-key
allowlist-এর বাইরে থাকা কোনো account এই সিদ্ধান্ত bypass করতে পারে না।
Forced connection ও existing credential/security policy বজায় থাকে।

## Regression gate

`nexa/new/tests/unit/claude-fallback-quota-classification.test.ts` overlay apply-এর
পরে `tests/unit/`-এ যায়। `nexa/deploy/run-bridge-tests.mjs` এই suite চালায় এবং
suite অনুপস্থিত থাকলে build validation থামায়। মূল পাঁচটি case:

- Upstream `502`-এর পরে available account exclusion।
- Upstream `520`-এর পরে একই fallback পরিস্থিতি।
- 12 parallel credential selections এবং subsequent account recovery।
- সত্যিকারের fully exhausted pool-এর provider reset সংরক্ষণ।
- Allowed pool-এর বাইরের excluded account দিয়ে quota bypass প্রতিরোধ।

পরবর্তী multi-account matrix-এ 2, 3 ও 5টি distinct account পরীক্ষা করা হয়।
Test fixture-এ একই provider/name-এর upsert এড়াতে প্রতিটি account-এর আলাদা
নাম ও credential এবং unique connection ID assertion আছে। Remaining account-এর
মাত্র 1% quota, 20 concurrent selections, exhausted forced pin থেকে sibling
fallback, দুটি usable sibling-এর মধ্যে retry, সব account exhausted হলে earliest
reset এবং নতুন quota evidence-এর পরে recovery পরীক্ষা হয়। Suite-এ মোট 17টি
case। Account activation ও model কোনো case-এ কৃত্রিমভাবে পরিবর্তন করা হয় না।

আগের `claude-quota-alert-vs-exhaustion` suite-ও production regression gate-এ
বাধ্যতামূলক। এতে 90–99.9% usage alert, সত্যিকারের 100% exhaustion, restart
hydration এবং 20 parallel credential selections আলাদা করে পরীক্ষা হয়।

পূর্ণ TypeScript measurement-এর `SKIP` shell-এর `set -e` দ্বারা আগে থামছিল না,
কারণ inverted command-এর failure ওই shell rule-এর exception। Production gate
এখন explicit failure দেয়। Compiler missing, crash বা signal-এ থামা আলাদা করে
রেকর্ড হয়; কোনো measurement না থাকলে package তৈরি বা deploy শুরু হয় না। এই
gate-এর নয়টি executable regression test আছে।

Build runner এখন macOS-এর `vm_stat` দিয়ে free, inactive ও speculative page
গুনে আনুমানিক physical headroom মাপে। `memory_pressure -Q`-এর percentage-কে
সরাসরি physical RAM-এর সঙ্গে গুণ করলে এই machine-এ headroom বেশি দেখাচ্ছিল।
Build শুরুতে পুরো job budget-এর পাশাপাশি user apps-এর জন্য 10 GiB reserve
লাগে। চলাকালে warning/critical pressure, 8 GiB-এর নিচে headroom, swap-এর
1 GiB বৃদ্ধি বা internal disk-এর 15 GiB-এর নিচে নামা build থামায়। শুরুতে
internal disk-এর 20 GiB দরকার। শুধু নিজস্ব process group বন্ধ হয়; exited
zombie process-কে আবার signal দেওয়া হয় না। এই guard-এর 11টি case আছে।

## Live configuration ও সীমা

Diagnosis-এর সময়ে dashboard-এর `Cached quota filtering` সাময়িকভাবে OFF করা
হয়েছিল। পরিবর্তনটি database-এ সংরক্ষিত এবং native Opus CLI request দ্বিতীয়
connected account দিয়ে HTTP 200 হয়েছে। এই workaround exhausted account-এর
সাথেও upstream চেষ্টা অনুমোদন করে। Corrected package যাচাই হওয়ার পরে cached
filter ব্যবহার করা যায়, যাতে depleted account-এর অপ্রয়োজনীয় request এড়ানো হয়।

2026-10-06 04:34 UTC-এর refreshed evidence-এ প্রথম account-এর weekly quota
0% এবং দ্বিতীয় account-এর session quota 0%। এরপর 04:37 UTC নাগাদ live
`Cached quota filtering` আবার ON করা হয়েছে এবং database-এ সংরক্ষিত হয়েছে।
দ্বিতীয় account-এর provider-reported session reset 08:00 UTC, অর্থাৎ বাংলাদেশ
সময় 14:00। আগের successful native tests quota অবশিষ্ট থাকার সময়ে হয়েছিল;
পরবর্তী exhausted অবস্থাকে সেই successful test-এর সঙ্গে গুলিয়ে ফেলা যাবে না।

Known reset-এ background usage check হবে; শুধু সময় পার হওয়ায় account-কে
সফল ধরে নেওয়া হবে না। নতুন confirmed allowance পেলেই eligible হবে। Usage
refresh ব্যর্থ হলে bounded retry বজায় থাকে। API-key limits disabled, per-request
quota preflight OFF এবং cutoff 0; এগুলো provider-এর আসল quota wall বাতিল করে না।

Provider-এর আসল quota, throughput/rate limit, account entitlement ও service
failure OmniRoute নিয়ন্ত্রণ করে না। এই fix transport failure-কে ভুল quota
exhaustion হিসেবে দেখানো বন্ধ করে; provider rejection মুছে দেয় না। Paid extra
usage protection, native app bundle ও account login পরিবর্তন করা হয়নি।

## Update ও deployment

সব source customization `nexa/`-তে আছে। Base pristine guard ও patch health
validation পাস করেই package build হবে। Build/deploy ও live QA-এর বর্তমান ফল
স্থানীয় handoff-এ আলাদা করে রেকর্ড করতে হবে; source test-কে live deployment
হিসেবে গণ্য করা যাবে না।
