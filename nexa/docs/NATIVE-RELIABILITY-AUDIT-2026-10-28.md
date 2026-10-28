# Native / Agent Bridge reliability audit — ২০২৬-১০-২৮

## Source ও দায়িত্ব

Nexa fixes, regression coverage, validation ও release evidence-এর canonical
repository এখন `developerjillur/omniroute-optimizer`। Operator অনুমোদিত reference
`nexalance` commit `72230a52a548b9fdc8dda0495c893f5193e5d64d`। Pristine application
base `c1e30b7676975feb298b49eff6ff58923c04b89e`, version `3.8.51`। Custom
application source কেবল `nexa/patches` ও `nexa/new`-তে থাকে; applied fixture
source repository হিসেবে commit হয় না।

আগের pending worktree, live settings/data, vendor app/CLI এবং অন্য session-এর
কাজ এই audit বদলায়নি। নতুন code production-এ deploy হয়নি।

## যাচাইয়ের বিস্তার

Exclusive cutoff `2026-10-28T03:03:00Z` ধরে read-only database queries ও retained
artifact inspection করা হয়েছে। সংখ্যা request attempt-এর; distinct user turn
বা successful conversation-এর সংখ্যা নয়। Test, catalogue ও protocol requests-ও
থাকতে পারে।

| Evidence | পরিসর |
| --- | --- |
| Usage records | 279,382; ২০২৬-১০-০১ থেকে cutoff পর্যন্ত |
| Request metadata | 48,689; ২০২৬-১০-২১ থেকে cutoff পর্যন্ত |
| Retained detail artifacts | 10,000; প্রত্যেকটি parse হয়েছে; missing/invalid JSON 0 |
| Native client logs | বর্তমান rotating log-এর bounded tails ও relevant pattern review |
| পূর্বের কাজ | Native refusal correlation, provider/Artifact acceptance, release ও migration receipts |

পুরোনো retained data-তে প্রতিটি user conversation-এর সম্পূর্ণ wire terminal
নেই। তাই সব historical response বা সব native feature-এর পূর্ণ parity এই
evidence দিয়ে প্রমাণ করা যায় না। Private prompt, thinking, account identifier,
credentials ও raw transcript এই repository-তে রাখা হয়নি।

Request metadata-তে `200` 46,408, `400` 11, `401` 74, `403` 25, `404` 1,687,
`429` 124, `499` 20, `502` 322 এবং `504` 18। HTTP status থেকে একা user-visible
outcome নির্ধারণ করা হয়নি।

## পাওয়া সমস্যা ও source correction

### Native terminal ও retained summary

আগের correlated incident-এ আসল native refusal-এর পরে synthetic empty-content
error যোগ হয়েছিল। নতুন source actual refusal, signature ও usage সংরক্ষণ করে;
missing terminal ও real upstream error আলাদা রাখে।

আরও একটি collector defect পাওয়া গেছে: `signature_delta` আগের thinking block
হারিয়ে দিতে পারত। Signature fragments এখন ওই thinking block-এ append হয়;
stray signature tool/text block বদলায় না। Summary actual stop reason/details
রাখে এবং শেষ terminal না এলে `end_turn` বানায় না।

10,000 retained artifact-এর মধ্যে 7,830 native success summary-তে generic
chat-completion stop ও `has_content=0` ছিল। এটি সবগুলোর wire response খালি ছিল
এমন প্রমাণ নয়; native diagnostic summary-এর সীমা। নতুন native summary-এর
আকৃতি ইচ্ছাকৃতভাবেই প্রকৃত Claude message-এর আকৃতি।

বিস্তারিত [refusal terminal contract](NATIVE-REFUSAL-TERMINALS-2026-10-19.md)।

### Native Thread state classification

1,687টি `404` metadata entry Thread state miss-এর সঙ্গে যুক্ত: upstream phrase
1,130 এবং local ownership phrase 557। Matching client/session-এর পরের request
1,041 ক্ষেত্রে `200`; তার মধ্যে 1,036টি 120 সেকেন্ডের মধ্যে। এটি protocol
recovery-এর evidence, সব `404` স্থায়ী failure হওয়ার প্রমাণ নয়।

