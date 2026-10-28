# Native provider ও Artifact acceptance — ২০২৬-১০-১৮

বর্তমান live build `15533a05c`-এ নিজের private Artifact-এর cold session restore ও view reconnect-এর পরে দুইটি comment reply/resolve UI-তে যাচাই হয়েছে। আটটি configured provider entry-এর **সাতটির নির্বাচিত model-এ official CLI Agent + child result + saved-resume এবং actual provider trace PASS**। Claude Haiku সরাসরি cached quota gate থেকে HTTP 429 পেয়েছে; তার acceptance এখনও অসম্পূর্ণ। এটি সব catalog model, account বা native feature-এর blanket PASS নয়।

## Build ও client identity

- Deployed application source: `15533a05c4c73a9db9fcecf96d46f5d3b5e1979f`; version `3.8.51`। এই QA-তে runtime, package বা application source বদলায়নি।
- Native app: `2.42304.0`; bundled engine: `2.1.299`। Standalone official CLI: `2.1.301`। App/CLI update বা edit, global settings/login/updater modification হয়নি।
- QA চলাকালীন নেওয়া চারটি নির্বাচিত app/engine/CLI/settings fingerprint পরের তুলনায় অপরিবর্তিত। এটি পুরো app-এর pre-turn fingerprint নয়।
- আগের focused Read probes পুনরাবৃত্তি হয়নি। নিজের নতুন synthetic Agent/resume session ও নিজের QA Artifact ব্যবহার হয়েছে; অন্য user session/Artifact পরিবর্তন হয়নি।

## Harness পদ্ধতি ও ফল

একটি নিজস্ব `qa_echo` child agent tools ছাড়াই unique synthetic nonce ফেরত দেয়। Parent সঠিক child result পাওয়ার পরে marker ফেরত দেয়। নতুন CLI process নিজের saved session খুলে আগের nonce-টি ফেরত দেয়; resume prompt-এ nonce আবার দেওয়া হয়নি এবং নতুন tool চলেনি। Actual request payload-এ nonce, Agent result বা completed task notification এবং সঠিক provider/model মেলানো হয়েছে। Parent-এর OK লেখা একা PASS নয়।

Process-scoped gateway credentials, manual permissions, usual hooks, empty strict MCP configuration, low effort ও নিজস্ব process-এ updater disabled রাখা হয়েছে। Native app-এর পুরোনো session settings বদলানো হয়নি। এই API-key CLI fixture-এ hosted connector parity পরীক্ষা হয়নি। প্রতিটি provider run আলাদা resource admission পেয়েছে এবং একবারে একটি harness চলেছে।

| Provider entry | নির্বাচিত model                                                 | ফল                      | নিজের matched accepted call | Agent / resume সময়, seconds |
| -------------- | --------------------------------------------------------------- | ----------------------- | --------------------------: | --------------------------: |
| `codex`        | `codex/gpt-6.1-sol`                                             | **PASS**                |                           4 |                 9.66 / 4.34 |
| `glm`          | `glm/glm-5.3-flash`                                             | **PASS**                |                           5 |                21.46 / 4.34 |
| `glmt`         | `glmt/glm-5.3-flash`                                            | **PASS**                |                           5 |                18.25 / 5.39 |
| `zai`          | `zai/glm-5.3-flash`                                             | **PASS**                |                           4 |                16.02 / 4.32 |
| `antigravity`  | `antigravity/gemini-3.1-flash-lite`                             | **PASS**                |                           5 |                15.03 / 4.33 |
| `agy`          | `agy/gemini-3.1-flash-lite`                                     | **PASS**                |                           5 |                14.01 / 5.43 |
| `openrouter`   | `openrouter/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` | **PASS**                |                           5 |              143.53 / 22.56 |
| `claude`       | `claude/claude-haiku-5-5`                                       | **BLOCKED: cached 429** |                           0 |                 resume হয়নি |

সময়টি পুরো CLI phase-এর wall time; single API latency বা gateway overhead নয়। Valid child request ও client notification-এর একাধিক parent turn call-count-এর অংশ। Cache-inclusive input আবার cache counter-এর সঙ্গে যোগ করা হয়নি এবং overlapping `usage_history` মোটের সঙ্গে call-log tokens যোগ করা হয়নি।

### agy alias ও নিজের card-এর credential

Existing source-এ `agy/` → `antigravity` explicit normalization আছে: `open-sse/services/providerAlias.ts`। `src/sse/services/auth.ts` দুই card-এর credential pool খোঁজে; existing `tests/unit/bug-9204-agy-provider-alias-credentials.test.ts`-ও এই আচরণ প্রত্যাশা করে। ফলে আটটি configured entry মানে আটটি independent backend নয়।

