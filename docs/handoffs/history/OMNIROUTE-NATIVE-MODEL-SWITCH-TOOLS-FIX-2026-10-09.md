> **ঐতিহাসিক নথি — public copy, ২০২৬-১০-১৭।** মূল ঘটনার তারিখ ও ফল এই নথির নিজস্ব সময়ের জন্য প্রযোজ্য; পরের সংযোজন থাকতে পারে। বর্তমান অবস্থা ও কাজের নিয়মের জন্য [বর্তমান handoff](../CURRENT-STATUS-2026-10-17.md) পড়ুন। Private reference ও identifier সরানো হয়েছে; স্থানীয় evidence এখানে অন্তর্ভুক্ত নেই। পুরোনো cleanup, build, deploy বা service command বর্তমান অনুমতি হিসেবে ব্যবহার করবেন না।

# OmniRoute native model switch ও tool continuity — ২০২৬-১০-০৯

লেখক: Jillur Rahman

## সমস্যা ও প্রমাণ

Claude native app-এ model routing চালু থাকলেও পরের turn-এ `Bash`, `Read`, `Skill` পাওয়া যাচ্ছে না। Screenshot-এর উত্তরটি retained production request/response-এর সঙ্গে মিলে গেছে; এটি শুধু model-এর কথার ওপর ভিত্তি করে করা অনুমান নয়। একই session-এর hash tag `75f2a47180d9`।

| Dhaka সময় | প্রকৃত provider/model | Thread | Tool definition | ফল |
| --- | --- | --- | ---: | --- |
| ১৬:১৪:২৬.৩২৭ | codex / gpt-6.1-sol | continue | ৭৮ | Bash ও Read call ফিরেছে |
| ১৬:১৪:৫৯.৫৫২ | codex / gpt-6.1-sol | continue | ০ | tool call নেই; tool অনুপস্থিত বলেছে |
| ১৬:১৬:২৫.৮৭৪ | codex / gpt-6.1-sol | continue | ০ | Screenshot-এর উত্তর হুবহু মিলে গেছে |

নতুন native Claude clients server-side message Threads ব্যবহার করে। `thread: continue` request-এ আগের system ও tools আবার নাও পাঠাতে পারে; Anthropic server-এর কাছে সেগুলো থাকার কথা। OmniRoute ওই sparse continuation অন্য provider-এ পাঠাচ্ছিল। GPT বা GLM-এর কাছে Anthropic-এর আগের Thread state নেই, ফলে tool definition-ও অনুপস্থিত হচ্ছিল।

পুরোনো replay guard কেবল Claude provider-এর জন্য চলত। তার 404 response-এ native client-এর প্রয়োজনীয় machine-readable `error.details.error_code: thread_not_found`-ও ছিল না। Installed CLI 2.1.294 এবং app-এর bundled engine 2.1.293-এর replay parser পড়েও এই শর্ত যাচাই হয়েছে; official app/config edit করা হয়নি।

## Source fix

Local commit: `770a768b1` — `fix: replay native Claude threads after provider switches`। আলাদা worktree/branch-এ কাজ হয়েছে; permanent পরিবর্তন কেবল `nexa/` overlay-এ। Normal commit hooks পাস করেছে; author ও committer Jillur Rahman।

- Native sparse continuation অন্য provider-এ এলে upstream inference-এর আগেই পরিচিত `thread_not_found` 404 দেওয়া হয়।
- Native client নিজেই পূর্ণ transcript, system এবং tools দিয়ে `thread: create` replay করে।
- Claude-এর valid Thread-owner affinity, paused/exhausted account এবং API-key allowlist checks বজায় থাকে।
- Tools বানিয়ে যোগ করা হয়নি। Official client/config, provider mapping, compression ও account enable/disable state বদলানো হয়নি।

GPT/GLM route-এ এই স্থানীয় replay প্রয়োজন হতে পারে প্রতি sparse continuation-এ। স্থানীয় refusal কোনো upstream model inference করে না। Replay-এ যথাযথ পূর্ণ context পাঠানো প্রয়োজন; এটিকে token savings-এর দাবি হিসেবে ধরা যাবে না।

## সম্পন্ন validation

