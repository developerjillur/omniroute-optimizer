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

- [DOMPurify advisory](https://github.com/cure53/DOMPurify/security/advisories/GHSA-cg2g-xh64-v4q7)
- [Body-parser advisory](https://github.com/expressjs/body-parser/security/advisories/GHSA-27r3-jxmh-p828)
- [Undici TLS advisory](https://github.com/nodejs/undici/security/advisories/GHSA-2m5v-pch6-74hx)
