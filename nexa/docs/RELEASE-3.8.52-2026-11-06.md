# OmniRoute v3.8.52 — যাচাইকৃত local release, ২০২৬-১১-০৬

পূর্ণ production build, installed-package smoke এবং ব্যবহারকারীর অনুমোদিত live
promotion সম্পন্ন। চলমান gateway এখন **`3.8.52 / d6d071ef0`**। একই runtime ও
data path এবং আগের startup job definitions ব্যবহৃত হচ্ছে।

পরের বাস্তব native session-এ readiness এবং nested tool-model defect পাওয়া যায়।
নিচের প্রাথমিক package smoke সেই সমস্যা ধরেনি। **`02:12:11Z`-এ standalone
Bridge correction live-এ বসেছে**; base application build `d6d071ef0` অক্ষত,
সংশোধনের exact bytes আলাদা `bridge-hotfix.json` manifest-এ নথিভুক্ত।

## Source ও package identity

| বিষয়                             | যাচাইকৃত মান                                                       |
| -------------------------------- | ------------------------------------------------------------------ |
| Canonical Nexa source            | `9f3317269994273d95cab3efea4bda5bac6a86e3`                         |
| Packaged Nexa tree               | `3f5f9a924116ec7059212cd4a02672926ffa2f97`                         |
| Pristine upstream                | `v3.8.52 / ad6f33f66bda34eba98645d3bfdabbde294bc843`               |
| Isolated application integration | `d6d071ef0b79ff00fba6c0ca7f7a54ce948bf0bc`                         |
| Runtime `BUILD_SHA`              | `d6d071ef0`                                                        |
| Archive                          | `omniroute-3.8.52.tgz`, 70,946,019 bytes                           |
| Archive SHA256                   | `d194caaab47ac86301c04742895c35b88c23215b326483ac6a6f7fae0f793a22` |
| Previous live version            | `3.8.51 / 15533a05c`                                               |

এই release note-এর পরের documentation commit packaged source identity বদলায় না।
Archive বা private local evidence এই public repository-তে রাখা হয়নি।

## নতুন runtime corrections

- বৈধ buffered tool-only reply-তে translator আর নিজের `(empty response)` text
  যোগ করে না। Tool ID, name, arguments, usage ও `tool_use` terminal থাকে।
- Client raw/TLS socket-এর lifetime error handler একটি ভাঙা connection আলাদা করে
  বন্ধ করে। `EPIPE` দিয়ে পুরো Bridge listener বন্ধ হওয়ার correction অন্তর্ভুক্ত।
  Server bind failure fatal থাকে; global exception suppression যোগ করা হয়নি।
- Native ingress সর্বোচ্চ ৩০ সেকেন্ড local Bridge readiness-এর অপেক্ষা করে। Managed
  path-এ সরাসরি vendor fallback বন্ধ। TLS bytes পাঠানোর পর কোনো request replay,
  model/account rotation বা signature rewrite করা হয় না।
- আগের native refusal, signature/usage retention, Thread classification,
  upstream DNS, effort, compaction ও packaging overlay-ও একই candidate-এ আছে।

Installed ingress source SHA256:
`608aecf425341a0e6072828221758f422d186acca92b720782918e463a64be29`।
Packaged Bridge source ও dist mirror SHA256:
`a485d0441bdef74cb6ed519fed13bf039d04c56024d0fd8a25193feb7054ac26`।

## Validation ও resource evidence

