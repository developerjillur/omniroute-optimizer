# Native usage audit — 2026-10-14

লেখক: Jillur Rahman

## বর্তমান অবস্থা

Retained data-এর read-only audit সম্পন্ন হয়েছে। নতুন usage/transport patches ও regression tests প্রস্তুত হচ্ছে; এগুলো এখনো application validation, full build, deployment বা native UI QA পাস করেনি। আগের runtime `0c0d3b1d4`-কে এই পরিবর্তনের deployment বলা যাবে না।

Audit window: `2026-10-06T18:00:00.000Z` থেকে `2026-10-14T10:29:06.166Z`। Private evidence: `/Users/developerjillur/Library/Caches/NexaLance/omniroute-usage-audit-2026-10-14`। Credential, prompt, private URL, signature বা hidden reasoning report-এ প্রকাশ করা হয়নি।

## Coverage ও সীমা

- Window-এর 99,570 usage-history row এবং 93,283 call-log row পরীক্ষা করা হয়েছে। Call metadata-তে 85,925 success ও 7,358 failure আছে; test traffic, cancellation ও missing Thread-ও এর মধ্যে আছে।
- 836টি native transcript-এর 12,219,221,117 byte prefix পড়া হয়েছে। Streamed blocks ও copied histories deduplicate করার পরে 75,372 response পাওয়া গেছে। 2টি oversized user record বাদ পড়েছে; oversized assistant candidate বা invalid assistant record পাওয়া যায়নি।
- 10,001 retained artifact reference ছিল। প্রথম scan-এ 9,954টি পাওয়া গেছে; পরের scan-এ retention-এর কারণে 9,922টি ছিল। পড়া artifact-এর size/FNV checksum মিলে গেছে এবং নতুন SHA-256 রাখা হয়েছে। Retention-এর বাইরে metadata থেকে হারানো raw payload পুনর্গঠন করা হয়নি।
- Gateway, ingress, native app ও launchd-এর 20টি retained log পরীক্ষা করা হয়েছে। কিছু native app log পুরোনো তারিখও ধরে রেখেছে; clock-only diagnostic line-এ কল্পিত UTC date বসানো হয়নি। Generic `429` text-কে rate-limit request হিসেবে গণনা করা হয়নি।
- Native raw-direct bypass-এর একই workload/model/effort/parallelism control নেই। শুধু মোট token বা cache ratio দেখে subscription quota-তে OmniRoute কত শতাংশ বেশি খরচ করেছে বলা যায় না। Historical `response_id`/retry metadata-র ঘাটতিও exact correlation সীমিত করে।

## নিশ্চিত usage ত্রুটি

### Sparse Thread usage-কে stateless request ধরে rewrite

Native continuation-এর `thread.type="continue"` এবং `thread.previous_message_id` server-side context বোঝায়। Existing sanity check এই reference চিনতে না পেরে ছোট wire body-এর বিপরীতে বড় provider-reported context-কে implausible ধরে local estimate বসায় এবং cache counters শূন্য করে। একই response-এর `usage.iterations`-এ original provider counters থেকে যায়।

51,350টি deduplicated response-এ valid iterations আছে; 36,401টিতে top-level native usage ও preserved iteration usage আলাদা। সব observed iteration array-এর length 1; কোনো actual compaction iteration পাওয়া যায়নি। তাই এই count-কে অতিরিক্ত generation/compaction request বলা যাবে না।

Unique model/output/time association-এ 46,439টি gateway row iteration usage-এর সঙ্গে মিলেছে। 36,137টিতে recorded cache read শূন্য হলেও preserved provider metering-এ cache read আছে। এটি heuristic association; 6টি exact response-ID association আলাদা করে রাখা হয়েছে।

Proposed change valid Thread reference-এর usage অপরিবর্তিত রাখে। Malformed/empty Thread ও stateless bogus-usage guards বহাল থাকে। Internal metering valid iterations থেকে সম্পূর্ণ request গণনা করে; native wire payload পরিবর্তন করে না।

### Stream input/cache accounting

Sparse final `message_delta`-র input count দিয়ে আগের inclusive total overwrite হতে পারে; translator cache creation-কে total input থেকে বাদও দিচ্ছিল। এতে cache write total input-এর চেয়ে বড় হয় এবং API-equivalent estimate/context display ভুল হতে পারে। নতুন helper raw fields presence অনুযায়ী cumulative counters merge করে, explicit zero সম্মান করে এবং cache creation একবারই inclusive input-এ রাখে। Thinking ইতোমধ্যে output-এর অংশ; আবার যোগ করা হয় না।

