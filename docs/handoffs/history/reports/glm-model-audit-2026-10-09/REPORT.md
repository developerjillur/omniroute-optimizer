> **ঐতিহাসিক নথি — public copy, ২০২৬-১০-১৭।** মূল ঘটনার তারিখ ও ফল এই নথির নিজস্ব সময়ের জন্য প্রযোজ্য; পরের সংযোজন থাকতে পারে। বর্তমান অবস্থা ও কাজের নিয়মের জন্য [বর্তমান handoff](../../../CURRENT-STATUS-2026-10-17.md) পড়ুন। Private reference ও identifier সরানো হয়েছে; স্থানীয় evidence এখানে অন্তর্ভুক্ত নেই। পুরোনো cleanup, build, deploy বা service command বর্তমান অনুমতি হিসেবে ব্যবহার করবেন না।

**OmniRoute GLM model ও max-thinking live audit — ২০২৬-১০-০৯**

প্রস্তুতকারক: Jillur Rahman

পরীক্ষার সময়: 2026-10-09 14:33:58–2026-10-09 14:49:37, Asia/Dhaka। Runtime `OmniRoute 3.8.51`, SHA `a535572e5`।

**ফলাফল**

আপনার তিনটি provider-এর live catalog-এ থাকা **৫৬টি model/effort route-ই অন্তত একবার সঠিক final answer দিয়েছে**। এর মধ্যে **GLM 5.3 Max ও GLM 5.3 Flash Max-এর ছয়টি route-ই** non-streaming answer, streaming answer, tool call → tool result → final answer এবং exact connection/`max` effort পরীক্ষায় পাস করেছে।

এটি ৫৬টি পৃথক foundation model-এর দাবি নয়। একই model-এর provider route ও `low`/`high`/`max` alias আলাদা entry হিসেবে গণনা হয়েছে। ফল এই সময়ের নির্দিষ্ট ছোট live test-এর; long-session coding quality, দীর্ঘ context, image/video বা সর্বক্ষণ availability-এর benchmark করা হয়নি।

