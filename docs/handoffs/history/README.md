> **ঐতিহাসিক নথি — public copy, ২০২৬-১০-১৭।** মূল ঘটনার তারিখ ও ফল এই নথির নিজস্ব সময়ের জন্য প্রযোজ্য; পরের সংযোজন থাকতে পারে। বর্তমান অবস্থা ও কাজের নিয়মের জন্য [বর্তমান handoff](../CURRENT-STATUS-2026-10-17.md) পড়ুন। Private reference ও identifier সরানো হয়েছে; স্থানীয় evidence এখানে অন্তর্ভুক্ত নেই। পুরোনো cleanup, build, deploy বা service command বর্তমান অনুমতি হিসেবে ব্যবহার করবেন না।

# OmniRoute লোকাল সেটআপ (NexaLance)

OmniRoute হলো একটা লোকাল AI gateway: একটা endpoint (`/v1`, OpenAI-compatible) দিয়ে ৩৫০+ provider-এর model, quota দেখে auto-fallback, MCP আর A2A। এই folder-টা এই Mac-এ সেটার পুরো setup kit: control script, official release, source আর backup।

সেটআপ: 2026-10-02 · version **3.8.51** (npm-এর `latest` আর GitHub-এর সর্বশেষ stable release, দুটো মিলিয়ে দেখা)

## এক নজরে

| বিষয় | মান |
|---|---|
| Dashboard | http://127.0.0.1:28128 |
| API (OpenAI-compatible) | http://127.0.0.1:28128/v1 |
| Port | **28128** (upstream-এর default 20128 ইচ্ছা করে এড়ানো); ভেতরের দুটো loopback helper: 28131 (embedded-service WS proxy), 28132 (dashboard live WebSocket) |
| Bind | শুধু `127.0.0.1`, LAN থেকে পৌঁছানো যায় না |
| API key | বাধ্যতামূলক (`REQUIRE_API_KEY=true`) |
| Auto-start | LaunchAgent `com.nexalance.omniroute`: প্রতিবার login-এ চালু, crash হলে নিজে আবার ওঠে |
| Desktop app | `/Applications/OmniRoute.app` (3.8.51), একই service-এর সাথে যুক্ত |
| Control | `omni-ctl` (= `scripts/omni-ctl.sh`) |

## এক-ক্লিক update আর নিজেদের customization (child theme)

Service চলে আপনার fork **`developerjillur/OmniRoute`**, branch **`nexalance`**-এর নিজস্ব build থেকে, npm-এর stock package থেকে নয়। Source আছে `~/Developer/OmniRoute`-এ, remote দুটো: `origin` (fork) আর `upstream` (diegosouzapw)।

**Child theme কীভাবে কাজ করে:** upstream-এর কোনো ফাইল সরাসরি বদলানো হয় না। সব customization থাকে `nexa/` folder-এ:
- `nexa/patches/`: upstream ফাইলের ওপর ছোট diff।
- `nexa/new/`: নতুন ফাইল।

Build-এর সময় এগুলো বসানো হয়, build শেষে আবার সরিয়ে ফেলা হয়। ফলে upstream merge-এ কখনো conflict হয় না। কোনো patch নতুন upstream ফাইলে আর না বসলে update নিজেই থেমে যায়, চলমান version-এ হাত না দিয়ে। বিস্তারিত: `~/Developer/OmniRoute/nexa/README.md`।

**Update বোতাম:** নতুন **stable release** এলে Dashboard → Home-এ update বোতাম দেখায়। চাপলে কী হয়:
1. OmniRoute `AUTO_UPDATE_COMMAND` চালায়। (এটা আমাদের overlay patch `AUTO_UPDATE_MODE=command`।)
2. ওটা LaunchAgent `com.nexalance.omniroute-updater` চালু করে, যেটা `scripts/omni-updater.sh` চালায়। ধাপগুলো:
   - `nexa/update.mjs`: নতুন release fork-এ merge।
   - Overlay বসিয়ে upstream-এর নিজের publish ধাপে build: `build:release`, `build:cli-api`, `build:cli`, `check:pack-artifact`, `npm pack`।
   - Electron app build (`electron-builder --dir --arm64`)।
   - Service-এ install, health check, ব্যর্থ হলে আগের build-এ rollback।
   - Desktop app বদলে relaunch (খোলা থাকলে)।
   - সফল হলে fork-এ push (শুধু `origin`, upstream-এ কখনো না)।
