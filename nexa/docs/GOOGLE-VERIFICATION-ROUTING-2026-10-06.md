# Google verification routing ও production resume, 2026-10-06

লেখক: Jillur Rahman

## 2026-10-06 রাত 22:19: Google verification routing ও build-এর বর্তমান handoff

নতুন dated report: [Google verification ও production build-এর সম্পূর্ণ অবস্থা](</Volumes/T7 Shield/NexaLance-Resources/Local-OmniRoute-Setup/OMNIROUTE-GOOGLE-VERIFICATION-BUILD-2026-10-06.md>)। পুরোনো report/section-এর content অক্ষত রেখে এই update যোগ হয়েছে।

- Live verification-blocked AGY #5 `4b353b73`, Antigravity #4 `9ae8dab5`, AGY #7 `a09d126e` authenticated API দিয়ে pause; তিনটি API HTTP 200 এবং independent readback-এ `isActive=false`, verification marker ও operator-disabled flag। 13 connection-এর মধ্যে AGY 5 + Antigravity 5 active, 6 distinct identity।
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

## 2026-10-06 রাত 22:48: RAM পাওয়ার পরে validation পুনরায় চালু

- System pressure normal অবস্থায় bounded কাজ পুনরায় শুরু হয়েছে; কোনো user app, tab বা অন্য task বন্ধ হয়নি। Formatter PASS। Core TypeScript check PASS, peak 1218 MiB।
- Revised management-test streaming/selection, 2/3/5-account routing ও probe isolation suite: 14 PASS, 0 FAIL। Slow SSE wrapper তৈরি হওয়ার পরে response consume হওয়া পর্যন্ত একই connection scope থাকে; অন্য account নির্বাচন হলে dispatch-এর আগেই test প্রত্যাখ্যাত হয়।
- সম্পূর্ণ TypeScript ratchet: `tscErrors=5830`, baseline `5830`, PASS। নতুন tests-এর 10 typing error সংশোধিত; baseline বাড়ানো হয়নি। Warm compiler peak 3223 MiB, watchdog stop হয়নি। আগের 4 GiB-heap compiler অসম্পূর্ণ হওয়ায় gate exit 75 দিয়েছিল; সেই attempt validation হিসেবে গৃহীত হয়নি।
- সব permanent source ও regression নতুন files `nexa/`-তে। Apply করা copies overlay source-এর সঙ্গে hash মিলিয়ে pristine restore করার পরে commit হবে। Full production candidate, package smoke, promotion এবং exact-model live matrix এই checkpoint-এ এখনও PENDING।
- Build budget: একটি worker, system headroom reserve, own-process-group RSS watchdog। Existing dependency environment ও compiler cache reuse হবে; desktop app rebuild/deploy opt-in করা হয়নি।

## Production validation এবং compilation budget, রাত 22:58

`40618d915` application source-এর full candidate validation PASS: model/Google 58, deployment 50, Bridge 576, UI 36, Claude/Codex fidelity 72, security/traffic 34। Core typecheck PASS; full ratchet 5830/5830 PASS। Compilation-এর সময়ে RSS 4713 MiB হওয়ায় 4608 MiB watchdog limit-এ কাজ থেমেছে; live runtime পরিবর্তিত হয়নি।

Compiler parent exit হওয়ার আগে/পরে worker group-এর signal race fix শুধু `nexa/deploy/run-bounded-build.mjs`-এ। Worker cleanup grace period ownership check রেখে waits; disappearing macOS group-এর transient EPERM-এর পরে exit independently যাচাই হয়। 13 budget/termination tests PASS, যার মধ্যে real delayed worker cleanup, hard RSS stop ও finite deadline আছে। Application source পরিবর্তিত নয়; তার পূর্ণ validation পুনর্ব্যবহার হবে। Build resume-এর আগে নতুন resource admission ও generated-path inventory আবশ্যক।

## Production compilation budget, 2026-10-06

Full application validation remains PASS: 826 assertions, core typecheck, full TypeScript ratchet 5830/5830. A compilation attempt with 5120 MiB heap and 7168 MiB total RSS cap reached a 7065 MiB process-tree peak and failed at the V8 heap ceiling. System pressure remained normal; the live runtime was retained. Managed webpack module parallelism is now one, alongside one Next.js build worker, to reduce in-flight transforms. Application routing and payload code are unchanged. The next attempt uses at most 6144 MiB heap with a bounded RSS watchdog and independently verified system headroom. Deployment remains pending until package and isolated smoke gates pass.

## Native compiler pool ও resource observation, 2026-10-07

01:31 বাংলাদেশ সময়ে render না থাকায় এবং physical headroom 19 GiB-এর বেশি হওয়ায়
compilation শুরু হয়েছিল। পরে headroom 8 GiB-এর নিচে নামায় watchdog নিজের process
group থামিয়েছে; peak 1238 MiB, exit 75। নতুন package তৈরি হয়নি; production এখনও
`79412f0ec` এবং health HTTP 200। 48টি applied copy source-এর সঙ্গে byte-match করে
pristine tree restore করা হয়েছে। হঠাৎ system memory কমার কারণ নিশ্চিত হয়নি।

Next.js worker ও webpack module limit-এর বাইরে SWC-এর native Rayon thread pool
আলাদা। Managed build environment এখন `RAYON_NUM_THREADS=1` সেট করে, inherited
বড় pool override করে। Installed darwin-arm64 SWC binary-তে এই control পাওয়া গেছে;
Rayon-এর [official thread-pool documentation](https://docs.rs/rayon/latest/rayon/struct.ThreadPoolBuilder.html#method.num_threads)
default pool-এর environment control ব্যাখ্যা করে। এটি compilation concurrency
কমায়; application model, prompt, context বা routing configuration বদলায় না।

Admission-এর 19 GiB minimum এবং চলমান build-এর 8 GiB reserve, pressure, swap,
disk ও RSS stop guards অক্ষত। ভবিষ্যৎ attempt-এর জন্য ছোট resource trace রাখা
হয়েছে; বড় heap dump, নতুন dependency environment বা user app shutdown করা হয়নি।

পরিবর্তনের পরে 13টি guard regression PASS; মোট test/formatter peak 194 MiB।
Installed SWC দিয়ে ছোট fixture-এর 4-thread ও 1-thread configuration-এ output
SHA-256 একই। এই fixture-এর process thread count দুই ক্ষেত্রেই 22; এটি পূর্ণ
compilation-এর memory reduction প্রমাণ করে না। Production build ও deploy বাকি।
