> **ঐতিহাসিক নথি — public copy, ২০২৬-১০-১৭।** মূল ঘটনার তারিখ ও ফল এই নথির নিজস্ব সময়ের জন্য প্রযোজ্য; পরের সংযোজন থাকতে পারে। বর্তমান অবস্থা ও কাজের নিয়মের জন্য [বর্তমান handoff](../CURRENT-STATUS-2026-10-17.md) পড়ুন। Private reference ও identifier সরানো হয়েছে; স্থানীয় evidence এখানে অন্তর্ভুক্ত নেই। পুরোনো cleanup, build, deploy বা service command বর্তমান অনুমতি হিসেবে ব্যবহার করবেন না।

# GPT routing-এ Claude Code-এর misleading 502: নিশ্চিত কারণ

লেখক: Jillur Rahman<br>
তৈরির সময় UTC: 2026-10-10T06:20:12.424215+00:00<br>
Live runtime: `0b62ea8e7`<br>
অবস্থা: কারণ শনাক্ত ও reproduction সম্পূর্ণ; production fix/build/deploy প্রয়োগ হয়নি।

## নিশ্চিত সিদ্ধান্ত

স্ক্রিনশটের দুইটি error একই Sagrilo Claude Code session-এর সংরক্ষিত transcript-এ পাওয়া গেছে। দুটির সঙ্গে gateway call-এর timestamp ও error মিলে যায়। OpenAI/Codex response-এ আসল error ছিল `context_length_exceeded`: conversation input model-এর context window ছাড়িয়েছে।

আসল provider message: `Your input exceeds the context window of this model. Please adjust your input and try again.`

OmniRoute-এর non-streaming response translation এই failure-এর error object client response-এ রাখছে না। পরের malformed-response guard সেটিকে generic `502 upstream_empty_response` করছে। তাই screenshot-এর “server-side issue / try again / status.claude.com” নির্দেশনা এই underlying context error-এর সমাধান নয়।

প্রাসঙ্গিক call-গুলোতে requested effort `max`, upstream effort `max`। এই নির্দিষ্ট response-গুলোতে quota/auth error code নেই।

## Request ও client log-এর মিল

Frozen window: 2026-10-10 05:53:00–06:09:12 UTC; Dhaka 11:53:00–12:09:12। Matching context-overflow call **24টি**: HTTP 400 **2টি**, HTTP 502 **22টি**।

| ধাপ | UTC | Dhaka | ফল |
| --- | --- | --- | --- |
| প্রথম request | 05:53:17.631 | 11:53:17.631 | stream=true; 400 context_length_exceeded |
| পরবর্তী ১১টি request | 05:53:27.971–05:57:50.978 | 11:53:27.971–11:57:50.978 | stream=false; একই error 502 হয়ে ফেরে |
| প্রথম client-visible error | 05:57:51.022 | 11:57:51.022 | স্ক্রিনশটের একই generic 502 |
| পরের request | 06:04:55.426 | 12:04:55.426 | stream=true; 400 context_length_exceeded |
| পরবর্তী ১১টি request | 06:05:05.944–06:09:11.165 | 12:05:05.944–12:09:11.165 | stream=false; একই error 502 হয়ে ফেরে |
| দ্বিতীয় client-visible error | 06:09:11.210 | 12:09:11.210 | স্ক্রিনশটের একই generic 502 |

দুই group-এ history entry **1,849টি**, tool definition **112টি**। History entry-তে tool request/result-ও থাকে; এগুলো সব মানুষের message নয়। History ছোট হওয়ার প্রমাণ নেই। Retained request summary দিয়ে `stream=false` request-গুলোর নির্দিষ্ট internal উদ্দেশ্য নিশ্চিত করা যায় না; তাই সবগুলোকে প্রমাণ ছাড়া auto-compaction call বলা হয়নি।

এই conversation-এর শেষ সফল call 05:53:00.339 UTC: total input `927437`, cache-read `926208`, output `1064`। Cache-read total input-এর অংশ—দুটি যোগ করা যাবে না। সব input নতুন করে বিল হয়েছে এমন প্রমাণ নয়। Failed response-এর usage null/শূন্য থেকেও provider billing শূন্য বলা যায় না।

