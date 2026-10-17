> **ঐতিহাসিক নথি — public copy, ২০২৬-১০-১৭।** মূল ঘটনার তারিখ ও ফল এই নথির নিজস্ব সময়ের জন্য প্রযোজ্য; পরের সংযোজন থাকতে পারে। বর্তমান অবস্থা ও কাজের নিয়মের জন্য [বর্তমান handoff](../CURRENT-STATUS-2026-10-17.md) পড়ুন। Private reference ও identifier সরানো হয়েছে; স্থানীয় evidence এখানে অন্তর্ভুক্ত নেই। পুরোনো cleanup, build, deploy বা service command বর্তমান অনুমতি হিসেবে ব্যবহার করবেন না।

<!-- usage-audit-2026-10-14-cutoff-20261014T102906Z -->
# Native usage audit — 2026-10-14

লেখক: Jillur Rahman

## বর্তমান অবস্থা

Retained data-এর read-only audit সম্পন্ন হয়েছে। নতুন usage/transport patches ও regression tests প্রস্তুত হচ্ছে; এগুলো এখনো application validation, full build, deployment বা native UI QA পাস করেনি। আগের runtime `0c0d3b1d4`-কে এই পরিবর্তনের deployment বলা যাবে না।

Audit window: `2026-10-06T18:00:00.000Z` থেকে `2026-10-14T10:29:06.166Z`। Private evidence: `~/Library/Caches/NexaLance/omniroute-usage-audit-2026-10-14`। Credential, prompt, private URL, signature বা hidden reasoning report-এ প্রকাশ করা হয়নি।

## Coverage ও সীমা

- Window-এর 99,570 usage-history row এবং 93,283 call-log row পরীক্ষা করা হয়েছে। Call metadata-তে 85,925 success ও 7,358 failure আছে; test traffic, cancellation ও missing Thread-ও এর মধ্যে আছে।
- 836টি native transcript-এর 12,219,221,117 byte prefix পড়া হয়েছে। Streamed blocks ও copied histories deduplicate করার পরে 75,372 response পাওয়া গেছে। 2টি oversized user record বাদ পড়েছে; oversized assistant candidate বা invalid assistant record পাওয়া যায়নি।
- 10,001 retained artifact reference ছিল। প্রথম scan-এ 9,954টি পাওয়া গেছে; পরের scan-এ retention-এর কারণে 9,922টি ছিল। পড়া artifact-এর size/FNV checksum মিলে গেছে এবং নতুন SHA-256 রাখা হয়েছে। Retention-এর বাইরে metadata থেকে হারানো raw payload পুনর্গঠন করা হয়নি।
- Gateway, ingress, native app ও launchd-এর 20টি retained log পরীক্ষা করা হয়েছে। কিছু native app log পুরোনো তারিখও ধরে রেখেছে; clock-only diagnostic line-এ কল্পিত UTC date বসানো হয়নি। Generic `429` text-কে rate-limit request হিসেবে গণনা করা হয়নি।
- Native raw-direct bypass-এর একই workload/model/effort/parallelism control নেই। শুধু মোট token বা cache ratio দেখে subscription quota-তে OmniRoute কত শতাংশ বেশি খরচ করেছে বলা যায় না। Historical `response_id`/retry metadata-র ঘাটতিও exact correlation সীমিত করে।

## নিশ্চিত usage ত্রুটি

### Sparse Thread usage-কে stateless request ধরে rewrite

Native continuation-এর `thread.type="continue"` এবং `thread.previous_message_id` server-side context বোঝায়। Existing sanity check এই reference চিনতে না পেরে ছোট wire body-এর বিপরীতে বড় provider-reported context-কে implausible ধরে local estimate বসায় এবং cache counters শূন্য করে। একই response-এর `usage.iterations`-এ original provider counters থেকে যায়।

51,350টি deduplicated response-এ valid iterations আছে; 36,401টিতে top-level native usage ও preserved iteration usage আলাদা। সব observed iteration array-এর length 1; কোনো actual compaction iteration পাওয়া যায়নি। তাই এই count-কে অতিরিক্ত generation/compaction request বলা যাবে না।

Unique model/output/time association-এ 46,439টি gateway row iteration usage-এর সঙ্গে মিলেছে। 36,137টিতে recorded cache read শূন্য হলেও preserved provider metering-এ cache read আছে। এটি heuristic association; 6টি exact response-ID association আলাদা করে রাখা হয়েছে।

