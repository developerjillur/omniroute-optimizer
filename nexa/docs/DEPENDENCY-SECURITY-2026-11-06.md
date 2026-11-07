# Dependency security — ২০২৬-১১-০৬

Pinned v3.8.52 application-এর `next` ও `eslint-config-next` 16.3.8। Next.js-এর
Server Actions DoS advisory-এর affected range-এ ওই version পড়ে। Server Actions
থাকলে crafted request একই process-এর অন্য request আটকে দিতে পারে। সংশোধিত
source candidate-এ দুটো package 16.4.5-এ pin করার প্রস্তুতি নেওয়া হচ্ছে।

Maintainer-এর [advisory](https://github.com/vercel/next.js/security/advisories/GHSA-p3m5-59mp-jv5r)
16.4.1 থেকে এই নির্দিষ্ট সংশোধন দেয়। [16.4.5 release](https://github.com/vercel/next.js/releases/tag/v16.4.5)
পরবর্তী security corrections অন্তর্ভুক্ত করে। Published vulnerability এবং
বাস্তবে exploitation হওয়ার প্রমাণ পৃথক। এই review কোনো compromise বা token
চুরির ঘোষণা নয়।

## প্রস্তুতি ও gate

`dependency-security.yml` pinned pristine application ও Nexa overlay-এর পৃথক
temporary copy-তে baseline এবং candidate dependency graph যাচাই করে। এটি
শুধু `package-lock-only` চালায়; lifecycle scripts, package build, provider
generation ও deployment চালায় না। ঘোষিত direct versions ও নির্দিষ্ট scoped
overrides ছাড়া helper অন্য field বদলাতে পারবে না। Baseline ও candidate package,
lock, audit JSON এবং exact hashes artifact-এ সংরক্ষিত থাকে।

Candidate lock পাওয়া source validation পাসের সমান নয়। Audit-এর অন্য
advisory, dependency diff, Node compatibility, native/protocol regressions,
lint, TypeScript ও docs gates পর্যালোচনা করতে হবে। Existing TypeScript ceiling
বাড়িয়ে নতুন compatibility error আড়াল করা যাবে না। নিরাপত্তার নামে history,
selected effort, tools বা model quality কমানো হবে না।

Local installed package ও core configuration/data এই source preparation-এ
বদলায় না। সংশোধিত source build এবং live promotion-এর অনুমোদন পৃথক; চলমান
কাজ শেষ না হওয়া পর্যন্ত build বন্ধ থাকবে।

## Framework-এর বাইরের dependency graph

প্রথম baseline production audit-এ 13টি dependency entry flagged হয়; শুধু
Next.js সংশোধনের candidate-এ 12টি থাকে। এগুলো আলাদা exploit বা compromise-এর
গণনা নয়; যেমন DOMPurify-এর finding-এর কারণে parent Monaco entry-ও flagged হয়।

পরের candidate-এ DOMPurify 3.4.17, Undici 8.12.4 ও Zod 4.6.6 pin করা হচ্ছে।
বিদ্যমান Monaco version বজায় রেখে তার sanitizer-এর override সংশোধন হবে।
Body parser, URI parser, redirects, Hono adapter, IP parser ও query parser-এর
patched versions নির্দিষ্ট করা আছে। Scoped Undici 6/7 dependency তাদের নিজস্ব
major version-এ থাকবে। Development Vite-ও 8.3.6-এ pin হবে।

Helper প্রত্যেক সংশোধিত dependency-এর সম্পূর্ণ lock graph version পরীক্ষা
করে। অন্য advisory থাকলে তা report-এ থাকবে; audit warning সরিয়ে বা package
downgrade করে zero দেখানো হবে না। Dependency সংস্করণ বদলের পরে পূর্ণ source
validation এবং পরবর্তী অনুমোদিত build/package validation প্রয়োজন।

`4d4f8d87d3407ce8c700ed5f4c153f927242bfe8`-এর
[lock preparation](https://github.com/developerjillur/omniroute-optimizer/actions/runs/42160082877)
সম্পূর্ণ হয়েছে। Production audit-এর 13টি flagged entry থেকে 0 হয়েছে। আলাদা
development graph-এ এখনও 61টি flagged entry আছে: 13 high, 45 moderate ও 3 low;
critical 0। এগুলো cleared বলা হচ্ছে না এবং runtime intrusion-এর প্রমাণও নয়।
Major dependency changes প্রয়োজন এমন development findings পর্যালোচনাধীন।

পরবর্তী [preparation run](https://github.com/developerjillur/omniroute-optimizer/actions/runs/42161444797)
`f07e1c28dad67d26324f73403f10da455e6b6ee6`-এ Joi, Node-forge, Engine.IO এবং
MCP server/core-এর সংশোধিত minor/patch versions যাচাই করেছে। পাঁচটি existing
dependency node বদলেছে; production finding 0-ই আছে। বর্তমান candidate-এর
development graph-এ 57টি entry অবশিষ্ট: 9 high, 45 moderate ও 3 low। এই নতুন
lock-এর compatibility-ও পৃথক source CI-তে পাস করতে হবে।

এই candidate-এর দুই package patch overlay-তে সংরক্ষিত। Mandatory CI প্রথমে
pristine dependency দিয়ে upstream TypeScript record নেয়, তারপর applied lock
দিয়ে আবার install করে। Installed package ও lock version মেলানো এবং নতুন
production audit-এ zero finding বাধ্যতামূলক। ফলে আগের installed dependency
থেকে পাওয়া PASS নতুন version-এর validation হিসেবে ব্যবহৃত হবে না।

এই সংশোধনসহ `a40c4b083d664444199cfea52068af8c501e4517`-এর
[পূর্ণ source CI](https://github.com/developerjillur/omniroute-optimizer/actions/runs/42163225907)
পাস করেছে। Installed source dependency checks ও production audit পাস;
production Node native family 245/245, compatibility 1293/1293, lint/docs ও
core types পাস, full TypeScript 6510 ≤ 6529। Package build, installed live
dependency validation ও development graph-এর অবশিষ্ট findings এই ফল দিয়ে
cleared বলা হচ্ছে না।

- [DOMPurify advisory](https://github.com/cure53/DOMPurify/security/advisories/GHSA-cg2g-xh64-v4q7)
- [Body-parser advisory](https://github.com/expressjs/body-parser/security/advisories/GHSA-27r3-jxmh-p828)
- [Undici TLS advisory](https://github.com/nodejs/undici/security/advisories/GHSA-2m5v-pch6-74hx)

## Full build-এর পরে actual installation

পরের `4fd86ab7f2d25649107c9180a283a96a1e39ecab` source-এর পূর্ণ production
build সম্পন্ন হয়েছে; integration `e43e5f9e4`। Source audit-এ production finding
০ থাকলেও পৃথক global installation-এর actual graph-এ ৪টি flagged entry পাওয়া
গেছে: ১ critical, ১ moderate ও ২ low। Monaco-এর nested DOMPurify 3.4.8 এবং
Mermaid-এর KaTeX 0.16.47 source-এর সংশোধিত graph-এর সঙ্গে মেলেনি। এটি নতুন
candidate-এর rejection; live-এ ওই candidate বসানো হয়নি।

Source-root override published dependency হিসেবে কার্যকর থাকে না। শুধু lock
যোগ করার প্রথম প্রচেষ্টাতেও পুরোনো nested versions ফিরে এসেছে; সেই failed
archive/install receipt সংরক্ষিত। ছোট বাস্তব npm fixture-এর
[global installation regression](https://github.com/developerjillur/omniroute-optimizer/actions/runs/42249487310)
দেখিয়েছে, local tarball-এর lock ও private discovery flag দিয়েও পুরোনো nested
version ফিরে আসে। এটি mechanism-এর assertion failure; environment failure নয়।

পরের installer একই runtime layout-এর নতুন directory-তে package root হিসেবে
normal `npm ci` চালাবে, যাতে source override ও shipped lock কার্যকর থাকে।
Development dependency ও workspace linking বাদ যাবে, required lifecycle scripts
চলবে। Source, package metadata ও compiled bundle অক্ষত থাকবে; archive-এ শুধু
publication lock যোগ হবে। Actual installed graph comparison-ও বাধ্যতামূলক।
এই প্রস্তুতিকে installed security PASS বলা হচ্ছে না; নতুন
actual installation ও advisory audit সম্পূর্ণ না হওয়া পর্যন্ত candidate rejected।

Package-root installation-এর
[পরবর্তী বাস্তব regression](https://github.com/developerjillur/omniroute-optimizer/actions/runs/42251778067)
পাস করেছে। একই dependency assertion-এ global baseline nested version 6.0.0,
নতুন root installation-এ validated 7.0.0 পাওয়া গেছে। Required lifecycle script,
executable এবং dev/workspace exclusion-ও পরীক্ষা হয়েছে। পূর্ণ source validation
`05966fd450116e6c9d09108a3c96853f28407e68`-এর
[CI-তে পাস](https://github.com/developerjillur/omniroute-optimizer/actions/runs/42251778132)।
ছোট fixture-এর এই ফল সম্পূর্ণ OmniRoute artifact-এর acceptance নয়। চলমান
Mac resource admission পাস করে নতুন artifact installation ও actual root/dist
audit এখনও প্রয়োজন; পুরোনো rejected archive বা installed tree live-এ দেওয়া হয়নি।

Existing development graph-এর 57টি finding এই packaging কাজ দিয়ে cleared হয় না।
Provider-এর weekly quota exhaustion-ও dependency finding থেকে পৃথক। কোনো quota
threshold, native mapping, context, selected effort বা compression policy বদলানো
হয়নি।
