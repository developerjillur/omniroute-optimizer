> **ঐতিহাসিক নথি — public copy, ২০২৬-১০-১৭।** মূল ঘটনার তারিখ ও ফল এই নথির নিজস্ব সময়ের জন্য প্রযোজ্য; পরের সংযোজন থাকতে পারে। বর্তমান অবস্থা ও কাজের নিয়মের জন্য [বর্তমান handoff](../CURRENT-STATUS-2026-10-17.md) পড়ুন। Private reference ও identifier সরানো হয়েছে; স্থানীয় evidence এখানে অন্তর্ভুক্ত নেই। পুরোনো cleanup, build, deploy বা service command বর্তমান অনুমতি হিসেবে ব্যবহার করবেন না।

# OmniRoute native `/compact` ব্যর্থতা — ২০২৬-১০-১১

রিপোর্ট: Jillur Rahman। সময়: Asia/Dhaka। এই নথির প্রতিটি পরবর্তী ফল শেষে যোগ হবে; আগের লেখা রাখা হবে।

## তদন্তে নিশ্চিত হওয়া ঘটনা

স্ক্রিনশটের `Error during compaction: API Error: 500 fetch failed` client transcript-এ পাওয়া গেছে। Claude Desktop-এর সংশ্লিষ্ট session-এর `/compact` শুরু `2026-10-11T05:14:56.436Z` এবং ব্যর্থতার রেকর্ড `2026-10-11T06:17:53.060Z`। Dhaka সময় ১১:১৪:৫৬ থেকে ১২:১৭:৫৩; ব্যবধান **৬২ মিনিট ৫৬.৬২৪ সেকেন্ড**।

সংশ্লিষ্ট retained gateway session-এ ৩০টি ব্যর্থ request আছে: **২০টি schema-সংক্রান্ত 502 এবং ১০টি aborted 499**। নির্বাচিত request-এর recorded body প্রায় ১.৪২ MB, ১,৩৬৮টি message ও ১৩৩টি tool; body সংরক্ষণের সীমার কারণে পূর্ণ conversation artifact-এ নেই। এই count-কে পূর্ণ prompt-এর token count বলা হচ্ছে না।

Upstream-এর সুনির্দিষ্ট প্রত্যাখ্যান:

```text
Invalid schema for function 'mcp__mixar__mixar_ui_act':
"^[^\\x00-\\x09\\x0b-\\x1f\\x7f\\ud800-\\udfff]*$" is not a "regex"
```

মূল MCP schema-তে `text` ও `item` field-এর regex-এ lone-surrogate range আছে। এটি ECMAScript-এ compile হয়; সংশ্লিষ্ট GPT endpoint সেটি প্রত্যাখ্যান করছে। Tool নাম, field, enum বা required argument-এর ত্রুটি পাওয়া যায়নি।

আলাদা conversation-এ `context_length_exceeded`-ও পাওয়া গেছে। `Prompt is too long` একটি বাস্তব context-limit ফল; এটিকে network failure বা Claude-এর service outage বলা যায় না। Model mapping থাকলে Claude UI-তে দেখানো model-এর পরিবর্তে নির্বাচিত target-এর সীমা প্রযোজ্য।

## `500 fetch failed` সম্পর্কে প্রমাণের সীমা

Standalone Bridge আগে স্থানীয় router-কে সাধারণ `fetch()` দিয়ে call করত। ধীর JSON response-কে একটি ছোট global headers-timeout দিয়ে পরীক্ষায় একই `500 fetch failed`-এ পরিণত করা গেছে। Incident-এর একাধিক request প্রায় ৩০১ সেকেন্ডে abort হয়েছে; চূড়ান্ত client error-এর সময়ও কয়েকটি upstream stream একসঙ্গে abort হয়েছে।

