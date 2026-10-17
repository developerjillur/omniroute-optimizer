> **ঐতিহাসিক নথি — public copy, ২০২৬-১০-১৭।** মূল ঘটনার তারিখ ও ফল এই নথির নিজস্ব সময়ের জন্য প্রযোজ্য; পরের সংযোজন থাকতে পারে। বর্তমান অবস্থা ও কাজের নিয়মের জন্য [বর্তমান handoff](../CURRENT-STATUS-2026-10-17.md) পড়ুন। Private reference ও identifier সরানো হয়েছে; স্থানীয় evidence এখানে অন্তর্ভুক্ত নেই। পুরোনো cleanup, build, deploy বা service command বর্তমান অনুমতি হিসেবে ব্যবহার করবেন না।

# OmniRoute: Claude quota, account pool, Cost Analyzer ও নিরাপদ cleanup

তারিখ: 2026-10-06। রক্ষণাবেক্ষণ: Jillur Rahman। সময়: Asia/Dhaka।

## বিকেলের সর্বশেষ production প্রস্তুতি

Source এখন `a3571d5b29bf53e5fb4b23cbe43269596eb31122`। মূল `nexalance` clean/pristine; installed runtime এখনও `79412f0ec`, OmniRoute `3.8.51`। নতুন quota/Cost fix-এর production package build, isolated smoke, promotion ও native acceptance বাকি। আগের 761 execution a15864e12-এর evidence; নতুন source-এ 15 targeted policy/gate execution পাস, যার ছয়টি নতুন updater policy case।

সব apps খোলা রাখার নির্দেশ মেনে updater-এর default Desktop build ও Desktop close/replace বন্ধ রাখা হয়েছে; দুটির explicit opt-in আলাদা। Local updater আর Git push করে না। তিনটি obsolete runtime/smoke copy T7-তে full read-back hash verification-এর পরে internal disk থেকে সরানো হয়েছে; observed recovery 3.37 GiB। বর্তমান/পূর্ববর্তী package এবং immediate rollback retained।

পুরোনো matching TypeScript 6.0.3 incremental cache reuse করে unchanged full tsconfig-এ 1 GiB heap/1280 MiB total RSS limit-এ compiler চেষ্টা হয়েছে। Result `tscErrors=SKIP reason=tsc-signal-SIGABRT`, exit 75; peak 1113 MiB। এটি সম্পূর্ণ measurement বা পাস নয়। এরপর MDX source generation 153 MiB peak-এ সফল; বড় compiler/build-এর আগে RAM budget এখনও প্রয়োজন। Ratchet baseline, dashboard scope বা guard কমিয়ে success দেখানো হয়নি।

Latest saved resource snapshot: pressure normal, physical headroom প্রায় 9.70 GiB, internal free 23.19 GiB। আগের checks-এ warning pressure-ও ছিল। Default full candidate-এর প্রয়োজন 18 GiB headroom এবং updater-এর 24 GiB internal disk। User apps খোলা রাখা হয়েছে; runtime বন্ধ, account/configuration edit বা নতুন production promotion করা হয়নি।

Fresh retained quota read-এ তিন active Claude account পাওয়া গেছে। Priority 2-এর 2026-10-06 14:10:49 বাংলাদেশ সময়ের snapshot-এ session 99%, weekly 73%, Fable 100% remaining। Session reset 19:00 বাংলাদেশ সময়। এটি provider usage snapshot, নতুন source-এর সফল native request নয়। সকাল 10:34-এর নিচের all-exhausted diagnosis এখন ঐ সময়ের ইতিহাস।

