# OmniRoute বর্তমান handoff — ২০২৬-১০-১৭

রক্ষণাবেক্ষণ: Jillur Rahman / NexaLance।

এই handoff ২০২৬-১০-১৪-এর শেষ QA সংযোজন, ২০২৬-১০-১৭-এর disk migration verification এবং overlay repository audit একত্র করে। পুরোনো নথির শুরুতে থাকা `pending`, `ACTIVE`, `private` বা runtime SHA-কে বর্তমান অবস্থা ধরে নেবেন না; সেগুলো তাদের নিজস্ব সময়ের record। [সম্পূর্ণ document index](README.md) থেকে ইতিহাস পড়া যায়।

## Source ও repository

| বিষয় | যাচাইকৃত অবস্থা |
| --- | --- |
| Overlay distribution | [`developerjillur/omniroute-optimizer`](https://github.com/developerjillur/omniroute-optimizer), public |
| Application source snapshot | `2b4158371223293db12d3a6de00a9b22d44600fb`, `nexalance` |
| Upstream base | OmniRoute `3.8.51`, `c1e30b7676975feb298b49eff6ff58923c04b89e` |
| সংরক্ষিত `nexa/` tree | `1bacd361751ca84dae89fbea0324fd8198f052b5` |
| Source synchronization commit | `6acab81de3dbb89962c2571de5f0d369b874be6a` |
| Source coverage | 342/342 tracked overlay file-এর bytes, hashes ও modes মিলে |
| Manifest | 166 patches, 95 new files, 5 tooling entries; মোট 266 entries |
| Published inventory | [overlay-inventory.json](../../overlay-inventory.json) |

২০২৬-১০-১৭ audit-এ application checkout clean ও pristine ছিল। Application fork-এর remote `nexalance` তখন local source থেকে 30 commits পিছিয়ে ছিল; এই overlay distribution-এর 342টি file সম্পূর্ণ synchronized ছিল। Source fork ও overlay distribution আলাদা repository; একটির push অন্যটিকে update করে না।

এই documentation সংযোজন application code বা `nexa/` snapshot পরিবর্তন করে না। এটি full application, dependencies, operator state বা runtime backup নয়।

## সম্পন্ন কাজ

| কাজ | শেষ সংরক্ষিত ফল ও সীমা |
| --- | --- |
| Source validation | Strict patches 166/166, native 131/131, related 284/284, deployment 22/22; core typecheck ও full ESLint PASS |
| Full TypeScript ratchet | `5806 ≤ 5830` PASS; upstream type backlog শূন্য হয়নি |
| Full production package | Dashboard 620 static pages, CLI generation, package ও strict Bridge gates PASS |
| Deployment | Verified package, isolated Anthropic-format smoke, management auth, migration, Bridge/CORS, active-request drain ও consistent snapshot-এর পরে runtime promotion সম্পন্ন |
| Installed runtime | `3.8.51`, `BUILD_SHA=2b4158371`; migration verification-এ health ও startup path কাজ করেছে |
| Native ingress | Installed source committed bytes-এর সঙ্গে মিলে; native TLS/DNS health যাচাই হয়েছে |
| State retention | Provider/API-key IDs, operator settings/mappings এবং historical usage/call prefixes retained; rollback পৃথকভাবে সংরক্ষিত |
| Pricing | Exact historical cutoff/dimension-এর 19,951 rows-এর API-equivalent estimate মিলে; এটি subscription invoice বা quota meter নয় |
| Native Artifact basic QA | নিজস্ব Artifact create/publish/read/edit/reopen, `QA EDIT OK version 2`; Read ও Context7 read-only documentation execution PASS |
| Interactive CLI | Normal Read/Edit/Read, manual permissions, hooks ও saved-session restart/resume PASS |
| Focused route matrix | GPT, GLM ও return-Claude-এর actual Read/result/final/provider evidence PASS |
| Overlay publication | সব 342টি source file সংরক্ষিত; ২০২৬-১০-১৭-এ repository public visibility ও anonymous access নিশ্চিত |

Package identity:

```text
omniroute-3.8.51.tgz
bytes: 99699156
SHA-256: 02f6e6dfe3e27b712341e32f6338e0f9308bf24a3026e8bba75de909141dc7ad
source: 2b4158371223293db12d3a6de00a9b22d44600fb
```

Package ও runtime/database archives এই public repository-তে নেই।

## Focused CLI QA-এর নির্দিষ্ট সীমা

- GPT `codex/gpt-6.1-sol`: actual Read ও saved V2 tool result যাচাই হয়েছে। প্রথম sequence অন্য heavy job শুরু হওয়ায় resource guard থামায়; পরে saved result থেকে resume করে exact final ও HTTP 200 provider evidence মিলে। এটি resumed sequence-এর PASS; uninterrupted run নয়।
- GLM `glmt/glm-5.3-max`: নতুন Read, fixture result, exact final ও `glmt` HTTP 200 evidence PASS। CLI response model `glm-5.3`; route/catalog model `glm-5.3-max`।
- return-Claude `claude-sonnet-5-5`: native default credentials-এ নতুন Read ও exact final PASS। Actual execution নিজস্ব transcript ও পরের provider request-এর tool-result দিয়ে প্রতিষ্ঠিত; empty retained Read-response summary থেকে raw response fidelity দাবি করা হয়নি।

Completed CLI route tests বা ছোট forced-Read probe পুনরায় চালানোর প্রয়োজন নেই, যদি নতুন material application defect না পাওয়া যায়। Hosted connectors-এর availability সব provider-এ সমান—এমন দাবি এই QA করে না। বিস্তারিত [Native Artifact report-এর ২১:০২ UTC-এর শেষ QA সংযোজন](history/OMNIROUTE-NATIVE-ARTIFACT-RECOVERY-2026-10-14.md)-এ আছে।

## এখনো অসম্পূর্ণ

**নিজস্ব native Artifact-এর automatic comment-monitor recovery ও reconnect QA অসম্পূর্ণ। Full native QA PASS বলা যাবে না।**

আগের user session-এ carried Artifact monitors-এর generic resume notice আবার এসেছিল। Installed native client-এর rearm gate denial বা caught startup failure একই notice দিতে পারে; নির্দিষ্ট inner cause শনাক্ত হয়নি। `armed` record, successful publish, সাধারণ Artifact edit বা CLI route PASS automatic comment reply/reconnect recovery প্রতিষ্ঠা করে না।

Usage audit-এর documented limits-ও বহাল: direct-native equivalent-workload billing baseline/retention gap এবং 9 historical account transition unresolved। Source accounting/transport corrections সংরক্ষিত থাকলেও blanket zero-extra-usage guarantee নেই। বিস্তারিত [usage audit](history/OMNIROUTE-USAGE-AUDIT-2026-10-14.md)।

## Disk migration-এর পরে

২০২৬-১০-১৭ read-only verification-এ startup volume `Studio-2TB`, macOS `26.7.1`; boot disk-এ প্রায় 1.4 TiB free পাওয়া গেছে। Home/source/runtime location বজায় ছিল। Root ingress helpers, runtime listeners, `omni.local`, hosts ও CA trust যাচাই হয়েছে। [Command ও result-এর migration report](POST-MIGRATION-VERIFICATION-2026-10-17.md)-এ বিস্তারিত আছে।

Migration test-এ 59টি Node test ও 2টি database rollback test PASS। একটি fixture-cleanup-dependent case স্পষ্টভাবে বাদ দেওয়া হয়েছিল; এটি পুরো suite-এর unrestricted PASS নয়। Updater-এর নিরাপদ dry-run mode নেই; `build-only` আসল build/install smoke করে, আর `nexa/update.mjs --dry-run` দিয়ে read-only behavior পাওয়া যায় না।

আগের `omniroute-native-artifacts-2026-10-14` task cache নতুন boot environment-এ পাওয়া যায়নি। T7-এর dated report ও এই public text copies বহাল আছে; এই repository-তে raw traces/screenshots আছে বা unavailable cache উদ্ধার হয়েছে—এমন দাবি করা যাবে না। পুরোনো internal system থেকে recovery করার অনুমতি পাওয়া যায়নি।

Automation `omniroute-build-deployment` **PAUSED**। পুরোনো documents-এর `ACTIVE` নির্দেশনা ঐতিহাসিক; checks ও owner-এর স্পষ্ট নির্দেশ ছাড়া resume নয়।

## অবশিষ্ট QA শেষ করার ধাপ

1. Owner-এর নির্দেশ পাওয়ার পরে fresh resource/process admission নিন। Boot disk-এ জায়গা থাকলেও RAM pressure ও render/build activity আলাদাভাবে যাচাই করতে হবে।
2. 30 seconds quiet window, normal memory pressure, physical free+inactive+speculative কমপক্ষে 13 GiB ও boot disk free কমপক্ষে 20 GiB নিশ্চিত করুন। Native QA RSS cap 3 GiB ও system reserve 10 GiB রাখুন।
3. Native UI-তে কেবল নিজস্ব QA session ও Artifact শনাক্ত করুন। Existing user chat/Artifact edit, Stop বা publish নয়। UI access-এর পুরোনো blocker বা আগের unlock confirmation-কে fresh observation মনে করবেন না।
4. নিজস্ব Artifact-এ একটি bounded comment/watch test করুন এবং automatic reply বাস্তবে UI-তে দেখুন। তারপর নিজস্ব session-এর reconnect/reopen-এর পরে monitor rearm ও পরের comment reply যাচাই করুন। শুধুমাত্র generated file বা armed intent যথেষ্ট নয়।
5. ব্যর্থ হলে exact own target, সময় ও sanitized diagnostic সংগ্রহ করুন। Generic notice থেকে gateway/client/RAM/inference/billing root cause অনুমান করবেন না। নতুন application defect প্রমাণিত হলে সেটির জন্য ছোট reproduction ও overlay fix তৈরি করুন।
6. Actual result অনুযায়ী নতুন dated QA receipt ও handoff update করুন। Required UI evidence ছাড়া full QA complete বা permanent watcher fix লিখবেন না।

## বর্তমান কাজের নিয়ম

- Application customization শুধু `nexa/patches/` ও `nexa/new/`-এ; upstream application files pristine থাকবে। Overlay distribution-এর index ও reports application patch নয়।
- Build, deploy, LaunchDaemon change, sudo বা git push-এর আগে owner-এর নির্দিষ্ট অনুমতি নিন। Normal commit hooks বহাল থাকবে; `--no-verify`, force push, stash বা quality baseline বৃদ্ধি নয়।
- Live service অপরিবর্তিত রেখে gate ও isolated smoke আগে সম্পন্ন করতে হবে। Verified artifact থাকলে তা পুনর্ব্যবহার করুন; storage migration একা rebuild/deploy-এর কারণ নয়।
- Pressure warning/critical, physical headroom <8 GiB, swap growth >1 GiB, boot free <15 GiB বা own QA RSS >3 GiB হলে শুধু বর্তমান task-এর own child নিরাপদে থামান। Unrelated apps, tabs, sessions, services বা অন্য job বন্ধ নয়।
- বর্তমান home-এর source/runtime ব্যবহার করুন। Fallback internal system-এর `/Volumes/Data` ও `/Volumes/Macintosh HD` থেকে read/build/deploy/cleanup নয়।
- কিছু delete নয়। T7-এর original document, source, assets, successful package, live data ও rollback রাখুন। T7 overwrite/delete-এর জন্য আলাদা explicit confirmation প্রয়োজন।
- Official Claude client binary, code, global settings, login বা existing user chat/Artifact patch/edit নয়। Optional loopback inspector token rotation-এর অনুমতি এই documentation কাজ দেয় না।

## প্রাসঙ্গিক মূল নথি

- [Consolidated historical handoff](history/HANDOFF-OMNIROUTE-2026-10-03-CONSOLIDATED.md)
- [Native Artifact recovery, pricing ও final focused CLI QA](history/OMNIROUTE-NATIVE-ARTIFACT-RECOVERY-2026-10-14.md)
- [Usage audit ও unresolved limits](history/OMNIROUTE-USAGE-AUDIT-2026-10-14.md)
- [Versioned deployment ও rollback runbook](../../nexa/deploy/README.md)
- [Overlay layout](../../nexa/README.md)
- [Publication manifest](manifest.json)
