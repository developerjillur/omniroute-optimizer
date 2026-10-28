# OmniRoute native harness ও usage review — ২০২৬-১০-১৮

অবস্থা: **বর্তমান source validation সম্পূর্ণ: 54টি নতুন case, 36-file native gate 247/247, বিস্তৃত usage/stream 364/364, extractor compatibility 86/86, Bridge 621/621 ও UI fixture 39/39 PASS। Core typecheck/full ESLint PASS; full ratchet 5803 ≤ 5830। Full dashboard/CLI build, 620/620 static pages, package gates ও আলাদা installed-package HTTP smoke PASS। নতুন runtime `15533a05c` ব্যবহারকারীর অনুমতিতে ২০২৬-১০-১৮ ১১:৪৫:৩৬ Asia/Dhaka-তে LIVE হয়েছে। Dashboard UI, management API, native TLS/DNS, migration 198 ও semantic retention যাচাই PASS। নিজস্ব native Artifact comment/cold restore/view reconnect এবং আটটি configured provider entry-এর সাতটির নির্বাচিত model-এ Agent + saved-resume actual trace-সহ PASS। Direct Claude Haiku cached quota gate HTTP 429-এর কারণে অসম্পূর্ণ। বর্তমান ফল [native provider acceptance](NATIVE-PROVIDER-ACCEPTANCE-2026-10-18.md)-এ।**

এটি preventive audit। ব্যবহারকারী নির্দিষ্ট token-burn ঘটনা দেখেছেন বলে জানাননি। লক্ষ্য হলো অপ্রয়োজনীয় generation, ভুল accounting, cache continuity, latency বা native multi-agent compatibility defect আলাদা করে চিহ্নিত করা। পাওয়া evidence দিয়ে সব request স্বাভাবিক, duplicate billing শূন্য বা সব harness feature native-এর সমান—এমন নিশ্চয়তা দেওয়া যায় না।

## সীমানা ও source state

Audit শুরুর primary checkout ও live runtime ছিল `2b4158371`। নতুন পরীক্ষিত code/package commit `15533a05c4c73a9db9fcecf96d46f5d3b5e1979f` এখন live; local primary `nexalance`-এ overlay fast-forward করা হয়েছে। Deployment tooling/documentation-এর parent commit `789e92e55d838f17ee35b6d5afd6566a94b8b28e`; পরের report-only commit packaged runtime code বদলায় না। Public distribution-এর পূর্বে verified documentation commit `df873a8`। নতুন কাজ শুধু নিজস্ব recovery worktree-র `nexa/`-তে। Pristine upstream target file বদলানো হয়নি। অনুমোদিত deployment নতুন runtime promote ও existing user LaunchAgent restart করেছে; live DB-তে migration 198 হয়েছে। Operator pricing override, root ingress, hosts ও LaunchDaemon configuration অক্ষত। Claude Code CLI/native app, binary, settings, login ও updater পরিবর্তন করা হয়নি।

২০২৬-১০-১৮ ব্যবহারকারী apps বন্ধ করার পরে full validation ও full build/package অনুমোদন দিয়েছেন। পরে ব্যবহারকারী নতুন build apply করার অনুমতি দিয়েছেন এবং সেই deployment সম্পন্ন হয়েছে। LaunchDaemon change, sudo বা git push-এর জন্য এই অনুমোদন ব্যবহার করা হয়নি। পুরোনো internal fallback volume পড়া বা বদলানো হয়নি। T7-তে কোনো লেখা, overwrite বা deletion হয়নি। Deployment শেষে follow-up automation PAUSED ছিল। পরের native QA-তে ব্যবহারকারীর পৃথক অনুমতিতে remaining Claude acceptance-এর জন্য ACTIVE হয়েছে।

## Data window, retention ও কম RAM-এর পদ্ধতি

Fixed window: `2026-10-10T18:00:00.000Z` থেকে inclusive cutoff `2026-10-18T02:26:02.000Z`। Asia/Dhaka-তে ১১ অক্টোবরের শুরু থেকে ১৮ অক্টোবরের আংশিক দিন; exact rolling 168 hours নয়। Migration-এর আগের ও পরের দিন আলাদা রাখা হয়েছে।

- `usage_history`: **114765 rows**, **38টি observed provider/model জুটি**।
- Corrected daily metadata pass: **99982 retained call rows**। পরের routing/ID pass: **99927 rows**। প্রথমে 100000-row cap দেখা হয়েছিল; live retention চলায় আলাদা সময়ের read snapshot-এর coverage বদলেছে।
- Earliest initially retained call: `2026-10-12T10:46:00.220Z`; detailed artifact date directories শুধু ১৭ ও ১৮ অক্টোবরের। ১১ অক্টোবরের 8976টি GPT 6.1 Sol usage row-এর raw call coverage নেই। এটিকে duplicate generation বলা যাবে না।
- `usage_history` ও `call_logs` একই request-এর overlapping evidence; তাদের token বা row যোগ করে total করা হয়নি।
- একদিন করে indexed, read-only SQLite query; 256 KiB cache, mmap বন্ধ, 2-second query deadline ও 64 MiB helper RSS bound। Daily collectors সর্বোচ্চ প্রায় **20.5 MiB**, latency collector **20.33 MiB**, cost/routing collector **18.03 MiB** নিয়েছে। Broad collector চালানো হয়নি।
- Source-only isolated lookup evaluation-এ application module, DB driver বা native client শুরু করা হয়নি; সর্বোচ্চ প্রায় **59.2 MiB**। এগুলো integration/regression PASS নয়। এই metadata/source-observation পর্যায়ে নতুন provider inference probe চালানো হয়নি; পরের authorized deployment smoke আলাদা section-এ আছে।

প্রথম TTL aggregate draft-এ NULL cache-write total-কে zero ধরে কিছু row ভুলভাবে invalid বলা হয়েছিল। সেই v1 evidence রাখা আছে; রিপোর্টে corrected v2 ব্যবহৃত। **Known total থাকলে genuine contradictory TTL split পাওয়া যায়নি**। মোট write অজানা অথচ TTL detail আছে—এমন পুরোনো row আলাদা unknown category-তে রাখা হয়েছে।

### দিন অনুযায়ী coverage

| Dhaka দিন  | Usage rows | Retained calls, corrected daily pass |
| ---------- | ---------: | -----------------------------------: |
| 2026-10-11 |      10915 |                                    0 |
| 2026-10-12 |      12960 |                                 5271 |
| 2026-10-13 |      18657 |                                19356 |
| 2026-10-14 |      19572 |                                20351 |
| 2026-10-15 |      22097 |                                22843 |
| 2026-10-16 |      17237 |                                17951 |
| 2026-10-17 |      11641 |                                12281 |
| 2026-10-18 |       1686 |                                 1929 |

