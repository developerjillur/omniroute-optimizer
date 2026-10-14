# Native Artifacts, thinking progress, Thread recovery ও GPT-6.1 Sol pricing

তারিখ: 2026-10-14। লেখক: Jillur Rahman।

বর্তমান অবস্থা: source ও regression tests প্রস্তুত; চূড়ান্ত validation, নতুন production build, real native QA ও deployment বাকি। চালু runtime `0c0d3b1d4`। বর্তমান source-কে deployed বা সম্পূর্ণ যাচাইকৃত বলা যাবে না।

## পর্যবেক্ষণ ও কারণের সীমা

সংশ্লিষ্ট native session-এর gateway log-এ প্রায় 600 সেকেন্ড পরে দুইটি content-stall failure পাওয়া গেছে। প্রতিবার কয়েকশ `content_block_delta` এসেছিল, কিন্তু usable output শনাক্ত হয়নি। পরবর্তী non-streaming fallback প্রায় 540 সেকেন্ড পরে বন্ধ হয়েছে। একই session-এ owning Thread অনুপস্থিত হওয়ার 404 এবং full replay-এর পরে সফল Artifact creation-ও পাওয়া গেছে।

পুরোনো request-এর raw SSE subtype payload রাখা ছিল না। তাই প্রত্যেক historical failure কেবল hidden thinking-এর জন্য হয়েছিল—এ দাবি প্রমাণিত নয়। তবে isolated regression-এ তিনটি নির্দিষ্ট implementation gap পুনরুৎপাদিত হয়েছে: hidden-thinking activity-কে content inactivity ধরা, `message_start`-এই Thread owner সংরক্ষণ, এবং native buffered fallback-এর headers deadline শেষ হওয়া। Artifact create ও read-এর প্রমাণ পাওয়া গেলেও পরবর্তী edit বা পুরো reconnect সমস্যার সমাধানের প্রমাণ পাওয়া যায়নি।

## সংরক্ষিত source পরিবর্তন

- First-party Anthropic stream-এ matching open thinking block-এর বৈধ `thinking_delta` ও `signature_delta` activity content inactivity window নবায়ন করে। Ping, lifecycle frame, অজানা block এবং closed block এই সুযোগ পায় না। Absolute active deadline, empty-completion guard ও client cancellation বজায় থাকে। `adaptive`, `enabled` ও `between_tools` mode রাখা হয়েছে; client configuration পাল্টানো হয় না।
- Thread owner কেবল completed response-এর পরে রাখা হয়। Interrupted/cancelled SSE owner তৈরি করে না। Upstream-confirmed missing বা mismatched Thread-এর recovery-তে নির্দিষ্ট session, message ও connection-এর owner সরিয়ে native `thread_not_found` দিয়ে full conversation replay চাওয়া হয়। Sparse continuation অন্য account/model-এ পাঠানো হয় না। Signature, quota বা model-not-found error-কে Thread error বানানো হয় না।
- Native Claude thinking-এর `stream:false` fallback-এ Bridge ভিতরে streaming request নেয় এবং সম্পূর্ণ response থেকে native JSON বানায়। Opaque thinking signatures, tool arguments, citations, compaction content, usage, diagnostics ও context-management metadata রাখা হয়। Partial tool JSON, open block, transport failure বা missing completion-কে HTTP 200 বলা হয় না। Buffer সর্বোচ্চ 32 MiB। সম্পূর্ণ native JSON upstream-ও গ্রহণযোগ্য।
- Backend active budget 21 মিনিট; native buffered Bridge budget 21.5 মিনিট; শুধু সংশ্লিষ্ট local native ingress-এর idle budget 22 মিনিট। ছোট `MITM_ROUTER_TIMEOUT_MS` override ছোটই থাকে। Bounded failure-এ `x-should-retry:false` দেওয়া হয়; real CLI এটি মানে কি না live QA-তে যাচাই বাকি। সাধারণ streaming এবং public TLS fallback-এর আচরণ বদলানোর উদ্দেশ্য নেই।
- Package gate নতুন helper-এর `src` ও `dist/src` bytes একই কি না পরীক্ষা করে। পুরোনো rollback package-এ নতুন helper থাকা বাধ্যতামূলক করা হয়নি।

## GPT-6.1 Sol cost display

Model catalog-এ routing থাকলেও default pricing row ছিল না। তাই retained token usage থাকা সত্ত্বেও estimate $0.00 হচ্ছিল।

