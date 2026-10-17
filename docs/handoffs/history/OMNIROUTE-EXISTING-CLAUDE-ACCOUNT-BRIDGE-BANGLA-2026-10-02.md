> **ঐতিহাসিক নথি — public copy, ২০২৬-১০-১৭।** মূল ঘটনার তারিখ ও ফল এই নথির নিজস্ব সময়ের জন্য প্রযোজ্য; পরের সংযোজন থাকতে পারে। বর্তমান অবস্থা ও কাজের নিয়মের জন্য [বর্তমান handoff](../CURRENT-STATUS-2026-10-17.md) পড়ুন। Private reference ও identifier সরানো হয়েছে; স্থানীয় evidence এখানে অন্তর্ভুক্ত নেই। পুরোনো cleanup, build, deploy বা service command বর্তমান অনুমতি হিসেবে ব্যবহার করবেন না।

# বিদ্যমান Claude account রেখে Agent Bridge ব্যবহার: যাচাই ও বর্তমান setup

তারিখ: ২ অক্টোবর ২০২৬<br>
স্থানীয় setup: `<local-setup>`<br>
Dashboard: [Agent Bridge](http://omni.local/dashboard/tools/agent-bridge)

## ১. এখন কী অবস্থায় আছে

**আপনার original Claude.ai / Max account native Claude app-এ ফিরিয়ে দেওয়া হয়েছে। পুরনো chats, Projects, Code sessions এবং Routines আবার দেখা যাচ্ছে। App পুরোপুরি quit করে পুনরায় খুলেও standard account বজায় থাকার পরীক্ষা pass করেছে।**

**আপনার চাওয়া “এই একই account ও সব native feature রেখে, Agent Bridge Start করলে সব inference OmniRoute দিয়ে যাবে এবং Stop করলে default হবে” ব্যবস্থা বর্তমান stock OmniRoute দিয়ে সম্পূর্ণ চালু করা যায়নি। Live Agent Bridge এখনো stopped। এটিকে সফল configuration বা সম্পূর্ণ feature parity হিসেবে গণ্য করা যাবে না।**

| বিষয় | বর্তমান যাচাই করা অবস্থা |
| --- | --- |
| Native Claude identity | বিদ্যমান Jillur Rahman / Max account |
| পুরনো Chat history | Original account-এর sidebar-এ দৃশ্যমান |
| Projects | Original Projects page-এ পুরনো entries দৃশ্যমান; এই view-তে ১২টি entry পাওয়া গেছে |
| পুরনো Code sessions | বিদ্যমান project folders ও sessions আবার দৃশ্যমান |
| Restart-এর পর account | Standard account বজায় আছে |
| Code Routines | আগের একটি active hourly routine দৃশ্যমান; নতুন run চালানো হয়নি |
| Native Scheduled page | খোলা যায়; বর্তমান page-এ “No scheduled tasks yet” |
| Desktop auto-update | App log-এ enabled পাওয়া গেছে |
| Claude Code auto-update | Doctor-এ enabled, channel `latest` |
| Global CLI provider override | আগের configuration ফিরিয়ে দেওয়া হয়েছে |
| Live Agent Bridge | Stopped; certificate trusted নয়; DNS off |
| Bridge দিয়ে native app Start/Stop পরীক্ষা | সম্পন্ন হয়নি |
| Account usage | Original account-এ weekly usage 100%, out-of-usage-credits |
| OmniRoute-এ active Claude connections | ১টি; ৩টি connected account এখনো পাওয়া যায়নি |

এই table-এ history দৃশ্যমান পাওয়া মানে প্রতিটি পুরনো conversation ও file-এর পূর্ণ archival audit করা হয়েছে এমন নয়। কোনো conversation বা project delete/merge/import করা হয়নি।

## ২. আগের “নতুন account” view কী ছিল এবং কী ঠিক করা হয়েছে

আগের পরীক্ষায় Claude-এর official third-party inference configuration দিয়ে **OmniRoute Claude / Gateway** profile চালু হয়েছিল। এটি নতুন Anthropic account তৈরি করেনি। Standard deployment ও third-party deployment-এর user data আলাদা directory-তে থাকায় সেই profile-এ original account-এর cloud chats/projects দেখা যাচ্ছিল না।

- Standard data directory: `~/Library/Application Support/Claude/`
- Third-party data directory: `~/Library/Application Support/Claude-3p/`

এই দুই directory এখনো আছে। Gateway-এ করা আগের test sessions-ও সংরক্ষিত আছে; সেগুলো original cloud account-এর history-তে merge করা হয়নি।

Standard mode-এ ফেরার জন্য শুধু পৃথক Gateway session থেকে Sign out করা হয়েছে, তারপর login screen-এর **Or sign in with Claude.ai** ব্যবহার করা হয়েছে। App restart হয়ে আগের Max account নিজে ফিরে পেয়েছে। Original account-এর credentials পরিবর্তন বা original account থেকে logout করা হয়নি। Anthropic-এর [single-machine setup documentation](https://claude.com/docs/third-party/claude-desktop/installation) এই standard sign-in option দিয়ে ফেরার পদ্ধতি বর্ণনা করে।

শুধু empty `Default` profile নির্বাচন করলে standard mode ফিরে আসে না: configuration editor তখনও third-party provider-এর required fields চায়। তাই ওই profile Apply করা হয়নি।

Claude Code-এর `~/.claude/settings.json` থেকে আগের পরীক্ষায় যোগ করা routing overrides ফিরিয়ে দেওয়া হয়েছে:

- `ANTHROPIC_BASE_URL`
- `CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY`
- চারটি `ANTHROPIC_DEFAULT_*_MODEL` mapping
- gateway `apiKeyHelper`
- explicit gateway `availableModels` list

প্রতিটি key-এর original value থাকলে তা restore করা হয়েছে। অন্য current values বজায় রেখে তুলনা করার পর পুরো settings file original backup-এর সঙ্গে byte-for-byte identical পাওয়া গেছে। Original hooks, plugins, permissions, saved model এবং effort preferences অক্ষত আছে।

Original settings SHA-256:

`6d0a9a8873ba729e500609f0d9ddcc0cb6142406a41e30cf09bcf2d4dbbad3d9`

`claude auth status`-এ `loggedIn: true`, `authMethod: claude.ai`, `apiProvider: firstParty`, `subscriptionType: max` পাওয়া গেছে। Secret বা account identifiers রিপোর্টে রাখা হয়নি।

আগের credential helper ও saved Gateway profile রাখা হয়েছে, কিন্তু current CLI সেই helper ব্যবহার করছে না, এবং native app এখন standard deployment-এ চলছে। এই পরিবর্তন জরুরি: global `ANTHROPIC_BASE_URL` রেখে দিলে Agent Bridge Stop করলেও CLI OmniRoute-এ যেত।

## ৩. Agent Bridge-এর documented পদ্ধতি কোথায় প্রযোজ্য

Agent Bridge account migration tool নয়। এটি নির্বাচিত API hostname-এর HTTPS connection স্থানীয় proxy-তে নিয়ে যায়, তারপর mapped model request OmniRoute-এ পাঠায়। এর Claude Code target হলো `api.anthropic.com`, Messages endpoint `/v1/messages`। পুরো Claude Desktop-এর account, Projects database, cloud Chat service এবং cloud routine infrastructure বদলানোর feature এই target নয়। [OmniRoute AgentBridge documentation](https://github.com/diegosouzapw/OmniRoute/blob/52823517533cfceec7abef2ff3e6285a19fe4121/docs/frameworks/AGENTBRIDGE.md)

আপনার live app-এর standard Chat ও Projects views `claude.ai/...` ব্যবহার করছে। Agent Bridge-এর Claude Code descriptor-এ `claude.ai` নেই। তাই Claude Code card active করা থেকে এই account-এর সমস্ত native Chat/Cowork/cloud feature OmniRoute-এ যাবে এমন সিদ্ধান্ত করা যায় না। Local Code-এর inference request ওই Messages API path দিয়ে গেলে সেটি আলাদাভাবে পরীক্ষা করা সম্ভব; এই run-এ live interception দিয়ে তা প্রমাণ হয়নি।

বর্তমান stock setup-এর মূল prerequisites:

1. Native HTTPS destination-এর port 443-এ পৌঁছানো যায় এমন Bridge listener।
2. Bridge certificate-এর সঠিক trust এবং client runtime-এর TLS compatibility।
3. শুধু প্রয়োজনীয় target-এর DNS routing।
4. Incoming model IDs-এর সঠিক mappings।
5. Dashboard stop/repair path দিয়ে DNS ফিরিয়ে দেওয়ার ক্ষমতা।

এই prerequisites পূরণ হলেও native account-এর সব cloud feature বা 100% output quality equivalence নিশ্চিত হয়ে যায় না।

## ৪. আপনার computer-এ port 443 conflict

`lsof` দিয়ে পাওয়া গেছে: local nginx IPv4 ও IPv6 দুই address family-তেই `*:443` listen করছে। Agent Bridge-এর standalone server-ও stock code-এ address নির্দিষ্ট না করে port 443 bind করতে চায়। একই listener endpoint একসঙ্গে দুইটি process নিতে পারে না।

এই nginx আপনার local sites-এর workflow-এর অংশ। এটি বন্ধ করা হয়নি। Live Bridge Start করে DNS বদলে তারপর port-bind failure ঘটানোও হয়নি।

Bridge-এর port শুধু 8443 করে hosts file বদলালে native `https://api.anthropic.com` request 8443-এ যায় না; HTTPS URL-এ আলাদা port না থাকলে client 443-ই ব্যবহার করে। সুতরাং প্রয়োজন হবে port 443 conflict-এর প্রকৃত সমাধান, অথবা আলাদা পরীক্ষিত forwarding/network arrangement। Dashboard-এর port পরিবর্তন একা সেই সমাধান নয়।

এই run শেষে nginx আগের PID-গুলো নিয়েই চলছে। `/etc/hosts`-ও কাজ শুরুর snapshot-এর সঙ্গে identical আছে।

## ৫. Installed Bridge দিয়ে বাস্তব transport test

শুধু source পড়ে সিদ্ধান্ত নেওয়া হয়নি। Installed package-এর actual `src/mitm/server.cjs` চালিয়ে দুইটি synthetic HTTPS request একটি স্থানীয় mock router-এ পাঠানো হয়েছে।

Test isolation:

- আলাদা temporary data directory ও test certificate;
- high port এবং loopback-only loader;
- OS Keychain-এ certificate install করা হয়নি;
- `/etc/hosts` বা live Bridge configuration বদলানো হয়নি;
- real API/provider credential ব্যবহার করা হয়নি;
- TLS validation enabled ছিল; certificate শুধু test client-এ দেওয়া হয়েছে;
- test শেষ হলে দুইটি Bridge child process বন্ধ হয়েছে।

Loopback-only loader কেবল test listener-এর address নির্দিষ্ট করেছে; installed server file edit করা হয়নি। এটি live macOS CA/DNS/start-stop validation-এর বিকল্প নয়।

| পরীক্ষিত বিষয় | শুধু Claude target | Manager registry-র shared-host order |
| --- | --- | --- |
| Mock router response | HTTP 200 | HTTP 200 |
| Classified agent | `claude-code` | `kiro` |
| Router path | `/v1/messages` | `/v1/messages` |
| JSON body, same model, adaptive thinking, xhigh | Preserved | Preserved |
| Original `anthropic-version` | হারিয়েছে | হারিয়েছে |
| Original `anthropic-beta` | হারিয়েছে | হারিয়েছে |
| Original session header | হারিয়েছে | হারিয়েছে |
| Original User-Agent | হারিয়েছে | হারিয়েছে |
| Original `?beta=true` query | হারিয়েছে | হারিয়েছে |
| Non-stream JSON response content type | `text/event-stream` হয়ে গেছে | `text/event-stream` হয়ে গেছে |
| Upstream request-id response header | হারিয়েছে | হারিয়েছে |

Shared-host ফলের কারণ: target registry-তে Kiro আগে `api.anthropic.com` register করে। Standalone loader পরে একই hostname-এর Claude Code target দেখলে existing assignment বদলায় না। ফলে dashboard-এর Claude Code mapping ও actual proxy-এর alias selection আলাদা হয়ে যেতে পারে।

Installed server-এর forwarding code native headers-এর বদলে ছোট fixed header set পাঠায়। `anthropic-beta`-র মতো metadata হারানো feature compatibility-এর জন্য গুরুত্বপূর্ণ। তবে এই test থেকে সব model-এর output খারাপ হবে এমন সিদ্ধান্তও করা যাবে না: model output quality এই mock transport test-এর বিষয় ছিল না।

Evidence: bridge-transport-results.json (স্থানীয় বা private reference; প্রকাশিত নয়)

## ৬. Start/Stop সম্পর্কে সঠিক প্রত্যাশা

সুস্থ এবং পরীক্ষিত Bridge setup-এ আপনি account বদলানো ছাড়াই intercepted API calls-এর routing বদলাতে পারেন। কিন্তু বর্তমান build-এ ওই আচরণকে reliable toggle বলা যায় না।

Source-এ Stop-এর intended ordering হলো আগে DNS entries সরানো, তারপর Bridge process বন্ধ করা। এটি ভালো ordering। তবে sudo/password capability না থাকলে DNS teardown skip করার path আছে। Process stopped হলেও hosts entry থেকে গেলে native HTTPS request local destination-এ আটকে যেতে পারে। এই শর্তটি source-এ নিশ্চিত হয়েছে; আপনার machine-এ এই failure ঘটানো হয়নি।

প্রকৃত acceptance test-এ চাই:

| State | কী যাচাই করতে হবে |
| --- | --- |
| Start-এর আগে | Standard account, default endpoint, original history accessible |
| Start-এর পরে | Correct Claude target; real request OmniRoute-এ পৌঁছায়; same canonical model ও effort; tool/SSE/abort/caching metadata compatible |
| Stop-এর পরে | Managed DNS entry নেই; upstream DNS resolve হয়; Bridge process নেই; native request default provider-এ যায় |
| Crash/restart-এর পরে | Orphaned DNS/proxy state শনাক্ত ও restore হয় |
| Claude app/CLI update-এর পরে | নতুন host/path/header/model IDs ও client certificate trust আবার কাজ করে |

DNS cache ও আগে থেকে খোলা connections-এর কারণে routing পরিবর্তন সব connection-এ মুহূর্তের মধ্যে কার্যকর হয়েছে ধরে নেওয়া উচিত নয়। Full app/CLI restart দিয়ে নতুন connection পরীক্ষা করতে হবে।

Root CA trust সাধারণ Stop-এ সরানো হয় না; এটি আলাদা Remove CA/repair concern। Dashboard-এর **Restore default** per-agent setup reset করে; সেটি অন্য agents-এর shared Bridge/CA বন্ধ করার সমান নয়।

বর্তমানে live certificate নেই, trusted CA নেই, DNS off এবং Bridge stopped। তাই কোনো অর্ধেক সক্রিয় interception state রেখে দেওয়া হয়নি।

## ৭. Claude update চালু আছে কি না

| Component | Installed version | Update-এর বর্তমান প্রমাণ |
| --- | --- | --- |
| Claude Desktop | `2.19675.0` | Standard-mode startup log-এ initial check ও auto-updates enabled |
| Claude Code CLI | `2.1.286` | `claude doctor`: auto-updates enabled, channel `latest`; last update success ১ অক্টোবর |
| OmniRoute runtime | `3.8.51` | Official npm registry-র published `latest`-ও `3.8.51` |
| OmniRoute GitHub default branch | `release/v3.8.52` | Development branch; changelog-এর 3.8.52 section এখনো `TBD` |

**Published latest** ও **GitHub development branch** আলাদা। আগের progress update-এ 3.8.52 তুলনার কথা বলা হয়েছে; সেটি published stable upgrade নয়। Installed version ইতিমধ্যে npm latest-এর সঙ্গে মিলে যাচ্ছে। এই run-এ OmniRoute development build install করা হয়নি।

Desktop-এর default auto-update behavior Anthropic-এর [installation/update documentation](https://claude.com/docs/third-party/claude-desktop/installation)-এ আছে। Local app log সেই updater enabled হওয়াও নিশ্চিত করেছে। Saved Gateway profile-এ `disableAutoUpdates` বা custom update/catalog override নেই।

Desktop-এর বর্তমান installed version-ই সকল rollout-এর সর্বশেষ eligible version এমন verdict নেওয়া হয়নি। এখানে নিশ্চিত হয়েছে updater enabled আছে। কোনো নতুন Desktop build এই run-এ install করা হয়নি।

`codesign --verify --deep --strict` দিয়ে Claude app-এর signature যাচাই করা হয়েছে। App bundle patch করা হয়নি। Native updater, account handling বা quota logic বদলানো হয়নি।

App update-এর সঙ্গে internal Claude Code helper-এর version/path, network behavior, headers বা supported model catalog বদলাতে পারে। Certificate OS store-এ থাকলেই সব client runtime সেটি পড়বে এমন নিশ্চয়তা নেই। অতিরিক্ত CA environment যদি কোনো runtime-এ প্রয়োজন হয়, সেই environment app launch-এ পাওয়া এবং নতুন process-এ কার্যকর হওয়া পরীক্ষা করতে হয়। তাই future Bridge compatibility 100% guarantee দেওয়া যায় না।

Default CLI model-list override সরানোয় native settings ও model discovery নতুন releases অনুযায়ী স্বাভাবিকভাবে চলতে পারে। Bridge mapping ভবিষ্যতে ব্যবহার করলে নতুন canonical IDs-এর জন্য mapping যাচাই লাগবে; unknown models-কে blanket wildcard দিয়ে ছোট model-এ পাঠানো আপনার quality requirement পূরণ করবে না।

## ৮. Scheduled ও Routines কীভাবে চলবে

Original standard account-এ `coworkScheduledTasksEnabled` ও `ccdScheduledTasksEnabled` দুইটি stored feature flag-ই true আছে। এগুলো আগে থেকেই enabled ছিল; নতুন করে scheduled automation তৈরি করা হয়নি।

Native Scheduled view খোলা হয়েছে; এই account-এর ওই view-তে scheduled tasks নেই। Code Routines view-তে আগের একটি active hourly routine পাওয়া গেছে। তার prompt, schedule, connectors বা status edit করা হয়নি এবং manual run চালানো হয়নি। Existing routine সক্রিয় দেখা ও তার inference সফল হওয়ার পরীক্ষা আলাদা বিষয়।

Claude Code cloud routines সাধারণত Anthropic-managed infrastructure-এ চলে এবং account subscription usage ব্যবহার করে। আপনার Mac-এর local DNS/Agent Bridge সেই cloud worker-এর API calls intercept করতে পারে না। Original cloud routine থাকলে সেটি original account-এর quota ও service rules অনুসারেই চলবে। [Official Routines documentation](https://code.claude.com/docs/en/routines)

Local Desktop scheduled tasks আপনার machine-এ চলে এবং app open/computer awake দরকার। কোনো local task-এর inference Bridge দিয়ে যাবে কি না তা তার actual endpoint ও runtime দিয়ে পরীক্ষা করতে হবে। এই run-এ Bridge-সহ local scheduled execution test করা হয়নি। [Official local scheduled-task documentation](https://code.claude.com/docs/en/desktop-scheduled-tasks)

Original account এখন out of usage credits দেখাচ্ছে। Agent Bridge চালু করা থেকে এই account-এর cloud service quota অন্য connected account-এ transfer হয়ে যায় না। Native Code-এর prompt ভরলে Send control enabled হয়েছিল; তাই “UI কোনো request-ই পাঠাতে দেয় না” এমন blanket conclusion করা হয়নি। সেই test prompt send না করে সরিয়ে দেওয়া হয়েছে। Live Bridge না থাকায় Code-এর actual quota/route behavior এই run-এ আলাদাভাবে প্রমাণ হয়নি।

CLI থেকে gateway API-key helper সরানো subscription login-কে আবার primary auth করে। Official Routines docs অনুযায়ী API-key/helper auth subscription login-এর precedence বদলে `/schedule` availability-তে প্রভাব ফেলতে পারে। তবে `/schedule` দিয়ে এখানে নতুন routine তৈরি করা হয়নি।

## ৯. তিন account, history এবং quality

বর্তমান read-only DB count অনুযায়ী active Claude provider connection ১টি। এই state থেকে তিন-account pool/failover কাজ করছে বলা যাবে না। অন্য দুই account connect হওয়ার পর প্রতিটির health/quota এবং same-model routing আলাদা acceptance test লাগবে।

OmniRoute-এর provider account ও native Claude.ai account-এর history identity আলাদা বিষয়। Provider credentials ঘুরিয়ে inference করালেও তিনটি Claude.ai account-এর cloud chats/projects নিজে merge হয় না। Original native account বজায় রাখা যায়; অন্য account-এর history সেই view-তে পাওয়া যায় এমন feature এখানে প্রতিষ্ঠিত হয়নি।

Quality রক্ষা করতে same upstream Claude model, supported effort, thinking settings, complete context, tools, relevant headers এবং response protocol বজায় রাখা দরকার। Compression/automatic lower-model fallback বন্ধ রাখাও একা সম্পূর্ণ parity প্রমাণ করে না। একই model-এর output-ও প্রতিবার হুবহু এক হয় না।

আগের Gateway model tests-এ কিছু unsupported effort combinations এবং language/marker deviations পাওয়া গিয়েছিল। সেগুলো আগের [setup/test report](OMNIROUTE-CLAUDE-SETUP-TEST-BANGLA-2026-10-02.md)-এ আছে। এই run-এ সেই model tests পুনরায় করা হয়নি; এখানে account restore ও stock Bridge transport যাচাই করা হয়েছে।

## ১০. এখন কী সম্পন্ন এবং কোন কাজ বাকি

সম্পন্ন:

- Original native account, chats/projects/Code views ফিরিয়ে দেওয়া;
- পূর্ণ quit/relaunch-এর পর standard identity বজায় থাকা নিশ্চিত করা;
- Global CLI routing original settings-এ ফিরিয়ে দেওয়া;
- Desktop ও CLI updater enabled যাচাই করা;
- Existing Scheduled/Routines surfaces ও flags যাচাই করা;
- Installed Bridge-এর shared-host/header/query/response problems synthetic transport test-এ নিশ্চিত করা;
- Published package এবং development branch তুলনা করা;
- Nginx ও system hosts অক্ষত রাখা।

সফল হয়নি/প্রমাণ হয়নি:

- Dashboard Start → existing native app-এর সব inference OmniRoute;
- Dashboard Stop → সব native connections default হওয়ার live round trip;
- Bridge-এর মাধ্যমে original-account Code tool execution;
- Native Chat/Cowork/cloud routine-এর provider replacement;
- Three-account failover;
- 100% native feature/output quality equivalence;
- Future app update-এর পরে Bridge compatibility guarantee।

শুধু settings পরিবর্তন করে এগুলো নিশ্চিত করা যাবে না। Claude Code-only Bridge setup-কে reliable করতে আগে stock Bridge-এর host classification, protocol metadata/response fidelity, port-443 coexistence এবং DNS teardown সমস্যাগুলো সমাধান ও বাস্তব পরীক্ষা দরকার। পুরো standard Claude account-এর cloud features অন্য provider pool-এ চালানো তার থেকেও আলাদা product capability; current Claude Code card সেটি দেয় না।

বর্তমান primary workflow তাই আপনার original standard Claude app/account। Gateway profile test fallback হিসেবে সংরক্ষিত, কিন্তু default routing হিসেবে applied নয়। Live Bridge activated দেখিয়ে অসম্পূর্ণ setup রেখে দেওয়া হয়নি।

## ১১. Backup ও প্রমাণ

এই কাজের নতুন snapshot/evidence folder:

`~/Documents/Codex/2026-10-02/omniroute-native-restore-072641`

- Verification record (স্থানীয় বা private reference; প্রকাশিত নয়)
- Isolated Bridge transport results (স্থানীয় বা private reference; প্রকাশিত নয়)
- Original account chats screenshot (স্থানীয় বা private reference; প্রকাশিত নয়)
- Original Projects screenshot (স্থানীয় বা private reference; প্রকাশিত নয়)
- Existing Routines screenshot (স্থানীয় বা private reference; প্রকাশিত নয়)
- Restart persistence screenshot (স্থানীয় বা private reference; প্রকাশিত নয়)
- Live Bridge diagnostics screenshot (স্থানীয় বা private reference; প্রকাশিত নয়)

Backup files local private রাখুন। রিপোর্টে credentials, email বা private account UUID দেওয়া হয়নি। T7-এর আগের reports/source files overwrite করা হয়নি; এই report নতুন file হিসেবে তৈরি হয়েছে।