Runtime source-এর [accepted CI](https://github.com/developerjillur/omniroute-optimizer/actions/runs/41966643610)
পাস। Focused baseline-এ tool-only ৪টি, socket ৩টি এবং ingress ২টি assertion
failure reproduced; candidate-এ যথাক্রমে ১৬/১৬, ৪/৪ ও ৪/৪ পাস। Node 26
compatibility ১২৪৬/১২৪৬, native ১৬৪/১৬৪, extended ১৭১/১৭১ এবং stream ৩৯২/৩৯২;
production Node `24.15.0` native ১৯৮/১৯৮, tooling ৫২/৫২ ও effort ১০২/১০২ পাস।
পরিবারগুলোর overlap আছে; এগুলো যোগ করে unique test count বলা হয় না।

Mac-এর নতুন build-এ focused/socket/ingress ৩১/৩১, routing ৬৩/৬৩, deployment
helper ৭৬/৭৬, Bridge ৬৭৮/৬৭৮, native request ৭৯/৭৯ ও security/diagnostics
৩৪/৩৪ পাস। Mac wildcard ingress listener case-ও পাস; সেই পরিবারে skip ০।
Core typecheck, full lint, docs-all, manifest, inventory ও patch gates পাস।
Full compiler ৬৫১০ diagnostics, অনুমোদিত ceiling ৬৫২৯, pristine ৬৫৭২;
নতুন diagnostic identity ০। এটি zero-error full typecheck নয়।

প্রথম full build ৮ GiB family cap অতিক্রম করায় watchdog শুধু নিজের build বন্ধ
করেছে: inner peak ৮২২৩ MiB। Failed receipt ও partial output সংরক্ষিত। Heap
৬১৪৪ থেকে ৫১২০ MiB করে একই ৮১৯২ MiB cap ও এক worker-এ সফল build-এর measured
peak ৭১৬০.৮৩ MiB, minimum physical headroom ১৫.১১ GiB; swap growth ০। একই
source-এর সফল completed gates পুনরাবৃত্তি না করে build/package ধাপ শেষ হয়েছে।
৬৩৯টি static page, frontend, backend, CLI/API, Bridge bundles ও package gate
সম্পন্ন। পুরোনো সফল build-এর dynamic-require/optional Playwright warnings
বর্তমান build-এও আছে; কোনো নতুন zero-warning দাবি করা হচ্ছে না।

Consistent private database clone-এ normal npm lifecycle-সহ package install ও
isolated smoke পাস। ৬ GiB family cap-এর মধ্যে peak ২৯০৯.৯১ MiB; management,
catalog, native usage schema, CORS এবং `cx/gpt-6.1-sol`-এর Messages response
যাচাই হয়েছে। Upstream-এর optional nested `fsevents` file-watcher install-এ
`binding.gyp` warning দুই installation-এই ছিল; npm exit ০ এবং production
acceptance পাস। Optional native development watcher আলাদাভাবে certified নয়।

## Live acceptance

Promotion শেষ `2026-11-06T01:33:11.882085Z`; bounded acceptance শেষ
`2026-11-06T01:36:57.821Z`। Production install-এর measured family peak
৩১৪৪.২৭ MiB, cap ৬১৪৪ MiB; minimum headroom ১৫.১৩ GiB, resource stop নেই।

- Certificate verification-সহ IPv4 ও IPv6 `https://omni.local/api/health` এবং
  existing core health: HTTP ২০০। Native ingress ও Bridge backend TLS, selected
  `claude-code` ownership এবং loopback DNS gate পাস।
- Home, quota এবং Agent Bridge dashboard: HTTP ২০০; প্রত্যেক page-এর ৩৪টি
  compiled asset HTTP ২০০। Management ও catalog endpoints পাস। পুরোনো API key
  অতিরিক্ত CLI token ছাড়াই ordinary inference authentication-এ কাজ করেছে।
- Existing native Claude mapping-এ trusted port ৪৪৩ দিয়ে একটি SSE request পাস:
  `message_start`, expected text, `end_turn` ও `message_stop` অক্ষত।
- আলাদা core Messages API-তে `cx/gpt-6.1-sol` buffered forced-tool request পাস:
  শুধু `tool_use` content, ID/arguments, usage ও terminal সঠিক; fabricated empty
  text অনুপস্থিত। Tool execute করা হয়নি। দুই inference request, client retry ০।

বর্তমান Claude mappings আগের screenshot-এর GPT routing নয়; upgrade-এর আগে ও
পরে একই existing native mappings পাওয়া গেছে। সেগুলো পাল্টানো হয়নি। তাই শেষ
দুই probe-কে Claude-to-GPT Agent Bridge remapping-এর end-to-end acceptance
বলা হচ্ছে না; native Bridge stream ও GPT Messages translation আলাদা ফল।

## সংরক্ষণ ও rollback

পূর্ণ আগের runtime-এর ১৩১,৬৫৮টি entry-এর bytes, mode ও symlink backup-এর সঙ্গে
মিলেছে। Service থামানোর পরে আরেকটি consistent database snapshot রাখা হয়েছে;
এতে promotion শুরুর আগ পর্যন্ত হওয়া কাজও থাকে। Rollback হলে post-promotion
database ও journals আলাদা করে সংরক্ষণ করার ব্যবস্থা আছে।
Core environment, job definitions, hosts, binder, CA/private key, account ও
key permissions এবং existing model mappings যাচাই করে সংরক্ষিত। API key-এর
stored secret নতুন version-এ encrypted হয়েছে; একই পুরোনো secret decrypt করে
মিলেছে, key rotation হয়নি। Existing stable config values ও history counts
সংরক্ষিত। Catalog version/revision metadata স্বাভাবিকভাবে আপডেট হয়েছে।

Original runtime `~/.omniroute-runtime`, data `~/.omniroute-local` ও service
path অপরিবর্তিত। বড় backup ও task output mounted NexaWork-এ। আগের runtime,
final stopped database ও rollback archive-এর location private receipt-এ আছে।
Operational `current`, `previous`, `previous-runtime` ও update-status pointers
সফল acceptance-এর পরে নতুন release অনুযায়ী লেখা হয়েছে; পুরোনো pointer files
সংরক্ষিত। পুরোনো source checkout-নির্ভর automatic updater চালানো হয়নি।

ব্যর্থ promotion-এ শুধু owned core/Bridge বন্ধ করে rejected runtime/database
সংরক্ষণ, আগের runtime files ও final stopped database ফিরিয়ে health/TLS gate
চালানোর ব্যবস্থা ছিল। Root ingress installer নিজস্ব previous source রাখে এবং
readiness ব্যর্থ হলে সেটিই ফেরায়। কাজের receipts overwrite করা হয়নি।

Build checkout-এর ৫৭৫টি applied/generated source path, মোট ২৪,৮৬১,৪১৪ bytes,
সংরক্ষণ করে pristine upstream base ফিরেছে। Build outputs ও package রাখা আছে।
Source repository applied অবস্থায় commit করা হয়নি।

## সীমা

### Native retry-এর সংশোধন — `2026-11-06T02:12:11Z`

Production worker লিখছিল `MITM ready on :8443 (loopback peers only) → ...`;
parent-এর readiness parser চাইছিল `MITM ready on :8443 →`। Bound listener-কে
parent ready মানেনি, ১০ সেকেন্ড পরে বন্ধ করে recovery চালাত। User request-এ
প্রায় ২০ সেকেন্ড পর `499 client_disconnected` সেই cycle-এর সঙ্গে মিলে গেছে।
শুধু log-এর parenthetical অংশ arrow/URL-এর পরে নেওয়া হয়েছে। Loopback bind,
certificate বা socket protection পরিবর্তন হয়নি। Real parent waiter ও production
listen callback-এর চারটি regression আগে assertion fail, পরে পাস।

একই session-এর তিনটি upstream ৪০০ error ছিল
`tools.0.model: cc/claude-opus-5-5`। Advisor tool-এর model-এ local routing prefix
upstream-এ যাচ্ছিল। Mapped native Claude Bridge request forward করার আগে এখন
শুধু `cc/claude-*` বা `claude/claude-*` tool model-এর local prefix সরানো হয়।
Foreign provider/model, GPT target, অন্য agent, tool schema, messages, effort,
thread ও signatures অক্ষত। Production forward boundary-র regression-এ baseline
৬টি assertion failure, candidate ১৪/১৪ পাস। প্রথম test harness extraction error
reproduction হিসেবে গ্রহণ করা হয়নি; failed receipt সংরক্ষিত।

দুটি সংশোধনসহ focused native/socket/beta/thread regression **৪৬/৪৬ PASS**।
Installed source ও dist Bridge SHA256 এখন
`598ce01b7e43f92189bbf17c2361597ea527b00d7b26cb6f7234be4cc1b6e9d2`;
নতুন helper SHA256
`912e4c52d523d3a8b153e855a20f99bd87069a29585f14db3a485f0387132d46`।
আগের Bridge bytes রাখা আছে। Uncompiled CJS worker ও তার mirror-এ scoped update
হয়েছে; frontend বা core restart/full build পুনরাবৃত্তি হয়নি। Existing recovery
নিজেই corrected worker নিয়েছে; native app/session বন্ধ করা হয়নি।

একই worker PID ৬০.৯৭ সেকেন্ড ধরে trusted native TLS-এ healthy থেকেছে। আগে reject
হওয়া prefixed advisor field-সহ `claude-opus-5-5` native SSE request HTTP ২০০,
expected answer ও `message_stop` পেয়েছে; worker PID অপরিবর্তিত। Client retry ০,
model/account rotation ০, mapping change ০। এটি real user-এর প্রতিটি historical
turn বা ভবিষ্যতের সব upstream failure অনুপস্থিত থাকার প্রমাণ নয়। পুরোনো failed
turn নতুন request না দিলে নিজে থেকে resume হয় না।

Corrected complete archive-এ শুধু standalone CJS mirrors, helper ও hotfix manifest
বদলেছে। Base full-build archive অক্ষত। নতুন archive size ৭০,৮৯৬,০৪৪ bytes,
SHA256 `f664648322d7b940d9516a963e21bb1d3edb21efdd66a68f536a6b1e6396d10c`।
Package graph/contract এবং installed CJS bytes-এর equality পাস। Operational
current pointer corrected archive-এ আছে; এই scoped correction-এর জন্য পুরো
frontend rebuild বা isolated install পুনরাবৃত্তি হয়নি।

এই correction প্রাথমিক full-build source CI-এর পরে হয়েছে। তার local RED/green
এবং live acceptance পৃথক evidence; নতুন repository CI-তে test দুটিও অন্তর্ভুক্ত।
পরবর্তী `68dba2d734d169b57631464aa360a99c78a8cddb`-এর
[পূর্ণ source CI](https://github.com/developerjillur/omniroute-optimizer/actions/runs/42149613611)
পাস করেছে: full ratchet `6510 ≤ 6529`, lint, docs ও production Node gates-সহ।
এর পরে যোগ করা quality/usage source-এর ফল পৃথক commit-এর checks-এ দেখতে হবে।

### বাকি সীমা

RunAtLoad/KeepAlive ও existing startup definitions অক্ষত এবং একই jobs নতুন
runtime চালাচ্ছে। এই নতুন package দিয়ে আরেকবার macOS reboot করা হয়নি। দশ দিনের
metadata deduplication ও পূর্ণ application-log classification এখনও বাকি;
সব historical incident, native app resume/compact, account/model বা hosted
feature-এর পূর্ণ parity এই scoped release দিয়ে প্রমাণ হয় না। Quota, upstream
refusal ও credential expiry আলাদা external boundary হিসেবে থাকে।