দুই live health endpoint HTTP 200; CA/hostname-verified native ingress ও Bridge health contract পাস। বিস্তারিত [মূল handoff-এর deployment সংযোজন](HANDOFF-OMNIROUTE-2026-10-02.md#deployment-preparation-2026-10-06), নতুন receipt (স্থানীয় বা private reference; প্রকাশিত নয়) ও source delta recovery patch (স্থানীয় বা private reference; প্রকাশিত নয়)-এ আছে।

## সকাল 10:34-এর provider quota সিদ্ধান্ত: ইতিহাস

আজকের সর্বশেষ rate-limit incident-এ দুই connected Claude account-ই কাজের জন্য
প্রযোজ্য provider quota wall-এ পৌঁছেছে। এটি অতিরিক্ত local ব্যবহারসীমা নয়।
প্রথম account-এর weekly allowance 0%; দ্বিতীয়টির session allowance 0%, যদিও
weekly allowance 73% ছিল। Weekly quota বাকি থাকা session quota wall বাতিল
করে না। Fresh snapshot 2026-10-06 10:34 বাংলাদেশ সময়।

দ্বিতীয় account-এর provider-reported session reset 2026-10-06 14:00 বাংলাদেশ
সময়। প্রথমটির weekly reset 2026-10-11 23:00 বাংলাদেশ সময়। Reset deadline-এর
পরে usage check করে allowance নিশ্চিত হলে account আবার eligible হয়। Deadline
থাকা ভবিষ্যতের successful response-এর নিশ্চয়তা নয়।

বর্তমান live service সচল। নতুন source fix ও tests `nexa/`-তে আছে; **নতুন
production package এখনও build/deploy হয়নি**। পূর্ণ TypeScript ratchet নিরাপদ
RAM budget না পাওয়ায় শেষ করা যায়নি। Source QA এবং live deployment আলাদা।

## দুটি আলাদা ত্রুটি

### Available account থাকা সত্ত্বেও ভুল cached exhaustion

আগের incident-এ একটি account exhausted, অন্যটিতে quota ছিল। দ্বিতীয়টি
upstream `502/520` পাওয়ার পরে বর্তমান request-এর fallback থেকে বাদ পড়ে।
OmniRoute শুধু অবশিষ্ট exhausted candidate দেখে পুরো pool exhausted বলে
ভুল সিদ্ধান্ত নিয়েছিল। Request-level exclusion quota exhaustion-এর প্রমাণ নয়।

সংশোধিত credential selector authorized pool-এর excluded sibling-এ allowance
থাকলে মূল upstream error সংরক্ষণ করে। অন্য usable sibling থাকলে তাকে বেছে
নেয়। একই model বজায় থাকে। API-key allowlist বা explicit routing policy অতিক্রম
করা হয় না। Fix-এর মূল regression cases আগে ব্যর্থ, পরে পাস হয়েছে।

### আজকের সত্যিকারের exhausted pool

পরবর্তী live evidence-এ দুই account থেকেই আসল upstream `429` পাওয়া গেছে।
Quota refresh দ্বিতীয় account-এর session remainder-ও 0% নিশ্চিত করেছে। এই
অবস্থায় cached `429`, reset সময় ও no-upstream-attempt প্রত্যাশিত। নতুন request
বারবার provider-এ পাঠিয়ে allowance সৃষ্টি করা যায় না।

## Live configuration

| বিষয় | যাচাই করা অবস্থা |
|---|---|
| `Cached quota filtering` | ON; UI ও database-এ সংরক্ষিত |
| Per-request quota preflight | OFF |
| Default quota cutoff | 0% |
| Current API key | `Nexa-Skill-Family-Key` |
| Daily/weekly local USD usage limit | Disabled; values unset |
| Per-key request rate / token / monthly quota | কোনো enabled limit পাওয়া যায়নি |
| Per-key session cap | 0, অর্থাৎ configured cap নেই |
| Allowed connections/models | Unrestricted arrays |
| Connected Claude accounts | দুইটি active |
| Paid extra usage protection | চালু; নতুন paid usage enable করা হয়নি |

Diagnosis-এর সময়ে cached filtering সাময়িকভাবে OFF করা হয়েছিল। সেই সময় native
CLI/desktop response সফল হয়। দুই account-এর সত্যিকারের exhaustion নিশ্চিত
হওয়ার পরে 10:36–10:37 বাংলাদেশ সময়ের মধ্যে filtering আবার ON করা হয়।
OFF অবস্থাটি বর্তমান configuration হিসেবে ব্যবহার করবেন না।

Existing reset scheduler known blocking deadline পর্যন্ত unnecessary usage
probe স্থগিত রাখে। Global quota wall-এর সব blocking window পরিষ্কার হওয়ার সময়
ধরে; independent model scope আলাদা থাকে। Restart-এ persisted snapshot hydrate
হয়। Reset check ব্যর্থ হলে bounded পাঁচ-মিনিট retry থাকে। নতুন confirmed
allowance ছাড়া optimistic activation হয় না। Account active flag মুছে দেওয়া হয় না।

`disableCooling` account preference আগের অবস্থায় আছে; এই run-এ সেটি পরিবর্তন
করা হয়নি। Cached filtering provider-reported exhaustion পার্ক করে। আলাদা
throughput বা temporary upstream restriction quota screen থেকে নিশ্চিত করা
যায় না; সেই error-এর actual status/reset evidence দেখতে হবে।

## ২, ৩ ও ৫টি একই provider-এর account

Isolated database-এ distinct account IDs দিয়ে matrix চালানো হয়েছে।

| পরিস্থিতি | ফল |
|---|---|
| প্রথম N−1 account exhausted; শেষ account-এ 1% quota | শেষ account নির্বাচিত |
| Exhausted account-এর forced pin এবং 20 concurrent selections | usable sibling নির্বাচিত |
| Usable account-এ `502/520`, অন্যগুলি exhausted | মিথ্যা quota error দিয়ে মূল error প্রতিস্থাপন হয় না |
| 3/5 account pool-এ দুটি usable sibling; একটি বাদ | অন্য usable sibling নির্বাচিত |
| সব account exhausted, reset আলাদা | সবচেয়ে আগে recover করতে পারে এমন account-এর deadline ফেরত |
| নতুন confirmed quota evidence আসে | account আবার eligible; activation অক্ষত |
| Allowed pool-এর বাইরে usable account | restricted key-এর exhaustion bypass হয় না |

Suite-এ 17টি case আছে। একই provider/name-এর upsert এড়াতে fixtures-এর নাম,
credential ও ID আলাদা এবং unique ID assertion আছে। প্রথম matrix iteration-এর
তিনটি failure duplicate fixture name-এর কারণে ছিল; fixture সংশোধনের পরে
সব case পাস। এগুলো নতুন runtime bug হিসেবে রিপোর্ট করা হয়নি।

Live pool-এ এখনও দুইটি বাস্তব Claude account। তিন/পাঁচটি real subscription
account-এর live acceptance হয়নি। Valid credentials, entitlement ও ব্যবহারযোগ্য
quota থাকা account-কে local quota warning-এর জন্য বন্ধ করা যাবে না। Provider
outage, authentication failure বা model entitlement আলাদা failure হতে পারে।

## Cost Analyzer

অভিযোগের URL পুরোনো `local-default` API key-তে filtered ছিল:

```text
http://omni.local/dashboard/costs?range=all&apiKeyIds=private-id-024&groupBy=model
```

ওই key-র শেষ recorded request 2026-10-04। নতুন traffic অন্য key-তে যাচ্ছে;
সঠিক current key ও all-key view-এ নতুন usage/cost দেখা গেছে। History rewrite,
ledger deletion বা account mapping বদলানো হয়নি। Browser-এ all-key view রাখা
হয়েছে:

```text
http://omni.local/dashboard/costs
```

নতুন source-এ visible tab-এর 30-second refresh, focus/resume refresh, manual
Refresh, selected key-এর label ও all-key link আছে। Hidden tab polling বন্ধ;
in-flight request overlap হয় না; filter বদলালে abort এবং stale result isolation
আছে। Background failure-এ পুরোনো সফল result ও error রাখা হয়। Usage-limit
form-এর unsaved edit spend refresh-এ নষ্ট হয় না।

পুরোনো component দিয়ে দুই integration case ব্যর্থ হয়েছিল। পরিবর্তিত code দিয়ে
দুই integration, সাত hook/form এবং ছয় flat-rate disclosure test পাস। চারটি
production cost file-এর focused ESLint পাস। **এই নতুন UI এখনও live deploy হয়নি।**

Subscription cost estimate token-price equivalent; সেটি actual নতুন paid bill
নয়। Billed ledger ও estimate disclosure আগের অর্থ বজায় রাখে।

## Source, update durability ও attribution

Main branch: `nexalance`। Source:

```text
~/Developer/OmniRoute
HEAD: a15864e120e58f5f2c5a82fe46e974c3bfc30952
```

এই কাজের পাঁচটি local commit:

- `19bb33bc2`: upstream failure বনাম cached quota classification।
- `06a5a6722`: missing/unmeasured TypeScript gate production build বন্ধ করে।
- `e5711fd72`: compiler memory growth ও completed process cancellation।
- `e67dc1898`: physical memory reserve ও macOS pressure watchdog।
- `a15864e12`: Cost Analyzer live refresh ও multi-account recovery matrix।

Author/committer: Jillur Rahman। Public repository-তে push, PR বা issue তৈরি
করা হয়নি। Base upstream-এর সঙ্গে byte-pristine; main worktree clean। Manifest
115টি item: 74 patch, 39 new file, 2 tooling। 74টি patch apply check পাস।
Customization `nexa/`-র বাইরে commit হয়নি।

নতুন update-এ patch drift, typecheck/ratchet, regression, full-dashboard package
check, isolated smoke, native routing ও rollback verification বাদ দেওয়া যাবে
না। Future provider/client protocol বদলালে নতুন QA দরকার হবে।

## Test evidence

| Check | ফল |
|---|---|
| Bridge/quota/backend | 99 files, 576 tests পাস |
| Bridge/Cost UI | 7 files, 36 tests পাস |
| Deployment/resource/TypeScript guard tests | 43 tests পাস |
| Protocol/security/trace/idempotency suites | 106 tests পাস |
| `typecheck:core` | পাস |
| Focused Cost ESLint | পাস |
| Base pristine + overlay patch health | পাস |
| Full TypeScript ratchet | অসম্পূর্ণ; নতুন final attempt preflight-এ exit 75 |
| নতুন package build, isolated package smoke ও promotion | হয়নি |

মোট 761টি relevant test execution পাস। Focused test rerun-কে এই সংখ্যায় আবার
যোগ করা হয়নি। এটি repository-এর প্রতিটি unrelated test বা 24-hour soak নয়।

Quota শেষ হওয়ার আগে native validation:

- Single native CLI Opus response: `BRIDGE_OK`।
- তিনটি concurrent native CLI session: দুটি Opus, একটি Sonnet; তিনটিই সফল।
- Native desktop Code view: `NATIVE_DESKTOP_BRIDGE_OK`।
- Short prompts; tools/hooks/persistence disabled; full-context load বা দীর্ঘ
  unattended session stress হয়নি।

এই native tests বর্তমান installed package-এর উপর হয়েছে। Undeployed source-এর
native production acceptance হিসেবে এগুলো গণনা করা যাবে না।

Routing analysis-এ `usage_history.account_label_priority` routing priority নয়।
সংশোধিত receipt `call_logs.connection_id`-কে `provider_connections.priority`-র
সঙ্গে join করে। `live-routing-verification-corrected.json` authoritative;
পুরোনো exploratory receipt-এর label ব্যবহার করবেন না।

## RAM ও build guard

পুরোনো `memory_pressure -Q` percentage-কে physical RAM হিসেবে ধরলে headroom
বেশি দেখাচ্ছিল। নতুন guard `vm_stat`-এর free + inactive + speculative pages
গুনে; purgeable pages overlap হওয়ায় আবার যোগ করে না।

Large job-এর আগে user apps-এর জন্য 10 GiB reserve ও পূর্ণ process budget
দরকার। Runtime-এ pressure warning/critical, headroom 8 GiB-এর নিচে, swap
1 GiB বৃদ্ধি বা internal disk 15 GiB-এর নিচে হলে শুধু task-এর process group
থামে। Production updater-এর separate build disk gate 24 GiB।

Final compiler preflight-এ 4 GiB total job budget-এর জন্য 14 GiB headroom
চেয়েছিল; প্রায় 13–13.8 GiB পাওয়া গেছে। Compiler launch হয়নি, exit 75 এবং
peak 0 MiB। আগের compiler attempts-এ crash/pressure ঘটেছিল; incomplete
measurement-কে green gate বলা হয়নি। Ratchet baseline বাড়ানো বা gate bypass
করা হয়নি। User apps, browser tabs বা unrelated job বন্ধ করা হয়নি।

## Storage cleanup ও recovery

T7 mounted যাচাই করে চারটি inactive source checkout archive করা হয়েছে:
`agent-bridge-update-durability`, `auto-update-command`, `claude-quota-alerts`,
`gpt-6-1-sol-support`। Archive-এ মোট 96,151 file hash-verified। Local Git
metadata snapshot ও branches আছে; partial clone-এর পূর্ণ historical bundle নেই।
Dependencies duplicate archive করা হয়নি।

মূল চারটি checkout removal interval-এ internal free space 2,321,977,344 bytes,
প্রায় 2.16 GiB বেড়েছে। পরবর্তী quota-fix worktree cleanup interval-এ আরও প্রায়
0.71 GiB free-space বৃদ্ধি নথিভুক্ত। Disk observation-এ অন্য apps-এর I/O-ও
থাকে; logical Finder size-কে actual reclaimed storage বলা হয়নি।

আজকের দুটি নিজস্ব fix worktree commit/source archive যাচাই করে সরানো হয়েছে।
শেষ cost worktree-এর 24,047 tracked file main-এর সঙ্গে মিলে গেছে। Git removal
শেষে Finder-এর `.DS_Store` অবশিষ্ট ছিল; সেটি একা যাচাই করে সরানো হয়েছে। Shared
`node_modules` target retained। একটি failed-build directory-র 33-byte log
preserve করে directory সরানো হয়েছে। Task-created 60টি QA fixture/cache root
সরানো হয়েছে। Successful outputs, source, data, packages ও rollback retained।

শেষ storage snapshot-এ internal disk-এ প্রায় 22.96 GiB free। Runtime ও data
T7 kit-এর বাইরে রয়েছে:

```text
~/.omniroute-runtime
~/.omniroute-local
```

Verified backup/evidence directory:

```text
<local-setup>/backup/omniroute-worktrees-2026-10-06-092216
```

Latest `nexa-overlay-a15864e12.tar`-এ 182 tracked overlay file read-back
hash-verified। `quota-cost-update-a15864e12.patch`-এ পাঁচটি source commit আছে।
`quota-cost-source-recovery-a15864e12.json` SHA-256 ও file size রাখে। Previous
e67 archive ও original checkout archives overwrite করা হয়নি।

## চূড়ান্ত live verification

- `omni.local/healthz`: HTTP 200।
- `127.0.0.1:28128/healthz`: HTTP 200।
- Agent Bridge `127.0.0.1:8443` listener সচল।
- Native `127.0.0.1:443`-এ `api.anthropic.com` SNI-সহ CA/hostname validation
  সফল; DNS `127.0.0.1` ও `::1`।
- আটটি protected non-overlay file-এর hash আগের receipt-এর সঙ্গে মিলে গেছে:
  `.env`, package/lock, shared compiler, installed updater/runtime binary এবং
  দুই root helper।
- Current/previous production package pointer অপরিবর্তিত। Native app bundle,
  account login, CA trust ও Local by Flywheel configuration পরিবর্তিত হয়নি।
- সর্বশেষ যাচাইয়ে গত 8 ঘণ্টার recorded Claude `model`/`requested_model`-এ
  Fable request পাওয়া যায়নি। এটি OmniRoute-এর সংরক্ষিত log-এর সীমার মধ্যে;
  অন্য app-এর usage বা provider accounting-এর অনুপস্থিতি প্রমাণ করে না।

## পরবর্তী release-এর কাজ

Source update সম্পূর্ণ, live setting সংশোধিত। Full compiler ও build-এর
resource prerequisites পূরণ হলে isolated worktree-এ normal `omni-ctl
build-only`/`redeploy` flow চালাতে হবে। সব mandatory gate green, packaged
dashboard check ও isolated smoke সফল হওয়ার পরে promote; তারপর available
account দিয়ে native desktop/CLI response ও service restart QA পুনরায় করতে হবে।

Provider-এর সব account exhausted হলে একই model-এর continuous কাজের জন্য
reset বা অতিরিক্ত eligible capacity প্রয়োজন। নিজের account-এর আসল quota
বাড়ানো, paid usage শুরু করা বা model downgrade এই পরিবর্তন করেনি। 24-hour
uninterrupted কাজ, পূর্ণ context stress, real future reset ও Mac reboot এখনও
এই run-এ যাচাই হয়নি।