| পরীক্ষা | ফল |
| --- | --- |
| নতুন regression, পুরোনো source | প্রত্যাশিত FAIL: sparse provider switch ও replay code অনুপস্থিত |
| নতুন regression, fix source | ৬/৬ PASS |
| Native Claude regression group | ৮২/৮২ PASS |
| Tool translation ও related regression | ১৪২/১৪২ PASS |
| Core TypeScript | PASS |
| MCP suite, native fidelity env | ৪৯৩/৪৯৩ PASS; ৫৪টি file |
| বাস্তব installed CLI, স্থানীয় offline replay fixture | PASS; দুইবার sparse→full replay; বাস্তব Read ও Bash execution |

এই সংখ্যাগুলোর মধ্যে overlap আছে; এগুলো যোগ করে মোট unique test count বানানো হয়নি। MCP-এর প্রথম run-এ description compression default-এর কারণে একটি existing fidelity assertion ব্যর্থ হয়েছিল। Production fidelity-এর `OMNIROUTE_MCP_COMPRESS_DESCRIPTIONS=0` দিয়ে ৪৯৩টি পাস হয়েছে; assertion বা product code বদলে ব্যর্থতা আড়াল করা হয়নি।

Offline fixture-এ live provider response ব্যবহার করা হয়নি; actual CLI executable ও local router guard ব্যবহার হয়েছে। প্রথম fixture-এর malformed SSE tool-input shape ঠিক করে পুনরায় পরীক্ষা করা হয়েছে। ব্যর্থ fixture-এর evidence রাখা আছে; কোনো upstream inference হয়নি। সফল v2-তে request cap যুক্ত আছে।

## Build ও live acceptance অবস্থা

এই অংশ লেখার সময়ে source fix প্রস্তুত, full TypeScript gate চলছে। নতুন production artifact তৈরি বা deploy এখনও হয়নি; live SHA `a535572e5`। পূর্ণ gate, artifact hash, promotion এবং বাস্তব native app acceptance-এর ফল নিচে append করা হবে।

Full compiler ছোট heap-এ ৩বার SIGABRT হয়েছে (১.৫/৩/৪ GiB heap); কোনোটি PASS ধরা হয়নি। প্রতিবার source pristine-এ ফিরেছে। এখন আগের সফল compiler heap ব্যবহার হচ্ছে, process cap ও system admission বজায় রেখে।

Deployment-পূর্ব read-only inventory: ২৫ provider connection, ৩ API key, ১৩ Agent Bridge mapping; usage rows ৭১,৫৭৪। ID-set, operator-state, mapping ও settings-এর hash private evidence-এ আছে। Token, credential value, account identity ও private verification URL রিপোর্টে নেই।

Evidence directory: `~/Library/Caches/NexaLance/omniroute-native-thread-tools-fix-2026-10-09`।

## ১৬:৪৮ Dhaka — validation ও build অগ্রগতি

Full TypeScript gate সত্যিই PASS: `5829 <= 5830`; heap 6144 MiB, total process cap 6144 MiB, measured peak 5244 MiB। Baseline বাড়ানো হয়নি। App-এর bundled 2.1.293 engine-এও offline replay fixture PASS: দুইবার স্থানীয় 404-এর পরে full transcript/tools replay, বাস্তব `Read` ও `Bash` execution; peak 680 MiB।

Chrome-এর স্বাভাবিক quit সম্পন্ন, VS Code ও Claude স্বাভাবিক quit হয়েছে। OrbStack normal CLI shutdown হয়েছে; force-stop নয়। প্রথম production build admission-এ headroom 17 GiB-এর নিচে নেমেছিল বলে guard compile শুরুই করেনি। পরে admission পেয়ে full build চালু হয়েছে: এক worker, heap 5120 MiB, total cap 7168 MiB। Compilation ও 620 static page generation PASS; tracing/package ধাপ চলছে। নতুন release artifact/deployment এখনও completion হিসেবে ঘোষণা করা হয়নি।


## ২০২৬-১০-০৯ — মূল native tool fix-এর production deployment ও live QA

