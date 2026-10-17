> **ঐতিহাসিক নথি — public copy, ২০২৬-১০-১৭।** মূল ঘটনার তারিখ ও ফল এই নথির নিজস্ব সময়ের জন্য প্রযোজ্য; পরের সংযোজন থাকতে পারে। বর্তমান অবস্থা ও কাজের নিয়মের জন্য [বর্তমান handoff](../CURRENT-STATUS-2026-10-17.md) পড়ুন। Private reference ও identifier সরানো হয়েছে; স্থানীয় evidence এখানে অন্তর্ভুক্ত নেই। পুরোনো cleanup, build, deploy বা service command বর্তমান অনুমতি হিসেবে ব্যবহার করবেন না।

# OmniRoute Agent Bridge setup handoff

Owner: Jillur Rahman / NexaLance<br>
তারিখ: ২ অক্টোবর ২০২৬, সকাল ৮:৪৬, Asia/Dhaka<br>
Setup directory: `<local-setup>`<br>
Agent Bridge: http://omni.local/dashboard/tools/agent-bridge

এই handoff বর্তমান Claude Agent Bridge configuration, আগে করা কাজ, পরীক্ষার evidence, update-এর আচরণ এবং বাকি কাজ একসঙ্গে ধরে রাখে। এতে password, API key, OAuth token, encryption key বা CA private key-এর value নেই। এটি HANDOFF-OMNIROUTE-2026-10-02.md-এর পরিপূরক; আগের handoff overwrite করা হয়নি।

## ১. বর্তমান সিদ্ধান্ত

মূল Claude.ai / Max account, পুরোনো Code sessions এবং native app রেখে স্থানীয় Claude Code inference Agent Bridge দিয়ে কাজ করছে। একই model mapping ও native effort selection ব্যবহার হয়েছে। Native application bundle patch করা হয়নি। Global CLI provider override ফিরিয়ে দেওয়া হয়েছে।

বর্তমান tested workflow সফল। কিন্তু OmniRoute update/redeploy-এর পরে বর্তমান Bridge transport বজায় থাকা, cold restart recovery, সমস্ত native feature এবং output quality-এর পূর্ণ সমতা এখনও নিশ্চিত নয়। এই নথির বাকি কাজগুলো সম্পন্ন না হলে “ভবিষ্যতের সব update-এ সব same-to-same থাকবে” বলা যাবে না।

| বিষয় | বর্তমান অবস্থা |
|---|---|
| OmniRoute runtime | 3.8.51; fork build 01dcc9ff4-এর ওপর local runtime compatibility changes |
| Dashboard / main service | omni.local / 127.0.0.1:28128 |
| Bridge | Running, loopback 127.0.0.1:8443 |
| Native HTTPS ingress | Local nginx 443, api.anthropic.com vhost |
| Original native account | Jillur Rahman Max; পুরোনো projects/sessions দৃশ্যমান |
| CLI auth | loggedIn=true, claude.ai, firstParty, Max |
| CLI default model | opus |
| CLI provider override | custom ANTHROPIC_BASE_URL/API key/helper নেই |
| Claude mapping | ১৩টি canonical model নিজের cc/ target-এ |
| Prompt compression | enabled=false, defaultMode=off |
| Thinking budget | explicit persisted override নেই; default passthrough |
| Connected Claude provider | একটি active OAuth connection; তিন-account pool এখনও হয়নি |
| Native Desktop version | 2.19675.0; codesign verification সফল |
| Claude Code CLI | native 2.1.286 |
| CLI auto-update | doctor: enabled, latest; last attempt success → 2.1.286, 2026-10-01 |
| Desktop updater | main.log-এ 08:37 ও 08:38-এ Checking for updates |
| Agent Bridge dashboard | Running, Certificate trusted, Claude Active |
| UI counters / inspector | Intercepted: 0 display ভুল; Traffic Inspector live WebSocket offline |

শেষ নতুন inventory-তে hosts entries, database flags, ১৩টি mapping, original CLI auth এবং পাঁচটি reviewed runtime hash মিলেছে। এখানে নতুন update/redeploy বা service restart চালানো হয়নি।

## ২. ব্যবহারকারীর উদ্দেশ্য ও অনুমতি