[Anthropic prompt-caching documentation](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) অনুযায়ী fresh input, cache read ও cache creation তিনটি আলাদা input dimension। [Threshold-compaction usage documentation](https://platform.claude.com/docs/en/build-with-claude/compaction-threshold) সম্পূর্ণ metering-এর জন্য iterations গণনা করতে বলে।

### Native tool-only content ও correlation

Native tool-only stream-এর বদলে chat-shaped empty summary দিয়ে `has_content=0` লেখা হচ্ছিল। Proposed change client-format native summary ব্যবহার করে, server/MCP tool blocks চিনতে পারে এবং successful native message ID exact future correlation-এর জন্য রাখে। Empty log summary-কে empty client response বা token waste বলা হয়নি।

## Transport replay: খরচের ঝুঁকি

Literal diagnostic marker অনুযায়ী pooled-dispatcher response-start timeout-এর 475টি replay line আছে: Anthropic host 137, OpenAI/ChatGPT 68, Z.ai 3, অন্য/অজানা 267। Host-only log সব request-এর method/path বা upstream acceptance ধরে রাখে না; তাই এগুলোকে 475টি duplicated generation বা billed charge বলা যায় না।

Source-এ serializable generation POST-ও headers/socket failure-এর পরে silently replay হচ্ছিল। প্রথম request accepted হলে নতুন POST দ্বিতীয় inference শুরু করতে পারে। Proposed guard ambiguous generation failure-এ replay বন্ধ করে; explicit DNS/connect failure এবং safe read recovery থাকে। Non-idempotent request caller deadline ব্যবহার করে, যাতে ছোট pooled-socket timer healthy slow generation বন্ধ না করে। এটি synthetic accepted-request regression দিয়ে যাচাই করতে হবে।

## বড় usage-এর বৈধ অংশ

Preserved iteration metering পাওয়া গেলে সেটি ব্যবহার করে deduplicated native totals:

| Dimension                         |         Tokens |
| --------------------------------- | -------------: |
| Fresh input                       |    128,767,737 |
| Cache read                        | 21,606,453,360 |
| Cache creation                    |    787,158,692 |
| Output, thinking-সহ               |     85,285,909 |
| Output-এর মধ্যে reported thinking |     35,396,799 |

44,371 response child session-এর; child output 54,948,082 এবং child cache creation 640,528,882। এগুলো native client-এর বাস্তব কাজ, gateway নিজের তৈরি duplicate হিসেবে চিহ্নিত করা হয়নি। Cache read-এর বড় সংখ্যা fresh input নয়। এই totals subscription invoice বা weekly allowance-এর হিসাব নয়।

বর্তমানে compression master এবং 12টি engine বন্ধ, semantic cache বন্ধ, native prompt cache/affinity চালু। Audit window-তে compression telemetry row নেই; current settings পুরো অতীতের configuration-এর স্বাধীন প্রমাণ নয়। Explicit requested public model নামের comparison-এ audio provider prefix ছাড়া unexpected model replacement পাওয়া যায়নি। Alias/combo/operator mapping ও account fallback আলাদা বিষয়।

## Error follow-up

`0c0d3b1d4` deployment-এর পরে Claude metadata-তে 500 missing-Thread 404, 62 disconnect/cancel 499, 6 content-stall 502, 10 timeout 504, 9 context-limit 400, 8 অন্য 400, 1 rate-limit 429 ও 5 অন্য 502 আছে। এগুলোর সবগুলো gateway defect বা wasted inference নয়। Missing Thread/hidden thinking progress/timeout recovery-এর আগের prepared fixes এখনও নতুন runtime-এ deploy হয়নি। আগের thinking-signature error deployment-এর আগে; পরের window-তে একই error পাওয়া যায়নি।

## বাকি release gate

1. নতুন regression-এর red/green reproduction, related native/usage/stream/transport tests, core typecheck, full lint ও full ratchet। আগের 273-test evidence নতুন affected source-এর validation নয়।
2. Exported overlay/manifest ও hook-পরের application hashes যাচাই, Jillur Rahman identity এবং normal hooks দিয়ে commit।
3. 18 GiB physical headroom ও অন্তত 20 GiB internal disk হলে নতুন immutable full dashboard/CLI/package/Bridge build। Desktop flags 0।
4. Snapshot/rollback, isolated Anthropic smoke, resource-bounded deployment ও installed ingress update; active request drain ছাড়া reload নয়।
5. বাস্তব Claude native app ও normal Claude Code session-এ Artifact create/edit/follow-up/reopen, thinking progress, full Thread replay, read-only tool/connector ও Claude/GPT/GLM regression। Native UI না দেখে UI success নয়।

Validation/deploy admission 13 GiB physical; full build 18 GiB। Apps বন্ধ করা, reserve কমানো বা পুরোনো artifact-কে নতুন build বলা অনুমোদিত নয়। Historical database rows rewrite করা হয়নি; corrected audit evidence আলাদা রাখা হয়েছে।

## Final source validation — 2026-10-14

<!-- final-source-gate-20261014T121059Z -->

Native regression 131/131, related usage/analytics/stream/transport regression 284/284, core typecheck এবং full ESLint PASS। Unchanged deployment regression 22/22 exact source/test/log hashes যাচাই করে reuse করা হয়েছে। Preserved old application baseline-এ native Thread usage এবং ambiguous POST replay-এর failing assertions reproduce হয়েছে।

Full TypeScript ratchet সম্পূর্ণ project মেপেছে: 5806 diagnostics, established baseline 5830; gate PASS, baseline বাড়ানো হয়নি। নতুন usage test-এর narrowing, exported usage payload type এবং SQLite row boundary typing সংশোধিত হয়েছে। Upstream-এর বিদ্যমান type backlog বজায় আছে; এই gate zero-error full typecheck দাবি করে না।

10 unused ESLint suppressions সরেছে; নতুন suppression বা widened allowance নেই। Full ratchet heap2560/RSS3072 এবং heap4096/RSS5120-এ SIGABRT/SKIP হওয়ায় প্রত্যাখ্যাত হয়েছিল। Jillur Rahman-এর explicit approval-এ শুধু full ratchet heap6144/RSS8192-এ চলেছে; অন্য validation/deploy cap3072MiB, reserve10GiB ও সব resource guards বহাল। Final ratchet peak 5195MiB।

Evidence: `validation-2026-10-14T12-10-59.202Z/validation-receipt.json`, exact prepared application hashes এবং compiler stdout/stderr retained। Source gate শেষে application base pristine restore হয়েছে। Commit hooks, full dashboard/CLI/package build, deployment এবং real native UI QA আলাদা evidence দিয়ে যাচাই হবে। Source validation বা audit থেকে native-equivalent billing কিংবা zero-extra-usage guarantee দেওয়া হয়নি।