আগের build/deployment-pending অবস্থাটি এই প্রমাণ দিয়ে হালনাগাদ করা হলো। মূল fix-এর production runtime এখন `770a768b1` (`770a768b11d154020518a540cc7276fd41817a1f`)। Package: `~/.omniroute-builds/3.8.51-770a768b1/omniroute-3.8.51.tgz`, 99,624,494 bytes; SHA-256 `1de0840db17131336c86a578e06c098de45568d01c2893f57d096e4b7a9b19be`। Full production build, 620 static pages, dashboard gate, package validation এবং Strict Bridge gate PASS; pipeline exit 0। Resource trace-এ peak total RSS 6,990 MiB, minimum physical headroom 14.515 GiB, pressure normal এবং swap বৃদ্ধি 0। প্রাথমিক build receipt-এ CLI generation-এর পরে restoration-pending লেখা আছে; পরবর্তী `source-restored-final.json` ও clean/pristine check দিয়ে সেটি নিষ্পত্তি হয়েছে।

মূল কারণ ছিল native Anthropic Thread continuation-এ tools/system বাদ থাকা। GPT/GLM ওই Anthropic Thread state পায় না। স্বীকৃত `thread_not_found` response দিয়ে native client-কে পুরো history/system/tools replay করানো হয়েছে; upstream-এ শূন্য-tool continuation পাঠানো বন্ধ হয়েছে। Model বা account mapping বদলানো হয়নি।

Bounded updater দিয়ে isolated install ও real Anthropic smoke PASS হওয়ার পরে ১৬:৫২ Dhaka-তে promotion সম্পন্ন। Deployment peak RSS 1,471 MiB, minimum headroom 19.001 GiB, pressure normal, swap বৃদ্ধি 0। Runtime SHA, loopback ও `omni.local` health, native Bridge TLS/DNS PASS। পূর্ণ আগের runtime `~/.omniroute-builds/runtime-backups/20261009-165100` এবং consistent database snapshot `~/.omniroute-local/update-backups/20261009-165100/storage.sqlite` সংরক্ষিত। Desktop build/deploy flags 0 ছিল। Provider 25, API key 3, Bridge mapping 13, ID sets, account operator state এবং পূর্বের 71,574 usage row অক্ষত। Startup-এর `_settingsRevision` ও `codex_catalog_revalidated_version` ছাড়া settings-এর অন্য key অপরিবর্তিত।

| প্রকৃত client / source selection | নির্বাচিত upstream | Live ফল |
| --- | --- | --- |
| Claude Code CLI, Opus 5.5 | Codex / `gpt-6.1-sol` | `Read` + `Bash`, প্রত্যাশিত marker PASS |
| Claude Code CLI, Fable 5 | Codex / `gpt-6-astra` | `Read` + `Bash`, প্রত্যাশিত marker PASS |
| Claude Code CLI, Sonnet 5.5 | GLM Coding / `glm-5.3-max` | `Read` + `Bash`, প্রত্যাশিত marker PASS |
| Native app, Opus 5.5 | Codex / `gpt-6.1-sol` | `Read` + `Bash` PASS |
| একই native app conversation, Fable 5.1 | Codex / `gpt-6-astra` | প্রকৃত `Skill` call ও `NATIVE_SKILL_OK` PASS |
| একই native app conversation, Sonnet 5.5 | GLM Coding / `glm-5.3-max` | `Read` + `Bash` এবং আগের Skill marker মনে রাখা PASS |

Native app-এর Astra turn-এ Skill fixture-এর ‘শুধু marker দাও, আর tool নয়’ নির্দেশ মানা হয়েছে; ওই app turn-এ `Bash` চলেছে দাবি করা হচ্ছে না। Astra CLI-তে `Read`/`Bash` আলাদাভাবে PASS। Evidence: `primary-live-qa-evidence.json`, `live-cli-2026-10-09T10-53-01.562Z/summary.json`, native app resource receipt। Native app-এর 49 tool definition প্রতিটি replay-তে ছিল। ব্যক্তিগত পরিচয়/credential প্রকাশ করা হয়নি।

Validation clarification: আগের MCP 493/493 PASS হয়েছিল test process-এ explicit `OMNIROUTE_MCP_COMPRESS_DESCRIPTIONS=0` দিয়ে। Live `.env`-এ flag unset; ওই test-কে live config-এর সমতা বা এই run-এ compression বন্ধ করার প্রমাণ বলা যাবে না। প্রথম default-mode 492/493 ফলও সংরক্ষিত। Initial CLI `--bare` test-এ authentication ব্যর্থ হয়ে zero-token failure হয়েছিল; normal OAuth path-এ পুনরায় প্রকৃত live test PASS হয়েছে।