প্রথম সাধারণ agy run-এ Antigravity card-এর connection নির্বাচিত হয়েছিল। আলাদা bounded test-এ শুধু নিজের QA process-এর `x-omniroute-connection` header দিয়ে existing active agy-card connection নির্দিষ্ট করা হয়েছে। পাঁচটি নিজের nonce-matched accepted request, child এবং resume—সবগুলোতে সেই exact connection ও stored provider `agy` read-only DB comparison-এ মিলেছে। Table-এর agy row এই দ্বিতীয় test। Global mapping, credentials, policies, cooldown বা lease বদলানো হয়নি। সব নয়টি account পৃথকভাবে পরীক্ষা হয়েছে দাবি করা হচ্ছে না।

### GLM-এর asynchronous result যাচাই

প্রথম helper শুধু synchronous `tool_result`-এ nonce খুঁজেছিল। GLM-এর official client child result-টি linked child message ও completed `task_notification`-এ দিয়েছিল; সেই কারণে প্রথম receipt false negative দেখায়। Saved provider response-এ exact child nonce পাওয়া যায়। Verifier synchronous ও asynchronous delivery এবং Anthropic message-এর string/block content দুটো গ্রহণ করার পরে exact saved notification-সহ resume request মেলানো হয়েছে। আগের rejected receipts সংরক্ষিত এবং GLM Agent call পুনরাবৃত্তি হয়নি। এটি application fix নয়।

## নিজের Artifact comment ও reconnect

নিজের session `OmniRoute QA native Artifact`, private Artifact `OmniRoute QA 2b4158371`। Cold app launch ও পুরোনো নিজের session restore-এর পরে comment A-তে Send to Claude enabled ছিল। Native comment tools reply ও resolve করেছে এবং exact A acknowledgment actual thread UI-তে দেখা গেছে।

এরপর শুধু নিজের Artifact pane বন্ধ করে session view থেকে সরে আবার একই session ও Artifact খোলা হয়েছে। নতুন comment B-তেও exact acknowledgment, reply এবং resolved state UI-তে দেখা গেছে। Canvas `QA EDIT OK version2` অক্ষত। নতুন file edit, publish, shell action বা অন্য user Artifact/session পরিবর্তন হয়নি।

Native UI model label ছিল Sonnet 5.5 Medium, কিন্তু existing operator Bridge mapping-এর actual route ছিল **`codex/gpt-6.1-sol`**। তাই এই Artifact result-কে direct Claude-provider PASS বলা হয়নি। Comment B-র চারটি exact marker-matched accepted call-ও ওই actual route-এ HTTP 200 পেয়েছে; following payload-এ reply/resolve actions আছে।

**প্রমাণিত scope:** নিজের private comment reply, cold session restore ও pane/session view detach/reattach-এর পরের reply। Arbitrary network fault injection, অন্য user Artifact-এর পুরোনো unavailable notices-এর নির্দিষ্ট inner cause বা permanent watcher fix প্রমাণিত নয়। Armed monitor record একা PASS ধরা হয়নি; actual UI reply ও target trace ব্যবহার হয়েছে।

Comment B-র matched calls-এ recorded inclusive input 475569, cache read 473600 এবং output 190। বড় cumulative input মানেই একই পরিমাণ fresh prompt নয়। এই counters subscription invoice/weekly quota নয়; direct-native matched workload comparison-ও নয়।

## Performance ও সীমাবদ্ধতা

OpenRouter-এর নির্বাচিত Nemotron reasoning model-এ Agent phase প্রায় 143.53s এবং resume 22.56s। অন্য সফল selected model-গুলোর Agent phase প্রায় 9.66–21.46s; resume প্রায় 4.32–5.43s। একবারের mixed-model synthetic measurement থেকে gateway overhead বা model-independent speed ranking নির্ধারণ করা যায় না।

OpenRouter-এর পাঁচটি matched accepted call-এ recorded inclusive input 61387, cache read 26112 ও output 5690। Incoming requests-এ low effort ছিল। Reasoning detail শুধু দুই row-তে জানা—সেখানে 278 tokens; বাকি unknown-কে zero বা সব output-কে reasoning বলা হয়নি। Trivial final marker-এর আকার দিয়ে child/progress/reasoning-সহ পুরো workload-এর token use বিচার করা যায় না। এই run অপ্রয়োজনীয় replay বা duplicate billing প্রমাণ করে না এবং ওই model-এর performance অন্য model-এর সমান—এমন দাবি নেই।

