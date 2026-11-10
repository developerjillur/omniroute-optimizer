# Fable 5.2 ও OmniRoute v3.8.53 — source প্রস্তুতি

এই পরিবর্তনের scope হলো released v3.8.53-এর ওপর আগের Nexa overlay port করা এবং `claude-fable-5-2`-এর native routing ও metadata যোগ করা। ব্যবহারকারীর নির্দেশে production build, package acceptance, live promotion ও model generation অপেক্ষায় আছে। Source validation-এর ফল সংশ্লিষ্ট exact commit-এর CI receipt দিয়ে নির্ধারিত হবে।

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

[Official pricing](https://platform.claude.com/docs/en/about-claude/pricing) অনুযায়ী standard USD/MTok: input `8`, output `40`, cache read `0.20`, 5m write `10`, 1h write `16`। [Fast mode](https://platform.claude.com/docs/en/build-with-claude/fast-mode)-এ input/output দ্বিগুণ; caching multipliers তার ওপর প্রযোজ্য। Request-এর `speed` সংরক্ষণ করা হয় এবং provider-reported `usage.speed` accounting estimate সংশোধন করে। Exact provider cost পাওয়া গেলে সেটিকে আবার multiplier দিয়ে বাড়ানো হয় না। Subscription quota ও এই per-token estimate পৃথক।

## Validation ও release সীমা

নতুন feature delta-র focused RED-এ assertion failure লাগবে; missing module, syntax error, network error বা resource stop reproduction হিসেবে গ্রহণযোগ্য নয়। Green lane-এ native five-effort dispatch, prefix/signature, tools, cost/cache tests; আগের সব custom ও ported regressions; দুই Node runtime; additive migration; installed dependency graph/audit; manifest/pristine checks; lint; core/full typechecks ও docs gates প্রয়োজন।

v3.8.52-এর historical RED/green proof [এই source run](https://github.com/developerjillur/omniroute-optimizer/actions/runs/42403189143)-এ থাকে। পুরোনো release-এর delta নতুন upstream-এ জোর করে reverse করা হয় না; তার functional assertions নতুন applied source-এ বহাল। TypeScript backlog-এর পূর্বের numerical ceiling বাড়ানো হয়নি; নতুন diagnostic identity বা অসমাপ্ত compiler validation আটকে দেবে।

Production build-এর পর actual package install/security smoke, isolated settings preservation, live native/Bridge model matrix ও controlled promotion আলাদা acceptance। Provider rate limit, retention policy ও client capability provider/client নিয়ন্ত্রণ করে। এই source preparation permanent reliability, zero errors বা model-output parity-এর ঘোষণা নয়।