`No thread state is available ... previous_message_id` এখন upstream-এর
`No thread state was found ...` phrase-এর মতো request-scoped resource miss।
এটিকে model unavailable ধরে model health/cooldown নষ্ট করা হয় না। Thread
history না থাকলে sparse request থেকে fabricated conversation তৈরি করা হয় না।

### Agent Bridge upstream DNS

২০২৬-১০-২৭-এ 86টি `queryA ETIMEOUT api.anthropic.com` diagnostic পাওয়া গেছে।
Installed shim প্রতি request-এ নতুন resolver query করত; cache বা concurrent
query coalescing ছিল না।

নতুন shim family অনুযায়ী concurrent lookup একত্র করে, সর্বোচ্চ 60 সেকেন্ড TTL
cache রাখে এবং bounded resolver timeout ব্যবহার করে। কেবল আগে validated
address সংক্ষিপ্ত transient DNS failure-এর সময় সর্বোচ্চ অতিরিক্ত 5 মিনিট
ব্যবহারযোগ্য। Cold failure ও authoritative DNS failure ফিরিয়ে দেওয়া হয়।
Loopback/Bridge address গ্রহণ করা হয় না; TLS original hostname verification
চালু থাকে। এটি HTTP/model retry নয়।

Offline VM fixture-এ পুরোনো shim 20 concurrent query করে assertion fail করেছে;
candidate 6/6 PASS। সেই test বাস্তব DNS বা generation call করে না।

### Manifest reproducibility

প্রথম hosted CI application test-এর আগে থেমেছিল: Git-এর default abbreviated
SHA full local clone ও shallow CI clone-এ আলাদা ছিল। Manifest এখন full upstream
object ID রাখে; `core.abbrev=4` ও `12`-এ একই ফলের regression আছে। Setup failure
RED reproduction হিসেবে গণনা করা হয়নি।

## আলাদা external/input boundary

তিনটি retained request-এ implicit default 5-minute cache marker-এর পরে explicit
1-hour marker ছিল। Anthropic-এর TTL ordering rule অনুযায়ী সেই input rejected
হয়। Caller-এর cache duration বা খরচের আচরণ চুপিসারে বদলানো হয়নি; gateway
corruption-এর প্রমাণ পাওয়া যায়নি। [Anthropic cache contract](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)।

Upstream overload, quota ও revoked credentials transport/translation defect-এর
থেকে পৃথক। Banned accounts reset, account rotation বা refusal bypass করা হয়নি।
Native startup log-এ MCP connection timeout ও পরে connected inventory আছে;
correlated gateway request ছাড়া সেটিকে OmniRoute defect বলা হয়নি।

## Validation ও বাকি ধাপ

- Canonical public source ও synthetic data নিয়ে pinned hosted fixture-এ কাজ
  চলছে। Mac-এ warning memory pressure থাকায় application/build admission bypass
  করা হয়নি। Heavy local jobs বা অন্য app/session বন্ধ করা হয়নি।
- Baseline assertion reproduction, native/protocol/transport/cache/translator
  regressions, core typecheck, lint ও documentation gates-এর ফল
  [audit receipt](../../reports/native-reliability-2026-10-28.json)-এ আলাদা থাকে।
- Full production build/package/install/deployment হয়নি। Fresh native app/CLI
  tool cycle, compact/resume বা সব connector-এর নতুন acceptance-ও হয়নি।
- Live fingerprint এখনও pre-fix baseline-এর সঙ্গে মেলে। এই repository-তে
  source fix থাকা production update-এর প্রমাণ নয়।

## Restart-পরবর্তী HTTPS

আগের HTTPS recovery-এর installation boot থেকে বর্তমান boot আলাদা পাওয়া গেছে।
Read-only verification-এ IPv4/IPv6 `https://omni.local/api/health`, certificate
verification-সহ HTTPS, আগের HTTP, core health ও দুই ingress startup job PASS।
এতে model generation লাগেনি। ওই একবারের restart follow-up PAUSED করা হয়েছে।
এটি native inference বা ভবিষ্যতের সব boot-এ স্থায়ী uptime-এর দাবি নয়।
