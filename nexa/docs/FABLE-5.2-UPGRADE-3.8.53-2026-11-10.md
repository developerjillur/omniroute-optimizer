# Fable 5.2 ও OmniRoute v3.8.53 — source প্রস্তুতি

এই পরিবর্তনের scope হলো released v3.8.53-এর ওপর আগের Nexa overlay port করা এবং `claude-fable-5-2`-এর native routing ও metadata যোগ করা। ২০২৬-১১-১০-এর পরবর্তী মানব অনুমতিতে full production build, isolated package acceptance এবং controlled live promotion সম্পন্ন হয়েছে: `v3.8.53 / f5f57a83`। বর্তমান evidence [release receipt](../../reports/native-release-2026-11-10.json)-এ আছে।

## যাচাই করা release

[OmniRoute v3.8.53](https://github.com/cheaper-inference/OmniRoute/releases/tag/v3.8.53) ২০২৬-১১-০৬ প্রকাশিত। Pinned commit `191dce8d534ceb56c28a08e71381284a9a87838f`; annotated tag object `599a2d832522badb1ee74b101caf966f131e8024`। চলমান v3.8.52 release-এর evidence ও পুরোনো patch files সংরক্ষিত।

Upstream-এর নতুন UI kit, HTTP-attempt/queue metadata, Redis affinity, preferred-account routing ও quota persistence-এর সঙ্গে Nexa native transport, no-replay, signature, cache-TTL, usage, security ও settings protections মেলানো হয়েছে। Upstream-এ অন্তর্ভুক্ত patch অবসর দেওয়ার আগে exact base, target blob ও মূল patch hash যাচাই আবশ্যক।

## Fable 5.2 support

[Official model overview](https://platform.claude.com/docs/en/models/fable-5-2/overview) ও [migration guide](https://platform.claude.com/docs/en/models/fable-5-2/migration-guide) অনুযায়ী:

| বিষয়                    | Source আচরণ                                                                                                            |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Model ID                | `claude-fable-5-2`; Bridge-এ `cc/claude-fable-5-2` ও plain native ID resolve হয়                                        |
| Context / output        | 1,000,000 / 128,000; পুরোনো 1M beta প্রয়োজন নেই                                                                        |
| Input / output          | Text ও image input; text output; tools ও vision metadata                                                               |
| Thinking                | Adaptive-only; explicit `low`, `medium`, `high`, `xhigh`, `max` effort অক্ষত                                           |
| Sampling / forced tools | Unsupported sampling বাদ; tools রেখে unsupported forced tool choice normalize                                          |
| Native prefix           | System, tools, history ও empty signed thinking সংরক্ষণ; signature/prefix rejection-এ history মুছে স্বয়ংক্রিয় replay নয় |
| Provider wire           | Signatures, `input_transformations`, refusal ও usage metadata native stream-এ সংরক্ষণ                                  |
| New toolset             | `computer_toolset_20260801` ও explicit advisor model সরাসরি সংরক্ষণ                                                    |

Fable 5.2 executor-এর advisor-ও Fable 5.2 বা Mythos 5.2 হতে হয়। পুরোনো computer tool বদলাতে caller-এর উপযুক্ত agent loop লাগে। Gateway official app-এর binary/settings বদলায় না এবং mid-session tools পরিবর্তন করে না। অন্য account বা পুরোনো model কিছু thinking block পড়তে না পারলে provider-এর reported transformation অক্ষত থাকে; reasoning সংরক্ষণের মিথ্যা দাবি করা হয় না।

Existing imported model, explicit mappings, owner-selected defaults ও `ANTHROPIC_DEFAULT_FABLE_MODEL` অক্ষত। নতুন static catalog entry entitlement বা connected account-এর সফল generation-এর প্রমাণ নয়। মডেলটিকে default করা হয়নি; অন্য provider-এ অযাচাইকৃত availability যোগ করা হয়নি।

## Usage ও pricing

[Official pricing](https://platform.claude.com/docs/en/about-claude/pricing) অনুযায়ী standard USD/MTok: input `8`, output `40`, cache read `0.20`, 5m write `10`, 1h write `16`। [Fast mode](https://platform.claude.com/docs/en/build-with-claude/fast-mode)-এ input/output দ্বিগুণ; caching multipliers তার ওপর প্রযোজ্য। Request-এর `speed` সংরক্ষণ করা হয় এবং provider-reported `usage.speed` accounting estimate সংশোধন করে। Native Claude-এর `fast` speed usage history-তেও অক্ষত থাকে; Codex-এর `priority` alias সেখানে বসানো হয় না। Exact provider cost পাওয়া গেলে সেটিকে আবার multiplier দিয়ে বাড়ানো হয় না। Subscription quota ও এই per-token estimate পৃথক।

## Validation ও release সীমা

প্রথম executor dispatch-এ native signed prefix এবং HTTP-attempt selection একই request-এর সঙ্গে রাখতে হয়। Native response wrapper-এর কারণে আলাদা logical usage row তৈরি করা যাবে না। Refusal-এর empty-content exemption কেবল আসল Claude message-এর জন্য; অন্য format-এর spoofed stop reason exemption পাবে না।

Synthetic tests-এর fetch mock বসানোর আগে transport initialization সম্পন্ন হয়। Global fetch বদলালেও নিচের socket guard শুধু isolated loopback test server-এ সংযোগ দেয়; fixtures-এ ব্যক্তিগত credentials বা generation ব্যবহার হয় না।

নতুন feature delta-র focused RED-এ assertion failure লাগবে; missing module, syntax error, network error বা resource stop reproduction হিসেবে গ্রহণযোগ্য নয়। Green lane-এ native five-effort dispatch, prefix/signature, tools, cost/cache tests; আগের সব custom ও ported regressions; দুই Node runtime; additive migration; installed dependency graph/audit; manifest/pristine checks; lint; core/full typechecks ও docs gates প্রয়োজন।

v3.8.52-এর historical RED/green proof [এই source run](https://github.com/developerjillur/omniroute-optimizer/actions/runs/42403189143)-এ থাকে। পুরোনো release-এর delta নতুন upstream-এ জোর করে reverse করা হয় না; তার functional assertions নতুন applied source-এ বহাল। Owner-approved পৃথক v3.8.53 TypeScript ceiling `7314`; initial pristine count `7361`, applied count `7314`, নতুন diagnostic identity `0`। পূর্বের v3.8.52-এর `6529` ও v3.8.51-এর `5830` record সম্পূর্ণ সংরক্ষিত। Final source-এ নতুন diagnostic identity, ceiling অতিক্রম বা অসমাপ্ত compiler validation আটকে দেবে। এই inherited backlog zero-type-error দাবি নয়।

Production build-এর পর actual package install/security smoke, isolated settings preservation, live native/Bridge model matrix ও controlled promotion আলাদা acceptance। Provider rate limit, retention policy ও client capability provider/client নিয়ন্ত্রণ করে। এই source preparation permanent reliability, zero errors বা model-output parity-এর ঘোষণা নয়।

## Focused source checkpoint

[`b0f271f`-এর focused CI](https://github.com/developerjillur/omniroute-optimizer/actions/runs/42744642403)-তে ৬৭/৬৭ native/compatibility test, ১২/১২ interface test, socket guard এবং core typecheck পাস করেছে; কোনো test skip বা cancel হয়নি। এই checkpoint পূর্ণ regression, full-project compiler, production package বা live acceptance প্রতিস্থাপন করে না। Final source acceptance তার exact commit-এর পূর্ণ CI artifact-এ নির্ধারিত হয়।

## ২০২৬-১১-১০: package ও live acceptance

Runtime source `7f4efcc5db26a4095b4f35fb8c28aecdb3df9bb0`-এর [পূর্ণ CI](https://github.com/developerjillur/omniroute-optimizer/actions/runs/42751361265)-এর সব ২৮টি required gate পাস। Local full dashboard/server/CLI build সম্পন্ন; ৬৯৭ Bridge ও ৪১ interface test পাস। Local full compiler heap সীমায় থেমেছিল; completed CI-তে `7314 ≤ 7314` এবং নতুন diagnostic identity `0` প্রমাণিত। Local compiler completion দাবি করা হচ্ছে না।

Fresh install-এ bundled workspace directory discovery-এর কারণে `npm ci` lock mismatch পুনরুৎপাদিত হয়েছে। Publication manifest থেকে কেবল reviewed `workspaces` field বাদ দিয়ে sealed archive তৈরি হয়; compiled assets ও অন্য original members byte-for-byte সংরক্ষিত। ১২টি sealing test এবং actual clean-install/override regression পাস। Packaged encryption validation-এর bundled source alias resolver-এ ১৭টি test পাস। বন্ধ WAL database-এর snapshot-এ কোনো open handle ও nonempty journal না থাকার শর্তে immutable read ব্যবহৃত হয়; transient PID configuration backup থেকে বাদ থাকে। Snapshot-এর ৪টি safety test পাস এবং final consistent backup সংরক্ষিত।

Isolated Fable 5.2 inference, schema, management authentication, model catalog, CORS এবং configuration preservation পাস। Installed root-এর ১০৩৬ dependency-এর version publication lock-এর সঙ্গে মিলেছে। Isolated ও live root এবং colocated dependency audit-এ finding `0`।

Live `https://omni.local/api/health` IPv4/IPv6-এ certificate verification-সহ `200`; native `api.anthropic.com` ingress দিয়ে `claude-fable-5-2` streaming request-এ HTTP `200`, actual model `claude-fable-5-2`, `end_turn`, expected text ও `message_stop` পাওয়া গেছে। Dashboard-এ version `3.8.53`, Bridge `Running`/`8443`, certificate trusted এবং Claude Code `Active / DNS on` দেখা গেছে। Existing configuration, environment, account/key permissions, mappings, history, startup files ও native ingress অক্ষত; previous runtime ও rollback data snapshot private অবস্থায় রাখা হয়েছে।

এই bounded acceptance সব model-এর live matrix, official desktop session operation, model-output parity, host malware clearance বা নতুন package-এ macOS restart-এর প্রমাণ নয়। Provider quota ও client-controlled capability-এর সীমা বহাল।
