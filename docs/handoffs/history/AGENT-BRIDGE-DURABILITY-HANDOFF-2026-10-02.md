> **ঐতিহাসিক নথি — public copy, ২০২৬-১০-১৭।** মূল ঘটনার তারিখ ও ফল এই নথির নিজস্ব সময়ের জন্য প্রযোজ্য; পরের সংযোজন থাকতে পারে। বর্তমান অবস্থা ও কাজের নিয়মের জন্য [বর্তমান handoff](../CURRENT-STATUS-2026-10-17.md) পড়ুন। Private reference ও identifier সরানো হয়েছে; স্থানীয় evidence এখানে অন্তর্ভুক্ত নেই। পুরোনো cleanup, build, deploy বা service command বর্তমান অনুমতি হিসেবে ব্যবহার করবেন না।

# Agent Bridge স্থায়ী setup ও update handoff

মালিক: Jillur Rahman / NexaLance<br>
তারিখ: ২০২৬-১০-০২, Asia/Dhaka<br>
এটি আগের HANDOFF-OMNIROUTE-2026-10-02.md এবং CODEX-AGENT-BRIDGE-SETUP-HANDOFF-2026-10-02.md-এর পরের setup record। আগের T7 files অপরিবর্তিত আছে।

## ১. মূল উত্তর: code edit হয়েছিল কি?

হ্যাঁ। প্রথম setup শুধু Dashboard options দিয়ে হয়নি। Installed runtime-এর Bridge server, manager/state এবং certificate/port compatibility-তে fixes দেওয়া হয়েছিল। পুরোনো npm archive-এ এই fixes ছিল না। তাই database ও provider settings থাকলেও package replace করলে কার্যকর Bridge code হারাতে পারত।

এবার স্থায়ী source হলো `~/Developer/OmniRoute`-এর `nexalance` branch। Upstream base pristine, সব customization `nexa/`-তে। Build-এ patches apply হয়; commit-এর আগে source restore হয়। পুরোনো runtime-এর সম্পূর্ণ prefix সংরক্ষিত আছে।

## ২. Restart/login সমস্যার প্রমাণ ও সমাধান

- `/etc/hosts`-এ `api.anthropic.com` localhost-এ আসছিল, কিন্তু restart-এর পরে `443` listener ছিল না। ফলে native CLI-তে `ECONNREFUSED` হয়েছিল।
- আগের ingress Local app-এর nginx-এর ওপর নির্ভর করছিল। নতুন root-owned LaunchDaemon Local app বন্ধ থাকলেও native Claude ingress চালায়।
- `8443` Bridge পুনরায় চালু করার explicit intent আগে স্থায়ী ছিল না। এখন `mitm/runtime-intent.json`-এ Start/Stop সংরক্ষিত; service restart-এর পরে প্রয়োজনীয় trusted CA, hosts entry ও router key থাকলে enabled Bridge ফিরে আসে।
- একটি log-এ দীর্ঘ Opus request প্রায় ৯৫ সেকেন্ডে readiness watchdog-এ কাটা গেছে। সংশ্লিষ্ট readiness/socket/idle windows এখন ৬০০,০০০ ms। Provider নিজে failure দিলে এই timeout সেটি দূর করতে পারে না।
- নতুন package-এর CLI port preflight VS Code-এর client socket-কে listener ধরে startup আটকে দিচ্ছিল। POSIX discovery এখন শুধু TCP LISTEN sockets দেখে। Regression আগে fail, পরে pass হয়েছে।

## ৩. সংশোধিত helper-এর architecture (activation-এর জন্য §১৫ দেখুন)

```text
Native Claude Code / Desktop-এর Code request
  api.anthropic.com:443
  -> localhost ingress (127.0.0.1 ও ::1)
  -> শুধু api.anthropic.com-এর TLS hostname হলে 127.0.0.1:8443
  -> trusted CA দিয়ে Agent Bridge
  -> OmniRoute 127.0.0.1:28128
  -> connected Claude OAuth provider, একই model ID
```

