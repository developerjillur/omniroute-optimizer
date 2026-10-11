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

স্থানীয় evidence directory: `/Users/developerjillur/Library/Caches/NexaLance/omniroute-native-connectors-2026-10-11`। সেখানে tool result-এর hash, sanitized status, source validation, preferences backup ও resource watchdog receipt রয়েছে; credential বা private OAuth URL report/export-এ রাখা হয়নি।
