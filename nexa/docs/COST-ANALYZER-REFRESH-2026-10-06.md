# Cost Analyzer: key filter ও live refresh

তারিখ: 2026-10-06। রক্ষণাবেক্ষণ: Jillur Rahman।

## যাচাই করা কারণ

অভিযোগে ব্যবহৃত `/dashboard/costs` URL-এ `apiKeyIds` দিয়ে পুরোনো
`local-default` key নির্বাচিত ছিল। ওই key-র সর্বশেষ request 2026-10-04;
বর্তমান native traffic `Nexa-Skill-Family-Key`-এ রেকর্ড হচ্ছে। সব key-এর
view-এ নতুন usage ও cost দেখা গেছে। History বা account data সংশোধনের দরকার
পড়েনি। পুরোনো key-র খরচকে নতুন key-র খরচ হিসেবে দেখানো যাবে না।

আগের CostOverview component শুধু mount ও filter/range পরিবর্তনে fetch করত।
দীর্ঘ সময় tab খোলা থাকলে নতুন request-এর হিসাব নিজে refresh হতো না।

## পরিবর্তন

- Visible cost view প্রতি 30 সেকেন্ডে refresh হবে; hidden tab-এর polling বন্ধ।
- Tab-এ ফিরে আসা বা focus এবং Refresh button নতুন হিসাব আনে।
- একটি fetch চলাকালে আরেকটি scheduled fetch শুরু হয় না।
- Key/range বদলালে আগের request abort হয়; দেরিতে আসা result অন্য key-তে যায় না।
- Background refresh ব্যর্থ হলে পুরোনো সফল result থাকে এবং error দেখা যায়।
- নির্বাচিত key-র নাম ও সব key দেখার link স্পষ্ট; range/grouping সংরক্ষিত।
- Usage-limit card-এর spend refresh হয়; একই policy-তে unsaved edit নষ্ট হয় না।
- API key-এর quota, permissions, ledger বা পুরোনো history পরিবর্তন করা হয়নি।

`useLiveCostRequest` ও দুই test suite `nexa/new/`-তে। তিনটি existing
component/hook-এর পরিবর্তন `nexa/patches/`-তে। Cost UI regression suites
production Bridge gate-এ বাধ্যতামূলক এবং serial execution বজায় থাকে।

## হিসাবের অর্থ

Claude subscription traffic-এর Cost Overview token-price equivalent estimate
দেখাতে পারে। সেটি actual paid bill বা নতুন charge নয়। API-key USD quota
card billed ledger ব্যবহার করে; flat subscription-এর estimate দিয়ে paid
budget কৃত্রিমভাবে পূরণ করা যাবে না। Existing disclosure regression বজায় আছে।

## প্রমাণ ও deployment সীমা

পুরোনো component দিয়ে দুই integration test ব্যর্থ হয়েছে: key filter-এর
স্পষ্ট label/link ও Refresh action অনুপস্থিত। সংশোধিত component দিয়ে ওই দুই
case পাস, hook/form-এর সাতটি case পাস, estimate disclosure-এর ছয়টি case পাস।
পরিবর্তিত চারটি production file-এর focused ESLint-ও যাচাই করা হয়েছে।

এটি source ও test ফল। নতুন package-এর পূর্ণ typecheck/ratchet, build ও
isolated smoke gate পাস না হওয়া পর্যন্ত live dashboard পরিবর্তিত বলা যাবে না।
স্থানীয় handoff-এ সেই deployment অবস্থাটি আলাদা করে লেখা থাকবে।
