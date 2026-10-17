> **ঐতিহাসিক নথি — public copy, ২০২৬-১০-১৭।** মূল ঘটনার তারিখ ও ফল এই নথির নিজস্ব সময়ের জন্য প্রযোজ্য; পরের সংযোজন থাকতে পারে। বর্তমান অবস্থা ও কাজের নিয়মের জন্য [বর্তমান handoff](../CURRENT-STATUS-2026-10-17.md) পড়ুন। Private reference ও identifier সরানো হয়েছে; স্থানীয় evidence এখানে অন্তর্ভুক্ত নেই। পুরোনো cleanup, build, deploy বা service command বর্তমান অনুমতি হিসেবে ব্যবহার করবেন না।

# Native thinking signature ও model-switch release — ২০২৬-১০-১২

Jillur Rahman / NexaLance

Source `0c0d3b1d4aa8336f03261e80d75bcab3f53fd019`, OmniRoute `3.8.51`। Local production deployment driver সম্পন্ন `2026-10-11T18:03:08.214Z` / ঢাকা সময় ২০২৬-১০-১২ ০০:০৩:০৮। Live runtime SHA `0c0d3b1d4`; subsequent native QA ওই runtime-এই হয়েছে।

## কারণ ও সংশোধন

GPT থেকে native Claude-এ routing বদলালে আগের GPT thinking block-এ খালি signature থাকতে পারে। Reproduced error-এর সীমিত transcript sample-এ এমন 24টি unsigned block পাওয়া গেছে। পুরোনো historical-only recovery চলমান tool cycle-এর thinking রেখে দিত; sparse Thread restore-এর পরেও অকার্যকর block final dispatch-এ পৌঁছাতে পারত।

নতুন pure replay helper native Anthropic dispatch ও `count_tokens`-এর আগে missing/empty/known-synthetic signature শনাক্ত করে ওই thinking block ও পরের thinking suffix সরায়। Valid earlier native signatures অপরিবর্তিত থাকে। সাধারণ text, tool call/result IDs, documents, system instructions ও effort পরিবর্তিত হয় না। GPT/GLM dispatch-এ এই native cleanup প্রয়োগ হয় না। Explicit upstream rejection-এর named position থাকলে চলমান tool cycle-এর rejected thinking suffix-ও একবারের recovery-তে সরানো যায়; tool calls/results থাকে। Invalid named position broad history deletion করে না।