## Token use ও cost-এর ব্যাখ্যা

| Model             | Usage rows | Cache-read / inclusive input | বর্তমান configured API-equivalent subtotal |
| ----------------- | ---------: | ---------------------------: | -----------------------------------------: |
| Claude Opus 5.5   |      48433 |                       97.62% |                                   $5790.26 |
| Claude Sonnet 5.5 |      42071 |                       93.65% |                                   $2081.21 |
| GPT 6.1 Sol       |       9004 |                       97.98% |                                    $773.66 |

Input cache-inclusive; cache read/write আবার input-এর ওপর যোগ করা হয়নি। Reasoning output-এর subset, দ্বিতীয় output charge নয়। বড় cumulative input counter-কে পুরোটা fresh prompt ধরে token burn বলা যাবে না। Opus/Sonnet-এর cache-share ভালো হলেও request-প্রতি cache continuity, প্রত্যেক child agent বা সব idle gap-এর সফলতা এতে প্রমাণ হয় না।

বর্তমান config অনুযায়ী দাম পাওয়া **102461 rows / 15 model জুটির subtotal $8796.56227076**। বাকি **12304 rows / 23 জুটির দাম অজানা**, free বা $0 বলে ধরা হয়নি। GPT long-context threshold ও service-tier multiplier request-প্রতি ব্যবহার করা হয়েছে; সব input যোগ করে একটি long-context request বানানো হয়নি।

এই subtotal **subscription invoice, plan/weekly limit, ঐতিহাসিক effective price বা সম্পূর্ণ খরচ নয়**। এটি retained numeric usage-এ বর্তমান configured rate প্রয়োগ করা partial API-equivalent estimate। `usage_history`-এ provider exact USD ticks বা TTL split নেই; সেগুলো পরে অনুমান করে পূরণ করা হয়নি। Explicit operator price বা historical ledger পরিবর্তন করা হয়নি।

## Findings ও প্রস্তুত পরিবর্তন

### F1 — সাধারণ cost estimate-এ cache TTL হারায়; local fix-এর 33টি fixture regression PASS

Audit শুরুর deployed baseline `2b4158371`-এ `computeCostFromPricing` সব cache creation-এর জন্য একটি `cache_creation` rate ব্যবহার করে। `normalizeUsage` ও `usage_history` 5m/1h detail রাখে না। `nativeApiEquivalent` ইতিমধ্যে TTL আলাদা করে; ফলে dashboard/ledger paths ভিন্ন estimate দিতে পারে।

একটি bounded 100-row Claude sample-এ write 1381792 tokens: 5m 990771, 1h 391021; 43টি row-এ positive 1h ছিল। Synthetic 1M-write fixture-এ explicit 1h rate $4 হলেও deployed generic calculator $2.50 ব্যবহার করে। এটি estimate defect; বাড়তি accepted generation-এর প্রমাণ নয়।

নতুন deployed build-এর `nexa/` overlay এই পথগুলো বহন করে:

- [Validated TTL metadata](../new/src/lib/usage/cacheCreationTtl.ts) provider extraction, native iteration metering, streaming completion ও tool-loop aggregation-এ 5m/1h detail রাখে। ব্যর্থ পরের tool leg-এর আগের সফল usage-ও detail ধরে রাখে। Malformed, unsafe বা total-এর চেয়ে বড় split-কে known TTL বানায় না।
- [Migration 198](../new/src/lib/db/migrations/198_usage_history_cache_ttl.sql) দুটি nullable history column যোগ করে। পুরোনো row backfill/default zero পায় না। একই observed usage-এর compatible নতুন metadata duplicate row তৈরি না করে enrich করতে পারে। **Authorized deployment-এ migration 198 live database-এ হয়েছে; আগের ২০২,০২৮টি usage row-এর TTL NULL অক্ষত।**
- [Cost calculator patch](../patches/src__lib__usage__costCalculator.ts.patch) known 1h write-এর আলাদা rate ব্যবহার করে; explicit zero override রাখে। Native Claude/cc/anthropic-এ rate না থাকলে configured input-এর 2x; অন্য provider-এ legacy fallback। Known 5m এবং unclassified remainder legacy write rate রাখে। Inclusive input/cache, reasoning output, exact provider-cost ও flat-rate precedence আলাদা থাকে।
- [SQL aggregation helper](../new/src/lib/db/usageAnalytics/cacheTtl.ts), analytics/legacy stats, connection/provider windows, combo forecast ও archive patch একই TTL detail বহন করে। প্রতিটি row sum করার আগে validate হয়; invalid row অন্য row-এর write borrow করতে পারে না। পুরোনো internal SQL source-এ নতুন columns না থাকলে NULL compatibility থাকে। Archive per-request cost একবার হিসাব করে stored value রাখে।

৩৩টি নতুন TTL regression case PASS: [cost 14](../new/tests/unit/prompt-cache-ttl-cost.test.ts), [pure metering 3](../new/tests/unit/cache-ttl-metering.test.ts), [extraction 2](../new/tests/unit/cache-ttl-extraction.test.ts), [tool/failure 3](../new/tests/unit/cache-ttl-tool-loop.test.ts), [stream 1](../new/tests/unit/cache-ttl-stream.test.ts), [migration/history/SQL 7](../new/tests/unit/db/cache-ttl-history-analytics.test.ts), [route 1](../new/tests/unit/db/cache-ttl-analytics-route.test.ts), [archive 1](../new/tests/unit/db/cache-ttl-archive.test.ts), [forecast 1](../new/tests/unit/db/cache-ttl-forecast.test.ts)। Mixed/partial/unknown TTL, malformed/unsafe total, late streaming metadata ও raw native frame preservation অন্তর্ভুক্ত। **এগুলো source/isolated-fixture verification; live migration বা deployed fix নয়।**

### F2 — explicit operator price ও বর্তমান official rate ভিন্ন

বর্তমান read-only snapshot-এ Sonnet 5.5: input $2, output $10, cached $0.20, 5m write $2.50 per million; 1h rate অনুপস্থিত। Official page-এ cached $0.10, 5m $2.50 ও 1h $4। Opus 5.5 override input $4, output $20, cached $0.20, write $5; official 1h $8।