### Live QA-তে পাওয়া সম্পর্কিত prompt suggestion retry

মূল tool call সফল হওয়ার পরে native app-এর একই session-এ ঐচ্ছিক `[SUGGESTION MODE: ...]` request ৮ বার HTTP 502 হয়েছে—প্রথমটি streaming, পরের ৭টি non-streaming। Request-টি স্পষ্টভাবে প্রয়োজন না হলে নীরব থাকতে বলেছিল, কিন্তু gateway-এর empty-response guard সেই completed খালি উত্তরকে failure ধরেছে। 49 tool ও history-সহ পুনরায় request যাওয়ার একটি নির্দিষ্ট বাড়তি খরচের পথ এটি; শুধু এই নমুনা দিয়ে মোট weekly quota পতনের কারণ বা সাশ্রয়ের শতাংশ নির্ধারণ করা হচ্ছে না।

আলাদা child worktree `native-suggestion-silence-2026-10-09`-এ narrow fix তৈরি করা হয়েছে। Streaming ও non-streaming regression আগে FAIL; fix-এর পরে নতুন 16 case-সহ related 101/101, stream/thread 73/73 এবং core typecheck PASS। সাধারণ খালি উত্তর, zero-byte body, truncated stream, incomplete/error response ও non-native caller-এর সুরক্ষা বজায় আছে; প্রকৃত text/tool call অক্ষত। এই সম্পর্কিত দ্বিতীয় fix এখনো build/deploy করা হয়নি। Mac locked থাকায় native UI ও অনুমোদিত স্বাভাবিক quit করা যায়নি; unlock চাওয়া হয়েছে, এর মধ্যে source/gate কাজ চলছে। মূল runtime `770a768b1` live আছে।


### ২০২৬-১০-০৯ — suggestion fix source checkpoint

সম্পর্কিত suggestion retry fix local commit `8d8c52e3b2bde5ac1b9c329441fe15355c2a3322` (`fix/native-suggestion-silence-2026-10-09`)-এ সংরক্ষিত। Normal commit hooks PASS; Jillur Rahman author/committer; child source clean ও pristine; সব 140 overlay patch dry-run PASS। নতুন 16 regression case-সহ related 101/101, stream/thread 73/73 এবং core typecheck PASS। Evidence hashes `suggestion-source-progress-8d8c52e3b.json`-এ আছে।

এই দ্বিতীয় commit-এর full TypeScript ratchet, production build, deployment এবং native app acceptance এখনও বাকি। Mac locked; native UI-তে দুবার একই lock বাধা পাওয়া গেছে। সর্বশেষ physical headroom প্রায় 13.7 GiB, pressure normal, swap used 1,079.56 MiB, internal disk free প্রায় 42 GiB। Ratchet-এর 6 GiB cap + 10 GiB reserve এবং build-এর পরীক্ষিত 7 GiB cap + 10 GiB reserve admission হয়নি। নতুন heavy build শুরু হয়নি। Unlock-এর জন্য user action pending; app স্বাভাবিকভাবে quit করার আগের অনুমতি এখনও আছে, নতুন অনুমতি চাওয়া হয়নি।

মূল fix-এর live runtime `770a768b1` এবং loopback/`omni.local` health আবার HTTP 200 যাচাই হয়েছে। সফল package-এর bytes ও SHA-256 পুনরায় মিলে গেছে। দ্বিতীয় fix main-এ merge হয়নি এবং live runtime-এ নেই। পুরোনো deployment heartbeat আগে থেকেই `PAUSED`; এই checkpoint-এ automation পরিবর্তন করা হয়নি। Unlock হলে নিজস্ব test session idle যাচাই করে অনুমোদিত স্বাভাবিক quit, resource admission, ratchet, আলাদা artifact build, bounded promotion এবং suggestion-এর প্রকৃত native QA সম্পন্ন করতে হবে।


## ২০২৬-১০-০৯ — CLI/native tools, সব connection ও Nexa Skills-এর বিস্তৃত audit

পূর্ণ ফল: [OMNIROUTE-NATIVE-TOOLS-INTEGRATIONS-QA-2026-10-09.md](OMNIROUTE-NATIVE-TOOLS-INTEGRATIONS-QA-2026-10-09.md)। প্রতি tool, integration ও Skill-এর সীমা এবং evidence সেখানে আছে।

