> **ঐতিহাসিক নথি — public copy, ২০২৬-১০-১৭।** মূল ঘটনার তারিখ ও ফল এই নথির নিজস্ব সময়ের জন্য প্রযোজ্য; পরের সংযোজন থাকতে পারে। বর্তমান অবস্থা ও কাজের নিয়মের জন্য [বর্তমান handoff](../CURRENT-STATUS-2026-10-17.md) পড়ুন। Private reference ও identifier সরানো হয়েছে; স্থানীয় evidence এখানে অন্তর্ভুক্ত নেই। পুরোনো cleanup, build, deploy বা service command বর্তমান অনুমতি হিসেবে ব্যবহার করবেন না।

# OmniRoute দিয়ে native Claude Code: setup ও বাস্তব পরীক্ষার রিপোর্ট

তারিখ: ২ অক্টোবর ২০২৬, Asia/Dhaka<br>
প্রস্তুত: Jillur Rahman<br>
পরীক্ষার scope: শুধু connected Claude provider-এর Claude models ও তাদের effort options।

## ১. মূল ফল

**Native Claude Desktop-এর Code tab এবং Claude Code CLI, দুটোই এখন local OmniRoute-এর মাধ্যমে কাজ করছে।** শুধু HTTP response পরীক্ষা করা হয়নি: native app থেকে ফাইল পড়া, ভুল কোড edit করা, test command চালানো এবং final result পাওয়া গেছে। Sonnet 5.5-এর native `Extra` effort control-ও দেখা যাচ্ছে ও কাজের request-এ `xhigh` পাঠাচ্ছে।

**পুরো native product-এর সঙ্গে শতভাগ feature বা output-quality সমতা প্রমাণিত হয়নি।** পরীক্ষায় model/effort catalog-এর কিছু ভুল entry, একটি legacy coding restriction, output-format অমান্য করা এবং একটি ভাষার ব্যতিক্রম পাওয়া গেছে। এগুলো নিচে আলাদা করে রাখা হয়েছে।

আগের parity/report নথিতে যেসব inference ও setup test হয়নি বলা ছিল, তা সেই read-only পর্যায়ের অবস্থা। এই নতুন নথি পরবর্তী configuration ও execution পরীক্ষার ফল।

## ২. কোন route চালু হয়েছে

```text
Claude Desktop, native Code tab
  → native third-party Gateway configuration
  → http://127.0.0.1:28128/v1/messages
  → OmniRoute-এর connected Claude OAuth account
  → Claude provider response

Claude Code CLI
  → ANTHROPIC_BASE_URL + local credential helper
  → একই OmniRoute Messages API ও connected Claude account
```

এই setup-এর জন্য native Desktop-এর official Gateway configuration ব্যবহার করা হয়েছে। Agent Bridge-এর HTTPS interception চালু করা হয়নি। CA certificate, DNS interception বা TLS verification পরিবর্তন এই পরীক্ষায় প্রয়োজন হয়নি। Agent Bridge-এর interception ও native Gateway configuration আলাদা execution path; আজকের সফল test দ্বিতীয় path-এর প্রমাণ।