এই CLI call rows-এ native session/cache-group tags অনুপস্থিত। তাই actual child result ও full saved history continuity যাচাই হলেও এই rows দিয়ে server affinity/cache-group isolation প্রমাণ করা হয়নি। Concurrent multi-child fan-out, compaction, arbitrary cancellation এবং hosted tools-এর প্রতিটি provider/model combination নতুন করে পরীক্ষা হয়নি। পূর্বের source regressions-এর PASS আলাদা evidence।

## Resource ও safety

Ordinary QA family RSS cap 3072 MiB, 10 GiB system reserve; fresh 30-second quiet admission, normal pressure, physical headroom অন্তত 13 GiB, boot free অন্তত 20 GiB ও T7 mounted দরকার ছিল। Completed runs-এর সর্বোচ্চ observed child-family RSS **998.41 MiB**, সর্বনিম্ন physical headroom **14.059 GiB**, swap growth **0 GiB**। অন্য app/session বন্ধ হয়নি।

Source application fix, full build/pack/install/deploy, root ingress/LaunchDaemon change, sudo, quota clearing, git push বা T7 write/delete হয়নি। QA helper-এর parser ও route expectation সংশোধন private task cache-এ; repository-তে শুধু sanitized acceptance documentation যোগ হয়েছে।

## বাকি কাজ ও অনুমোদিত follow-up

Direct `claude/claude-haiku-5-5` request-এ cached quota 429 এসেছে; Agent বা resume acceptance হয়নি। Error থেকে আনুমানিক earliest reset **2026-10-18 08:00 UTC / 14:00 Asia/Dhaka**। এটি external subscription quota-এর স্বাধীন যাচাই নয়। ওই সময়ের আগে Claude retry নয়; পরে বর্তমান eligibility বা নতুন reset evidence মানতে হবে।

ব্যবহারকারীর স্পষ্ট অনুমতিতে existing `omniroute-build-deployment` follow-up **ACTIVE** করা হয়েছে। পরের run latest progress/matrix পড়ে শুধু অবশিষ্ট Claude test করবে, fresh resource admission ও একই 3 GiB cap মেনে। Quota/cooldown clear নয়। Failed first receipt অক্ষত রেখে নতুন attempt directory ব্যবহার করবে। Meaningful change ছাড়া unchanged waiting notification নয়।

Claude acceptance পাওয়ার পরে নতুন matrix/receipt এবং এই report-এর current state আপডেট হবে। Actual target checks সম্পূর্ণ হলে follow-up বন্ধ হবে। নতুন প্রমাণিত application defect ছাড়া build/deploy দরকার নেই; নতুন full build/deploy, root/sudo বা push-এর আগে পৃথক অনুমতি প্রয়োজন।

## Local evidence index

Private task directory: `~/Library/Caches/NexaLance/omniroute-native-harness-2026-10-18/`। Raw payload, transcript, screenshot, session identifier ও private URL এই public-safe document-এ copy করা হয়নি।

- `native-provider-matrix-v1.json`, `scope-progress-v4.json` — বর্তমান সাত PASS ও একটি quota-blocked entry।
- `artifact-comment-reconnect-ui-v1.json`, `own-artifact-reconnect-B.png` — actual own UI result ও proof image।
- `comment-b-targeted-call-verification-v1.json` — exact own marker এবং actual routed provider।
- Per-provider `receipt.json` বা GLM-এর `receipt-v2.json`, final `provider-trace-verification-v3.json` বা `v4.json` — stdout/receipt hashes, direct ও asynchronous child result, saved-resume continuity।
- `provider-agy-card-v1/provider-trace-verification-v4.json` — actual stored agy-card connection pin comparison।
- `provider-harness-usage-and-identity-v2.json` — সীমিত নিজের accepted-call usage; absent identity tags unknown রাখা হয়েছে।
- `official-client-fingerprints-comparison-v2.json` — নির্বাচিত চারটি file unchanged।
- `follow-up-resume-authorized-v1.json`, `follow-up-next-step-v1.json` — অনুমতি, reset gate ও প্রস্তুত bounded next attempt।

আগের source/build/deployment evidence ও অসম্পূর্ণ direct-native cost/latency baseline-এর জন্য [মূল review](NATIVE-HARNESS-REVIEW-2026-10-18.md) দেখুন। Client feature/protocol boundary-এর primary reference: [Gateway protocol](https://code.claude.com/docs/en/llm-gateway-protocol), [Subagents](https://code.claude.com/docs/en/sub-agents)।
