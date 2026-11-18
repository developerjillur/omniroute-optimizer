# নতুন model catalog ও compatibility — 2026-11-18

## বর্তমান অবস্থা

Source candidate প্রস্তুত; local helper tests 10/10 পাস। Application integration,
সম্পূর্ণ compiler comparison ও documentation gates-এর GitHub validation বাকি।
এই candidate দিয়ে local full build বা live package promotion এখনও হয়নি।
বর্তমান live version v3.8.53 অক্ষত আছে।

## বর্তমান evidence

- দুই active Codex connection-এর authenticated discovery-তে `gpt-6.2-sol` ও
  `gpt-6.2-astra` আগেই এসেছে। Provider dashboard-এ imported rows দেখা গেছে।
  সাধারণ `/api/models` শুধু static catalog enumerate করছিল; ফলে discovery-তে
  পাওয়া নতুন model সাধারণ picker-এ থাকত না।
- Codex discovery দুই model-এর জন্য 872000 input limit, Responses format,
  vision এবং `low`, `medium`, `high`, `xhigh`, `max`, `ultra` effort দিয়েছে।
  Public API-এর 1050000 context-এর সঙ্গে এই provider-specific input limit মেশানো হয়নি।
- Google refresh-এর পরেও cached catalog-এ `gemini-4-hydrogen-disabled`,
  `gemini-4-argon-disabled`, `gemini-4-carbon-disabled` placeholder ছিল।
  Placeholder-কে callable model হিসেবে দেখানো যাবে না; suffix সরিয়ে account access বানানো হয়নি।
- Operator জানিয়েছেন official app-এ Hydrogen ও Argon select করা যায়, Carbon যায় না।
  OmniRoute-এর account-specific catalog ঠিক হওয়ার বিষয়টি build-এর পর যাচাই বাকি।
- Installed official Antigravity app-এর version 2.28.2; পুরোনো IDE fallback 2.5.5।
  Version resolver এখন installed metadata-কে minimum হিসেবে নেয় এবং বর্তমান release feed-ও পড়ে।
  Official CLI 1.5.8 release অনুযায়ী CLI compatibility fallback হালনাগাদ হয়েছে।

## Nexa source পরিবর্তন

1. Dashboard catalog এখন active synced chat/Responses rows-ও enumerate করে।
   Operator alias, hidden model, paid-model filter ও connection exclusions বজায় থাকে।
2. Google discovery এবং cached-row normalization থেকে disabled placeholder বাদ পড়ে।
   পুরোনো raw database evidence মুছে ফেলা হয় না।
3. Native `:fetchAvailableModels` discovery-তে assigned project পাঠানো হয়।
   অন্য discovery endpoint-এর body অপরিবর্তিত থাকে। Project/version mismatch এই
   account-এর কারণ কি না এখনও upstream comparison দিয়ে প্রমাণিত হয়নি।
4. Hydrogen ও Carbon-এর canonical ID যথাক্রমে official high ও medium tier-এ resolve হয়।
   Account discovery-এর অনুমতি প্রয়োজন; নতুন mapping access দেয় না।
5. Gemini 4-এ numeric `thinkingBudget`, বিশেষ করে `0`, তৈরি করা হয় না।
   কোনো explicit level না থাকলে native default থাকে; Hydrogen-এর explicit XHIGH/max রাখা হয়।
   Gemini 3.8-এর আগের zero-budget আচরণ অক্ষত।
6. GPT-6.2 Sol/Astra-এর Responses/tool/vision fallback metadata ও API/Codex cost
   estimates যোগ হয়েছে। Codex-এর separate cache-write charge নেই; credit/PAYG speed
   multiplier included-plan quota হিসেবে ব্যাখ্যা করা হয় না। পুরোনো pricing override অক্ষত।
7. নতুন Gemini API registry metadata-তে Hydrogen-এর 65536 ও Carbon-এর 32768
   conservative foreground output cap রাখা হয়েছে। এটি 1M-token foreground output বা
   background long-decode implementation-এর দাবি নয়।

## Validation ও সীমা

- Local pure helpers: 10 tests, 10 pass, 0 fail, 0 skip; observed family peak 105.44 MiB।
- প্রথম formatter 128 MiB family budget অতিক্রম করায় নিজের process stop হয়েছিল।
  File ধরে sequential `--jitless` formatting-এর peak 69.05 MiB; system pressure normal ছিল।
- প্রথম helper invocation-এ `--jitless`-এর কারণে native TypeScript-এর WebAssembly
  loader চলেনি; সেটি environment failure, regression reproduction নয়। পরের run-এ
  শুধু ওই flag সরিয়ে 10/10 tests পাস হয়েছে। পুরোনো receipts সংরক্ষিত।
- নতুন scoped GitHub workflow pinned v3.8.53-তে সব overlay patch applicability,
  isolated adapter/dashboard tests, পুরোনো pricing/effort/Fable regressions,
  completed compiler diagnostics comparison এবং docs-all পরীক্ষা করবে।
- Model generation, provider quota consumption, account enable/rotation, default model
  switch, root job change, app update বা live restart করা হয়নি।
- Provider dashboard-এর Playground-এ `catalog_build_timeout`-ও দেখা গেছে; এটি নতুন
  model-এর successful generation-এর evidence নয়। বর্তমান model task দিয়ে সেই
  আলাদা catalog latency issue সমাধান হয়েছে বলা যাবে না।
- Google provider-এর `Sync` control refresh নয়, auto-sync toggle। একটি control ভুল করে
  toggle হয়েছিল এবং সঙ্গে সঙ্গে আগের enabled অবস্থায় ফিরিয়ে দেওয়া হয়েছে; active
  Google connections-এর auto-sync শেষে enabled ছিল। Manual import আলাদা control দিয়ে হয়েছে।

## Official sources

যাচাইয়ের তারিখ: 2026-11-18।

- [GPT-6.2 Sol](https://developers.openai.com/api/docs/models/gpt-6.2-sol)
- [GPT-6.2 Astra](https://developers.openai.com/api/docs/models/gpt-6.2-astra)
- [Codex pricing ও speed multipliers](https://learn.chatgpt.com/docs/pricing)
- [Gemini 4 Hydrogen](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini/4-hydrogen)
- [Gemini 4 Carbon](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini/4-carbon)
- [Gemini 4 Argon](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini/4-argon)
- [Antigravity model slugs](https://antigravity.google/docs/cli/headless/)
- [Antigravity changelog](https://antigravity.google/docs/changelog)

Private resource/API receipts ও read-only metadata snapshot:
`/Volumes/NexaWork/Work/omniroute-models-2026-11-18`।
