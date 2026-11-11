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

**অবস্থা: SOURCE_VALIDATED_WAIT_RESOURCE।** Reviewed 8 GiB build profile-এর admission
memory-pressure warning-এ ব্যর্থ; physical headroom প্রায় 8.43 GiB, প্রয়োজন অন্তত
18 GiB ও 30-second quiet window। Internal usage মালিকের 400 GB সীমার ওপরে;
NexaWork-এ build/backup space-ও সীমিত। Guard bypass, threshold কমানো, app বন্ধ বা
ফাইল মুছে জায়গা তৈরি করা হয়নি।

নতুন Terminal helper install, full package build, isolated installed-security/smoke,
actual native OAuth ও On/Off routing acceptance এবং live promotion করা হয়নি।
বর্তমান live v3.8.53 বহাল আছে; এই CLI সংশোধন live-এ পৌঁছায়নি। Build ও promotion-এর
আগে নতুন resource admission এবং চলমান request-এর নিরাপদ drain দরকার।
