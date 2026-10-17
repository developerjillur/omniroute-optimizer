> **ঐতিহাসিক নথি — public copy, ২০২৬-১০-১৭।** মূল ঘটনার তারিখ ও ফল এই নথির নিজস্ব সময়ের জন্য প্রযোজ্য; পরের সংযোজন থাকতে পারে। বর্তমান অবস্থা ও কাজের নিয়মের জন্য [বর্তমান handoff](../CURRENT-STATUS-2026-10-17.md) পড়ুন। Private reference ও identifier সরানো হয়েছে; স্থানীয় evidence এখানে অন্তর্ভুক্ত নেই। পুরোনো cleanup, build, deploy বা service command বর্তমান অনুমতি হিসেবে ব্যবহার করবেন না।

# OmniRoute দিয়ে native Claude: account, quality, scheduled task ও routine যাচাই

প্রস্তুতকারী: Jillur Rahman<br>
যাচাইয়ের তারিখ: ২ অক্টোবর ২০২৬<br>
স্থানীয় setup: `<local-setup>`<br>
যাচাইয়ের ধরন: native app-এর read-only পর্যবেক্ষণ, স্থানীয় configuration ও installed runtime-এর কোড পরীক্ষা, বর্তমান official documentation পড়া।

## ১. আপনার প্রশ্নের সরাসরি উত্তর

**আপনার সব শর্ত একসঙ্গে বর্তমান OmniRoute Agent Bridge দিয়ে পূরণ হচ্ছে বলে নিশ্চিত করা যাচ্ছে না।** তিনটি Claude Max account থেকে model inference চালানো, native Claude account-এর chat/project একত্র রাখা, এবং সব native feature আগের মতো বজায় রাখা আলাদা কাজ। Agent Bridge মূলত network request routing করে; account-এর storage, project ownership, cloud environment ও routine ownership একত্র করার ব্যবস্থা নয়।

**“OmniRoute ব্যবহার করলে quality অবশ্যই খারাপ” দাবিও এই তদন্তে প্রমাণিত হয়নি।** একই model, একই context, একই effort ও একই tool protocol বজায় থাকলে কাছাকাছি সক্ষমতা আশা করা যায়। কিন্তু আপনার বর্তমান route-এ এই শর্তগুলোর end-to-end পরীক্ষা হয়নি। Bridge ও Claude OAuth path-এর কোডে request পরিবর্তনের প্রমাণ আছে। তাই zero quality loss বা ১০০% feature parity ঘোষণা করার ভিত্তি নেই।

আপনার বর্তমান Claude login, model/effort preference, scheduled task ও routine পরিবর্তন করা হয়নি। Bridge চালু করা হয়নি, certificate trust বা DNS বদলানো হয়নি, নতুন account যোগ করা হয়নি, inference বা routine run শুরু করা হয়নি।

## ২. আপনার কম্পিউটারে যা সরাসরি দেখা গেছে

