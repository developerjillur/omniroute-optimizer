# VS Code-এর Fable 5.2 ও routing — ২০২৬-১১-১২

লেখক: Jillur Rahman

## সরাসরি দেখা ফল

Installed official VS Code extension `2.1.322`-এর model picker-এ এই row দেখা গেছে:

`Fable 5.2 · Custom Fable model (claude-fable-5-2)`

একই picker-এ আলাদা `Fable · Fable 5.1` row-ও আছে। Fable 5.2 বেছে নিতে explicit
`claude-fable-5-2` row ব্যবহার করতে হবে। উপস্থিত conversation-এর Sonnet 5.5
selection বদলানো হয়নি; window reload, conversation restart বা message পাঠানো হয়নি।

Shared settings-এর `ANTHROPIC_DEFAULT_FABLE_MODEL` আগে থেকেই
`claude-fable-5-2` ছিল। তাই এই যাচাইয়ে pin দ্বিতীয়বার edit করা হয়নি। Installed
extension বা binary পরিবর্তন/upgrade প্রয়োজন প্রমাণিত হয়নি।

## তিনটি surface-এর বর্তমান সীমা

| Surface | বর্তমান routing |
| --- | --- |
| Claude native app | Existing OmniRoute/Agent Bridge; shared settings অপরিবর্তিত |
| নতুন managed Terminal `claude` launch | `OMNIROUTE_AUTO_SYNC_CLAUDE_PROFILES=false`: নিজের Claude subscription; On করলে OmniRoute profile |
| নতুন VS Code extension process | Terminal-এর একই switch: Off-এ নিজের Claude subscription, On-এ OmniRoute profile |

Terminal-এর flag read-only query-তে `false` পাওয়া গেছে। Installed পাঁচটি helper
তার installation manifest-এর SHA256-এর সঙ্গে মিলেছে। Subscription mode-এর
per-launch settings, public upstream TLS tunnel, shared login ও On-mode gateway
behavior আগের [Terminal note](CLAUDE-TERMINAL-PROFILES-2026-11-11.md)-এ আছে।

প্রথম UI যাচাইয়ের সময়ে `claudeCode.claudeProcessWrapper` configured ছিল না। পরে
মালিক স্পষ্টভাবে VS Code panel-কেও Terminal-এর একই switch-এর সঙ্গে যুক্ত করতে
বলেছেন: Off-এ subscription, On-এ OmniRoute। Native app-এর Bridge এবং Terminal-এর
existing Off default বহাল থাকবে।

## VS Code switch integration

- `claude-vscode-launcher.mjs` extension-এর supplied official bundled CLI prefix
  আলাদা করে existing Terminal launcher-এ দেয়। Official binary edit করা হয় না;
  extension update-এ version/path বদলালেও supported native-binary layout গ্রহণ
  করে। অজানা executable, publisher এবং extension directory-র বাইরের symlink
  প্রত্যাখ্যাত হয়।
- নতুন process একই read-only DB flag, private per-launch settings এবং Off-mode
  public-upstream CONNECT tunnel ব্যবহার করে। Existing login/config root, SDK
  stream protocol, resume/model arguments, hooks ও permissions-এর সীমা থাকে।
  stdout-এ wrapper status মেশানো হয় না; gateway credentials argv-এ যায় না।
- `install-claude-vscode.mjs` default-এ preview দেয়। Apply-এর আগে mounted work
  volume-এ settings/helper backup রাখে; VS Code user settings-এর শুধু
  `claudeCode.claudeProcessWrapper` field যোগ করে, বাকি JSONC bytes/comments রেখে।
  অন্য launcher বা বদলানো managed helper থাকলে থামে। Shared Claude settings,
  routing flag, Terminal shell function, hosts, certificate ও Bridge edit করে না।
- Switch বদল নতুন process launch-এ পড়া হয়। Already-running conversation-এর
  provider পাল্টানোর দাবি নেই। Full VS Code hosted-feature parity বা detached
  background-session acceptance এই adapter-এর পরীক্ষা নয়; supported wrapper
  setting-এর extension behavior প্রযোজ্য থাকে।

