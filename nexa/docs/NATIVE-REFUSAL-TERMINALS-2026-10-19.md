# Native refusal terminal preservation — ২০২৬-১০-১৯

## বর্তমান অবস্থা — ২০২৬-১০-২৮

প্রস্তুত refusal fix এখন canonical `omniroute-optimizer` overlay-এ আছে।
নতুন native regressions, core typecheck, lint ও documentation gates-এর hosted
validation চলছে। আগের resource stop বা import/setup failure-কে RED reproduction
বা PASS বলা হয়নি। এই source change এখনও production runtime-এ install হয়নি।
Full build, deployment ও fresh native app/CLI acceptance আলাদা বাকি ধাপ।

## প্রমাণিত failure

একই native session-এর তিনটি Opus 5.5 response, নির্বাচিত `max` ও `xhigh`
effort-এ, প্রকৃত `stop_reason: "refusal"` দিয়ে শেষ হয়েছিল। Native terminal ও
gateway metadata একসঙ্গে মিলিয়ে এটি নিশ্চিত করা হয়; prompt, thinking,
session identifier বা credentials প্রকাশ করা হয়নি। নির্বাচিত effort upstream-এ
সঠিকভাবেই পাঠানো হয়েছিল।

Hidden thinking ছাড়া assistant text বা client tool call ছিল না। Gateway সেই
বৈধ refusal-এর পরে synthetic `Provider returned empty content` SSE error যোগ
করায় native client generic API error দেখায়। Refusal upstream-এর সিদ্ধান্ত;
এটি পরিবহন ব্যর্থতার সমার্থক নয়।

## Source behavior

- প্রকৃত top-level `message_delta`-র terminal reason পড়া হয়। Nested metadata,
  non-native stream বা non-native buffered envelope এই ছাড় পায় না।
- `message_stop`-সহ সম্পূর্ণ refusal সংরক্ষিত থাকে। শেষ marker-এর আগে সংযোগ
  বন্ধ হলে error থাকে; আসল structured upstream error-এর diagnostic-ও থাকে।
- SSE event name-এর পরে JSON আসা পর্যন্ত content-free lifecycle check অপেক্ষা
  করে। Content block ছাড়া সম্পূর্ণ refusal বৈধ; খালি `end_turn` এখনও error।
- Passthrough retained summary-তে প্রকৃত Claude `type`, `content`, usage ও
  `stop_reason` থাকে। বানানো chat-completion `finish_reason: "stop"` দিয়ে
  native terminal ঢেকে দেওয়া হয় না।
- Retained collector thinking-এর `signature_delta` fragments এবং প্রকৃত
  `stop_details` রাখে। অসম্পূর্ণ summary-তে বানানো `end_turn` থাকে না।
- Buffered native refusal বৈধ terminal; Claude থেকে OpenAI translation চাইলে
  refusal `content_filter` হিসেবে map হয়।

নতুন generation, refusal retry, model/account rotation, quota bypass বা vendor
client পরিবর্তন এই fix-এর অংশ নয়। Native wire, signature ও usage সংরক্ষণই লক্ষ্য।

## Regression contract

`tests/unit/native-claude-refusal-terminal.test.ts` পূর্ণ SSE transform ও
disconnect-aware wrapper পরীক্ষা করে `low`, `medium`, `high`, `xhigh` ও `max`
effort-এ। Fragmented frame, hidden signature, content-free refusal, missing
`message_stop`, nested spoof, non-native stream/envelope, real upstream error,
buffered mapping ও Thread ownership-এর assertion আছে। Fixtures থেকে network বা
generation অনুমোদিত নয়।

`tests/unit/native-stream-summary.test.ts` retained event cap পেরিয়ে signature
fragments, thinking/tool block এবং প্রকৃত terminal সংরক্ষণ পরীক্ষা করে।
Baseline delta উল্টে পুরোনো behavior-এ assertion failure এবং candidate-এ PASS
আলাদা যাচাই করতে হয়; import বা environment error baseline reproduction নয়।

যাচাইয়ের বর্তমান ফল ও সীমা [বর্তমান reliability audit](NATIVE-RELIABILITY-AUDIT-2026-10-28.md)
এবং [machine-readable receipt](../../reports/native-reliability-2026-10-28.json)-এ আছে।

## Contract references

- [Anthropic streaming events](https://platform.claude.com/docs/en/build-with-claude/streaming)
- [Anthropic streaming refusals](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/handle-streaming-refusals)
- [আগের bounded native provider acceptance](NATIVE-PROVIDER-ACCEPTANCE-2026-10-18.md)

Private correlation receipt `native-stop-reason-correlation-v1.json` source
distribution-এর অংশ নয়।
