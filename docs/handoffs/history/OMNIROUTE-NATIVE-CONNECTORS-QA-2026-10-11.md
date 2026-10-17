> **ঐতিহাসিক নথি — public copy, ২০২৬-১০-১৭।** মূল ঘটনার তারিখ ও ফল এই নথির নিজস্ব সময়ের জন্য প্রযোজ্য; পরের সংযোজন থাকতে পারে। বর্তমান অবস্থা ও কাজের নিয়মের জন্য [বর্তমান handoff](../CURRENT-STATUS-2026-10-17.md) পড়ুন। Private reference ও identifier সরানো হয়েছে; স্থানীয় evidence এখানে অন্তর্ভুক্ত নেই। পুরোনো cleanup, build, deploy বা service command বর্তমান অনুমতি হিসেবে ব্যবহার করবেন না।

# Native connector পরীক্ষা ও discovery সংশোধন — ২০২৬-১০-১১

রক্ষণাবেক্ষণ: Jillur Rahman

## পরীক্ষার সীমা

Claude native app-এর নিজস্ব Code session থেকে আসল MCP call চালানো হয়েছে। Agent Bridge দিয়ে পরীক্ষিত model route ছিল `codex/gpt-6.1-sol`; native tool result ও gateway trace আলাদাভাবে মিলিয়ে দেখা হয়েছে। প্রতিটি configured callable connection-এ ছোট read-only operation ব্যবহার করা হয়েছে। Media generation, cloud write, deployment, meeting join এবং সব tool-এর পূর্ণ কার্যকরী পরীক্ষা এই smoke test-এর অংশ নয়। Live GLM ফল হিসেবে এই GPT পরীক্ষা ব্যবহার করা যাবে না।

## ফল

| Connection                | আসল operation                             | ফল                                                                            |
| ------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------- |
| Higgsfield                | `models_explore`                          | PASS                                                                          |
| Higgsfield Bridge         | `get_host_status`, `bl_get_scene_summary` | PASS                                                                          |
| Blender Desktop extension | `get_blendfile_summary_datablocks`        | Port repair-এর পরে PASS                                                       |
| Custom `blender-official` | `get_blendfile_summary_datablocks`        | আলাদাভাবে PASS                                                                |
| Figma                     | `list_shaders`                            | PASS                                                                          |
| Gmail                     | `search_threads`                          | PASS; উদ্দেশ্যমূলক no-match query                                             |
| Google Drive              | `search_files`                            | Normal reconnect-এর পরে PASS                                                  |
| Netlify                   | `netlify-user-services-reader`            | PASS                                                                          |
| Vercel                    | `list_teams`, `get_auth_user`             | আংশিক: teams PASS; profile endpoint `GET /v2/user` থেকে `404: User not found` |
| Zoom for Claude           | `search_describe_capabilities`            | Normal reconnect-এর পরে PASS                                                  |
| Claude in Chrome          | `list_connected_browsers`                 | PASS                                                                          |
| context7                  | `resolve-library-id`                      | PASS                                                                          |
| memory                    | `search_nodes`                            | PASS; উদ্দেশ্যমূলক no-match query                                             |
| Mixar                     | `scene_overview`                          | Startup শেষ হওয়ার পরে PASS                                                    |
| Claude Docs               | `guide`                                   | PASS                                                                          |
| visualize                 | `read_me`                                 | PASS                                                                          |
| scheduled-tasks           | `list_scheduled_tasks`                    | PASS                                                                          |
| NexaConnect Production    | `nexa_list_inbox`                         | Normal reconnect-এর পরে PASS                                                  |

অর্থাৎ ১৮টি callable binding-এর মধ্যে ১৭টিতে পরীক্ষিত read-only operation PASS; Vercel-এ একটি operation PASS ও অন্যটি FAIL। এটি সব connector-এর সব feature ত্রুটিমুক্ত হওয়ার দাবি নয়।