Original failure-এ underlying `.cause.code` সংরক্ষিত ছিল না। তাই সেই একবারের socket failure-এর নির্দিষ্ট transport code এখন নিশ্চিত করে বলা যায় না। Timeout handling-এর ত্রুটি পুনরুৎপাদিত; schema rejection সরাসরি upstream log-এ প্রমাণিত।

## প্রস্তুত source সংশোধন

Local commit **`e8e602568`**, branch `fix/native-compaction-2026-10-11`। পরিবর্তন শুধু `nexa/` overlay-তে; upstream base pristine। Normal commit hooks চলেছে।

1. Codex-এ পাঠানোর schema-তে পরিচিত control-character/lone-surrogate guard-এর scalar-safe projection করা হয়েছে। Control-character নিষেধ, `maxLength`, required field এবং অন্যান্য বৈধ constraint রাখা হয়েছে। Unsupported অন্য surrogate regex-এর constraint upstream projection থেকে বাদ পড়ে; native tool/schema পরিবর্তন হয় না।
2. Standalone Bridge-এর router fetch ও dispatcher একই `undici` version থেকে নেওয়া হয়েছে। Node 24-এর bundled fetch-এর সঙ্গে অন্য version-এর dispatcher মেশানোর incompatibility এড়ানো হয়েছে।
3. Buffered response-এর জন্য সর্বোচ্চ ৯ মিনিটের bounded deadline আছে; streaming request-এ ওই মোট সময়সীমা চাপানো হয়নি। Timeout হলে সংশ্লিষ্ট router request cancel হয় এবং `504` / `agent_bridge_timeout` ফেরে। Local-router transport failure আলাদা `502` হয়। অসম্পূর্ণ response-এর শেষে অন্য JSON জুড়ে success দেখানো হয় না।

Unsupported schema upstream-এ error হতে পারে—এটি Structured Outputs-এর documented সীমাও। এখানে নির্দিষ্ট regex-এর প্রত্যাখ্যানের মূল প্রমাণ আমাদের retained upstream log। [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)

## এখন পর্যন্ত যাচাই

| পরীক্ষা | ফল |
| --- | --- |
| সংশোধনের আগের regression | ধীর JSON-এ 500 এবং surrogate schema-র ভুল forwarding পুনরুৎপাদিত |
| সংশোধনের পর focused/related suite | ১১৩ PASS, ০ FAIL |
| Core typecheck | PASS |
| Actual installed CLI 2.1.296, isolated synthetic `/compact` | Summary ও compact boundary পাওয়া গেছে; live provider call ০ |
| Desktop-এর actual bundled CLI 2.1.295, isolated synthetic `/compact` | Seed ও compact সফল; compact boundary ১; live provider call ০ |
| Full ratchet, নতুন production package ও deployment | এখনও বাকি |
| নতুন package দিয়ে live GPT `/compact` | এখনও বাকি |

এখনও production SHA **`7dd92427f`**। Source commit-কে deployment বা native GUI-তে পুরোনো বড় conversation recovery-এর প্রমাণ বলা হচ্ছে না।

Evidence directory:

`~/Library/Caches/NexaLance/omniroute-native-compaction-2026-10-11`

এতে incident metadata, regression logs, bounded-run receipts, source restoration inventory ও client fixture receipts আছে। Credential value, private verification URL এবং পূর্ণ ব্যক্তিগত conversation এই রিপোর্টে প্রকাশ করা হয়নি।

## পরবর্তী ধাপ

Full build-এর জন্য ৮ GiB job cap-এর বাইরে ১০ GiB reserve রাখা হবে। বর্তমান প্রায় ১২.৩ GiB physical headroom-এ এটি শুরু করা হয়নি। Chrome, Mixar ও Claude স্বাভাবিকভাবে quit করার অনুমতি চাওয়া হয়েছে; কোনো unsaved কাজ discard করা হবে না।