| Provider page | Active connection tag | Catalog route | Final-answer PASS |
| --- | --- | ---: | ---: |
| [GLM Coding](http://omni.local/dashboard/providers/glm) | `private-id-030` | 21 | 21 |
| [GLM Thinking](http://omni.local/dashboard/providers/glmt) | `private-id-031` | 21 | 21 |
| [Z.AI](http://omni.local/dashboard/providers/zai) | `private-id-032` | 14 | 14 |

`glmt`-এর অর্থ এই UI-তে **GLM Thinking**। এটি আলাদা “Team” provider নয়। GLM Coding ও GLM Thinking registry একই Coding Plan endpoint/executor ব্যবহার করে; তাদের connection ও request defaults আলাদা। নামের কারণে Thinking route-এর max-কে আরেকটি উঁচু model tier ধরে নেওয়ার প্রমাণ নেই।

Z.AI dashboard-এ ৮টি base model দেখা যায়; authenticated `/v1/models`-এ আরও ৬টি `5.3` effort alias যোগ হয়ে ১৪টি route পাওয়া গেছে। তিনটি provider-এর মিলিত catalog: ২১ + ২১ + ১৪ = ৫৬।

**আপনার চাওয়া GLM 5.3 max-thinking route-গুলো**

| Exact route ID | Final answer | Streaming + max trace | Tool round-trip + max trace | Connection |
| --- | --- | --- | --- | --- |
| `glm/glm-5.3-flash-max` | PASS, 3.63s | PASS, 3.51s | PASS, 11.50s | `private-id-030` |
| `glm/glm-5.3-max` | PASS, 44.17s | PASS, 5.24s | PASS, 12.19s | `private-id-030` |
| `glmt/glm-5.3-flash-max` | PASS, 5.88s | PASS, 2.33s | PASS, 11.33s | `private-id-031` |
| `glmt/glm-5.3-max` | PASS, 1.78s | PASS, 3.05s | PASS, 15.91s | `private-id-031` |
| `zai/glm-5.3-flash-max` | PASS, 3.59s | PASS, 3.69s | PASS, 11.08s | `private-id-032` |
| `zai/glm-5.3-max` | PASS, 2.31s | PASS, 2.28s | PASS, 11.18s | `private-id-032` |

প্রতিটি route-এ requested connection এবং actual selected connection মিলেছে। Streaming-এর নির্বাচিত connection response header-এ আসেনি; একই `x-correlation-id`-এর persisted `call_logs` record দিয়ে সেটি যাচাই করা হয়েছে। ছয়টি streaming trace-এ `cache_source=upstream`, সঠিক final content, reasoning token এবং `reasoning_effort_requested=max`/`reasoning_effort_upstream=max` পাওয়া গেছে।

Z.AI-এর max alias-গুলো log-এ যথাক্রমে `zai/glm-5.3` ও `zai/glm-5.3-flash` হয়ে normalize হয়, সঙ্গে `reasoning_effort=max` থাকে। Source-এর `applyClaudeEffortVariant()` এই alias-to-base পরিবর্তন করে; তাই suffix হারানোকে model fallback বা max হারিয়ে যাওয়া বলা হয়নি। GLM/GLM Thinking log client alias ধরে রাখে এবং executor upstream-এ base ID পাঠায়।

Latency table-এ একই ছোট final-answer/stream/tool test-এর wall-clock সময় আছে। Tool round-trip সময় দুই request-এর যোগফল। শুধু এই নমুনা দিয়ে quality, স্থায়ী speed ranking বা খরচের শ্রেষ্ঠত্ব নির্ধারণ করা যায় না। GLM Coding Max-এর প্রথম সফল pilot-এ 44.17s লেগেছিল; সেটি পুনরায় খরচ না করে final-answer evidence হিসেবে রাখা হয়েছে।

**Max effort বেছে নেওয়া এবং thinking-এর প্রকৃত আচরণ**

GLM 5.3-এ vendor-documented effort হলো `low`, `high`, `max`; thinking সবসময় enabled এবং vendor default `max`। [Z.AI GLM 5.3 guide](https://docs.z.ai/guides/llm/glm-5.3)। GLM 5.3 Flash-ও `max` effort সমর্থন করে। [Z.AI GLM 5.3 Flash guide](https://docs.z.ai/guides/vlm/glm-5.3-flash)।

আপনার বর্তমান OmniRoute source-এ Z.AI base route-এ effort অনুল্লিখিত থাকলে `low` প্রয়োগ করার logic আছে। তাই শুধু `zai/glm-5.3` select করাকে max-thinking-এর প্রমাণ ধরে নেওয়া ঠিক হবে না। Max চাইলে উপরের exact `-max` alias ব্যবহার করুন, অথবা base route-এর সঙ্গে explicit `reasoning_effort: "max"` দিন। এই audit-এ দুই পথের explicit max alias/parameter ও actual upstream effort মিলেছে।

OpenAI-compatible client-এর জন্য উদাহরণ:

```json
{
  "model": "glm/glm-5.3-max",
  "messages": [{"role": "user", "content": "আপনার কাজের নির্দেশনা"}],
  "reasoning_effort": "max",
  "thinking": {"type": "enabled"},
  "max_tokens": 4096,
  "stream": true
}
```

`max_tokens` reasoning ও final answer-এর যৌথ output cap; এটি আগেই পুরো token খরচ করে দেয় না। কাজ বড় হলে প্রয়োজন অনুযায়ী cap বাড়তে পারে। এই উদাহরণের 4096 একটি সীমার উদাহরণ, সব কাজের universal budget নয়। `max`-কে thinking off করার setting হিসেবে ব্যবহার করা যাবে না। [Z.AI Chat Completion parameters](https://docs.z.ai/api-reference/llm/chat-completion)।

**সব advertised model/alias-এর পূর্ণ ফল**

প্রতিটি cell-এ ওই provider-এর exact prefix-সহ route পরীক্ষা হয়েছে। যেমন `glm-5.3-max` সারির GLM Thinking cell = `glmt/glm-5.3-max`। সময় সর্বশেষ সফল final-answer test-এর; যেখানে follow-up দরকার হয়েছে, সেটির সময় ব্যবহৃত। `—` মানে ওই provider-এর catalog-এ নেই এবং পরীক্ষা করা হয়নি।

| Model/alias leaf | GLM Coding `glm/` | GLM Thinking `glmt/` | Z.AI `zai/` |
| --- | --- | --- | --- |
| `glm-5.3` | PASS · 3.89s | PASS · 7.84s | PASS · 6.34s |
| `glm-5.3-low` | PASS · 5.50s | PASS · 11.40s | PASS · 6.91s |
| `glm-5.3-high` | PASS · 7.51s | PASS · 3.39s | PASS · 7.79s |
| `glm-5.3-max` | PASS · 44.17s | PASS · 1.78s | PASS · 2.31s |
| `glm-5.3-flash` | PASS · 3.82s | PASS · 2.28s | PASS · 4.14s |
| `glm-5.3-flash-low` | PASS · 4.79s | PASS · 1.97s | PASS · 2.04s |
| `glm-5.3-flash-high` | PASS · 2.24s | PASS · 4.00s | PASS · 2.53s |
| `glm-5.3-flash-max` | PASS · 3.63s | PASS · 5.88s | PASS · 3.59s |
| `glm-5.2` | PASS · 9.15s | PASS · 13.49s | PASS · 2.25s |
| `glm-5.2-high` | PASS · 2.83s | PASS · 26.96s | — |
| `glm-5.2-max` | PASS · 2.19s | PASS · 2.75s | — |
| `glm-5.1` | PASS · 6.00s | PASS · 3.48s | PASS · 10.50s |
| `glm-5` | PASS · 11.45s | PASS · 10.57s | PASS · 5.80s |
| `glm-5-turbo` | PASS · 14.35s | PASS · 1.78s | PASS · 3.92s |
| `glm-4.7` | PASS · 2.08s | PASS · 14.14s | PASS · 1.98s |
| `glm-4.7-flash` | PASS · 13.72s | PASS · 7.60s | PASS · 20.69s |
| `glm-4.6` | PASS · 5.70s | PASS · 2.92s | — |
| `glm-4.6v` | PASS · 2.38s | PASS · 3.46s | — |
| `glm-4.5` | PASS · 6.44s | PASS · 6.03s | — |
| `glm-4.5v` | PASS · 6.24s | PASS · 4.00s | — |
| `glm-4.5-air` | PASS · 4.00s | PASS · 4.43s | — |

`glm-5.3-flashx` এই তিন provider-এর live catalog-এ পাওয়া যায়নি; তাই এটিকে available বা tested বলা হচ্ছে না। `glm-4.5v`/`glm-4.6v`-এ এখানে text completion পরীক্ষা হয়েছে; image-input compatibility পরীক্ষা হয়নি।

**যে সমস্যা ও পার্থক্য পাওয়া গেছে**

১. **Dashboard test-এর `ok` final answer-এর প্রমাণ নয়।** `/api/models/test` দিয়ে `glm/glm-5.3-max`-এর প্রথম probe HTTP 200 ও status `ok` দেয়, কিন্তু exact log-এ `has_content=0`, output 64 এবং reasoning 64 ছিল। Source-এর streaming model test cap 64 token। অর্থাৎ শুধু reasoning বেরিয়ে budget শেষ হলেও UI success বলতে পারে। বড় bounded direct test-এ একই route final answer দিয়েছে। Dashboard health gate-এ reasoning-only output-কে success না ধরা এবং finish reason/final content যাচাই করা প্রয়োজন। এই audit-এ source পরিবর্তন করা হয়নি।

২. **ছোট output cap-এর কারণে সাতটি test শেষ হয়নি।** প্রথম ধাপে 512 token-এ `finish_reason=length` পাওয়া যায় `glmt/glm-5.3-max`, `zai/glm-5.3-flash-max`, `glmt/glm-5.3-flash`, `glmt/glm-5.3-high`, `glm/glm-4.7`, `glm/glm-5.2`, `glmt/glm-4.6`-এ। এগুলোকে unsupported বলা হয়নি। Neutral arithmetic prompt ও 2048-token cap-এ সঠিক final answer এসেছে। Reasoning budget ও উত্তর একই cap ভাগ করে।

৩. **প্রথম marker prompt-এর সীমাবদ্ধতা ছিল।** `zai/glm-5.3-max` ও `glmt/glm-5-turbo` test prompt-এর “audit”/confirmation marker-কে substantive audit হিসেবে নিয়েছে এবং চাওয়া exact marker দেয়নি। সাধারণ গণনার follow-up পাস করেছে। এই দুই ফল account বা model availability failure নয়। প্রথম evidence সংরক্ষিত আছে।

৪. **`glm-4.7-flash`-এ temporary instability দেখা গেছে।** GLM Coding ও GLM Thinking প্রথমে HTTP 429 দেয়; Z.AI প্রথমে HTTP 529/`1305` দেয়। Error text: `The service may be temporarily overloaded, please try again later`। GLM Thinking ও Z.AI একটি follow-up-এ সেরে ওঠে। GLM Coding follow-up-এ আবার 429 দেয়; অন্য পরীক্ষা শেষে শেষ exact-connection test-এ PASS করে। কোনো cooldown/verification/quota state clear করা হয়নি। সব route এখন এই নমুনায় চলেছে, কিন্তু আগের error-গুলো মুছে স্থায়ী reliability দাবি করা হচ্ছে না। Actual overload বনাম অন্য vendor-side constraint নির্দিষ্ট করার মতো provider-side evidence নেই।

৫. **Streaming diagnostics header অসম্পূর্ণ।** ছয়টি SSE response-এই `x-omniroute-selected-connection-id`/provider metadata header পাওয়া যায়নি; `x-correlation-id` ছিল। Final stream content ও exact connection/effort persisted trace-এ পাস করেছে। Client header-এর উপর নির্ভরশীল routing diagnostic এই কারণে অসম্পূর্ণ হতে পারে। রিপোর্টের functional PASS trace দিয়ে প্রতিষ্ঠিত; header limitation আলাদাভাবে রইল।

৬. **নাম ও log normalization বুঝে যাচাই করতে হয়।** Z.AI max alias log-এ base নাম হয়; explicit `max` trace ঠিক আছে। Catalog-এর 56 entry-কে 56 পৃথক model ভাবা বা suffix-হীন response-কে স্বয়ংক্রিয় downgrade ভাবা ঠিক হবে না।

**পদ্ধতি, token ব্যবহার ও সুরক্ষা**

- প্রতিটি provider-এর একটি active connection exact `x-omniroute-connection` দিয়ে pin করা হয়েছে। Sibling provider বা account থেকে উত্তর এনে PASS করা হয়নি।
- Authenticated `/v1/models` দিয়ে catalog নেওয়া হয়েছে; শুধু UI-listed নামের উপর নির্ভর করা হয়নি। Inference existing local API key দিয়ে হয়েছে; credential value রিপোর্টে নেই।
- Final-answer PASS: HTTP 200, exact expected output, `finish_reason=stop`, সঠিক provider/connection এবং cache HIT না হওয়া। প্রথম marker test-এর 44/56 PASS; শুধু 12 non-pass route-এ follow-up; শুধু বাকি একটি route-এ শেষ check হয়েছে।
- Max deep test: ছয়টি route-এ streamed `{"answer":323}` এবং `add_numbers(19,23)` tool call, tool result 42 ও final answer 42 পরীক্ষা হয়েছে। Model reasoning text রিপোর্টে প্রকাশ করা হয়নি।
- Remote inference sequential হয়েছে। Client-side automatic retry loop ছিল না; diagnostic follow-up আলাদা evidence হিসেবে রাখা হয়েছে। প্রথম matrix cap 512, follow-up/stream/tool-first cap সর্বোচ্চ 2048, tool-second cap 1024; complete response deadline 75s।
- এই scope OpenAI-compatible `/v1/chat/completions` API-র পরীক্ষা। Real Claude Code/native app session বা Anthropic `/v1/messages` compatibility এখানে নতুন করে পরীক্ষা করা হয়নি।
- মোট **88টি gateway inference/test request** হয়েছে: 56 route check, 12 follow-up, 1 final route check, 6 streaming, 12 tool-round-trip request এবং 1 dashboard diagnostic। 56-এর মধ্যে আগে করা একটি সফল pilot reuse হয়েছে; দ্বিগুণ গণনা করা হয়নি।
- Usage পাওয়া **84টি request**-এর যোগফল: **4,654 input + 12,914 output = 17,568 tokens**। Output-এর ভেতর reported reasoning subset **10,698**; এটিকে আবার output-এর সঙ্গে যোগ করা যাবে না। Usage না-আসা error request-এর খরচ অজানা। এটি subscription weekly percentage বা billing receipt নয়।
- Test traffic এই তিন GLM provider-এ গেছে; Claude model/account-এ test workload পাঠানো হয়নি।
- 89টি lightweight resource sample-এ pressure normal ছিল; minimum measured physical headroom 10.44 GiB, test worker peak RSS 105.27 MiB। Swap 15226.69 → 15218.69 MiB। Internal disk অল্প ফাঁকা থাকায় কোনো build/install/download/local model job চালানো হয়নি; ছোট report T7-তে রাখা হয়েছে।
- কোনো app/tab/service quit বা kill করা হয়নি। Source clean ছিল; build/deployment, provider setting, account enable/disable, auto-hide বা verification state পরিবর্তন করা হয়নি। Normal inference request/usage logs তৈরি হয়েছে।
- Provider connection tag, active flag ও priority canonical sort করে সব phase-এর আগে/পরে মিলেছে। Raw helper-এর array-order comparison কিছু phase-এ false দেখিয়েছিল; entry order বদলেছে, state বদলায়নি—verified assessment-এ এই পার্থক্য ব্যাখ্যা করা আছে।

**Evidence পড়ার ক্রম**

- audit-summary.json (স্থানীয় বা private reference; প্রকাশিত নয়): final counts, complete latest route results, max-route verdict, token/resource summary।
- verified-assessment.json (স্থানীয় বা private reference; প্রকাশিত নয়): max-route final content/connection/effort verdict এবং intentional Z.AI alias normalization।
- request-traces.json (স্থানীয় বা private reference; প্রকাশিত নয়): এই audit-এর correlation-matched trace metadata; credentials বা body নেই।
- matrix.jsonl (স্থানীয় বা private reference; প্রকাশিত নয়), followup.jsonl (স্থানীয় বা private reference; প্রকাশিত নয়), final-check.jsonl (স্থানীয় বা private reference; প্রকাশিত নয়): প্রথম result এবং recovery chronology অক্ষত।
- deep.jsonl (স্থানীয় বা private reference; প্রকাশিত নয়): stream/tool raw observations। Strict helper header না পেয়ে stream-এ `FAIL` লিখেছে; final functional verdict পেতে `verified-assessment.json` দেখুন।
- deep-assessment.json (স্থানীয় বা private reference; প্রকাশিত নয়): প্রথম strict comparison অক্ষত; Z.AI alias-to-base normalization-এর জন্য refined final assessment আলাদা রাখা হয়েছে।
- diagnostics.json (স্থানীয় বা private reference; প্রকাশিত নয়), inventory.json (স্থানীয় বা private reference; প্রকাশিত নয়), resources.jsonl (স্থানীয় বা private reference; প্রকাশিত নয়): dashboard false-positive, initial catalog, exact runtime SHA ও resource evidence।

প্রাসঙ্গিক source: modelTestRunner.ts (স্থানীয় বা private reference; প্রকাশিত নয়), GLM effort mapping (স্থানীয় বা private reference; প্রকাশিত নয়), Z.AI default effort logic (স্থানীয় বা private reference; প্রকাশিত নয়), effort alias normalization (স্থানীয় বা private reference; প্রকাশিত নয়)।