| বিষয় | পর্যবেক্ষিত অবস্থা | এর অর্থ |
| --- | --- | --- |
| Claude Desktop | `2.19675.0` | এই installed app পর্যবেক্ষণ করা হয়েছে |
| Claude Code CLI | `2.1.286` | CLI version যাচাই করা হয়েছে; inference চালানো হয়নি |
| Native interface | `Claude` ও `Code` | বর্তমান account নতুন unified Claude experience দেখাচ্ছে |
| Code environment | `Local` | পর্যবেক্ষিত Code screen স্থানীয় environment-এ ছিল |
| Code model | `Sonnet 5.5` | পুরোনো Sonnet model দিয়ে এটিকে সমান বলা যাবে না |
| Effort | `Extra` | settings-এ `claude-sonnet-5-5` effort `xhigh` আছে |
| Permission mode | `Auto` | native behavior তুলনায় classifier ও tool execution-ও ধরতে হবে |
| Fast mode | Off | quality তুলনায় একই অবস্থা রাখতে হবে |
| Native usage | Weekly all models `100%`; out of usage credits | বর্তমান account-এর quota বাধা দেখা গেছে |
| Routines menu | `Local` ও `Cloud` | app-এ দুটো scheduling ব্যবস্থা আলাদা |
| Existing routine | তালিকায় একটি Active routine দেখা গেছে | Active label সফল execution-এর প্রমাণ নয়; run history পরীক্ষা করা হয়নি |
| Claude settings | `model: opus`; আলাদা model-এর effort preferences আছে | global preference ও বর্তমান session selection একই বিষয় নয় |
| Gateway env in user settings | `ANTHROPIC_BASE_URL`, `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_API_KEY` নেই | এই settings file-এ OmniRoute gateway জোর করে বসানো হয়নি |
| Desktop preferences plist | top-level inference/deployment keys পাওয়া যায়নি | এই পড়া file-এ third-party inference mode-এর evidence নেই |
| Scheduling flags | `ccdScheduledTasksEnabled: true`, `coworkScheduledTasksEnabled: true` | preferences-এ feature flags on; task execution আলাদা যাচাই দরকার |
| OmniRoute | `3.8.51` | আগের audit-এর installed runtime ও source baseline |
| OmniRoute provider connections | `claude`, `antigravity`, `agy`, প্রতিটিতে একটি active OAuth connection | এগুলো তিনটি Claude account নয়; Claude connection একটি |
| Agent Bridge | আগের live diagnosis-এ Stopped, DNS/CA setup হয়নি | বর্তমান native কাজ bridge দিয়ে চলছে বলে evidence নেই |
| Bridge mappings/state | সংশ্লিষ্ট SQLite tables-এ শূন্য row | নতুন Claude account pool বা bridge mapping configured পাওয়া যায়নি |
| Custom combo | শূন্য | আপনার তিন Claude account-এর নির্দিষ্ট combo তৈরি নেই |

Native usage reset screen-এ `Tue, Oct 6, 6:00 PM` দেখিয়েছে। এটি account-এর point-in-time UI observation; কোনো quota purchase বা account switch করা হয়নি। অন্য client project-এর নাম, routine prompt, account email ও credentials এই রিপোর্টে রাখা হয়নি।

## ৩. Chat history, project ও provider credential কেন আলাদা

আপনার পরিকল্পনায় একটি স্থায়ী frontend থাকবে, যার পিছনে তিনটি account quota ব্যবহার হবে। Model gateway এই inference অংশটি নিয়ন্ত্রণ করতে পারে, যদি client ও upstream protocol তা সমর্থন করে। কিন্তু standard Claude-এর account identity, chat/project storage ও connector authorization Anthropic-এর account ব্যবস্থায় থাকে। Native app account A-তে sign in থাকলে provider token B ব্যবহার করানো account B-এর পুরোনো chats/projects A-তে এনে দেয় না।