উদ্দেশ্য ছিল native Claude app/CLI/VS Code-এর existing account, history, projects ও working style রাখা; model provider routing OmniRoute থেকে নিয়ন্ত্রণ করা; Bridge Stop করলে default connection ফিরে পাওয়া। Quality কমানোর জন্য wildcard downgrade বা prompt compression ব্যবহার করা হয়নি।

ব্যবহারকারী স্থানীয় OmniRoute MITM CA trust ও Claude Code-এর api.anthropic.com routing-এর নির্দিষ্ট অনুমতি দিয়েছেন। Administrator password entry ও Confirm ব্যবহারকারী নিজে করেছেন। Password চ্যাটে নেওয়া হয়নি। Bridge keep/use করার উদ্দেশ্য কথোপকথনে নিশ্চিত; আগের সাধারণ handoff-এর “keep or remove” open decision এখনকার অনুমতির পূর্ণ বর্ণনা নয়।

এটি host-based TLS interception। একই api.anthropic.com ব্যবহার করা অন্য local client-ও এই পথ পেতে পারে। এটি কেবল Claude process-কে আলাদা করে intercept করার ব্যবস্থা নয়।

## ৩. কাজের ধাপ

### ৩.১ প্রথম Gateway পরীক্ষা এবং original account-এ ফেরা

প্রথম পর্যায়ে official third-party Gateway configuration দিয়ে Native Code ও CLI পরীক্ষা করা হয়েছিল। ওই mode-এর profile/data directory original standard account থেকে আলাদা হওয়ায় পুরোনো account-এর chats/projects দেখা যাচ্ছিল না। এটি নতুন Anthropic account তৈরি করার প্রমাণ ছিল না।

পরে standard Claude.ai mode-এ original Max account ফেরানো হয়েছে। Original Claude data directory এবং separate Claude-3p directory সংরক্ষিত আছে; conversations merge/delete করা হয়নি। CLI-তে পরীক্ষার জন্য দেওয়া ANTHROPIC_BASE_URL, gateway discovery/model overrides, apiKeyHelper ও explicit Gateway model list original values-এ ফিরেছে। অন্য plugins, permissions ও user preferences বজায় ছিল। ব্যবহারকারী পরে model settings বদলাতে পারেন, তাই পুরোনো পুরো settings backup অন্ধভাবে restore করা যাবে না।

বর্তমান CLI settings hash:

`6d1898e2e18414c1cf3f1b79445722da402cdf1f49974465cc0b1770244fd2fa`

### ৩.২ CLI 401 এবং পুরোনো session

Fresh Sonnet ও default Opus request দিয়ে authentication সফল হয়েছিল। পুরোনো CLI history-এর পৃথক temporary resume/fork test-ও সফল হয়েছিল। VS Code-এর আগে থেকে চলা process-এ authentication/extension restart state আটকে ছিল। ব্যবহারকারী VS Code বন্ধ করে আবার খুললে old sessions কাজ করছে বলে নিশ্চিত করেছেন। Account logout বা history delete করা হয়নি।

### ৩.৩ Certificate তৈরি ও trust

OmniRoute-এর root-CA implementation `_internal/rootCaShim.cjs` ব্যবহার করে CA তৈরি ও leaf issue করা হয়েছে। Dashboard-এর automatic certificate installation ব্যর্থ হওয়ায় Keychain Access দিয়ে একই CA System keychain-এ import/trust করা হয়েছে; administrator confirmation ব্যবহারকারী দিয়েছেন।

CA: `~/.omniroute-local/mitm/ca.crt`<br>
CA key: একই directory-তে ca.key; value কখনও report/share করবেন না।

CA SHA-256 fingerprint:

`7E:C8:3A:E8:E0:1E:C8:5A:7A:F7:80:A8:12:AE:7B:08:18:C0:80:76:BD:0A:93:C9:A3:B2:82:9A:EF:D7:9D:9C`

CA মেয়াদ: 2026-10-02 থেকে 2036-10-02। Current nginx leaf মেয়াদ 2027-10-02 পর্যন্ত। CA/leaf private key mode 600; mitm directory 700। `security verify-cert -p ssl` সফল। Local CA-র Certificate Transparency status public certificate-এর মতো verified না হওয়া certificate trust failure নয়।

TLS verification বন্ধ করা হয়নি। `MITM_DISABLE_TLS_VERIFY=0`।

### ৩.৪ Port 443 conflict-এর ব্যবস্থা

