# Routed model quality ও inclusive usage — ২০২৬-১১-০৬

Claude native client থেকে অন্য provider-এ routing করলে request সফল হওয়া,
সঠিক protocol translation এবং কাজের মান তিনটি পৃথক বিষয়। এই পরিবর্তন
inclusive token accounting ও সরবরাহ করা assistant phase সংরক্ষণ করে। এটি
Claude ও GPT-এর সমান মান, পূর্ণ native hosted-feature parity বা একটি নতুন
live deployment-এর ঘোষণা নয়।

## সংশোধন

`usage_history.tokens_input`-এ cache read ও cache creation অন্তর্ভুক্ত থাকে।
`tokens_output`-এ reasoning অন্তর্ভুক্ত থাকে। Self-service total এবং
self-tracked monthly provider total আবার ওই breakdown যোগ করত। এখন total
হবে input + output; পৃথক cache/reasoning counters সংরক্ষিত থাকবে। যেমন,
200,000 input, 190,000 cache read, 1,000 output ও 700 reasoning-এর total
201,000; 391,700 নয়। এটি reporting ও local self-tracked quota arithmetic-এর
সংশোধন; provider-এর subscription allowance সরাসরি বদলায় না।

Antigravity/Gemini-এর `localUsageHistory` fallback-ও normalized output-এর সঙ্গে
reasoning আবার যোগ করছিল। Gemini extractor candidates ও thoughts মিলে output
সংরক্ষণ করে; তাই fallback এখন শুধু inclusive input + output যোগ করে। যেমন,
1000 input, 100 visible output ও 900 thoughts হলে normalized output 1000;
local estimate 2 units, 3 নয়। একই account/model-এর সফল পাঁচ ঘণ্টার window-ই
গণনা হয়। Provider-এর authoritative quota, token breakdown ও billed usage বদলায় না।

Chat-shaped assistant history থেকে Responses input তৈরির সময় explicit
`phase` হারিয়ে যাচ্ছিল। এখন `commentary`, `final_answer` ও explicit `null`
assistant item-এ থাকে। User item-এ phase যোগ হয় না; অনুপস্থিত phase অনুমান
করা হয় না এবং invalid value পাঠানো হয় না। এই field সরবরাহ করা client-এর
জন্য সংশোধনটি প্রযোজ্য। Claude protocol-এ অনুপস্থিত GPT metadata এটি তৈরি
করে দেয় না।

Native client-এর usage attribution শুধু target provider `claude` হলে session
tag লিখছিল। ফলে একই Claude client থেকে GPT বা Gemini-তে route করা request
নিজের native session-এর সঙ্গে সরাসরি মেলানো যাচ্ছিল না। এখন source format
`claude` হলে validated client session identifier-এর SHA-256 সংরক্ষিত হয়।
Native Claude cache-group attribution তার নিজস্ব provider-এই সীমিত থাকে।
অন্য protocol-এর একই metadata/header native attribution তৈরি করে না। Wire
payload, chosen model, effort, token counters ও real errors অপরিবর্তিত থাকে।
পুরোনো NULL tags backfill করা হয় না এবং raw session identifier যোগ হয় না।

## পরীক্ষার চুক্তি

`usage-inclusive-token-totals.test.ts` real SQLite queries দিয়ে cache/read/write
ও reasoning breakdown, owner/month/connection boundaries এবং বিদ্যমান cost
পরীক্ষা করে। `routed-gpt-quality-contract.test.ts` explicit phase, বড় synthetic
system ও transcript, tool schema, tool call/result, selected effort এবং native
Responses opaque reasoning সংরক্ষণ পরীক্ষা করে। সব input synthetic।

`quality-usage-delta-v3.8.52.patch` শুধু এই সংশোধনগুলো সরিয়ে আগের behavior
ফেরায়। Mandatory CI-তে আগের behavior-এর 11টি case-এর মধ্যে নির্দিষ্ট 7টি
assertion failure চাই; environment error, skipped test বা cancelled run
reproduction নয়। তারপর সংশোধন পুনরায় apply করে নতুন tests ও বিদ্যমান
self-service suite পাস করতে হবে। Production Node-এও suite চলে। Exact ফল
commit-specific CI-এর `native-validation.json` ও TAP artifacts-এ থাকবে।

Antigravity case-এ real Gemini normalization ও isolated SQLite rows দিয়ে
provider, account, model, success ও `[windowStart, resetAt)` boundaries পরীক্ষা
হয়। HTTP responses সম্পূর্ণ synthetic; quota বা generation network call হয় না।

