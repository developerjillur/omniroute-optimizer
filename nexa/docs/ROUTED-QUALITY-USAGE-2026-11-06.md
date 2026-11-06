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

Chat-shaped assistant history থেকে Responses input তৈরির সময় explicit
`phase` হারিয়ে যাচ্ছিল। এখন `commentary`, `final_answer` ও explicit `null`
assistant item-এ থাকে। User item-এ phase যোগ হয় না; অনুপস্থিত phase অনুমান
করা হয় না এবং invalid value পাঠানো হয় না। এই field সরবরাহ করা client-এর
জন্য সংশোধনটি প্রযোজ্য। Claude protocol-এ অনুপস্থিত GPT metadata এটি তৈরি
করে দেয় না।

## পরীক্ষার চুক্তি

`usage-inclusive-token-totals.test.ts` real SQLite queries দিয়ে cache/read/write
ও reasoning breakdown, owner/month/connection boundaries এবং বিদ্যমান cost
পরীক্ষা করে। `routed-gpt-quality-contract.test.ts` explicit phase, বড় synthetic
system ও transcript, tool schema, tool call/result, selected effort এবং native
Responses opaque reasoning সংরক্ষণ পরীক্ষা করে। সব input synthetic।

`quality-usage-delta-v3.8.52.patch` শুধু এই সংশোধনগুলো সরিয়ে আগের behavior
ফেরায়। Mandatory CI-তে আগের behavior-এর 10টি case-এর মধ্যে নির্দিষ্ট 6টি
assertion failure চাই; environment error, skipped test বা cancelled run
reproduction নয়। তারপর সংশোধন পুনরায় apply করে নতুন tests ও বিদ্যমান
self-service suite পাস করতে হবে। Production Node-এও suite চলে। Exact ফল
commit-specific CI-এর `native-validation.json` ও TAP artifacts-এ থাকবে।

Source validation, package validation এবং live acceptance পৃথক gate। এই
পরিবর্তনের সঙ্গে model output benchmark বা provider generation চালানো হয় না।

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