Anthropic-এর নির্দেশনাতেও valid signed thinking অক্ষত রাখা এবং rejected block ও তার পরের thinking blocks বাদ দিয়ে retry করার কথা আছে: [Thinking troubleshooting](https://platform.claude.com/docs/en/build-with-claude/thinking-troubleshooting)। User-এর saved history বা official app configuration সম্পাদনা করা হয়নি।

## Source validation ও build

- পুরোনো base-এ reproduced dispatch/count_tokens/active-cycle tests-এর 5টি expected failure। Fix-এর নতুন suite 15/15, related suite 376/376 এবং MCP suite 493/493 PASS। Group-গুলোর সংখ্যা unique total হিসেবে যোগ করা হয়নি।
- Core typecheck ও focused ESLint PASS। Full TypeScript ratchet `5826 ≤ 5830` PASS; zero-error full typecheck দাবি নয়। Normal source commit hooks PASS; attribution Jillur Rahman।
- Full Next production compilation এবং 620 static pages PASS। Initial packaging `.DS_Store` metadata-তে থামে; প্রথম packaging resume-ও metadata recreated হওয়ায় থামে। Exact task-created metadata তালিকা ও hash যাচাই করে সরানো হয়, Finder folder windows স্বাভাবিকভাবে বন্ধ করা হয়, এবং দ্বিতীয় packaging resume exit `0`। Completed Next output পুনর্ব্যবহার হয়েছে; Next compile পুনরায় হয়নি। Failed receipts/logs সংরক্ষিত।
- Dashboard gate, CLI generation, pack-artifact policy, npm pack, strict Bridge, compaction, connector ও thinking package gates PASS। Generated CLI/source exact restore-এর পরে main ও source/build children clean/pristine।
- Full build process cap 8192 MiB, heap 5120 MiB, worker/webpack parallelism 1, semispace 8, `RAYON_NUM_THREADS=1`; Desktop build/deploy flags 0। Peak total RSS 7216 MiB; minimum physical headroom প্রায় 14.697 GiB; normal pressure, swap বৃদ্ধি 0। Successful packaging resume peak total 1019 MiB।

| Artifact | যাচাইকৃত মান |
| --- | --- |
| File | `omniroute-3.8.51.tgz` |
| Bytes | `99593490` |
| SHA-256 | `8f26dcab9a7ce1b6d60deac0702cd07afe6c65ec503a2e1acd459ec663448854` |
| Archive `dist/BUILD_SHA` | `0c0d3b1d4` |

## Deployment ও retained state

Verified artifact দিয়ে main-এর bounded updater চালানো হয়েছে। Isolated install, real Anthropic-format GPT smoke (`codex/gpt-6.1-sol`), consistent SQLite snapshot, সম্পূর্ণ previous runtime preservation, promotion, health ও trusted native TLS/DNS PASS। Deployment peak RSS 1497 MiB; minimum physical headroom 21.325592 GiB; pressure normal, swap বৃদ্ধি 0; watchdog failure বা protected promotion-এর মধ্যে forced termination হয়নি।

Postdeploy integrity-এর সব 16টি check PASS। Fresh inventory-এর 25 provider connections, 3 API keys, 14 saved mappings এবং operator active states অক্ষত; usage baseline 97830 retained। Certificate material, routing intent, current pointer ও installed files verified package-এর সঙ্গে মিলে। Previous complete runtime-এর directory identity, file/link counts, bytes ও critical hashes মিলে; consistent database snapshot integrity PASS। Account enable, quota reset বা verification clearing করা হয়নি।

## বর্তমান runtime-এ real QA

| পরীক্ষা | ফল ও সীমা |
| --- | --- |
| GPT → native Claude | Real GPT tool call-এর pending tool result ও marker preserved; unsigned history replay HTTP 200। এই GPT response thinking প্রকাশ না করায় explicit unsigned replay fixture যোগ করা হয় এবং receipt-এ তা লেখা আছে। |
| Valid native signed replay | আলাদা bounded arithmetic prompt থেকে actual signed Claude thinking পাওয়া যায়; সেই unchanged signed history-এর next turn HTTP 200 ও exact marker PASS। সহজ প্রথম prompt-এ signed thinking না আসায় initial fixture check ব্যর্থ হয়েছিল; response HTTP 200 ছিল, product failure নয়। |
| Opaque rejected signature | Pending tool cycle-সহ foreign opaque signature request শেষে HTTP 200 ও exact marker PASS; one-retry/error-shape semantics regression suite-এ verified। |
| Native `count_tokens` | Unsigned replay-সহ trusted TLS request HTTP 200 এবং positive integer token count। |
| Claude → GPT | Native signed history থেকে reverse switch HTTP 200 ও exact marker PASS। |
| VS Code installed CLI `2.1.296` | Real Read/Bash → GPT-to-Claude switch → `/compact` → native resume → GPT reverse switch PASS। Compaction 6.710 s; একটি compact boundary; summary ও responses-এ marker retained; peak 210 MiB। |
| Desktop bundled engine `2.1.295` | একই independent sequence PASS। Compaction 7.628 s; একটি compact boundary; summary ও responses-এ marker retained; peak 210 MiB। |
| Native Claude GUI | Opus 5.5 / Low-এ নতুন ছোট Code session। ToolSearch + Higgsfield `models_explore`, Bridge `get_host_status`, Bridge `bl_get_scene_summary`, official Blender `get_blendfile_summary_datablocks`—5 actual tool results success। চারটি connector operation read-only; model discovery-তে 3টি result, Blender connected `true`। |
| Scene consistency | দুই reader একই `HF_Lamp_Story`, `BLENDER_EEVEE`, 442 objects দেখেছে। Saved `.blend` file SHA-256 ও bytes অপরিবর্তিত। Official MCP 9876 ও Higgsfield Bridge 9877 একই single Blender process-এ listening ছিল। |
| Actual routing ও effort | Task marker-bound artifacts-এর checksum ও independent SHA-256 verified। TLS group 6 request, প্রতি CLI group 5, GUI group 3—সব HTTP 200। Actual providers `codex` ও `claude`; selected/upstream effort `low → low`, reasoning seed `high → high`; GUI main Claude requests `low → low`। GUI auxiliary request-এ effort absent ছিল, সেটিকে selected main effort বলা হয়নি। |

CLI tests isolated configuration-এ হয়েছে; official client configuration বদলানো হয়নি। GUI চলার শেষে physical reserve প্রায় 8 GiB-তে নামায় শুধু own QA turn-এ Stop পাঠানো হয়; চার successful tool results ও final answer ইতিমধ্যে retained ছিল। পরবর্তী inference test চালানো হয়নি, অন্য active session/service বন্ধ করা হয়নি।

## সীমা ও সংরক্ষণ

Original giant conversation বা iPhone GUI হুবহু replay করা হয়নি। সব model, vendor-hosted feature ও third-party connector-এর পূর্ণ parity দাবি নয়। আগের connector survey-এর Vercel/account-auth সমস্যাকে এই signature fix দিয়ে solved বলা হয়নি। Actual upstream outage, account permissions এবং model context limits থাকে।

বর্তমান `nexa/` snapshot-এর 314 tracked file source commit-এর সঙ্গে byte-for-byte মেলে; inventory-তে mode, Git blob ও SHA-256 আছে। Successful package, `.build/dist`, local raw evidence, live database, full rollback ও snapshot আলাদা protected storage-এ আছে। অনুমোদিত পুরোনো outputs/rollback/smoke copies T7-এ file/hash verified archive হয়েছে; live state মুছে জায়গা করা হয়নি। Credentials, raw user history, private request artifacts, account identities বা databases এই repository-তে নেই।


## স্থানীয় evidence ও সংরক্ষণ

Private GitHub upload সম্পন্ন: [`d9a4c33`](https://github.com/developerjillur/omniroute-optimizer/commit/d9a4c33069350171d7c19bbf0d1b23d832d511dd)। Remote `main` ও local commit একই; working tree clean। `nexa/`-র 314 tracked file-এর bytes/hash source `0c0d3b1d4`-এর সঙ্গে মেলে; secret scan-এ leak নেই। GitHub snapshot পূর্ণ application বা credentials বহন করে না।

- Main source: `~/Developer/OmniRoute`, branch `nexalance`, HEAD `0c0d3b1d4aa8336f03261e80d75bcab3f53fd019`।
- Source child: `~/Developer/OmniRoute/.claude/worktrees/native-connectors-release-2026-10-11`।
- Build child: `~/Developer/OmniRoute/.claude/worktrees/native-thinking-signature-build-2026-10-11`। Successful `.build/dist` protected; main ও এই দুই internal child clean/pristine।
- Release: `~/.omniroute-builds/3.8.51-0c0d3b1d4/omniroute-3.8.51.tgz`। সফল packaging receipt `full-build-resume2-receipt.json`; প্রথম failed pipeline ও প্রথম failed packaging resume receipt সংরক্ষিত।
- আগের সম্পূর্ণ `b03f80bca` runtime: `~/.omniroute-builds/runtime-backups/20261012-000136`। 116724 files, 12975 directories, 49 symlinks, 2156350620 regular-file bytes; original directory identity/counts/hashes verified।
- Consistent database snapshot: `~/.omniroute-local/update-backups/20261012-000136/storage.sqlite`। 1761796096 bytes, integrity `ok`, usage baseline 97830। Live database বা API values এই report-এ নেই।

Task evidence root: `~/Library/Caches/NexaLance/omniroute-native-thinking-signature-2026-10-11`। প্রধান receipts:

1. `validation-final-receipt.json` ও `validated-source.json`—source/log hash binding, RED/GREEN, related/MCP/typecheck/lint।
2. `postdeploy-integrity-receipt.json`—16 preservation/health/runtime checks।
3. `live-switch-tls-3axN83/receipt.json`—6 contract cases ও signed-thinking seed; initial `live-switch-tls-y4E26G/receipt.json`-এর fixture failure-ও রাখা হয়েছে।
4. `real-cli-switch-WKQk6P/receipt.json` ও `real-cli-switch-V5N7Df/receipt.json`—দুই আসল installed client, compact boundary, successful Read/Bash এবং retained context।
5. `postdeploy-native-gui-receipt.json`—actual ToolSearch ও চার connector result, দুই scene reader-এর 442 object, saved scene hash।
6. `postdeploy-live-qa-traces-receipt.json`—নিজস্ব unique marker-bound actual provider/effort এবং verified trace checksums; raw artifacts private local storage-এই।
7. `private-github-release-receipt.json` ও `private-export-gitleaks.json`—private push, inventory ও secret scan।

অনুমোদিত archive: প্রথম 9টি পুরোনো copy `rollback-archives/native-thinking-signature-2026-10-11/`-এ এবং অতিরিক্ত অনুমোদিত দুইটি protected build output `rollback-archives/native-thinking-signature-2026-10-11-additional-builds/`-এ প্রতিটি file/hash যাচাই করে রাখা হয়েছে। যথাক্রমে প্রায় 12.6 ও 6.4 GiB internal space recovered; নতুন build/install পরে জায়গার পরিমাণ বদলেছে। Source/release/live database/live runtime ও recent rollback অক্ষত। Receipts `approved-archive-final-receipt.json` ও `additional-archive-final-receipt.json`।

এই run-এর নিজস্ব temporary isolated smoke DB/WAL/SHM নতুন exclusive `rollback-archives/native-thinking-signature-2026-10-11-owned-smoke-data-20261012-000136/`-এ copy+hash+source-unchanged verification-এর পরে শুধু internal temporary copies সরানো হয়েছে; live DB/consistent snapshot/full rollback আলাদা আছে। Recovery প্রায় 1.64 GiB; `.env`/salt internal-এই। Receipt `owned-smoke-db-relocation-receipt.json`।

একটি unused T7 source checkout-এর ExFAT mode differences দেখা গিয়েছিল; সেটি build-এর জন্য ব্যবহার হয়নি, delete/overwrite করা হয়নি। সেটিকে clean internal source tree-এর সঙ্গে এক করে দেখানো হয়নি।

### ব্যবহার ও অবশিষ্ট সীমা

বর্তমান Agent Bridge runtime পরের request-এ signature replay fix প্রয়োগ করবে; saved conversation rewrite বা forced compaction করা হয়নি। User-এর বিশাল পুরোনো conversation ও iPhone UI হুবহু replay করা হয়নি। Model context limit, actual quota এবং third-party connector account/auth সমস্যা আলাদা থাকে। সব provider/connector-এ নিঃশর্ত perfect parity দাবি করা হচ্ছে না।


শেষ যাচাই — ২০২৬-১০-১২ ঢাকা সময়: source main ও দুই internal child clean/pristine `0c0d3b1d4`; private GitHub-এর `nexa/` Git tree-ও হুবহু একই `6de575f468844841d0377598d03cc5dc48c34e75`। Verified artifact bytes/SHA-256 আবার মিলে, localhost ও omni.local health HTTP 200। Follow-up automation `PAUSED`। এই point-in-time check-এ memory pressure normal, physical headroom 11.51 GiB, internal disk free 15.12 GiB; completed QA-এর পরে আর নতুন heavy job শুরু হয়নি। বর্তমান free space পরের বড় কাজের 20 GiB admission threshold-এর নিচে থাকলে আগে আবার resource admission যাচাই প্রয়োজন। Final receipt: `final-release-verification-receipt.json`।