সংশোধিত source helper TLS ClientHello-এর প্রকাশ্য hostname দেখে; HTTP request, credential বা response decrypt করে না। অন্য local hostname আগের Local wildcard HTTPS router-এ `127.0.0.2:443` দিয়ে যায়। Mac-এ wildcard ও specific loopback listener একসঙ্গে কাজ করার test সফল। Fragmented TCP/TLS ClientHello এবং ১ MiB stream-এর প্রত্যেক byte অপরিবর্তিত থাকার test সফল।

Bridge listener না থাকলে শুধু Anthropic hostname-এর encrypted connection public DNS ব্যবহার করে সরাসরি Anthropic-এ যায়। তখন original native account-এর quota প্রযোজ্য। অন্য hostname vendor fallback-এ যায় না।

## ৪. স্থায়ী paths

| অংশ | Path / label |
| --- | --- |
| Source | `~/Developer/OmniRoute` |
| Persistent data | `~/.omniroute-local` |
| Replaceable runtime | `~/.omniroute-runtime` |
| Build/archive/rollback | `~/.omniroute-builds` |
| HOME command | `~/.local/bin/omni-ctl` |
| Versioned deployment tools | `nexa/deploy/` |
| App service | `com.nexalance.omniroute`, user LaunchAgent |
| Native ingress | `com.nexalance.omniroute-native-ingress`, system LaunchDaemon |
| Root helper | `/Library/Application Support/OmniRoute-Native-Ingress/native-ingress.mjs` |
| Root plist | `/Library/LaunchDaemons/com.nexalance.omniroute-native-ingress.plist` |
| Ingress log | `/Library/Logs/OmniRoute-Local/native-ingress.log` |
| Service logs | `~/Library/Logs/OmniRoute` |

## ৫. Active configuration

```dotenv
OMNIROUTE_SERVER_HOST=127.0.0.1
PORT=28128
MITM_LOCAL_HOST=127.0.0.1
MITM_LOCAL_PORT=8443
MITM_TARGET_AGENT=claude-code
MITM_SELECTED_ONLY=true
MITM_AUTO_RECOVER=true
MITM_ROOT_CA_ENABLED=true
MITM_DISABLE_TLS_VERIFY=0
MITM_IDLE_TIMEOUT_MS=600000
STREAM_READINESS_TIMEOUT_MS=600000
STREAM_READINESS_MAX_TIMEOUT_MS=600000
STREAM_IDLE_TIMEOUT_MS=600000
```

Environment এবং LaunchAgent দুটিতেই settings আছে; অন্য secret/environment values রাখা হয়েছে। CA/private key ও encryption key package directory-এর বাইরে। TLS verification চালু। Certificate নতুন করে regenerate করা হয়নি।

Native `.claude/settings.json`, account, history, projects এবং application bundle পরিবর্তন করা হয়নি। Native CLI first-party `claude.ai` login এবং Max subscription দেখিয়েছে। CLI shell-এ `ANTHROPIC_*` override পাওয়া যায়নি। Native Desktop signature verification সফল।

## ৬. Models, effort এবং accounts

১৩টি mapping আছে; প্রতিটি `native model ID -> cc/একই model ID`। Prompt compression বন্ধ। এই কাজের সময়ে native Opus low effort ও Sonnet high effort real requests সফল হয়েছে। Transport fixtures model, effort, system/tools, session/query headers এবং gzip/deflate/br/zstd request bodies পরীক্ষা করেছে। আগে করা অন্য model/effort tests আগের handoff-এ আছে।

চূড়ান্ত audit-এ দুটি active Claude OAuth connection পাওয়া গেছে। পরিকল্পিত তৃতীয় account এখনও owner-এর স্বাভাবিক OAuth sign-in প্রয়োজন। কোনো credential এই document বা repository-তে লেখা নেই।

Transport field preservation এবং provider executor-এর আচরণ আলাদা। Executor কিছু metadata/system/tool/header adaptation করতে পারে। তাই সব feature, সব ভবিষ্যৎ model এবং output quality ১০০% identical বলা যাচ্ছে না। নতুন native model ID-এর জন্য supported exact-model mapping যাচাই করতে হবে। Unmapped request original account-এর passthrough path-এ যেতে পারে।

## ৭. Dashboard Start/Stop ও restart

Dashboard: `http://omni.local/dashboard/tools/agent-bridge`