এগুলো বর্তমান rate-এর পার্থক্য; পুরোনো সাত দিনের invoice হিসেবে পুনর্লিখন করা যাবে না। Explicit override অক্ষত আছে। Catalog correction-এ effective date/source ও override precedence আলাদা রাখতে হবে। [Official prompt caching pricing](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)

### F3 — multi-agent attribution ও final-wire evidence আংশিক

Session/cache-group tags আছে; dedicated agent/parent-agent/request-class columns নেই। পাঁচটি ছোট artifact এবং আলাদা তিনটি Haiku artifact sample-এ usable final upstream header/pipeline map ছিল না। Header না পাওয়া মানে client header পাঠায়নি নয়। Native origin, true child fan-out, classifier/suggestion বা background request-কে সব ক্ষেত্রে নির্ভরযোগ্যভাবে ভাগ করা যায়নি।

Recorded effort pairs-এ Sonnet 5.5 high→high 39714 rows; Opus 5.5 max→max 34320 এবং xhigh→xhigh 9551 rows। Haiku 5.5 medium→unknown 2514 rows; একই model medium→medium 179 rows। Unknown-কে forced downgrade বা বাড়তি charge ধরে নেওয়া হয়নি। F5-এর independent source evidence আলাদা। Provider prefix সরিয়ে requested/actual model পার্থক্যকে route mismatch বলা হয়নি।

### F4 — partial provider override alias default ঢেকে দেয়; local fix-এর 7টি regression PASS

`getPricingForModel` আগে provider dictionary নির্বাচন করে। `claude`-তে একটি model-এর override থাকলেই অন্য model-এর `cc` default আর পাওয়া যায় না। Actual source-এর isolated lookup-এ চারটি observed model-এ বিষয়টি পুনরুৎপাদিত:

| Model                     | Usage rows | Canonical lookup আগে | Alias default |
| ------------------------- | ---------: | -------------------- | ------------- |
| claude-opus-5             |       1318 | অনুপস্থিত            | আছে           |
| claude-sonnet-5           |       1098 | অনুপস্থিত            | আছে           |
| claude-fable-5-1          |        287 | অনুপস্থিত            | আছে           |
| claude-haiku-4-5-20251001 |         89 | অনুপস্থিত            | আছে           |

[Pricing patch](../patches/src__lib__db__settings__pricing.ts.patch) model না পেলে equivalent alias-এ fallback করে; exact provider/model override ও regional fallback-এর পুরোনো boundary অক্ষত রাখে। Missing Haiku 5.5 price বানিয়ে দেয় না। Isolated source evaluation-এ চারটি lookup ঠিক হয়েছে এবং existing Opus/Sonnet 5.5 override বজায় আছে।

চারটির 2792 row-এ বর্তমান alias default ব্যবহার করলে অতিরিক্ত **$365.32228990 configured API-equivalent value** পাওয়া যায়। এটি আগে না-কাটা invoice বা আসল নতুন spend নয়। সাতটি [DB regression case](../new/tests/unit/db/pricing-provider-alias-defaults.test.ts) fresh fixture database-এ **PASS**। নতুন fix দিয়ে বাকি সব unpriced model সমাধান হয়েছে বলা যাবে না।

### F5 — Haiku 5.5-এর native effort/format ভুল legacy branch-এ বাদ পড়ে; local fix-এর 10টি mocked regression PASS