Admission হলে full ratchet, release build, strict package gate, isolated install/inference smoke, data snapshot ও rollback preservation-এর পরে promotion হবে। এরপর exact runtime SHA, trusted native TLS, retained mappings/accounts/API keys এবং bounded real client `/compact` পরীক্ষা হবে। OmniRoute compression, provider account state বা নির্বাচিত reasoning effort বদলে success বানানো হবে না।




## প্রস্তুতির পরবর্তী যাচাই — ২০২৬-১০-১১

VS Code extension-এর actual bundled Claude Code `2.1.296` দিয়ে পৃথক synthetic `/compact` পরীক্ষা PASS: seed, compact ও compact boundary ১। Provider call ০; peak owned RSS ২০৮ MiB। Desktop-এর `2.1.295` ও VS Code-এর `2.1.296` client coverage আছে; এগুলো live production GPT compaction-এর প্রমাণ নয়।

আগের `7dd92427f`-এর successful `.build` ও `dist` internal disk-এর protected release directory-তে atomic rename করে রাখা হয়েছে। ৪০,৪৮১ ও ১৯,৭২২টি entry-র inode/mode/link/size এবং সব regular file-এর SHA-256 আগের inventory-র সঙ্গে মিলেছে। কোনো পুরোনো successful output মুছিনি। Receipt: `prior-output-preservation-receipt.json`।

শেষ resource পরীক্ষায় physical headroom প্রায় ১১.১ GiB, pressure normal, internal free প্রায় ২২.০ GiB। Mixar-এর background `render_mixar_d2.py` সক্রিয়; process-টি heavy CPU ব্যবহার করছে। Build/ratchet/deploy watchdog এখন Blender-এর পাশাপাশি এই Mixar background render-ও শনাক্ত করে। বর্তমান render শেষ না হওয়া পর্যন্ত heavy pipeline শুরু হবে না। Apps স্বাভাবিকভাবে quit করার প্রশ্নের উত্তর এখনও পাওয়া যায়নি; কোনো app বা render বন্ধ করা হয়নি।

Local source commit `e8e602568` clean ও pristine। Full ratchet, নতুন release build, isolated install/deployment এবং live native `/compact` বাকি। Production এখনও `7dd92427f`; source প্রস্তুত থাকা মানেই deployment নয়।


## Build, deployment ও live compaction সম্পন্ন — 2026-10-11T15:17:31+06:00

এই অংশ সর্বশেষ অবস্থা। আগের অংশে source প্রস্তুত, অনুমতি অপেক্ষা বা build/deploy বাকি বলা আছে; সেগুলো ঐ সময়ের রেকর্ড। **Production এখন `e26be697f`**; deployment ও নিচের bounded live QA সম্পন্ন হয়েছে।

### Source ও production package

Final commit **`e26be697ffa2f4ffdfe548ff582b2a060da1712a`**। Main `nexalance` ও পরীক্ষিত child worktree একই commit-এ clean, upstream pristine। আগের production `7dd92427f` থেকে পরিবর্তন শুধু ৮টি `nexa/` file। Application fix `e8e602568`-এ; শেষ commit-এ শুধু দুটো বিদ্যমান test fixture-এর typing ঠিক করা হয়েছে। Jillur Rahman author/committer; normal hooks PASS।

Full production pipeline exit **0**: ৬২০ static page, dashboard gate, CLI generation, artifact validation, `npm pack`, strict Bridge gate এবং compaction-specific package gate PASS। Packaged `src` ও `dist`-এ নতুন helper/server একই hash; validated source-এর সঙ্গে packaged schema-ও মিলে গেছে। Successful package তৈরি হওয়ার পরে build বা pack আবার চালানো হয়নি।

Artifact: `~/.omniroute-builds/3.8.51-e26be697f/omniroute-3.8.51.tgz`

Size: **99,597,882 bytes**। Archive `dist/BUILD_SHA`: `e26be697f`। SHA-256:

```text
2b47157186432557b47dade4157b8e9f7b289be0fb529554c9e9a31236e5e3f8
```

