> **ঐতিহাসিক নথি — public copy, ২০২৬-১০-১৭।** মূল ঘটনার তারিখ ও ফল এই নথির নিজস্ব সময়ের জন্য প্রযোজ্য; পরের সংযোজন থাকতে পারে। বর্তমান অবস্থা ও কাজের নিয়মের জন্য [বর্তমান handoff](../CURRENT-STATUS-2026-10-17.md) পড়ুন। Private reference ও identifier সরানো হয়েছে; স্থানীয় evidence এখানে অন্তর্ভুক্ত নেই। পুরোনো cleanup, build, deploy বা service command বর্তমান অনুমতি হিসেবে ব্যবহার করবেন না।

# Claude Code CLI ও Claude native app — tools, integrations ও Skills QA

তারিখ: ২০২৬-১০-০৯। প্রস্তুতকারক: Jillur Rahman। প্রমাণ সংকলন: `2026-10-09T12:45:07.086451+00:00`।

## ফলাফল এবং বর্তমান release

মূল native tool continuity fix production-এ আছে: live runtime `770a768b1`। একই conversation-এ model বদলানোর পরে tools হারিয়ে যাওয়ার কারণ শনাক্ত, source fix, production deployment এবং প্রকৃত native app-এর সীমিত acceptance test সম্পন্ন হয়েছে। এই বিস্তৃত audit-এ CLI-তে তিন mapped route দিয়ে ১০টি feature category পরীক্ষা করে ৩০টির মধ্যে ২৬টি PASS পাওয়া গেছে। Native app-এর পুরো tool set-এর বাস্তব UI পরীক্ষা এখনও সম্পূর্ণ হয়নি।

বর্তমানে কার্যকর অতিরিক্ত fix: `claude-haiku-5-5 → cx/gpt-6.1-sol` auxiliary mapping এবং `nexa-blender` Skill metadata correction। Prompt-suggestion, advisor boundary ও hosted-search guard-এর পরবর্তী source release `6e3dd8d50` clean/pristine অবস্থায় প্রস্তুত; এটি production-এ নেই। এই তিন পরিবর্তনের সফল production artifact এখনও নেই।

`WebSearch` বর্তমান তিন cross-provider route-এ প্রয়োজনীয় search ফল ফেরত দেয়নি; `glmt/glm-5.3-max` image input প্রত্যাখ্যান করেছে। তাই “সব tool ও official Claude feature একেবারে একইভাবে কাজ করছে” বা “কোনো issue নেই” বলা যাবে না। নিচের rating শুধু নির্দিষ্ট পরীক্ষার ফল; সামগ্রিক app certification নয়।

## প্রকৃত routing এবং পরীক্ষার সীমা

| Claude client model | OmniRoute target | trace-এ actual executor/model |
| --- | --- | --- |
| `claude-opus-5-5` | `cx/gpt-6.1-sol` | `codex / gpt-6.1-sol` |
| `claude-fable-5`, native app-এ `claude-fable-5-1` | `cx/gpt-6-astra` | `codex / gpt-6-astra` |
| `claude-sonnet-5-5` | `glmt/glm-5.3-max` | `glmt / glm-5.3-max` |
| Internal `claude-haiku-5-5` | `cx/gpt-6.1-sol` | auxiliary request-এ `codex / gpt-6.1-sol` |

Broad CLI matrix-এর 30টি session-এর retained HTTP evidence-এ 107টি HTTP 200 ও 2টি GLMT image HTTP 400 আছে। Expected routing সব ক্ষেত্রে যাচাই হয়েছে। 6টি native auxiliary call মূল conversation-এর model থেকে আলাদা হওয়া ইচ্ছাকৃত Haiku mapping-এর ফল; এগুলোকে primary routing mismatch ধরা হয়নি। Client-এর দেখানো model নাম দিয়ে এই সিদ্ধান্ত নেওয়া হয়নি—gateway-এর actual selected executor, model, connection tag ও request artifact মিলিয়ে দেখা হয়েছে।

CLI version `2.1.294`; native app-এর bundled engine `2.1.293`। Bounded CLI test-এ low effort, ছোট নিজস্ব fixture, সীমিত turns এবং নিজস্ব allowlist ব্যবহার হয়েছে। Native app-এর আগে চালানো sample-এ 49 tool definition এবং প্রায় 71.2k input context ছিল। সব effort level, দীর্ঘ বাস্তব production task, ভাষাগত output quality, quota efficiency অথবা প্রত্যেক account দিয়ে প্রত্যেক tool পরীক্ষা হয়েছে এমন দাবি এই sample সমর্থন করে না।

প্রমাণ: route correlation (স্থানীয় বা private reference; প্রকাশিত নয়), মূল native deployment ও acceptance (স্থানীয় বা private reference; প্রকাশিত নয়)।

## CLI feature matrix ও rating

| বৈশিষ্ট্য ও assertion | GPT Sol | GPT Astra | GLMT 5.3 Max |
| --- | --- | --- | --- |
| `Write → Read → Edit → Bash`, file bytes ও `rg` ফল মিলেছে | PASS | PASS | PASS |
| MCP fixture discovery, Unicode argument ও echo result | PASS | PASS | PASS |
| `Read + NotebookEdit`, notebook cell-এর আসল পরিবর্তন | PASS | PASS | PASS |
| Permission denial মানা; নিষিদ্ধ file তৈরি হয়নি | PASS | PASS | PASS |
| প্রকৃত Nexa `Skill` load এবং helper `--help` | PASS | PASS | PASS |
| একই persisted session-এ model switch, history ও file continuity | PASS | PASS | PASS |
| `Read` দিয়ে red PNG বোঝা; সঠিক রং শনাক্ত | PASS | PASS | FAIL: image content 400 |
| Configured `context7` ও `memory` MCP-এর প্রকৃত read-only calls | PASS | PASS | PASS |
| `WebFetch` দিয়ে example.com-এর heading | PASS | PASS | PASS |
| Native `WebSearch`, ফলের মধ্যে official Node.js URL প্রয়োজন | FAIL | FAIL | FAIL |
| **পরীক্ষিত feature score** | **৯/১০** | **৯/১০** | **৮/১০** |

Rating rubric: প্রতিটি category প্রতিটি target-এ সমান ১ point; মোট ৩০টি feature check। **২৬/৩০ = ৮.৭/১০।** এটি একবারের bounded compatibility sample-এর pass ratio। Notebook kernel execution, সব browser action বা পুরো native application-এর quality score এতে অন্তর্ভুক্ত নয়। File/search test-এ এই CLI version-এর প্রকৃত `Bash + rg` ব্যবহার হয়েছে; অনুপস্থিত `Glob`/`Grep` tool execution বানিয়ে দেখানো হয়নি।

সম্পূর্ণ matrix evidence: file tools (স্থানীয় বা private reference; প্রকাশিত নয়), MCP fixture (স্থানীয় বা private reference; প্রকাশিত নয়), NotebookEdit (স্থানীয় বা private reference; প্রকাশিত নয়), permission denial (স্থানীয় বা private reference; প্রকাশিত নয়), Skills (স্থানীয় বা private reference; প্রকাশিত নয়), session resume (স্থানীয় বা private reference; প্রকাশিত নয়), vision (স্থানীয় বা private reference; প্রকাশিত নয়), configured MCP (স্থানীয় বা private reference; প্রকাশিত নয়), WebFetch/WebSearch (স্থানীয় বা private reference; প্রকাশিত নয়)।

অতিরিক্ত local control test-এ তিন model দিয়ে `CronList`, `ListAgents`, নিজের `Bash` background fixture এবং তার `TaskStop` প্রকৃতভাবে PASS। Stop-এর পরে fixture PID আর চলছে না যাচাই হয়েছে; কোনো আগে থেকে থাকা কাজ বন্ধ করা হয়নি। এই supplementary checks-কে ওপরের ৩০ feature score-এ দ্বিতীয়বার যোগ করা হয়নি। Control tools evidence (স্থানীয় বা private reference; প্রকাশিত নয়)।

## প্রকৃত native app-এ যা যাচাই হয়েছে

একই native conversation-এ Opus 5.5 → Sol দিয়ে `Read + Bash`, তারপর Fable 5.1 → Astra দিয়ে fixture `Skill`, তারপর Sonnet 5.5 → GLMT দিয়ে `Read + Bash` এবং আগের Skill marker মনে রাখা PASS। Astra native turn-এ Skill-এর “আর কোনো tool নয়” নির্দেশ মানা হয়েছে; সেই turn-এ Bash চলেছে বলা হচ্ছে না। Astra CLI-তে Read/Bash আলাদা পরীক্ষায় PASS।