[OpenAI model pricing](https://developers.openai.com/api/docs/models/gpt-6.1-sol)-এর 2026-10-14 তথ্য অনুযায়ী প্রতি 1M token-এ Standard input $2, cached input $0.10, cache writes $2.50 ও output $10। এক request-এর input 272K ছাড়ালে input/cache 2× এবং output 1.5×। Fast 2×, Ultrafast 6×, Flex 0.5×। Regional বা অন্য provider-specific charge-এর নতুন সমর্থন এই পরিবর্তনের অংশ নয়।

`cx`/`codex` base ও effort aliases এবং `openai` base pricing যোগ হয়েছে। Analytics, provider-window estimate ও legacy stats-এ long-context bucket প্রতিটি raw request থেকে নির্ধারিত হয়; অনেক ছোট request-এর যোগফল দিয়ে premium লাগানো হয় না। Stored historical rollup cost বজায় থাকে; পুরোনো rollup-এ request dimensions না থাকলে তার exact long-context cost পুনর্গঠনের দাবি করা যাবে না।

Subscription-এর billed-cost semantics বজায় থাকে। API-equivalent estimate কোনো subscription invoice, অতিরিক্ত charge বা weekly allowance মাপ নয়। Retained pricing baseline-এর নির্দিষ্ট cutoff-এ 19,951 rows / 17,134 successful requests এবং 8,497 successful long-context requests পাওয়া গেছে; independent estimate $1,583.4206430। এটি live চলমান মোটের স্থায়ী মান নয়। Cutoff ও token-dimension hash receipt-এ আছে; deployment-এর পরে একই cutoff-এর estimate তুলনা করতে হবে।

## প্রমাণ ও validation অবস্থা

Local evidence directory:

`/Users/developerjillur/Library/Caches/NexaLance/omniroute-native-artifacts-2026-10-14/`

| পরীক্ষা                                                                                        | অবস্থা                                                                        |
| ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Old-source regressions                                                                         | প্রথম batch-এ 5 failure; isolated native buffered TLS fixture-এ আরও 1 failure |
| Intermediate focused tests                                                                     | `focused-after-1.log`: 48/48 PASS, প্রায় 6.64 সেকেন্ড                         |
| Final buffer safety, metadata, `between_tools`, Thread replay ও SQL/context grouping additions | Source প্রস্তুত; শেষ পরিবর্তনের পরে চালানো হয়নি                               |
| Final native, analytics, deployment regressions; core typecheck; full ratchet; lint            | Resource admission-এর অপেক্ষায়                                                |
| নতুন full dashboard build / CLI generation / package / strict Bridge gate                      | হয়নি                                                                          |
| নতুন build-এ real Claude native Artifact create/edit/reopen ও CLI Artifact request             | হয়নি                                                                          |
| নতুন runtime promotion ও postdeploy retained-data comparison                                   | হয়নি                                                                          |

Intermediate test sequence-এ preflight disk check ব্যর্থ হওয়ার পর shell sequence পরবর্তী ছোট batch চালিয়ে ফেলেছিল। Batch শেষ হয়েছে; আর test চলছে না। `resource-admission-audit.json`-এ ঘটনা রাখা হয়েছে। Final validation এবং build অবশ্যই একই fail-closed bounded runner-এর অধীনে চালাতে হবে; failed admission-এর পরে পৃথক shell command চালিয়ে যাওয়া যাবে না।

## Resource ও release continuation

সর্বশেষ ব্যবহারকারীর নির্দেশ: **apps চালু রাখুন; source প্রস্তুত করে অপেক্ষা করুন**। পুরোনো app-quit অনুমতি এখন প্রযোজ্য নয়। কোনো app, browser tab, session, render বা unrelated service বন্ধ করা যাবে না।

নতুন কাজ শুরুর আগে memory pressure, free+inactive+speculative physical headroom, swap, internal disk এবং Blender/render/batch পরীক্ষা করতে হবে। Full build-এর conservative total RSS cap 8 GiB; এর বাইরে 10 GiB reserve ও internal disk-এ অন্তত 20 GiB প্রয়োজন। চলার সময় pressure warning/critical, headroom <8 GiB, swap growth >1 GiB বা disk <15 GiB হলে শুধু নিজের heavy job নিরাপদে থামবে। Unchanged waiting অবস্থায় notification নয়।

Source worktree:

`/Users/developerjillur/Developer/OmniRoute/.claude/worktrees/native-artifact-recovery-2026-10-14`

Branch: `fix/native-artifact-recovery-2026-10-14`। সব customization `nexa/`-তে export করে `upstream-main` base pristine রাখতে হবে। Normal commit hooks ব্যবহার হবে; `--no-verify` বা stash নয়। Source প্রস্তুত থাকা commit/build/deployment প্রমাণ নয়। Main worktree বা অন্য session-এর source পরিবর্তন করা যাবে না।

Release-এর আগে বর্তমান overlay inventory/hash ও final gate receipt মিলতে হবে। সফল পুরোনো `.tgz`, `.build/dist`, source, database ও rollback অক্ষত থাকবে। নতুন source-এর জন্য নতুন immutable artifact directory লাগবে। Desktop build/deploy flags 0 থাকবে। Verified নতুন package দিয়ে resource-bounded main updater-এর `NEXA_DEPLOY_ARTIFACT` redeploy হবে; পুরোনো artifact-কে এই fix-এর build বলা যাবে না।

Updated `nexa/deploy/native-ingress.mjs` package promotion-এর সঙ্গে আলাদাভাবে installed copy-তে নিতে হবে; `install-native-ingress.sh`-এর backup ও launchd behavior আগে review করতে হবে। শুধু runtime package বদলালে পুরোনো ingress idle deadline থেকে যাবে। Service reload-এর আগে সংশ্লিষ্ট active request drain ও rollback path যাচাই প্রয়োজন।

Real QA matrix: native app ও normal Claude Code session থেকে ছোট Artifact create → read/edit → follow-up → reopen; thinking progress; recoverable Thread full replay; ordinary tools ও একটি read-only connector; approved GPT/GLM/Claude route-switch regression। Existing user session, mapping বা official app/config edit করা যাবে না। প্রয়োজনীয় পরিবর্তিত test mapping snapshot নিয়ে restore করতে হবে। Native app UI না দেখে UI success বলা যাবে না।

Deployment-এর আগে consistent database snapshot, complete previous runtime preservation ও operator-state inventory; পরে runtime SHA, health, native Bridge TLS, retained provider/API-key ID sets, usage continuity এবং cutoff-matched pricing comparison লাগবে। Private optimizer repository-তে sync হবে final verified overlay; public OSS push/PR নয়।

## Protocol references

- [Anthropic thinking display ও signatures](https://platform.claude.com/docs/en/build-with-claude/thinking)
- [Anthropic context editing metadata](https://platform.claude.com/docs/en/build-with-claude/context-editing)
- [OpenAI GPT-6.1 Sol model ও pricing](https://developers.openai.com/api/docs/models/gpt-6.1-sol)

এই নথির source/test অবস্থা নতুন evidence হলে append করতে হবে; পুরোনো evidence overwrite করা যাবে না।

## Source প্রস্তুতির অতিরিক্ত নোট

Strict patch check-এ পূর্বের `scripts/dev/run-standalone.mjs` patch-এর context mismatch পাওয়া যায়। একই public-bind security guard রেখে patch-টি বর্তমান pristine base থেকে পুনরায় কাটা হয়েছে। পুরোনো patch, pristine bytes, নতুন applied bytes ও hash receipt `launcher-patch-recut/` evidence directory-তে রাখা আছে। Upstream source বা live launcher পাল্টানো হয়নি। এই structural check application regression test-এর বিকল্প নয়।

## Final source validation — 2026-10-14

<!-- final-source-gate-20261014T121059Z -->

Native regression 131/131, related usage/analytics/stream/transport regression 284/284, core typecheck এবং full ESLint PASS। Unchanged deployment regression 22/22 exact source/test/log hashes যাচাই করে reuse করা হয়েছে। Preserved old application baseline-এ native Thread usage এবং ambiguous POST replay-এর failing assertions reproduce হয়েছে।

Full TypeScript ratchet সম্পূর্ণ project মেপেছে: 5806 diagnostics, established baseline 5830; gate PASS, baseline বাড়ানো হয়নি। নতুন usage test-এর narrowing, exported usage payload type এবং SQLite row boundary typing সংশোধিত হয়েছে। Upstream-এর বিদ্যমান type backlog বজায় আছে; এই gate zero-error full typecheck দাবি করে না।

10 unused ESLint suppressions সরেছে; নতুন suppression বা widened allowance নেই। Full ratchet heap2560/RSS3072 এবং heap4096/RSS5120-এ SIGABRT/SKIP হওয়ায় প্রত্যাখ্যাত হয়েছিল। Jillur Rahman-এর explicit approval-এ শুধু full ratchet heap6144/RSS8192-এ চলেছে; অন্য validation/deploy cap3072MiB, reserve10GiB ও সব resource guards বহাল। Final ratchet peak 5195MiB।

Evidence: `validation-2026-10-14T12-10-59.202Z/validation-receipt.json`, exact prepared application hashes এবং compiler stdout/stderr retained। Source gate শেষে application base pristine restore হয়েছে। Commit hooks, full dashboard/CLI/package build, deployment এবং real native UI QA আলাদা evidence দিয়ে যাচাই হবে। Source validation বা audit থেকে native-equivalent billing কিংবা zero-extra-usage guarantee দেওয়া হয়নি।
