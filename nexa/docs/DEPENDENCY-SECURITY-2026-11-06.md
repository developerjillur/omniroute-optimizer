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
generation ও deployment চালায় না। Direct declarations-এর নির্দিষ্ট দুটো
version ছাড়া helper অন্য field বদলাতে পারবে না। Baseline ও candidate package,
lock, audit JSON এবং exact hashes artifact-এ সংরক্ষিত থাকে।

Candidate lock পাওয়া source validation পাসের সমান নয়। Audit-এর অন্য
advisory, dependency diff, Node compatibility, native/protocol regressions,
lint, TypeScript ও docs gates পর্যালোচনা করতে হবে। Existing TypeScript ceiling
বাড়িয়ে নতুন compatibility error আড়াল করা যাবে না। নিরাপত্তার নামে history,
selected effort, tools বা model quality কমানো হবে না।

Local installed package ও core configuration/data এই source preparation-এ
বদলায় না। সংশোধিত source build এবং live promotion-এর অনুমোদন পৃথক; চলমান
কাজ শেষ না হওয়া পর্যন্ত build বন্ধ থাকবে।
