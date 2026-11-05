# Native routing incident review — ২০২৬-১১-০৫

এই review-এ চলমান native session বন্ধ, transcript পরিবর্তন, model/account rotation,
core configuration পরিবর্তন বা live install করা হয়নি। Application changes কেবল Nexa
overlay-তে থাকে। Source validation, package build ও live acceptance পৃথক ফল।

## Tool-only reply

Buffered OpenAI/Responses reply-তে সাধারণ text অনুপস্থিত থাকলেও বৈধ tool call থাকতে
পারে। Translator-এর fallback সেই ক্ষেত্রে নিজের `(empty response)` text যোগ করত।
নতুন surgical patch শুধু এই অতিরিক্ত text বাদ দেয়; tool id/name/input, usage,
reasoning policy, provider-এর আসল text ও সত্যিকারের empty-output error অক্ষত থাকে।

Source `eae0a0b67e8e8ae2c20b287dc0eb099efa0e4c12`-এর
[CI](https://github.com/developerjillur/omniroute-optimizer/actions/runs/41959298784)
পাস: Node 26 compatibility ১২৪২/১২৪২, native ১৬৪/১৬৪, extended ১৭১/১৭১,
stream ৩৯২/৩৯২; production Node 24 native/transport ১৯৪/১৯৪। নতুন tool-only
১৬টি case দুই runtime-এ পাস। Focused baseline reproduction তখনও চালানো হয়নি;
পরবর্তী CI-তে exact failing assertions আলাদা gate হিসেবে যোগ করা হচ্ছে।

Full compiler ৬৫১০, অনুমোদিত v3.8.52 ceiling ৬৫২৯; pristine ৬৫৭২। নতুন diagnostic
identity ০। Full lint, docs-all, manifest, inventory ও formatting পাস। এটি
zero-error compiler বা নতুন application build-এর দাবি নয়। পুরোনো `7776efc1`
package-এ এই নতুন runtime patch নেই।

## Client socket crash এবং signature rejection

Local operational log-এর সময়:

- `2026-11-05T03:08:32.947Z`: `TLSSocket`-এ unhandled `Error: write EPIPE`।
- `03:08:33.000Z`: Agent Bridge child `exitCode: 1` দিয়ে বন্ধ।
- `03:08:33` ও `03:08:34`: native app দুটি session-এ
  `Invalid signature in thinking block` পেয়েছে। দ্বিতীয়টির indexed position
  `messages.47.content.28`; সংশ্লিষ্ট session-এর GPT model metadata মিলে গেছে।
- `03:08:41.385Z`: Bridge পুনরায় শুরু; stats readiness `03:08:41.836Z`।

Installed native ingress ও managed source তখন একই SHA256
`216dc5db4600c3596fe14c9393dcedc03959d755ecfec5a6e6e64029b08fa891`। সেই
ingress-এ local Bridge connection ব্যর্থ হলে সরাসরি vendor-এ TLS forward হয়।
Gateway call metadata-তে ওই দুই signature 400 নেই। Restart gap-এ vendor fallback
ব্যবহারের ব্যাখ্যার সঙ্গে এই প্রমাণ মেলে; নির্দিষ্ট দুই request-এর wire trace
সংরক্ষিত নেই, তাই তাদের পূর্ণ route correlation প্রমাণিত বলা হচ্ছে না।

প্রথম সংশোধনে raw ও decrypted client socket-এর lifetime error handler বসানো হচ্ছে।
একটি broken client বন্ধ হবে; অন্য session, listener ও server-level bind failure
অক্ষত থাকবে। CONNECT re-emission-এ duplicate handler জমবে না। Production
bootstrap-এর synthetic socket fault injection ও focused RED/green gate প্রস্তুত;
পরবর্তী source CI ফল না পাওয়া পর্যন্ত এই পরিবর্তন validated নয়। কোনো global
uncaught-exception suppression বা thinking signature rewrite ব্যবহার করা হয় না।

দ্বিতীয় সংশোধনে ingress সর্বোচ্চ ৩০ সেকেন্ড শুধু local Bridge-এ bounded backoff-এ
TCP connect চেষ্টা করবে। Connect হওয়ার আগে রাখা TLS bytes একবারই পাঠাবে; এরপর
কোনো upstream retry বা provider পরিবর্তন করবে না। Default path সরাসরি vendor-এ
যাবে না। Native mode-এ Bridge DNS বন্ধ করা আগের মতোই আলাদা action। Library caller
স্পষ্টভাবে চাইলে পুরোনো vendor fallback বেছে নিতে পারে; managed entry point সেটি
সক্রিয় করে না। Client reset-এ pending timer/attempt বন্ধ হবে এবং অন্য SNI-এর local
routing অক্ষত থাকবে। নতুন loopback regression-এর source CI এখনও বাকি।

## Focused baseline verifier-এর প্রথম rejected attempt

Source `8bf36503f51dc47943cf35782986cd3dcd7e8d29`-এর run
`41963911972` গ্রহণ করা হয়নি। Tool-only baseline-এ ১৬টির মধ্যে ১২টি pass ও
৪টি নির্দিষ্ট assertion failure পাওয়া গেছে; verifier ভুল করে পাঁচটি failure
চেয়েছিল। Responses API function-call-only control upstream-এ আগেই সঠিক ছিল।
সেই functional test ও বাকি সব assertion অক্ষত রেখে baseline-এর expected failure
তালিকা actual evidence-এর সঙ্গে মিলানো হচ্ছে। Socket ও ingress-এর focused RED
সেই run-এ আর পৌঁছায়নি; তিন পরিবার সম্পূর্ণ reproduced বলা সঠিক নয়।

ওই rejected run-এ Node 26 compatibility ১২৪৬/১২৪৬, production Node 24 native
১৯৮/১৯৮ এবং দুই runtime-এর tooling ৫২/৫২ পাস করেছে। Deployment helper ৮১ pass,
একটি আগের macOS-only limitation skip। এগুলো একটি ব্যর্থ mandatory baseline gate
ঢেকে দেয় না। পরবর্তী run সব focused পরিবারের ফল সংরক্ষণ করবে এবং কোনোটি
ব্যর্থ হলে বিস্তৃত validation শুরু করবে না।

## দশ দিনের audit coverage

বর্তমান call database প্রায় শেষ ১ লক্ষ request রাখে; এটি একা পুরো ১০ দিন দেখায় না।
বর্তমান indexed metadata এবং আগে থেকেই থাকা Oct 31 ও Nov 2–4 backup-এর observed
time ranges একত্রে Oct 26–Nov 5 window জুড়ে আছে। পূর্ণ metadata deduplication ও
application-log classification এখনও বাকি; শুধু range overlap দিয়ে complete audit
বা error-free অবস্থা দাবি করা হচ্ছে না। Private payload বা credential CI-তে যায় না।

Thread replay-এর 404, client cancellation, quota/credit limit, transport failure
এবং সত্যিকারের translation defect আলাদা করে যাচাই করতে হবে। Expected full-history
replay-কে model unavailable বা provider refusal-কে retryযোগ্য defect ধরা যাবে না।
Root ingress log এই unprivileged session-এ পড়া যায়নি; সেই সীমা সংরক্ষিত আছে।

## Deployment status

চলমান gateway এখনও `3.8.51 / 15533a05c`। এই review-এর runtime fixes live-এ বসেনি।
সেগুলোর পূর্ণ source gates, নতুন package build, isolated smoke ও অনুমোদিত promotion
শেষ না হওয়া পর্যন্ত live issue fixed, native parity বা সব সমস্যা সমাধানের দাবি নেই।
