# v3.8.54 release compatibility — ২০২৬-১১-১৮

স্থিতি: **source port ও dependency lock প্রস্তুত; release validation চলছে, full build ও live promotion অসম্পূর্ণ**।

GitHub-এর নতুন stable release `v3.8.54` (১৭ নভেম্বর ২০২৬) নির্দিষ্ট commit
`1c880c5c95b3f0240d5e4c6c8f0947ec46b5d25e`-এ পরীক্ষা করা হয়েছে। একই সময় npm
`latest` এখনও `3.8.53`। Release branch-এর নাম পরের version দেখালেও candidate
শুধু published tag-এর commit; চলমান branch বা unreleased code নেওয়া হয়নি।

## Nexa compatibility

[Read-only release inspection](https://github.com/developerjillur/omniroute-optimizer/actions/runs/44240108762)
ও তার তিনটি inspection-helper test পাস। এটি application acceptance নয়।

- 231টি active patch-এর 194টি conflict ছাড়া merge candidate তৈরি করেছে; semantic review ও regression বাকি।
- 37টি active patch-এ overlap আছে; native passthrough, stream, quota, usage metering, migration ও dependency lock-এর changes হাতে মেলাতে হবে।
- নয়টি preserved retired patch-এর পাঁচটির upstream target বদলেছে; অবশিষ্ট চারটি byte-identical। কোনো patch স্বয়ংক্রিয়ভাবে retire করা হয়নি।
- 145টি নতুন application/test file-এর upstream path collision নেই।

এই inspection-এর পরে আলাদা `fix/v3.8.54-models` worktree-তে 36টি source overlap
মেলানো হয়েছে এবং `package-lock.json` পুনর্গঠন করা হয়েছে। Security integration-সহ
বর্তমান candidate-এ 234টি active patch ও 149টি নতুন file আছে। আগের accepted v3.8.53 source পুরোনো worktree ও
commit-এ অক্ষত। Candidate manifest এখন published v3.8.54 commit-এ pin করা,
তবে এটি accepted release নয়। আগের TypeScript ceilings ও live settings অপরিবর্তিত।

`proxyFetch.ts` ও analytics route-এর পুরোনো patch file মুছে ফেলা হয়নি; exact
base/blob/patch hash-সহ retired registry-তে রাখা হয়েছে। সংশোধনগুলো যথাক্রমে
নতুন transport-support ও analytics-pricing helper-এ আছে। Native payload,
Thread/Fable thinking prefix, cumulative usage, cache TTL, quota reset scheduling,
Google token-refresh health এবং namespaced migrations-এর আচরণ নতুন source-এর
সঙ্গে মেলানো হয়েছে। Lock-সহ আগের 233টি active patch-এর strict applicability পাস;
নতুন security integration-এর পর পুরো manifest আবার যাচাই করতে হবে। Independent
compatibility, Bridge, model helper ও core typecheck gates cloud runner-এ পাস করেছে;
পূর্ণ validation ও installed acceptance এখনও বাকি।

## Dependency security

Production audit-এ একটি [reviewed picomatch advisory](https://github.com/advisories/GHSA-fc5q-39xc-vjpf)
ছয়টি dependency package-কে high হিসেবে দেখায়। Registry-তে patched version নেই;
dependency downgrade বা audit ফল লুকিয়ে এটি পাস করানো হয়নি। `picomatch` 4.0.7 ও
2.3.2-এর registry-integrity-verified parser-এ সীমিত local guard risky repeated-extglob
compilation প্রত্যাখ্যান করে। অজানা version বা parser hash স্বয়ংক্রিয়ভাবে বদলানো হয় না।

দুই version-এ মোট 12টি baseline assertion failure reproduce হয়েছে; guarded copy-তে
72টি unsafe pattern/options combination প্রত্যাখ্যাত এবং 3,264টি ordinary matching/capture
ফল অপরিবর্তিত। Integration-এর পাঁচটি test পাস: idempotence, hard-link cache preservation,
unknown bytes refusal, raw audit findings ধরে রেখে exact remediation verification এবং
failed audit প্রত্যাখ্যান। এগুলো full glob-language equivalence বা installed-runtime acceptance নয়।

Package postinstall root ও standalone dependency copies-এ guard প্রয়োগ করবে; startup
exact parser hash ও actual unsafe-pattern behavior মিলিয়ে দেখবে। Audit gate একই advisory-এর
সব installed copy যাচাই ছাড়া ছাড় দেয় না; অন্য finding release আটকে দেয়। Registry audit-এ
ছয়টি high finding রয়ে যেতে পারে—এটি registry zero-vulnerability দাবি নয়। Full source,
packaging ও Mac installed-runtime gates পাসের আগে এই guard live-এ যাবে না।

## নতুন models এবং release gates

GPT‑6.2 Sol/Astra ও Gemini 4 discovery/thinking-এর আগের source validation
[`25dcf7e`](https://github.com/developerjillur/omniroute-optimizer/commit/25dcf7e7f9c54682013c61dac9bb11be72d19da5)-এ
সংরক্ষিত; [model report](MODEL-CATALOG-2026-11-18.md)-এর ফল শুধু সেই pinned
v3.8.53 source-এর জন্য। সেটি নতুন v3.8.54-এর acceptance বা live model access-এর প্রমাণ নয়।
Carbon-এর account entitlement পরিবর্তন বা disabled model placeholder-কে usable
model বানানো এই update-এর অংশ নয়।

পূর্ণ build-এর reviewed 8 GiB family profile-এর জন্য 18 GiB physical headroom
দরকার। বর্তমান measurement ওই gate পূরণ করেনি; pressure normal ও swap zero
থাকলেও build চালানো হয়নি। Exact measurement ও overlapping paths
[inspection receipt](../../reports/v3.8.54-inspection-2026-11-18.json)-এ আছে।

Port-এর পরে lock regeneration, release-specific functional/TypeScript comparison,
lint ও docs gates লাগবে। Inherited backlog-এর নতুন measured baseline প্রয়োজন হলে
পুরোনো records অক্ষত রেখে মালিকের সিদ্ধান্ত নিতে হবে; ceiling অন্ধভাবে বাড়ানো হবে না।
ছোট source-preparation profile-এর 30-second admission পাস করেছে; formatting ও
isolated source checkout-এর measured peak যথাক্রমে 160 MiB ও 293 MiB। এতে full
production build admitted হওয়ার দাবি করা হচ্ছে না। Source validation ও build
resource admission পেলে full production build, sealed package, isolated installation,
security/migration/config preservation, consistent rollback snapshot ও idle inference
check-এর পরে live promotion করা যাবে।

স্থানীয় RAM gate পূরণ না হলে একই pinned source-এর full build public GitHub Linux
runner-এ করা যাবে। Upstream postinstall standalone-এর Linux native modules-কে target
platform-এর root dependency দিয়ে repair করার ব্যবস্থা রাখে। তাই cloud build-এর পরে
Mac-এ actual isolated install, native module load, package/security ও protocol smoke
অবশ্যই পাস করতে হবে; cloud build alone Mac compatibility প্রমাণ করে না।

## বর্তমান live সীমা

এই inspection-এ live `v3.8.53` বদলায়নি। শুরুতে core health এবং certificate-verified
IPv4/IPv6 HTTPS health তিনটিই `200` ছিল। Protected settings, environment,
LaunchAgent ও hosts hashes পরে মিলেছে। কোনো app/session বন্ধ হয়নি এবং নতুন
provider generation চালানো হয়নি। নতুন release-এর native parity বা permanent
availability দাবি করা হচ্ছে না।