`native-source-attribution.test.ts` real SQLite-তে পুরো `persistAttemptLogs`
path চালায়। Native Claude, routed GPT/Gemini, header precedence, malformed
identifier, non-native spoof metadata/header ও failed upstream attempt—8টি
case আছে। Provider-only baseline-এ নির্দিষ্ট 6টি assertion failure ও 2টি pass
চাই; environment error reproduction নয়। সংশোধিত focused suite, বিদ্যমান
logging regressions এবং production Node gate বাধ্যতামূলক। এটি future log
attribution-এর সংশোধন; model output quality benchmark নয়।

Source validation, package validation এবং live acceptance পৃথক gate। এই
পরিবর্তনের সঙ্গে model output benchmark বা provider generation চালানো হয় না।

`a40c4b083d664444199cfea52068af8c501e4517`-এর
[পূর্ণ source CI](https://github.com/developerjillur/omniroute-optimizer/actions/runs/42163225907)
পাস করেছে। Attribution baseline 8টির মধ্যে নির্দিষ্ট 6টি assertion failure
ও 2টি pass; corrected logging family 26/26, quality/usage family 21/21,
production Node native family 245/245 এবং upgrade compatibility 1293/1293।
Full TypeScript 6510 ≤ 6529; core types, lint, docs ও installed production
dependency audit পাস। এটি recorded source commit-এর ফল; পরের documentation
commit বা live runtime-কে ওই source commit বলা হচ্ছে না। পূর্ণ private log
audit এবং model-output comparison অসম্পূর্ণ; application build বন্ধ আছে।

পরের documentation commit `e5338c8`-এর [CI run](https://github.com/developerjillur/omniroute-optimizer/actions/runs/42166307812)
extended family-তে 171টির মধ্যে 170টি pass ও একটি quota polling boundary failure
সংরক্ষণ করেছে। Test-এর প্রথম `Date.now()` ও quota observation-এর `fetchedAt`
একই clock instant ধরে নেওয়ায় কয়েক millisecond পার্থক্যেও failure হতো। Fixture-এর
clock এখন স্থির; পৃথক delayed-observation case একই 30-minute boundary পরীক্ষা করে।
Runtime polling interval, quota policy ও পুরোনো assertions অপরিবর্তিত। Failed
run-কে pass বলা হচ্ছে না; এই test correction-এর নিজস্ব source CI প্রয়োজন।

## মান ও quota বিশ্লেষণের সীমা

একই native client-এর system, tool history ও effort সংরক্ষিত থাকলেও target
model-এর training, tool behavior এবং native hosted features পৃথক হতে পারে।
Claude-এর server-side advisor অন্য provider-এ executable tool হিসেবে
প্রতিস্থাপন করা যায় না। Encrypted reasoning ও signed native thinking-ও
ভিন্ন provider-এর মধ্যে বিনিময়যোগ্য নয়। Display summary কোনো authentic
reasoning continuation-এর বিকল্প নয়।

Native Responses client-এর opaque state সংরক্ষণ করার পরীক্ষা Claude client
দিয়ে একই state সম্পূর্ণ round-trip হওয়ার প্রমাণ নয়। ওই protocol gap-এর
জন্য account/session-scoped capture, replay ও isolation-এর পৃথক validation
প্রয়োজন। মাপা output comparison ছাড়া routing-এর সব মানগত পার্থক্যের কারণ
এটি—এমন সিদ্ধান্ত গ্রহণ করা হচ্ছে না।

বড় context, tool/subagent turns, cache creation, reasoning effort এবং
সত্যিকারের failed in-flight request usage বাড়াতে পারে। Cache-read tokens-কে
নতুন uncached input হিসেবে গণনা করা সঠিক নয়। Missing usage counter-কে
measured zero বা subscription charge হিসেবে ধরা যাবে না। Token totals
থেকে provider-এর পুরো account allowance debit হিসাব করা যায় না; অন্য
native বা external traffic-ও থাকতে পারে।

ব্যক্তিগত usage, session, account ও security metadata এই repository-তে
প্রকাশিত হয় না। স্থানীয় read-only audit-এর coverage ও সীমা পৃথক private
receipt-এ সংরক্ষিত থাকবে। সীমিত exposure/persistence checks একটি পূর্ণ
malware clearance নয়।

## প্রাথমিক নথি

- [OpenAI conversation state](https://developers.openai.com/api/docs/guides/conversation-state): stateless replay-এ সম্পূর্ণ response output ও assistant phase সংরক্ষণ।
- [OpenAI reasoning](https://developers.openai.com/api/docs/guides/reasoning): tool turns-এর মধ্যে authentic reasoning items ফিরিয়ে দেওয়া।
- [OpenAI prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching): caching ও generation quality, cache ও rate-limit semantics।
- [Claude prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching): native input, cache read ও cache creation counters।