Mac locked হওয়ার পরে নতুন browser/widget/interactive tool acceptance চালানো যায়নি। ২০২৬-১০-০৯ 12:34 UTC-তে সরাসরি Claude app নেওয়ার চেষ্টা আবার একই lock error দিয়েছে। Manual unlock প্রয়োজন। Login screen এড়িয়ে বা official app-এর files/config পরিবর্তন করে native execution বানানো হয়নি। Native app-এর পুরো tool set-এর জন্য final rating এখনও দেওয়া হয়নি।

## পাওয়া সমস্যা ও প্রয়োগ করা fix

| সমস্যা | মূল কারণ ও পরিবর্তন | এখনকার অবস্থা |
| --- | --- | --- |
| Model switch-এর পরে `Read`, `Bash`, `Skill` হারানো | Sparse Anthropic Thread continuation-এ system/tools থাকে না; পরিচিত `thread_not_found` response দিয়ে client-কে full transcript/tools replay করানো | `770a768b1` production-এ; প্রকৃত native app ও CLI sample PASS |
| Main GPT route কাজ করলেও WebFetch-এ weekly-limit error | Native helper গোপনে `claude-haiku-5-5` পাঠাচ্ছিল; তার exact mapping ছিল না, তাই Anthropic passthrough 429 | Exact Haiku alias যোগ; WebFetch তিন target-এ PASS |
| `nexa-blender` Skill না ওঠা | Multiline quoted description native Skill parser-এ নিবন্ধিত হচ্ছিল না | Description এক paragraph; body/scripts অপরিবর্তিত; `450c2c3` local commit, installed symlink-এ কার্যকর |
| Optional prompt suggestion-এ repeated 502 | বৈধ completed silence-কে empty-response failure ধরা হচ্ছিল | Narrow source fix `8d8c52e3b`; suggestion-এর 16 regression PASS; production release বাকি |
| Native server-side advisor অন্য provider-এ portability | Server advisor declaration ও encrypted provider-owned result সাধারণ client function নয় | `bdf342b59`: optional unsupported declaration বাদ, forced request-এ স্পষ্ট unsupported error, plaintext advice রাখা; release বাকি |
| WebSearch “error নেই” দেখিয়েও খালি ফল | Anthropic hosted server-search fallback সাধারণ function-এ নামিয়ে দিয়েছিল; native `web_search_tool_result`/citation contract তৈরি হয়নি | Semantic test FAIL; `6e3dd8d50` নতুন guard স্পষ্ট `NATIVE_HOSTED_SEARCH_UNSUPPORTED` ফেরায়; source PASS, release বাকি |
| GLMT Max image rejection | এই route-এর upstream `messages.content.type` শুধু `text` গ্রহণ করছে | প্রকৃত HTTP 400 সংরক্ষিত; অন্য model নীরবে ব্যবহার করা বা image বাদ দিয়ে success দেখানো হয়নি |

WebFetch fix-এর আগে consistent SQLite snapshot, `quick_check: ok` এবং SHA-256 receipt তৈরি হয়েছে। পুরোনো ১৩টি mapping row-এর সব byte value, including timestamp, অপরিবর্তিত রেখে শুধু একটি alias যোগ হয়েছে; এখন ১৪টি mapping। অন্য provider connection, API key, quota, official app config বা account enable state এই transaction লেখেনি। Mapping change receipt (স্থানীয় বা private reference; প্রকাশিত নয়)।