### Validation-এর চূড়ান্ত ফল ও আগের ব্যর্থতা

Focused/related regression **১১৩ PASS, ০ FAIL**; core typecheck PASS। Existing native fixture-এর typing সংশোধনের পরে সংশ্লিষ্ট **২৭ PASS**; এর কয়েকটি ১১৩টির মধ্যে আছে, তাই এগুলোকে যোগ করে distinct test total বলা হচ্ছে না। Slow JSON timeout, streaming cancellation/concurrency, Unicode pattern projection, native context-overflow এবং suggestion/empty-response paths covered।

Full ratchet-এর প্রথম ৪ GiB heap attempt-এ compiler `SIGABRT`; gate exit 75, count মাপা যায়নি। ৫ GiB heap-এ আগের measured count ছিল ৫৮৫৪; একই environment-এ আগের `7dd92427f` base-ও ৫৮৫৪ পেয়েছে। নতুন runtime fix file-এ diagnostic পাওয়া যায়নি। Existing test helper-এ বাদ থাকা explicit option এবং `Response` union narrowing ঠিক করে final result **৫৮২৬ ≤ অপরিবর্তিত ৫৮৩০ baseline: PASS**। Baseline বাড়ানো, `any` cast বা suppression দিয়ে pass করানো হয়নি। Core typecheck PASS হলেও পূর্ণ repository-কে zero TypeScript diagnostic বলা হচ্ছে না। Fail/pass evidence রাখা আছে।

### Actual deployment

Main-এর বর্তমান `nexa/deploy/omni-updater.sh redeploy`-এ `NEXA_DEPLOY_ARTIFACT` দিয়ে উপরের exact package ব্যবহার হয়েছে; desktop build/deploy flags 0। Isolated install, real Anthropic-protocol request routed to `codex/gpt-6.1-sol`, consistent database snapshot, complete previous runtime preservation, promotion, runtime SHA, health, native Bridge/backend TLS ও DNS gate PASS। Updater exit **0**; completion **2026-10-11T15:08:28+06:00**।

আগের runtime-এর সম্পূর্ণ directory atomic rename করে রাখা হয়েছে:

`~/.omniroute-builds/runtime-backups/20261011-145841`

আগের root inode/device, **১১৬,৭১৪ file / ১২,৯৭৭ directory / ৪৯ symlink**, regular-file size **2,155,566,514 bytes** এবং critical source hashes মিলেছে। পূর্বের successful package SHA ও rollback pointer-ও মিলে গেছে। নতুন runtime-এর ৫টি critical source/dist hash verified package-এর সঙ্গে মিলে গেছে।

SQLite consistent snapshot: `~/.omniroute-local/update-backups/20261011-145841/storage.sqlite`। Integrity `ok`, mode `0600`, provider/API-key ID sets মেলে; snapshot usage count **94218**। Live data-কে isolated test data দিয়ে replace করা হয়নি।

### Live native TLS ও real client `/compact`

আগের upstream-rejected **exact Mixar surrogate regex**-সহ এক real Anthropic TLS request `api.anthropic.com` native Bridge ingress দিয়ে পাঠানো হয়েছে। Trusted TLS, HTTP **200**, exact output marker PASS। Trace: actual provider **`codex`**, model **`gpt-6.1-sol`**, source format `claude`, target format `openai-responses`, requested/upstream effort **`low` → `low`**। Tool schema পাঠানো হয়েছে; actual Mixar UI operation চালানো হয়নি।

এরপর actual installed client binaries দিয়ে দুটি পৃথক isolated session-এ seed → `/compact` → resume পরীক্ষা হয়েছে। Official app/config পরিবর্তন হয়নি; বিদ্যমান native TLS route ব্যবহৃত হয়েছে।