Anthropic-এর official in-app configuration-এ `Apply Changes` দিয়ে local profile প্রয়োগ ও app relaunch করার ব্যবস্থা আছে। [In-app configuration](https://claude.com/docs/third-party/claude-desktop/in-app-configuration)।

## ৩. স্থায়ী configuration

### Claude Code CLI

ফাইল: `~/.claude/settings.json`

যোগ করা বা সমন্বয় করা হয়েছে:

```json
{
  "apiKeyHelper": "$HOME/.local/bin/nexalance-omniroute-credential",
  "env": {
    "ANTHROPIC_BASE_URL": "http://127.0.0.1:28128",
    "CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY": "0",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "claude-sonnet-5-5",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "claude-opus-5-5",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "claude-haiku-4-5-20251001",
    "ANTHROPIC_DEFAULT_FABLE_MODEL": "claude-fable-5-1"
  }
}
```

এটি সম্পূর্ণ settings file নয়; শুধু routing সংক্রান্ত অংশ। `availableModels`-এ ১৩টি canonical Claude ID রাখা হয়েছে। প্রথমে gateway discovery চালু করে catalog দেখা হয়েছিল। পরে unconfigured provider ও reject হওয়া synthetic effort IDs যাতে Claude workflow-এ ঢুকে না পড়ে, সেজন্য explicit Claude list ব্যবহার করা হয়েছে।

বিদ্যমান `model: "opus"`, saved model-specific effort settings, plugins, permissions ও hooks বজায় আছে। মূল settings-এর বিদ্যমান অন্য values এবং আগের env values তুলনা করে অপরিবর্তিত পাওয়া গেছে। আপনার আগের Sonnet 5.5 `xhigh`, Opus 5.5 `high`, Opus 5 `low` preferences রাখা হয়েছে। সব model-কে Sonnet বা একই effort-এ নামিয়ে আনা হয়নি।

Final CLI smoke test-এ অতিরিক্ত shell token/base URL না দিয়ে saved settings ব্যবহার করা হয়েছে। Saved default `opus` → Opus 5.5, `sonnet` → Sonnet 5.5, `haiku` → Haiku 4.5, তিনটি selection-ই সফল response দিয়েছে।

### Native Claude Desktop

Profile: **OmniRoute Claude**<br>
Provider: **Gateway**<br>
Endpoint: `http://127.0.0.1:28128`<br>
Credential: **Helper script**<br>
Model list: ১৩টি canonical Claude ID<br>
Default model effort: `xhigh`<br>
Current Code selection: **Claude Sonnet 5.5 / Extra / Local / Auto / Fast mode off**

Local profile directory: `~/Library/Application Support/Claude-3p/configLibrary/`

প্রথম `cc/...` model IDs দিয়ে inference চললেও native effort picker দেখা যাচ্ছিল না। Canonical `claude-...` IDs দিয়ে routing পরীক্ষা করে সফল হওয়ার পর native list সেই IDs-এ সমন্বয় করা হয়েছে। এখন native model label ও `Effort: Extra` control দেখা যাচ্ছে। Gateway internally request-কে Claude provider-এ resolve করছে।

Native form-এর first broad discovery unconfigured Auggie model বেছে inference test fail করেছিল। Claude-only fixed list দিয়ে সেটি সমাধান হয়েছে; Auggie install করা হয়নি। Credential helper প্রথমে Documents-এর ভেতরে ছিল বলে macOS থেকে execute করতে বাধা এসেছিল; helper স্থায়ী `.local/bin` path-এ রাখার পর test সফল হয়েছে।

### Credential helper

`~/.local/bin/nexalance-omniroute-credential`

Helper read-only SQLite connection দিয়ে বিদ্যমান active `local-default` gateway key পড়ে। Settings/profile/report-এ plaintext key রাখা হয়নি। Helper executable-এর permission `700`। এটি নতুন provider credential বা subscription তৈরি করে না।

## ৪. Native app থেকে বাস্তব coding test

শুধু নতুন test workspace ব্যবহার করা হয়েছে:

`~/.local/share/omniroute-native-test/20261002-065648`

### Test A: যোগের ভুল ঠিক করা

`sum.js`-এ reducer যোগের বদলে বিয়োগ করছিল। Native app দুইটি file পড়েছে, GateGuard-এর প্রয়োজনীয় facts যাচাই করেছে, code edit করেছে এবং `node sum.test.js` চালিয়েছে। Result: `NATIVE_GATEWAY_TOOL_TEST_PASS`। বাইরে থেকে একই test আবার চালিয়ে pass পাওয়া গেছে।

### Test B: canonical Sonnet 5.5 + native Extra

`product.js`-এ multiplication-এর বদলে addition ছিল। Native **Claude Sonnet 5.5 / Extra** selection থেকে নতুন task চালানো হয়েছে। App files পড়েছে, GateGuard hook-এর initial edit restriction সামলেছে, code সংশোধন করেছে ও `node product.test.js` চালিয়েছে। Result: `CANONICAL_NATIVE_EXTRA_TOOL_PASS`। বাইরে থেকেও তিনটি assertions pass হয়েছে।

Gateway evidence-এ ওই session-এর request-এর জন্য পাওয়া গেছে:

- provider `claude`, resolved model `claude-sonnet-5-5`;
- HTTP status `200`, `cache_source: upstream`;
- request body-তে `thinking.type: adaptive`;
- `output_config.effort: xhigh`;
- ১৭০টি tool definitions গ্রহণ করা হয়েছে। এটি সব ১৭০টি tool পরীক্ষা হওয়ার প্রমাণ নয়।

Hook বন্ধ করে coding সফল দেখানো হয়নি। Hook-এর কারণে প্রথম Edit attempt আটকালেও প্রয়োজনীয় facts সংগ্রহের পরে successful edit হয়েছে।

**ভাষার ব্যতিক্রম:** দ্বিতীয় coding run-এর একটি বড় অংশ জাপানিতে এসেছে, যদিও global instruction বাংলার ছিল। পরে বাংলা follow-up-এ model বাংলায় ফল দিয়েছে। Original response-এর ব্যতিক্রমটি বাদ দিয়ে “language parity perfect” দাবি করা হচ্ছে না।

Native Sonnet 5.5 Extra দিয়ে সফল coding test (স্থানীয় image; প্রকাশিত নয়)

## ৫. Model পরীক্ষার scope ও ফল বোঝার নিয়ম

Live catalog-এ মোট ৭১৩টি entry ছিল। User-এর নির্বাচিত scope অনুযায়ী অন্য model families ও unconfigured providers পরীক্ষা করা হয়নি। `cc/` ও `claude/` একই Claude backend-এর aliases; duplicate alias-কে আলাদা physical model ধরে success count বাড়ানো হয়নি।

Connected Claude catalog-এ পাওয়া গেছে ১৩টি base model এবং ৫২টি synthetic effort IDs। Base model প্রতি CLI থেকে আলাদা fresh coding fixture দিয়ে read → edit → test task চালানো হয়েছে। Native app-এর দুইটি test আলাদা ভাবে উপরে দেওয়া আছে। Effort combinations প্রতি আলাদা Messages API request চালানো হয়েছে; effort প্রতি পূর্ণ coding benchmark করা হয়নি।

Initial base-model coding run-এ ১২টির code externally pass করেছে। Sonnet 4.6 run-এ model absolute test command ব্যবহার করেছিল, যা narrow command allowlist-এর সঙ্গে মেলেনি। ওই run-এর final marker একা test execution-এর প্রমাণ হিসেবে ধরা হয়নি। নির্দিষ্ট test command দিয়ে canonical-ID retest করা হয়েছে, stream transcript-এ Bash invocation ও সফল test পাওয়া গেছে।

**চূড়ান্ত ফল: ১৩টি base model-এর মধ্যে ১২টি coding test সফল; Opus 4.5 full coding request ব্যর্থ।** সব initial fixture-এর test file অপরিবর্তিত আছে বলে যাচাই করা হয়েছে।

## ৬. Effort পরীক্ষার ফল

### Catalog-এর synthetic IDs

৬৫টি `cc/...` entry একে একে request করা হয়েছে: ১৩টি base + ৫২টি effort suffix। এর মধ্যে ৪০টি HTTP 200 পেয়েছে এবং ২৫টি HTTP 400 পেয়েছে। ২৫টি failure synthetic effort IDs-এর; error বলেছে ID active live catalog-এ নেই। ২০০ পাওয়া ৪০টির মধ্যে ৩৮টি exact marker format মেনেছে; দুইটি শুধু গণনার উত্তর দিয়েছে।

অর্থাৎ catalog-এ `claude-sonnet-5-5-low` দেখা গেলেই সেই ID dispatch করতে পারবে, এমন নিশ্চয়তা নেই। Final configuration মূল model ID-এর সঙ্গে native effort parameter ব্যবহার করছে।

### মূল model ID + native effort parameter

Catalog-advertised ৬৯টি model/effort combination পরীক্ষা হয়েছে। Initial request-এ ৫৯টি HTTP 200; ১০টি HTTP 400। Model অনুযায়ী payload ঠিক করে নয়টি targeted retest করা হয়েছে। Sonnet 5.5-এর thinking-off form এবং Opus 4.5-এর তিনটি legacy effort request সফল হয়েছে।

**Payload সংশোধনের পরে ৬৯টির মধ্যে ৬৩টি combination accepted response দিয়েছে; ছয়টি advertised combination সমর্থিত নয়।** এখানে “accepted” মানে request সফল হয়েছে। সব option model-এর reasoning strength একই অনুপাতে বদলেছে, তা এই ছোট পরীক্ষায় পরিমাপ করা হয়নি।

- Sonnet 5.5: low/medium/high/xhigh/max সফল। Thinking off-এর জন্য `disabled` নয়, provider `between_tools` চেয়েছে; সেই form সফল হয়েছে। এটি tool-এর মাঝখানে কোনো thinking থাকবে না, এমন দাবি নয়।
- Opus 5.5: low/medium/high/xhigh/max সফল। `thinking.type: disabled` প্রত্যাখ্যাত; catalog-এর `none` declaration এই route-এ ব্যবহারযোগ্য নয়।
- Opus 4.5: adaptive thinking প্রত্যাখ্যাত। Legacy enabled thinking + budget দিয়ে low/medium/high সফল হয়েছে। Full coding failure আলাদা সমস্যা, পরের অংশে দেখুন।
- Sonnet 4.5: advertised পাঁচটি effort values provider প্রত্যাখ্যান করেছে, legacy form দিয়েও। Error: model effort parameter support করে না। Base coding ও thinking-disabled request সফল হয়েছে।

প্রথম ৫৯টি HTTP-success response-এর মধ্যে আটটি exact requested marker format মানেনি। গণনার উত্তর 45 দিলেও কয়েকটি marker request-কে prompt injection হিসেবে ব্যাখ্যা করেছে; Haiku-এর একটি response Claude Code identity নিয়েও আপত্তি করেছে। তাই HTTP 200-কে instruction-following quality pass হিসেবে গণনা করা হয়নি।

Native request-এর gateway artifact থেকে effort field দেখা গেছে। Call-log-এর reasoning-effort telemetry কিছু request-এ null ছিল, ফলে telemetry alone দিয়ে upstream interpretation মাপা যায়নি।

## ৭. Opus 4.5 coding restriction

Full Claude Code coding request-এ error:

```text
400 The long context beta is not yet available for this subscription.
```

Canonical model ID দিয়েও একই error হয়েছে। শুধু test subprocess-এ `CLAUDE_CODE_DISABLE_1M_CONTEXT=1` দিয়েও error হয়েছে; global settings-এ সব model-এর 1M বন্ধ করা হয়নি।

Source inspection-এ `open-sse/executors/claudeIdentity.ts`-এর beta selector full-agent request-এ Opus prefix-এর জন্য `context-1m-2025-08-07` যোগ করে; native-context Opus 5 prefix বাদ দেয়। এই rule পুরোনো Opus 4.5-তেও প্রযোজ্য হচ্ছে। `base.ts` ওই derived flags ব্যবহার করে। এটি observed error-এর সঙ্গে মেলে এবং কেন client-side 1M বন্ধ করেও error থাকছে তার code-level ব্যাখ্যা দেয়।

Source/runtime hot patch করা হয়নি। সাধারণ ছোট response ও legacy effort request সফল হওয়া full Claude Code request সফল হওয়ার সমতুল্য নয়। এই setup-এ Opus 4.5-কে full coding-এর জন্য verified model হিসেবে ব্যবহার করা উচিত হবে না। Latest Opus 5.5 default route সফল আছে।

## ৮. Account ও credit-এর প্রকৃত অবস্থা

OmniRoute database-এ **একটি active Claude OAuth connection** পাওয়া গেছে। তিনটি Claude account এখন connected নয়। Gateway-এর connected account UUID ও CLI-তে saved native account UUID আলাদা বলে যাচাই হয়েছে; report-এ UUID/email/token রাখা হয়নি।

Exhausted native login থাকলেও অন্য connected account দিয়ে gateway request সফল হতে পারে, এবং বর্তমান test সেই আলাদা account route-এ সফল হয়েছে। OmniRoute নতুন credits সৃষ্টি করে না। Connected account-এর quota শেষ হলে অন্য valid connected account বা provider লাগবে।

তিন-account rotation/failover, quota exhaustion-এর সময় automatic switch, এবং সব account-এর model entitlement সমান কি না, এই one-account setup-এ পরীক্ষা সম্ভব হয়নি। Request success subscription entitlement বা টাকা কাটা হয়েছে কি না তার receipt নয়। CLI-এর `total_cost_usd` published API list-price estimate; OAuth subscription থেকে ওই USD charged হয়েছে এমন দাবি করা হয়নি।

## ৯. History, project, connectors, schedules ও routines

**History/project:** Native Gateway mode-এ আলাদা local session area দেখা গেছে। আগের Claude.ai account-এর history/project এই view-তে আসেনি। নতুন local Code session restart-এর পরেও recent list-এ ছিল। এটি existing personal-account chats বা projects merge/migrate হওয়ার প্রমাণ নয়। Provider credentials pool হওয়া এবং account data pool হওয়া আলাদা বিষয়।

Official 3P local profile location ও deployment behavior documented আছে। [Configuration reference](https://claude.com/docs/third-party/claude-desktop/configuration)।

**Connectors:** CLI startup স্পষ্ট warning দিয়েছে যে API key/other authentication precedence থাকার কারণে Claude.ai connectors disabled। Global plugin/settings preserved হলেও account-authenticated connector parity তাই ধরে নেওয়া যাবে না। প্রতিটি local MCP/plugin tool, subagent, image/file workflow আলাদা ভাবে পরীক্ষা করা হয়নি।

**Local scheduled task:** Native interface-এ Scheduled navigation আছে; বাস্তব scheduled execution চালানো হয়নি। Local Code scheduling-এর ক্ষেত্রে app/machine availability ও credential helper availability প্রয়োজন; শুধু menu দেখা execution-এর প্রমাণ নয়। [Desktop scheduled tasks](https://code.claude.com/docs/en/desktop-scheduled-tasks)।

**Cloud routine:** Account-owned cloud routines local Mac-এর `127.0.0.1` gateway-কে স্বয়ংক্রিয়ভাবে ব্যবহার করবে এমন ব্যবস্থা এই configuration নয়। Cloud routine quota/account identity-এর boundary বজায় থাকে। API/gateway authentication থাকলে CLI `/schedule` availability আলাদা হতে পারে। [Official routines](https://code.claude.com/docs/en/routines)।

সুতরাং “সব scheduled/routine features আগের মতোই কাজ করবে” এখনো নিশ্চিত করা হয়নি। নতুন routine বা recurring automation তৈরি করা হয়নি।

## ১০. Quality সম্পর্কে সঠিক সিদ্ধান্ত

যা বাস্তবে প্রমাণিত:

- native app ও native CLI থেকে connected Claude account দিয়ে coding কাজ করা যায়;
- Sonnet 5.5 ও latest Opus/Fable/Sonnet models-এর tested coding fixture সফল;
- Sonnet 5.5 native Extra request-এর model ও effort gateway evidence-এ পাওয়া গেছে;
- existing GateGuard ও saved CLI settings বজায় রেখেও কাজ হয়েছে;
- final response local exact/semantic cache থেকে নয়, selected evidence-এ upstream source থেকে এসেছে।

যা প্রমাণিত নয়:

- direct native বনাম gateway একই task-এর blinded quality benchmark;
- সব native product feature, cloud connector বা schedule parity;
- 1M-token long-input test, 128K-output generation, প্রতিটি tool বা model safety/behavior parity;
- তিন-account failover ও long-session migration;
- effort accepted হলেই নির্দিষ্ট reasoning quality বৃদ্ধি বা সরাসরি native-এর সঙ্গে সমান ফল।

OmniRoute OAuth executor request identity, system/body এবং beta-header handling-এর কিছু অংশ সমন্বয় করে। তাই পুরো wire request অপরিবর্তিত থাকছে এমন দাবি করা হচ্ছে না। Official gateway protocol-এর capability ও headers requirement পৃথক ভাবে বিবেচনা করা প্রয়োজন। [Gateway protocol](https://code.claude.com/docs/en/llm-gateway-protocol)।

## ১১. এখন ব্যবহার করার পদ্ধতি

Native Desktop-এ Code tab থেকে আপনার নিজের project/folder বেছে নিন। Current Gateway profile সক্রিয় আছে। Sonnet 5.5 / Extra setup পরীক্ষিত; Opus 5.5-ও CLI coding test-এ পরীক্ষিত।

Terminal-এ:

```sh
claude
claude --model sonnet
claude --model opus
claude --model claude-fable-5-1
```

প্রতি বার key/base URL export করার প্রয়োজন নেই; saved routing settings আছে। `/model` ও native effort controls দিয়ে selection করুন। Synthetic `-low`/`-high` IDs-এর বদলে canonical model ও native effort setting ব্যবহার করুন।

## ১২. Backup ও rollback

Backup directory:

`~/Documents/Codex/2026-10-02/omniroute-claude-test-065648/backup/`

এখানে original CLI settings, Desktop configuration/plist ও consistent OmniRoute SQLite backup রাখা হয়েছে। Directory `700`, backup files `600`। Credential-সহ database backup সাধারণ shareable report হিসেবে বিতরণ করার জন্য নয়।

CLI rollback করতে original `backup/settings.json` দিয়ে user settings পুনরুদ্ধার করা যায়; এটি routing change সরিয়ে আগের values ফেরাবে। এই রিপোর্টে rollback execute করা হয়নি। Settings পরে নিজে বদলালে পুরোনো পুরো file blindly restore করার বদলে পরিবর্তিত routing keys তুলনা করতে হবে।

Desktop-এ account menu বা Inference configuration থেকে standard Claude.ai deployment mode-এ ফিরে যাওয়া যায়; local profile library-তে original empty `Default` profile এবং নতুন `OmniRoute Claude` profile দুটোই আছে। নতুন gateway sessions-এর history ও standard account history আলাদা থাকবে।

OmniRoute SQLite backup restore করতে হবে শুধু relevant database problem হলে; বর্তমান account refresh/logs মুছে যাওয়ার ঝুঁকির কারণে সেটিকে routine rollback step করা উচিত হবে না।

T7-এর source বা আগের report overwrite/delete করা হয়নি। Repo code, runtime code, CA/DNS বা TLS policy এই setup-এ পরিবর্তন করা হয়নি।

## ১৩. Evidence files

এই report-এর একই test root-এর `results/` folder-এ আছে:

- `catalog-before.json`: live model catalog snapshot;
- `claude-coding-models.json`: initial ১৩-model coding results;
- `claude-canonical-coding-retests.json`: targeted native-ID coding retests;
- `opus45-200k-retest-summary.json`: legacy context retest failure;
- `claude-effort-options.json`: ৬৫ catalog-entry probes;
- `claude-native-effort-body.json`: ৬৯ native-protocol effort probes;
- `claude-effort-compatibility-retests.json`: নয়টি model-specific payload retests;
- `final-cli-configuration-smoke.json`: saved configuration ও family aliases verification;
- `verification-summary.json`: settings preservation, unchanged fixture tests ও sanitized gateway proof;
- `native-desktop-gateway-coding-pass.png`: first native coding result;
- `native-sonnet55-extra-bangla-pass.png`: canonical native model/Extra ও বাংলা result।

সব ফল ২ অক্টোবর ২০২৬-এর observed snapshot। পরে account quota, provider catalog, app version বা gateway version বদলালে পুনরায় relevant পরীক্ষা প্রয়োজন হবে।

## ১৪. Model ও effort matrix

নিচের matrix-এ accepted effort মানে HTTP-successful request; reasoning quality-এর পরিমাপ নয়। Unsupported synthetic IDs এবং initial rejected payloads-এর original records আলাদা evidence files-এ retained আছে।

| Model | Coding | Accepted effort / thinking form | সীমা |
| --- | --- | --- | --- |
| Sonnet 5.5 | সফল | none, low, medium, high, xhigh, max | none-এর জন্য between_tools form |
| Opus 5.5 | সফল | low, medium, high, xhigh, max | none rejected |
| Fable 5.1 | সফল | low, medium, high, xhigh, max |  |
| Opus 5 | সফল | none, low, medium, high, xhigh, max |  |
| Sonnet 5 | সফল | none, low, medium, high, xhigh, max |  |
| Fable 5 | সফল | low, medium, high, xhigh, max |  |
| Opus 4.8 | সফল | low, medium, high, xhigh, max |  |
| Opus 4.7 | সফল | low, medium, high, xhigh, max |  |
| Sonnet 4.6 | সফল; canonical retest-এ command চালানো যাচাই | none, low, medium, high, xhigh, max |  |
| Opus 4.6 | সফল | low, medium, high, max |  |
| Opus 4.5 | ব্যর্থ: long-context restriction | low, medium, high | effort-এর জন্য legacy enabled thinking |
| Haiku 4.5 | সফল | none, low, medium, high, xhigh, max |  |
| Sonnet 4.5 | সফল | none | effort parameter unsupported; base request সফল |

Direct native baseline-এর সঙ্গে পাশাপাশি quality comparison চালানো যায়নি, কারণ আগের native account-এ exhausted usage দেখা যাচ্ছিল। তাই successful gateway execution-কে direct-versus-gateway quality equivalence হিসেবে ব্যবহার করা হয়নি।