Native hosted search-এর encrypted content ও citation continuation Anthropic-এর contract-এর অংশ; encrypted content পরিবর্তিত/অনুপস্থিত হলে validation failure হতে পারে। সাধারণ browser/search MCP ফল এই server-owned payload-এর একই বস্তু নয়। নতুন guard ব্যর্থতার সত্য অবস্থা জানায়; এটি search feature সফলভাবে implement করার দাবি নয়। [Anthropic Web search documentation](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool)। Server advisor-ও provider-specific server tool; encrypted advice অন্য provider-এর function result হিসেবে চালানো হয়নি। [Advisor documentation](https://platform.claude.com/docs/en/agents-and-tools/tool-use/advisor-tool)।

## Native ও CLI tool-ভিত্তিক পূর্ণ coverage

Native request-এর প্রকৃত catalog: **৪৯টি declaration = ৪৮টি client tool + ১টি server advisor**। ৪৮টি client tool-এর প্রতিটির declaration/name, nested Unicode arguments, tool ID/result closure এবং error flag তিন target wire format-এ পরীক্ষা হয়েছে: **১৪৪/১৪৪ protocol checks PASS**। এটি actual native execution নয়। নিচের প্রতিটি row-তে আলাদা করে সেই পার্থক্য রাখা হয়েছে। App integration-এর UUID namespace পাঠযোগ্য `app_integration` নামে দেখানো হয়েছে। Protocol receipt (স্থানীয় বা private reference; প্রকাশিত নয়), পূর্ণ CSV (স্থানীয় বা private reference; প্রকাশিত নয়)।

| Native tool | প্রকৃত native app execution | প্রকৃত CLI execution | Transport/protocol test |
| --- | --- | --- | --- |
| `advisor` | server-side; cross-provider boundary-র source test PASS, release বাকি | CLI catalog-এ নেই | server-side unit boundary |
| `Agent` | প্রকৃত execution বাকি | CLI catalog-এ নেই | ৩ target format-এ PASS |
| `Artifact` | প্রকৃত execution বাকি | CLI catalog-এ নেই | ৩ target format-এ PASS |
| `AskUserQuestion` | প্রকৃত execution বাকি | CLI catalog-এ নেই | ৩ target format-এ PASS |
| `Bash` | Sol ও GLMT-এ প্রকৃত PASS | তিন route-এ প্রকৃত PASS | ৩ target format-এ PASS |
| `DeferredToolPlaceholder` | প্রকৃত execution বাকি | CLI catalog-এ নেই | ৩ target format-এ PASS |
| `Edit` | প্রকৃত execution বাকি | তিন route-এ প্রকৃত PASS | ৩ target format-এ PASS |
| `ListAgents` | প্রকৃত execution বাকি | তিন route-এ প্রকৃত PASS; নিজের fixture মাত্র | ৩ target format-এ PASS |
| `mcp__app_integration__batch` | প্রকৃত execution বাকি | CLI catalog-এ নেই | ৩ target format-এ PASS |
| `mcp__app_integration__guide` | প্রকৃত execution বাকি | CLI catalog-এ নেই | ৩ target format-এ PASS |
| `mcp__app_integration__update` | প্রকৃত execution বাকি | CLI catalog-এ নেই | ৩ target format-এ PASS |
| `mcp__ccd_session__dismiss_task` | প্রকৃত execution বাকি | CLI catalog-এ নেই | ৩ target format-এ PASS |
| `mcp__ccd_session__mark_chapter` | প্রকৃত execution বাকি | CLI catalog-এ নেই | ৩ target format-এ PASS |
| `mcp__ccd_session__read_widget_context` | প্রকৃত execution বাকি | CLI catalog-এ নেই | ৩ target format-এ PASS |
| `mcp__ccd_session__spawn_task` | প্রকৃত execution বাকি | CLI catalog-এ নেই | ৩ target format-এ PASS |
| `mcp__Claude_Browser__browser_batch` | প্রকৃত execution বাকি | CLI catalog-এ নেই | ৩ target format-এ PASS |
| `mcp__Claude_Browser__computer` | প্রকৃত execution বাকি | CLI catalog-এ নেই | ৩ target format-এ PASS |
| `mcp__Claude_Browser__find` | প্রকৃত execution বাকি | CLI catalog-এ নেই | ৩ target format-এ PASS |
| `mcp__Claude_Browser__form_input` | প্রকৃত execution বাকি | CLI catalog-এ নেই | ৩ target format-এ PASS |
| `mcp__Claude_Browser__get_page_text` | প্রকৃত execution বাকি | CLI catalog-এ নেই | ৩ target format-এ PASS |
| `mcp__Claude_Browser__javascript_tool` | প্রকৃত execution বাকি | CLI catalog-এ নেই | ৩ target format-এ PASS |
| `mcp__Claude_Browser__navigate` | প্রকৃত execution বাকি | CLI catalog-এ নেই | ৩ target format-এ PASS |
| `mcp__Claude_Browser__preview_list` | প্রকৃত execution বাকি | CLI catalog-এ নেই | ৩ target format-এ PASS |
| `mcp__Claude_Browser__preview_logs` | প্রকৃত execution বাকি | CLI catalog-এ নেই | ৩ target format-এ PASS |
| `mcp__Claude_Browser__preview_start` | প্রকৃত execution বাকি | CLI catalog-এ নেই | ৩ target format-এ PASS |
| `mcp__Claude_Browser__preview_stop` | প্রকৃত execution বাকি | CLI catalog-এ নেই | ৩ target format-এ PASS |
| `mcp__Claude_Browser__read_console_messages` | প্রকৃত execution বাকি | CLI catalog-এ নেই | ৩ target format-এ PASS |
| `mcp__Claude_Browser__read_network_requests` | প্রকৃত execution বাকি | CLI catalog-এ নেই | ৩ target format-এ PASS |
| `mcp__Claude_Browser__read_page` | প্রকৃত execution বাকি | CLI catalog-এ নেই | ৩ target format-এ PASS |
| `mcp__Claude_Browser__resize_window` | প্রকৃত execution বাকি | CLI catalog-এ নেই | ৩ target format-এ PASS |
| `mcp__Claude_Browser__tabs_close` | প্রকৃত execution বাকি | CLI catalog-এ নেই | ৩ target format-এ PASS |
| `mcp__Claude_Browser__tabs_context` | প্রকৃত execution বাকি | CLI catalog-এ নেই | ৩ target format-এ PASS |
| `mcp__Claude_Browser__tabs_create` | প্রকৃত execution বাকি | CLI catalog-এ নেই | ৩ target format-এ PASS |
| `mcp__Claude_Browser__tabs_select` | প্রকৃত execution বাকি | CLI catalog-এ নেই | ৩ target format-এ PASS |
| `mcp__Claude_Code_iOS_Simulator__control` | প্রকৃত execution বাকি | CLI catalog-এ নেই | ৩ target format-এ PASS |
| `mcp__terminal__read_terminal` | প্রকৃত execution বাকি | CLI catalog-এ নেই | ৩ target format-এ PASS |
| `mcp__visualize__read_me` | প্রকৃত execution বাকি | CLI catalog-এ নেই | ৩ target format-এ PASS |
| `mcp__visualize__show_widget` | প্রকৃত execution বাকি | CLI catalog-এ নেই | ৩ target format-এ PASS |
| `Read` | Sol ও GLMT-এ প্রকৃত PASS | তিন route-এ প্রকৃত PASS | ৩ target format-এ PASS |
| `ReportFindings` | প্রকৃত execution বাকি | প্রকৃত execution বাকি | ৩ target format-এ PASS |
| `ScheduleWakeup` | প্রকৃত execution বাকি | প্রকৃত execution বাকি | ৩ target format-এ PASS |
| `SearchPlugins` | প্রকৃত execution বাকি | CLI catalog-এ নেই | ৩ target format-এ PASS |
| `SendUserFile` | প্রকৃত execution বাকি | CLI catalog-এ নেই | ৩ target format-এ PASS |
| `Skill` | Astra-এ fixture Skill PASS | তিন route-এ তিন Nexa Skill load + helper PASS | ৩ target format-এ PASS |
| `SuggestPluginInstall` | প্রকৃত execution বাকি | CLI catalog-এ নেই | ৩ target format-এ PASS |
| `SuggestSkills` | প্রকৃত execution বাকি | CLI catalog-এ নেই | ৩ target format-এ PASS |
| `ToolSearch` | প্রকৃত execution বাকি | তিন route-এ প্রকৃত PASS | ৩ target format-এ PASS |
| `Workflow` | প্রকৃত execution বাকি | প্রকৃত execution বাকি | ৩ target format-এ PASS |
| `Write` | প্রকৃত execution বাকি | তিন route-এ প্রকৃত PASS | ৩ target format-এ PASS |

CLI-র বর্তমান discovery-তে ২৫টি tool আছে; native catalog-এ নেই এমন অতিরিক্ত CLI tool-গুলোর অবস্থাও নিচে দেওয়া হলো। Catalog controlled flags অনুযায়ী বদলাতে পারে।

| অতিরিক্ত CLI tool | বাস্তব execution-এর অবস্থা |
| --- | --- |
| `Task` | প্রকৃত execution বাকি |
| `CronCreate` | প্রকৃত execution বাকি |
| `CronDelete` | প্রকৃত execution বাকি |
| `CronList` | তিন route-এ প্রকৃত PASS; নিজের fixture মাত্র |
| `DesignSync` | প্রকৃত execution বাকি |
| `EnterWorktree` | প্রকৃত execution বাকি |
| `ExitWorktree` | প্রকৃত execution বাকি |
| `Monitor` | প্রকৃত execution বাকি |
| `NotebookEdit` | তিন route-এ প্রকৃত PASS |
| `PushNotification` | প্রকৃত execution বাকি |
| `RemoteTrigger` | প্রকৃত execution বাকি |
| `SendMessage` | প্রকৃত execution বাকি |
| `TaskStop` | তিন route-এ প্রকৃত PASS; নিজের fixture মাত্র |
| `WebFetch` | Haiku mapping fix-এর পরে ৩/৩ PASS |
| `WebSearch` | ০/৩ semantic PASS; খালি search ফল |

`Agent`/`Task` দিয়ে নতুন delegated কাজ, বাইরের recipient-কে message/file পাঠানো, scheduled task তৈরি, plugin install, unrelated worktree পরিবর্তন, iOS device interaction বা paid generation এই audit-এ করা হয়নি। সেগুলোর actual behavior-এর জন্য উপযুক্ত isolated scenario ও যেখানে প্রয়োজন সুনির্দিষ্ট destination/device দরকার। শুধু transport PASS থেকে সেই feature-গুলোকে live PASS ধরা হয়নি।

## Configured integrations ও embedded MCP

| Integration | পরীক্ষা | ফল ও সীমা |
| --- | --- | --- |
| `context7` | SDK initialize/listTools; দুই tool; তিন mapped model দিয়ে `resolve-library-id` | PASS; Node.js runtime documentation শনাক্ত |
| `memory` | SDK initialize/listTools; নয় tool; তিন model দিয়ে random nonexistent `search_nodes` | PASS; empty graph সঠিক; কোনো memory লেখা হয়নি |
| `october-bus-static` | প্রকৃত CLI MCP health ও SDK initialize | Connected; এই সাধারণ CLI context-এ ০ tool/০ resource প্রত্যাশিত; October identity/capability প্রয়োজন |
| Enabled Playwright plugin-এর MCP | SDK initialize/listTools | Connected; ২৫ tool catalog; browser actions এখনও বাকি |
| `ecc`-এর embedded Chrome DevTools MCP | SDK initialize/listTools | Connected; ৩০ tool catalog; vendor config-এ `mcpServers: {}` আছে, তাই সব default session-এ auto-loaded ধরে নেওয়া হয়নি |

October bus-এর source bridge-তে empty static `TOOLS` এবং registered October canvas/node/capability অনুযায়ী dynamic exposure আছে। পরিচয় বানিয়ে guard bypass করা হয়নি; এটি “MCP connection failed” নয়। Configured MCP probe (স্থানীয় বা private reference; প্রকাশিত নয়), plugin MCP catalog (স্থানীয় বা private reference; প্রকাশিত নয়)।

Embedded MCP-র tool নামগুলো সম্পূর্ণ দেওয়া হলো। নিচের সবগুলোর declaration তালিকা পাওয়া গেছে; browser action execution হয়নি। প্রতিটি tool-এর CSV (স্থানীয় বা private reference; প্রকাশিত নয়)।

**plugin-playwright — 25টি tool, SDK catalog connected।**

`browser_close`, `browser_resize`, `browser_console_messages`, `browser_handle_dialog`, `browser_emulate_media`, `browser_evaluate`, `browser_file_upload`, `browser_drop`, `browser_find`, `browser_fill_form`, `browser_press_key`, `browser_type`, `browser_navigate`, `browser_navigate_back`, `browser_network_requests`, `browser_network_request`, `browser_run_code_unsafe`, `browser_take_screenshot`, `browser_snapshot`, `browser_click`, `browser_drag`, `browser_hover`, `browser_select_option`, `browser_tabs`, `browser_wait_for`। Browser action execution বাকি।

**plugin-chrome-devtools — 30টি tool, SDK catalog connected।**

`click`, `close_page`, `drag`, `emulate`, `evaluate_script`, `fill`, `fill_form`, `get_console_message`, `get_css_styles`, `get_network_request`, `handle_dialog`, `hover`, `lighthouse_audit`, `list_console_messages`, `list_network_requests`, `list_pages`, `navigate_page`, `new_page`, `performance_analyze_insight`, `performance_start_trace`, `performance_stop_trace`, `press_key`, `resize_page`, `select_page`, `take_heapsnapshot`, `take_screenshot`, `take_snapshot`, `type_text`, `upload_file`, `wait_for`। Browser action execution বাকি।

## Plugins ও hooks

Installed plugin ১১টি; enabled ৯টি। Enabled ৯টির manifest validation PASS। দুটি disabled plugin (`github`, আলাদা `chrome-devtools-mcp`) disabled-ই আছে। Installed vendor copy বা official configuration বদলানো হয়নি।

| Enabled plugin | validation snapshot version | ফল |
| --- | --- | --- |
| `ecc@ecc` | `2.2.0` | PASS |
| `playwright@claude-plugins-official` | `8206942d3ec0` | PASS |
| `claude-code-setup@claude-plugins-official` | `1.0.0` | PASS; official marketplace context |
| `gsap-skills@gsap-skills` | `1.0.0` | PASS |
| `example-skills@anthropic-agent-skills` | `9d630808e4ad` | PASS |
| `nateherk-design@nateherk` | `0.2.0` | PASS |
| `blast-radius@claude-code-playground-mods` | `0.1.0` | PASS |
| `token-weather@claude-code-playground-mods` | `0.1.0` | PASS |
| `replay-theater@claude-code-playground-mods` | `0.1.0` | PASS |

`claude-code-setup`-এর official reserved name standalone folder context-এ validator reject করেছিল। একই bytes official marketplace context-এ validate করে PASS হয়েছে; ২৯টি vendor missing-version/author warning আছে, fatal error নেই। Initial inventory-এর কিছু marketplace cache version এবং পরের validation snapshot-এর version আলাদা; রিপোর্টের table পরের validated version ব্যবহার করেছে। Source rename করে warning লুকানো হয়নি।

Global hooks: **১১ event-এ ১৭ command hook**। Shell syntax, referenced script existence, Python AST এবং Node syntax checks PASS; agent/prompt ধরনের অতিরিক্ত LLM hook পাওয়া যায়নি। সব hook business action আলাদাভাবে trigger করা হয়নি। তাই এটি hook-এর static readiness, সব behavior-এর end-to-end certification নয়। Plugin validation (স্থানীয় বা private reference; প্রকাশিত নয়), hook validation (স্থানীয় বা private reference; প্রকাশিত নয়)।

## সব Skills এবং Nexa family

Installed **৪১৩টি প্রকৃত `SKILL.md`**-এর metadata validation PASS; প্রতি file-এর scope, path ও SHA-256 রাখা আছে। Initial file listing-এর `llms.txt`-কে Skill হিসেবে গণনা করা ভুল ছিল; তা বাদ দিয়ে ৪১৩ final count। ৪১৩-row CSV (স্থানীয় বা private reference; প্রকাশিত নয়), metadata receipt (স্থানীয় বা private reference; প্রকাশিত নয়)। Metadata validation কোনো Skill-এর পুরো production workflow চালানোর সমতুল্য নয়।

Nexa family-এর **২৯টি Skill তিন mapped CLI route-এর init list-এ registered**। তিনটিতে প্রকৃত Skill load ও helper execution হয়েছে। Existing offline automated suite থাকা ১৮টি Skill-এ **১,৮৮৩ test-এর মধ্যে ১,৮৮০ PASS, ৩ skipped, ০ failed**। ১৩৫টি Nexa Python script-এর syntax/AST PASS। অন্য ১১টি instruction sub-skill-এর আলাদা automated suite নেই।

| Nexa Skill | Registration | বিদ্যমান offline suite | প্রকৃত mapped-model execution |
| --- | --- | --- | --- |
| `nexa-blender` | তিন route-এ registered | 20 PASS, 2 skipped | GLMT-এ প্রকৃত Skill + helper PASS |
| `nexa-copy` | তিন route-এ registered | 41 PASS, 0 skipped | সম্পূর্ণ বাস্তব workflow চালানো হয়নি |
| `nexa-director` | তিন route-এ registered | 151 PASS, 0 skipped | সম্পূর্ণ বাস্তব workflow চালানো হয়নি |
| `nexa-learn` | তিন route-এ registered | 98 PASS, 0 skipped | সম্পূর্ণ বাস্তব workflow চালানো হয়নি |
| `nexa-method` | তিন route-এ registered | 40 PASS, 0 skipped | Sol-এ প্রকৃত Skill + helper PASS |
| `nexa-project` | তিন route-এ registered | 91 PASS, 0 skipped | সম্পূর্ণ বাস্তব workflow চালানো হয়নি |
| `nexa-prompt-enhancer` | তিন route-এ registered | 81 PASS, 0 skipped | সম্পূর্ণ বাস্তব workflow চালানো হয়নি |
| `nexa-remotion` | তিন route-এ registered | 33 PASS, 0 skipped | সম্পূর্ণ বাস্তব workflow চালানো হয়নি |
| `nexa-remotion-3d` | তিন route-এ registered | আলাদা automated suite নেই; instruction sub-skill | সম্পূর্ণ বাস্তব workflow চালানো হয়নি |
| `nexa-remotion-design` | তিন route-এ registered | আলাদা automated suite নেই; instruction sub-skill | সম্পূর্ণ বাস্তব workflow চালানো হয়নি |
| `nexa-remotion-edit` | তিন route-এ registered | আলাদা automated suite নেই; instruction sub-skill | সম্পূর্ণ বাস্তব workflow চালানো হয়নি |
| `nexa-remotion-fx` | তিন route-এ registered | আলাদা automated suite নেই; instruction sub-skill | সম্পূর্ণ বাস্তব workflow চালানো হয়নি |
| `nexa-remotion-graphics` | তিন route-এ registered | আলাদা automated suite নেই; instruction sub-skill | সম্পূর্ণ বাস্তব workflow চালানো হয়নি |
| `nexa-remotion-maps` | তিন route-এ registered | আলাদা automated suite নেই; instruction sub-skill | সম্পূর্ণ বাস্তব workflow চালানো হয়নি |
| `nexa-remotion-motion` | তিন route-এ registered | আলাদা automated suite নেই; instruction sub-skill | সম্পূর্ণ বাস্তব workflow চালানো হয়নি |
| `nexa-remotion-render` | তিন route-এ registered | আলাদা automated suite নেই; instruction sub-skill | সম্পূর্ণ বাস্তব workflow চালানো হয়নি |
| `nexa-remotion-styles` | তিন route-এ registered | আলাদা automated suite নেই; instruction sub-skill | সম্পূর্ণ বাস্তব workflow চালানো হয়নি |
| `nexa-remotion-type` | তিন route-এ registered | আলাদা automated suite নেই; instruction sub-skill | সম্পূর্ণ বাস্তব workflow চালানো হয়নি |
| `nexa-remotion-ui` | তিন route-এ registered | আলাদা automated suite নেই; instruction sub-skill | সম্পূর্ণ বাস্তব workflow চালানো হয়নি |
| `nexa-research` | তিন route-এ registered | 40 PASS, 0 skipped | সম্পূর্ণ বাস্তব workflow চালানো হয়নি |
| `nexa-screen-recording` | তিন route-এ registered | 7 PASS, 0 skipped | সম্পূর্ণ বাস্তব workflow চালানো হয়নি |
| `nexa-script` | তিন route-এ registered | 134 PASS, 0 skipped | সম্পূর্ণ বাস্তব workflow চালানো হয়নি |
| `nexa-seo` | তিন route-এ registered | 225 PASS, 0 skipped | সম্পূর্ণ বাস্তব workflow চালানো হয়নি |
| `nexa-sound` | তিন route-এ registered | 214 PASS, 0 skipped | সম্পূর্ণ বাস্তব workflow চালানো হয়নি |
| `nexa-speech` | তিন route-এ registered | 123 PASS, 0 skipped | সম্পূর্ণ বাস্তব workflow চালানো হয়নি |
| `nexa-stock` | তিন route-এ registered | 37 PASS, 0 skipped | সম্পূর্ণ বাস্তব workflow চালানো হয়নি |
| `nexa-truman` | তিন route-এ registered | 135 PASS, 0 skipped | Astra-এ প্রকৃত Skill + helper PASS |
| `nexa-ui-ux` | তিন route-এ registered | 195 PASS, 1 skipped | সম্পূর্ণ বাস্তব workflow চালানো হয়নি |
| `nexa-video-creator` | তিন route-এ registered | 215 PASS, 0 skipped | সম্পূর্ণ বাস্তব workflow চালানো হয়নি |

`nexa-blender`-এর দুই skip এবং `nexa-ui-ux`-এর এক skip PASS হিসেবে গণনা হয়নি। Screen-recording suite-এ motion unit checks হয়েছে, পুরো screen capture নয়। Blender render, দীর্ঘ Remotion production render, voice/image/video paid generation, real-device QA এবং client deliverable workflow এই scope-এ চালানো হয়নি। Offline suite details (স্থানীয় বা private reference; প্রকাশিত নয়), script syntax (স্থানীয় বা private reference; প্রকাশিত নয়), Skill metadata diff (স্থানীয় বা private reference; প্রকাশিত নয়)।

প্রথম live Skill harness-এ user settings বাদ পড়ায় `Unknown skill` হয়েছিল; পরে helper `--help` চললেও সেটি Skill PASS ছিল না। পুরোনো evidence রাখা হয়েছে, score থেকে বাদ দেওয়া হয়েছে। সংশোধিত harness `--setting-sources user`, আসল `Skill` launch, raw `tool_result.is_error` এবং helper output—সব একসঙ্গে মিলিয়ে final তিন PASS দিয়েছে।

## Source release, validation ও build-এর প্রকৃত অবস্থা

পরবর্তী release child branch `fix/native-suggestion-silence-2026-10-09`, clean/pristine HEAD `6e3dd8d50`। মূল `770a768b1`-এর ওপর তিন commit আছে: `8d8c52e3b`, `bdf342b59`, `6e3dd8d50`। Permanent application পরিবর্তন শুধু `nexa/` overlay-এ; upstream source restore করা হয়েছে। Main এখনও clean `770a768b1`; pending candidate main-এ merge হয়নি। Normal commit hooks PASS; author ও committer Jillur Rahman।

| Gate | ফল |
| --- | --- |
| আগে verified parent source tests | ২৬২ PASS; hash-verified evidence reuse |
| নতুন hosted-search focused regression group | ৭৯ PASS; ৮ নতুন boundary case |
| Overlap বাদ দিয়ে distinct source test cases | **৩১৬**; ২৬২ + ৭৯ − ২৫ overlap |
| Core TypeScript | PASS |
| TypeScript ratchet | **৫,৮১০ / ৫,৮৩০**, baseline বাড়ানো হয়নি |
| Overlay dry-run | **১৪১ / ১৪১ patches apply** |
| Lint/format এবং normal hooks | PASS |
| Candidate full production build | **এখনও PASS নয়** |
| Candidate deployment/native acceptance | **এখনও হয়নি** |

Parent `bdf342b59`-এ প্রথম ৩.৫ GiB ও পরের ৪ GiB V8 heap build allocation failure দিয়েছে। প্রথম total peak ৪,৮১৯ MiB, দ্বিতীয় ৫,৭৪৯ MiB; minimum physical headroom যথাক্রমে ১৩.৯৮৩ ও ১৩.৮৩২ GiB, pressure normal, swap growth ০। কোনো successful artifact তৈরি হয়নি; log/failed cache/source restoration receipts অক্ষত। একই undersized heap পুনরায় ব্যবহার করা হবে না।

সফল live `770a768b1` build-এর পরীক্ষিত profile—এক worker, **৫ GiB heap / ৭ GiB total RSS cap**—নতুন candidate runner-এ রাখা হয়েছে। ১০ GiB system reserve-সহ শুরুতে ১৭ GiB physical headroom প্রয়োজন। সর্বশেষ admission check-এ প্রায় ১৫.৭৭ GiB ছিল, তাই নতুন build চালানো হয়নি। Internal disk free প্রায় ৪০.৩৬ GiB, pressure normal, render নেই, swap used ১,০৫৫.৫৬ MiB স্থিতিশীল। কোনো guard bypass হয়নি। Source gate receipt (স্থানীয় বা private reference; প্রকাশিত নয়), প্রস্তুত bounded build runner (স্থানীয় বা private reference; প্রকাশিত নয়)।

মূল live package `770a768b1`-এর ৬২০ static pages/full pipeline PASS এবং SHA-256 `1de0840db17131336c86a578e06c098de45568d01c2893f57d096e4b7a9b19be` সংরক্ষিত। এই পুরোনো সফল package-কে candidate `6e3dd8d50`-এর artifact বলা হচ্ছে না। Live runtime/rollback/database/source/successful build output মুছে বা overwrite করা হয়নি।

## প্রতিটি provider connection-এর প্রকৃত স্বাস্থ্য

এই পৃথক check-এ connection-affine management test দিয়ে ২১টি account-এ একবার করে ছোট inference করা হয়েছে। Codex ও GLMT-এর একই live connection ID-র আগের প্রকৃত CLI evidence reuse হয়েছে; paused দুই account test হয়নি। **২৫টির মধ্যে ২৩ active: ৮টি নতুন PASS + ২টি verified reuse = ১০টি সফল; ১৩টি ব্যর্থ; ২টি paused SKIP।** এটি সব account-এ সব client tool পরীক্ষা নয়।

Google AGY-এর ৮ active-এর ৫টি PASS, ১টি quota/rate-limit, ২টি verification error। Antigravity-এর ৮ active-এর ৬টি quota/rate-limit এবং ২টি verification error; এই sample-এ Antigravity-তে কোনো successful response পাওয়া যায়নি। Claude-এর ৩ active-এর ১টি PASS ও ২টি quota/rate-limit। GLM, Z.AI, Codex এবং GLMT-তে সফল response পাওয়া গেছে। Quota/rate-limit মোট ৯টি, verification/account-policy ৪টি।

| Provider | Account hash tag | ছোট test-এর model | HTTP | ফল |
| --- | --- | --- | --- | --- |
| `agy` | `62cb79eab66a` | `gemini-3.8-flash-low` | 200 | PASS; requested = actual selected, nonempty output |
| `agy` | `69bb77e3db70` | `gemini-3.8-flash-low` | 200 | PASS; requested = actual selected, nonempty output |
| `agy` | `39cfed35ef10` | `gemini-3.8-flash-low` | 200 | PASS; requested = actual selected, nonempty output |
| `agy` | `b37e8a233859` | `gemini-3.8-flash-low` | 429 | FAIL; quota_or_rate_limit |
| `agy` | `4b353b7315da` | `পরীক্ষা হয়নি` | — | SKIP; operator-paused রাখা হয়েছে |
| `agy` | `82c494758437` | `gemini-3.8-flash-low` | 200 | PASS; requested = actual selected, nonempty output |
| `agy` | `a09d126eab28` | `gemini-3.8-flash-low` | 502 | FAIL; verification_or_account_policy |
| `agy` | `42343740a1e4` | `gemini-3.8-flash-low` | 502 | FAIL; verification_or_account_policy |
| `agy` | `f611bad2cd9c` | `gemini-3.8-flash-low` | 200 | PASS; requested = actual selected, nonempty output |
| `antigravity` | `cc3d87956a92` | `gemini-3.8-flash-low` | 502 | FAIL; quota_or_rate_limit |
| `antigravity` | `35a42fe69d14` | `gemini-3.8-flash-low` | 502 | FAIL; quota_or_rate_limit |
| `antigravity` | `522a92148b59` | `gemini-3.8-flash-low` | 429 | FAIL; quota_or_rate_limit |
| `antigravity` | `9ae8dab52c36` | `পরীক্ষা হয়নি` | — | SKIP; operator-paused রাখা হয়েছে |
| `antigravity` | `beb79a620cc9` | `gemini-3.8-flash-low` | 502 | FAIL; quota_or_rate_limit |
| `antigravity` | `2f488dccd24e` | `gemini-3.8-flash-low` | 502 | FAIL; quota_or_rate_limit |
| `antigravity` | `3b4f8269c8da` | `gemini-3.8-flash-low` | 502 | FAIL; verification_or_account_policy |
| `antigravity` | `67e25405d3c1` | `gemini-3.8-flash-low` | 502 | FAIL; verification_or_account_policy |
| `antigravity` | `2e8c230351bd` | `gemini-3.8-flash-low` | 502 | FAIL; quota_or_rate_limit |
| `claude` | `8acdc882f3cd` | `claude-sonnet-5` | 429 | FAIL; quota_or_rate_limit |
| `claude` | `3ea49accdef6` | `claude-sonnet-5` | 429 | FAIL; quota_or_rate_limit |
| `claude` | `ccbc41fcc88a` | `claude-sonnet-5` | 200 | PASS; requested = actual selected, nonempty output |
| `codex` | `e874abc14916` | `gpt-6.1-sol / gpt-6-astra` | — | PASS; বর্তমান একই ID-তে আগের live CLI evidence reuse |
| `glm` | `79754c67f90a` | `glm-5.3-max` | 200 | PASS; requested = actual selected, nonempty output |
| `glmt` | `da39309918c9` | `glm-5.3-max` | — | PASS; বর্তমান একই ID-তে আগের live CLI evidence reuse |
| `zai` | `4ab2dfc887a7` | `glm-5.3` | 200 | PASS; requested = actual selected, nonempty output |

সব নতুন PASS-এ requested connection ও actual selected connection একই এবং response nonempty। ব্যর্থ test-এ selected connection না পাওয়া মানেই অন্য account ব্যবহার হয়েছে নয়; inference/availability guard-ই ব্যর্থ হয়েছে, তাই সেগুলোকে PASS ধরা হয়নি। Enable/paused ও priority fingerprint test-এর আগে-পরে একই। Account-by-account evidence (স্থানীয় বা private reference; প্রকাশিত নয়)।

Canonical nested `providerSpecificData.googleAccountVerification.required` পড়ে **চার active ও দুই paused Google account-এ verification-required state** নিশ্চিত হয়েছে। চার active tag: `a09d126eab28`, `42343740a1e4`, `3b4f8269c8da`, `67e25405d3c1`। Paused দুই tag: `4b353b7315da`, `9ae8dab52c36`। আগে inventory helper শুধু top-level legacy `verificationRequired` পড়ায় false দেখিয়েছিল; সেটি canonical nested verification state-এর সিদ্ধান্ত নয়। বর্তমান রিপোর্ট corrected nested state ব্যবহার করছে। কোনো flag clear বা account enable করা হয়নি। Correct nested verification evidence (স্থানীয় বা private reference; প্রকাশিত নয়)।

এই account-গুলোর provider verification/allowance বাধা software success বানিয়ে সরানো যাবে না। Verification owner-কে official account flow-তে সম্পন্ন করতে হবে; quota-এর ক্ষেত্রে allowance reset বা অন্য অনুমোদিত usable account প্রয়োজন। Private verification URL এবং account পরিচয় প্রকাশ করা হয়নি।

## Retained data, health ও token-related পর্যবেক্ষণ

Haiku mapping-এর পরে 12:28:38 UTC inventory: runtime `770a768b1`, provider connection ২৫, API key ৩, mapping ১৪, retained usage row ৭১,৭৩৫। Provider ও API-key ID set hash এবং enable/paused/priority fingerprint আগের verified inventory-এর সঙ্গে মিলে গেছে। দুই paused Google connection paused-ই ছিল। পরের connection tests-এর ফলে usage/history ও স্বাভাবিক health metadata বাড়তে পারে; এই earlier count-কে final current count বলা হচ্ছে না।

Immediate 12:20:07 pre-mapping snapshot-এর সঙ্গে পরের live settings-এর **৪৪টি key/value row একই**। আরও পুরোনো 12:18:25 fingerprint-এ drift ছিল; সেই drift mapping transaction-এর আগে। পুরো audit জুড়ে অন্য operator/background setting পরিবর্তন হয়নি এমন দাবি করা হচ্ছে না। Loopback ও `http://omni.local/healthz` উভয়ই HTTP 200। Runtime SHA canonical `dist/BUILD_SHA` থেকে যাচাই হয়েছে। Retention/health receipt (স্থানীয় বা private reference; প্রকাশিত নয়), runtime inventory (স্থানীয় বা private reference; প্রকাশিত নয়)।

একটি নিশ্চিত অতিরিক্ত token/retry পথ পাওয়া গেছে: ঐচ্ছিক prompt suggestion নীরব থাকা সত্ত্বেও একই native session-এ আটটি 502 এবং history/49 tool definition-সহ repeated request। Suggestion fix এই নির্দিষ্ট পথ বন্ধ করার জন্য প্রস্তুত। এই নমুনা থেকে মোট weekly quota consumption, সাশ্রয়ের শতাংশ অথবা সমস্ত আগের account exhaustion-এর কারণ নির্ধারণ করা যায় না। Tool catalog, loaded context, effort, retries ও auxiliary calls আলাদা evidence দিয়ে দেখতে হবে; quota page-এর percentage একা causal receipt নয়।

## Safety ও অবশিষ্ট কাজ

সব local heavy কাজ sequential, bounded watchdog-এ হয়েছে। একটি UI test module প্রথম ৩ GiB cap ছুঁলে শুধু নিজের test থামানো হয়েছে; তারপর fresh process ও এক renderer দিয়ে একই assertions-এর suite PASS। সফল output, checkpoints ও failed-run evidence রাখা হয়েছে। কোনো unrelated process force-kill, account enable, quota/verification reset, official app edit বা public OSS publication হয়নি। Credential values, account email, raw connection ID ও private verification URL রিপোর্টে রাখা হয়নি।

কাজ শেষ করতে Mac manual unlock প্রয়োজন, যাতে native app-এর browser, widget, interactive ও integration scenario চালানো যায় এবং আগে অনুমোদিত app-গুলো স্বাভাবিকভাবে quit করে build headroom পাওয়া যায়। এরপর verified ৫/৭ GiB profile-এ candidate artifact build, artifact/source hash check, clean main fast-forward, ৩ GiB bounded updater দিয়ে isolated install ও real Anthropic smoke, consistent database snapshot ও complete previous runtime preservation, promotion, health/TLS/data এবং নতুন fixes-এর bounded live acceptance করতে হবে। Artifact তৈরি হওয়ার আগেই source commit-কে deployment বলা যাবে না।

GLMT-এর image support এবং native hosted search-এর provider-owned feature parity এখনও open capability gap। GPT image route ইতিমধ্যে পরীক্ষায় PASS; browser/search MCP বিকল্পের full native UI পরীক্ষা এখনও বাকি। Source guard ওই capability gap লুকায় না। [Claude Code tool reference](https://code.claude.com/docs/en/tools-reference), [Skills](https://code.claude.com/docs/en/skills), [MCP](https://code.claude.com/docs/en/mcp)।

## চূড়ান্ত checkpoint — ২০২৬-১০-০৯, ১৮:৪৬ Dhaka

৩০টি bounded CLI session-এর retained trace-এ ১০৭টি HTTP 200, দুই GLMT image HTTP 400 এবং expected route selection সব ক্ষেত্রে যাচাই হয়েছে। অতিরিক্ত control tool test-ও তিন route-এ PASS। Connection-affine health matrix-এ ১০ active connection-এর সফল প্রমাণ, ১৩ active-এ quota/verification failure, দুই paused skip। Canonical nested Google verification state অনুযায়ী চার active ও দুই paused-এ verification required; flat legacy field-ভিত্তিক false মানকে final সিদ্ধান্ত ধরা হয়নি।

12:45:39 UTC inventory-তে runtime `770a768b1`, provider 25, API key 3, mappings 14, usage rows 71773। Provider/API-key ID sets, operator enable/paused/priority fingerprint, mapping rows এবং settings fingerprint 12:28 checkpoint-এর সঙ্গে একই। স্বাভাবিক health metadata ও audit usage/history আপডেট হয়েছে। চূড়ান্ত inventory (স্থানীয় বা private reference; প্রকাশিত নয়)।

12:46:14 UTC-তে physical headroom **14.918 GiB**, internal disk **40.352 GiB**, pressure normal, swap used 1,055.56 MiB এবং render নেই। Build admission এখনও 17 GiB-এর নিচে; candidate build/deploy শুরু হয়নি। `healthz` দুই URL-এ 200; runtime `770a768b1`। Mac UI সর্বশেষ সরাসরি পরীক্ষায় locked; manual unlock দরকার। শেষ resource ও health receipt (স্থানীয় বা private reference; প্রকাশিত নয়)।

একটি management API probe প্রথমে default data directory-র existing credential ব্যবহার করায় 401 পেয়েছিল। প্রকৃত local runtime-এর `DATA_DIR=~/.omniroute-local` ও তার existing management credential ব্যবহার করে authenticated inventory/test সফল হয়েছে। কোনো auth guard, salt বা credential তৈরি/পরিবর্তন করা হয়নি; দুই salt file-এর creation/modified time এই run-এর আগের।

পরবর্তী কাজের নির্দিষ্ট অবস্থা: মূল tool fix এবং Haiku mapping live; Nexa Blender metadata fix installed; suggestion/advisor/search guard source `6e3dd8d50` validated কিন্তু release pending। পূর্ণ native UI acceptance এবং দুই provider capability gap এখনও open।


## সম্পন্ন release ও বাস্তব native QA — ২০২৬-১০-০৯, ২৩:১৫ Dhaka

এই অংশে আগের pending/locked checkpoint-এর পরের ফল দেওয়া হলো। **Source `6e3dd8d50` এখন production-এ deploy হয়েছে।** Mac unlock-এর পরে সরাসরি native app পরীক্ষা, production build, isolated install/smoke, promotion এবং deployment-পরবর্তী বাস্তব client পরীক্ষা সম্পন্ন হয়েছে। আগের অংশে candidate/build pending বলা ছিল সেই সময়ের অবস্থা; বর্তমান release-এর প্রমাণ নিচে আছে। সব feature/provider-এর সমান ক্ষমতা বা শূন্য ভবিষ্যৎ error দাবি করা হচ্ছে না।

### কী ঠিক হয়েছে এবং কোন সীমা রয়ে গেছে

| বিষয় | বর্তমান ফল |
| --- | --- |
| Model switch/restart-এর sparse native Thread-এ tools/system হারানো | `770a768b1`-এর full-replay fix নতুন release-এ retained। একই native chat-এ GLMT → Sol → Astra switch, app restart-এর পর fresh Read/Bash এবং আগের marker ফেরত পাওয়া গেছে। |
| বৈধ silent optional next-prompt suggestion-এ 502/retry | `8d8c52e3b` valid empty completion গ্রহণ করে; সাধারণ empty/truncated/error response এখনও failure। বাস্তব streaming native suggestion এবং ছোট native-template nonstreaming Sol/Astra পরীক্ষা HTTP 200, silent/end-turn। |
| Anthropic server advisor অন্য provider-এ local tool হয়ে advertise হওয়া | `bdf342b59` server-only advisor-কে ভুলভাবে local tool বানায় না; forced unsupported advisor-এ স্পষ্ট `unsupported_feature` 400। বাস্তব client function-এর নাম advisor হলে তা অক্ষত। |
| Native Anthropic-hosted WebSearch অন্য provider-এ ফলহীন fallback | `6e3dd8d50` dispatch-এর আগে স্পষ্ট unsupported boundary দেয়। এটি search capability যোগ করে না। পরীক্ষিত browser/MCP path দিয়ে ওয়েবের কাজ হয়; Anthropic-hosted search দরকার হলে সমর্থিত Anthropic route প্রয়োজন। |
| WebFetch internal Haiku alias | আগের mapping fix retained: ১৩টি mapping রেখে `claude-haiku-5-5` → Sol যোগ করা, মোট ১৪। তিন route-এ WebFetch PASS। |
| Nexa Skill metadata | `nexa-blender` metadata fix `450c2c3` installed; Skill body ও helper logic বদলায়নি। বাস্তব native Skill load এবং helper `--help` PASS; কোনো Blender render শুরু হয়নি। |
| GLMT image input | এখনও unsupported, HTTP 400। এই capability gap route adapter দিয়ে মিথ্যা সফল করা হয়নি। GPT image route-এর আগের bounded পরীক্ষা PASS। |

### বাস্তব native app-এ যা চালানো হয়েছে

একই নিজস্ব fixture conversation-এ target-identifying gateway traces মিলিয়ে পরীক্ষা করা হয়েছে; model নিজে কী পরিচয় দিয়েছে, তা routing-এর প্রমাণ ধরা হয়নি।

| Target | সরাসরি native GUI-তে পাওয়া ফল | গুরুত্বপূর্ণ সীমা |
| --- | --- | --- |
| `glmt/glm-5.3-max` | ToolSearch, Write → Edit → Read-এ exact V2 file content, Bash, browser navigate ও get_page_text-এ Example Domain। ৬ primary + ৩ auxiliary HTTP 200। | Bash চালালেও requested `NATIVE_GUI_GLM_BASH_OK`-এর বদলে `NATIVE_APP_GLM_BASH_OK` দিয়েছে: **exact instruction-following FAIL**। প্রথম provider response ১২১.২০৯ সেকেন্ড, input ৭৯,৬৯৮ ও output ৮,০১৬ tokens। তাই একই quality/latency দাবি নয়। |
| `cx/gpt-6.1-sol` | Read, browser JavaScript-এ `document.title`, Artifact list, ToolSearch → visualize read_me/show_widget এবং দৃশ্যমান SVG marker, AskUserQuestion fixture-এ নির্বাচিত উত্তর। | read_page call সফল হলেও returned content-এ expected heading পাওয়া যায়নি। JS title এবং GLMT get_page_text-এর প্রমাণ আলাদা। |
| `cx/gpt-6-astra` | Bash exact marker, Read, browser JavaScript, ToolSearch → context7 Node.js resolve, read-only memory empty-search, Skill → nexa-blender, helper `--help`। | Empty memory search tool execution-এর প্রমাণ, existing memory content পাওয়া গেছে এমন দাবি নয়। |
| Deployment-পরবর্তী Astra | App restart-এর পর নতুন ২৬-byte file Read-এ `NATIVE_POSTDEPLOY_READ_OK`, Bash-এ `NATIVE_POSTDEPLOY_ASTRA_OK`, একই chat-এর আগের `THREAD_READ_OK` ফেরত। ৩ primary Astra, ১ auxiliary Sol, ১ background Astra suggestion—৫/৫ HTTP 200। | এটি bounded same-conversation acceptance; সব native tool-এর প্রতিটি business/device workflow-এর পূর্ণ পরীক্ষা নয়। |

Browser pane প্রথমে বন্ধ থাকায় tabs_create-এ prerequisite error হয়েছিল; navigate browser খুলে দেয়, তারপর get_page_text সফল হয়। এই recovered error মুছে ফেলা হয়নি। SVG-তে script ছিল না; `remoteUrlPresent=true` ছিল SVG namespace URL-এর জন্য, remote asset fetch-এর প্রমাণ নয়। Artifact কেবল list করা হয়েছে; publish/delete হয়নি। AskUserQuestion ছিল synthetic A/B fixture, বাস্তব user preference/approval নয়।

Native GLMT acceptance (স্থানীয় বা private reference; প্রকাশিত নয়), GPT extended native evidence (স্থানীয় বা private reference; প্রকাশিত নয়), postdeploy native ও routing acceptance (স্থানীয় বা private reference; প্রকাশিত নয়)।

### Build ও deployment-এর প্রমাণ

| Gate | ফল |
| --- | --- |
| Source validation | ৩১৬ distinct regression PASS; core typecheck PASS; ratchet ৫,৮১০/৫,৮৩০; ১৪১/১৪১ patch apply PASS। Hash-verified validation evidence reuse হয়েছে; অকারণে পূর্ণ suite বারবার চালানো হয়নি। |
| প্রথম bounded build | ৭ GiB cap-এ মোট RSS sample ৭,১৭০ MiB > ৭,১৬৮ MiB হওয়ায় code 75-এ নিজের build থেমেছে। System pressure normal, minimum headroom ১৫.২৫৩ GiB, swap growth ০। এটি cap stop, system OOM নয়। Source restore/pristine PASS; log/evidence retained। |
| দ্বিতীয় production build | ৮ GiB cap, heap ৫,১২০ MiB, one worker, webpack parallelism ১, semispace ৮, RAYON ১। **Whole pipeline exit 0**, ৬২০/৬২০ static page, dashboard gate, CLI generation, pack validation, npm pack ও strict Bridge package gate PASS। |
| সফল build resources | Peak total owned RSS **৭,৮৪৬ MiB**, minimum system headroom **১৬.০৪৮ GiB**, pressure normal, swap growth **০**। ১২৯ generated CLI file exact restore; child/main source clean এবং pristine upstream base। |
| Isolated deploy | Verified artifact দিয়ে নতুন main updater; **৩ GiB cap**, peak **১,৫০৬ MiB**, minimum headroom **১৮.৫৬০ GiB**, pressure normal, swap growth **০**। Isolated install, real Anthropic smoke, consistent database snapshot ও complete previous runtime preservation PASS। Desktop build/deploy flags ০। |
| Promotion | **2026-10-09 17:00:03.921 UTC / 23:00:03.921 Dhaka**, updater exit 0। Runtime `6e3dd8d50`; loopback এবং `omni.local` health 200; native backend/ingress TLS, scoped DNS PASS। প্রথম readiness poll-এর ECONNREFUSED-এর পরে service ready হয়েছে। |
| Deployment-পরবর্তী CLI | Sol, Astra ও GLMT—৩/৩ বাস্তব CLI fixture PASS। প্রতি route-এ Write, Read, Edit, Bash, Bash; মোট **১৫ actual tool call**। Retained ১৭ HTTP 200 call-এর selected executor/model match; আরও ২ nonstream suggestion call মিলিয়ে ১৯ route-verified call। |

সফল package: ~/.omniroute-builds/3.8.51-6e3dd8d50-attempt2/omniroute-3.8.51.tgz (স্থানীয় বা private reference; প্রকাশিত নয়), **99,631,665 bytes**। SHA-256: `5a889ed25b6afd0fe62325810aa8dd0f4fd55fa2c030e1c7dd4ea8ec035496f3`; archive `dist/BUILD_SHA=6e3dd8d50`। Full build receipt (স্থানীয় বা private reference; প্রকাশিত নয়), deployment receipt (স্থানীয় বা private reference; প্রকাশিত নয়), শেষ release acceptance (স্থানীয় বা private reference; প্রকাশিত নয়)।

Rollback package: `~/.omniroute-builds/3.8.51-770a768b1/omniroute-3.8.51.tgz`। Complete previous runtime: `~/.omniroute-builds/runtime-backups/20261009-225858`, তার BUILD_SHA `770a768b1` যাচাই হয়েছে। Consistent DB snapshot: `~/.omniroute-local/update-backups/20261009-225858/storage.sqlite`। `current`, `previous`, `previous-runtime` regular pointer file; symlink নয়, প্রতিটির target exists। সফল artifact/source/data/rollback মুছে বা overwrite করা হয়নি।

### Suggestion retry এবং token ব্যবহারের সীমিত ফল

Deployment-এর আগে own native sample-এ ৩০ request-এর মধ্যে ১৯ HTTP 200 এবং **১১ HTTP 502** ছিল; ১১টিই optional next-prompt suggestion। Deployment-এর পরে বাস্তব native streaming suggestion content null, tool call ০, finish reason stop সহ **HTTP 200** হয়েছে; ওই ৫-request native sample-এ 502 নেই। ছোট actual-native-instruction-template দিয়ে nonstream Sol ও Astra-ও content `[]`, `end_turn`, HTTP 200—দুইটি PASS। এটি বৈধ silence; fake content তৈরি করা হয়নি।

একটি আলাদা minimal synthetic Sol nonstream prompt প্রথমে ৯০ সেকেন্ড timeout/abort, retained HTTP **499**, response null এবং token ০ হয়েছিল। তার নির্দিষ্ট কারণ প্রমাণিত নয়। ওই batch-এর ৬ boundary probe PASS হলেও intended ৮-probe batch-এর summary PASS নয়; original failed result রাখা হয়েছে। পরে actual native template-এর ছোট Sol/Astra case এবং বাস্তব streaming native case আলাদা প্রমাণ। Timeout receipt (স্থানীয় বা private reference; প্রকাশিত নয়), Astra nonstream (স্থানীয় বা private reference; প্রকাশিত নয়), Sol nonstream (স্থানীয় বা private reference; প্রকাশিত নয়)।

অপ্রয়োজনীয় 502 retry-এর নির্দিষ্ট কারণ fix হয়েছে, কিন্তু weekly allowance কত শতাংশ সাশ্রয় হবে তার controlled before/after measurement হয়নি। Native conversation-এ প্রায় ১০২–১০৩ হাজার input-context token ছিল; input/cache/provider-reported quota আলাদা মাপ। এই audit থেকে সব token বৃদ্ধি কেবল OmniRoute-এর জন্য, অথবা এখন আগের সমান quota চলবে—কোনোটিই বলা যায় না। GLMT-এর ওই native response-এ ৮,০১৬ output token ও দীর্ঘ latency-ও আলাদা model-behavior evidence।

### Data/config, connections এবং publication

Immediate pre/post promotion-এ **১৩/১৩ retention check PASS**: provider ২৫, API key ৩, তাদের exact ID sets, ১৪ mapping, operator enable/paused/priority state, usage rows ৭১,৯৩৪ এবং official config hashes retained। Full settings hash বদলেছিল কেবল `_settingsRevision`, `codex_catalog_revalidated_version`, `provider_limits_auto_sync_last_run`—source-qualified startup bookkeeping। Original mismatch receipt এবং resolved receipt দুটিই retained।

শেষ 17:13:11 UTC read-only inventory-তে provider ২৫, key ৩, mapping ১৪, usage **৭২,০২৮**; provider/API-key ID hashes এবং operator/mapping hashes একই। Usage increase-এর মধ্যে এই QA ও concurrent usage দুটিই থাকতে পারে; সব বৃদ্ধি এই QA-এর বলে ধরা হয়নি। Immediate postdeploy-এর পর settings-এ শুধু `_settingsRevision` ও scheduler-এর `model_sync_last_run` বদলেছে। `.claude/settings.json` bytes-এর hash একই। Deployment-এর immediate pre/post `.claude.json` hash একই ছিল, কিন্তু পরবর্তী বাস্তব client usage-এর শেষে `.claude.json` hash বদলেছে; original file-level diff না থাকায় সেই পরবর্তী পরিবর্তনের নির্দিষ্ট লেখক/কারণ দাবি করা হচ্ছে না। এই task official app/config edit করেনি।

Canonical Google verification এখনও **৪ active + ২ paused**; কোনো account enable, forced quota/verification clearing হয়নি। আগের 12:37 UTC / 18:37 Dhaka connection-affine matrix-এ ২৩ active-এর ১০ সফল প্রমাণ, ১৩ failure—৯ quota/rate-limit এবং ৪ verification; ২ paused skip। সেই matrix-এর সময় স্পষ্ট রাখা হলো; এটি নতুন করে সব account-এর inference retry নয়। প্রয়োজনীয় owner action হলো সংশ্লিষ্ট account-এর স্বাভাবিক verification সম্পন্ন করা অথবা quota reset-এর অপেক্ষা। Credential/private verification URL এখানে নেই।

Owned **private** [developerjillur/omniroute-optimizer](https://github.com/developerjillur/omniroute-optimizer)-এ commit [`7bc9d1cbf4d5baa4e8215959dbeafc66018ad1c2`](https://github.com/developerjillur/omniroute-optimizer/commit/7bc9d1cbf4d5baa4e8215959dbeafc66018ad1c2) push এবং remote verify হয়েছে। **২৯২টি `nexa/` file, ১,১০৬,৮২২ bytes**, source commit `6e3dd8d503b7fde3718384c84bb058c6e570fe39`, nexa tree `3d2902b5f69e91673d627fa51421341596fb80ae`—local/remote exact match; Gitleaks PASS। Manifest ২২২ = ১৪১ patch + ৭৬ new + ৫ tooling। Runtime, database, credential, release archive export হয়নি। Public OSS repository-তে push/PR হয়নি। Commit author/committer Jillur Rahman; normal hooks retained, কোনো bypass নয়।

### Rating ও অবশিষ্ট পরীক্ষার সীমা

আগের সমান rubric: ১০ bounded CLI feature × ৩ target। **Sol ৯/১০, Astra ৯/১০, GLMT ৮/১০; মোট ২৬/৩০ = ৮.৭/১০**। তিন hosted-search capability failure এবং GLMT image failure এই score থেকে বাদ পড়েনি; unsupported boundary guard-এর expected 400 PASS-কে feature support PASS বানানো হয়নি। Deployment-পরবর্তী core file/tool flow তিন route-এ ৩/৩ PASS এবং native same-chat/restart acceptance PASS আলাদা ফল। GLMT exact-marker mismatch ও latency-এর কারণে এই score-কে native output-quality score বলা যাবে না। সব native workflow-এর একটি কৃত্রিম ১০/১০ দেওয়া হয়নি।

৪৯ native declaration/৪৮ client schema, ১৪৪ protocol assertion, ৪১৩ Skill metadata, ২৯ Nexa registration, ১,৮৮০ offline Nexa PASS/৩ skipped এবং MCP catalog checks বিস্তৃত coverage দেয়; এগুলো সব tool-এর বাস্তব outbound/device/paid action execution-এর বিকল্প নয়। Paid generation, long render, actual device, real outbound message/payment, new agents/schedules, এবং প্রতিটি plugin-এর business workflow চালানো হয়নি। নিরাপদ fixture-এ execution হয়েছে এমন row ও কেবল registration/schema যাচাই এমন row আগের detailed tables/CSV-তে আলাদা আছে।

### Session/resource পরিচালনা ও evidence audit

সর্বশেষ অনুমোদন অনুযায়ী Chrome ও Claude স্বাভাবিকভাবে quit করা হয়েছে; force-kill হয়নি। Claude quit dialog-এ অন্য একটি research session চলার কথা ছিল এবং স্বাভাবিক quit-এ সেটি interrupted হয়েছে। তারপর Claude reopen করে own fixture-এ postdeploy native QA হয়েছে; অন্য research session resume/message করা হয়নি। এই task Chrome পুনরায় চালায়নি।

ছোট Sol follow-up probe-এর আগে ৩ GiB admission reserve মেলেনি, তাই job শুরু হয়নি। সেই tiny probe-এর cap ৫১২ MiB-তে কমিয়ে ১০ GiB reserve বজায় রেখে চালানো হয়; actual peak প্রায় ৬৫ MiB। এটি guard bypass নয়। শেষ 17:13:39 UTC check-এ pressure normal, swap ৮৫৫.৫০ MiB, physical headroom ৮.১২৫ GiB, internal disk ৩২.৬৫৫ GiB, T7 mounted, Blender process নেই। কোনো নতুন heavy job শুরু হয়নি; সব build/install ইতিমধ্যে শেষ।

Routing audit-এর প্রথম receipt SHA-256 ধরে legacy `artifact_sha256` column মিলাতে গিয়ে false mismatch দেয়। Source `src/lib/usage/callLogArtifacts.ts:121–129` অনুযায়ী column-টি আসলে ৮-hex FNV-1a checksum রাখে। V2 audit সেই contract মিলিয়ে checksum verify করেছে এবং evidence file-এর আলাদা প্রকৃত ৬৪-hex SHA-256 গণনা করেছে; **সব routing/actual-tool assertions PASS**। প্রথম audit receipt মুছেনি বা success লিখে বদলায়নি।

পুরোনো `omniroute-build-deployment` follow-up **আগে থেকেই PAUSED**, config আবার দেখে নিশ্চিত হয়েছে; নতুন automation চালু করা হয়নি। এই append-এর আগের report/handoff bytes exact prefix হিসেবে hash-verified অবস্থায় রাখা হয়েছে।