`GitHub Integration` settings-এ connected হলেও এই native Code session-এর discovery-তে GitHub connector-এর callable schema পাওয়া যায়নি; `github` search-এ শুধু unrelated `Monitor` tool ফিরেছে। `october-bus-static` inventory-তে connected কিন্তু tool count শূন্য। এই দুই binding-এর functional PASS দাবি করা হয়নি। Auth না দেওয়া plugin template-গুলো নতুন করে configure বা enable করা হয়নি।

## Blender port conflict

Official Blender MCP ও Higgsfield local bridge দুটোই `9876` ব্যবহার করছিল। Higgsfield-এর socket secret দরকার; official MCP সেই আলাদা protocol-এর secret পাঠায় না। তাই official tool-এর response ছিল `Authentication failed`। এটি Google account বা Claude login-এর authentication error নয়।

Blender preferences-এর verified backup রেখে official MCP-এর `127.0.0.1:9876`, Auto Start এবং delay `0.0` সংরক্ষণ করা হয়েছে। অনুমোদিত reconnect-এর পরে Higgsfield তার বিদ্যমান fallback ব্যবহার করে `127.0.0.1:9877` নিয়েছে। Authentication দুর্বল করা বা vendor extension code পরিবর্তন করা হয়নি। দুটো native connector এবং custom official connection পুনঃপরীক্ষায় সফল। Scene/object count ও project dirty state অপরিবর্তিত ছিল। অন্য চলমান কাজের কারণে পুরো Blender বন্ধ করে cold-start পরীক্ষা করা হয়নি; restart persistence-এর পূর্ণ QA এখনও আলাদা gate।

## Cross-provider discovery fix

Native client-এর `DeferredToolPlaceholder` একটি non-executable deferred-loading marker। আগের translator একে GPT/GLM-এর callable function হিসেবে পাঠাত। Live trace-এ GPT সেই নাম call করেছে, এবং native client `No such tool available: DeferredToolPlaceholder` ফিরিয়েছে।

`open-sse/translator/request/claude-to-openai.ts`-এর overlay patch এখন পরিচিত marker-এর name, description, `defer_loading` ও empty schema একসঙ্গে মিলিয়ে সেটি বাদ দেয়। আসল `ToolSearch`, loaded MCP schema, tool reference এবং historical result অক্ষত থাকে। একই নামের genuine custom operation বাদ পড়ে না। Marker-কে জোর করে নির্বাচন করলে upstream dispatch-এর আগেই পরিষ্কার `400 unsupported_feature` হয়। Native Anthropic passthrough বদলায় না।

## Optional suggestion-এর সীমিত সংশোধন

QA-র conversation history বহনকারী auxiliary next-prompt suggestion request-এও `502` পাওয়া গেছে। Retained artifact-এর কিছু field truncated হওয়ায় প্রতিটি পুরোনো failure-এর সম্পূর্ণ upstream completion state পুনরুদ্ধার করা যায়নি।

একটি নির্দিষ্ট সমস্যা streaming ও non-streaming test দিয়ে পুনরুৎপাদিত হয়েছে: সফল `response.completed`-এ empty-summary reasoning item এবং খালি assistant text থাকলেও suggestion guard একে error ধরত। Guard এখন শুধু ওই completed, non-visible reasoning item মেনে নেয়। Ordinary task-এর empty output, incomplete transport, upstream error ও actual tool call-এর নিয়ম অক্ষত। এই edge-case fix-কে সব ঐতিহাসিক `502`-এর প্রমাণিত কারণ বা সমাধান বলা যাবে না।

## Build-এর আগে তিনটি routing প্রশ্ন

### Agent Bridge বন্ধ করলে

