# Live availability recovery — ২০২৬-১১-১৬

লেখক: Jillur Rahman

## ফল

OmniRoute `v3.8.53`-এর existing core process graceful shutdown করে existing
supervisor দিয়ে পুনরায় চালানোর পরে Chrome-এর আগের `ERR_EMPTY_RESPONSE` tab-এ
Provider Quota dashboard খুলেছে। নতুন package build বা installation হয়নি।
সরাসরি core, certificate-verified IPv4/IPv6 HTTPS health, quota dashboard এবং
repeat core—পরপর পাঁচটি check HTTP `200` দিয়েছে।

## প্রমাণিত failure ও সীমা

- মূল process ও listener উপস্থিত থাকলেও নতুন core connection প্রত্যাখ্যাত হচ্ছিল;
  HTTP/HTTPS proxy empty response দিচ্ছিল। Core listen queue ছিল `121/0/128`।
  তাই শুধু LaunchAgent-এর running status service readiness প্রতিষ্ঠা করেনি।
- এক সেকেন্ডের bounded native sample-এ main thread-এ Brotli completion callback,
  promise processing এবং synchronous SQLite `Statement::JS_all → sqlite3_step`
  পাওয়া গেছে। এটি busy main thread-এর evidence; কোন একক query বা handler-ই
  সম্পূর্ণ incident-এর কারণ, তা এই sample দিয়ে প্রতিষ্ঠিত হয়নি।
- Core PID `1226`-কে `SIGTERM` দেওয়া হয়েছে; force kill করা হয়নি। প্রথম ২০ সেকেন্ডে
  shutdown শেষ হয়নি বলে প্রথম receipt-এ `coreExited: false` আছে। পরে log-এ
  in-flight drain, SQLite checkpoint/close এবং shutdown completion পাওয়া গেছে।
  Existing supervisor PID `1088` নতুন core PID `66128` চালিয়েছে; duplicate server
  বা নতুন startup definition তৈরি হয়নি।
- Shutdown-এর পরে কিছু late call-log callback বন্ধ database-এ লিখতে গিয়ে error
  দিয়েছে। Existing database checkpoint/close হয়েছে, কিন্তু ওই trailing diagnostic
  record-গুলোর সম্পূর্ণতা certified নয়। Full database integrity scan করা হয়নি।
- Recovery-এর পরে listen queue `1/0/128`। পাঁচটি check-এ সময় যথাক্রমে
  `7.651`, `2.054`, `5.540`, `1.389`, `6.643` সেকেন্ড। Dashboard ফিরেছে;
  sustained low latency বা permanent runtime recovery এখনও প্রতিষ্ঠিত নয়।

## সংরক্ষণ ও resource safety

Shared Claude settings, core `.env`, user LaunchAgent plist এবং hosts-এর আগের
SHA256 অপরিবর্তিত। Account, credential, mapping বা routing flag edit করা হয়নি।
Root proxy/ingress reload, app/window/session close, model generation এবং manual
database mutation হয়নি। কোনো user file মুছে ফেলা হয়নি।

শুরুতে memory pressure warning ছিল; নতুন build, local regression suite বা বড়
scan চালানো হয়নি। পুরোনো cache directory-র reviewed resource guard পাওয়া যায়নি;
এটি bypass করে heavy validation চালানো হয়নি। Native `sysctl`, `vm_stat` ও disk
metadata দিয়ে ছোট diagnostic কাজের resource state দেখা হয়েছে। Normal pressure
হওয়ার পরে graceful recovery শুরু হয়। Automatic supervisor restart-এর সময় একটি
sample-এ headroom `7.78 GiB` নেমেছিল; পরে `11.37 GiB` ফিরে আসে। এই busy-host
পরিস্থিতিকে নতুন heavy-work admission হিসেবে ব্যবহার করা যাবে না।

Private evidence:
`/Volumes/NexaWork/Work/omniroute-empty-response-2026-11-16/`। Native sample,
প্রথম shutdown receipt ও availability window অক্ষত আছে। Public summary:
[recovery receipt](../../reports/live-availability-2026-11-16.json)।

পরবর্তী source acceptance-এর জন্য নির্দিষ্ট slow handler/query attribution,
bounded concurrency/database isolation regression এবং quiet-window sustained
availability প্রয়োজন। এই recovery-কে সেই performance fixes-এর deployment বলা
হচ্ছে না; [আগের availability incident](LIVE-AVAILABILITY-2026-11-11.md)-এর
অসম্পূর্ণ runtime contention gate বহাল।
