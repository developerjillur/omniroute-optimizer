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
  Native API-এর জন্য loopback-only CONNECT tunnel TLS bytes অপরিবর্তিত রাখে;
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

২০২৬-১১-১১: source candidate প্রস্তুত; focused baseline reproduction, candidate
tests, compatibility/type checks এবং live acceptance এখনও বাকি। বর্তমান local
resource window-তে warning pressure ও প্রায় ৮–১০ GiB physical headroom পাওয়া
গেছে; render/app বন্ধ করা হয়নি। অনুমোদিত guard-এর threshold কমানো হয়নি।
Source CI, নতুন full build, helper installation বা live rollout-কে এই নথি PASS
বলে না। আগের live v3.8.53 build আলাদা receipt অনুযায়ী বহাল আছে।