সব 24টি artifact-এর database checksum যাচাই হয়েছে। Legacy `artifact_sha256` field আসলে FNV-1a checksum রাখে; আলাদা পূর্ণ SHA-256-ও evidence JSON-এ রাখা হয়েছে।

## Code path ও reproduction

1. responseTranslator.ts (স্থানীয় বা private reference; প্রকাশিত নয়) Responses output থেকে Claude response তৈরি করে; failure error object client response-এ থাকে না।
2. diagnostics.ts (স্থানীয় বা private reference; প্রকাশিত নয়) raw Responses object-এর `status=failed` থাকলে failure-specific message নেয়। Claude format-এ রূপান্তরিত response-এ সেই shape নেই।
3. chatCore.ts (স্থানীয় বা private reference; প্রকাশিত নয়) translated response দিয়ে description তৈরি করে এবং HTTP 502 ফেরায়।

ছোট reproduction-এ `status=failed`, `error.code=context_length_exceeded`, `output=[]` response Claude format-এ রূপান্তর করা হয়েছে। Result-এ error object অনুপস্থিত; malformed reason `empty_choices`; final classification screenshot-এর একই `upstream_empty_response`। Exit 0। কোনো upstream inference request পাঠানো হয়নি। ব্যবহৃত diagnostics ও translator source deployed package-এর সঙ্গে SHA-256 মিলে গেছে।

Standalone runtime import-এ alias-resolution সীমা ছিল। সফল reproduction byte-identical checkout helper ব্যবহার করেছে; imported module আলাদা default স্থানীয় `~/.omniroute/storage.sqlite` initialize করেছে। Production database `~/.omniroute-local/storage.sqlite` সেই helper-এর DATA_DIR ছিল না।

## প্রয়োজনীয় সংশোধন

- HTTP 200/SSE-এর ভেতরের পরিচিত upstream error translation-এর আগে classify করতে হবে। `context_length_exceeded` সঠিক HTTP 400 ও `invalid_request_error` হিসেবে Claude client-এ যেতে হবে।
- Raw error code ধরে রাখতে হবে; status অনুপস্থিত থাকলেও context error generic empty-response হবে না।
- Deterministic context overflow-তে একই history-র repeated server retry বন্ধ করতে হবে। Genuine temporary 502 ও valid text/reasoning/tool result আলাদা থাকতে হবে।
- GPT route-এর verified context budget ও native client-এর recovery threshold মিলিয়ে দেখতে হবে। Local manual context override `872000` পাওয়া গেছে; সেটিকে বর্তমান upstream-এর hard limit হিসেবে দাবি করা হয়নি।
- Regression-এ streaming/non-streaming, error-only response, status-সহ/ছাড়া failure, genuine 502 ও valid tool result পরীক্ষা করতে হবে।
- OmniRoute-এর অতিরিক্ত compression engine চালু করা এই সমাধানের অংশ নয়। Native client-এর context management ও সঠিক error signalling প্রয়োজন।

## এখন কাজ চালানো

