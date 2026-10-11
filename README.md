# omniroute-optimizer

Jillur Rahman / NexaLance-এর OmniRoute optimization ও fixing overlay। OmniRoute-এর pristine upstream source অপরিবর্তিত রেখে custom পরিবর্তনগুলো `nexa/` folder-এ রাখা হয়েছে।

## সংরক্ষিত source

| বিষয়                    | মান                                        |
| ----------------------- | ------------------------------------------ |
| Source repository       | `developerjillur/OmniRoute`                |
| Source branch           | `nexalance`                                |
| Source commit           | `b03f80bca5656e397db13235edf5093039383882` |
| Upstream version        | `3.8.51`                                   |
| Pristine upstream base  | `c1e30b7676975feb298b49eff6ff58923c04b89e` |
| `nexa/` tree SHA        | `cf8ea53748c20e6d843928a5e95551693b880efd` |
| Versioned overlay files | 310                                        |

`nexa/`-এর সব 310টি file মূল source commit-এর সঙ্গে byte-for-byte মিলে। প্রতিটি file-এর path, size, mode, Git blob SHA ও SHA-256 [overlay-inventory.json](overlay-inventory.json)-এ আছে। Manifest-এর 237টি entry-তে 148টি patch, 84টি নতুন file এবং 5টি tooling entry আছে; অন্যান্য tracked file-এ deployment scripts, tests ও documentation রয়েছে।

## কী রয়েছে

- Native Claude request, cache TTL, session/account continuity, sparse Thread continuation, effort ও streaming usage accounting-এর fixes এবং regression tests।
- Compression বন্ধ করার configuration policy ও management script। Live policy প্রয়োগ আলাদা authenticated operation।
- Model switch/restart-এর পরে native tools ও context replay সংরক্ষণ, valid silent prompt suggestion-কে অকারণে retry না করা, এবং cross-provider advisor/WebSearch সীমা স্পষ্টভাবে জানানোর fixes। Anthropic-hosted feature-এর সমান support এতে দাবি করা হচ্ছে না।
- Cache-health diagnostics, quota-aware selection, quota refresh/deduplication এবং model catalog cache-এর fixes।
- Google connection routing ও verification-state handling, native Agent Bridge TLS/DNS/lifecycle, CLI ও packaging-এর fixes।
- Bounded build, isolated package smoke, database snapshot, deployment ও rollback scripts।
- পূর্বের QA evidence, source validation notes এবং overlay পরিচালনার documentation।

## সর্বশেষ সংরক্ষিত fixes — ২০২৬-১০-১১

- Native deferred discovery marker-কে callable tool হিসেবে পাঠানো বন্ধ; আসল connector schema ও tool history সংরক্ষণ।
- Bridge Stop/Restart-এ elevation prompt এবং verified DNS cleanup; hosts/custom inventory পড়া বা DNS cleanup ব্যর্থ হলে listener চালু থাকে। Partial IPv4/IPv6 entry-ও সরানো হয়।
- GPT → Claude → GLM mapping ও নতুন deferred MCP connector-এর পরের request-এ transport continuity regression। Optional suggestion-এর completed hidden reasoning edge case সংশোধন।
- Real native connector QA: ১৮টি callable binding-এর মধ্যে ১৭টিতে পরীক্ষিত read-only operation PASS; Vercel আংশিক। বিস্তারিত সীমা ও তিনটি routing প্রশ্নের উত্তর: [NATIVE-CONNECTORS-2026-10-11.md](nexa/docs/NATIVE-CONNECTORS-2026-10-11.md)।

- GPT Responses translation-এ model-supported নির্বাচিত reasoning effort, `max`-সহ, ঠিকভাবে pass করা। Regression: [gpt-selected-effort-passthrough.test.ts](nexa/new/tests/unit/gpt-selected-effort-passthrough.test.ts)।
- Buffered GPT response-এ প্রকৃত context-overflow error সংরক্ষণ করা, যাতে সেটি misleading empty-response failure না হয়। Regression: [native-context-overflow-error.test.ts](nexa/new/tests/unit/native-context-overflow-error.test.ts)।
- Native MCP tool schema-র unsupported lone-surrogate regex GPT-compatible projection-এ রূপান্তর; বৈধ constraint ও original native schema সংরক্ষণ। Regression: [codex-tool-unicode-pattern.test.ts](nexa/new/tests/unit/codex-tool-unicode-pattern.test.ts)।
- Agent Bridge-এর paired `undici` fetch/dispatcher, bounded buffered deadline, streaming cancellation এবং পৃথক timeout/transport errors। এতে native `/compact`-এর reproduced transport failure সংশোধিত হয়েছে। Regression: [agent-bridge-compaction-timeout.test.ts](nexa/new/tests/unit/agent-bridge-compaction-timeout.test.ts)।
- Isolated deployment smoke-এ actual selected provider/model নির্ধারণ ও শনাক্ত করা। Regression: [smoke-model.test.mjs](nexa/deploy/smoke-model.test.mjs)।