- Start-এর পরে intent true, listener 8443, selected Claude DNS এবং real interception দেখা গেছে।
- Service restart enabled Bridge নিজে থেকে ফিরিয়েছে।
- Stop-এর পরে intent false এবং listener বন্ধ হয়েছে। এরপর service restart করেও listener বন্ধ থেকেছে।
- Password cache না থাকলে Stop hosts entry সরাতে পারে না। সেই অবস্থায় independent ingress encrypted TLS সরাসরি Anthropic-এ পাঠায়; routing default native account ব্যবহার করে। DNS on badge তখন hosts entry বোঝায়, model interception নয়।
- Stop অবস্থায় CA verification-সহ native HTTPS request Anthropic-এর expected unauthenticated 401 পেয়েছে। Inference quota এই connectivity check দিয়ে যাচাই হয়নি।
- Dashboard Start আবার আগের mappings ফিরিয়েছে; native Sonnet response সফল হয়েছে।

## ৮. Update-এর সঠিক পথ

```sh
omni-ctl update
omni-ctl redeploy
omni-ctl build-only
omni-ctl update-status
```

HOME command এখন versioned `nexa/deploy/omni-updater.sh` নেয়। পুরোনো T7 command/script overwrite করা হয়নি। HOME command-এর পুরোনো symlink এবং পরের regular copy আলাদা backup-এ আছে। নতুন `install-local-command.sh` ভবিষ্যতেও পুরোনো command সংরক্ষণ করে এই entry point বসাবে।

`update-npm` এবং installed prefix-এর ওপর stock `install` এই command-এ block করা হয়েছে, কারণ সেগুলো overlay fixes বাদ দিত। সরাসরি stock package-manager replacement এই verified workflow-এর অংশ নয়।

Updater প্রথমে root-owned hostname-scoped ingress prerequisite যাচাই করে। পুরোনো helper থাকলে live service বন্ধ করার আগেই update থামে। তারপর clean source, stable release, patch applicability, core typecheck, measured TypeScript ratchet, Bridge/security regressions, production build এবং package policy যাচাই হয়।

অন্য port এবং database clone দিয়ে installed package-এর management auth, model catalog, আসল Opus message ও CORS isolation সফল হওয়ার পরে promotion হয়। Backend ও native ingress-এর সত্যিকারের TLS probes ছাড়াই deployment গ্রহণ করা হয় না।

Future upstream overlap বা protocol change ধরা পড়লে update বন্ধ হতে পারে। লক্ষ্য হলো বর্তমান কাজ করা service রক্ষা করা; সব ভবিষ্যৎ release কোনো review ছাড়াই কাজ করবে, এমন guarantee নয়।

## ৯. Rollback

Promotion পুরোনো prefix rename করে রাখে; package files-এর ওপর আংশিক overwrite করে না। Failed candidate আলাদা রাখে, পুরোনো prefix ফেরায় এবং service বন্ধ থাকা অবস্থায় pre-deployment SQLite snapshot restore করে। Failed candidate-এর database/WAL/SHM-ও রাখা হয়। Open handles থাকলে database restore বন্ধ হয়।

Snapshot নেওয়ার পরের writes snapshot-এ থাকে না; সংরক্ষিত failed database থেকে প্রয়োজন হলে সেগুলো recover করতে হবে। Archive, runtime backup, private database backup বা T7 originals স্বয়ংক্রিয়ভাবে delete হয় না।

দুটি controlled fault deployment পরীক্ষা হয়েছে। Fault package শুধু native transport health response invalid করেছিল। Updater সেটি reject করেছে; প্রথম test-এ runtime এবং দ্বিতীয় test-এ runtime+database ফিরে এসেছে। এরপর দুটো TLS probe ও native Opus real request সফল হয়েছে। Configuration fingerprints আগে-পরে identical হয়েছে।

## ১০. Package provenance

চলমান verified archive:
`~/.omniroute-builds/bridge-candidate-20261002-0954/omniroute-3.8.51.tgz`

Production Next bundle build SHA `e8916b0c8`। পরে CLI listener-only fix দিয়ে archive repack করা হয়েছে; isolated smoke আবার সফল হয়েছে। পরের commits deployment tools/documentation/ingress control যোগ করেছে; ওই পুরোনো compiled Next SHA-কে নতুন source SHA বলে দেখানো হয়নি। Future normal updater source থেকে সম্পূর্ণ build করবে।