Local app-এর nginx আগে থেকেই IPv4/IPv6 443 ব্যবহার করে। সেটি বন্ধ না করে পৃথক vhost যোগ হয়েছে:

`~/Library/Application Support/Local/run/router/nginx/conf/route.api-anthropic-bridge.conf`

Vhost-এর আচরণ:

- server_name api.anthropic.com;
- TLS ingress 443, loopback allow, অন্য client deny;
- proxy_pass HTTPS 127.0.0.1:8443;
- upstream SNI api.anthropic.com;
- proxy_ssl_verify on, CA trust file ca.crt;
- request/response buffering off;
- body limit 64m, read/send timeout 600s।

Current nginx config test সফল। Local nginx চলা এই adapter-এর dependency। Local router config regenerate করলে vhost থাকবে বা নিজে ফিরে আসবে—এটি প্রতিষ্ঠিত হয়নি।

### ৩.৫ Installed runtime compatibility changes

Stock 3.8.51-এ native transport পরীক্ষা করে সমস্যাগুলো পাওয়া গিয়েছিল। Installed HOME runtime-এর পাঁচটি ফাইল original backup ও hash check রেখে patch করা হয়েছে। T7 source clone-এর upstream file edit করা হয়নি।

Runtime root:

`~/.omniroute-runtime/lib/node_modules/omniroute`

| Relative file | পরিবর্তন |
|---|---|
| src/mitm/server.cjs | port, host owner, header/query, status/JSON/SSE/error, compression decode, loopback binding |
| dist/src/mitm/server.cjs | একই server পরিবর্তন |
| dist/.build/next/server/chunks/src_mitm_1b2p0rw._.js | selected-only mode-এ legacy default DNS provisioning বাদ |
| dist/.build/next/server/chunks/src_1ay1a1_._.js | একই selected-only guard |
| dist/.build/next/server/chunks/src_mitm_1_pln2b._.js | একই selected-only guard |

Server-এর পরিবর্তনের উদ্দেশ্য:

1. NEXALANCE_AGENT_BRIDGE_PORT → MITM_LOCAL_PORT → 443 port resolution; বর্তমান backend 8443।
2. Kiro ও Claude একই Anthropic host ব্যবহার করলে configured claude-code owner গ্রহণ।
3. Native headers/query retain; native Authorization/x-api-key/cookie router-এ পাঠানোর বদলে router-এর credential ব্যবহার।
4. Router status, content-type, request-id, retry-after এবং error body forward; সব response-কে 200/SSE না করা।
5. JSON/SSE সঠিকভাবে relay; hop-by-hop, encoding/length এবং Set-Cookie filter।
6. Claude Messages body-এর gzip/deflate/Brotli/zstd decode, সর্বোচ্চ decoded 64m; mapped request-এর decoded JSON থেকে Content-Encoding সরানো।
7. Unmapped/non-chat passthrough-এ original raw body রাখা।
8. Listener 127.0.0.1-এ bind।

Source model, thinking এবং output_config.effort transport stage-এ ইচ্ছাকৃত downgrade করা হয়নি। তবে router-এর OAuth executor পরবর্তী body/header transforms করে; section ৮ পড়ুন।

Installer:

`~/Documents/Codex/2026-10-02/omniroute-agent-bridge-config-074223/install-bridge-compat.py`

এটি version 3.8.51 ও পাঁচটি exact SHA-256 যাচাই করে। Unknown version/hash হলে refuse করে। Original backup, reviewed staged copy ও node --check আছে। আগের idempotence test-এ changedFiles=0, reviewedFiles=5। Installer-টি আপডেট pipeline-এর মধ্যে wired নয়; নতুন version-এর universal fix নয়।

### ৩.৬ Provider egress DNS loop এড়ানো

Local hosts api.anthropic.com-কে loopback দেয়। OmniRoute provider-এর নিজের upstream connection একই hosts ব্যবহার করলে request Bridge-এ ফিরে আসে। তাই শুধু service process-এর Node DNS lookup-এ preload আছে:

`~/.omniroute-local/bridge-upstream-dns.cjs`

এটি api.anthropic.com-এর জন্য public resolver 8.8.8.8 / 1.1.1.1 ব্যবহার করে; অন্য hostname-এর original lookup থাকে। Native app/CLI এই preload নেয় না। Public Anthropic IP-এ issuer WE1-এর verified TLS connection পাওয়া গেছে।