CLI-তে ১০ feature × ৩ target: Sol ৯/১০, Astra ৯/১০, GLMT Max ৮/১০; মোট ২৬/৩০ = ৮.৭/১০ bounded feature score। ৩০ CLI session-এর trace-এ ১০৭ HTTP 200, দুই GLMT image 400; routing verified। WebFetch-এর internal `claude-haiku-5-5` alias অনুপস্থিত ছিল; consistent DB snapshot-এর পরে exact Sol mapping যোগ করে তিন route-এ WebFetch PASS, আগের ১৩ mapping অক্ষত, এখন ১৪। WebSearch এখনও semantic failure; GLMT Max-এর image input এখনও unsupported।

Native catalog ৪৯ declaration, ৪৮ client tool-এ ১৪৪ protocol check PASS; এটি সব native tool execution নয়। CLI/native unique tool-এর ৬৪-row CSV, ৪১৩ Skill metadata validation, ২৯ Nexa registration, ১৮ Nexa suite-এ ১,৮৮০ PASS/৩ skipped এবং তিন বাস্তব Skill load/helper PASS আছে। `nexa-blender` metadata fix `450c2c3` installed; body/scripts অপরিবর্তিত। Enabled ৯ plugin manifest, ১৭ hook syntax এবং configured/embedded MCP catalog যাচাই হয়েছে; full browser/device/outbound workflow pending। অতিরিক্ত CronList/ListAgents/নিজের background Bash/TaskStop তিন route-এ PASS।

২৫ provider connection-এর মধ্যে ২৩ active: ৮ নতুন ছোট inference PASS + ২ verified CLI reuse; ১৩ failure (৯ quota/rate-limit, ৪ Google verification), ২ operator-paused skip। Canonical nested `googleAccountVerification.required` অনুযায়ী চার active ও দুই paused Google account verification-required; flat legacy inventory flag-এর false মানকে final সিদ্ধান্ত হিসেবে ব্যবহার করা হয়নি। Paused/enable/priority state অক্ষত; কোনো account enable, quota/verification clear বা private verification URL প্রকাশ হয়নি।

Live runtime/main clean `770a768b1`; পরবর্তী child clean/pristine `6e3dd8d50`-এ suggestion silence, server-advisor boundary ও hosted-search unsupported guard প্রস্তুত। ৩১৬ distinct source regression case, core typecheck, ratchet ৫,৮১০/৫,৮৩০ এবং ১৪১/১৪১ patch apply PASS; normal hooks ও Jillur Rahman attribution বজায়। Parent-এর ৩.৫/৪ GiB heap build OOM-এর evidence সংরক্ষিত; candidate-এর সফল production artifact নেই। নতুন runner পরীক্ষিত ৫ GiB heap/৭ GiB RSS profile ব্যবহার করবে।

শেষ checkpoint: 12:46:14 UTC headroom ১৪.৯১৮ GiB < ১৭ GiB start requirement, pressure normal, swap স্থির, internal disk ৪০.৩৫২ GiB, render নেই। Mac locked; manual unlock দরকার। তাই candidate build/deploy এবং পূর্ণ native UI acceptance pending। দুই healthz 200; শেষ usage rows ৭১,৭৭৩; provider ২৫/API key ৩, mapping ১৪ ও ID sets/settings/operator state fingerprint retained। Source, successful package, live data ও rollback অক্ষত; আগের report bytes রেখে এই অংশ append করা হয়েছে।


## ২০২৬-১০-০৯, ২৩:১৫ Dhaka — নতুন release বাস্তবে deploy ও native QA সম্পন্ন

**Production এখন `6e3dd8d50`।** Unlock-এর পরে বাস্তব native UI, production build, isolated install ও real Anthropic smoke, consistent DB snapshot, complete prior-runtime preservation, promotion, health ও Bridge TLS/DNS যাচাই সম্পন্ন হয়েছে। আগের pending checkpoint-এর পরের সম্পন্ন ফল এটি। পূর্ণ প্রমাণ ও provider সীমা: [সম্পূর্ণ native/CLI QA রিপোর্ট](OMNIROUTE-NATIVE-TOOLS-INTEGRATIONS-QA-2026-10-09.md)।