Server source ও dist একই SHA-256:
`e3c1a9120f2ca863aaccfac0e4ed7b2d9ce319493414e20bcfb9a20a1d7caeac`

পুরোনো 01dcc9ff4 npm archive native fixes-হীন এবং বর্তমান package gate-এ rejected। তার পুরোনো runtime prefix forensic/manual fallback হিসেবে সংরক্ষিত।

## ১১. Validation results

| পরীক্ষা | ফল |
| --- | --- |
| Bridge/security gate | 54/54 pass |
| Broader Bridge tests | 315/315 pass |
| Vitest service/UI suite | 493/493 pass |
| Final focused clean-source run | 86 pass, 1 skip, 0 fail |
| Dashboard Node tests | 134/134 pass |
| Serial Node tests | 23/23 pass |
| POSIX preflight fixtures | 16/16 pass |
| Native ingress, SNI/wildcard/stream fixtures | 5/5 pass; সংশোধিত root helper activation বাকি |
| Database rollback fixtures | 2/2 pass |
| Core TypeScript | pass |
| Full TypeScript ratchet | 5830 diagnostics; accepted inherited baseline 5830 |
| Pristine upstream TypeScript comparison | 5875 diagnostics |
| All 46 overlay patches | apply cleanly |
| Source outside nexa/ | pristine |
| Production build, package policy, isolated auth/catalog/inference/CORS | pass |
| Native Opus/Sonnet, restart, Stop/Start, fault rollback | pass |

Full Node প্রথম batch-এ 44,957 tests: 44,860 pass, 68 fail, 29 skip। Failure থাকা ৩৮টি file পুরোনো fork এবং pristine upstream-এ তুলনা করা হয়েছে। ৩৫টি file-এর failure আগের fork-এও ঘটেছে; বাকি তিনটি clean-source focused rerun-এ pass করেছে। কিছু failure local CDP port 9222-এর সংঘর্ষ/পরিবেশের কারণে; অন্যগুলো আগের overlay আচরণের সঙ্গে সম্পর্কিত। এই report পুরো repository green হওয়ার দাবি করছে না। Dashboard/serial batches আলাদাভাবে চালিয়ে green পাওয়া গেছে।

## ১২. Backups এবং evidence

Private config/database backups:
- `~/.omniroute-local/update-backups/bridge-migration-20261002-0932`
- `~/.omniroute-local/update-backups/pre-promotion-20261002-0948`
- `~/.omniroute-local/update-backups/20261002-100046`
- `~/.omniroute-local/update-backups/20261002-100630`

Retained failed database: `~/.omniroute-builds/runtime-backups/failed-data-20261002-100630`

Legacy prefix: `~/.omniroute-builds/runtime-backups/legacy-20261002-0955`

Evidence/logs এবং preserved generated production output:
`~/Documents/Codex/2026-10-02/agent-bridge-durable-build-090420`

Backups private; credentials report-এ নেই। পুরোনো generated CLI/build outputs delete না করে evidence folder-এ রাখা হয়েছে।

## ১৩. Upstream PR এবং source ownership

Generic native transport + POSIX restart fixes-এর draft PR:
https://github.com/diegosouzapw/OmniRoute/pull/15323

PR review/merge এখনও upstream maintainer-এর অংশ। শেষ CI audit-এ API Route Typecheck ও Semgrep সফল। Heavy jobs draft অবস্থায় skipped; CI admission gate `draft or unknown PR readiness` এবং skipped required jobs দেখিয়ে FAIL করেছে। এটি full CI pass নয়; local tests বা draft তৈরি হওয়া upstream acceptance নয়। বিস্তারিত evidence: `pr-ci-admission-final.log`। Mac ingress, recovery, updater এবং local policy fork-এর nexa/ overlay-তে থাকে। Commit author/committer Jillur Rahman।

## ১৪. Native application update, features ও সীমা