### ৩.৭ Dashboard configuration ও state

Dashboard Agent Bridge-এ Claude Code DNS selection এবং ১৩টি mapping সংরক্ষিত হয়েছে। SQLite agent_bridge_mappings এবং mitmAlias/claude-code namespace-এ model aliases আছে। কোনো wildcard বা reasoningEffort override নেই।

Wizard/automatic trust stock state flags সম্পূর্ণ না লেখায় OS certificate trust ও actual inference সফল হওয়ার পরে শুধু Claude row-এর cert_trusted/setup_completed flags synchronize করা হয়েছে। বর্তমান row: dns_enabled=1, cert_trusted=1, setup_completed=1, last_error=null। এটি OS trust পরিবর্তনের live detector নয়।

### ৩.৮ Start/Stop এবং native পরীক্ষা

Dashboard Stop দিয়ে 8443 listener বন্ধ ও Anthropic hosts entry সরেছিল। Hosts file baseline backup-এর সঙ্গে exact match ছিল। এরপর original/default connection-এ CLI reply সফল হয়েছিল। আবার Start দিয়ে listener/hosts ফিরেছে এবং original native Code session-এর নতুন reply সফল হয়েছে।

পুরোনো native account-এর quota error থেকে Try again ও নতুন test prompt দুইটিই reply পেয়েছে। App weekly quota display original account-এর 100% রেখেছে; connected provider quota সেখানে প্রতিস্থাপিত হয়নি।

### ৩.৯ পুনরায় review ও official backup

পরে live Sonnet high, Opus high এবং original native Hello session আবার সফল হয়েছে। Transport test ৮/৮, TLS ingress/backend/upstream, SQLite integrity, runtime hash ৫/৫ এবং চারটি Local website যাচাই হয়েছে।

Storage dashboard Backup Now দিয়ে official snapshot তৈরি হয়েছে:

`~/.omniroute-local/db_backups/db_2026-10-02T02-31-28-165Z_manual.sqlite`

মাপ 10,661,888 bytes। File mode 600, parent directory 700। Immutable read-only connection-এ quick_check ও full integrity_check=ok; ১৩টি mapping ও একটি active Claude connection আছে। Restore test হয়নি। এটি database-only snapshot; .env/encryption key, CA files, nginx config ও plist-এর পূর্ণ backup নয়।

## ৪. চলমান request path

```text
Native local Claude Code request
  -> api.anthropic.com hosts -> 127.0.0.1 / ::1
  -> Local nginx HTTPS :443
  -> Agent Bridge HTTPS 127.0.0.1:8443
  -> OmniRoute 127.0.0.1:28128
  -> connected Claude OAuth provider via public DNS + verified TLS
```

Non-chat বা unmapped model request Bridge-এর passthrough path নিতে পারে, অর্থাৎ original credential দিয়ে real Anthropic-এ যেতে পারে। তাই ভবিষ্যতের নতুন model picker-এ দেখা গেলেই connected provider দিয়ে যাবে ধরে নেওয়া যাবে না। নতুন canonical model ID-এর Bridge mapping, provider entitlement ও actual routing পরীক্ষা প্রয়োজন।

## ৫. স্থায়ী file ও environment inventory

| Path | দায়িত্ব |
|---|---|
| ~/.omniroute-local/storage.sqlite | provider connections, mappings, settings |
| ~/.omniroute-local/.env | secrets/encryption, service configuration; value প্রকাশ নয় |
| ~/.omniroute-local/mitm/ | CA, leaf cert/key, targets/bypass/stats files |
| ~/.omniroute-local/bridge-upstream-dns.cjs | service-only public Anthropic DNS preload |
| ~/Library/LaunchAgents/com.nexalance.omniroute.plist | service launcher ও Bridge environment |
| Local/run/router/nginx/conf/route.api-anthropic-bridge.conf | 443→8443 TLS adapter |
| ~/.omniroute-runtime/lib/node_modules/omniroute | installed code; update-এ প্রতিস্থাপিত হয় |
| ~/Developer/OmniRoute/nexa/ | durable source build overlay; বর্তমান Bridge fixes এখানে নেই |
| ~/.omniroute-runtime/updater/ | staged update command/scripts |
| ~/.omniroute-builds/current | deployed package tarball pointer |
| ~/Library/Logs/OmniRoute/ | service/update logs |
| ~/Library/Logs/Claude/main.log | native updater/activity log; private data থাকতে পারে |

