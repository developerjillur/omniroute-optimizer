> **ঐতিহাসিক নথি — public copy, ২০২৬-১০-১৭।** মূল ঘটনার তারিখ ও ফল এই নথির নিজস্ব সময়ের জন্য প্রযোজ্য; পরের সংযোজন থাকতে পারে। বর্তমান অবস্থা ও কাজের নিয়মের জন্য [বর্তমান handoff](../CURRENT-STATUS-2026-10-17.md) পড়ুন। Private reference ও identifier সরানো হয়েছে; স্থানীয় evidence এখানে অন্তর্ভুক্ত নেই। পুরোনো cleanup, build, deploy বা service command বর্তমান অনুমতি হিসেবে ব্যবহার করবেন না।

# OmniRoute দিয়ে Claude usage বেড়ে যাওয়ার পূর্ণ তদন্ত

লেখক: Jillur Rahman<br>
তারিখ: 2026-10-07, Asia/Dhaka<br>
মূল হিসাবের cutoff: 2026-10-07 08:37:21 Dhaka / 02:37:21 UTC<br>
পরীক্ষিত runtime: OmniRoute 3.8.51, deployed SHA `29329aa46`<br>
অবস্থা: লগভিত্তিক তদন্ত সম্পন্ন; নিচে চিহ্নিত compatibility ত্রুটির code fix ও পরবর্তী live comparison এই তদন্তে করা হয়নি।

**ব্যবহারকারীর দ্রুত weekly limit কমার অভিযোগের বাস্তব ভিত্তি আছে। সবচেয়ে স্পষ্ট setup-সংক্রান্ত কারণ হলো Sonnet 5.5-এর conversation cache বারবার ভেঙে যাওয়া। এর সঙ্গে একই সময়ে বহু background subagent, বড় conversation context এবং `MAX` thinking যোগ হয়েছে।** পুরো বিষয়টি শুধু dashboard-এর বড় token সংখ্যা দিয়ে ব্যাখ্যা করা যায় না; provider-reported weekly quota-ও কমেছে।

আগের native ব্যবহারের একই কাজ, একই account, একই model, একই effort ও একই সংখ্যক session-এর সরাসরি তুলনামূলক baseline পাওয়া যায়নি। তাই প্রতিটি কাজ ঠিক 3–4 গুণ বেশি খরচ করছে—এই নির্দিষ্ট multiplier নিশ্চিত করা যাচ্ছে না। তবে বাড়তি context processing-এর একটি নির্দিষ্ট gateway ত্রুটি source, deployed bundle, request artifact ও provider usage দিয়ে চিহ্নিত হয়েছে।

## ১. কী কী পরীক্ষা করা হয়েছে

- Live SQLite-এর `usage_history`, `call_logs`, `quota_snapshots`, নির্বাচিত settings, model aliases এবং account affinity configuration read-only mode-এ পড়া হয়েছে। Snapshot-এ সব provider মিলিয়ে 49,614টি usage row ছিল; Claude inference-এর হিসাব আলাদাভাবে নেওয়া হয়েছে।
- বিস্তারিত বর্তমান সময়সীমা: **2026-10-07 00:00–08:37 Dhaka**। দৈনিক model/cache আচরণ **October 2–7** পর্যন্তও তুলনা করা হয়েছে।
- 283টি নির্বাচিত call artifact-এর stored byte length এবং repository-তে ব্যবহৃত FNV checksum যাচাই হয়েছে; সবগুলো মিলেছে। স্বাধীন SHA-256 fingerprint-ও রাখা হয়েছে। এই DB column-এর নাম `artifact_sha256` হলেও তার বর্তমান stored format 8-character FNV; সেটিকে cryptographic SHA-256 হিসেবে ধরা হয়নি।
- সম্পূর্ণ body পাওয়া 130টি সফল request-এ shipped helper দিয়ে offline replay হয়েছে। বড় body-এর কিছু অংশ log retention limit-এ truncated; সেইগুলো দিয়ে পূর্ণ payload parity দাবি করা হয়নি। Sample নির্বাচন উদ্দেশ্যভিত্তিক, random population sample নয়।
- Claude-এর 51টি সাম্প্রতিক JSONL transcript file পর্যায়ক্রমে পড়া হয়েছে। Streamed assistant block বা copied history-কে আলাদা response হিসেবে যোগ না করে upstream `message.id` অনুযায়ী deduplicate করা হয়েছে। বড় main transcript-এর শেষ 64 MiB পড়া হয়েছে; তাই এটি সম্পূর্ণ ঐতিহাসিক transcript census নয়।
- Application log-এর 36,965,951 bytes / 185,323 JSON row পড়া হয়েছে; cutoff-এর সংশ্লিষ্ট সময়ে 106,369 row ছিল। এখানেও thread failure-এর পুনরাবৃত্তি দেখা গেছে।
- Main ও child checkout-এর clean HEAD এবং live `dist/BUILD_SHA` মিলিয়ে দেখা হয়েছে। Published documentation-এর বর্তমান cache, effort ও usage নিয়মও যাচাই হয়েছে।

এই তদন্তে নতুন Claude model inference চালানো হয়নি। Credentials, account email, private verification URL বা ব্যক্তিগত prompt report-এ দেওয়া হয়নি। কোনো app, task বা service বন্ধ করা হয়নি।

## ২. Weekly limit কি সত্যিই এত দ্রুত কমছে?

হ্যাঁ। `quota_snapshots`-এর **provider-reported `weekly (7d)` remaining**-এ নিচের পরিবর্তন আছে। Account-এর আসল পরিচয়ের পরিবর্তে hash tag ব্যবহার করা হয়েছে।

| Account tag | Dhaka সময় | Weekly remaining |
| --- | --- | ---: |
| `private-id-020` | 06:33:24 | 28% |
| `private-id-020` | 06:39:28 | 25% |
| `private-id-020` | 06:44:40 | 23% |
| `private-id-021` | 07:17:40 | 57% |
| `private-id-021` | 07:24:49 | 53% |

প্রথম account-এ **11 মিনিট 15.938 সেকেন্ডে 5 percentage point** কমেছে; দ্বিতীয় account-এ **7 মিনিট 8.597 সেকেন্ডে 4 percentage point** কমেছে। প্রথম ঘটনাকে কথায় 11 মিনিট 16 সেকেন্ড বলা হয়েছে। আগের progress update-এ 7 মিনিট 11 সেকেন্ড বলা ভুল ছিল; এই রিপোর্টে নির্ভুল timestamp দিয়ে সংশোধন করা হলো। নির্বাচিত সময়সীমার retained snapshots-এ একই account-এর ঠিক 10 মিনিটের মধ্যে 5-point পতন পাওয়া যায়নি; কাছাকাছি 11 মিনিট 16 সেকেন্ডের ঘটনা পাওয়া গেছে।

প্রথম interval-এ ওই এক account দিয়ে 379টি সফল Opus 5.5, 107টি সফল Sonnet 5.5 এবং 7টি সফল Haiku request হয়েছে। Sonnet-এর ক্ষেত্রে প্রায় **20.79 million input tokens cache-এ নতুন করে লেখা** হয়েছে, যেখানে cache থেকে পড়া হয়েছে মাত্র **3.41 million**।

Quota শতাংশ sampled ও rounded; এটি প্রতি request-এর বিলিং receipt নয়। Account দুটির allowance আলাদা; তাদের percentage যোগ করে একটি combined weekly limit বানানো যাবে না। Snapshot থেকে শতকরা পতন প্রমাণ করা যায়, কিন্তু কোন request ঠিক কত percentage point নিয়েছে তা প্রমাণ করা যায় না। Cutoff-এর কাছে সর্বশেষ Claude quota snapshot ছিল 07:54:54 Dhaka; report-এর সময় সেটিকে নতুন করে provider থেকে fetch করা হয়নি।