Proposed change valid Thread reference-এর usage অপরিবর্তিত রাখে। Malformed/empty Thread ও stateless bogus-usage guards বহাল থাকে। Internal metering valid iterations থেকে সম্পূর্ণ request গণনা করে; native wire payload পরিবর্তন করে না।

### Stream input/cache accounting

Sparse final `message_delta`-র input count দিয়ে আগের inclusive total overwrite হতে পারে; translator cache creation-কে total input থেকে বাদও দিচ্ছিল। এতে cache write total input-এর চেয়ে বড় হয় এবং API-equivalent estimate/context display ভুল হতে পারে। নতুন helper raw fields presence অনুযায়ী cumulative counters merge করে, explicit zero সম্মান করে এবং cache creation একবারই inclusive input-এ রাখে। Thinking ইতোমধ্যে output-এর অংশ; আবার যোগ করা হয় না।

[Anthropic prompt-caching documentation](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) অনুযায়ী fresh input, cache read ও cache creation তিনটি আলাদা input dimension। [Threshold-compaction usage documentation](https://platform.claude.com/docs/en/build-with-claude/compaction-threshold) সম্পূর্ণ metering-এর জন্য iterations গণনা করতে বলে।

### Native tool-only content ও correlation

Native tool-only stream-এর বদলে chat-shaped empty summary দিয়ে `has_content=0` লেখা হচ্ছিল। Proposed change client-format native summary ব্যবহার করে, server/MCP tool blocks চিনতে পারে এবং successful native message ID exact future correlation-এর জন্য রাখে। Empty log summary-কে empty client response বা token waste বলা হয়নি।

## Transport replay: খরচের ঝুঁকি

Literal diagnostic marker অনুযায়ী pooled-dispatcher response-start timeout-এর 475টি replay line আছে: Anthropic host 137, OpenAI/ChatGPT 68, Z.ai 3, অন্য/অজানা 267। Host-only log সব request-এর method/path বা upstream acceptance ধরে রাখে না; তাই এগুলোকে 475টি duplicated generation বা billed charge বলা যায় না।

Source-এ serializable generation POST-ও headers/socket failure-এর পরে silently replay হচ্ছিল। প্রথম request accepted হলে নতুন POST দ্বিতীয় inference শুরু করতে পারে। Proposed guard ambiguous generation failure-এ replay বন্ধ করে; explicit DNS/connect failure এবং safe read recovery থাকে। Non-idempotent request caller deadline ব্যবহার করে, যাতে ছোট pooled-socket timer healthy slow generation বন্ধ না করে। এটি synthetic accepted-request regression দিয়ে যাচাই করতে হবে।

## বড় usage-এর বৈধ অংশ

Preserved iteration metering পাওয়া গেলে সেটি ব্যবহার করে deduplicated native totals:

| Dimension | Tokens |
| --- | ---: |
| Fresh input | 128,767,737 |
| Cache read | 21,606,453,360 |
| Cache creation | 787,158,692 |
| Output, thinking-সহ | 85,285,909 |
| Output-এর মধ্যে reported thinking | 35,396,799 |

44,371 response child session-এর; child output 54,948,082 এবং child cache creation 640,528,882। এগুলো native client-এর বাস্তব কাজ, gateway নিজের তৈরি duplicate হিসেবে চিহ্নিত করা হয়নি। Cache read-এর বড় সংখ্যা fresh input নয়। এই totals subscription invoice বা weekly allowance-এর হিসাব নয়।

বর্তমানে compression master এবং 12টি engine বন্ধ, semantic cache বন্ধ, native prompt cache/affinity চালু। Audit window-তে compression telemetry row নেই; current settings পুরো অতীতের configuration-এর স্বাধীন প্রমাণ নয়। Explicit requested public model নামের comparison-এ audio provider prefix ছাড়া unexpected model replacement পাওয়া যায়নি। Alias/combo/operator mapping ও account fallback আলাদা বিষয়।

## Error follow-up

`0c0d3b1d4` deployment-এর পরে Claude metadata-তে 500 missing-Thread 404, 62 disconnect/cancel 499, 6 content-stall 502, 10 timeout 504, 9 context-limit 400, 8 অন্য 400, 1 rate-limit 429 ও 5 অন্য 502 আছে। এগুলোর সবগুলো gateway defect বা wasted inference নয়। Missing Thread/hidden thinking progress/timeout recovery-এর আগের prepared fixes এখনও নতুন runtime-এ deploy হয়নি। আগের thinking-signature error deployment-এর আগে; পরের window-তে একই error পাওয়া যায়নি।

## বাকি release gate

1. নতুন regression-এর red/green reproduction, related native/usage/stream/transport tests, core typecheck, full lint ও full ratchet। আগের 273-test evidence নতুন affected source-এর validation নয়।
2. Exported overlay/manifest ও hook-পরের application hashes যাচাই, Jillur Rahman identity এবং normal hooks দিয়ে commit।
3. 18 GiB physical headroom ও অন্তত 20 GiB internal disk হলে নতুন immutable full dashboard/CLI/package/Bridge build। Desktop flags 0।
4. Snapshot/rollback, isolated Anthropic smoke, resource-bounded deployment ও installed ingress update; active request drain ছাড়া reload নয়।
5. বাস্তব Claude native app ও normal Claude Code session-এ Artifact create/edit/follow-up/reopen, thinking progress, full Thread replay, read-only tool/connector ও Claude/GPT/GLM regression। Native UI না দেখে UI success নয়।

Validation/deploy admission 13 GiB physical; full build 18 GiB। Apps বন্ধ করা, reserve কমানো বা পুরোনো artifact-কে নতুন build বলা অনুমোদিত নয়। Historical database rows rewrite করা হয়নি; corrected audit evidence আলাদা রাখা হয়েছে।


## Source export ও account-selection audit

Source patches export করা হয়েছে; application base pristine, branch `fix/native-artifact-recovery-2026-10-14`, baseline `0c0d3b1d4aa8336f03261e80d75bcab3f53fd019`। Latest receipt `source-prepared-v5.json`, 341 overlay files, 40 expected changed application files; inventory `c89bbd4d317af6a5d9e55d957ed16146976fc64540ad505e137e71ffa5c86345`। New formatter/strict applicability/application tests/full lint/ratchet/build/deploy/native UI QA এখনও পাস করেনি। Follow-up runner `validate-prepared-v5.mjs` receipt-এর SHA দিয়ে bound; resource admission পেলে formatter নতুন numbered source receipt তৈরি করে exact old baseline red reproduction ও final green tests চালাবে। পুরোনো evidence overwrite করা হবে না।

Cache group অনুযায়ী 53,349 successful Claude rows-এ 4,177 group পাওয়া গেছে; 18 group একাধিক account ব্যবহার করেছে, মোট transition 19। 5টি transition 1-hour TTL-এর পরে, 5টি TTL-এর মধ্যে nearby failure-সহ এবং 9টি TTL-এর মধ্যে nearby recorded failure ছাড়া। এই 9টির কারণ unresolved; quota/eligibility/operator action বা unlogged retry বাদ দেওয়া যায়নি। Current native affinity 24-hour TTL-সহ enabled; current authority `key_value`-এর `session_account_affinity` namespace। একই নামের পুরোনো empty table-কে inactive affinity-এর প্রমাণ ধরা হয়নি।

Authoritative audit evidence 22টি file, 145,427,370 bytes; private task directory প্রায় 163 MiB। 13টি completed read-only stage-এর source/log hashes final audit receipt-এ যাচাই করা হয়েছে। Audit থেকে নতুন model inference call করা হয়নি; live database/runtime/config বদলানো হয়নি। নতুন source fix এখনো validated/deployed নয়।

Final audit receipt: `~/Library/Caches/NexaLance/omniroute-usage-audit-2026-10-14/audit-final-receipt.json`। Follow-up active থাকবে; full deployment ও বাস্তব native QA সম্পূর্ণ হওয়ার আগে pause/completion নয়।


## 2026-10-14 18:20 Dhaka — source validation ও নতুন build

<!-- source-validated-build-started-2b4158371-20261014T121828Z -->

Source commit `2b4158371223293db12d3a6de00a9b22d44600fb` normal hooks-সহ সম্পন্ন; author/committer Jillur Rahman। Commit-এর পরে 41টি application hash validated bytes-এর সঙ্গে মিলেছে; source clean/pristine।

Final gate `validation-2026-10-14T12-10-59.202Z/validation-receipt.json`: strict applicability 166/166; old7 baseline-এ native usage/POST replay failing assertions reproduce; new native 131/131, related usage/stream/analytics/transport 284/284, core typecheck ও full ESLint PASS। Unchanged deployment 22/22 exact source/test/log hashes মিলে reused। 10 unused suppressions removed, none added/widened। Usage payload export, new test narrowing ও SQLite row boundary typing corrected।

Full TypeScript ratchet measured 5806, established baseline 5830, PASS; known upstream backlog থেকে zero-error full typecheck দাবি নয়। 3 GiB ও 5 GiB profiles SIGABRT/SKIP-এ rejected ছিল। Human approval-এ শুধু full ratchet heap6144MiB/RSS8192MiB-এ সম্পূর্ণ হয়েছে, peak5195MiB; reserve10GiB এবং সব stop guards বহাল। অন্য validation/deploy cap3GiB।

Authoritative source receipt: `~/Library/Caches/NexaLance/omniroute-native-artifacts-2026-10-14/validated-source-2b4158371.json`। Full dashboard/CLI/package build এখন চলছে `~/.omniroute-builds/3.8.51-2b4158371`-এ; log `full-build-launch-2b4158371-20261014T121828Z.log`। Build preflight-এ physical18.697GiB, internal73.409GiB, pressure normal। Desktop build/deploy flags0। এই entry build completion/deployment/native QA প্রমাণ নয়।

Live package promotion, installed ingress update, pricing cutoff comparison, real native app/normal CLI Artifact/thinking/Thread/connector/route QA এবং final private optimizer sync বাকি। Audit-এর unresolved9 account transitions এবং missing direct equivalent-workload baseline-এর কারণে zero-extra-usage guarantee দেওয়া হয়নি।


## build-complete-2b4158371-20261014T124414Z

পূর্ণ dashboard build (620 static pages), CLI generation, npm pack validation, strict Bridge এবং compaction/connector/thinking package gates PASS। Source commit `2b4158371223293db12d3a6de00a9b22d44600fb`; normal hooks ও post-hook application hashes verified। নতুন package `3.8.51-2b4158371/omniroute-3.8.51.tgz`, 99,699,156 bytes, SHA-256 `02f6e6dfe3e27b712341e32f6338e0f9308bf24a3026e8bba75de909141dc7ad`, packaged BUILD_SHA `2b4158371`। Authoritative receipt: internal artifact directory-এর `build-completion-receipt.json`। Original build receipt-এ successful pack-এর পর পুরোনো verifier contract failure সংরক্ষিত; corrected external behavioral verifier ও resumed package gates PASS, compile/pack পুনরাবৃত্তি হয়নি।

Build peak RSS 7166 MiB, minimum physical headroom 14.8304 GiB, swap growth 0, pressure normal। Source worktree clean/pristine; main `nexalance` exact source-এ fast-forward হয়েছে। Deployment-এর প্রথম launch 13 GiB physical admission-এ fail-closed হয়েছে; updater চালেনি। Live runtime তখনও prior release। Fresh admission-এর পরে deploy, updated installed native ingress, retained data/rollback verification এবং Claude native UI/normal Claude Code QA বাকি। Audit-এর নয়টি unexplained account transition এবং direct native comparison gap এখনো unresolved; blanket no-extra-usage guarantee দেওয়া হয়নি। Apps বন্ধ হয়নি।


## 2026-10-14 — deployment, ingress ও native QA ফল

Source ও live runtime `2b4158371`। Verified নতুন package পুনর্ব্যবহার করে deployment 13:06:29 UTC-এ code 0। Isolated Anthropic-format smoke, management auth, Bridge, migration, model ও CORS gates PASS। Active request স্বাভাবিকভাবে শেষ হওয়ার পরে drain এবং consistent snapshot নিয়ে promotion হয়েছে। Deploy peak 1345 MiB, minimum physical 11.9219 GiB, pressure normal, swap growth 0।

User-authenticated installer-এর পরে installed root native-ingress.mjs committed bytes-এর সঙ্গে exact match, idle timeout 1320000 ms; পুরোনো source/plist/binder backup retained। Live health ও উভয় native TLS gate PASS। Source SHA-256: `216dc5db4600c3596fe14c9393dcedc03959d755ecfec5a6e6e64029b08fa891`।

২৬ provider ও ৩ API-key IDs retained। Operator settings/mappings/combos semantic comparison PASS। Previous runtime inode/device অক্ষত। Snapshot-এর আগের usage_history 141305 rows ও call_logs 93584 IDs exact prefix hashes মিলে। Credential refresh/last-used counters ও catalog timestamps স্বাভাবিকভাবে বদলেছে।

GPT-6.1 Sol-এর exact cutoff `2026-10-14T06:20:59.934376+00:00`, dimension hash `2a4932b6c96b47ca3c496fe56aed505dfc0e0037e33edc1aeef9927c1c334016`, 19951 rows-এর historical API-equivalent estimate `$1583.4206430` exact মিলে। Live dashboard gpt-6.1-sol `$1578.28` দেখায়; এটি subscription invoice নয়।

নতুন native app QA Artifact create/publish/read, follow-up edit ও reopen PASS: `QA EDIT OK version 2` actual UI-তে দেখা গেছে। Read ও Context7 public read-only documentation connector PASS। Native progress `Working…`/token counter ও completed result observed। Normal interactive Claude Code Read/Edit/Read ও saved-session resume PASS; normal hooks ও manual permissions বহাল। Thread continuation এবং restart-এর full-history create request trace retained।

User session-এর comment-monitor warning bundled native client 2.1.295 থেকে এসেছে। পরে [private-artifact].html তৈরি ও publish observed, এবং নতুন watch state `armed` লেখা হয়েছে। Automatic comment reply tested নয়; specific inner exception পাওয়া যায়নি। Existing user session/Artifact edit বা response stop করা হয়নি।

Full QA এখনও incomplete: native custom-model access check GPT নামটি প্রত্যাখ্যান করেছিল; process-scoped existing-key gateway mode-এ response এসেছে কিন্তু Read কাজ সম্পন্ন হয়নি। Small tool fidelity probe, GLM ও return-Claude regression pending। Private optimizer copy prepared; final metadata/commit/push pending। Historical 9 unresolved account transitions ও direct-native billing baseline gap রয়ে গেছে; blanket zero-extra-usage guarantee দেওয়া হয়নি।


## ২০২৬-১০-১৪ — private sync সম্পূর্ণ, native monitor QA অবশিষ্ট

- Verified deployed source `2b4158371`-এর সব 342টি `nexa/` file private `developerjillur/omniroute-optimizer` repository-তে sync হয়েছে। Private commit `6acab81de3dbb89962c2571de5f0d369b874be6a` normal hooks ও Jillur Rahman author/committer দিয়ে তৈরি; normal push-এর পরে remote `main` একই SHA, working tree clean এবং সব 342 file-এর hash exact। Public OSS-এ কোনো push/PR/issue হয়নি।
- ছোট GPT forced-Read control probe-এর HTTP 200/exact `Read` tool-use PASS evidence পুনর্ব্যবহার হয়েছে; নতুন probe request হয়নি। Broad normal CLI Read এখনও unresolved; focused GPT/GLM/return-Claude tool regression বাকি।
- ব্যবহারকারী live functionality কাজ করছে বলে জানিয়েছেন। পরে running research chat-এ পাঁচটি saved Artifact-এর generic comment-monitor resume notice এসেছে; একই Artifact-এর ২৫–২৮ সেপ্টেম্বরের host logs পাওয়া গেছে। Installed native engine recovery gate denial বা caught startup failure একাধিক carried monitor-এর জন্য এই generic notice দিতে পারে। Specific underlying cause, automatic comment reply এবং permanent watcher recovery এখনও verified নয়; notice থেকে পাঁচটি নতুন generation failure বা extra billing দাবি করা হয়নি।
- OWN native Artifact monitor QA করতে গিয়ে Mac locked পাওয়া গেছে; automatic unlock ব্যর্থ, manual unlock প্রয়োজন। Existing user chat, Artifact, saved files, official config বা চলমান jobs বদলানো/বন্ধ করা হয়নি। নতুন inference বা native monitor test শুরু হয়নি।
- সফল source validation/full build/runtime deployment/root ingress/pricing/data-retention evidence বহাল ও পুনর্ব্যবহৃত। Compile, pack, installer বা updater পুনরায় চালানো হয়নি। Direct-native equivalent-workload billing baseline ও 9 historical account transition-এর আগের সীমাবদ্ধতা বহাল; blanket zero-extra-usage guarantee নেই।
- Full real native QA এখনও incomplete। Follow-up ACTIVE থাকবে; resource admission এবং Mac unlock-এর পরে own Artifact comment/reconnect test ও route regression চালানো হবে।

Evidence: `private-overlay-push-20261014T154258Z.json`, `native-comment-monitor-recurrence-20261014T150753Z.json`, `native-qa-locked-mac-blocker-20261014T154051Z.json` (internal task cache; credentials/private Artifact URLs omitted)।


## 2026-10-14 21:02:54 UTC — focused normal CLI route QA সম্পন্ন; Artifact monitor এখনও অসম্পূর্ণ

**Focused CLI matrix: PASS. Full native QA: INCOMPLETE.** Source `2b4158371223293db12d3a6de00a9b22d44600fb`; private sync commit `6acab81de3dbb89962c2571de5f0d369b874be6a`।

- GPT `codex/gpt-6.1-sol`: normal interactive CLI-তে actual Read এবং `OMNI_NATIVE_QA_READ_V2` result যাচাই হয়েছে। 20:17 UTC-তে অন্য heavy কাজ শুরু হওয়ায় resource guard নিজস্ব CLI বন্ধ করে; final request-এর 499 সেই interruption-এর সঙ্গে মিলে। 20:52 UTC-তে saved tool result থেকে resume করে exact assistant final `QA_GPT_FOCUSED_READ_OK_20261014T2016Z` পাওয়া গেছে। Read আবার চালানো হয়নি। Read ও final-এর exact gateway response/provider trace HTTP 200 মিলেছে। এটি resumed sequence-এর PASS; uninterrupted run দাবি নয়।
- GLM `glmt/glm-5.3-max`: একই নিজস্ব session resume করে নতুন actual Read, সঠিক fixture result, exact final `QA_GLM_FOCUSED_READ_OK_20261014T2056Z` এবং `glmt` provider-এর দুইটি exact HTTP 200 trace যাচাই হয়েছে। CLI response model `glm-5.3`; route argument ও provider catalog model `glm-5.3-max`।
- return-Claude `claude-sonnet-5-5`: native default credentials-এ ফিরে নতুন actual Read, fixture result এবং exact final `QA_RETURN_CLAUDE_READ_OK_20261014T2058Z` যাচাই হয়েছে। Final provider request-এ exact Read tool-result ID ও fixture content আছে; `claude` provider response HTTP 200-তে final marker মিলেছে। Retained Read response summary empty text/no tool_calls; raw Read-response retention fidelity দাবি নয়। Actual execution নিজস্ব CLI transcript ও পরবর্তী provider request দিয়ে প্রতিষ্ঠিত।

তিনটি successful CLI exit code 0, guard failure null। Peak RSS যথাক্রমে GPT 464.23 MiB, GLM 488.06 MiB, return-Claude 640.81 MiB; minimum physical headroom 16.81/16.39/15.80 GiB; swap growth 0। Manual permissions/usual hooks ও process-only updater disabling ছিল; official client/config/login এবং operator policy বদলায়নি। Hosted connector parity দাবি নয়।

Own native Artifact comment/reconnect test এখনও অসম্পূর্ণ। Fresh admitted resource windows-এর পরে 20:16 ও 20:51 UTC CUA access Mac locked জানিয়েছে; সেই attempts-এ UI navigation/edit হয়নি। Human-এর আগের unlock confirmation সংরক্ষিত; পুনরায় unlock প্রশ্ন করা হয়নি। পুরোনো carried monitor notice-এর specific inner cause এখনও অজানা। Armed monitor record বা CLI route PASS automatic comment-reply recovery-এর প্রমাণ নয়।

এই QA-তে application source, build, pack, installation, updater বা ingress reload পুনরাবৃত্তি হয়নি; successful package, rollback, live data ও পূর্বের evidence সংরক্ষিত। Tiny forced-Read probe এবং private source sync পুনরাবৃত্তি হয়নি। Follow-up ACTIVE থাকবে কেবল অবশিষ্ট own Artifact monitor/reconnect QA-এর জন্য; completed CLI route test আর চালানো প্রয়োজন নেই।

Evidence: `~/Library/Caches/NexaLance/omniroute-native-artifacts-2026-10-14/focused-cli-route-matrix-20261014T210151Z.json`; `~/Library/Caches/NexaLance/omniroute-native-artifacts-2026-10-14/focused-gpt-cli-resume-qa-20261014T205505Z.json`; `~/Library/Caches/NexaLance/omniroute-native-artifacts-2026-10-14/focused-glm-cli-qa-20261014T205742Z.json`; `~/Library/Caches/NexaLance/omniroute-native-artifacts-2026-10-14/focused-return-claude-cli-qa-20261014T210151Z.json`।