Live service plist-এর non-secret Bridge values:

```text
NEXALANCE_AGENT_BRIDGE_PORT=8443
NEXALANCE_AGENT_BRIDGE_AGENT=claude-code
NEXALANCE_AGENT_BRIDGE_SELECTED_ONLY=true
MITM_LOCAL_HOST=127.0.0.1
MITM_DISABLE_TLS_VERIFY=0
NODE_OPTIONS=--require=~/.omniroute-local/bridge-upstream-dns.cjs
```

INSPECTOR_INTERNAL_INGEST_TOKEN-ও service environment-এ আছে; value এই নথিতে নেই। Parent/Bridge ingestion token একই হওয়া capture entries-এর জন্য প্রয়োজন। Live plist এখন 600; আগের সাধারণ handoff-এর 644 তথ্য বর্তমান নয়। LaunchAgent rewrite/update-এর পরে permission পুনরায় পরীক্ষা করতে হবে।

Native CLI settings-এ বর্তমানে শুধু GateGuard-related env keys আছে; gateway provider helper নেই। Native Desktop standard account/data path ব্যবহার করে।

## ৬. Canonical model mappings

| Source | Target |
|---|---|
| `claude-fable-5` | `cc/claude-fable-5` |
| `claude-fable-5-1` | `cc/claude-fable-5-1` |
| `claude-haiku-4-5-20251001` | `cc/claude-haiku-4-5-20251001` |
| `claude-opus-4-5-20251101` | `cc/claude-opus-4-5-20251101` |
| `claude-opus-4-6` | `cc/claude-opus-4-6` |
| `claude-opus-4-7` | `cc/claude-opus-4-7` |
| `claude-opus-4-8` | `cc/claude-opus-4-8` |
| `claude-opus-5` | `cc/claude-opus-5` |
| `claude-opus-5-5` | `cc/claude-opus-5-5` |
| `claude-sonnet-4-5-20250929` | `cc/claude-sonnet-4-5-20250929` |
| `claude-sonnet-4-6` | `cc/claude-sonnet-4-6` |
| `claude-sonnet-5` | `cc/claude-sonnet-5` |
| `claude-sonnet-5-5` | `cc/claude-sonnet-5-5` |

এগুলো mapping inventory, সব model/effort combination এই Bridge path-এ নতুন করে test করা হয়েছে এমন দাবি নয়। Effort support model-ভেদে আলাদা। Supported xhigh/max সব legacy model-এ সমান নয়। UI effort control বজায় থাকলেও unsupported option সফল হবে ধরে নেওয়া যাবে না।

## ৭. Update-এর পরে কী থাকবে, কী নিশ্চিত নয়

| অংশ | বর্তমান update design-এর ফল |
|---|---|
| database/provider login/mappings | DATA_DIR package prefix-এর বাইরে; updater এটি reset করার command চালায় না; future DB migration এখনও backup/verification চায় |
| .env ও encryption key | ensure_env existing file রাখে; DB আছে কিন্তু .env নেই হলে নতুন secret তৈরি না করে থামে |
| অতিরিক্ত plist env | keep_extra_env rewrite-এর সময় non-owned keys ধরে রাখে |
| CA trust ও CA files | npm package replacement-এর বাইরে; updater এগুলো সরায় না |
| native Claude account/history | OmniRoute updater এই application/data directory বদলায় না |
| Bridge patched runtime code | new npm/tarball installation-এ হারাতে পারে; nexa overlay-তে নেই |
| Local nginx vhost | OmniRoute updater সরায় না, কিন্তু Local-এর নিজস্ব regeneration-এর স্থায়িত্ব নিশ্চিত নয় |
| actual Bridge Start/recovery | main service health HTTP 200 দিয়ে নিশ্চিত হয় না; cold restart test বাকি |
| সব নতুন model/feature | auto app update যথেষ্ট নয়; catalog/mapping/protocol/entitlement পরীক্ষা প্রয়োজন |

Updater stable release fetch → overlay apply/check → build/package → service install → health check → previous package rollback করে। এটি continuous unattended update scheduler নয়; dashboard button/omni-ctl update দিয়ে on-demand শুরু হয়। Overlay patch না বসলে service deploy-এর আগে থামে। কিন্তু যে Bridge fixes overlay-তে নিবন্ধিতই নেই, patch-health gate সেগুলো রক্ষা করতে পারে না।