প্রথম ৭ GiB build cap sample-এ ৭,১৭০ MiB হওয়ায় নিরাপদে code 75 stop; system OOM/pressure warning হয়নি। তারপর ৮ GiB cap/৫ GiB heap/one worker-এ ৬২০ page-সহ whole pipeline exit 0; total peak ৭,৮৪৬ MiB, minimum headroom ১৬.০৪৮ GiB, swap growth ০। Child/main clean `6e3dd8d50`, pristine upstream base retained, ১২৯ generated CLI file restore। Deploy ৩ GiB cap-এ peak ১,৫০৬ MiB, minimum headroom ১৮.৫৬০ GiB, exit 0; 23:00:03.921 Dhaka-তে promotion সফল।

Artifact `~/.omniroute-builds/3.8.51-6e3dd8d50-attempt2/omniroute-3.8.51.tgz`, 99,631,665 bytes; SHA-256 `5a889ed25b6afd0fe62325810aa8dd0f4fd55fa2c030e1c7dd4ea8ec035496f3`। পূর্বের `770a768b1` package ও complete runtime `~/.omniroute-builds/runtime-backups/20261009-225858` এবং consistent DB `~/.omniroute-local/update-backups/20261009-225858/storage.sqlite` অক্ষত।

Postdeploy Sol/Astra/GLMT CLI-তে Write/Read/Edit/Bash/Bash—১৫ actual tool call, ৩/৩ fixture PASS; selected gateway models verified। একই native chat-এ GLMT→Sol→Astra switch-এর পরে browser, file tools, ToolSearch, Artifact list, SVG widget, AskUserQuestion fixture, context7, memory এবং Nexa Skill/helper পরীক্ষা হয়েছে। Restart-এর পর fresh Read/Bash exact marker ও আগের context PASS। Valid silent streaming native suggestion এখন HTTP 200; nonstream Sol/Astra native-template case-ও empty/end_turn 200। আগের native sample-এর ১১ optional-suggestion 502 retained; নতুন ৫ native request-এ ০টি 502। একটি আলাদা minimal synthetic Sol suggestion ৯০-second timeout/499 unresolved outlier retained—সব probe PASS বলা হয়নি।

Anthropic-hosted WebSearch/advisor এখনও GPT/GLMT-এ unsupported; নতুন guard স্পষ্ট 400 দেয়, feature parity তৈরি করে না। Browser/MCP বিকল্প পরীক্ষা হয়েছে। GLMT image unsupported; native Bash exact requested marker mismatch ও ১২১-second first response-ও report-এ আছে। তাই official-native সব feature/quality সমান বা zero-error guarantee নেই। Bounded CLI rating Sol ৯/১০, Astra ৯/১০, GLMT ৮/১০, মোট **৮.৭/১০**; এটি সব native workflow-এর rating নয়।

Immediate deploy retention ১৩/১৩ PASS: provider ২৫, API key ৩, mapping ১৪, ID sets/operator state/usage retained। Full settings hash-এর তিন startup-bookkeeping change source দিয়ে resolved। পরে বাস্তব client run-এর শেষে `.claude/settings.json` hash একই; `.claude.json` hash বদলেছে, origin নির্দিষ্ট না করে রিপোর্টে রাখা হয়েছে। এই task official config edit করেনি। Canonical Google verification ৪ active + ২ paused; আগের connection matrix-এ ১০ active success, ৯ quota/rate-limit ও ৪ verification failure, ২ paused skip। Enable বা forced clearing হয়নি।

Private optimizer commit [`7bc9d1c`](https://github.com/developerjillur/omniroute-optimizer/commit/7bc9d1cbf4d5baa4e8215959dbeafc66018ad1c2) push/remote verify: ২৯২ nexa file/source tree exact, Gitleaks PASS। Public OSS push/PR হয়নি। Jillur Rahman author/committer এবং normal hooks বজায়। Final release receipt (স্থানীয় বা private reference; প্রকাশিত নয়)।

অনুমোদিত স্বাভাবিক quit-এ Chrome/Claude বন্ধ হয়; Claude dialog-এর অন্য research session interrupted হয়েছে, force-kill হয়নি। পরে Claude reopen করে own QA করা হয়েছে; অন্য session resume/message করা হয়নি। পুরোনো deployment follow-up আগে থেকেই PAUSED, আবার যাচাই হয়েছে। সফল output, source/data/rollback, failed evidence এবং এই append-এর আগের সব report bytes অক্ষত রাখা হয়েছে।