| Client | Version | `/compact` সময় | ফল |
| --- | --- | ---: | --- |
| VS Code extension / installed CLI-এর একই binary | `2.1.296` | 21.999 সেকেন্ড | Seed, `/compact`, resume: ৩/৩ HTTP 200; boundary ১; আগের marker অক্ষত |
| Claude Desktop-এর actual bundled CLI engine | `2.1.295` | 21.886 সেকেন্ড | Seed, `/compact`, resume: ৩/৩ HTTP 200; boundary ১; আগের marker অক্ষত |

দুই session-এই summary-তে marker ছিল এবং compaction-এর পরে সেটি হুবহু ফেরত এসেছে। মোট ৬টি client request-এর trace provider/model/status/effort ও saved artifact checksum মিলেছে। সবগুলো **`codex/gpt-6.1-sol`**, HTTP **200**, `low` → `low`। Installed standalone CLI ও VS Code extension binary-এর SHA-256 একই, তাই একই binary-তে আরেকবার duplicate inference চালানো হয়নি। Desktop-এর `2.1.295` binary আলাদা এবং সেটি পৃথকভাবে পরীক্ষা করা হয়েছে।

### Retained data ও operator state

Pre/post deployment inventory-তে **25 provider connection, 3 API key এবং 14 Bridge mapping**-এর ID/content/operator-active-state hashes অপরিবর্তিত। API-key values-এর hash-ও মেলে; values প্রকাশ করা হয়নি। CA certificate/private key, runtime intent, targets ও bypass config মেলে। কোনো account enable, forced verification clearing, model mapping বা effort setting write করা হয়নি।

Usage history **94218 → 94225**; আগের usage retained। Live native TLS schema probe ১ + actual client probes ৬ = ৭টি bounded inference। Isolated deployment smoke আলাদা copy-তে হয়েছে। Loopback ও `omni.local/healthz` দুটোই **200**।

### Resource ও সংরক্ষণ

অনুমোদিত Chrome, Mixar ও Claude স্বাভাবিকভাবে quit করা হয়েছে। Mixar-এর unsaved scene save করা হয়েছে; project output বা saved conversation history মুছিনি। Normal quit-এর পরে background render অনুপস্থিত ছিল—এটি successful render completion-এর দাবি নয়। অন্য নতুন করে চলা apps/tasks বন্ধ করিনি।

Build: ৮ GiB RSS cap; measured total peak **7709 MiB**, minimum physical headroom **15.915 GiB**। Deploy: ৩ GiB RSS cap; peak **1376 MiB**, minimum headroom **17.456 GiB**। Pressure normal, swap বৃদ্ধি ০, render overlap ছিল না। Actual client probes peak সর্বোচ্চ **267 MiB**, minimum physical headroom **19.426 GiB**।

Deploy snapshot/install-এর পরে live QA reserve ফেরাতে শুধু এই কাজের completed isolated smoke data copy-র ৮টি file নতুন T7 archive-এ রাখা হয়েছে; প্রতিটি payload size/SHA-256 এবং source identity মিলিয়ে তারপর internal duplicate সরানো হয়েছে। ExFAT-এর স্বয়ংক্রিয় AppleDouble metadata-ও archive-এ রাখা আছে; প্রথম exact-inventory check সেগুলো পেয়ে থেমেছিল, কোনো original তখন সরানো হয়নি। Live DB, consistent snapshot, source, release `.tgz`, successful `.build/dist` ও rollback আলাদা protected paths এবং অক্ষত।

Archive: `<local-setup>/archives/native-compaction-e26be697f-20261011/smoke-data`। Payload **1,665,390,826 bytes**; measured internal free increase **1.552 GiB**। Final resource snapshot: pressure normal, physical headroom **19.497 GiB**, internal free **20.047 GiB**, T7 mounted।

### কী নিশ্চিত, কী এখনও প্রমাণ করা হয়নি