একই oversized conversation-এ শুধু “continue” পাঠালে context ছোট হয় না। বর্তমান project files, plan ও handoff রেখে নতুন conversation-এ প্রয়োজনীয় context দিয়ে চালানো যায়। Claude Code-এর নিজস্ব `/compact` native ব্যবস্থা; তবে ইতিমধ্যে context ছাড়িয়ে গেলে একই GPT route-এ compaction request-ও ব্যর্থ হতে পারে। [Official Claude Code context-management guidance](https://code.claude.com/docs/en/best-practices#manage-context-aggressively)।

সব 502-এর কারণ এক নয়; একই দিনের retained logs-এ অন্য server/transport failure-ও আছে। এই সিদ্ধান্ত screenshot-এর সঙ্গে মেলা দুইটি client error ও সংশ্লিষ্ট 24টি context-overflow request-এর জন্য নিশ্চিত। অন্য native-thread 404 আলাদা সমস্যা।

## Evidence

Sanitized receipt: evidence JSON (স্থানীয় বা private reference; প্রকাশিত নয়)।

Client transcript: `~/.claude/projects/-home-user-Desktop-NexaLance-All-Projects-carolgatti/private-id-028.jsonl`।

Production source, configuration ও routing পরিবর্তন করা হয়নি। রিপোর্টে credentials, account identity, private verification URL বা project prompt contents নেই।

## ২০২৬-১০-১০ — GPT context overflow fix, source validation ও অনুমোদিত resource সংরক্ষণ

`fix/native-context-error-2026-10-10` branch-এ commit `7dd92427f391f592cc1914bec54ae0e7feb97f88` সম্পন্ন। Author ও committer Jillur Rahman; স্বাভাবিক commit hooks PASS। পরিবর্তন শুধু চারটি `nexa/` path-এ। Upstream base pristine আছে; ১৪৩/১৪৩ overlay patch প্রয়োগের check PASS। Shared `nexalance` ও live runtime এখনও বদলানো হয়নি—এই addendum লেখা পর্যন্ত production `0b62ea8e7`।

মূল সংশোধন: Responses API-এর HTTP 200 body/stream-এর ভেতরে `context_length_exceeded` এলে non-streaming leg এখন translation ও empty-output fallback-এর আগেই `400 / invalid_request_error / context_length_exceeded` ফেরত দেয়। একই check recovery response-এর success tail-এও আছে। Raw upstream message প্রকাশ না করে native client চেনার উপযোগী নিরাপদ `prompt is too long` message ব্যবহার হয়। Provider usage, selected connection ও error receipt রাখা হয়; request log-এ sanitized upstream body এবং সঠিক client error code/type সংরক্ষিত হয়। সত্যিকারের empty output ও আলাদা server failure-এর 502 আচরণ বহাল। Effort, routing mapping, compression, account activation বা official app configuration পরিবর্তন হয়নি।

প্রমাণ ও validation:

- পরিবর্তনের আগে নতুন ১১টি regression-এর ৭টি fail; সংশোধনের পরে ১১/১১ PASS। JSON, buffered SSE, NDJSON, missing status, partial output, valid tool response ও error-log sanitization অন্তর্ভুক্ত।
- সংশ্লিষ্ট মোট ২১০/২১০ test PASS; এই মোটের মধ্যেই উপরের ১১টি আছে। Core typecheck PASS।
- Full TypeScript ratchet পর্যাপ্ত heap-এ exit 0: measured `5822`, baseline `5830`; error count বাড়েনি। প্রথম 1536 MiB compiler run heap cap-এ SIGABRT হওয়ায় সেটিকে PASS ধরা হয়নি; পৃথক evidence রাখা আছে।
- আসল installed Claude Code CLI `2.1.294`-এর isolated local fixture-এ ঠিক একটি message request হয়েছে, error status 400, terminal reason `prompt_too_long`, `is_error=true`। ভুল transient 502 বা retry loop দেখা যায়নি। CLI exit 1 এই deliberate error fixture-এর প্রত্যাশিত ফল; এটি live inference সফল হওয়ার দাবি নয়। এই fixture-এ provider quota ব্যবহার হয়নি।
- Source ও validation log hash যাচাই করা receipt: `~/Library/Caches/NexaLance/omniroute-gpt-empty-response-2026-10-10/validated-source-7dd92427f.json`।

ব্যবহারকারীর নির্দিষ্ট অনুমতি অনুযায়ী Chrome menu-এর Quit দিয়ে স্বাভাবিকভাবে বন্ধ করা হয়েছে। অনুমোদিত সাতটি পুরোনো rollback runtime-এর নতুন archive T7-এর `backup/context-error-fix-2026-10-10/older-runtime-archives/`-এ রাখা হয়েছে। প্রতিটি archive-এর সব file content SHA-256, symlink, hardlink ও mode যাচাই, সম্পূর্ণ inventory coverage এবং removal-এর আগে source আবার hash মিলিয়ে শুধু internal duplicate সরানো হয়েছে। নতুনতম `20261009-225858` ও `20261010-101645` rollback internal disk-এ আছে। Live runtime, database এবং release `.tgz` অক্ষত। এই relocation-এ মেপে internal free space প্রায় ১৬.১২ GiB বেড়ে ২৯.১২ GiB হয়েছে; archive process peak 603.39 MiB, pressure সর্বদা normal, swap বৃদ্ধি শূন্য। পূর্ণ receipt: `~/Library/Caches/NexaLance/omniroute-gpt-empty-response-2026-10-10/approved-runtime-relocation-result.json`।

আগের সফল worktree `dist` মুছে বা overwrite করা হয়নি। একই volume-এ নতুন `~/.omniroute-builds/3.8.51-0b62ea8e7/preserved-worktree-dist-20261010-context-error` path-এ রাখা হয়েছে; ১৯,৭২৩টি entry-এর পূর্ণ content/mode/symlink ও একই inode/device যাচাই PASS।

এই addendum লেখা পর্যন্ত নতুন production build/deployment সম্পন্ন নয়। একটি resource preflight compile শুরু করতে দেয়নি; ৩ GiB ও ৪ GiB heap-এর দুই full compile চেষ্টা compiler-এর নিজস্ব heap limit-এ থেমেছে। কোনো system pressure warning বা swap বৃদ্ধি হয়নি। উভয় failed attempt, partial output ও log সংরক্ষিত; source auto-restore শেষে clean/pristine। আগে সফল ৫ GiB heap ও এক worker profile-এর জন্য ৭ GiB job cap-এর বাইরে ১০ GiB system reserve মেপে admission নেওয়া হচ্ছে। Guard bypass বা অন্য app বন্ধ করা হয়নি। সফল package, isolated smoke, promotion ও live QA-এর ফল পরের addendum-এ আলাদাভাবে যোগ করতে হবে; source commit বা artifact উপস্থিতিকে deployment complete ধরা যাবে না।


## ২০২৬-১০-১০ — GPT context-overflow fix: full build, production deployment ও bounded live QA সম্পূর্ণ

`7dd92427f391f592cc1914bec54ae0e7feb97f88` এখন production-এ চলছে। Main `nexalance` এবং পরীক্ষিত `fix/native-context-error-2026-10-10` worktree একই commit-এ clean ও pristine। বাস্তবায়ন ও commit attribution: Jillur Rahman। Public OSS push বা PR করা হয়নি।

### সংশোধিত আচরণ

Responses API-এর buffered response-এ `error.code=context_length_exceeded` থাকলে translation-এর আগে তা শনাক্ত করা হয়। Claude client এখন HTTP `400`, `invalid_request_error`, `context_length_exceeded` এবং native client চেনার উপযোগী `prompt is too long…` বার্তা পায়। এই deterministic context failure আর ভুল `upstream_empty_response` 502 হয় না। Native client-এর ভুল transient-error retry বন্ধ হওয়ার contract পরীক্ষা PASS। Partial output, missing status এবং recovery tail-এর ক্ষেত্রও regression-এ অন্তর্ভুক্ত। প্রকৃত empty response ও server failure-এর বিদ্যমান 502 handling রাখা হয়েছে।

Routing, selected effort, account enable/disable, quota বা compression configuration বদলানো হয়নি। Context limit পেরোনো অত্যন্ত দীর্ঘ পুরোনো conversation-এ ব্যবহারকারীকে Claude-এর `/compact` বা নতুন session ব্যবহার করতে হতে পারে।

### Source validation ও পূর্ণ release build

- Focused regression ১১/১১ PASS; related regression মোট ২১০/২১০ PASS, যার মধ্যে ওই ১১টি অন্তর্ভুক্ত। Core typecheck PASS। Full TypeScript ratchet ৫৮২২, baseline ৫৮৩০: PASS। Hash-verified source evidence পুনর্ব্যবহার করা হয়েছে।
- ২০২৬-১০-১০ ১৩:২০:২১ Dhaka-তে সম্পূর্ণ production pipeline exit `0`: webpack production compilation, ৬২০ static page, standalone output, dashboard gate, CLI API ও command generation, pack-artifact policy, final `npm pack`, strict Bridge package gate—সব PASS।
- Strict Bridge receipt: `sourceAndDistMatch=true`, `sharedLifecycle=true`; packaged server SHA-256 `c77f5535a65f45e0e5a75b8cc010fa1bde4cff750ba9c4049b38e8909d8af8db`।
- সফল profile: one worker, webpack memory optimizations, ৫১২০ MiB heap, ৮১৯২ MiB total process cap, semispace ৮, `RAYON_NUM_THREADS=1`; desktop build/deploy flags `0`।
- Build watchdog-এর সর্বোচ্চ মাপা child-group RSS ৭৪১৯ MiB; outer sample peak ৭৪০৬ MiB। Minimum physical headroom ১৬.৩৪৩৯ GiB। Pressure সবসময় normal; swap-এর সর্বোচ্চ মাপা বৃদ্ধি প্রায় ০.০৭ MiB। Render overlap বা guard bypass হয়নি।
- আগের ৩ GiB ও ৪ GiB compiler-heap failure ও preflight evidence অক্ষত রাখা হয়েছে। সফল profile-এ ওই compiler failure আর হয়নি। Build শেষে ১২৯টি generated/changed CLI file exact inventory অনুযায়ী restore হয়েছে; source clean/pristine। সফল `.build`, `dist` ও release artifact সংরক্ষিত।

Verified artifact:

```text
~/.omniroute-builds/3.8.51-7dd92427f/omniroute-3.8.51.tgz
bytes: 99592471
SHA-256: 226898f0199bd6c99c35c1050ca56fc508f8be30cd79ea4d147c69c0fc8d1951
archive dist/BUILD_SHA: 7dd92427f
```

### Production promotion ও data preservation

Main-এর নতুন `nexa/deploy/omni-updater.sh redeploy`-এ exact `NEXA_DEPLOY_ARTIFACT` ব্যবহার হয়েছে। Isolated package install, real Anthropic-format `codex/gpt-6.1-sol` smoke, consistent database snapshot, complete previous runtime preservation, promotion, runtime SHA, health ও native Bridge TLS checks সফল হয়েছে। Deployment ১৩:২২:০৪ Dhaka-তে exit `0`।

Deployment watchdog: ৩০৭২ MiB cap, peak ১৫০৯ MiB, minimum system headroom ১৮.৬৬৫৬ GiB, normal pressure, swap growth ০। Resource failure বা promotion-এর মধ্যে updater interruption হয়নি।

- Live runtime `BUILD_SHA`: `7dd92427f`; `http://127.0.0.1:28128/healthz` এবং `http://omni.local/healthz` HTTP `200`।
- Complete previous runtime: `~/.omniroute-builds/runtime-backups/20261010-132044`, `BUILD_SHA 0b62ea8e7`। `previous-runtime` pointer সেখানেই আছে; previous package-ও রাখা হয়েছে।
- Consistent snapshot: `~/.omniroute-local/update-backups/20261010-132044`; SQLite backup API এবং `PRAGMA integrity_check` → `ok`।
- Fresh pre/post deployment inventory: ২৩ provider connection, ২২ active; ৩ API key; ১৪ Bridge mapping। Provider ID/state, API-key ID/value/state এবং mapping content hashes মিলেছে। Usage history ৭৯৩৭৭ retained; live QA-পরবর্তী count ৭৯৩৮০।
- CA certificate, private key ও runtime intent-এর hash অপরিবর্তিত। `targets.json` এবং `bypass.json`-এ শুধু `generatedAt` বদলেছে; timestamp বাদ দিয়ে configuration সমান। Credential values প্রকাশ করা হয়নি।

### Actual client ও live routing checks

| পরীক্ষা | ফল |
| --- | --- |
| Trusted native TLS `api.anthropic.com` → saved `claude-opus-5-5` alias | HTTP ২০০, exact marker; actual provider `codex`, model `gpt-6.1-sol`; selected `low` → upstream `low`; trace checksum ও SHA-256 verified |
| আসল installed Claude Code CLI দিয়ে `Read` | PASS; ২ turn, exact private fixture content, ২ successful request; trace-এ actual `Read` tool call ও tool result পাওয়া গেছে |
| একই live CLI request-এর effort | দুই request-এই requested `max` → upstream `max`, actual `gpt-6.1-sol`; ৫০২ বা tool error হয়নি |
| Deployed package-এর overflow handler + installed CLI `2.1.294` | Local fixture PASS; সঠিক ৪০০ context failure শনাক্ত; ১ message request; misleading ৫০২ ও retry loop নেই |
| একই deployed handler + VS Code extension-এর actual bundled binary `2.1.295` | Local fixture PASS; সঠিক ৪০০ context failure শনাক্ত; ১ message request; misleading ৫০২ ও retry loop নেই |

Live CLI read test ৫.৮৭৬ সেকেন্ডে শেষ হয়েছে; measured peak ২০৪ MiB। Error fixture-গুলো isolated local endpoint/database ব্যবহার করেছে, upstream quota খরচ করেনি। Test harness-এর package-alias import সমস্যা local bootstrap-এ সমাধান হয়েছে; deployed application file বদলানো হয়নি। Fixture-তে CLI exit `1` প্রত্যাশিত error outcome; harness assertions PASS ও overall exit `0`। দ্রুত শেষ হওয়া VS Code fixture-তে memory sample ধরা পড়েনি; receipt-এর peak `0` কোনো zero-memory দাবি নয়।

এই run-এর যাচাই scope হলো নির্দিষ্ট buffered context error, native TLS, actual CLI `Read`, selected GPT effort এবং দুই installed client-এর error contract। Claude Desktop GUI-এর সম্পূর্ণ feature suite এই run-এ পুনরায় পরীক্ষা করা হয়নি; বৃহৎ পুরোনো conversation provider-এ আবার পাঠানো হয়নি।

### অনুমোদিত resource কাজ ও সংরক্ষণ

আগে অনুমোদিত সাতটি পুরোনো rollback runtime T7-এ নতুন archive হিসেবে রাখা হয়েছে। File/hash/mode/link inventory যাচাই করে শুধু internal duplicate সরানো হয়েছে; সেই cleanup-এ measured internal free-space বৃদ্ধি ১৬.১২০৪৫ GiB। Live runtime, database, protected package ও তখনকার নতুনতম দুই rollback রাখা হয়েছে। সফল আগের worktree `dist` একই volume-এ নতুন preservation path-এ সরিয়ে পূর্ণ inventory/hash মিলিয়ে রাখা হয়েছে।

ব্যবহারকারীর নির্দিষ্ট অনুমতিতে Chrome, এরপর Sublime Text ও WhatsApp স্বাভাবিকভাবে quit হয়েছে। শেষ দুই app-এ `Quit and Keep Windows` ব্যবহার হয়েছে; unsaved content discard করার action নেওয়া হয়নি। অন্য app/session/service বন্ধ করা হয়নি। Final resource check-এ normal pressure, physical headroom ১৫.৪১ GiB ও internal free disk প্রায় ২৪.৫১ GiB ছিল; heavy কাজ তখন শেষ। Task evidence/cache প্রায় ৪০.৯ MiB। Existing heartbeat status `PAUSED` আছে।

### Evidence locations

- Completion receipt: `~/Library/Caches/NexaLance/omniroute-gpt-empty-response-2026-10-10/completion-receipt-7dd92427f.json`
- Full build receipt: `~/.omniroute-builds/3.8.51-7dd92427f/full-build-receipt.json`
- Full build log: `~/Library/Caches/NexaLance/omniroute-gpt-empty-response-2026-10-10/full-build-7dd92427f-20261010-proven-profile.log`
- Deployment receipt: `~/.omniroute-builds/3.8.51-7dd92427f/deploy-result-2026-10-10T07-20-44.201Z.json`
- TLS receipt: `~/Library/Caches/NexaLance/omniroute-gpt-empty-response-2026-10-10/postdeploy-native-tls-2026-10-10T07-22-20.128Z/summary.json`
- Live CLI receipt ও trace: `~/Library/Caches/NexaLance/omniroute-gpt-empty-response-2026-10-10/real-cli-live-read-8FB5nS/`
- Packaged error fixtures: `~/Library/Caches/NexaLance/omniroute-gpt-empty-response-2026-10-10/packaged-cli-contract-HmaE2J/receipt.json` এবং `~/Library/Caches/NexaLance/omniroute-gpt-empty-response-2026-10-10/packaged-cli-contract-d3xxPC/receipt.json`
- Retained data/rollback receipt: `~/Library/Caches/NexaLance/omniroute-gpt-empty-response-2026-10-10/postdeploy-preservation-receipt.json`