Claude-এর বিভিন্ন surface—Claude Code, Desktop ও claude.ai—একই account-এর allowance ব্যবহার করে। Context, model ও effort-ও usage-এ প্রভাব ফেলে; শুধু কত মিনিট app খোলা ছিল তা দিয়ে allowance নির্ধারিত হয় না। [Claude usage limits](https://support.claude.com/en/articles/11647753-how-do-usage-and-length-limits-work)

## ৩. সবচেয়ে বড় প্রযুক্তিগত সমস্যা: Sonnet 5.5 cache reuse হচ্ছে না

00:00–08:37 Dhaka-এর সফল inference:

| Model | সফল request | মোট input tokens | Cache read | Cache creation/write | Output tokens |
| --- | ---: | ---: | ---: | ---: | ---: |
| Opus 5.5 | 2,291 | 893,687,728 | 854,437,978 — **95.61%** | 39,234,401 — **4.39%** | 2,807,953 |
| Sonnet 5.5 | 1,362 | 453,600,092 | 40,528,800 — **8.93%** | 412,137,097 — **90.86%** | 8,642,163 |
| Sonnet 5 | 9 | 1,175,420 | 872,069 — 74.19% | 302,541 — 25.74% | 81 |
| Haiku 4.5 | 251 | 1,191,992 | 574,675 — 48.21% | 435,702 — 36.55% | 60,360 |

মোট 3,913টি inference-এ input 1,349,655,232; এর মধ্যে cache read 896,413,522 এবং cache write 452,109,741। **মোট cache write-এর 91.16% এসেছে Sonnet 5.5 থেকে।** Input volume-এ Sonnet Opus-এর প্রায় অর্ধেক হলেও, নতুন cache writing-এ Sonnet-এর পরিমাণ প্রায় 10.5 গুণ।

এই শতাংশগুলো **input token-এর ভাগ**, request hit rate নয়। একটি request-এ অল্প cache read থাকলেও request-level dashboard তাকে cache hit বলতে পারে। তাই `cache applied` বা `cache_read > 0` দেখলেই বড় conversation cache থেকে reuse হয়েছে বলা যায় না।

বড় conversation বারবার পাঠানো একা অস্বাভাবিক নয়—native Claude-ও context পাঠায়। পার্থক্যটি হলো আগের context সস্তা cache read হিসেবে নেওয়া হচ্ছে, নাকি প্রায় পুরোটা আবার cache creation হিসেবে process হচ্ছে। এই setup-এ Opus-এর অধিকাংশ context reuse হচ্ছে; Sonnet 5.5-এর ক্ষেত্রে সেটি হচ্ছে না।

### একই সমস্যা একাধিক দিন ধরে

| Dhaka দিন | Opus 5.5 সফল request | Opus cache read ভাগ | Sonnet 5.5 সফল request | Sonnet cache read ভাগ |
| --- | ---: | ---: | ---: | ---: |
| October 2 | 2,427 | 90.10% | 416 | 21.47% |
| October 3 | 7,947 | 98.83% | 204 | 5.67% |
| October 4 | 3,479 | 98.44% | 361 | 7.94% |
| October 5 | 6,923 | 98.85% | 932 | 11.21% |
| October 6 | 2,260 | 97.85% | 1,295 | 13.05% |
| October 7, cutoff পর্যন্ত | 2,291 | 95.61% | 1,362 | 8.93% |

সুতরাং এটি শুধু সর্বশেষ deployment-এর কয়েকটি smoke test-এর ফল নয়। Retained gateway history-এর শুরু থেকেই Sonnet-এর reuse দুর্বল।

## ৪. Cache কেন ভাঙছে: code ও payload evidence

Native Claude request-এ conversation-এর মাঝখানে `role: "system"` message আসে। Sonnet 5.5 এগুলো সমর্থন করে। বর্তমান OmniRoute-এর model allowlist-এ mid-conversation system support রয়েছে শুধু `claude-opus` ও `claude-fable` prefix-এর জন্য; **`claude-sonnet-5-5` সেখানে নেই।** [Sonnet 5.5 capabilities](https://platform.claude.com/docs/en/models/sonnet-5-5/whats-new-sonnet-5-5)

ফলে native Sonnet passthrough request-এ `chatCore` পুরোনো compatibility branch নেয়। `extractSystemRoleMessages()` conversation-এর মাঝের system text-ও top-level `system[]`-এ তুলে আনে। পরের turn-এ নতুন নির্দেশনা যোগ হলে বা সর্বশেষ নির্দেশনার text বদলালে conversation-এর শুরুতে থাকা prefix-ই বদলে যায়। বড় message history তখন আগের prefix-এর cache reuse করতে পারে না।

Cache prefix-এর ক্রম `tools → system → messages`; আগের অংশ বদলালে তার পরের context-এর cache identity বদলায়। এটি official cache contract-এর সঙ্গে মেলে। [Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)

পরীক্ষিত code:

- Shipped model allowlist (স্থানীয় বা private reference; প্রকাশিত নয়)
- Shipped passthrough branch (স্থানীয় বা private reference; প্রকাশিত নয়)
- System message lifting helper (স্থানীয় বা private reference; প্রকাশিত নয়)
- Runtime bundle fingerprints (স্থানীয় বা private reference; প্রকাশিত নয়)

শুধু source file নয়, deployed server bundle-এও একই prefix allowlist ও TTL normalization পাওয়া গেছে।

### একই account-এ offline reproduction

Body sample-গুলোকে client parent identity, billing header বাদ দেওয়া system fingerprint, tools fingerprint ও প্রথম user content fingerprint দিয়ে group করা হয়েছে। শুধু parent session ID দিয়ে group করা হয়নি, কারণ একাধিক child একই parent metadata বহন করে।

Sonnet-এর 51টি পরপর sample pair-এ client-এর মূল top-level system prompt একই ছিল। এর মধ্যে 43টি pair **একই account-এ** থেকেও shipped helper চালানোর পরে hoisted system fingerprint বদলেছে। Account rotation ছাড়াও এই prefix পরিবর্তন ঘটে। এটি network inference ছাড়া actual incoming body ও shipped pure helper দিয়ে পুনরুৎপাদিত হয়েছে।

একটি উদাহরণ, একই account ও একই prompt/tools group, দুই request-এর ব্যবধান 6.321 সেকেন্ড:

| Counter | আগের request | পরের request |
| --- | ---: | ---: |
| মোট input | 104,994 | 106,014 |
| Cache read | 31,871 | 31,871 |
| Cache write | 73,119 | 74,141 |

Conversation মাত্র 1,020 input tokens বাড়লেও আগের প্রায় 73,000 tokens read হিসেবে reuse হচ্ছে না; পরের request-এ প্রায় 74,000 tokens আবার write হচ্ছে। Original system একই, transformed system বদলেছে—এই দুই fingerprint evidence-এ রাখা হয়েছে। ব্যক্তিগত text প্রকাশ করা হয়নি।

এটি **cache invalidation-এর নির্দিষ্ট setup ত্রুটির শক্ত প্রমাণ**। সব 1,362টি Sonnet request-এর সম্পূর্ণ downstream wire capture retained নেই; তাই প্রতিটি miss শুধু এই এক কারণেই হয়েছে, বা fix হলে সব write read হয়ে যাবে—এমন দাবি করা হচ্ছে না। নতুন subagent-এর প্রথম request ও সত্যিকারের নতুন context-এর write স্বাভাবিক।

Offline reproduction receipt (স্থানীয় বা private reference; প্রকাশিত নয়)

## ৫. Cache TTL-ও native subagent আচরণ থেকে বদলাচ্ছে

বর্তমান Claude OAuth executor `normalizeCacheControlTtl()` চালায়। Explicit `5m` boundary-এর আগে কোনো `ephemeral` marker-এ TTL না থাকলে এটি **`ttl: "1h"` যোগ করে**।

Complete successful Sonnet sample-এর 260টি original marker-এ explicit TTL ছিল না; helper replay-এ 260টিই `1h` হয়েছে। Transcript-এ Sonnet cache creation-এর **99.79% one-hour write** হিসেবে provider report করেছে।

Official Claude Code আচরণে subscription-এর main conversation ও subagent-এর TTL এক নয়; subagent সাধারণত five-minute cache ব্যবহার করে। তাই implicit marker-এর blanket one-hour rewrite native semantics-এর সমান নয়। [Claude Code prompt caching](https://code.claude.com/docs/en/prompt-caching)

API rate দিয়ে বিষয়টির মাত্রা বোঝা যায়: Sonnet 5.5-এর প্রতি million tokens cache read $0.20, five-minute write $2.50, one-hour write $4। অর্থাৎ একই পরিমাণ input read-এর বদলে one-hour write হলে API input unit rate **20 গুণ**; five-minute write-এর বদলে one-hour write হলে write unit rate **60% বেশি**। [Official cache pricing](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)

এগুলো **ব্যাখ্যার জন্য API rate**, আপনার subscription-এর invoice বা weekly percentage-এর সূত্র নয়। Anthropic-এর subscription allowance weighting এখানে জানা নেই। Whole-session usage 20 গুণ হয়েছে, বা weekly quota ঠিক 60% বেড়েছে—কোনোটিই এই table থেকে বলা যাবে না।

Main conversation-এর negotiated one-hour cache উপকারী হতে পারে। সমাধান হিসেবে সব request জোর করে `5m` করা ঠিক হবে না; client-এর request class, markers, TTL ও negotiated headers ঠিকভাবে preserve করতে হবে।

Shipped TTL helper (স্থানীয় বা private reference; প্রকাশিত নয়)

## ৬. “একটি session 10 মিনিট চলছে” সময়ে আসলে বহু কাজ চলেছে

**06:30–06:40 Dhaka**-এর call log-এ **624টি সফল inference** আছে—গড়ে প্রতি মিনিটে 62.4টি। দুই account মিলে input 158,250,882; এর মধ্যে 29,658,231 cache write এবং output 563,477।

একই সময়ের bounded native transcripts-এ 589টি আলাদা upstream response পাওয়া গেছে:

| Client কাজের ধরন | Response | সক্রিয় response file |
| --- | ---: | ---: |
| Main session, Opus 5.5 | 55 | 4 |
| Background subagent, Sonnet 5.5 | 137 | 5 |
| Background subagent, Opus 5.5 | 397 | 7 |
| মোট | 589 | 16 |

অর্থাৎ transcript-এ ধরা response-এর **534/589 = 90.66% এসেছে subagent থেকে**। তখন `nexa-media`, `NasiibGames2` ও `thepokelab`-সহ একাধিক কাজ ছিল। `NasiibGames2` parent-এর সাতটি background agent launch এবং `nexa-media`-র একাধিক background launch transcript-এ আছে। এগুলো client-issued `Agent` call; gateway নিজে গোপনে 12টি agent চালিয়েছে—এমন প্রমাণ পাওয়া যায়নি।

624 এবং 589 দুই আলাদা evidence stream-এর count: call log completion timestamp এবং transcript timestamp-এর boundary পুরোপুরি এক নয়, আর bounded transcript coverage-ও অসম্পূর্ণ। এগুলো যোগ করে 1,213টি request বলা যাবে না। File count ও parent identity হিসাব থেকেও concurrent session/workload বোঝা যায়। Gateway-এর ওই bucket-এর 614টি `session_tag`-কে 614টি আসল user chat বলা যাবে না; conversation fingerprint/tag native session census নয়।

প্রতিটি child নিজের context নিয়ে model call করে; এক parent chat দেখা গেলেও child-এর কাজ আলাদাভাবে usage নেয়। এটি native Claude Code-এও প্রযোজ্য। [Claude Code cost guidance](https://code.claude.com/docs/en/costs)

অনেক call-এ file read/search, Python ও status/tail inspection ছিল। এগুলোকে সবগুলো অপ্রয়োজনীয় polling বলা হয়নি। তবে প্রতিবার tool ফল ফেরত নিয়ে model আবার চালালে context processing হয়; দীর্ঘ loop এবং অনেক child একসঙ্গে চললে দ্রুত allowance কমে।

## ৭. `MAX` effort ও thinking output

এই সময়সীমার transcript-এ পাওয়া **1,347টি Sonnet 5.5 response-এর সবগুলো `MAX` effort-এ** ছিল; সবগুলো child/subagent file থেকে এসেছে।

- তাদের persisted output: 7,485,333 tokens।
- এর মধ্যে reported thinking: 6,460,892 tokens—**86.31%**।
- একটি matched response-এ gateway ও native transcript উভয়েই output 48,278 report করেছে; তার thinking 47,854 tokens। তাই ছোট দৃশ্যমান উত্তর মানেই ছোট inference নয়।

Thinking output consumption-এর অংশ। Display-এ পুরো চিন্তা না দেখালেও সেটি output usage থেকে বাদ পড়ে না। [Thinking token accounting](https://platform.claude.com/docs/en/build-with-claude/thinking)

Current global Claude settings-এ model-specific effort: Opus 5 `low`, Opus 5.5 `xhigh`, Sonnet 5.5 `xhigh`; actual sampled Sonnet request/transcript-এ `max` আছে। তাই global default ও per-request effort আলাদা। OmniRoute-এর observed `thinkingBudget.mode` ছিল `passthrough`; medium/custom budget field stored থাকলেও সেগুলো active override ছিল না।

Gateway সব request নিজে MAX করে দিয়েছে—এমন প্রমাণ পাওয়া যায়নি। একই সঙ্গে এটি বলা যায় না যে আপনার আগের native workload-ও একই effort ও model-এ ছিল। Model/effort পরিবর্তনের অংশ এবং gateway cache সমস্যার অংশ আলাদাভাবে বিবেচনা করতে হবে।

Persisted native usage কিছু response-এ final streamed counter ধরে না। তাই 86.31% হলো examined transcript-এর reported output-এর ভাগ; পুরো account-এর সব thinking-এর চূড়ান্ত billing reconciliation নয়।

## ৮. Thread retry ও account বদলের সমস্যা

নির্বাচিত সময়ে provider failure:

| Failure | Call count | অর্থ |
| --- | ---: | --- |
| 404, previous thread state পাওয়া যায়নি | 2,261 | Client-কে conversation replay করে নতুন thread বানাতে বলা হয়েছে |
| 400, thread parameter mismatch | 1,402 | `system`, `cache_control` বা `anthropic-beta` আগের thread-এর সঙ্গে মেলেনি |
| 429 | 22 | Quota/rate-limit সম্পর্কিত rejection |
| 499 | 3 | Cancel/disconnect |

400-এর মধ্যে 831টিতে `anthropic-beta + cache_control + system`, 551টিতে শুধু `system`, 17টিতে শুধু `anthropic-beta`, 3টিতে `cache_control + system` differing field ছিল। Application log-এও 2,227টি retained matching “thread state পাওয়া যায়নি” entry আছে; application ও DB count যোগ করা হয়নি।

এই failed row-গুলোর reported input/output zero। তাই failure count-কে সফল inference-এর মতো tokens যোগ করে “প্রতিটি retry আবার পুরো charge নিয়েছে” বলা যাবে না। Failed upstream attempt billable ছিল কি না retained evidence প্রমাণ করে না। তবে retry/replay latency বাড়ায়, account/thread continuity নষ্ট করতে পারে এবং পরের সফল replay-এর cache reuse গুরুত্বপূর্ণ করে তোলে।

Session stickiness ও prompt-cache affinity enabled আছে; configured affinity TTL 24 ঘণ্টা। তবুও grouped body sample-এ Sonnet-এর 51 pair-এর 8টিতে account বদলেছে। এটি secondary cache/thread risk। কিন্তু **একই account-এ 43টি prefix-changing pair** পাওয়া গেছে; তাই account rotation-কে একমাত্র কারণ বলা ভুল হবে।

Fix-এর সময় native thread identity এবং selected account continuity-ও validate করতে হবে; quota exhausted account-এ জোর করে pin রেখে recovery বন্ধ করা সমাধান নয়।

## ৯. Dashboard কি একই tokens কয়েকবার গুনছে?

বর্তমান evidence-এ 3–4 গুণ inflation-এর মতো duplicate accounting প্রমাণ পাওয়া যায়নি।

- `usage_history.tokens_input` হলো **fresh input + cache read + cache write**। Native Anthropic-এর `input_tokens` শুধু non-cached অংশ। দুই field সরাসরি তুলনা করলে বড় পার্থক্য দেখা যাবে, যদিও provider usage একই হতে পারে।
- Input total-এর সঙ্গে আবার cache read/write যোগ করা হয়নি। একইভাবে output-এর সঙ্গে thinking আবার যোগ করা হয়নি; thinking output-এর অংশ।
- `call_logs` ও `usage_history` একই request-এর দুই log sink; তাদের totals যোগ করা হয়নি। Native assistant-এর একাধিক streamed block-ও deduplicate হয়েছে।
- Exact natural-key duplicate usage row পাওয়া যায়নি। এটি প্রতিটি সম্ভাব্য duplicate-এর সর্বাত্মক proof নয়, তবে বড় exact duplicate pattern নেই।
- Unique exact `model + inclusive input + cache read + cache creation` join দিয়ে 261টি sample native transcript-এর সঙ্গে মিলেছে। 255টির output count-ও হুবহু মিলেছে। বাকি ছয়টির native persisted block counter এবং gateway final counter আলাদা; repeated native block-এ early-looking counter অপরিবর্তিত ছিল। Raw upstream SSE পুরোপুরি retained না থাকায় ছয়টিকে invoice-level reconcile বলা হয়নি।
- Sample-এ upstream-reported usage provenance ছিল। Clause cost ledger-এ row না পাওয়া মানেই zero subscription usage নয়; OAuth allowance ও local estimated-dollar accounting আলাদা বিষয়।

অর্থাৎ বড় raw token total-এর **কিছু অংশ display/definition-এর পার্থক্য**, কিন্তু provider-reported weekly quota পতন এবং Sonnet-এর পুনঃপুন cache write বাস্তব processing-এর evidence। শুধু counter formatting ঠিক করলেই এই processing কমবে না।

Token input normalization (স্থানীয় বা private reference; প্রকাশিত নয়)<br>
Native/gateway sample reconciliation (স্থানীয় বা private reference; প্রকাশিত নয়)

## ১০. অন্য সম্ভাব্য কারণগুলো যাচাই

| সম্ভাবনা | পর্যবেক্ষণ |
| --- | --- |
| Gateway অতিরিক্ত system transformation inject করছে | Observed Claude system transformation pipeline disabled; memory/skills injection disabled। তবে native compatibility helper-এর hoisting এই flags-এর বাইরে হয় |
| Local token buffer বাড়তি count করছে | `usageTokenBuffer = 0` |
| Sonnet/Opus-কে গোপনে অন্য দামি model-এ পাঠাচ্ছে | Current relevant native/Bridge aliases একই model family-তে map করা; বর্তমান evidence-এ গোপন model upgrade পাওয়া যায়নি |
| Fast mode বেশি খরচ করছে | Explicit speed পাওয়া sample-এ `standard`; speed absent থাকাকে fast হিসেবে ধরা হয়নি |
| শুধু account বদলালেই miss হচ্ছে | একই account-এ Sonnet prefix change ও cache write পুনরাবৃত্তি হয়েছে |
| Build/pack নিজে inference করছে | এই তদন্তে তা চালানো হয়নি; গত production compilation-এর process আর native client workload আলাদা evidence |
| শুধু একটি নতুন QA run বেশি ব্যবহার করেছে | একই Sonnet cache pattern October 2–6-এও আছে; কয়েক হাজার চলমান client request-কে সীমিত QA marker দিয়ে ব্যাখ্যা করা যায় না |
| পুরোনো Fable usage-ও hidden upgrade ছিল | October 5-এর আলাদা retained report-এ client থেকে নয়টি Fable child launch এবং 199টি সফল request প্রমাণিত; বর্তমান Sonnet cache সমস্যার বদলে সেই পুরোনো ঘটনাকে প্রধান কারণ ধরা হয়নি |

Earlier deployment PASS, health PASS ও response PASS দিয়ে request-এর cache efficiency বা native usage parity নিশ্চিত হয় না। বর্তমান runtime কার্যকরভাবে response দিলেও এই protocol compatibility gap রয়ে গেছে।

## ১১. কী ঠিক করা প্রয়োজন, অগ্রাধিকার অনুযায়ী

1. **Sonnet 5.5 native protocol support ঠিক করা।** Supported mid-conversation system message ও per-message directive তাদের native অবস্থানে preserve করতে হবে। Leading invalid system message ও truly legacy model-এর sanitation আলাদা থাকবে। এক model prefix যোগ করলেই সব protocol edge case solved বলা যাবে না; regression coverage লাগবে।
2. **Client cache markers/TTL preserve করা।** Implicit subagent marker-কে blanket `1h` করা বন্ধ করার আচরণ পরীক্ষা করতে হবে; main conversation-এর negotiated one-hour policy, mixed TTL ordering ও upstream breakpoint limit বজায় থাকবে।
3. **Thread/account continuity স্থিতিশীল করা।** Native session/thread identity-তে উপযুক্ত account affinity; recoverable fallback ও quota recovery থাকবে। Thread replay যেন unnecessarily system/beta/cache parameters বদল না করে।
4. **একই model ও effort রেখে ছোট validation।** Saved request fixture দিয়ে প্রথমে offline regression: unchanged tools/system fingerprint, append-only history, TTL, directive preservation ও thread parameter consistency। এরপর সীমিত একই-account live sequence-এ প্রথম write-এর পর read বাড়ছে কি না, selected account ঠিক আছে কি না এবং thread error কমছে কি না পরীক্ষা করতে হবে। Native ও gateway comparison-এ একই workload/effort/context দরকার।
5. **Client workload-এর budget আলাদা করা।** অপ্রয়োজনীয় child fan-out ও দীর্ঘ status loop কমালে native ও gateway দুই পথেই usage কমবে। Routine child-এ কম effort প্রয়োজন কি না কাজভেদে স্থির করতে হবে। Quality requirement না দেখে globally MAX বন্ধ বা model downgrade করা এই report-এর সুপারিশ নয়।
6. **Monitoring-এ শুধু hit count নয়, token share রাখা।** Per-model cache read/write ভাগ, 5m/1h creation, parent/child count, selected account এবং final thinking usage দেখাতে হবে। Gateway-generated `session_tag`-কে user session count হিসেবে ব্যবহার করা যাবে না।

এই তদন্তের ফল শুধু config warning নয়; প্রথম দুই অগ্রাধিকার current gateway code-এর আচরণসংক্রান্ত। Production fix-কে সম্পন্ন বলা যাবে তখনই, যখন regression ও bounded live comparison-এ provider-reported cache reuse ফেরার evidence পাওয়া যাবে। বর্তমান investigation-এ source/config/runtime বদলানো হয়নি।

## ১২. Evidence, সীমাবদ্ধতা ও সংরক্ষণ

মূল evidence directory: omniroute-token-usage-2026-10-07 (স্থানীয় বা private reference; প্রকাশিত নয়)

| Evidence | কী আছে |
| --- | --- |
| usage-snapshot-0239.json (স্থানীয় বা private reference; প্রকাশিত নয়) | Snapshot cutoff, per-model totals, settings whitelist, window/account aggregates, duplicates check |
| native-transcript-audit-0242.json (স্থানীয় বা private reference; প্রকাশিত নয়) | Deduplicated response inventory, parent/child evidence, effort, thinking, TTL ও 10-minute burst |
| artifact-prefix-audit-0246.json (স্থানীয় বা private reference; প্রকাশিত নয়) | 283 artifact-এর length/checksum/SHA-256 এবং request shape summaries |
| offline-prefix-replay-0245.json (স্থানীয় বা private reference; প্রকাশিত নয়) | Refined same-prompt grouping, shipped helper replay, original/transformed fingerprints |
| runtime-bundle-proof-0248.json (স্থানীয় বা private reference; প্রকাশিত নয়) | Actual deployed bundle-এর prefix/TTL matches ও cryptographic hashes |
| correlation-final-0254.json (স্থানীয় বা private reference; প্রকাশিত নয়) | Exact quota interval, model/cache history, classified failure ও application log summary |
| native-gateway-accounting-join-0250.json (স্থানীয় বা private reference; প্রকাশিত নয়) | 261 unique input/cache joins এবং output comparison |
| report-metrics-and-sources-0256.json (স্থানীয় বা private reference; প্রকাশিত নয়) | Computed percentages, method clarification ও official source URLs |

প্রথম artifact audit-এর `pairs` parent metadata দিয়ে coarse grouping করেছিল; সেটি causal proof হিসেবে ব্যবহার করা হয়নি। Refined offline replay-তে billing header বাদ দেওয়া system, tools ও প্রথম user fingerprint দিয়ে group করা হয়েছে। Opus body-তে একই helper চালানো একটি counterfactual diagnostic ছিল; actual Opus route এই Sonnet hoist branch নেয়—এমন দাবি নেই।

Weekly percentage থেকে exact টাকা বা token allowance বের করার provider formula এখানে নেই। একাধিক surface-এর concurrent usage এবং sampled snapshots-এর কারণে exact request-level percentage attribution-ও নেই। পুরোনো native ব্যবহারের একই কাজের matched baseline অনুপস্থিত। তাই exact 3–4 multiplier ও প্রতিটি কারণের পৃথক শতকরা contribution অনির্ধারিত রাখা হয়েছে।

Read-only DB ব্যবহার হয়েছে; environment বা runtime পুনরায় install করা হয়নি। Audit-এর measured Python peak RSS সর্বোচ্চ প্রায় 48.3 MiB; final check-এ pressure normal, physical free/inactive/speculative headroom প্রায় 8.96 GiB, internal disk প্রায় 60.45 GiB free ছিল। তাই resource admission-এর বড় build বাজেট ছাড়াই এই সীমিত read-only তদন্ত হয়েছে। Source/data/rollback অক্ষত আছে; main ও child pristine HEAD একই `29329aa46d1aa3c8d23377225175365219f8edb6`।

**সিদ্ধান্ত:** দ্রুত limit কমার কারণ শুধু “OmniRoute-এ বেশি tokens দেখায়” নয়। Native Sonnet 5.5 conversation-এর cache layout বদলে দেওয়া এবং subagent TTL rewrite হচ্ছে setup-এর নির্দিষ্ট সমস্যা। পাশাপাশি বহু চলমান child, বড় context ও MAX thinking বাস্তব workload বাড়িয়েছে। Cache compatibility আগে ঠিক করতে হবে; তারপর একই কাজের native/gateway তুলনা দিয়ে প্রকৃত usage parity যাচাই করতে হবে।


## যাচাই receipt-এর অতিরিক্ত টীকা

তদন্তের completion receipt (স্থানীয় বা private reference; প্রকাশিত নয়)-এ সংখ্যার consistency, 17টি local evidence link, দুই clean checkout এবং পাঁচটি runtime source fingerprint যাচাই আছে। Helper copy দুটির bytes original-এর সঙ্গে অভিন্ন। Audit evidence প্রায় 4.68 MiB; source ও DB-এর বড় duplicate copy বানানো হয়নি।

Offline replay JSON-এর `runtime_source_sha256` field Node Buffer-এর JSON serialization hash করেছে; receipt-এ সেই fingerprint পুনরায় যাচাই করার পাশাপাশি raw source bytes-এর প্রচলিত SHA-256 দেওয়া হয়েছে। Runtime bundle proof-এ raw byte SHA-256 আছে। Native/gateway join receipt-এর `gateway_start` নামের field আসলে retained call-log timestamp; সেটিকে certified network-start time হিসেবে ব্যবহার করা হয়নি। Section 9-এর “Clause cost ledger” বলতে Claude-এর `request_cost_ledger` rows বোঝানো হয়েছে। এই টীকাগুলো original evidence অক্ষত রেখে যোগ করা হলো।


## ২০২৬-১০-০৭: Cache repair, compression OFF ও production deployment সম্পন্ন

**লেখক: Jillur Rahman।** আগের তদন্তের content অক্ষত রেখে এই deployment ও live QA ফল যোগ করা হলো। আগের investigation snapshot-এর runtime `29329aa46` ছিল; বর্তমান production runtime **`65c6c608a`**। নতুন build, package ও deployment সত্যি সম্পন্ন হয়েছে। নিচের ফল আগের code-only বা অপেক্ষার status-কে হালনাগাদ করে।

### যে পরিবর্তন production-এ গেছে

- Supported native Claude Sonnet 5.5, Opus/Fable protocol-এর mid-conversation system message ও directive তাদের জায়গায় থাকে। এগুলো নতুন করে top-level system-এ টেনে এনে পুরোনো cache prefix বদলানো বন্ধ করা হয়েছে; legacy sanitation-এর প্রয়োজনীয় আচরণ রাখা হয়েছে।
- Native client-এর implicit cache TTL-এ blanket `1h` যোগ করা বন্ধ হয়েছে। Client-এর explicit `5m`/`1h` boundary ও native beta negotiation রাখা হয়। সব parent/subagent-কে একই TTL-এ জোর করা হয়নি।
- Mutable prompt fingerprint-এর আগে native session identity নেওয়া হয়। নির্বাচিত account ও native session থেকে পৃথক, স্থিতিশীল upstream session identity হয়; unrelated concurrent chat একই process seed দিয়ে মিশে যায় না। Thread tracking ও account affinity একই identity ব্যবহার করে।
- Compression master OFF থাকলে context editing ও combo fallback থেকেও compression চালু হয় না। Explicit empty pipeline `[]` database round-trip-এ খালি থাকে।
- Master OFF, default mode OFF; সব **১২টি engine OFF**: `session-dedup`, `ccr`, `lite`, `rtk`, `codex-responses`, `headroom`, `relevance`, `caveman`, `aggressive`, `llmlingua`, `ultra`, `omniglyph`। Context editing, context budget, Live Zone, SLM prewarm, summarizer, MCP description/accessibility compaction, output-style ও universal context handoff বন্ধ। Pipeline/outputStyles খালি; active/compression combo ID null। Native prompt cache রাখা হয়েছে—এটি provider-এর repeated input reuse, অতিরিক্ত context summarizer নয়।

আগের global compression master ইতিমধ্যেই OFF ছিল। তাই পুরো token বৃদ্ধির মূল কারণ হিসেবে “compression চালু ছিল” বলা হচ্ছে না। Prefix বদলানো, implicit TTL rewrite এবং session/account continuity ছিল পরীক্ষায় ধরা gateway সমস্যা; এবার এগুলো সংশোধিত হয়েছে।

স্থায়ী change **১৮টি `nexa/` file-এ**, commit **`65c6c608a9a6e78b206c8f1cd199f7cf0e062ddf`**। Author ও committer Jillur Rahman। Normal hooks PASS; main `nexalance` ও পরীক্ষার child একই commit-এ clean। Upstream source-এ build-এর সময় প্রয়োগ করা ৮৮ patch/৫১ copy, ৩১ tracked ও ৯৪ generated CLI command exact inventory/hash অনুযায়ী restore হয়েছে। Public push/PR হয়নি।

### Validation ও পূর্ণ build

| পরীক্ষা | ফল |
| --- | --- |
| Old fixture-এ regression reproduction | ২৪ test-এর ১৩টি প্রত্যাশিত FAIL; পুরোনো সমস্যা পুনরুৎপাদিত |
| সংশোধিত focused regression | ২৪ PASS |
| Related regression | ২৯৮ PASS |
| Native Bridge / native UI | ৬০০ / ৩৬ PASS |
| Google model / deployment | ৫৮ / ৫২ PASS |
| Native fidelity / security events | ৮৪ / ৩৪ PASS |
| Core typecheck | PASS |
| Full typecheck ratchet | measured ৫৮৩০, baseline ৫৮৩০: PASS; zero-error দাবি নয় |
| পুরোনো retained body replay | ১৩০ artifact; আগের ৪৩টি same-account prefix-changing pair এখন stable prefix/affinity |
| Full production package | ৬২০ static dashboard page, dashboard gate, CLI generation, strict package validation, `npm pack`: সব PASS, exit 0 |

Suite-গুলোর coverage overlap আছে; এই count যোগ করে unique test total বলা হচ্ছে না। Exact validated ১৩৯ source file-এর hash reapplied build source-এর সঙ্গে মিলেছে। পুরোনো ৮২৬-test receipt দিয়ে changed code-এর validation প্রতিস্থাপন করা হয়নি। একই validated source-এ অযথা আবার full suite/build চালানো হয়নি।

Build-এ one worker, webpack parallelism 1, heap 6144 MiB, total RSS cap 9216 MiB, semispace 8 ও `RAYON_NUM_THREADS=1` ছিল। Peak **৭৮২১ MiB**, minimum physical headroom **১৫.৩১২ GiB**, pressure normal, swap growth 0, render overlap নেই। সফল package protected:

- omniroute-3.8.51.tgz (স্থানীয় বা private reference; প্রকাশিত নয়), **99,611,075 bytes**।
- SHA-256: `caff39e15e0e104ef2841ff5183e212a17d870f648ce800cd405fe96df802cba`।
- Archive `dist/BUILD_SHA` ও production `dist/BUILD_SHA`: **`65c6c608a`**।
- Validation receipt (স্থানীয় বা private reference; প্রকাশিত নয়), verified artifact receipt (স্থানীয় বা private reference; প্রকাশিত নয়), source restoration receipt (স্থানীয় বা private reference; প্রকাশিত নয়)।

### Deployment ও rollback

Verified package দিয়ে main-এর `nexa/deploy/omni-updater.sh` redeploy হয়েছে। Desktop shell build/deploy flags 0 ছিল। Isolated package install, real Anthropic inference smoke, consistent database snapshot, পুরোনো complete runtime preservation, promotion, runtime SHA, health ও native Bridge TLS gate PASS।

প্রথম watched install attempt ৩ GiB cap ছাড়িয়েছিল: peak **৩৩৯৫ MiB**। Serial sockets থাকলেও npm package extraction parallel ছিল; ওই attempt-এ প্রয়োজনীয় extraction preload যুক্ত ছিল না। নিজের install/smoke কাজ বন্ধ করা হয়; live runtime ও rollback অক্ষত ছিল। Failure receipt রাখা আছে। পরের attempt-এ task-local, পরীক্ষিত extraction wrapper দিয়ে npm extraction concurrency 1 রাখা হয়েছে; npm/global config বা resource guard bypass হয়নি।

সফল deploy-এ **১১৬৪ package install**, peak **১৩৮১ MiB**, minimum system headroom **১৪.১৩০ GiB**, pressure normal, swap growth 0, updater exit 0। Promotion-এর critical move-এ parent force-kill হয়নি। সফল deploy receipt (স্থানীয় বা private reference; প্রকাশিত নয়)।

আগের runtime `29329aa46` সম্পূর্ণ রাখা হয়েছে runtime-backups/20261007-095622 (স্থানীয় বা private reference; প্রকাশিত নয়)। Consistent SQLite snapshot update-backups/20261007-095622/storage.sqlite (স্থানীয় বা private reference; প্রকাশিত নয়)-এ; integrity `ok`। আগের সফল `29329aa46` artifact-এর SHA-256 পুনরায় মিলেছে। কোনো সফল artifact, source, rollback বা T7 asset মুছে ফেলা হয়নি।

### Real CLI এবং native app-এ cache reuse

দুটি আলাদা real Claude Code CLI session একসঙ্গে শুরু হয়; দুটিই নিজ নিজ session resume করেছে। চারটি expected response ঠিক, marker/session isolation ঠিক, selected account ও upstream session অপরিবর্তিত, top-level system fingerprint স্থিতিশীল। Bounded Sonnet 5.5 test-এর দুই resume-এ প্রত্যেকটিতে input-inclusive **২০৪৮**, cache read **১৪৯০**, cache write **৫২২**, fresh input **৩৬**, output **২৪**। Actual call artifact এবং native response দিয়ে join হয়েছে; এই sample-এ 400/404 নেই। Peak **৫৫৬ MiB**। CLI live evidence (স্থানীয় বা private reference; প্রকাশিত নয়)।

Native app-এর নতুন Code session-এ তিন turn-এ হুবহু `NATIVE_BRIDGE_QA_65C6C608A` ফিরেছে। Native transcript-এর unique message ID দিয়ে deduplicate করা হয়েছে; thinking/text stream-এ একই usage দুবার যোগ হয়নি। Hash-verified gateway artifact-এর সঙ্গে প্রতিটি main response-এর input/cache/output মিলেছে।

| Native app main turn | মোট input | Cache read | Cache write | Fresh input | Output |
| --- | ---: | ---: | ---: | ---: | ---: |
| প্রথম | 101,227 | 0 | 101,225 | 2 | 114 |
| দ্বিতীয় | 103,051 | 101,225 | 1,824 | 2 | 24 |
| তৃতীয় | 103,185 | 103,073 | 110 | 2 | 24 |

দ্বিতীয় turn-এ **৯৮.২৩%**, তৃতীয় turn-এ **৯৯.৮৯%** input cache থেকে পড়েছে। একই selected account, upstream session ও billing-header-বহির্ভূত top system fingerprint মিলেছে। Supported dynamic system message history-তে রয়েছে। Actual native client-এর explicit one-hour cache retained হয়েছে; এটিকে implicit subagent TTL rewrite বলা হয়নি। Native app live proof (স্থানীয় বা private reference; প্রকাশিত নয়)।

প্রথম app watchdog পুরো GUI/helper/MCP family মেপে **৩১৪৩ MiB**-এ সীমা ছাড়ায়; সেটি PASS বলা হয়নি। পরের পরীক্ষা exact SDK PID, birth time, command hash, native app parent, scratch cwd ও synthetic transcript identity মিলিয়ে শুধু ওই task worker/children ও watcher মেপেছে; অন্য সব app-এর চাপ independent system reserve-এ ধরা হয়েছে। Cap ৩ GiB অপরিবর্তিত; peak **১৮০১ MiB**, minimum headroom **১৪.০২৮ GiB**, কোনো stop/signal হয়নি। Exact SDK task budget (স্থানীয় বা private reference; প্রকাশিত নয়)।

### ব্যবহার দ্রুত বাড়ার যে অংশ gateway fix দিয়ে বন্ধ হয় না

নতুন app-এর এক ছোট প্রশ্নেও native client নিজে প্রায় **১০১k input context**, **৪৯টি tool definition**, adaptive thinking ও **`xhigh` / UI `Extra` effort** পাঠিয়েছে। Tool definition-এর serialized text 114,689 character; এটি 114,689 token বলা হচ্ছে না। একই sample-এ তিনটি auxiliary Haiku request ও দুটি explicit `SUGGESTION MODE` request আছে। Suggestion mode-এর উদ্দেশ্য request text থেকেই শনাক্ত; auxiliary Haiku-এর exact caller intent শুধু counters থেকে নির্ধারণ করা হয়নি। Native transcript-এ নয়টি Stop hook-এর completion-ও আছে।

অতএব একটি visible chat বা এক লাইনের উত্তর দেখেই একটিমাত্র ছোট inference হয়েছে ধরে নেওয়া যায় না। CLI safe-mode test-এর ছোট context ও app-এর সম্পূর্ণ loaded context একই workload নয়; তাদের token ratio দিয়ে native-versus-gateway billing multiplier বের করা যাবে না। আগের তদন্তের ১০ মিনিটে ৬২৪ সফল inference, transcript-এ ৯০.৬৬% child response এবং examined Sonnet thinking-এর বড় ভাগ ছিল বাস্তব workload-এর আলাদা evidence। Gateway compression বন্ধ করা সেই client-issued child/tool/effort/suggestion request মুছে দেয় না।

এই fix-এর পরে controlled real request-এ cache reuse ফিরেছে। **সারাদিনের usage ৩–৪ গুণ কমবে, তিন Max account-এর weekly limit আর শেষ হবে না, বা পুরোনো quota ফিরবে—এমন দাবি করা হচ্ছে না।** আগের native ব্যবহারের একই task/model/effort/context/parallelism-এর matched baseline নেই। Provider-এর weekly allowance weighting formula এখানে জানা নেই। Native client-এর workload/effort/child fan-out আলাদাভাবে নিয়ন্ত্রণের সিদ্ধান্ত প্রয়োজন হলে তা তার নিজস্ব ব্যবহারের পছন্দ অনুযায়ী হবে; official app/config সরাসরি edit করে এই ফল বানানো হয়নি।

### Google live regression: যেগুলো unresolved

Dynamic inventory-তে ১৮টি Google connection: ১৬ active, ২ operator-paused। বর্তমান active connection-এ sequential `gemini-3.8-flash-low` পরীক্ষা হয়েছে:

| ফল | সংখ্যা | Connection tag |
| --- | ---: | --- |
| Exact requested/selected connection ও `pong` PASS | ৬ | `private-id-005`, `private-id-006`, `private-id-007`, `private-id-008`, `private-id-009`, `private-id-010` |
| Genuine provider verification 403 | ৪ | AGY `private-id-002`, `private-id-011`; ANT `private-id-012`, `private-id-013` |
| Provider quota 429 | ৬ | ANT `private-id-014`, `private-id-015`, `private-id-016`, `private-id-017`, `private-id-018`, `private-id-019` |
| Operator-paused, skipped | ২ | AGY `private-id-003`; ANT `private-id-004` |

Failed API response-এ wrapper HTTP 502-এর ভিতরে provider 403/429 আছে; failed row-এর actual selected connection tag অনুপস্থিত, তাই সেগুলোকে successful routing বা wrong-account fallback বলা হয়নি। Matrix exit 1 provider failure-এর জন্য; resource guard failure নয়। কোনো paused connection enable, quota reset বা verification flag জোর করে clear হয়নি। Active/paused ও pre-existing verification/maintenance state retained। Provider verification account owner-এর নিজস্ব verification step ছাড়া code দিয়ে সম্পন্ন বলা যাবে না; quota reset-ও deployment দিয়ে তৈরি করা হয়নি। Private verification URL/credential প্রকাশ করা হয়নি। Current matrix (স্থানীয় বা private reference; প্রকাশিত নয়)।

### শেষ data/config যাচাই ও সীমা

Production health 200; local native ingress 443 এবং Bridge 8443-এ `api.anthropic.com` SNI দিয়ে CA ও hostname verification-সহ TLS PASS। ২৫ provider connection ও ৩ API key-এর exact ID-set hash অপরিবর্তিত। Snapshot ও live database-এ আগের **৪৯,৬১৪টি usage row-এর সব field-এর canonical hash** মিলেছে। `.env`, CA, DNS shim, launch agent ও `.claude/settings.json`-এর byte hash অপরিবর্তিত। Live compression policy আবার read করে সব OFF পাওয়া গেছে।

একটি আলাদা observation: native app তার first UI turn-এ নিজের `claude_desktop_config.json` লিখেছে; `main.log`-এ `2026-10-07 10:10:17 [info] Config file written` এবং matching file mtime আছে। ওই desktop preference file আগের byte hash-এ নেই; exact preference diff-এর original copy নেই। তাই সেটিকে byte-identical বলা হয়নি। কোনো manual official config edit বা forced restore করা হয়নি। প্রথম final checker-এ ID-set hash format ও nested maintenance field ভুল পড়ার false negatives ছিল; diagnostic receipt রাখা আছে, corrected receipt-এ original format/field দিয়ে পুনরায় যাচাই হয়েছে। Native app-এর নিজের config write-টিও আলাদা observation হিসেবে রাখা হয়েছে।

শেষ live attestation (স্থানীয় বা private reference; প্রকাশিত নয়)-এ required deployment/cache/data checks PASS এবং উল্লিখিত native preference observation আছে। Follow-up automation **PAUSED**; সফল build/deploy/QA পুনরায় চালানোর প্রয়োজন নেই। Google provider quota/verification-এর বাকি ফল এবং দীর্ঘমেয়াদি matched workload comparison এই completion-এর সীমা হিসেবে থাকছে।


---

## 2026-10-07 — Native Thread ও usage accounting: production `a535572e5`

লেখক: Jillur Rahman। নতুন কাজের ভিত্তি `~/Downloads/OMNIROUTE-AND-NEXT-STEPS.md`-এর **ক. OmniRoute** অংশ। এটি আগের `65c6c608a` release-এর প্রমাণের পরে নতুন appendix; পূর্বের bytes অক্ষত আছে। Skill family, official Claude settings ও public OSS publishing এই কাজের scope নয়।

**পূর্ণ build, package ও production deployment সম্পন্ন।** বর্তমান source ও live runtime `a535572e5`; পূর্ণ commit `a535572e52f54d557391e57087bac9ef0e08e6bc`। Real concurrent Claude Code CLI এবং dashboard UI PASS। **এই নতুন release-এর বাস্তব Claude অ্যাপ পরীক্ষা এখনও অসম্পূর্ণ: macOS screen locked, UI access পাওয়া যায়নি।** আগের release-এর native-app proof-কে এই release-এর proof বলা হচ্ছে না। এক ঘণ্টার matched passive traffic ও দৈনিক/weekly savings-ও এখনও measured acceptance নয়।

### যে কারণগুলো সরাসরি প্রমাণ হয়েছে

Native Thread-এর create এবং sparse continuation-এ gateway request shape থেকে beta পুনরায় যোগ করত; full-history normalization sparse turn-এর system directive hoist করত এবং cache markers বদলাতে পারত। Provider-এর Thread invariant ভাঙলে 400 হতো, তারপর client full history replay করে উত্তর দিত। একই account-এ replay cache hit হতে পারে; failed 400-এর zero token row থেকে double billing বলা যায় না। Account বদলালে cached prefix পুনরায় লেখার ঝুঁকি ছিল।

প্রথম follow-up `b53c1cea3`-তে marker response সফল হলেও বাস্তব দুই session-এর **৬ provider request-এর মধ্যে ২ continuation 400**, তারপর replay 200 দেখা গেছে। এতে native condition-এর সাধারণ `else` branch ধরা পড়ে। `a535572e5`-তে native branch পৃথক; raw native fields parameter sanitation-এর পরেও ফিরে থাকে। Native CCH re-signing idempotent; beta client-negotiated। System/messages/tools/cache/thinking/output_config ও Thread diagnostics-এর native semantics বজায় থাকে। Sparse delta থেকে history বানানো বা sibling account-এ অসম্পূর্ণ prompt পাঠানো হয় না।

আরেকটি নির্দিষ্ট bug: passthrough stream wrapper-এ native source format ছিল না এবং final provider summary synthesized chat summary দিয়ে বদলাত। ফলে provider-reported nested 5m/1h cache creation counters হারাত। এখন native reducer ও raw provider usage থাকে; client stream bytes অপরিবর্তিত। Full chat pipeline regression test প্রকৃত SQLite persistence পর্যন্ত এই ঘটনা পরীক্ষা করে।

Installed migration-এর আলাদা bug-ও ধরা হয়েছে: `d8cc12b84` package-এ SQL 197 থাকলেও bundled path পুরোনো source checkout বেছে নিত। CLI এখন installed package-এর migration directory নেয়; isolated smoke-এ migration 197 ও চারটি usage column inference-এর আগে বাধ্যতামূলক। Live schema-তে চারটিই আছে। পুরোনো failed/সফল artifact ও complete runtime backup রাখা হয়েছে।

### Attachment-এর সাতটি পয়েন্টের অবস্থা

| পয়েন্ট | পরিবর্তন ও বর্তমান প্রমাণ |
| --- | --- |
| Thread 400 | Native fields/header preservation ও native branch repair deploy হয়েছে। Final real CLI sample-এ ৪/৪ provider request 200; দুই session-এই `create → continue`, 400/404/replay শূন্য। এটি bounded sample, পূর্ণ ঘণ্টার acceptance নয়। |
| Thread 404/owner | Response message ID থেকে hashed ownership/cache group রাখা হয়, 64 KiB observation ও bounded retention সহ। Eligible owning account-এই continuation যায়। Unknown/paused/exhausted/disallowed owner হলে native client-কে full replay cue দেওয়া হয়; incomplete delta অন্য account-এ পাঠানো হয় না। Focused tests PASS; final live দুই session একই owner/group রেখেছে। |
| Effort log | Native output_config, per-message directive ও API reasoning_effort log হয়; encrypted thinking থাকা আবশ্যক নয়। Real Sonnet/Opus CLI `high/high`, পৃথক বাস্তব API call `max/max`। Explicit effort কমানো হয়নি। |
| Cache health | Token-based read share, first successful group/model request বাদে ≥20k write এবং read < write হলে large rewrite, known/unknown coverage, 5m/1h write, hourly thresholds ও dashboard panel deploy হয়েছে। Historical unknown TTL/session data বানানো হয়নি। Mandatory build regression gate 81/81। |
| API-equivalent cost | Official current rates যাচাই করে supported pricing API দিয়ে শুধু missing Sonnet/Opus 5.5 entry যোগ হয়েছে; existing prices retained। Consistent pre-change SQLite backup আছে। Actual rendered dashboard-এ উভয়ের numeric price equivalent আছে। এটি standard API comparison; subscription bill বা fixed weekly-point conversion নয়। |
| Selection/snapshots | Default fill-first-এ eligible new native session বেশি quota-যুক্ত account পছন্দ করে; existing eligible affinity ও explicit alternate strategy থাকে। Exhausted account 30 মিনিটে recheck/reset-এর পরে bounded retry করে; fresh positive provider evidence ছাড়া wall clear হয় না। Same-state reset jitter ≤2 seconds dedup, 30-minute evidence checkpoint; actual deadline hour-এ round করা হয়নি। Tests PASS, live owner continuity PASS। |
| Haiku weekly-limit | পুরোনো বার্তার matching request trace পাওয়া যায়নি; root cause এখনও নিশ্চিত নয়। Fresh native first-party Haiku control 200 এবং `HAIKU_LIMIT_CONTROL_OK` দিয়েছে। Native non-message usage endpoint সম্ভাব্য আলাদা পথ, নিশ্চিত কারণ নয়। Pooled quota বলে মিথ্যা headers/success তৈরি করা হয়নি। |

Compression master এবং **সব ১২টি engine OFF**; contextEditing ও liveZone OFF। Native implicit TTL-এ gateway জোর করে 1h দেয় না। Native client-এর actual 1h request থাকলে সেটি অক্ষত থাকে। Global effort/skill configuration বদলানো হয়নি।

### Artifact, source ও deployment

- Verified package (স্থানীয় বা private reference; প্রকাশিত নয়): **99,648,283 bytes**; SHA-256 `7a83f3996b62ae64010ad627c1c2cc5cd5c4708096c9f769759224f1478756fd`; archive `dist/BUILD_SHA=a535572e5`।
- Whole pipeline exit 0: full dashboard compilation, 620 static pages, dashboard gate, CLI generation, pack-artifact validation, strict Bridge source/dist/lifecycle gate ও npm pack PASS। One worker, webpack parallelism 1, heap 6144 MiB, RSS cap 9216 MiB, semispace 8, Rayon pool 1। Compiler child peak 7861 MiB; whole watched job peak **7943 MiB**, minimum system headroom **14.212 GiB**, normal pressure, swap growth 0, render overlap নেই। Build receipt (স্থানীয় বা private reference; প্রকাশিত নয়)।
- Applied overlay restore এবং exact generated inventory অনুযায়ী 31 tracked CLI file HEAD-এ restore, 94 task-created generated copy অপসারণ হয়েছে; সব 129 generated source copy artifact directory-তে hash-verified অবস্থায় preserved। সফল `.build`/`dist`, package, evidence ও আগের runtime/output মুছে বা overwrite করা হয়নি। Main ও child clean/pristine; মূল `65c6c608a` থেকে 87 permanent changed path সব `nexa/`। তিনটি normal-hook commit-এর author/committer Jillur Rahman। Public push/PR হয়নি।
- Verified package দিয়ে main-এর bounded updater redeploy **2026-10-07 10:24:51Z / 16:24:51 Dhaka**-এ exit 0। Desktop build/deploy flags 0। Isolated install, বাস্তব Anthropic smoke, live-schema gate, consistent DB snapshot, complete prior runtime preservation ও promotion PASS। Deploy peak **1547 MiB / 3072 cap**, minimum headroom **18.596 GiB**, normal pressure, swap growth 0; কোনো resource stop বা promotion parent kill হয়নি। Deploy receipt (স্থানীয় বা private reference; প্রকাশিত নয়)।
- Complete previous runtime `b53c1cea3`: runtime backup (স্থানীয় বা private reference; প্রকাশিত নয়)। Consistent predeploy snapshot (স্থানীয় বা private reference; প্রকাশিত নয়)। Final health 200 `ok`; CA, hostname ও `api.anthropic.com` SNI verification সহ native ingress 443 এবং Bridge 8443 PASS। শেষ transport verification (স্থানীয় বা private reference; প্রকাশিত নয়)।

### বাস্তব Claude Code ও accounting ফল

Native first-party login, API override ছাড়া, দুটো concurrent session: Sonnet 5.5 high ও Opus 5.5 high; প্রতিটিতে দুই turn। Requested model ও marker সঠিক, cross-session marker contamination নেই, overlap সত্য, Bridge PID retained। **প্রতিটি session-এর ঠিক দুইটি provider row, create তারপর continue; একই account এবং cache group।** Strict live summary (স্থানীয় বা private reference; প্রকাশিত নয়)।

| Model/turn | Thread | HTTP | Read | Write | 5m write | 1h write |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Sonnet 5.5 / 1 | create | 200 | 1467 | 458 | 0 | 458 |
| Sonnet 5.5 / 2 | continue | 200 | 1925 | 104 | 0 | 104 |
| Opus 5.5 / 1 | create | 200 | 1467 | 452 | 0 | 452 |
| Opus 5.5 / 2 | continue | 200 | 1919 | 102 | 0 | 102 |

উপরের read/write এবং provider `message_start.usage.cache_creation`-এর 5m/1h value database-এর সঙ্গে **হুবহু** মিলেছে। Exact provider comparison (স্থানীয় বা private reference; প্রকাশিত নয়)। Whole pair peak 638.422 MiB, minimum headroom 19.202 GiB, normal pressure, render overlap নেই।

পৃথক OpenAI-compatible route-এর `claude/claude-opus-5-5`, requested `max`, upstream `max`, HTTP 200 ও `API_MAX_NATIVE_OK` PASS। Haiku control-ও normal answer দিয়েছে। CLI/API correlation (স্থানীয় বা private reference; প্রকাশিত নয়)-এ bounded capture-এ 9 Claude provider row সব 200; native/API effort ঠিক, effort না-পাঠানো ছোট Haiku request-এ null স্বাভাবিক। ঐতিহাসিক Haiku weekly-limit বার্তা এই control দিয়ে ব্যাখ্যা করা হয়েছে বলা হচ্ছে না।

### Dashboard ও সরকারি rate

Live cache-health API-তে native fields, hourly alerts, `costBasis=configured-api-price-equivalent`, `weeklyPointEstimate=null` PASS। Actual installed Chrome-এর isolated headless DOM ও screenshot-এ নতুন panel-এর সব column দেখা যায়, JavaScript error নেই; source test-কে visual proof বলা হয়নি। দুই priced model-এ `Unknown price` সরেছে। Priced UI proof (স্থানীয় বা private reference; প্রকাশিত নয়), panel screenshot (স্থানীয় বা private reference; প্রকাশিত নয়)।

[Official Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing) এই run-এ live যাচাই করে নিচের standard USD/মিলিয়ন-token rates পাওয়া গেছে। Missing দুই entry supported `/api/pricing` PATCH দিয়ে যোগ হয়েছে, existing price entries অপরিবর্তিত। 1h rate public 2× input formula থেকে; API-এর supported fields-ই লেখা হয়েছে। Pricing provenance/readback (স্থানীয় বা private reference; প্রকাশিত নয়)।

| Model | Fresh input | Output | Cache read | 5m write | 1h write |
| --- | ---: | ---: | ---: | ---: | ---: |
| Sonnet 5.5 | $2 | $10 | $0.20 | $2.50 | $4 |
| Opus 5.5 | $4 | $20 | $0.20 | $5 | $8 |

Consistent pre-pricing backup (স্থানীয় বা private reference; প্রকাশিত নয়) retained। Dashboard-এর retained historical window-তে পুরোনো cache-write ঘটনা আছে; নতুন price দিয়ে সেই data-ও comparison-এ আসে। Hourly Sonnet alert 68.17% read দেখেছে, যে window-তে আগের release-এর cold/replayed test-ও আছে। এটিকে নতুন release-এর matched production-hour failure বা savings বলা হয়নি। Historical unknown TTL range থাকে; $/weekly-point অনুমান যোগ হয়নি। Attachment-এর $24.7–29.6/point/R² claim পুনঃপ্রমাণের raw `REPORT.md` অনুপস্থিত।

### Regression validation-এর প্রকৃত সীমা

Final native gate **81/81**, related stream/payload tests **100/100**, core typecheck PASS। Full TypeScript ratchet **5824 ≤ 5830**, complexity **2981 ≤ 3218**, cognitive **1358 ≤ 1437**, touched lint/format ও normal commit hooks PASS। Hash-verified broad receipts application source unchanged অংশে reuse হয়েছে; অযথা আবার পুরো suite চালানো হয়নি।

Original full Node sweep **45,115 PASS / 4 FAIL / 28 skipped**, exit 1। Occupied CDP port ও startup/deadline timing-এর তিন failed file এক worker-এ **31 PASS / 1 platform skip**, zero failure। Dashboard 134/134, serial 23/23, MCP 493/493 PASS। Full UI sweep **2844 PASS / 6 FAIL**; outdated server-state/EventSource fixture সংশোধনের focused recovery **14/14 PASS**। Full failed sweep-কে exit 0 বা সব test passing বলা হয়নি। প্রথম interrupted/OOM/invalid-option ও fixture evidence retained। Related validation-এর প্রথম command ভুল config filename নিয়েছিল; correct core config ও full type ratchet পৃথক receipt-এ PASS। Read-only retention utility-র newline escaping error corrected; initial exit 1 ও corrected success আলাদা logs-এ আছে। Product guard/baseline দুর্বল করা হয়নি। Current validation receipt (স্থানীয় বা private reference; প্রকাশিত নয়)।

### Google: একই deployment-এর পৃথক provider QA

Original matrix script hash-verified byte-identical copy থেকে current 18 Google connection inventory নেওয়া হয়েছে। **16 active** sequential `gemini-3.8-flash-low` test, 2 operator-paused skip। প্রথম unauthenticated management read 401 হওয়ায় কোনো inference শুরু হয়নি; existing management key দিয়ে authenticated run হয়েছে, auth guard পরিবর্তিত হয়নি। Original matrix evidence preserved।

| বর্তমান ফল | সংখ্যা | Hash tag |
| --- | ---: | --- |
| Requested = actual selected এবং `pong` PASS | 5 | `private-id-005`, `private-id-006`, `private-id-007`, `private-id-008`, `private-id-009` |
| Genuine verification 403 | 4 | AGY `private-id-002`, `private-id-011`; ANT `private-id-012`, `private-id-013` |
| Provider quota 429 | 6 | ANT `private-id-014`, `private-id-015`, `private-id-016`, `private-id-017`, `private-id-018`, `private-id-019` |
| Client timeout | 1 | AGY `private-id-010` |
| Operator-paused, skipped | 2 | AGY `private-id-003`; ANT `private-id-004` |

Current matrix (স্থানীয় বা private reference; প্রকাশিত নয়): **5 PASS / 11 FAIL / 2 skipped**, exit 1, account inventory retained। Provider error-এর failed response-এ selected ID অনুপস্থিত; তাই wrong-account fallback বা successful selection বলা হয়নি। `private-id-010`-র backend পরে 200 `pong` দিয়েছে, কিন্তু প্রথম client timeout সত্যি; late completion (স্থানীয় বা private reference; প্রকাশিত নয়) আলাদা। শুধু ওই connection-এ একবার 90-second recheck-ও client abort হয়েছে; matrix FAIL overwrite বা PASS-এ বদলানো হয়নি। Quota/verification accounts বারবার retry, enable বা forced clearing হয়নি। Private verification URL/credential প্রকাশ করা হয়নি। Genuine verification account owner-এর provider step; quota reset-ও deployment দিয়ে তৈরি হয়নি।

### Retention ও যা এখনও বাকি

25 provider connection ও 3 API-key ID-set hash retained; active/paused operator state একই। Consistent predeploy snapshot-এর **52,083 usage row-এর সব field** canonical hash `ffcb2ec97bcf6a1e9f0f873b58a1d80f5f0db1a677aeb55b2155bf1f3775a976` দিয়ে current database-এর একই rows-এর সঙ্গে মিলে, different row 0। Final inventory-তে 52,106 usage row / 54,439 call row; পুরোনো rows অক্ষত। `.claude/settings.json` byte hash unchanged। History proof (স্থানীয় বা private reference; প্রকাশিত নয়), source/config attestation (স্থানীয় বা private reference; প্রকাশিত নয়)।

এই release-এর native app UI turn/continuation test macOS screen lock-এর কারণে করা যায়নি; Mac unlock করার user action pending। CLI concurrent/native wire test ও dashboard headless visual proof আছে, actual Claude-app proof নেই। এক ঘণ্টার real matched workload-এ 400 <1%, large rewrite <2%, Sonnet read ≥80% এবং একাধিক দিনের weekly-limit decline comparison বাকি। Synthetic ঘণ্টাব্যাপী request দিয়ে quota খরচ করা হয়নি। পুরোনো Haiku ঘটনার exact root cause-ও matching trace ছাড়া unresolved।

পুরোনো `omniroute-build-deployment` automation আগের **PAUSED** অবস্থায় আছে; stale artifact redeploy বা নতুন build পুনরাবৃত্তি হয়নি। Source/package/deployment সম্পন্ন হলেও উল্লিখিত app/provider/long-term evidence সীমার বাইরে “সব সমস্যা সম্পূর্ণ শেষ” বলা হচ্ছে না।