3. ফলাফল macOS notification-এ দেখায়, আর `omni-ctl update-status`-এ।

| কমান্ড | কাজ |
|---|---|
| `omni-ctl update` | বোতামের মতোই, terminal থেকে |
| `omni-ctl redeploy` | নিজেদের নতুন customization commit-এর পরে build + deploy |
| `omni-ctl update-status` | শেষ update-এর ফল |
| log | `~/Library/Logs/OmniRoute/update.log` |

Build-গুলো থাকে `~/.omniroute-builds/` (চলমানটা + আগের দুটো, rollback-এর জন্য)।

**নতুন feature বা fix যোগ করা:**
1. `~/Developer/OmniRoute`-এ upstream ফাইল edit করে test করুন।
2. `git diff upstream-main -- <file> > nexa/patches/<path-এর / বদলে __>.patch`। নতুন ফাইল হলে `nexa/new/<একই path>`।
3. ফাইলটা `git checkout upstream-main -- <file>` দিয়ে ফেরান।
4. `node nexa/check/pristine-base.mjs` চালান, commit করুন, তারপর `omni-ctl redeploy`।

**Upstream-এ PR:** যেকোনো fix যা সবার কাজে লাগে, সেটা upstream-এর active `release/v*` branch থেকে আলাদা branch কেটে test সহ PR হয়। নিয়ম: প্রতিটা PR খোলার আগে আপনার অনুমতি নেওয়া হবে। Merge হলে পরের release-এ fix base-এ চলে আসে, আর ওই patch overlay থেকে মুছে যায়। এভাবে overlay নিজে থেকেই ছোট হতে থাকে।

