# Live availability — ২০২৬-১১-১১

লেখক: Jillur Rahman

## বর্তমান অবস্থা

v3.8.53 / `1a615fd6` package অপরিবর্তিত। ২০২৬-১১-১১ 12:45 UTC-তে
certificate-verified IPv4 ও IPv6 HTTPS health, homepage, CLI dashboard এবং
সরাসরি core health—৫/৫ check HTTP `200` দিয়েছে। Homepage/dashboard check
স্বাভাবিক unauthenticated login redirect অনুসরণ করেছে; এটি authenticated UI
acceptance বা নতুন generation test নয়।

**এই incident পুরোপুরি resolved নয়।** আগের দুই availability window-তে যথাক্রমে
২৪টির মধ্যে ৭টি এবং ১০টির মধ্যে ৪টি short-deadline request timeout হয়েছে। পরে
পাঁচটি সফল request পাওয়া sustained low latency বা permanent recovery-এর প্রমাণ নয়।

## কী পাওয়া গেছে

- Port `28128`-এর process এবং দুই root ingress job চলছিল। Core-এ সরাসরি request-ও
  timeout হয়েছে; শুধু browser, DNS বা HTTPS listener-কে কারণ বলা যায় না।
- Recovery restart-এর সময় প্রায় ৫ GB SQLite database-এর synchronous
  `PRAGMA quick_check` মূল server thread আটকে রেখেছিল। Native process sample-এ
  `Statement::JS_all → sqlite3_step → checkTreePage → pread` পাওয়া গেছে। এটি
  restart-এর সময় startup delay-এর প্রমাণ; প্রথম runtime stall-এর একমাত্র কারণের
  প্রমাণ নয়।
- Startup এগোনোর পরও runtime timeout হয়েছে। একটি bounded CPU profile-এ
  `/v1/messages/count_tokens`-এর local tokenizer initialization এবং
  `/api/provider-metrics`-এর synchronous database aggregation সময় নিয়েছে। Home
  topology চালু থাকলে বর্তমান source প্রতি response-এর তিন সেকেন্ড পরে আবার
  provider metrics আনে; aggregation worker isolation/cache আলাদা follow-up।
- একই সময়ে host load ছিল প্রায় `47` on `14` cores, physical headroom প্রায়
  `10.8 GiB`, pressure normal, swap `0`; দুটি media render চলছিল। Host contention
  ধীর response-এ ভূমিকা রাখতে পারে; একে একমাত্র কারণ বা malware-এর প্রমাণ বলা হয়নি।

## Live-এ প্রয়োগ করা সীমিত পরিবর্তন

Existing feature flag `DB_HEALTHCHECK_STARTUP_DEFERRED_ENABLED`-এর অনুপস্থিত
override-এর জায়গায় `true` সংরক্ষণ করা হয়েছে। নতুন runtime code বা dependency
বসানো হয়নি। এই build-এ packaged `src/lib/db/healthCheckWorker.js` আছে; real
file-backed database-এর full check cancellable child process-এ যায়। পরের native
sample-এ মূল thread synchronous `quick_check`-এ আটকে ছিল না এবং আলাদা worker
process দেখা গেছে।

`OMNIROUTE_SKIP_DB_HEALTHCHECK` চালু করা হয়নি। Integrity check চালানোর আচরণ রাখা
হয়েছে; worker-এর পূর্ণ integrity verdict এই receipt দিয়ে certified নয়। Override
database-এ থাকে, তাই package বদলালেও settings সংরক্ষণ করলে পছন্দটি থাকে।
আগের আচরণে ফিরতে existing feature-flag override clear করতে হবে; incident-এর
সময় সেটি করা হয়নি।

শুধু owned OmniRoute user service restart হয়েছে। Root ingress reload, hosts,
certificates, shared settings, model mappings, provider credentials বা package
বদলানো হয়নি। আগের file hashes মিলে গেছে; flag write transaction-এ অন্য
key/value row অপরিবর্তিত ছিল। কোনো user app, session বা render বন্ধ করা হয়নি;
কোনো file মুছে ফেলা হয়নি।

## Evidence ও বাকি কাজ

Public summary: [incident receipt](../../reports/live-availability-2026-11-11.json)।
Private local evidence directory:
`/Volumes/NexaWork/Work/omniroute-live-unresponsive-2026-11-11`। Raw process/CPU
samples, failed recovery receipt এবং failed availability windows সেখানে অক্ষত
আছে; ব্যক্তিগত database, request body, credentials বা chat export repository-তে
আনা হয়নি। Inspector শুধুমাত্র owned core-এ bounded CPU sampling-এর জন্য খোলা
হয়েছিল; sampling শেষে listener বন্ধ করা হয়েছে।

বাকি acceptance: quiet resource window-তে একই boot/package-এর sustained
availability; full integrity verdict; measured runtime tokenizer/statistics
contention-এর focused regression এবং প্রয়োজন হলে পরের source/build fix। Busy
host-এ নতুন full build বা দ্বিতীয় integrity scan চালানো হয়নি। Original build
receipt ও এই incident receipt পৃথক; আগের acceptance এই নতুন intermittent
failure-কে মুছে দেয় না।