Claude Code card-এর `Stop DNS` শুধু ওই agent-এর intercepted hostname সরায়। Global `Stop` পুরো Bridge listener বন্ধ করার আগে সব managed hostname সরানোর কথা। সঠিকভাবে DNS সরলে নতুন native request সরাসরি Anthropic-এ যায়; তখন Claude-এর নিজস্ব login, model availability ও allowance প্রযোজ্য। Connector-এর authentication, MCP server, installed skill বা chat history শুধু Bridge বন্ধ করার কারণে মুছে যায় না।

ইতিমধ্যে চলা request, reused HTTPS connection বা client DNS cache সঙ্গে সঙ্গে নতুন পথে নাও যেতে পারে; প্রয়োজন হলে স্বাভাবিক reconnect করতে হবে। আলাদাভাবে নির্ধারিত `ANTHROPIC_BASE_URL` বা `HTTPS_PROXY` শুধু `Stop DNS` দিয়ে বদলায় না। তাই এগুলো থাকলে Bridge বন্ধ করেই direct route হয়েছে বলা যাবে না।

Source review ও isolated regression-এ তিনটি Stop সমস্যা পাওয়া গেছে: managed-host cleanup error উপেক্ষা করা, প্রয়োজনীয় elevation ছাড়াই listener বন্ধ করা, এবং IPv4/IPv6-এর একটি entry অবশিষ্ট থাকলে সেটি বাদ পড়ে যাওয়া। Fix-এ global Stop/Restart বিদ্যমান password flow ব্যবহার করে; hosts file/custom-host inventory পড়তে বা DNS সরাতে ব্যর্থ হলে Stop error দেয় এবং listener ও enabled intent রেখে দেয়। DNS সত্যিই পরিষ্কার হয়েছে যাচাইয়ের পরে listener বন্ধ হয়। Failed-start rollback-এর best-effort নিয়ম বজায় আছে।

### GPT থেকে Claude-এ mapping বদলালে

একই source row-এর target বদলে `Save mappings` করলে পরের request নতুন target ব্যবহার করে; আগে থেকে চলা request তার নির্বাচিত route-এই শেষ হয়। Bridge restart দরকার হয় না। Conversation-এর native tool-use/result history, নতুন connector schema, client effort, query ও session header transport-এ অক্ষত থাকার isolated TLS পরীক্ষা PASS। Fixture-এর target ছিল `cx/gpt-6.1-sol` → `claude/claude-sonnet-5-5` → `glmt/glm-5.3-max`। SQLite mapping ও namespace-sync regression-ও আলাদাভাবে পরীক্ষা হয়েছে।

এটি তিনটি actual provider-এ একই live conversation চালানোর প্রমাণ নয়। নতুন provider-এ আগের prompt cache ভাগ হয় না; প্রথম request-এ বেশি context পড়তে হতে পারে। Context window, supported effort এবং provider-specific/server-only tool সমান ধরে নেওয়া যাবে না। Native app-এর প্রদর্শিত source-model নাম থেকে আসল target নিশ্চিত করা যায় না; gateway-এর selected provider/model দেখতে হবে।

### নতুন connector যোগ করলে

Connector Code session-এ authenticated, enabled এবং callable schema হিসেবে প্রকাশিত হলে সেটি client থেকে Bridge হয়ে নির্বাচিত model-এ যায়; Bridge-এ প্রতিটি connector-এর জন্য আলাদা allowlist নেই। নতুন deferred MCP operation এবং তার historical result পরের request-এ অক্ষত যাওয়ার TLS fixture PASS। `DeferredToolPlaceholder` fix executable operation ও non-executable discovery marker আলাদা রাখে।

