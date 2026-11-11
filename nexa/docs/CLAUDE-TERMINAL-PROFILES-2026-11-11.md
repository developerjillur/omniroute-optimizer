# Claude Terminal routing ও Fable 5.2

লেখক: Jillur Rahman

## সমস্যা ও নির্ধারিত আচরণ

`/dashboard/cli-code`-এর Claude profile switch আগে শুধু model discovery-এর পরে
profile তৈরি করার flag বদলাত। Off করলে shared `~/.claude/settings.json`-এ থাকা
gateway URL/key বা Agent Bridge-এর DNS interception বন্ধ হতো না। তাই Terminal-ও
OmniRoute-এ থেকে যেত। এছাড়া CLI defaults-এর Fable row বাদ পড়ায় Fable 5.2 আলাদা
slot হিসেবে দেখা যাচ্ছিল না।

মালিকের নির্দিষ্ট সিদ্ধান্ত: Off হলে শুধু নতুন Terminal `claude` session সরাসরি
Claude subscription ব্যবহার করবে; native app-এর Agent Bridge অপরিবর্তিত থাকবে।

## সংশোধন

- Fable selector ফিরেছে; নতুন Terminal profile-এর default Fable ID
  `claude-fable-5-2`। মূল default model Sonnet-ই থাকে। Explicit Fable edit ছাড়া
  সংরক্ষিত Terminal Fable choice বদলায় না।
- Dashboard Apply/Reset/backup restore শুধু
  `~/.claude/omniroute-terminal/settings.json` নিয়ে কাজ করে। পুরোনো shared-file
  backups আলাদা namespace-এ অক্ষত থাকে। Native app-এর shared settings-এ কোনো
  write হয় না।
- Managed zsh function official `~/.local/bin/claude` binary-কে একটি per-launch
  `--settings` file দেয়। একই login/keychain, config root, project, hooks,
  permissions ও history থাকে; global hooks নকল করা হয় না। Secret value command
  arguments-এ লেখা হয় না। Launch file mode `0600`, directory `0700`।
- On/Off-এর existing DB flag নতুন Terminal launch-এ read-only পড়া হয়। Store পড়া
  না গেলে অন্য provider-এ চুপচাপ যাওয়া হয় না। চলমান session বদলায় না।
- Off-এ শুধু ওই child-এর gateway credentials/provider overrides unset হয়।
  Native API-এর জন্য প্রতি launch-এর নিজস্ব password-সহ loopback-only CONNECT
  tunnel TLS bytes অপরিবর্তিত রাখে;
  configured DNS resolver-এর public answer ব্যবহার করে স্থানীয় hosts interception
  এড়ায়। HTTPS certificate verification বন্ধ বা TLS terminate করা হয় না। আগের
  upstream proxy/NO_PROXY policy tunnel-এর বাইরে হারিয়ে যায় না।
- Official binary, symlink, updater, login, hosts, certificates, root ingress,
  native app ও Bridge configuration বদলানো হয় না।

## প্রয়োগ ও সীমা

Source changes Nexa overlay-তে থাকে। Full package build, isolated smoke ও live
promotion আলাদা gate। Frontend-এর compiled chunks সরাসরি edit করা যাবে না।

Launcher installer প্রথমে preview দেখায়। Apply-এর জন্য mounted work volume-এ
নতুন backup directory দিতে হয়; `.zshrc`-এর managed block ছাড়া সব bytes থাকে।
আগের অজানা `claude` alias/function বা helper modification থাকলে installer থামে।
Apply-এর পরে নতুন Terminal খুলতে হবে; পুরোনো shell/function বা চলমান session
স্বয়ংক্রিয়ভাবে বদলায় না। Per-launch tunnel foreground Terminal child-এর জীবনকাল
পর্যন্ত চলে। Detached supervisor/background-session lifecycle এই পরিবর্তনের
acceptance-এর অন্তর্ভুক্ত নয়; এর জন্য shared native-app settings বদলানো হয়নি।

Official contracts:

- [Session settings precedence](https://code.claude.com/docs/en/cli-reference)
- [Empty environment values and provider selection](https://code.claude.com/docs/en/settings-reference)
- [HTTPS proxy support and background supervisor scope](https://code.claude.com/docs/en/network-config)

## যাচাইয়ের অবস্থা

২০২৬-১১-১১: code commit `2d54a06759784b912c1bf3d9c657b59ea1f25cda`-এর
source validation সম্পূর্ণ।

- [পূর্ণ source CI](https://github.com/developerjillur/omniroute-optimizer/actions/runs/43002575950):
  ২৮টি required gate সফল; patch applicability, pristine base, inventory, core types,
  পূর্ণ lint ও required docs-all পাস।
- [Focused CLI CI](https://github.com/developerjillur/omniroute-optimizer/actions/runs/43002575829):
  Node 24.15.0 ও 26.7.0-এ আলাদাভাবে 12/12 Terminal helper test;
  settings 23/23, focused native 67/67। Baseline-এ 6টি assertion failure দিয়ে
  সমস্যা reproduce হয়েছে; environment failure বা resource stop-কে RED বলা হয়নি।
- Compatibility 1366/1366, stream 396/396 এবং production Node native/transport
  281/281 পাস। নতুন test skip করা হয়নি। Deployment helper suite-এর পূর্বনির্ধারিত
  macOS-only wildcard listener case Linux CI-তে execute হয়নি।
- পূর্ণ compiler শেষ হয়েছে: inherited diagnostic 7313, অনুমোদিত ceiling 7314;
  pristine-এর তুলনায় নতুন diagnostic identity 0। এটি zero-type-error দাবি নয়।
- Isolated source fixture-এর production dependency audit-এ vulnerability 0।
  নতুন Mac-installed package-এর security/acceptance test এখনও বাকি।

Shared `~/.claude/settings.json` byte-identical; official CLI-এর target ও metadata
একই আছে। কোনো app/session বন্ধ, core configuration/data write বা generation
call করা হয়নি। শেষ bounded read-only check-এ core এবং trusted `https://omni.local`
health 200; এর আগে একটি 5-second health probe timeout হয়েছিল। Service restart
করা হয়নি এবং timeout-এর কারণ প্রমাণিত বলা হচ্ছে না।

## Live release — ২০২৬-১১-১১

**অবস্থা: LIVE_UPDATED_AND_ACCEPTED।** Full build ও live promotion সম্পূর্ণ।

- Compiled source: `929061f367cbd1db1e1579e74bf4c7a1f46807fb`;
  application integration/build: `1a615fd60e0a6ba207bf1debc7b0ebd749de5de6` / `1a615fd6`।
  Validated runtime input অপরিবর্তিত; normal hooks-এর formatting-only fixture change
  AST-identical ছিল।
- Version `3.8.53`; sealed archive 155,816,049 bytes,
  SHA256 `5ceb77cf4b799edb6ce9f8197c87a229d7b177756c2093f5a83679b64036f5c1`।
- প্রথম 6 GiB heap run-এ inner RSS watchdog 8198 MiB-এ থামিয়েছে। সেই run ও receipt
  রাখা আছে। পরে 5888 MiB heap ও একই 8192 MiB RSS cap-এ full build পাস করেছে;
  measured family peak 7931.72 MiB, minimum physical headroom 15.83 GiB।
  মালিক শুধু এই run-এর initial admission 15 GiB অনুমোদন করেছেন; original resource
  guard file ও runtime stop thresholds বদলায়নি। Successful run-এর 30-second
  minimum initial headroom প্রকৃতপক্ষে 19.30 GiB ছিল।
- Isolated install: publication lock-এর 1036 dependency match; Fable 5.2 inference,
  management authentication, catalog, native usage schema ও fail-closed CORS পাস।
  Installed root ও dist audit-এ vulnerability 0।
- Clone database integrity `ok`; accounts, keys, permissions, mappings, environment,
  settings ও historical row counts preservation পাস। Byte/mode-verified rollback
  runtime এবং consistent private database snapshot retained আছে।
- Live trusted HTTPS IPv4/IPv6 ও core health 200; Bridge backend/ingress TLS ও DNS
  readiness পাস। Live Fable 5.2 SSE request 200, real `end_turn`, `message_stop`,
  requested marker ও native usage পাওয়া গেছে; manual retry 0। Live installed root
  ও dist audit-এও vulnerability 0।
- Managed Terminal launcher install ও fresh zsh login-shell detection পাস;
  official CLI `2.1.322`, binary metadata ও shared settings অপরিবর্তিত।
  প্রথম native check-এ CLI login ছিল না। মালিকের স্বাভাবিক login-এর পরে official
  CLI-তে `claude.ai` / first-party authentication এবং Fable 5.2-এর fresh foreground
  request native Off ও gateway On—দুই mode-এই পাস। Control flag stores isolated
  ছিল; live flag ও model mappings বদলায়নি। কোনো existing chat চালানো হয়নি।
- Live UI-তে `Claude Terminal routing` Off এবং Claude Fable field-এ
  `claude-fable-5-2` দেখা গেছে। Shared native-app settings path অপরিবর্তিত;
  form শুধু Terminal profile-এর path দেখায়।

NexaWork-এর সীমিত জায়গায় final stopped database-এর checksum-verified gzip snapshot
নেওয়া হয়েছে। প্রায় 4.63 GiB database 1,419,576,436 bytes-এ সংরক্ষিত; সব source
bytes-এর SHA256 verified। Cache relocation, existing file deletion বা T7 write
করতে হয়নি। `compressed-database.py` ও `snapshot-quiescent-compressed.py` deployment
helpers Nexa-তে রাখা হয়েছে। Caller-কে আগে সব database handle বন্ধ এবং journal
checkpointed প্রমাণ করতে হবে। Restore destination-এর existing path/inode রাখে;
পুরো compressed stream verify হওয়ার আগে destination write হয় না। Corrupt
checksum, truncated stream, dirty journal ও existing archive overwrite refusal-সহ
পাঁচটি SQLite regression test আছে। চলমান database-এর restore সমর্থিত নয়।
পরের local build-এ এই measured profile পুনর্ব্যবহার করতে explicit
`NEXA_BUILD_HEAP_MB=5888` দিন। Shared deployment helper-এর default heap, initial
resource admission ও RSS/runtime stop limits বদলানো হয়নি। Compressed snapshot
helpers build/backup tooling; installed runtime payload বদলায় না।

Private receipts-এর directory:
`/Volumes/NexaWork/Work/omniroute-cli-profile-controls-2026-11-11/release-build-v1/evidence`।
Canonical acceptance: `live-promotion-v3.json`, `post-live-acceptance-v1.json`,
`terminal-cli-acceptance-v2.json` ও `terminal-shell-acceptance-v1.json`। আগের failed
run/receipt overwritten হয়নি; receipt-name collision-এ interrupted test harness
সংশোধন করে নতুন version রাখা হয়েছে।

এটি tested foreground routing ও release acceptance-এর ফল। সব future provider
response, quota availability বা GPT/Claude output-quality parity-এর নিশ্চয়তা নয়।
নতুন package বসানোর পরে OS restart এবং detached supervisor lifecycle চালানো হয়নি।