Anthropic-এর data export documentation অনুযায়ী personal account-এর exported history অন্য personal account-এ import করার ব্যবস্থা নেই; personal account-গুলোর মধ্যে migration-ও supported নয়। তাই তিনটি Max account-এর পুরোনো history একত্র করে native app-এ রাখা OmniRoute-এর available feature হিসেবে ধরে নেওয়া যাবে না। [Official data export ও migration সীমা](https://support.claude.com/en/articles/9450526-export-your-claude-data)।

আপনি logout করলে আগের account-এর chats আর বর্তমান account-এর sidebar-এ না দেখা এবং disk-এর project files মুছে যাওয়া এক ঘটনা নয়। এই তদন্তে logout/account switch করা হয়নি, ফলে আপনার পুরোনো sessions কোথায় আছে বা সব account-এ কোনটি দৃশ্যমান তা পরীক্ষা করা হয়নি। Local repository files, local session data, synced cloud chat ও cloud Code project আলাদা inventory দিয়ে বিচার করতে হবে।

Claude Code CLI-এর স্থানীয় transcript client-এর storage-এ থাকে। Gateway provider account বদলানো নিজে থেকে সেই transcript মুছে ফেলার কাজ নয়; client প্রয়োজনীয় history পরের request-এ দিলে coding continuity সম্ভব হতে পারে। কিন্তু native Desktop sidebar-এর সব account session একইভাবে দেখা যাবে—এটি আলাদা দাবি, এবং বর্তমান setup-এ পরীক্ষিত নয়।

## ৪. Native Desktop-এর official gateway support আছে, কিন্তু mode বদলায়

একটি গুরুত্বপূর্ণ সংশোধন: native Claude Desktop-এর জন্য এখন official third-party inference configuration আছে। তাই “Desktop কোনো gateway ব্যবহার করতে পারে না” বলা সঠিক নয়। এটি OmniRoute-এর Agent Bridge থেকে আলাদা integration path।

Claude Desktop on 3P-তে Chat, Cowork ও Code-এর core কাজ স্থানীয় app-এ করা যায়, inference configured provider-এ যায় এবং conversation history স্থানীয় disk-এ থাকে। এটি standard account-backed Desktop-এর storage architecture থেকে আলাদা। Existing তিনটি account-এর cloud history automatically merged বা migrated হবে—এই documentation এমন নিশ্চয়তা দেয় না। [Official 3P architecture](https://claude.com/docs/third-party/claude-desktop/overview)।

Official gateway configuration app-এর third-party inference settings দিয়ে করতে হয়। শুধু CLI-এর `ANTHROPIC_BASE_URL` user settings-এ বসানো Desktop gateway configuration-এর বিকল্প নয়। Gateway mode-এ Desktop local sessions চালায়; SSH, Anthropic-hosted cloud environment ও Remote Control unavailable হয়। [Desktop gateway surface configuration](https://code.claude.com/docs/en/llm-gateway-connect#desktop-app)।

In-app configuration window-এ Apply Changes দিলে configuration লেখা হয় ও app relaunch হয়। এই তদন্তে Developer Mode চালু বা Apply Changes করা হয়নি। আপনার app-এ বিদ্যমান কাজের মধ্যে restart করা হয়নি। [Official in-app configuration](https://claude.com/docs/third-party/claude-desktop/in-app-configuration)।

এই mode আপনার ভবিষ্যতের এক জায়গায় local history রাখার লক্ষ্যের কিছু অংশে প্রাসঙ্গিক হতে পারে। কিন্তু সব existing account data, cloud routines ও অন্য native feature একই থাকবে—আপনার সেই পূর্ণ শর্তের সমান নয়।

## ৫. Agent Bridge-এর Claude Code card আসলে কতটুকু বোঝায়

Installed standalone routing helper-এ `claude-code`-এর request pattern `/v1/messages` এবং destination OmniRoute-এর `/v1/messages`। Target `api.anthropic.com`। এটি Messages API inference routing-এর wiring; standard `claude.ai` account frontend-এর chat/project APIs migrate করার wiring নয়।

OmniRoute-এর নিজস্ব AgentBridge document-এ Cowork/Anthropic desktop এখনও backlog viability assessment-এর তালিকায় আছে। এই document-এর “custom base URL নেই” যুক্তি নতুন official Desktop 3P documentation-এর তুলনায় পুরোনো হতে পারে। তাই বর্তমান Anthropic integration বোঝার জন্য official docs-কে অগ্রাধিকার দিতে হবে; পাশাপাশি installed bridge-এ Cowork support সম্পূর্ণ হয়েছে ধরে নেওয়া যাবে না।

স্থানীয় source: standalone routing (স্থানীয় বা private reference; প্রকাশিত নয়), OmniRoute AgentBridge roadmap (স্থানীয় বা private reference; প্রকাশিত নয়)।

আগের live audit-এ port `443` Local WordPress-এর nginx ব্যবহার করছিল। Bridge চালু করলে এই port conflict আগে সমাধান করতে হবে। এছাড়া target registry-তে Kiro ও Claude Code দুটোর `api.anthropic.com` host আছে, আর standalone host map প্রথম registered identity রেখে দেয়। ভুল agent mapping পড়ার ঝুঁকি রয়েছে। এই কারণে শুধু Claude Code card অন করে native parity পাওয়া যাবে ধরে নেওয়া ঠিক হবে না। বিস্তারিত: [পূর্বের Agent Bridge রিপোর্ট](OMNIROUTE-AGENT-BRIDGE-BANGLA-2026-10-02.md)।

## ৬. Request হুবহু থাকছে না: নির্দিষ্ট runtime evidence

Installed runtime ও repository source-এর নিচের গুরুত্বপূর্ণ files SHA-256 মিলিয়ে identical পাওয়া গেছে: `server.cjs`, `base.ts`, `claudeIdentity.ts`, `anthropicHeaders.ts`, `passthroughHelpers.ts` এবং Claude client version constants। তাই এই observations শুধু অন্য branch-এর ধারণা নয়।

### ৬.১ Bridge client headers সঙ্গে পাঠায় না

`server.cjs`-এর `intercept()` OmniRoute-এ POST করার সময় নতুন header set বানায়: Content-Type, OmniRoute Authorization ও দুটি routing metadata header। Original client-এর `anthropic-beta`, `anthropic-version`, User-Agent ও Claude session headers এই fetch-এ forward করার logic দেখা যায়নি। Response-এ fixed SSE headers দিয়ে body stream করে; upstream-এর সমস্ত usage/rate-limit headers client-এ ফিরিয়ে দেওয়ার logic-ও এই block-এ নেই।

এতে client যে capability negotiate করেছে তার তথ্য gateway-এর কাছে হারাতে পারে। পরে gateway কিছু beta নিজের logic দিয়ে যোগ করলেও original negotiated set verbatim রক্ষা হয় না। Auto classifier, tool search, preserved thinking, context management ও effort-এর compatibility আলাদা পরীক্ষা প্রয়োজন। Actual bridge forwarding code (স্থানীয় বা private reference; প্রকাশিত নয়)।

### ৬.২ Claude OAuth executor request পরিবর্তন করে

Native `claude` provider-এর OAuth path-এ tool name remapping/cloaking, schema sanitization, body obfuscation, কিছু tool cache marker মুছে দেওয়া, system prefix পুনর্গঠন, account/session metadata synthesis এবং configurable system transformations-এর code রয়েছে। Thinking/effort-এর কিছু অবস্থায় default বা repair logic-ও চলে। এটি transparent byte-for-byte relay নয়। Executor code (স্থানীয় বা private reference; প্রকাশিত নয়)।

এই পরিবর্তনের সবগুলো output কমিয়ে দেয়—এমন দাবি করছি না। অনেকটি compatibility repair হিসেবে লেখা। কিন্তু আপনার শর্ত যেহেতু original working way ও quality অক্ষুণ্ণ রাখা, request পরিবর্তনের এই প্রমাণ উপেক্ষা করা যাবে না।

### ৬.৩ Beta forwarding allowlist আছে

`mergeClientAnthropicBeta()` client beta শুধু নির্দিষ্ট allowlist থেকে merge করে। Native provider নিজস্ব derived beta set-ও তৈরি করে। নতুন Claude capability এসে allowlist-এর বাইরে থাকলে header preservation অসম্পূর্ণ হওয়ার সম্ভাবনা আছে। Beta forwarding implementation (স্থানীয় বা private reference; প্রকাশিত নয়)।

Official compatibility guide `anthropic-version` ও `anthropic-beta` অপরিবর্তিত forward করতে বলে। Request body/header capability pairing ভাঙলে error বা feature loss হতে পারে; custom base URL-এ fine-grained tool streaming default-ও direct connection-এর মতো থাকে না। [Official gateway protocol](https://code.claude.com/docs/en/llm-gateway-protocol)।

### ৬.৪ Passthrough improvement আছে, তবুও পূর্ণ সমতা প্রমাণ নয়

Claude-to-Claude request-এর জন্য OpenAI round-trip translation এড়ানোর passthrough branch আছে। বর্তমান thinking-signature helper thinking blocks অপরিবর্তিত ফেরায়; code comment-এ পুরোনো rewrite regression সংশোধনের ব্যাখ্যা আছে। এগুলো উপকারী compatibility improvement। কিন্তু executor-এর পরের transformations ও bridge header gap এর ফলে পুরো route-কে অপরিবর্তিত বলা যায় না। Claude passthrough branch (স্থানীয় বা private reference; প্রকাশিত নয়), Thinking replay helper (স্থানীয় বা private reference; প্রকাশিত নয়)।

## ৭. Quality সম্পর্কে কী বলা যায়

Quality যাচাইতে শুধু UI model label দেখা যথেষ্ট নয়। Actual upstream model ID, effort, context, system instructions, tool definitions, native client behavior এবং response handling একসঙ্গে দেখতে হবে।

| শর্ত | কী রাখতে হবে | বর্তমান evidence |
| --- | --- | --- |
| Model identity | Native selection-এর exact upstream model/build | `Sonnet 5.5` native-এ দেখা গেছে; OmniRoute দিয়ে এটি successfully served হয়েছে যাচাই নেই |
| Effort | বর্তমান `Extra`/`xhigh` payload ও আচরণ | native preference আছে; bridge route-এ unchanged pass হওয়া যাচাই নেই |
| Context | পুরো প্রয়োজনীয় messages, tool results, images, attachments | long-session equivalence test হয়নি |
| Thinking | native adaptive/preserved thinking ও signatures | compatibility code আছে; আপনার account দিয়ে পরীক্ষা হয়নি |
| Tools | Bash, edits, MCP, deferred tool loading, native connectors | standalone bridge negotiated headers হারায়; end-to-end test হয়নি |
| Permission behavior | বর্তমান `Auto` mode-এর classifier flow | request pairing code আছে; native parity verification হয়নি |
| Model routing | একই model-এর অনুমোদিত credentials, দৃশ্যমান failures | নির্দিষ্ট তিন Claude credential pool নেই |
| Compression | meaning/context কমানো হচ্ছে কি না | আগের audit-এ global compression off; এই DB-তে explicit thinkingBudget unset, source default passthrough |
| Cache | native prompt cache বনাম proxy response reuse আলাদা | DB flags-এ prompt ও semantic cache enabled; actual native route cache hit behavior পরীক্ষা হয়নি |
| Output reliability | reconnect, cancellation, rate limits, retries | production workload test হয়নি |

OmniRoute static Claude registry-তে Opus/Sonnet 5 entries আছে। তাই “শুধু 4.x models আছে” বলা ভুল হবে। কিন্তু inspected static registry-তে exact `5.5` entries দেখা যায়নি। Dynamic catalog/model forwarding আলাদা হতে পারে; static absence দিয়ে upstream failure নিশ্চিত করা যায় না। আপনার native `Sonnet 5.5`-এর same-model successful route test দরকার। Claude registry (স্থানীয় বা private reference; প্রকাশিত নয়)।

কোনো `auto/*`, best/cheap/free combo, অন্য provider-এর Claude নামের model বা পুরোনো model নির্বাচন করে native `Sonnet 5.5 Extra`-এর সমান quality বলা যাবে না। বেশি account থাকার ফলে quota availability বাড়তে পারে; সেটি নিজে থেকে model intelligence বা output quality বাড়ানোর প্রমাণ নয়।

একই native model direct connection-এও প্রত্যেকবার শব্দে শব্দে identical response দেওয়ার নিশ্চয়তা নেই। অর্থবহ লক্ষ্য হলো feature compatibility, capability preservation ও representative task performance; finite test দিয়ে ভবিষ্যতের সব task-এ কখনও quality drop হবে না প্রমাণ করা যায় না।

## ৮. Scheduled task ও routine: আলাদা সরাসরি উত্তর

| ব্যবস্থা | কোথায় চলে | OmniRoute-এর ভূমিকা | এই setup-এ সিদ্ধান্ত |
| --- | --- | --- | --- |
| Standard Claude/Cowork scheduled task | বর্তমান help docs অনুযায়ী remote account service | স্থানীয় Agent Bridge cloud execution-কে reroute করে না | native account-এ চলতে পারে; তিন Max account quota pool দিয়ে চলবে না |
| Claude Code Cloud routine | Anthropic-managed infrastructure, অথবা প্রযোজ্য organization runner | আপনার Mac-এর local endpoint এই cloud session-এর gateway নয় | নিজের account usage/limits থাকে; স্থানীয় pool দিয়ে quota rescue নয় |
| Claude Code Desktop Local scheduled task | আপনার Mac | সফল compatible local inference integration হলে request gateway-এ যেতে পারে | possible path; আপনার actual task দিয়ে পরীক্ষা হয়নি |
| CLI `/loop` | চালু local session | session-এর inference route ব্যবহার করতে পারে | cloud routine-এর সমতুল্য নয়; session/machine চলতে হবে |
| CLI `/schedule` | account-এ cloud routine তৈরি/পরিচালনা করে | gateway credential native subscription identity-এর বিকল্প নয় | gateway auth সক্রিয় হলে command availability বদলাতে পারে |

**Cloud routine:** official docs অনুযায়ী routines individual claude.ai account-এর, তার usage ব্যবহার করে। `/schedule` subscription login চায়; API/gateway credential সেট থাকলে CLI-তে সেটি unavailable হতে পারে। Web UI দিয়ে account-এর routines পরিচালনা আলাদা করে করা যায়। [Official routines documentation](https://code.claude.com/docs/en/routines)।

**Local Code scheduled task:** app open ও Mac awake থাকলে এটি স্থানীয়ভাবে চালু হয়। Settings-এর permission rules প্রয়োগ হয়। Scheduler আছে মানেই gateway inference, tools ও সব native feature tested নয়। [Official Desktop scheduled tasks](https://code.claude.com/docs/en/desktop-scheduled-tasks)।

**Claude/Cowork scheduled task:** বর্তমান help article remote execution বর্ণনা করছে এবং Pro/Max-এর ৬ অক্টোবর ২০২৬ transition-এর কথা বলছে; আগে computer-এ শুরু হওয়া কাজ সেখানে থাকে। আপনার account/version অনুযায়ী পুরোনো local ও নতুন remote কাজ আলাদা হতে পারে। সব Claude schedule-এর জন্য “Mac চালু থাকলেই হবে” বা “সবসময় cloud-এ চলে” এক নিয়ম দেওয়া যাবে না। [Current scheduling help](https://support.claude.com/en/articles/13854387-schedule-recurring-tasks-in-claude-cowork)।

Official gateway connect documentation সরাসরি জানায় cloud session gateway deployment-এর অংশ নয়; cloud environment-এ gateway variables বসালেও তা inference routing-এ প্রয়োগ হয় না। [Cloud surface routing](https://code.claude.com/docs/en/llm-gateway-connect#slack-cloud-sessions-and-remote-control)।

সুতরাং আপনার “আগের মতো scheduled feature ও routine থাকবে, শুধু তিন account-এর provider পাল্টাবে” প্রত্যাশার cloud অংশ পূরণ হচ্ছে না। Native services রাখতে standard account login রাখতে হবে; সেই services নিজের account-এর usage ও permission ব্যবস্থাতেই থাকবে।

## ৯. তিনটি Max account: credential pool ও eligibility

বর্তমান OmniRoute-এ Claude credential একটি। `antigravity` এবং `agy` Google-side provider identities; তাদের Claude model option থাকলেও সেগুলো আপনার অন্য দুটি Claude Max subscription নয়। তাই “তিন account already connected” বলা যাবে না।

OmniRoute-এর provider/failover ব্যবস্থা একাধিক connection বেছে নেওয়ার জন্য ব্যবহার হতে পারে। কিন্তু তার selection, cooldown, concurrency ও stickiness নির্দিষ্ট native workload-এর সঙ্গে পরীক্ষা করতে হয়। একই conversation-এ account rotation হলেই সব feature একই থাকবে—এটিও independent validation দাবি। OmniRoute failover document (স্থানীয় বা private reference; প্রকাশিত নয়)।

Max subscription ও API billing এক entitlement নয়। Official gateway path-এ gateway credential দিলে upstream credential owner-এর billing প্রযোজ্য হয়; নিজের saved subscription login দিয়ে credential-transparent routing করার documented case-ও আছে। সেটি তিন account-এর history/quotas মিশিয়ে দেওয়ার প্রতিশ্রুতি নয়। [Subscriptions and gateways](https://code.claude.com/docs/en/llm-gateway#subscriptions-and-gateways)।

Anthropic-এর current authentication policy native application-এ নিজের subscription login এবং third-party developers-এর credential intermediation আলাদা করে। Personal তিন-account OmniRoute pool স্পষ্টভাবে approved deployment হিসেবে নথিতে পাওয়া যায়নি; এটিকে officially supported বা দীর্ঘমেয়াদে অবাধে কাজ করবে বলে নিশ্চয়তা দেওয়া যাচ্ছে না। API-key gateway ও নিজের unmodified native login documented ভিত্তি। [Official authentication and credential policy](https://code.claude.com/docs/en/legal-and-compliance#authentication-and-credential-use)।

## ১০. “Claude Code configuration as it is” কীভাবে বিচার করতে হবে

আপনার বর্তমান user settings-এ model preferences, plugins, marketplace configuration, notifications, remote-control preference ও অন্য native options আছে। শুধু gateway চালানোর জন্য সেগুলো reset বা replace করার প্রয়োজন ধরে নেওয়া ঠিক নয়। এই তদন্তে এগুলো edit করা হয়নি।

কিন্তু দুটি আলাদা integration বুঝতে হবে:

1. **CLI:** gateway root হিসেবে `http://127.0.0.1:28128` এবং উপযুক্ত gateway credential configure করা যায়। Claude Code `/v1/messages` যোগ করে। Client-side tools/settings থাকা এবং server/account-dependent feature থাকা আলাদা validation বিষয়।
2. **Native Desktop:** official third-party inference configuration আলাদা। User settings file-এ CLI variables দিলেই Desktop একই mode-এ route করবে ধরে নেওয়া যাবে না। 3P mode-এর documented capability limits আগে মেনে নিতে হয়।

এখন কোনো configuration snippet apply করা হয়নি। আপনার user settings-এর model/effort এক model-এ force করা হয়নি, Opus/Sonnet/Haiku সব role-কে একই upstream-এ map করা হয়নি, `CLAUDE_CONFIG_DIR` বদলে আলাদা history profile তৈরি করা হয়নি, Auto permission behavior বদলানো হয়নি।

আগের OmniRoute রিপোর্টে CLI direct integration-এর সুপারিশ ছিল। সেটিকে native Desktop-এর সব feature হুবহু বজায় রাখার সমাধান হিসেবে পড়া যাবে না। বর্তমান রিপোর্টে এই গুরুত্বপূর্ণ সীমা স্পষ্ট করা হলো।

## ১১. আপনার উদ্দেশ্যের জন্য বাস্তব সিদ্ধান্ত

**সব native feature, existing account data ও cloud routines সবচেয়ে গুরুত্বপূর্ণ হলে:** standard Claude Desktop/native account flow বজায় রাখাই documented ভিত্তি। Account বদলালে তার account-owned data আলাদা থাকবে; OmniRoute দিয়ে personal accounts merge করার available ব্যবস্থা নেই।

**একটি local coding client-এ provider control গুরুত্বপূর্ণ হলে:** Claude Code CLI বা official Desktop 3P gateway integration প্রাসঙ্গিক। তবে Desktop 3P-এর local history ও local execution model মেনে নিতে হবে; standard cloud features পুরোপুরি একই থাকার শর্ত পূরণ হয় না। API credential বা অন্য documented upstream ব্যবহার করলে billing/entitlementsও যথাযথভাবে বিচার করতে হবে।

**বর্তমান Agent Bridge দিয়ে আপনার exact goal:** bridge এখনও বন্ধ, Claude pool নেই, native Cowork routing completed নয়, port/host mapping gap আছে এবং client capability headers forward হয় না। এটিকে native account login-এর সমান reliable replacement হিসেবে চালু করার সিদ্ধান্ত এই evidence সমর্থন করে না।

এই সিদ্ধান্তের অর্থ আপনার setup অকেজো নয়। OmniRoute অন্যান্য gateway client, provider routing, monitoring ও local coding inference-এ কাজে আসতে পারে। আপনার নির্দিষ্ট সব-feature-preserving native Max account pooling লক্ষ্যটি তার বর্তমান verified capability-এর বাইরে।

## ১২. Quality verification-এর গ্রহণযোগ্য মানদণ্ড

ভবিষ্যতে সীমিত local gateway trial হলে configuration review ও representative workload দিয়ে নিচের বিষয়গুলো প্রমাণ করতে হবে। এগুলো প্রস্তাবিত acceptance criteria; সম্পন্ন test results নয়।

| পরীক্ষা | গ্রহণযোগ্য ফল |
| --- | --- |
| Exact model routing | native selected model ID একই upstream-এ যায়; unsupported হলে দৃশ্যমান error |
| Effort/thinking | `Extra`/`xhigh`, adaptive thinking ও relevant context controls অক্ষুণ্ণ |
| Request preservation | full instructions/messages/tools/attachments এবং negotiated capability headers সংরক্ষিত |
| Tool cycle | read, edit, Bash, multiple tool calls ও cancellation native client-এ সঠিক |
| MCP/connector | আপনার প্রয়োজনীয় connector, tool discovery ও deferred schemas কাজ করে |
| Auto mode | actual classifier behavior এবং permission outcomes যাচাই করা |
| Long session | compaction, context replay, thinking blocks ও resume কাজ করে |
| Account failover | selected model একই থাকে; retry/cooldown/usage স্পষ্ট; transcript continuation verified |
| Local scheduled task | নির্ধারিত সময়ে একটি benign task শুরু, gateway route evidence, output ও run history verified |
| Cloud boundary | cloud routine native account-এর নিজস্ব route/usage ব্যবহার করছে স্পষ্টভাবে recorded |
| Native data preservation | existing chats/projects সংরক্ষিত; third-party local history migration assumed নয় |

এই test suite pass করলেও future update ও প্রতিটি task-এর quality চিরকাল identical হবে বলা যাবে না। বরং ওই version, route ও tested workload-এর compatibility প্রমাণ পাওয়া যাবে। আপনার বর্তমান exhausted subscription account দিয়ে native-versus-gateway quality comparison সম্পন্ন হয়েছে বলে দাবি করা হয়নি।

## ১৩. সংরক্ষণ ও যাচাইয়ের সীমা

Read-only investigation-এ কী করা হয়েছে: app version ও CLI version দেখা, Code screen ও Routines-এর Local/Cloud menu দেখা, SQLite থেকে credential count ও configuration flags পড়া, source-runtime hashes মেলানো, official documents পড়া। Routine-এর actual prompt বা client project contents কোনো report-এ অন্তর্ভুক্ত করা হয়নি।

কী সম্পন্ন হয়নি: তিন Claude account authentication, provider inference, quality benchmark, existing account data merge/migration, bridge activation, certificate/DNS setup, native gateway apply, scheduled run বা cloud routine execution test। Active feature flag বা visible routine-কে successful execution হিসেবে গণনা করা হয়নি।

এই read-only পর্যবেক্ষণের সময় পাওয়া configuration hashes:

- `~/.claude/settings.json`: `6d0a9a8873ba729e500609f0d9ddcc0cb6142406a41e30cf09bcf2d4dbbad3d9`
- `~/Library/Application Support/Claude/claude_desktop_config.json`: `58a7c293973d1ed5195f8265d82e752b071c5f166ba2a5d5f266cd50d5e0d77e`

এই hashes evidence snapshot; native app নিজে preferences লিখতে পারে, তাই এগুলো স্থায়ী future values হিসেবে ধরা যাবে না। নতুন এই রিপোর্টটি আলাদা নামে তৈরি করা হয়েছে; T7-এর পূর্বের রিপোর্ট overwrite করা হয়নি।

## ১৪. ব্যবহারযোগ্য নথি ও সূত্র

- [বর্তমান native parity রিপোর্ট](OMNIROUTE-CLAUDE-NATIVE-PARITY-BANGLA-2026-10-02.md)
- [পূর্ণ Agent Bridge audit](OMNIROUTE-AGENT-BRIDGE-BANGLA-2026-10-02.md)
- [পূর্ণ OmniRoute বাংলা review](OMNIROUTE-REVIEW-BANGLA-2026-10-02.md)
- [OmniRoute upstream repository](https://github.com/diegosouzapw/OmniRoute/)
- [Claude Desktop 3P architecture](https://claude.com/docs/third-party/claude-desktop/overview)
- [Claude Desktop 3P gateway](https://claude.com/docs/third-party/claude-desktop/gateway)
- [Official gateway connect](https://code.claude.com/docs/en/llm-gateway-connect)
- [Official gateway protocol](https://code.claude.com/docs/en/llm-gateway-protocol)
- [Official routines](https://code.claude.com/docs/en/routines)
- [Official local scheduled tasks](https://code.claude.com/docs/en/desktop-scheduled-tasks)
- [Current Cowork/Claude scheduled tasks](https://support.claude.com/en/articles/13854387-schedule-recurring-tasks-in-claude-cowork)
- [Personal account data export ও migration](https://support.claude.com/en/articles/9450526-export-your-claude-data)
- [Unified Claude experience rollout](https://support.claude.com/en/articles/16761823-claude-cowork-and-chat-are-one-claude)

এই রিপোর্টে findings হলো ২ অক্টোবর ২০২৬-এর installed version ও observed configuration-এর evidence। অনিষ্পন্ন compatibility বা quality-কে verified native parity হিসেবে উপস্থাপন করা হয়নি।