শুধু settings-এ connected লেখা functional প্রমাণ নয়: এই run-এ GitHub-এর callable schema অনুপস্থিত এবং একটি custom binding-এর tool count শূন্য ছিল। Schema না এলে connector refresh/reconnect বা নতুন session লাগতে পারে; OAuth expiry, MCP/server error এবং provider tool incompatibility পৃথকভাবে ঠিক করতে হয়। বর্তমান official documentation অনুযায়ী Desktop-এর local Code session `claude_desktop_config.json` থেকেও MCP server নেয়; standalone CLI ওই file সরাসরি পড়ে না। তাই CLI ও Desktop-এ একই connector পাওয়া যাচাই করতে হবে, আলাদা config হওয়াকেই সব discovery failure-এর কারণ ধরে নেওয়া যাবে না। Session-এর আগে বা চলার সময় connector যোগ করার সমর্থন এবং configuration-এর নিয়ম: [Desktop application](https://code.claude.com/docs/en/desktop), [MCP connections](https://code.claude.com/docs/en/mcp)।

অন্য native কাজ তখন চলছিল বলে production Bridge বন্ধ করা বা operator mapping বদলে সেটিকে live পরীক্ষা বলা হয়নি। আসল connector read-only ফল উপরের table-এ; routing switch ও failure-path ফল isolated fixture থেকে। নতুন source-এর build/promotion/postdeploy gate এখনও প্রযোজ্য।

## Validation evidence

- Discovery/suggestion/translation group: `final-source-validation-v4.log`-এ ১০৭টি PASS; ওই group-এর core typecheck-ও PASS।
- Saved mapping, SQLite alias sync, native TLS transport এবং selected DNS group: `switching-connector-v1.log`-এ ১৮টি PASS।
- Final DNS/Stop, incomplete hosts entry, unreadable hosts/custom inventory, failed-start rollback ও lifecycle group: `stop-dns-final-v1.log`-এ ৪৬টি PASS।
- Stop/Restart-এর password submit ও cancel, page এবং server card UI group: `stop-password-ui-v1.log`-এ ১৮টি PASS।
- Applied-source explicit-any budget এবং পরিবর্তিত source/test-এর focused ESLint PASS; focused lint-এ অন্য file-এর unused suppression prune করা হয়নি।

Group-গুলোর কিছু test overlap করে; সংখ্যাগুলো যোগ করে unique test total বলা যাবে না। Full-scope TypeScript ratchet, নতুন full production build এবং postdeploy verification এখনও release gate। নতুন routing fix-এর code upstream file-এ স্থায়ীভাবে রেখে দেওয়া হয়নি; overlay patch ও new-file mirror-ই distribution source।

## সংরক্ষণ ও release gate

Source সংশোধন শুধু `nexa/patches/` ও `nexa/new/`-এ সংরক্ষিত। Applied validation tree restore করে pristine upstream guard ও normal commit hooks মানতে হবে। নতুন package build, isolated smoke, rollback preservation, promotion এবং postdeploy native QA না হওয়া পর্যন্ত এই source fix deployed হিসেবে গণ্য হবে না। আগের successful release artifact, runtime ও database এই পরিবর্তনের অংশ হিসেবে মুছতে হবে না।

স্থানীয় evidence directory: `~/Library/Caches/NexaLance/omniroute-native-connectors-2026-10-11`। সেখানে tool result-এর hash, sanitized status, source validation, preferences backup ও resource watchdog receipt রয়েছে; credential বা private OAuth URL report/export-এ রাখা হয়নি।


## Source ও publication receipt — 2026-10-11T19:40:14+06:00

Local `nexalance` source commit: `b03f80bca5656e397db13235edf5093039383882`; private optimizer `main`: `c8bf669c8e229dd0573b40107c0543e137656cd3`। ৩১০টি tracked `nexa/` file-এর content, mode, blob ও SHA-256 source-এর সঙ্গে মিলেছে; tree `cf8ea53748c20e6d843928a5e95551693b880efd`; Gitleaks: no leaks found। Normal source commit hooks PASS, source checkout clean এবং upstream pristine। Current core typecheck PASS (peak 1244 MiB, cap 1792 MiB)। নতুন full-scope ratchet, full production build, promotion ও postdeploy QA এখনও হয়নি। এই publication কোনো deployment completion নয়।

Resource interruption/preflight refusal-এর আগের receipt ও log সংরক্ষিত; guard bypass করা হয়নি। Initial QA-র own process pressure-এ থেমেছিল; পরে bounded run-এ পরীক্ষিত connector call-গুলো সম্পন্ন হয়। এই run-এ অন্য app, render বা unrelated session বন্ধ করা হয়নি। Blender cold-start persistence, Vercel profile error এবং tool schema না পাওয়া binding-গুলোর সীমা উপরে স্পষ্ট আছে।


---

# Production release ও native connector যাচাই — ২০২৬-১০-১১

Jillur Rahman / NexaLance

Source `b03f80bca5656e397db13235edf5093039383882`, OmniRoute `3.8.51`। Local production runtime `b03f80bca` deploy সম্পন্ন: `2026-10-11T14:01:26.192Z` / ঢাকা সময় ২০:০১:২৬।

## Build ও package

- Full production pipeline exit `0`; 620 static pages, dashboard gate, CLI API/command generation, artifact validation, npm pack, strict Bridge gate, compaction transport/source gate ও connector package gate PASS।
- Core typecheck ও focused lint PASS। Full TypeScript ratchet `5826 ≤ 5830` baseline PASS; বিদ্যমান TypeScript errors শূন্য হয়েছে এমন দাবি নয়।
- বর্তমান focused regression group: discovery/suggestion 107, mapping 18, DNS/Stop 46 এবং UI 18 PASS। Group-গুলোর overlap আছে; এগুলোর সংখ্যা যোগ করে unique test count দেখানো হয়নি।
- এক worker, webpack parallelism 1, heap 5120 MiB, total process cap 8192 MiB, semispace 8, `RAYON_NUM_THREADS=1`; Desktop build/deploy flags 0।
- পুরো build job-এর peak total RSS 7622 MiB; minimum physical headroom 20.403854 GiB; memory pressure স্বাভাবিক এবং swap বৃদ্ধি 0।
- Overlay ও generated CLI files নির্ভুলভাবে restore করার পরে source clean/pristine। সফল build বা package পুনরায় চালানো হয়নি।

| Artifact | যাচাইকৃত মান |
| --- | --- |
| File | `omniroute-3.8.51.tgz` |
| Bytes | `99631494` |
| SHA-256 | `ddbe2864eada761afed7d597ca0b7a1746939804be9ca620eb09b63c5da63048` |
| Archive `dist/BUILD_SHA` | `b03f80bca` |

## Deployment ও সংরক্ষণ

Verified artifact দিয়ে নতুন bounded updater ব্যবহার করে isolated package install, real Anthropic-format inference, management/schema/CORS gate, consistent SQLite snapshot, সম্পূর্ণ আগের runtime preservation, promotion ও health verification PASS। Real smoke target `codex/gpt-6.1-sol`।

Deployment peak RSS 1481 MiB; minimum physical headroom 23.723328 GiB; pressure স্বাভাবিক, swap বৃদ্ধি 0; watchdog stop বা promotion-এর মধ্যে parent termination হয়নি।

Postdeploy integrity-এর 16টি check PASS: runtime SHA, provider ও operator state, API keys, Bridge mappings, retained usage, health, certificate material, native intent/targets/bypass semantics, installed source/package match, আগের সম্পূর্ণ runtime-এর identity/counts/bytes/critical hashes, আগের package, current pointer, consistent database snapshot এবং clean/pristine source। Account enable, quota reset বা verification clearing করা হয়নি।

আগের `e26be697f` runtime ও সফল package, database snapshot এবং নতুন সফল package স্থানীয় protected storage-এ রাখা হয়েছে। Private database, account identity, API values, raw request logs বা certificate keys এই repository-তে নেই।

## বর্তমান runtime-এ real native QA

| পরীক্ষা | ফল ও সীমা |
| --- | --- |
| Trusted native TLS | Native Claude alias → actual `codex/gpt-6.1-sol`, HTTP 200, exact response marker; selected/upstream effort `low → low`; trace checksum যাচাইকৃত। |
| Native schema acceptance | Original problematic Mixar regex, deferred placeholder ও আসল ToolSearch-সহ request গ্রহণ করেছে। Placeholder filtering source/package regression-এ যাচাইকৃত; captured trace upstream-এর পূর্ণ translated tool list দেখায় না। |
| VS Code / installed CLI `2.1.296` | পৃথক real session-এ seed → `/compact` → resume PASS; compaction 23.223 s; একটি compact boundary, summary ও resumed response-এ marker retained। |
| Desktop bundled engine `2.1.295` | পৃথক real session-এ seed → `/compact` → resume PASS; compaction 22.533 s; একটি compact boundary, summary ও resumed response-এ marker retained। |
| Claude native GUI / Higgsfield | ToolSearch দিয়ে discovery এবং `models_explore` read-only call PASS; model result পাওয়া গেছে। |
| Claude native GUI / Blender | Higgsfield Bridge `get_host_status`: Blender `true`; `bl_get_scene_summary` এবং official `get_blendfile_summary_datablocks`: উভয়ে 3টি scene object পেয়েছে। আসল tool results ও request trace দিয়ে মিলিয়ে দেখা হয়েছে। |
| Native GUI routed effort | Main tool-call requests-এর actual target `codex/gpt-6.1-sol`; selected/upstream effort `xhigh → xhigh`। আলাদা no-tool auxiliary request `gpt-6-luna`-তে গেছে; সেটিকে main request-এর routing ফল বলা হয়নি। |

CLI QA-তে isolated config ব্যবহার হয়েছে; official CLI configuration বদলানো হয়নি। Saved Desktop history reopening-এর পরে দেখা গেছে। আগের active turn নিজে থেকে চলবে এমন নিশ্চয়তা নেই; প্রয়োজন হলে operator-কে resume করতে হবে।

## Blender cold start

Postbuild reopening-এ official MCP Auto Start এবং Higgsfield MCP control বন্ধ পাওয়া যায়। বর্তমান preferences-এর backup নিয়ে আগের অনুমোদিত connector setup ফিরিয়ে দেওয়া হয়েছে। এরপর সব QA Blender instance স্বাভাবিকভাবে quit করে একটি cold launch-এ কোনো manual service start ছাড়াই:

- Official MCP: `127.0.0.1:9876`, Auto Start `true`, running `true`, startup error খালি।
- Higgsfield Bridge: `127.0.0.1:9877`, enabled/authenticated/running `true`, error নেই।
- Native Claude GUI-তে remote host `true` এবং দুই connector-এর scene read PASS।

মাঝের একটি পরীক্ষায় দ্বিতীয় Blender instance দেখা যায়; সেই পরীক্ষার Bridge worker state PASS ছিল না। সেটির evidence রাখা হয়েছে এবং single-instance cold restart দিয়ে নতুন করে যাচাই করা হয়েছে। Preference বন্ধ হওয়ার মূল কারণ বা দ্বিতীয় instance কে খুলেছে—এগুলো নিশ্চিত করা হয়নি। এই preference repair স্থানীয় connector configuration; versioned `nexa/` source বদলায়নি।

## প্রমাণের সীমা

এটি সব model, সব tool এবং সব third-party integration-এর পূর্ণ feature parity প্রমাণ করে না। আগের 18 callable binding-এর read-only survey-তে 17টি PASS ও Vercel আংশিক ছিল; পুরো survey বর্তমান release-এ আবার চালানো হয়নি। Vercel `get_auth_user` 404, connected দেখালেও callable binding না থাকা connector, 0-tool binding এবং `needs_auth`/failed configuration-এর vendor/operator সমস্যা আলাদা থাকে।

Original giant conversation, iPhone UI বা সব provider/model-এর হুবহু replay হয়নি। Model context limit, reasoning behavior, external outage ও connector account permissions-এর প্রকৃত সীমা থাকে। নতুন build/deployment ও উপরের বাস্তব native tests সম্পন্ন; এই GitHub report-এ কেবল যাচাইকৃত সংক্ষিপ্ত ফল প্রকাশিত হয়েছে।

### স্থানীয় protected evidence ও rollback

- Build receipt: `~/.omniroute-builds/3.8.51-b03f80bca/full-build-receipt.json`। Artifact ও এই run-এর সফল `.build/dist` অক্ষত।
- Build/deploy/native evidence: `~/Library/Caches/NexaLance/omniroute-native-connectors-2026-10-11/release-b03f80bca/`।
- Previous complete runtime: `~/.omniroute-builds/runtime-backups/20261011-200008` — একই original directory identity; 116724 file, 12975 directory, 49 symlink, 2156061543 regular-file byte; critical hashes মিলেছে।
- Consistent SQLite backup: `~/.omniroute-local/update-backups/20261011-200008/storage.sqlite` — 1722032128 byte, integrity OK।
- Immediate pre/postdeploy provider 25, API key 3 ও mapping 14; ID/value/state fingerprints মিলে এবং retained usage 96325 অক্ষত। পরের real QA-তে নতুন usage যোগ হওয়া স্বাভাবিক। এই deployment কোনো account enable/config reset করেনি।
- `blender-userpref-before-cold-start-repair.blend` backup, restoration receipt, মধ্যবর্তী non-pass diagnostic এবং single-instance cold-restart PASS receipt সংরক্ষিত। নিজের QA scene নতুন internal path-এ রাখা হয়েছে; কোনো user scene overwrite/discard করা হয়নি।
- Build-এর আগে অনুমোদিত app-গুলো স্বাভাবিকভাবে quit এবং process absence যাচাই করা হয়েছে। Force-kill নয়। Production gateway/TLS/domain services রাখা হয়েছে। Native QA-তে Claude/Blender আবার খোলা হয়েছিল। Saved histories দেখা গেছে; স্বয়ংক্রিয় active-turn continuation নিশ্চিত নয়।
- Mixar-এর একটি new scene save attempt যাচাই হয়নি; সেটিকে saved বলা হচ্ছে না। Overwrite/Don’t Save নির্বাচন করা হয়নি।
- Private repository publication: `https://github.com/developerjillur/omniroute-optimizer`, commit `54caf416879ba768b38191766e7da13b9bb25408`; remote main মিলেছে, repository private। 310টি `nexa/` source file মূল source-এর hash/mode/tree-এর সঙ্গে মিলে। Gitleaks PASS। Normal commit; কোনো hook bypass বা public OSS push/PR নয়।
- Follow-up `omniroute-build-deployment` আগে থেকেই `PAUSED`; নতুন করে চালু করা হয়নি।


### শেষ verification — 2026-10-11T14:23:35.976602+00:00

Runtime `b03f80bca`, localhost ও `omni.local` health HTTP 200; final receipt-এর 17টি check PASS। Provider/operator state, 3 API key ও 14 mapping fingerprint অক্ষত। Retained usage 96325 থেকে পরের live traffic-এ 96381 হয়েছে; সব নতুন usage শুধু এই QA-এর বলে attribution করা হচ্ছে না। Certificate bytes ও Bridge configuration semantics অক্ষত; targets/bypass-এর generated timestamp বদলেছে। Own QA শেষে Claude ও Blender process অনুপস্থিত যাচাই করা হয়েছে। Main source clean/pristine, private GitHub main `54caf416879ba768b38191766e7da13b9bb25408`-এর সঙ্গে remote মিলে; Gitleaks PASS।

Final receipt: `~/Library/Caches/NexaLance/omniroute-native-connectors-2026-10-11/release-b03f80bca/release-final-receipt.json`। Evidence directory 2.9 MiB; সফল outputs, source ও rollback সংরক্ষিত।


## ২০২৬-১০-১২ — Native thinking signature fix, production ও real switch QA সম্পন্ন

GPT → Claude routing switch-এর `400 messages.N.content.M: Invalid signature in thinking block` failure-এর source fix `0c0d3b1d4` production-এ deployed। Missing/empty/synthetic thinking signature ও explicitly rejected thinking suffix native final dispatch/count_tokens-এ safely handled; valid native signature, সাধারণ history, tools/results ও effort preserved। Sparse Thread restore-এর পরেও fix চলে।

নতুন regression 15/15, related 376/376, MCP 493/493, core typecheck, focused lint এবং full ratchet `5826 ≤ 5830` PASS। Full Next compile ও 620 pages PASS; Finder `.DS_Store` metadata failure-এর পরে completed Next output দিয়ে packaging resume/gates PASS। প্রথম failed receipts সংরক্ষিত, Next compile repeat হয়নি। Verified artifact SHA-256 `8f26dcab9a7ce1b6d60deac0702cd07afe6c65ec503a2e1acd459ec663448854` (99593490 bytes)।

Production runtime `0c0d3b1d4`; health/native TLS ও 16 integrity checks PASS। 25 provider connections, 3 API keys, 14 mappings, operator states ও retained usage সংরক্ষিত। সম্পূর্ণ previous runtime এবং consistent database snapshot verified। অনুমোদিত 9+2 পুরোনো copies এবং task-created smoke DB verified archive হয়েছে; live data মুছে জায়গা করা হয়নি।

Real GPT ↔ Claude pending tool cycle, signed replay, rejected signature, count_tokens PASS। VS Code CLI `2.1.296` ও Desktop engine `2.1.295`-এ Read/Bash → switch → `/compact` → native resume → GPT reverse switch PASS; compact boundary একটি করে, prior marker retained। Native app-এ Higgsfield discovery, Bridge host/scene ও official Blender summary—চার read-only call success; দুই reader-এর same scene/442 object মিলে, saved `.blend` অপরিবর্তিত। Actual provider/effort trace checksums verified। GUI শেষে RAM reserve কমায় শুধু own QA turn-এ Stop পাঠানো হয়; সব results ও final response retained, অন্য session/service বন্ধ করা হয়নি।

Private GitHub source snapshot push: [`d9a4c33`](https://github.com/developerjillur/omniroute-optimizer/commit/d9a4c33069350171d7c19bbf0d1b23d832d511dd)। 314 tracked `nexa/` files source bytes/hash-এর সঙ্গে মিলে; secret scan PASS। বিস্তারিত evidence, paths, failure preservation ও সীমা: [OMNIROUTE-NATIVE-THINKING-SIGNATURE-2026-10-12.md](OMNIROUTE-NATIVE-THINKING-SIGNATURE-2026-10-12.md)। Original giant chat/iPhone UI এবং সব third-party feature-এর নিঃশর্ত parity test হয়নি।


শেষ যাচাই — ২০২৬-১০-১২ ঢাকা সময়: source main ও দুই internal child clean/pristine `0c0d3b1d4`; private GitHub-এর `nexa/` Git tree-ও হুবহু একই `6de575f468844841d0377598d03cc5dc48c34e75`। Verified artifact bytes/SHA-256 আবার মিলে, localhost ও omni.local health HTTP 200। Follow-up automation `PAUSED`। এই point-in-time check-এ memory pressure normal, physical headroom 11.51 GiB, internal disk free 15.12 GiB; completed QA-এর পরে আর নতুন heavy job শুরু হয়নি। বর্তমান free space পরের বড় কাজের 20 GiB admission threshold-এর নিচে থাকলে আগে আবার resource admission যাচাই প্রয়োজন। Final receipt: `final-release-verification-receipt.json`।