বর্তমান source `b03f80bca`-এর full production build, 620 static pages, dashboard/CLI/package/Bridge এবং connector gates PASS। Full TypeScript ratchet-এ 5826 error ≤ 5830 baseline; এটি zero-error full typecheck নয়। Core typecheck ও focused lint PASS। Discovery/suggestion group 107, mapping group 18, DNS/Stop group 46 এবং UI group 18 PASS; group-গুলোর overlap আছে। Verified artifact দিয়ে local production deployment সম্পন্ন হয়েছে ২০২৬-১০-১১, ঢাকা সময় ২০:০১:২৬-এ; deployed runtime SHA `b03f80bca`। সম্পূর্ণ আগের runtime ও consistent database snapshot সংরক্ষিত ও যাচাইকৃত। বিস্তারিত: [RELEASE-2026-10-11.md](reports/RELEASE-2026-10-11.md)।

বর্তমান `b03f80bca` runtime-এ rejected Mixar schema, native deferred placeholder ও আসল ToolSearch-সহ trusted native TLS probe HTTP 200 পেয়েছে। Trace-এ actual target `codex/gpt-6.1-sol` এবং নির্বাচিত/upstream effort `low` → `low` যাচাইকৃত। VS Code/installed Claude Code `2.1.296` ও Claude Desktop bundled engine `2.1.295`-এ পৃথক real session-এর seed → `/compact` → resume PASS; compaction যথাক্রমে 23.223 ও 22.533 সেকেন্ড। প্রতিটিতে একটি compact boundary এবং summary/resumed response-এ আগের marker retained। Original giant conversation বা iPhone GUI হুবহু replay করা হয়নি; target model-এর প্রকৃত context limit এবং external upstream outages-এর সীমা থাকে।

এই GitHub snapshot-এ application source, regression coverage ও সংক্ষিপ্ত release report সংরক্ষিত; private request logs, account inventory, credentials বা local database অন্তর্ভুক্ত নেই। Release-এর সফল package ও স্থানীয় detailed evidence আলাদাভাবে সংরক্ষিত আছে; publication-এর জন্য সফল build পুনরায় চালানো হয়নি।

মূল layout ও tooling: [nexa/README.md](nexa/README.md)। Deployment ও rollback: [nexa/deploy/README.md](nexa/deploy/README.md)। Native Thread ও usage fixes-এর evidence: [nexa/docs/NATIVE-THREAD-USAGE-2026-10-07.md](nexa/docs/NATIVE-THREAD-USAGE-2026-10-07.md)।

## ব্যবহার

এই repository-তে overlay রয়েছে; সম্পূর্ণ OmniRoute application source ও dependencies আলাদাভাবে প্রয়োজন।

1. একটি isolated OmniRoute checkout-এ উপরের pristine upstream base নিশ্চিত করুন। Overlay engine-এর `upstream-main` local ref ওই base-এ থাকতে হবে। অন্য upstream version ব্যবহার করলে আগে patch compatibility যাচাই করুন।
2. সেই checkout-এ `nexa/` folder কপি করুন। আগে থেকে `nexa/` থাকলে তার changes ও backup যাচাই করুন; সরাসরি overwrite করবেন না।
3. **OmniRoute checkout-এর root থেকে** inventory ও patch compatibility যাচাই করুন:

   ```sh
   node nexa/status.mjs
   node nexa/apply.mjs --check
   ```

4. Build/deployment-এর আগে [versioned deployment runbook](nexa/deploy/README.md) অনুসরণ করে memory pressure, swap, disk, process budget, validation ও rollback gates যাচাই করুন। Existing verified artifact থাকলে সেটি পুনর্ব্যবহার করুন।

Application-এ পরিবর্তন শুধু overlay apply-এর সময় হয়। Applied checkout থেকে source commit করবেন না; pristine state ফিরিয়ে যাচাই করুন। Commit-এর normal hooks চালু রাখুন। এই repository upload কোনো নতুন build, deployment বা live QA-এর প্রমাণ নয়; dated documentation-এর evidence ও সীমা আলাদাভাবে পড়ুন।

## Scope ও license

এখানে tracked `nexa/` source আছে। Live database, API keys, OAuth credentials, secret environment, certificate private keys, runtime prefixes, build archives এবং local task caches অন্তর্ভুক্ত নেই। Account state ও production settings source snapshot থেকে পুনরুদ্ধার করা যাবে না।

OmniRoute-derived code-এর মূল MIT license [LICENSE](LICENSE)-এ অক্ষত রাখা হয়েছে; বিস্তারিত [NOTICE.md](NOTICE.md)-এ।