নতুন করে deployed archive বনাম live server তুলনা হয়েছে:

- Archive src/mitm/server.cjs SHA-256: a766d7e277eaeb5d96a340ae058361f40dc00fbf43540d6f2b79968cb83d6411
- Live SHA-256: 6b044ef7af1be6f515e98d13459fb103f8a23a69e2c871ced6c51e58553b2c8f
- Archive-এ NEXALANCE_AGENT_BRIDGE_PORT support নেই; live file-এ আছে।

একই ফল dist/src/mitm/server.cjs-এ। তাই current tgz reinstall/rollback-ও post-install Bridge changes ফিরিয়ে দেয় না। শুধু updater আছে বা rollback আছে বলে বর্তমান Bridge configuration fully protected বলা যাবে না। এই যাচাইয়ে archive extract/install করা হয়নি; read-only tar member comparison হয়েছে।

## ৮. Native features, effort ও quality

Native UI/model/effort controls, account history এবং tested Code workflow কাজ করছে। CLI doctor update enabled/latest বলেছে; Desktop updater checks log-এ আছে; signed Claude application patch হয়নি। Vendor release পাওয়া বন্ধ করার পরিবর্তন করা হয়নি।

তবে নতুন native binary-তে endpoints, compression, streaming events বা beta headers বদলালে Bridge compatibility ভাঙতে পারে। নতুন model ID mapping না থাকলে passthrough হতে পারে। Latest application পাওয়া থেকে connected provider-এর entitlement বা সব server-side feature পাওয়া স্বয়ংক্রিয় নয়।

OAuth executor identity/billing system blocks, metadata, tool names/schemas, cache markers, beta headers এবং কিছু system/message text পুনর্গঠন করে। Default system pipeline paragraph drop, replace_text ও obfuscate_words করতে পারে। তাই “শুধু provider credential বদলায়, body-র বাকি সব bytes একই” দাবি সঠিক নয়। Prompt compression বন্ধ রাখলেও এই executor transforms আলাদা বিষয়।

Quality পরীক্ষার সঠিক লক্ষ্য হলো task performance ও capability preservation। Finite successful test দিয়ে ভবিষ্যতের প্রতিটি task-এ কখনও quality drop হবে না প্রমাণ করা যায় না। আগের Gateway tests-এ language/output-format ও legacy-model restriction ব্যতিক্রম ছিল; সেই রিপোর্টগুলোও সংরক্ষিত আছে।

## ৯. Routines ও scheduled task boundary

একটি existing hourly Routine Active দেখা গেছে; prompt/status/schedule edit বা Run now করা হয়নি। তার পরবর্তী scheduled execution সফল হয়েছে এমন evidence নেই।

Cloud Routine Anthropic-managed বা configured self-hosted environment-এ চলে; Mac-এর local hosts entry সাধারণ Anthropic cloud worker-এর calls intercept করতে পারে না। Original account quota/entitlement সেখানে প্রাসঙ্গিক থাকে।

Claude Code Desktop local scheduled task machine-এ চলে; app open ও computer awake প্রয়োজন। ওই task-এর inference current API/Bridge path নেয় কি না, এবং tools/permissions সফল কি না, একটি harmless local scheduled fixture দিয়ে আলাদা end-to-end test প্রয়োজন। Claude/Cowork-এর অন্য scheduled service-এর execution model এক নিয়মে ধরে নেওয়া যাবে না।

## ১০. নতুন version-এর post-update checklist

1. Database, .env/encryption key, plist, CA/leaf files, nginx config এবং current patched runtime-এর private backup রাখুন। Database-only snapshot যথেষ্ট নয়।
2. Durable nexa overlay-তে Bridge fixes অন্তর্ভুক্ত ও package/rollback tests না হওয়া পর্যন্ত update-কে Bridge-safe ধরে নেবেন না।
3. Update-এর পরে service health, actual 8443 listener, Claude hosts entries, certificate trust ও ingress/backend TLS পরীক্ষা করুন।
4. Canonical model mapping, native model/effort selection এবং নতুন model IDs তুলনা করুন।
5. Original account-এর পুরোনো local Code session-এ fresh inference চালান। Small tool fixture-তে Read/Edit/Bash এবং stream/error handling পরীক্ষা করুন।
6. Dashboard Stop-এর পরে Anthropic hosts entries ও 8443 listener সরে কি না, default connection কাজ করে কি না দেখুন; পরে Start দিয়ে routing ফিরিয়ে যাচাই করুন। Original account quota শেষ থাকলে default request quota error দিতে পারে।
7. Local router regeneration, cold service restart এবং sudo cache expiry আলাদাভাবে পরীক্ষা করুন। শুধু Running/DNS on badge যথেষ্ট নয়।
8. শেষে exact version/hash এবং observed ফল লিখুন। Main /healthz=200 বা native model picker দেখা একা feature parity প্রমাণ করে না।