Claude Desktop bundle বদলানো হয়নি এবং signature valid। দেখা version: Desktop 2.19675.0, Claude Code 2.1.287। Native updater path normal আছে; এই acceptance run-এ নতুন vendor app version install করে পরীক্ষা করা হয়নি।

Original native account-এর cloud chats/projects, cloud routines এবং cloud scheduled execution স্থানীয় API Bridge-এর মাধ্যমে স্বয়ংক্রিয়ভাবে অন্য provider account-এ যায় না। Cloud entitlement/quota original execution account-এর। Local scheduled features-এর end-to-end acceptance এই run-এ করা হয়নি।

Service restart পরীক্ষা হয়েছে; revised setup বসানোর পরে আরেকটি full Mac reboot করা হয়নি। LaunchDaemon RunAtLoad/KeepAlive এবং LaunchAgent recovery configured, কিন্তু actual full reboot acceptance আলাদা পরীক্ষা।

## ১৫. Final native ingress acceptance

সংশোধিত hostname-scoped helper source তৈরি এবং ৫টি fixture test সফল। কিন্তু system-এর root-owned helper-এ সেই শেষ revision এখনও বসানো হয়নি; administrator password প্রয়োজন। বর্তমান native Claude API response কাজ করছে, তবে পুরোনো helper অন্য local HTTPS hostname-ও Bridge-এ পাঠাতে পারে। নতুন updater এই prerequisite gap ধরলে service বন্ধ না করেই update reject করে; এই rejection test-এ service health 200 থেকেছে।

এই command Terminal-এ চালিয়ে password নিজে দিতে হবে:

```sh
sudo /bin/bash "$HOME/Developer/OmniRoute/nexa/deploy/install-native-ingress.sh"
```

Installer আগের helper ও daemon plist-এর backup রাখে। Account, certificate trust এবং hosts settings বদলায় না। Password চ্যাটে দেওয়া যাবে না।

তারপর শেষ verification:

```sh
node "$HOME/Developer/OmniRoute/nexa/deploy/bridge-gate.mjs" ingress
node "$HOME/Developer/OmniRoute/nexa/deploy/bridge-gate.mjs" live
```

দুটি check-এর পরে native real request ও screenshot দিয়ে completion addendum সংরক্ষণ করতে হবে। এই password ধাপ শেষ না হওয়া পর্যন্ত setup পুরোপুরি complete বা update-ready বলা হচ্ছে না।

চূড়ান্ত read-only audit: ২০২৬-১০-০২ সকাল ১০:৩০ Asia/Dhaka। Native first-party Max login এখনও active, source ও dist server hash একই, verified TLS native health `ok:true`, dashboard Running / 8443 / Claude Code Active। Root scoped helper prerequisite এখনও pending। Screenshot: `AGENT-BRIDGE-RUNNING-2026-10-02.png`। Portable source diff: `NEXA-AGENT-BRIDGE-DURABILITY-2026-10-02.patch`।


<!-- handoff-consolidation-2026-10-03 -->

## Latest consolidated handoff: 2026-10-03

Puro setup, Agent Bridge connection/lifecycle fixes, Local coexistence/DNS, durable nexa overlay, quota recovery, coding/context configuration, build RAM/disk control, tests, update/rollback ebong remaining gaps ekshathe: [HANDOFF-OMNIROUTE-2026-10-03-CONSOLIDATED.md](HANDOFF-OMNIROUTE-2026-10-03-CONSOLIDATED.md).

Latest recorded deployment/source/runtime f77079418, OmniRoute 3.8.51; final native CLI Opus/Sonnet ebong Desktop Code response successful. Tar pore coding settings-er 14 checks, native Read/follow-up, large-context observation ebong TLS/DNS gate successful. Ei file-er earlier builds, pending promotion ba cached-quota OFF descriptions historical; latest policy cached exhausted-account skip ON, preflight OFF. Future reset live recovery, remaining Thread mismatch telemetry, full 24-hour soak/new reboot ebong every native feature ekhono separate scope.

Documentation consolidation-e earlier content preserve kora hoyeche; new build ba live service mutation hoyni. User-er 2026-10-03 rule onujayi other people's public repositories-e PR/issue action designated owner session-er; help findings/patch oss-contrib/inbox-e hand over korte hobe. Purono direct-PR workflow latest authorization noy.
