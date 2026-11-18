# v3.8.54 release compatibility — ২০২৬-১১-১৮

স্থিতি: **source port candidate প্রস্তুত; dependency lock, validation, full build ও live promotion অসম্পূর্ণ**।

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
মেলানো হয়েছে; `package-lock.json` পুনর্গঠন বাকি। বর্তমান candidate-এ 233টি active
patch ও 146টি নতুন file আছে। আগের accepted v3.8.53 source পুরোনো worktree ও
commit-এ অক্ষত। Candidate manifest এখন published v3.8.54 commit-এ pin করা,
তবে এটি accepted release নয়। আগের TypeScript ceilings ও live settings অপরিবর্তিত।

`proxyFetch.ts` ও analytics route-এর পুরোনো patch file মুছে ফেলা হয়নি; exact
base/blob/patch hash-সহ retired registry-তে রাখা হয়েছে। সংশোধনগুলো যথাক্রমে
নতুন transport-support ও analytics-pricing helper-এ আছে। Native payload,
Thread/Fable thinking prefix, cumulative usage, cache TTL, quota reset scheduling,
Google token-refresh health এবং namespaced migrations-এর আচরণ নতুন source-এর
সঙ্গে মেলানো হয়েছে। Lock বাদে 232টি active patch-এর strict applicability পাস;
functional acceptance এখনও বাকি।

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

## বর্তমান live সীমা

এই inspection-এ live `v3.8.53` বদলায়নি। শুরুতে core health এবং certificate-verified
IPv4/IPv6 HTTPS health তিনটিই `200` ছিল। Protected settings, environment,
LaunchAgent ও hosts hashes পরে মিলেছে। কোনো app/session বন্ধ হয়নি এবং নতুন
provider generation চালানো হয়নি। নতুন release-এর native parity বা permanent
availability দাবি করা হচ্ছে না।