Read-only diagnostics:

```bash
claude doctor
claude auth status
curl --silent --output /dev/null --write-out '%{http_code}' http://127.0.0.1:28128/healthz
lsof -nP -iTCP:8443 -sTCP:LISTEN
rg 'api\.anthropic\.com' /etc/hosts
security verify-cert -c ~/.omniroute-local/mitm/ca.crt -p ssl
```

auth status/log output share করার আগে account identifiers ও secrets বাদ দিন।

## ১১. সমস্যায় পড়লে

- Old session-এ 401/loading, fresh session ঠিক: নতুন request/process দিয়ে পরীক্ষা; VS Code সম্পূর্ণ restart আগে ব্যবহারকারীর ক্ষেত্রে সমস্যাটি ঠিক করেছে। History delete বা account logout প্রথম পদক্ষেপ নয়।
- SELF_SIGNED_CERT_IN_CHAIN: actual CA trust, কোন runtime request পাঠাচ্ছে এবং 443/8443 leaf/CA chain পরীক্ষা করুন। Current successful CLI-তে NODE_EXTRA_CA_CERTS override দেওয়া নেই; অন্য পুরোনো runtime-এ প্রয়োজন হতে পারে। TLS verification বন্ধ করবেন না।
- Running কিন্তু reply নেই: actual hosts, Local nginx, Bridge listener, routing log ও fresh request মিলিয়ে দেখুন।
- New model-এ quota/error: mapping না থাকলে original-credential passthrough হচ্ছে কি না যাচাই করুন; wildcard দিয়ে ছোট model-এ নামাবেন না।
- Stop-এর পরে default quota error: original account-এর quota restriction থাকতে পারে; routing বন্ধ মানে quota reset নয়।
- Certificate regenerate/renew: nginx leaf, proxy trusted CA এবং Bridge CA একসঙ্গে synchronize করতে হবে। Dashboard Regenerate Cert সব adapter file ঠিক করে দেয় ধরে নেবেন না।
- rollback: পুরোনো tgz alone বর্তমান runtime patch ফিরিয়ে দেয় না। Backup/hash-aware restore ও actual routing test প্রয়োজন; অচেনা version-এ পুরোনো installer জোর করে চালাবেন না।

## ১২. এখন বাকি কাজ

| অগ্রাধিকার | কাজ |
|---|---|
| প্রথম | Bridge fixes source-level nexa overlay-তে স্থায়ী করা; actual packaged artifact ও rollback verification যোগ |
| প্রথম | Local router adapter persistence, certificate renewal ও cold restart recovery স্থায়ী/পরীক্ষিত করা |
| পরের | real Bridge counters, OS certificate-state fallback ও Traffic Inspector live WebSocket ঠিক করা |
| পরের | বাকি দুই Claude account user OAuth login ও তিন-account failover পরীক্ষা |
| পরের | full model/effort matrix-এর Bridge tests, representative tools/MCP/long-context ও local scheduled fixture |

এই handoff তৈরির request-এর সময় তথ্য যাচাই ও নথি তৈরি হয়েছে; উপরের বাকি implementationগুলো করে ফেলা হয়েছে এমন দাবি নেই।

## ১৩. Evidence ও আগের নথি

Configuration evidence root, private backups-সহ:

`~/Documents/Codex/2026-10-02/omniroute-agent-bridge-config-074223`

গুরুত্বপূর্ণ files: AGENT-BRIDGE-CONFIGURATION-BANGLA.md, FINAL-VERIFICATION.json, compat-manifest.json, install-bridge-compat.py, bridge-transport-results.json, nginx-bridge-transport-results.json, dns-provision-tests.json, live-on-fixed-sonnet.json, live-opus-tool-events.jsonl, live-existing-session-on.json, live-stop-state.json, live-default-after-stop.json, live-restart-state.json। `backup/` private; পুরো directory share করবেন না।