Non-Thread native executor-এর default path সব `haiku` model-এর `output_config` বাদ দেয়। Haiku 5.5 effort ও structured-output নির্দেশ সমর্থন করে; provider capability function-ও আগে সব Haiku-র `max` অস্বীকার করত। Official current contract-এ Haiku 5.5 low/medium/high/xhigh/max গ্রহণ করে। [Effort reference](https://platform.claude.com/docs/en/build-with-claude/effort), [Haiku 5.5 migration guide](https://platform.claude.com/docs/en/models/haiku-5-5/migration-guide)

Actual source block-এর isolated evaluation-এ:

- Haiku 5.5-এর explicit low/max effort ও structured-output format আগে হারায়, draft-এ থাকে।
- Unset effort unset থাকে; নতুন করে high inject করা হয় না। Explicit disabled thinking থাকে।
- পুরোনো Haiku 4.5-এর manual enabled thinking custom-mode path-এ ভুল adaptive remap এড়ানো হয়েছে; তার legacy effort exclusion রাখা হয়েছে।
- Opus 5.5 max অপরিবর্তিত। Haiku 5.5-এর explicit operator AUTO mode documented strip policy পায়; live operator config বদলানো হয়নি।

Changed overlay: [base executor patch](../patches/open-sse__executors__base.ts.patch), [capability patch](../patches/open-sse__config__providerModels.ts.patch), [small model helper](../new/open-sse/config/claudeHaikuCapabilities.ts)। দশটি [mocked-dispatch regression case](../new/tests/unit/haiku-5-5-native-effort.test.ts) actual source executor-এর captured mock dispatch-এ **PASS**। এটি native client বা real upstream inference PASS নয়। প্রথম source-adapter attempt-এর TypeScript const assertion parse error ঠিক করার পরে evaluation সম্পন্ন হয়েছে; সেই parse failure application defect ছিল না।

বর্তমান sample-এ হারানো effort ছিল medium, যা Haiku 5.5-এর default-ও হতে পারে। তাই এই bug-কে গত কয়েক দিনের অতিরিক্ত token charge-এর প্রমাণ বলা যায় না। ভবিষ্যতে explicit low/max intent ও structured output নষ্ট না হওয়া গুরুত্বপূর্ণ। Thinking field এই পুরোনো Haiku branch-এ সবসময় delete হতো—এমন দাবি করা হচ্ছে না।

## Error, retry ও Thread recovery

- Retained calls-এ **1063 Thread replay-required 404**: 195 local owner-replay gate, 868 upstream/other Thread replay category। Recorded input/output zero; upstream billing zero প্রমাণ হয় না।
- পাঁচটি recent failed continuation-এর পরে একই session/cache-group/model-এ 200 আছে। Strict full-history `thread:create` + exact sparse suffix preservation প্রমাণ করা যায়নি। এগুলো inconclusive recovery samples; automatic UI recovery বা পাঁচটি definite failure নয়।
- এছাড়া quota/lease 429, timeout 504/502, cancellation 499 এবং provider failures আছে। Failed usage rows-এর recorded input/output zero; ambiguous acceptance/partial response-এর সম্ভাবনা ছাড়া billing সিদ্ধান্ত নেওয়া হয়নি।
- Recorded positive resilience-action flags পাওয়া যায়নি। Instrumentation path সীমিত হওয়ায় এটিকে retry হয়নি প্রমাণ ধরা যায় না।
- Claude response ID থাকা **57115 rows**-এ একই দিনের provider-scoped পুনরাবৃত্তি পাওয়া যায়নি। Cross-day duplicate ID পরীক্ষা হয়নি; অন্য provider-এ ID coverage নেই। আলাদা ID-তেও duplicate generation হতে পারে, আর একই ID নিজেও duplicate billing-এর প্রমাণ নয়।
- Current Thread-owner retention source 24h/10000 entries; read-only observation-এ 9217 owner record ছিল। এই snapshot থেকে আগের 404-এর নির্দিষ্ট কারণ জানা যায় না। TTL/cap, quota, lease, cooldown বা operator policy বদলানো হয়নি।

## Recorded latency

১৫ অক্টোবরের শুরু থেকে একই cutoff পর্যন্ত successful positive-token **51607 rows**; raw request/response text নয়। Percentile nearest-rank।

| Model              | E2E samples |    E2E p50 / p95 |  Recorded TTFT p50 / p95 |
| ------------------ | ----------: | ---------------: | -----------------------: |
| Opus 5.5           |       25042 | 8.983s / 42.888s |         5.603s / 29.310s |
| Sonnet 5.5         |       20720 | 5.765s / 33.448s |         3.114s / 18.291s |
| Haiku 5.5          |        3347 | 4.149s / 17.988s |         1.946s / 11.617s |
| GPT 6.1 Sol medium |        1735 | 3.445s / 30.841s | usable recorded TTFT নেই |

এগুলো mixed real workloads, context, output size ও streaming/non-streaming path-এর stored counters। Non-streaming stats TTFT হিসেবে full response duration-ও লিখতে পারে। Direct-native equivalent-workload baseline, gateway-only overhead বা provider decoding speed এ দিয়ে মাপা হয়নি। Haiku-র TTFT sample 1408, Opus 24789, Sonnet 20484; missing TTFT-কে zero ধরা হয়নি।

## সব observed model-এর coverage

নিচের table retained usage metadata ও বর্তমান configured lookup-এর coverage। কোনো model-এর সারি থাকা মানে fresh native tool/harness QA PASS নয়। Failed rows-ও count-এর অংশ। Unpriced মানে দাম অজানা; free নাম থাকলেও নিজে থেকে zero rate বসানো হয়নি। API-equivalent column-এ current known-rate subtotal দেওয়া, actual invoice নয়।

| Provider    | Model                                              | Usage rows | Failed | Current price lookup | Partial API-equivalent USD |
| ----------- | -------------------------------------------------- | ---------: | -----: | -------------------- | -------------------------: |
| claude      | claude-opus-5-5                                    |      48433 |    835 | পাওয়া গেছে           |               $5790.260010 |
| claude      | claude-sonnet-5-5                                  |      42071 |    620 | পাওয়া গেছে           |               $2081.212420 |
| codex       | gpt-6.1-sol                                        |       9004 |    528 | পাওয়া গেছে           |                $773.662753 |
| claude      | claude-haiku-5-5                                   |       6674 |     40 | দাম অজানা            |                          — |
| codex       | gpt-6.1-sol-medium                                 |       1989 |     79 | পাওয়া গেছে           |                 $10.193519 |
| claude      | claude-opus-5                                      |       1318 |     57 | alias default ঢাকা   |                          — |
| claude      | claude-sonnet-5                                    |       1098 |      2 | alias default ঢাকা   |                          — |
| antigravity | gemini-3.8-flash-high                              |       1033 |    418 | দাম অজানা            |                          — |
| antigravity | gemini-3.1-pro-high                                |        834 |    171 | দাম অজানা            |                          — |
| codex       | gpt-6-luna                                         |        730 |      0 | পাওয়া গেছে           |                  $0.236836 |
| claude      | claude-fable-5-1                                   |        287 |      7 | alias default ঢাকা   |                          — |
| openrouter  | nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free |        179 |     92 | দাম অজানা            |                          — |
| antigravity | gemini-3.8-flash-medium                            |        156 |     72 | দাম অজানা            |                          — |
| codex       | gpt-6-astra                                        |        147 |      6 | পাওয়া গেছে           |                $131.591480 |
| openrouter  | xiaomi/mimo-v2.6-flash                             |        126 |      1 | দাম অজানা            |                          — |
| openrouter  | qwen/qwen3.8-omni-flash                            |        122 |      0 | দাম অজানা            |                          — |
| openrouter  | openai/gpt-audio-mini                              |        121 |      0 | দাম অজানা            |                          — |
| openrouter  | mistralai/voxtral-small-24b-2507                   |         93 |     57 | দাম অজানা            |                          — |
| claude      | claude-haiku-4-5-20251001                          |         89 |      0 | alias default ঢাকা   |                          — |
| antigravity | gemini-3.1-pro-low                                 |         56 |     56 | দাম অজানা            |                          — |
| openrouter  | openai/gpt-audio                                   |         39 |      0 | দাম অজানা            |                          — |
| antigravity | gemini-pro-agent                                   |         36 |     36 | দাম অজানা            |                          — |
| codex       | gpt-5.6-sol-high                                   |         25 |     11 | পাওয়া গেছে           |                  $4.806370 |
| codex       | gpt-6.1-sol-high                                   |         22 |      0 | পাওয়া গেছে           |                  $0.611171 |
| codex       | gpt-6-astra-high                                   |         13 |      9 | পাওয়া গেছে           |                  $1.698370 |
| codex       | gpt-6.1-sol-low                                    |         13 |      2 | পাওয়া গেছে           |                  $0.081404 |
| openrouter  | thinkingmachines/inkling:free                      |         13 |     13 | দাম অজানা            |                          — |
| openrouter  | google/gemini-3.1-pro-preview                      |          6 |      0 | দাম অজানা            |                          — |
| openrouter  | google/gemini-3.8-flash                            |          6 |      0 | দাম অজানা            |                          — |
| openrouter  | xiaomi/mimo-v2.6-pro                               |          6 |      0 | দাম অজানা            |                          — |
| openrouter  | google/lyria-3-clip-preview                        |          5 |      1 | দাম অজানা            |                          — |
| antigravity | gemini-3.7-flash-high                              |          4 |      4 | পাওয়া গেছে           |                  $0.000000 |
| antigravity | gemini-3.8-flash-tiered                            |          4 |      1 | দাম অজানা            |                          — |
| codex       | gpt-5.6-sol-medium                                 |          4 |      0 | পাওয়া গেছে           |                  $2.096660 |
| glmt        | glm-5.3-max                                        |          4 |      0 | পাওয়া গেছে           |                  $0.107420 |
| openrouter  | google/lyria-3-pro-preview                         |          3 |      0 | দাম অজানা            |                          — |
| openrouter  | auto                                               |          1 |      0 | পাওয়া গেছে           |                  $0.000534 |
| codex       | gpt-6-luna-low                                     |          1 |      0 | পাওয়া গেছে           |                  $0.003324 |

## Native harness compatibility matrix

| আচরণ                          | বর্তমান evidence                                                                                                  | বাকি verification                                                                                         |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Thread, tools, context/effort | Native fields preserve/restore, owning-account sparse continuation ও completed-response owner commit source-এ আছে | Current source regressions PASS; নতুন package-এ নিজস্ব session-এর actual result বাকি                      |
| Parent/child isolation        | সাতটি entry-তে actual single-child nonce ও saved result PASS                                                      | CLI rows-এ native identity tags নেই; concurrent multi-child isolation প্রমাণিত নয়                         |
| Cancellation/no replay        | Caller abort ও ambiguous accepted generation POST replay guard source-এ আছে                                       | Synthetic transport regressions PASS; নতুন package-এ নিজের stream cancellation বাকি                       |
| Cumulative usage/cache        | Iteration merge ও reasoning-inclusive accounting correction পূর্বের source-এ আছে                                  | TTL source/DB regressions PASS; নতুন live wire→ledger verification বাকি                                   |
| Effort/model continuity       | Opus/Sonnet matched pairs আছে; Haiku 5.5 F5 source fix ও mocked dispatch PASS                                     | নতুন package-এর একটি প্রয়োজনীয় own-session check                                                          |
| Hosted tools/MCP              | Native Thread payload/beta ও incompatible WebSearch fail-before-dispatch source-এ আছে                             | Claude hosted capability বনাম অন্য provider-এর supported subset আলাদা QA                                  |
| Resume/compaction             | সাতটি entry-তে নতুন process-এ actual saved history/child-result continuity PASS                                   | Compaction ও matched direct-native baseline এই QA-তে হয়নি                                                 |
| Artifact monitor              | নিজের native Artifact-এ cold restore ও view reconnect-এর পরে A/B reply/resolve UI-তে PASS                         | Historical unavailable notice-এর inner cause, arbitrary network fault ও permanent watcher fix প্রমাণিত নয় |

আগের ১৪ অক্টোবরের focused GPT/GLM/return-Claude actual tool QA পুনরায় চালানো হয়নি। সেটি বর্তমান সব feature বা নতুন Haiku fix-এর PASS নয়। Client-feature check-এর read-only intake-এ standalone CLI/extension 2.1.301, observed native engine 2.1.299, bundle 2.42304.0 ছিল। Official 2.1.302 release-এর cache/tool-search/Artifact/effort fixes relevant leads; এই installation-এর root cause প্রমাণ নয় এবং client update অনুমোদিত নয়। [Official release](https://github.com/anthropics/claude-code/releases/tag/v2.1.302)

Agent team সদস্যদের আলাদা context ও বৈধ usage থাকে। Native cache TTL/model/account/idle gap ও tool prefix-এর কারণে write হতে পারে; fan-out বা cache rewrite একা duplication নয়। [Agent teams](https://code.claude.com/docs/en/agent-teams), [Gateway protocol](https://code.claude.com/docs/en/llm-gateway-protocol)

## Validation state ও পরবর্তী কাজ

বর্তমান manifest **295 item: 177 patch, 113 new file, 5 tooling**। সব 177 patch strict `git apply --check`-এ applicable; pristine guard PASS। পরিবর্তিত 40টি JavaScript/TypeScript target formatted; full ESLint ও core typecheck PASS।

| Gate                                     | ফল                                                                                    |
| ---------------------------------------- | ------------------------------------------------------------------------------------- |
| 36-file native regression gate           | **247/247 PASS**: নতুন 54, সংশ্লিষ্ট 62 ও original native 131; zero skipped/cancelled |
| বিস্তৃত 36-file usage/stream/transport   | **364/364 PASS**                                                                      |
| Usage extractor compatibility            | **86/86 PASS**                                                                        |
| Bridge regression                        | **621/621 PASS**                                                                      |
| UI fixture, 8 files                      | **39/39 PASS**, actual native UI acceptance নয়                                        |
| অন্যান্য source/deployment-policy groups | **60/60, 58/58, 106/106 PASS**                                                        |
| Database rollback fixture                | **2/2 PASS**                                                                          |
| Full TypeScript ratchet                  | **5803 ≤ 5830 PASS**, baseline অপরিবর্তিত                                             |

একই case একাধিক gate-এ থাকতে পারে; এই সংখ্যাগুলো distinct-test মোট হিসেবে যোগ করা হয়নি। নতুন 54টির মধ্যে TTL cost/history/propagation 33, pricing API round-trip 4, pricing-alias 7 ও Haiku mocked dispatch 10। SQLite cases actual `better-sqlite3`-এর fresh task-owned database-এ চলেছে; migration 198 পুরোনো TTL metadata NULL রাখে। SQL dimensions, legacy internal sources, invalid-split rejection, analytics route, provider windows, archive idempotence ও combo forecast যাচাই হয়েছে।

প্রথম ছোট tests-এ interrupted/misparsed/setup failures রাখা হয়েছে এবং PASS হিসেবে গণনা হয়নি। Apps বন্ধ হওয়ার পরে fresh normal-pressure window-এ repository-এর existing native 768 MiB cap এবং ordinary QA সর্বোচ্চ 3 GiB budget ব্যবহার হয়েছে। Full compiler-এর profile heap 6 GiB/RSS 8 GiB; observed peak প্রায় 5.02 GiB, physical minimum প্রায় 17.98 GiB, swap growth zero। Guarded ছোট tests-এর cap বাড়িয়ে একই unsafe attempt চালানো হয়নি; current source gate স্বাভাবিক resource admission-এ সম্পন্ন।

Full dashboard/CLI build, archive policy/Bridge/dashboard gates, source-hash verification ও isolated installed-package HTTP smoke সম্পূর্ণ PASS। Authorized live deployment ও dashboard/API/TLS acceptance সম্পন্ন। সর্বশেষ own Artifact comment/cold restore/view reconnect ও সাতটি selected provider harness PASS-এর জন্য [acceptance report](NATIVE-PROVIDER-ACCEPTANCE-2026-10-18.md) দেখুন। Direct Claude quota-blocked; missing catalog prices, direct-native matched baseline ও পূর্ণ platform feature parity এখনও আলাদা evidence gap। Client app/CLI, operator policy/configuration ও root ingress/LaunchDaemon বদলানো হয়নি। Public publication/git push-এর আগে পৃথক অনুমতি প্রয়োজন; ব্যবহারকারীর পরের অনুমতিতে remaining QA follow-up ACTIVE হয়েছে।

## Local evidence index

Private task cache-এ numeric/structural receipts: `daily-metadata-summary-v2.json`, `daily-slices-v2/`, `daily-diagnostics/`, `recorded-latency-summary.json`, `pricing-resolution-snapshot.json`, `actual-pricing-lookup-observation.json`, `draft-pricing-lookup-observation.json`, `small-cost-and-routing-observation.json`, `bounded-haiku-effort-structure.json`, `haiku-source-observation.json`, `thread-owner-retention-observation.json`, `bounded-thread-recovery-observation.json`। Raw prompt, thinking, private URL, credential বা raw session/response ID এই report-এ নেই। প্রথম metadata audit helper থেকে inference probe করা হয়নি। পরের deployment-এর নিজস্ব isolated Codex smoke-এ একটি real generation request হয়েছে; পুরো account-এর usage শূন্য বলা হয়নি।

## চূড়ান্ত source gate — build-এর আগে

পূর্ণ tracked source fixture-এ ratchet **5803 ≤ 5830 PASS**; একই Node 24/toolchain-এ আগের overlay **5806**। Baseline 5830 অপরিবর্তিত। File/error-code count তুলনায় নতুন diagnostic group নেই। আগের reduced fixture-এর missing Electron declarations/Docker fixtures সংশোধিত; 5836-এর প্রথম rejected receipt সংরক্ষিত। Usage extractor numeric output contract স্পষ্ট করা হয়েছে; casts বা suppressions দিয়ে errors ঢাকা হয়নি।

Pricing API-এর strict schema এখন `cache_creation_1h` গ্রহণ করে; malformed rate ও unknown fields এখনও reject হয়। Actual PATCH→GET handler round-trip এবং explicit zero-এর চারটি case PASS। Live pricing/operator settings বদলানো হয়নি।

বর্তমান frozen source-এ native 247, বিস্তৃত usage/transport 364, extractor compatibility 86, Bridge 621 ও UI fixture 39 case PASS। অন্য source/deployment-policy/rollback gates-ও PASS; একই case বিভিন্ন gate-এ থাকতে পারে, তাই এগুলো distinct-test মোট হিসেবে যোগ করা হয়নি। UI fixture suite-এ existing React act-environment warnings আছে; actual native app/UI acceptance দাবি করা হয়নি।

Native transport fixture-এর incomplete mock ও upstream-stream expectation সংশোধিত। Production buffered-response defense যথাযথভাবে incomplete message reject করেছিল; এই fixture failure-কে নতুন production Bridge defect বলা হয়নি।

একটি পুরোনো unit helper অনুমতি ছাড়া `sudo -n true` capability probe চালিয়েছিল; ব্যবহারকারীকে জানানো হয়েছে। এটি service/LaunchDaemon mutation command ছিল না। পরের task-owned Node tests privileged-command guard-এ চলেছে; hardware sudo capability আর acceptance claim নয়। এই source-gate পর্যায়ে Claude Code, live service, root ingress বা user configuration পরিবর্তন করা হয়নি; পরের authorized runtime promotion আলাদা section-এ আছে।

এই source/build পর্যায়ে native Artifact acceptance-ও অসম্পূর্ণ ছিল। পরের [acceptance report](NATIVE-PROVIDER-ACCEPTANCE-2026-10-18.md)-এ নিজের comment/cold restore/view reconnect ও সাতটি provider entry PASS; direct Claude quota, matched direct-native baseline, missing rates ও full native feature parity এখনও আলাদা সীমাবদ্ধতা। Source/build PASS সেগুলোর blanket completion নয়।

## Full build ও installed-package verification — ২০২৬-১০-১৮

Tested code commit **`15533a05c4c73a9db9fcecf96d46f5d3b5e1979f`**, version **3.8.51**, archive **`omniroute-3.8.51.tgz`**। Archive size **99727799 bytes**; SHA256 **`f3e0ae8cc4984d822520925edaac2f67cc7a50dfa59147e3df92d4a6dd898200`**। Artifact directory: `~/.omniroute-builds/3.8.51-15533a05c/`। শেষ documentation ও overlay-tooling commit packaged runtime code-এর identity পরিবর্তন করে না।

| Build/package gate                       | ফল                                                                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Full Next.js production dashboard        | **PASS**, compile ও **620/620 static pages**                                                         |
| CLI API ও CLI build                      | **PASS**                                                                                             |
| Pack-artifact policy                     | **PASS**                                                                                             |
| Bridge source/dist এবং archived package  | **PASS**, একই server bytes ও shared lifecycle                                                        |
| Dashboard archive gate                   | **PASS**                                                                                             |
| Archive identity/source validation       | **PASS**, source SHA match, migration 198 included, **883 compiled app-route entries**               |
| Fresh isolated package installation/boot | **PASS**, আলাদা prefix/data ও loopback ports                                                         |
| Management authentication ও CORS         | **PASS**, unauthenticated request HTTP **401**, authenticated HTTP 200; untrusted origin fail-closed |
| Migration 198 + one-hour pricing API     | **PASS**, fresh fixture schema ও real HTTP pricing round-trip                                        |
| Packaged analytics mixed TTL             | **PASS**, তিনটি synthetic row-এ exact **$9.00**: 1h $4 + 5m $2.50 + unknown legacy $2.50             |

একই build বা pack পুনরায় চালানো হয়নি। এই প্রথম synthetic installed-package smoke-এর own service বন্ধ করা হয়েছিল; সেই পর্যায়ে live runtime promote/restart, real model generation বা user credential/data copy হয়নি। Migration তখন disposable synthetic database-এ চলেছিল এবং live baseline `2b4158371` healthy ছিল। পরের authorized deployment fresh private clone-এ real inference smoke করে runtime promote করেছে এবং live migration 198 সম্পন্ন করেছে। Historical usage/cost rows rewrite হয়নি; official Claude Code CLI/native app/config অক্ষত এবং পুরোনো `3.8.51-2b4158371` package-এর bytes/hash সংরক্ষিত।

Full build-এ process-family peak **7.77 GiB**, cap 8 GiB; physical headroom minimum **16.25 GiB**, swap growth **0**। Isolated install/smoke peak **2748.69 MiB**, cap 3072 MiB; headroom minimum **19.18 GiB**, swap growth **0.000 GiB**। Pressure normal ছিল এবং guard কোনো stage থামায়নি। Dependencies pinned lockfile অনুযায়ী প্রস্তুত হয়েছে; production/operator environment ব্যবহার করা হয়নি।

Next build-এর built-in type step skipped হলেও পৃথক full compiler ratchet **5803 ≤ 5830 PASS**; এটি zero-error upstream typecheck দাবি নয়। Existing dynamic-require/npm configuration ও UI fixture act-environment warnings আলাদা রাখা হয়েছে। Publication source snapshot-এর 372 tracked/nonignored file-এ secret scan **0 finding**; ignored scratch-এর চারটি পুরোনো test TLS private key publication scope-এ নেই এবং মুছে ফেলা হয়নি।

Private completion evidence: `build-completion-receipt.json`, `new-package-source-verification.json`, `isolated-package-cost-smoke-v1/verification.json` এবং task cache-এর guarded stage receipts। এগুলো local build/package acceptance; actual native child-agent/provider feature acceptance, direct-native matched latency/token baseline, catalog-এর missing rate ও automatic Artifact comment/reconnect recovery পূর্ণ হয়নি। পরের ব্যবহারকারী-অনুমোদিত deployment সম্পন্ন; git push করা হয়নি। ঐ build snapshot-এ automation PAUSED ছিল; পরের native QA-তে ব্যবহারকারীর অনুমতিতে ACTIVE হয়েছে।

## শেষ documentation consistency gate

Full build-এর পর অতিরিক্ত `check:docs-all` প্রথমে translated `llm.txt` migration-count drift ধরেছে। [Overlay helper](../lib/overlay.mjs) এখন root ও প্রত্যেক discovered locale mirror-এর migration count একসঙ্গে sync করে এবং locale header অপরিবর্তিত রাখে। [চারটি tooling regression](../tests/overlay-doc-counts.test.mjs)-এ mirror/idempotence, file-symlink rejection, directory-symlink exclusion ও root-only compatibility যাচাই হয়েছে: পুরোনো helper-এ দুইটি assertion ব্যর্থ, সংশোধনের পরে **4/4 PASS**। এই চারটি case native 247-case gate-এর অংশ নয়। নিজের applied build tree-র 66টি mirror sync হয়েছে; আগের bytes আলাদা task backup-এ সংরক্ষিত। Primary upstream checkout-এ document লেখা হয়নি।

পরের strict environment check আগে থেকে ব্যবহৃত `MITM_ROUTER_TIMEOUT_MS` documentation অনুপস্থিত দেখায়। বিদ্যমান environment-template ও reference-document patches-এ option-এর units, valid range ও পৃথক normal/native-buffered defaults যোগ হয়েছে। Example line commented এবং কোনো active override সেট করা হয়নি। কোনো runtime timeout, operator policy বা live environment বদলায়নি।

বর্তমান applied source-এ সম্পূর্ণ **`npm run check:docs-all` PASS**: docs-sync, frontmatter, counts, env contract, deprecated versions, links ও fabricated-docs checks। প্রথম rejected receipts সংরক্ষিত; সেগুলো PASS ধরা হয়নি। Existing soft documentation-drift notices থাকলে সেগুলো strict failure নয়।

Packaged runtime source `15533a05c`-এর সঙ্গে application/module bytes অপরিবর্তিত। Post-build helper ও documentation edits-এর জন্য compile বা archive পুনরাবৃত্তি হয়নি। Archive-এর `.env.example` frozen build-এর আগের template; নতুন optional-variable comment ও reference documentation source overlay-তে আছে এবং পরের package-এ যাবে। এটি runtime behavior বা default বদলায় না। Final report/helper/tests ও দুইটি documentation patch আলাদাভাবে secret-scan ও strict patch check পেয়েছে; কোনো production secret বা user data যোগ হয়নি। এই post-build snapshot-এর পরের [actual native acceptance](NATIVE-PROVIDER-ACCEPTANCE-2026-10-18.md)-এ নিজের Artifact flow/view reconnect ও সাতটি provider entry PASS হয়েছে; direct Claude quota-blocked।

## Authorized live deployment — ২০২৬-১০-১৮

নতুন build **`15533a05c` এখন LIVE**, promotion সম্পন্ন **05:45:36 UTC / 11:45:36 Asia/Dhaka**। Version 3.8.51 অপরিবর্তিত, source identity নতুন। Primary `nexalance` local fast-forward হয়েছে; packaged dashboard/API, native Bridge backend ও OmniRoute CLI-এর stable runtime path একই নতুন installation ব্যবহার করে। Official Claude Code CLI/native application আপডেট বা edit করা হয়নি। Public distribution-এ কোনো git push হয়নি; পরের native QA-র অনুমোদিত follow-up এখন ACTIVE।

| Deployment/acceptance gate       | ফল                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Verified archive reuse           | **PASS**: একই 99727799-byte archive ও SHA256; build/pack পুনরাবৃত্তি হয়নি                                          |
| Isolated installed-runtime reuse | **PASS**: archive-এর **8497টি file** byte-verified; fresh smoke-এর জন্য APFS clone, পৃথক private environment/DB    |
| Isolated real inference          | **PASS**, Anthropic-format request → `codex/gpt-6.1-sol`, **1টি** real inference request                           |
| Claude smoke                     | **BLOCKED**, HTTP **429**, stored cached quota gate; সেই rejection-এ upstream attempt হয়নি বলে gateway জানিয়েছে    |
| Drain ও backup                   | **PASS**, active request **0**-এর **3টি quiet sample**, তারপরে নতুন consistent drained snapshot, integrity **ok**  |
| Safe promotion                   | **PASS**, existing user LaunchAgent restart; protected promotion/rollback stage-এ updater parent signal/kill হয়নি  |
| Public dashboard HTTP            | **PASS**, `/` 307, `/login`, `/api/health`, `/healthz` ও deployed JavaScript asset 200                             |
| Management API                   | **PASS**, existing local authentication-এ settings/pricing/models/usage-history 200; model catalog **140** entries |
| Authentication/CORS              | **PASS**, unauthenticated management ও inference catalog 401; untrusted CORS origin fail-closed                    |
| Native ingress                   | **PASS**, backend **8443** ও scoped ingress **443** TLS verification, client DNS ও Bridge health                   |
| Browser dashboard                | **PASS**, actual signed-in Home/Quick Start/provider topology/version UI এবং screenshot পর্যবেক্ষণ                 |
| Live migration/retention         | **PASS**, migration **198**, old usage prefix **202028/202028** exact, fabricated historical TTL **0**             |

প্রথম deployment attempt-এ npm extraction process-family RSS **3687 MiB** হওয়ায় **3072 MiB** guard নিজস্ব smoke child বন্ধ করে; live তখন পুরোনো build-এই ছিল। Cap বাড়ানো হয়নি। আগেই সফল installed package-এর file bytes যাচাই করে clone নেওয়ায় extraction পুনরাবৃত্তি এড়ানো হয়েছে। পরের Claude smoke cached quota gate-এ থামায় promotion হয়নি; quota, lease, cooldown বা verification state clear করা হয়নি। Codex smoke-সহ তৃতীয় attempt সফল: peak **1269 MiB**, physical headroom minimum **19.38 GiB**, pressure normal, swap growth **0**। Failed receipts/prefixes/logs অক্ষত আছে।

Claude rejection-এর cached state বাস্তব external subscription/weekly-limit status-এর স্বাধীন যাচাই নয়। Code deployment সফল হলেও সেই মুহূর্তে Claude inference acceptance PASS বলা যায় না। Codex smoke-এ ব্যবহৃত credentials ও promoted live database-এর credentials কেবল private boolean comparison-এ মিলে গেছে; কোনো token output বা manual credential change হয়নি।

### Retention ও rollback-এর যথাযথ অর্থ

Consistent snapshot: `~/.omniroute-local/update-backups/20261018-114344-drained`। আগের সম্পূর্ণ runtime: `~/.omniroute-builds/runtime-backups/20261018-114344`, যার `BUILD_SHA=2b4158371`। আগের package hash অপরিবর্তিত। Current/previous/previous-runtime marker নতুন package, পুরোনো package ও পুরোনো runtime দেখায়; updater lock release হয়েছে এবং own smoke listener বন্ধ। Installed local control command-এর coexistence fixes অক্ষত রাখা হয়েছে; stale source copy দিয়ে overwrite হয়নি।

**27টি provider connection, 3টি API key ও 23টি operator table-এর protected semantic state PASS**। Manual context override অপরিবর্তিত। ছয়টি auto-discovery context row-তে শুধু refresh timestamp বদলেছে; effective context/source অপরিবর্তিত। Existing catalog sync, provider-limits cache, model-sync timestamp ও settings revision-কে source-identified derived state হিসেবে আলাদা করে দেখা হয়েছে। অন্য settings, operator limits, key policies ও mappings exact রয়ে গেছে। `.env`, hosts, native ingress files, LaunchAgent, local control command, CA/key/certificate/runtime-intent bytes অক্ষত। Verifier live database-এ কোনো mutation করেনি।

Call log-এর live table-তে আগের **99974/100000** row অক্ষত; পরের **26টি** connection-test row যোগ হওয়ায় existing **100000-row cap** অনুযায়ী সবচেয়ে পুরোনো **26টি** rotate হয়েছে। Retained পুরোনো row-তে byte/semantic পরিবর্তন নেই এবং বাদ পড়া set ঠিক সবচেয়ে পুরোনো set-ই। Consistent backup-এ আগের পুরো **100000** row সংরক্ষিত। তাই “সব পুরোনো call row এখনও live-এ আছে” দাবি করা হয়নি। প্রথম overstrict retention receipt-এর failure সংরক্ষিত; corrected comparison effective operator values ও documented runtime refresh/rotation আলাদা করে যাচাই করেছে, data restore বা policy change করে PASS বানানো হয়নি।

নতুন 26টি local `/api/providers/test` record একা zero upstream generation বা zero billing প্রমাণ করে না। Existing Antigravity/agy connection-test implementation model-surface reachability যাচাই করতে **1-token maximum output**-এর generation probe করতে পারে; ঐ 26টির মধ্যে 18টি ওই provider family-এর। প্রতিটি upstream body/result/charge এই post-deploy check-এ মাপা হয়নি এবং tests-এর initiator নিশ্চিত করা হয়নি। Catalog/health polling-কে সর্বদা বিনা token-এর কাজ বলা যাবে না; এটিকে historical rapid token burn-এর প্রমাণও বলা হয়নি। এই policy পরিবর্তন করা হয়নি।

Post-deploy HTTP helper-এর প্রথম তিনটি rejected run-ও রাখা হয়েছে: test helper-এর missing optional parser dependency, parser input type, এবং management token দিয়ে inference catalog পড়ার ভুল assumption। Correct API-key guard 401 দিয়েছিল; এটিকে application auth defect বলা হয়নি। সংশোধিত helper Node built-in parser ও সঠিক management catalog ব্যবহার করে PASS; TLS gate-ও PASS। এই helper corrections package/source runtime বদলায়নি।

Private completion evidence: `deployment-completion-receipt.json`, `deploy-result-2026-10-18T05-43-44.541Z.json`, `isolated-smoke-20261018-114344.json`, `post-live-http-acceptance.json`, `post-live-retention-v2.json` ও `post-live-dashboard-ui.json` — verified package directory-তে। Pre-deploy receipts ঐ সময়ের অবস্থা হিসেবে অপরিবর্তিত রাখা হয়েছে।

### এখনও অসম্পূর্ণ acceptance

নিজের native Artifact-এ cold session restore ও pane/session view reconnect-এর পরে দুইটি actual comment reply/resolve PASS। আটটি configured provider entry-এর সাতটির selected model-এ official CLI child-agent ও saved-resume actual route trace-সহ PASS; agy alias-এর পাশাপাশি নিজের agy-card connection-ও scoped header দিয়ে যাচাই হয়েছে। [বর্তমান acceptance report](NATIVE-PROVIDER-ACCEPTANCE-2026-10-18.md)-এ পূর্ণ matrix ও scope আছে।

Direct Claude Haiku cached quota gate-এর জন্য বাকি; অনুমোদিত follow-up 2026-10-18 08:00 UTC-এর আগে Claude retry করবে না এবং পরের eligibility মানবে। Historical monitor notice-এর নির্দিষ্ট cause/permanent fix, arbitrary network fault recovery, matched direct-native latency/token baseline, authoritative missing catalog rates ও প্রতিটি hosted feature/model/account combination এই acceptance-এর blanket PASS নয়। অতিরিক্ত usage/billing শূন্য বলে নিশ্চয়তা দেওয়া হয়নি।
