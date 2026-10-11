# Agent Bridge: model বদলানোর পরে thinking signature

লেখক: Jillur Rahman

## সমস্যা ও কারণ

GPT দিয়ে চলা Claude Code session Claude provider-এ ফেরালে পুরোনো history-তে
unsigned `thinking` block থাকতে পারে। Anthropic সেই block গ্রহণ করে না:
`400 messages.N.content.M: Invalid signature in thinking block`। এটি connector-এর
login সমস্যা নয়। Native app-এর সংরক্ষিত session মুছে ফেলা এই সমাধানের অংশ নয়।

## সংরক্ষিত সমাধান

- `anthropicThinkingReplay.ts` native Anthropic dispatch এবং `count_tokens`-এ
  missing, empty বা পরিচিত synthetic signature শনাক্ত করে। প্রথম এমন block থেকে
  পরের thinking/redacted-thinking block বাদ যায়; সাধারণ লেখা, document,
  tool call ID/result, system, tools ও selected effort অক্ষত থাকে।
- আগের বৈধ signed block পরিবর্তন হয় না। বৈধ same-provider request-এর body এই
  helper মূল reference-সহ ফেরত দেয়। Sanitization sparse-thread restoration-এর
  পরে এবং fingerprint/CCH serialization-এর আগে হয়।
- Nonempty opaque signature আগাম অনুমান করে বাদ দেওয়া হয় না। Upstream যদি
  নির্দিষ্ট position-এ signature প্রত্যাখ্যান করে, শুধু সেই block ও পরের thinking
  suffix সরিয়ে একবার retry হয়। Pending tool call/result রাখা হয়। Retry ব্যর্থ হলে
  আসল error ফেরত আসে; সীমাহীন retry বা নকল successful response হয় না।
- Position না থাকলে আগের conservative historical-only recovery থাকে। GPT ও
  GLM dispatch-এ নতুন native sanitizer চলে না। Routing mappings, credentials,
  connector configuration এবং compression settings বদলানো হয় না।

## Regression ও release যাচাই

`nexa/check/native-claude-regressions.mjs`-এ
`native-thinking-signature-switch.test.ts` অন্তর্ভুক্ত। Cases: valid native bytes,
unsigned/synthetic replay, redacted blocks, later signed suffix, active tool cycle,
invalid rejection position, bounded recovery, actual executor dispatch,
sparse-thread creation ও count_tokens। Related thread, tools, effort এবং compaction
regression-ও release gate-এর অংশ। Actual live build/deployment/test evidence release
report-এ আলাদা করে লেখা হবে; test case উপস্থিত থাকা PASS-এর প্রমাণ নয়।

## সীমা ও পরবর্তী model switch

এটি অন্য provider-এর reasoning-কে Anthropic-এর signed reasoning বানায় না।
Replay-এর unusable thinking বাদ দিয়ে কার্যকর conversation/tool history রাখে।
নতুন Claude response-এর বৈধ signature অপরিবর্তিত ফিরতে হবে। নতুন conversation
শুরু করা বাধ্যতামূলক করা হয়নি; incompatible history-র জন্য server-side repair থাকে।
Provider outage, account quota, connector permission বা authentication failure এই
signature fix-এর আওতায় নয়। সব connector-এর সমান আচরণের দাবি করতে actual connector
test লাগবে।

Anthropic-এর [thinking troubleshooting](https://platform.claude.com/docs/en/build-with-claude/thinking-troubleshooting)
নির্দেশনায় invalid/empty signature এবং rejected block-এর পরের thinking suffix-এর
নিয়ম ব্যাখ্যা করা আছে।