Adapter ও installer source `99d077cba983bbf5f7a7ceeb86fe989d7ac15c2f`-এর
[regression CI](https://github.com/developerjillur/omniroute-optimizer/actions/runs/43175342203)-তে
Node `24.15.0` ও `26.7.0` প্রত্যেকটিতে ২৪/২৪ test পাস; failure, skip ও cancellation
শূন্য। সাতটি VS Code case-এর সঙ্গে existing Terminal এবং build preflight cases
চালানো হয়েছে। Complete source inventory ও syntax check-ও পাস। পুরোনো build
fixture-এ অনুপস্থিত compressed-database helper দুটি যোগ করা হয়েছে; assertions
দুর্বল বা test বাদ দেওয়া হয়নি। এটি full application CI/build-এর বিকল্প নয়।

Memory pressure normal হওয়ার পরে শুধু ছোট installer ও authentication metadata
process পর্যায়ক্রমে চালানো হয়েছে। VS Code user settings-এ wrapper বসানো হয়েছে;
Settings UI-তেও `Claude Code: Claude Process Wrapper`-এর মান হিসেবে installed
`claude-vscode-wrapper` দেখা গেছে। অন্য user settings/comments সংরক্ষিত। নতুন
core package build, service reload বা app/window restart লাগেনি এবং করা হয়নি।

## Default model ও shared settings

Shared settings-এ `ANTHROPIC_MODEL=claude-sonnet-5-5` এবং `model: fable` দুটোই
রয়েছে। Official precedence-এ startup environment-এর `ANTHROPIC_MODEL` settings-এর
`model` field-এর আগে আসে; explicit in-session selection আরও আগে আসে। তাই শুধু
`model` field দেখে নতুন extension session-এর model নিশ্চিত করা যায় না।

এই conflict সরাতে shared gateway/default মুছে native app-এর পছন্দ পরিবর্তন করা
হয়নি। Terminal-এর existing isolated launcher native mode-এ shared gateway-এর
model override সরায়। User-supplied transcript-এর পুরোনো `(default)` failure-কে
Fable 5.2 unavailable হওয়ার প্রমাণ বলা হয়নি; এই যাচাইয়ে সেই failure reproduce
বা তার একক কারণ প্রতিষ্ঠিত হয়নি।

## Evidence ও সীমা

Private installation, backup ও metadata receipts:
`/Volumes/NexaWork/Work/omniroute-vscode-fable-2026-11-12/switch-integration-v1/`।
আগের observation receipt অক্ষত আছে; নতুন `final-integration-v1.json` installation
ও তার পরের যাচাই সংরক্ষণ করে। Public summary:
[VS Code receipt](../../reports/vscode-fable-2026-11-12.json)।

- Installed official extension binary `2.1.322` দিয়ে শুধু `auth status --json`
  চালিয়ে live Off flag-এ `loggedIn: true`, `authMethod: claude.ai` পাওয়া গেছে।
  Effective base URL public Claude endpoint এবং gateway key/token ফাঁকা ছিল।
- একই installed adapter-এর On পরীক্ষা আলাদা ছোট flag fixture-এ হয়েছে; live flag
  বদলানো হয়নি। Effective base URL `https://omni.local`; saved gateway credential
  দিয়ে read-only `/v1/models` HTTP `200` এবং `claude-fable-5-2` পাওয়া গেছে। CLI-এর
  auth metadata-র `firstParty` label একা routing প্রমাণ হিসেবে ব্যবহার করা হয়নি।
- দুই mode-এর isolated settings-এ Fable alias `claude-fable-5-2`; stdout-এ শুধু
  sanitized metadata সংরক্ষিত। Account details বা credential export করা হয়নি।
- Shared Claude settings, existing পাঁচ Terminal helper ও installation metadata,
  shell configuration, core environment/startup plist, hosts এবং native ingress
  source-এর আগের hash অপরিবর্তিত। Live routing flag এখনও `false`।
- প্রথমে system pressure warning ছিল; তখন নতুন CLI process বা local test suite
  চালানো হয়নি। পরে normal pressure ও ১১.২৪ GiB headroom পাওয়া গেলে installer-এর
  ১২৮ MiB এবং metadata family-এর ৫১২ MiB cap-এ কাজ হয়েছে। Measured peak যথাক্রমে
  ১৯.৫৩, ১৯৩.৪৪ ও ৬৬.১১ MiB; watchdog stop হয়নি। User render/app/session বন্ধ হয়নি।

Live trusted HTTPS health read-only check HTTP `200` দিয়েছে। বর্তমান package
`v3.8.53 / 1a615fd6` অক্ষত। এই follow-up-এ নতুন model generation চালানো হয়নি;
VS Code UI থেকে fresh Fable response, account entitlement/quota এবং সব hosted
feature-এর end-to-end acceptance দাবি করা হচ্ছে না। Already-running conversation
তার পুরোনো process ও route রাখে; নতুন process switch পড়ে। কোনো private transcript
বা unrelated project content repository-তে নেওয়া হয়নি।

Official references, checked ২০২৬-১১-১২:

- [VS Code extension settings ও bundled binary](https://code.claude.com/docs/en/vs-code#extension-settings)
- [Model aliases, Fable 5.2 ও precedence](https://code.claude.com/docs/en/model-config)
- [Proxy environment ও startup scope](https://code.claude.com/docs/en/network-config)