সরাসরি log-এ পাওয়া invalid Mixar schema এবং reproduce করা Bridge timeout/dispatcher সমস্যার source fix এখন production-এ, এবং exact problematic schema ও real native client compaction/resume নতুন runtime-এ সফল। Original generic `500 fetch failed`-এ underlying cause code ছিল না; তাই সেই socket failure-এর নির্দিষ্ট code নিশ্চিত বলা হচ্ছে না।

পুরোনো প্রায় ২৪৩ MB ব্যক্তিগত conversation এবং iPhone remote-control UI হুবহু replay করা হয়নি; Claude Desktop GUI-তে সেই পুরোনো chat-এর recovery প্রমাণিত নয়। Actual Desktop bundled engine-এর live compaction প্রমাণিত। Model-এর প্রকৃত context limit বা future upstream outage দূর হওয়ার নিশ্চয়তা এই fix দেয় না। সত্যিকারের oversized prompt এখনও `Prompt is too long` পেতে পারে; সেটি transport timeout-এর আলাদা ঘটনা। Native `/compact` পরীক্ষার জন্য অতিরিক্ত OmniRoute compression চালু করা হয়নি।

Evidence: `~/Library/Caches/NexaLance/omniroute-native-compaction-2026-10-11`। মূল completion receipts: `postdeploy-integrity-receipt.json`, `postdeploy-native-tls-2026-10-11T09-13-55.597Z/summary.json`, দুই `real-cli-live-compact-*/receipt.json` ও `trace-verification.json`, `smoke-data-archive-receipt.json`; release directory-তে `full-build-receipt.json`, `compaction-package-receipt.json`, `deploy-result-2026-10-11T08-58-41.503Z.json`।


## সব বর্তমান `nexa/` fixes GitHub-এ সংরক্ষিত — 2026-10-11T15:30:04+06:00

Private repository [developerjillur/omniroute-optimizer](https://github.com/developerjillur/omniroute-optimizer)-এর `main` branch-এ commit [`092dd30`](https://github.com/developerjillur/omniroute-optimizer/commit/092dd30e2e7cc93a1be5f530eb1820ea38e1eeba) push এবং remote verification সম্পন্ন হয়েছে। Source snapshot `e26be697ffa2f4ffdfe548ff582b2a060da1712a`।

বর্তমান সব **৩০২টি tracked overlay file** byte/mode/blob hash অনুযায়ী সংরক্ষিত; manifest-এর **২৩০ entry = ১৪৪ patch + ৮১ new file + ৫ tooling**। GPT selected effort, buffered context-overflow/empty-response classification, native tool Unicode schema projection, Bridge `/compact` timeout/transport এবং selected-provider deployment smoke-এর সাম্প্রতিক fixes ও regression tests অন্তর্ভুক্ত আছে। আগের published snapshot থেকে ১০টি নতুন ও ৮টি সংশোধিত overlay file; README, NOTICE ও পূর্ণ inventory-ও আপডেট হয়েছে।

Remote-এর সব **৩০৭টি blob**-এর mode, size ও Git hash local publication commit-এর সঙ্গে মিলে গেছে। Remote `nexa/` tree এবং original source `nexa/` tree একই: `3a35a49b401a850930b1ab3daf711cce7b81a918`। সব ১৪৪টি patch cleanভাবে apply হয়; original source ও publication checkout clean। Export এবং পুরো ৩-commit publication history-র Gitleaks scan: no leaks found। Commit author/committer Jillur Rahman।

প্রকাশিত scope: source/test/deployment overlay এবং documentation/license/inventory metadata। Credential values, database, runtime, local request logs বা build archives export-এর অংশ নয়। Production build/deploy/live QA-এর ফল উপরের completion section-এ আছে; প্রকাশিত README-তেও evidence ও তার সীমা উল্লেখ আছে।

Publication evidence: `~/Library/Caches/NexaLance/omniroute-optimizer-publication-2026-10-11/remote-verification.json`, `export-verification.json`, `staged-verification.json`, `gitleaks-export.json`, `gitleaks-history.json`।