পুনরায় review evidence:

`~/Documents/Codex/2026-10-02/omniroute-configuration-review-082544`

গুরুত্বপূর্ণ files: OMNIROUTE-CONFIGURATION-REVIEW-BANGLA.md, configuration-audit.json, runtime-integrity.json, quality-policy-review.json, update-durability-review.json, live-cli-sonnet-review.json, live-cli-opus-review.json, tls-route-review.json, backup-review.json, final-review-state.json, native-review-success.png।

এই handoff-এর নতুন read-only evidence:

`~/Documents/Codex/2026-10-02/agent-bridge-handoff-evidence-084125`

গুরুত্বপূর্ণ files: live-state.json, claude-doctor-update-check.json, native-updater-log.json, runtime-integrity.json, packaged-bridge-vs-live.json।

T7-এর আগের নথি:

- HANDOFF-OMNIROUTE-2026-10-02.md: base install/fork/updater history; section ৯ current Bridge validation-এর পূর্ণ বিবরণ নয়।
- OMNIROUTE-CLAUDE-SETUP-TEST-BANGLA-2026-10-02.md: earlier Gateway model/effort/tool tests; current Bridge proof হিসেবে সব ফল ব্যবহার করা যাবে না।
- OMNIROUTE-EXISTING-CLAUDE-ACCOUNT-BRIDGE-BANGLA-2026-10-02.md: original account ফেরার intermediate report; সেখানে Bridge Stopped ছিল, পরে setup হয়েছে।
- OMNIROUTE-CLAUDE-NATIVE-PARITY-BANGLA-2026-10-02.md: feature/quality সীমার source-based আলোচনা।

আগের সাধারণ handoff-এর “কোনো provider নেই”, “Bridge keep/remove open”, “Node CA trust হয়নি” এবং “plist 644” সব বর্তমান state-এর সিদ্ধান্ত নয়। নতুন inventory-তে একটি active Claude provider, existing native/CLI success ও plist 600 আছে। পুরোনো সমস্যার observation মুছে ফেলা হয়নি; সময় অনুযায়ী আলাদা করা হয়েছে।

## ১৪. Official references

যাচাইয়ের তারিখ: ২ অক্টোবর ২০২৬।

- [Claude Code update ও release channel](https://code.claude.com/docs/en/setup)
- [Native Desktop update ও Code UI](https://code.claude.com/docs/en/desktop)
- [Gateway protocol এবং feature pass-through](https://code.claude.com/docs/en/llm-gateway-protocol)
- [Model/effort configuration](https://code.claude.com/docs/en/model-config)
- [Cloud routines](https://code.claude.com/docs/en/routines)
- [Local Desktop scheduled tasks](https://code.claude.com/docs/en/desktop-scheduled-tasks)


<!-- handoff-consolidation-2026-10-03 -->

## Latest consolidated handoff: 2026-10-03

Puro setup, Agent Bridge connection/lifecycle fixes, Local coexistence/DNS, durable nexa overlay, quota recovery, coding/context configuration, build RAM/disk control, tests, update/rollback ebong remaining gaps ekshathe: [HANDOFF-OMNIROUTE-2026-10-03-CONSOLIDATED.md](HANDOFF-OMNIROUTE-2026-10-03-CONSOLIDATED.md).

Latest recorded deployment/source/runtime f77079418, OmniRoute 3.8.51; final native CLI Opus/Sonnet ebong Desktop Code response successful. Tar pore coding settings-er 14 checks, native Read/follow-up, large-context observation ebong TLS/DNS gate successful. Ei file-er earlier builds, pending promotion ba cached-quota OFF descriptions historical; latest policy cached exhausted-account skip ON, preflight OFF. Future reset live recovery, remaining Thread mismatch telemetry, full 24-hour soak/new reboot ebong every native feature ekhono separate scope.

Documentation consolidation-e earlier content preserve kora hoyeche; new build ba live service mutation hoyni. User-er 2026-10-03 rule onujayi other people's public repositories-e PR/issue action designated owner session-er; help findings/patch oss-contrib/inbox-e hand over korte hobe. Purono direct-PR workflow latest authorization noy.