**খোলা PR:** [#15321](https://github.com/diegosouzapw/OmniRoute/pull/15321) `AUTO_UPDATE_MODE=command`। Merge হলে পরের release-এ এটা upstream-এ চলে আসবে, তখন overlay-র এই patch দুটো মুছে দেওয়া যাবে।

**Agent Bridge (অন্য একটা session বসিয়েছে, 2026-10-02 ০৭:৪২-এর পরে):** Claude Code-এর `api.anthropic.com` traffic এখন OmniRoute-এর MITM দিয়ে যায়:
- `/etc/hosts`-এ `api.anthropic.com → 127.0.0.1`।
- Local-এর nginx-এ bridge: `route.api-anthropic-bridge.conf`।
- `127.0.0.1:8443`-এ MITM।
- System keychain-এ trusted "OmniRoute MITM CA"।
- Service plist-এ `NODE_OPTIONS` hook (`bridge-upstream-dns.cjs`) আর `MITM_*` env।

`omni-ctl enable`/`install` plist আবার লিখলেও এই env এখন রেখে দেয়। Claude Code-এ `SELF_SIGNED_CERT_IN_CHAIN` error দেখালে কারণ এটাই। দুটো সমাধান: Claude Code-কে `NODE_EXTRA_CA_CERTS=~/.omniroute-local/mitm/ca.crt` দিন, অথবা bridge বন্ধ করুন।

## http://omni.local

Port মনে রাখার দরকার নেই: **http://omni.local** খুললেই dashboard (API: `http://omni.local/v1`)।

- `omni.local` → নিজস্ব loopback address `127.0.0.2` আর `fd6f:6d6e::2` (`/etc/hosts`-এ দুটো লাইন)। IPv6 লাইনটা না থাকলে `.local` নামে প্রতিবার ৫ সেকেন্ড দেরি হতো।
- Port 80 (`*:80`) আগে থেকেই Local (Flywheel)-এর router nginx-এর দখলে, আর ওর config Local নিজে প্রতিবার নতুন করে লেখে। তাই ওতে হাত না দিয়ে আলাদা address নেওয়া হয়েছে; Local-এর `*.local` site-গুলো আগের মতোই চলে।
- ওই দুই address-এর 80 / 28131 / 28132 থেকে একটা ছোট TCP forwarder সব কিছু 28128 / 28131 / 28132-এ পাঠায়। WebSocket-ও চলে, login cookie omni.local-এই থাকে।
- macOS-এ সাধারণ user নির্দিষ্ট address-এ port 80 bind করতে পারে না, তাই root LaunchDaemon `com.nexalance.omni-local` চালু হয় (boot-এ alias তোলে)।
- **Local-এর সাথে সংঘাত এড়ানোর ব্যবস্থা (2026-10-02):** macOS-এর নিয়ম হলো, অন্য কোনো user-এর socket একই port নির্দিষ্ট address-এ ধরে রাখলে Local-এর nginx `*:80`/`*:443`-এ bind করতে পারে না। আগে আমাদের forwarder আর Agent Bridge ingress-এর socket root-এর ছিল, তাই reboot-এর পর Local-এর সব site বন্ধ হয়ে গিয়েছিল।
  - এখন `scripts/omni-bind.pl` প্রতিটা socket **আপনার user (developerjillur)-এর মালিকানায়** বানায়, শুধু bind করার সময় root ব্যবহার করে, তারপর `nobody` হয়ে program চালায়।
  - ফলে Local আগে চালু হোক বা পরে, দুজনেই পাশাপাশি চলে। Agent Bridge ingress-ও একইভাবে চালু হয়, তার আচরণ বদলায়নি।
  - ফাইল: `/Library/Application Support/OmniRoute-Local/` (`omni-bind.pl`, `omni-local-proxy.mjs`)
  - Log: `/Library/Logs/OmniRoute-Local/proxy.log`, root চালানোর log: `root-*.log`
- Local-এর site আবার "refused" দেখালে আগে router-এর log দেখুন: `~/Library/Application Support/Local/run/router/nginx/logs/error.log`। "Address already in use" থাকলে `omni-ctl hostproxy` আবার চালান, তারপর Local-এ যেকোনো site একবার restart করুন।
- আবার বসাতে বা আপডেট করতে: `omni-ctl hostproxy` (macOS একবার login password চাইবে)। Root process T7 drive পড়তে পারে না, তাই script-টা আগে নিজেই ফাইলগুলো internal disk-এ copy করে নেয়।
- ফেরাতে: `sudo launchctl bootout system/com.nexalance.omni-local`, তারপর ওই plist আর folder মুছুন, আর `/etc/hosts` থেকে দুটো `omni.local` লাইন সরান। `/etc/hosts`-এর backup আছে `/etc/hosts.bak-omniroute-*`-এ।
- `localhost:28128` আগের মতোই কাজ করে; tool-গুলোর config বদলানোর দরকার নেই।

## কোথায় কী আছে

| জায়গা | কী আছে | কেন এখানে |
|---|---|---|
| `~/.omniroute-runtime/` | npm package `omniroute@3.8.51` (আলাদা prefix) | internal disk: T7 খুলে রাখলেও service চলে |
| `~/.omniroute-local/` | database, `.env` (secrets, mode 600), `local-default.key`, app log, official backup | এই instance-এর নিজস্ব data folder |
| `~/Library/LaunchAgents/com.nexalance.omniroute.plist` | auto-start | macOS-এর standard জায়গা |
| `~/Library/Logs/OmniRoute/` | service-এর stdout/stderr | data folder-এর বাইরে (কারণ নিচে "জানা সমস্যা"-তে) |
| `/Applications/OmniRoute.app` | official Desktop app | |
| এই kit (T7) | `scripts/`, `config/`, `releases/v3.8.51/` (dmg, checksum, changelog, SBOM), `source/OmniRoute/` (tag v3.8.51), `backups/` | reference, reinstall আর backup |

Runtime-টা ইচ্ছা করে T7-এ রাখা হয়নি: T7 exFAT আর portable, login-এর সময় mount না থাকলে service উঠত না, আর exFAT-এ চলমান SQLite database ঝুঁকিপূর্ণ।

**Node:** service চলে `/usr/local/bin/node` দিয়ে (**Node 24.15.0 LTS**, nodejs.org installer)। আপনার PATH-এর `node` আসলে Hermes-এর private Node 26 (`~/.hermes/node`); ওটার উপর auto-start দাঁড় করালে Hermes update হলেই ভাঙত। Node 24-এ native SQLite engine (`better-sqlite3`) সরাসরি চলে, `doctor` দিয়ে যাচাই করা।

## প্রথমবার: login, password, API key

1. Dashboard খুলুন: `omni-ctl open` (অথবা Desktop app)।
2. প্রথম password:
   ```bash
   grep '^INITIAL_PASSWORD=' ~/.omniroute-local/.env | cut -d= -f2
   ```
   Login-এর পর **Settings → Security** থেকে বদলে নিন (2026-10-02-এ বদলানো হয়েছে; `.env`-এর মানটা শুধু প্রথম boot-এর, এখন আর কাজ করে না)। ভুলে গেলে:
   ```bash
   DATA_DIR=~/.omniroute-local ~/.omniroute-runtime/bin/omniroute-reset-password
   ```
3. একটা gateway key আগেই বানানো আছে (`local-default`):
   ```bash
   cat ~/.omniroute-local/local-default.key
   ```
   প্রতিটা tool-এর জন্য আলাদা key রাখা ভালো: Dashboard → API Keys।

## Provider যোগ করুন (এটা ছাড়া chat উত্তর দেবে না)

Upstream README বলে fresh install-এ `auto` model কোনো key ছাড়াই OpenCode Free দিয়ে উত্তর দেয়। **2026-10-02-এ এটা আর সত্য নয়:** OpenCode এখন বাইরের ব্যবহার আটকায় (`HTTP 403: OpenCode's free tier can only be used from within OpenCode`)। Gateway ঠিক আছে (request provider পর্যন্ত পৌঁছেছে), কিন্তু উত্তর পেতে অন্তত একটা provider যোগ করতে হবে।

Dashboard → **Providers** → যেটা আছে connect করুন: Claude / Codex / Copilot subscription (OAuth login), Kiro (free, login লাগে), অথবা যেকোনো API key (Gemini, OpenRouter, DeepSeek, GLM ...)। এরপর `auto` combo নিজেই route আর fallback করবে।

যাচাই:
```bash
KEY=$(cat ~/.omniroute-local/local-default.key)
curl -s http://127.0.0.1:28128/v1/chat/completions \
  -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -d '{"model":"auto","messages":[{"role":"user","content":"Say hi"}]}'
```

## Tool-গুলোর সাথে যুক্ত করা

যেকোনো OpenAI-compatible tool:
```
Base URL: http://127.0.0.1:28128/v1
API key:  ~/.omniroute-local/local-default.key-এর মান (বা নিজের বানানো key)
Model:    auto   (অথবা provider/model)
```

Upstream-এর official helper আছে, যেগুলো tool-এর জন্য **আলাদা profile** লেখে (default config বদলায় না)। চালানোর আগে `--help` দেখে নিন:
```bash
omni-ctl cli setup-claude --help    # ~/.claude/profiles/<name>/
omni-ctl cli setup-codex --help     # ~/.codex/<name>.config.toml
```
`doctor` দেখেছে এই Mac-এ Claude Code, Codex আর Hermes আছে কিন্তু OmniRoute-এ যুক্ত নয়। এগুলো ইচ্ছা করে বদলানো হয়নি।

**MCP** (Claude Code-কে OmniRoute-এর ১১০টা tool দিতে চাইলে): একটা **management-scoped** key লাগে (Dashboard → API Keys → key-এ "Management Access" চালু)। তারপর:
```bash
claude mcp add --transport http omniroute http://127.0.0.1:28128/api/mcp/stream \
  --header "Authorization: Bearer <management-key>"
```

## Auto-start কীভাবে কাজ করে

- `~/Library/LaunchAgents/com.nexalance.omniroute.plist` চালায় `/usr/local/bin/node …/omniroute.mjs serve --no-open`। Upstream তার নিজের Linux service-এ ঠিক এটাই চালায়।
- `RunAtLoad`: প্রতিবার login-এ চালু। `KeepAlive` (`SuccessfulExit=false`): crash হলে launchd আবার তোলে। পরীক্ষা করা: supervisor-কে `kill -9` করার ২ সেকেন্ডে নতুন process, ৩ সেকেন্ডে `/healthz` আবার 200।
- Upstream-এর `omniroute autostart enable` ব্যবহার করা হয়নি: ওটার macOS plist-এ `KeepAlive=false`, কোনো log বা env নেই, আর তখনকার Node-এর realpath hard-code করে। **ওটা চালাবেন না**, চালালে default port 20128 আর পুরনো `~/.omniroute` folder নিয়ে দ্বিতীয় একটা server উঠবে।
- কম্পিউটার চালু হওয়ার সাথে সাথে নয়, **login-এর পরে** চালু হয়। এই Mac-এ auto-login বন্ধ, তাই ক্রম হলো power-on → login → OmniRoute। Login-এর আগেই চালু চাইলে auto-login চালু করতে হবে, অথবা sudo দিয়ে একটা LaunchDaemon বসাতে হবে।
- macOS প্রথমবার "Background Items Added" notification দেখাতে পারে (node / OpenJS Foundation)। ওটা চালু রাখুন: System Settings → General → Login Items & Extensions।

## Desktop app

- Official `OmniRoute-3.8.51-arm64.dmg`, release-এর নিজস্ব `latest-mac.yml`-এর sha512 দিয়ে যাচাই করে `/Applications`-এ বসানো।
- **Remote Server Mode**-এ চলে: নিজের আলাদা server না তুলে always-on service-এর (28128) সাথে যুক্ত হয়। ফলে data, provider login আর quota একটাই থাকে; দুটো আলাদা server একই OAuth account refresh করলে token একে অপরকে বাতিল করে দিতে পারত। Setting: `~/.omniroute/electron-preferences.json` → `{"remoteServerUrl": "http://127.0.0.1:28128"}`।
- নিজের embedded server-এ ফেরাতে: tray menu → Remote Server → ঘর ফাঁকা রেখে save (অথবা ওই JSON থেকে `remoteServerUrl` সরান)। তখন app default 20128 আর `~/.omniroute` ব্যবহার করবে।
- Signature: Apple Developer ID নেই, শুধু ad-hoc linker signature (upstream নিজেই বলে)। Quarantine flag নেই বলে Gatekeeper আটকায় না। কখনো আটকালে: `xattr -cr /Applications/OmniRoute.app`।
- VS Code-এর terminal থেকে app খুললে চালু হয়েই বন্ধ হয়ে যেতে পারে, কারণ VS Code `ELECTRON_RUN_AS_NODE=1` দেয়। Dock / Spotlight অথবা `omni-ctl desktop` ব্যবহার করুন (এটা variable-টা সরিয়ে দেয়)।
- Login-এ app-ও খুলতে চাইলে: app-এর Settings → Appearance → Launch at login।

## দৈনন্দিন কমান্ড

| কমান্ড | কাজ |
|---|---|
| `omni-ctl status` | version, launchd অবস্থা, healthz, desktop app |
| `omni-ctl start` / `stop` / `restart` | service চালু / বন্ধ / restart (`stop` পরের login পর্যন্ত) |
| `omni-ctl enable` / `disable` | login-এ auto-start চালু / বন্ধ |
| `omni-ctl logs` / `omni-ctl logs -f` | service আর app log |
| `omni-ctl open` / `omni-ctl desktop` | browser-এ dashboard / Desktop app |
| `omni-ctl backup [--with-secrets]` | database snapshot → এই kit-এর `backups/` |
| `omni-ctl update [version]` | backup → install → health check → ব্যর্থ হলে আগের version-এ rollback |
| `omni-ctl install-desktop [version]` | Desktop app install / update (checksum যাচাই সহ) |
| `omni-ctl features` | MCP, A2A আর scheduled backup চালু (বারবার চালালেও সমস্যা নেই) |
| `omni-ctl cli <args>` | official `omniroute` CLI, এই instance-এর উপর |

`omni-ctl` হলো `~/.local/bin/omni-ctl` → `scripts/omni-ctl.sh`। T7 না থাকলে shortcut কাজ করবে না, কিন্তু service চলতে থাকবে।

## Update

```bash
omni-ctl update                    # npm-এর latest, অথবা: omni-ctl update 3.8.52
omni-ctl install-desktop 3.8.52    # Desktop app-এর নতুন release
```
Update-এর আগে script `MACHINE_ID_SALT` আপনার `.env`-এ pin করা আছে কিনা নিশ্চিত করে। 3.8.51-এ package-এর মানটা ধ্রুবক (`endpoint-proxy-salt`), তাই এখন এটা সাবধানতা মাত্র; ভবিষ্যতের কোনো version salt বদলালে machine ID বদলে API key অকেজো হতো, pin থাকলে তা হবে না।
Update চলার আগে নতুন version npm-এ আছে কিনা যাচাই হয়; ব্যর্থ হলে আগের version ফিরিয়ে health check করে, আর rollback নিজেও ব্যর্থ হলে স্পষ্ট "ROLLBACK FAILED" বলে।

`npm i -g omniroute` বা `omniroute update --apply` চালাবেন না: ওগুলো Hermes-এর `~/.local` prefix-এ আলাদা একটা copy বসাবে।

## Backup আর restore

- **Official, স্বয়ংক্রিয়:** রোজ 03:00-এ, শেষ ১৪টা থাকে → `~/.omniroute-local/db_backups/`। Mac তখন sleep-এ থাকলে সেদিনের backup নাও হতে পারে।
- **T7-এ কপি:** `omni-ctl backup` → `backups/omniroute-YYYYmmdd-HHMMSS/` (চলন্ত অবস্থাতেও নিরাপদ `sqlite3 .backup`)। `--with-secrets` দিলে `.env`-ও যায়; ওটা দিয়ে সব stored credential decrypt করা যায়, তাই drive-টা private রাখুন।
- Restore, official backup থেকে: `omni-ctl cli restore --help`
- Restore, T7 snapshot থেকে:
  ```bash
  omni-ctl stop
  mv ~/.omniroute-local/storage.sqlite ~/.omniroute-local/storage.sqlite.before-restore
  cp "backups/omniroute-YYYYmmdd-HHMMSS/storage.sqlite" ~/.omniroute-local/
  omni-ctl start
  ```
  Provider login decrypt করতে একই `STORAGE_ENCRYPTION_KEY` লাগবে।

## নিরাপত্তা

- Upstream default হলো `0.0.0.0` আর কোনো API key ছাড়া; upstream নিজেই সতর্ক করে (GHSA-wmgv-ph3p-rv57) যে তখন LAN-এর যে কেউ আপনার provider quota খরচ করতে পারে। এখানে দুটোই বন্ধ: loopback bind আর `REQUIRE_API_KEY=true`। যাচাই করা: LAN IP থেকে connection refused, key ছাড়া `/v1` → 401, ভুল key → 401।
- `~/.omniroute-local/.env` আর `local-default.key` দুটোই mode 600। কখনো commit বা share করবেন না।
- MCP আর A2A চালু, কিন্তু loopback-only এবং key ছাড়া 401।

## ইচ্ছা করে বন্ধ রাখা

| জিনিস | কেন |
|---|---|
| Compression (Lite, Caveman, RTK ...) | upstream default-এই বন্ধ। এগুলো upstream-এ যাওয়া prompt বা model-এর উত্তরের ধরন বদলায় (Lite-ও whitespace কাটে)। চাইলে Dashboard → Compression থেকে চালু করুন। |
| Tunnel (Cloudflare / Tailscale), Cloud sync | gateway-কে internet-এ খোলে, অথবা data বাইরে পাঠায় |
| Upstream `omniroute autostart`, `serve --tray` | উপরে কারণ দেওয়া; Desktop app-এর tray-ই যথেষ্ট |
| OmniRouteTray (menu-bar app) | community project, official release নয় |

## জানা সমস্যা ও নোট

- **Log folder-এর ফাঁদ:** OmniRoute প্রথম চালুর সময় `DATA_DIR/logs/`-এর সব ফাইল একটা "legacy request logs" zip-এ সরিয়ে মুছে দেয়। প্রথম boot-এ launchd-এর log ওভাবেই সরে গিয়েছিল (`~/.omniroute-local/log_archives/`-এ আছে)। তাই service log এখন `~/Library/Logs/OmniRoute/`-এ।
- **CLI noise:** প্রতিটা `omniroute` কমান্ডে প্রায় ১৫ লাইন "… is ignored, … set it first" আসে। এটা প্রত্যাশিত: আপনার `.env` package-এরটার উপর জেতে। `omni-ctl cli` output pipe বা capture হলে এগুলো ছেঁকে ফেলে।
- `omniroute mcp call` base URL না পেলে `localhost:20128` hard-code করে (upstream bug, `bin/cli/commands/mcp.mjs`)। `omni-ctl cli` সবসময় `OMNIROUTE_BASE_URL` দিয়ে দেয়।
- `omniroute a2a status` "stopped" দেখায়, কিন্তু REST `/api/a2a/status` বলে `enabled: true, online: true` (CLI-র display bug)।
- A2A agent card (`/.well-known/agent.json`)-এর নাম আর বিবরণ upstream-এ চীনা ভাষায় hard-code করা। Dashboard ইংরেজিতেই।
- `~/.omniroute/` হলো 2026-09-30-এর একটা পুরনো run-এর অবশিষ্ট (upstream test-এর plugin fixture; কোনো provider বা key নেই)। Service এটা ব্যবহার করে না, শুধু Desktop app-এর `electron-preferences.json` এখানে থাকে। অক্ষত রাখা হয়েছে।
- OmniRoute-এর server plugin scanner `DATA_DIR` মানে না, নিজে থেকে `~/.omniroute/plugins` খোঁজে। তাই `.env`-এ `OMNIROUTE_PLUGINS_DIR=~/.omniroute-local/plugins` দেওয়া আছে। (ঠিক করার আগেও কোনো plugin লোড হয়নি: log-এ `loadAll count 0`।)
- `source/OmniRoute/`-এ upstream-এর `CLAUDE.md` / `AGENTS.md` আছে। ওই folder-এর ভেতরে Claude Code চালালে সেগুলো load হবে; ওগুলো upstream contributor-দের নিয়ম, এই setup-এর নয়।
- Gemini Web-এর মতো web-cookie provider-এর জন্য Playwright Chromium আলাদা install করতে হয় (upstream `docs/guides/TROUBLESHOOTING.md`)।

## Uninstall

```bash
omni-ctl uninstall   # service বন্ধ, LaunchAgent plist সরায়, বাকি জিনিসের তালিকা দেয়
```
Data, runtime, app আর এই kit হাতে মুছতে হবে। তার আগে `omni-ctl backup --with-secrets`।


<!-- handoff-consolidation-2026-10-03 -->

## Complete setup handoff index, 2026-10-03

- [HANDOFF-OMNIROUTE-2026-10-03-CONSOLIDATED.md](HANDOFF-OMNIROUTE-2026-10-03-CONSOLIDATED.md): sob recorded setup, fixes, native QA, saved settings, build budget, update/rollback, evidence ebong remaining scope.
- [Quota recovery and deployed native acceptance](HANDOFF-OMNIROUTE-2026-10-03-QUOTA-RECOVERY.md).
- [Coding quality and maximum-context configuration](HANDOFF-OMNIROUTE-2026-10-03-CODING-QUALITY.md).

Latest recorded deployment OmniRoute 3.8.51/f77079418. Earlier sections-er stock update-npm/customization or direct-public-PR instructions-ke current operational approval dhora jabe na; consolidated report-er managed update ebong 2026-10-03 contribution ownership rule follow korte hobe. Settings-only changes rebuild require kore na. Tests-er coverage ar pending 24-hour/reboot/protocol verification report-e alada ache.
