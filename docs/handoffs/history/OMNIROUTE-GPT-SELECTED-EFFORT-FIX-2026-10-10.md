> **ঐতিহাসিক নথি — public copy, ২০২৬-১০-১৭।** মূল ঘটনার তারিখ ও ফল এই নথির নিজস্ব সময়ের জন্য প্রযোজ্য; পরের সংযোজন থাকতে পারে। বর্তমান অবস্থা ও কাজের নিয়মের জন্য [বর্তমান handoff](../CURRENT-STATUS-2026-10-17.md) পড়ুন। Private reference ও identifier সরানো হয়েছে; স্থানীয় evidence এখানে অন্তর্ভুক্ত নেই। পুরোনো cleanup, build, deploy বা service command বর্তমান অনুমতি হিসেবে ব্যবহার করবেন না।

# OmniRoute: GPT selected effort সংশোধন

প্রতিবেদন: Jillur Rahman<br>
তারিখ: ২০২৬-১০-১০, Asia/Dhaka<br>
সংশোধিত source: `0b62ea8e7a5796d37cffed8dd8730688ea4c9d14`<br>
পরীক্ষিত base ও বর্তমান production: `6e3dd8d50`

**Source fix ও সংশ্লিষ্ট validation সম্পন্ন। নতুন production build এবং live promotion এখনও সম্পন্ন নয়।** নিচের ফল source ও transformation পরীক্ষার; সফল নতুন package বা native UI acceptance হিসেবে গণনা করা হয়নি। পরবর্তী build/deployment ফল এই প্রতিবেদনে আলাদা append হবে।

## সমস্যার নির্দিষ্ট কারণ ও সংশোধন

বর্তমান production-এর Responses translator-এ Max সমর্থনের আলাদা regex ছিল। সেটিতে `gpt-6.1-sol` অনুপস্থিত থাকায় Claude client-এর `output_config.effort=max` প্রথম অনুবাদে `max` থাকলেও পরের ধাপে `xhigh` হতো। আগের read-only audit-এ ২২১টি সফল Sol request-এ এই downgrade পাওয়া গিয়েছিল। Max slider ঠিকভাবে pass না হওয়ার কারণটি gateway transformation; শুধুমাত্র dashboard label নয়।

Translator-এর আলাদা তালিকা সরিয়ে Codex executor-এর একই capability function ব্যবহার করা হয়েছে। Official local Codex catalog অনুযায়ী `gpt-reserve`-এর Max capability-ও shared set-এ যোগ হয়েছে। Reserve-এর নতুন static catalog entry বা live availability দাবি করা হয়নি।

ফলে সমর্থিত base GPT target-এ explicit `low`, `medium`, `high`, `xhigh`, `max` বাছাই অনুবাদের সময় হারায় না। `gpt-6.1-sol`-এ Max এখন pipeline test-এ upstream wire Max থাকে।

বর্তমান নিয়মগুলো অক্ষত:

- Target-এর fixed suffix থাকলে, যেমন `cx/gpt-6-astra-low`, target-এর নির্ধারিত Low-ই জেতে। Client slider অনুসরণ করার জন্য suffix ছাড়া base target ব্যবহার করতে হয়; বর্তমান Sol/Astra Bridge mapping base target।
- `ultra`-র বিদ্যমান wire conversion `max`; client-এর delegation workflow স্বয়ংক্রিয়ভাবে তৈরি করা হয়নি।
- `gpt-5.5`-এর verified catalog Low/Medium/High/XHigh পর্যন্ত; unsupported Max-এর পুরোনো XHigh ceiling রাখা হয়েছে।
- Effort না পাঠালে existing Medium fallback অপরিবর্তিত; missing effort-কে নতুন explicit নির্বাচন বানানো হয়নি।
- ব্যবহারকারীর গ্রহণ করা `glmt/glm-5.3-max` pin অপরিবর্তিত। Client High হলেও ওই target-এর upstream Max থাকবে।
- Global thinking mode, account state, official Claude configuration এবং routing mappings এই source fix বদলায়নি।

## পরীক্ষার ফল

| পরীক্ষা | ফল | কী প্রমাণ করে |
| --- | --- | --- |
| Max normalizer failing-then-passing reproduction | আগে ২ FAIL, পরে ২ PASS | নির্দিষ্ট downgrade ধরা ও সংশোধন |
| নতুন selected-effort regression | ৯৫ PASS | ৯টি GPT base-এর ৪৯ advertised effort combination, ৪৪ fixed alias, ২ guard; প্রতি case-এ Claude/Chat/Responses → actual translator → Codex executor → final sanitizer |
| সংশ্লিষ্ট translator/executor/GLM regression | ১০৮ PASS | পাশের routing ও existing GLM effort semantics অক্ষত |
| MCP/Vitest, operator compression-off fixture | ৪৯৩ PASS, ৫৪ file | ব্যবহারকারীর compression-off profile-এ সম্পূর্ণ Vitest suite |
| Core TypeScript | PASS | পরিবর্তিত core typecheck |
| Full TypeScript ratchet | ৫,৮১৭ / baseline ৫,৮৩০; PASS | inherited diagnostic budget বাড়েনি |
| Normal commit hooks | PASS | lint/format, docs sync, attribution, tracked-artifact ও budget guards |

পরীক্ষার ব্যবহারিক সীমা: সব provider/model-এর নতুন live inference করা হয়নি। Native Node unit runner affected translation/executor paths-এ সীমিত; পুরো unrelated unit suite পুনরাবৃত্তি হয়নি। Fresh default MCP compression-on fixture-এ পুরোনো description expectation mismatch ছিল—প্রথম run ৪৯২ PASS/১ FAIL সংরক্ষিত। Production data না ছুঁয়ে isolated compression-off fixture-এ ৪৯৩ PASS হয়েছে; ব্যর্থ ফল লুকানো হয়নি।

Cold full-ratchet ৩ GiB heap-এ OOM হয়েছিল। Existing compiler cache hash যাচাই করে isolated worktree-তে reuse করার পরে বর্তমান source পুনর্মূল্যায়নে ratchet PASS। Cache reuse source check বাদ দেয়নি। এই পরিবর্তনে inherited ১৩টি diagnostic সমাধান হয়েছে—এমন causal দাবি করা হয়নি।

## Source, attribution ও নিরাপত্তা

পরিবর্তন শুধু `nexa/`-এ: দুই surgical patch, নতুন regression mirror এবং manifest। Author ও committer `Jillur Rahman <22579419+developerjillur@users.noreply.github.com>`। Normal hooks চালু রেখেই commit হয়েছে। Public OSS push/PR হয়নি।

নিজস্ব worktree:

`~/Developer/OmniRoute/.claude/worktrees/gpt-effort-passthrough-2026-10-10`

Source clean ও pristine। Validation-এর জন্য applied ১৪৫ patch ও ৭৭ new file verified inventory অনুযায়ী restore করা হয়েছে। Main `nexalance` এখনও clean `6e3dd8d50`; candidate merge হয়নি। সফল পুরোনো release package, source, runtime, database ও rollback অক্ষত।

## Build ও deployment-এর নির্ভুল অবস্থা

নতুন build runner প্রস্তুত: ৫ GiB Node heap, ৮ GiB total process cap, one worker, webpack parallelism ১ এবং live watchdog। Next.js-এর memory optimizations আগে থেকেই enabled; নতুন profile আবিষ্কার বা নতুন toggle যোগ করার দাবি নয়। Desktop build/deploy flags `0`।

বড় build শুরুর আগে ৮ GiB cap-এর বাইরে ১০ GiB system reserve, normal pressure, অন্তত ২০ GiB internal free disk, mounted T7 এবং render না থাকার admission দরকার। Watchdog build চলাকালেও ১০ GiB reserve, pressure, swap, disk এবং নিজের descendant RSS মাপে।

অনুমোদিতভাবে Chrome, VS Code ও OrbStack স্বাভাবিক quit হয়েছে; Claude চালু আছে। Native Claude app-এর অন্য Code sessions বন্ধ করার পৃথক অনুমতির প্রশ্ন pending। Background Blender process ক্ষণিকের জন্য আবার পাওয়া গেছে; সেটি বন্ধ করা হয়নি। পর্যাপ্ত physical headroom এখনও না থাকায় build admission অপেক্ষমাণ। কোনো guard bypass, unsupported low-heap পুনরাবৃত্তি বা অন্য কাজ force-kill করা হয়নি।

নতুন সফল package, deployment বা live Max acceptance এখনও নেই। Prepared deploy runner build receipt/source/artifact hash ছাড়া চলবে না; isolated install ও real Anthropic smoke, consistent DB snapshot, previous runtime preservation এবং protected promotion পর্যায় বজায় রাখবে। নতুন runtime-এর পরে চারটি ছোট sequential native TLS request দিয়ে saved Sol/Astra aliases-এর requested ও actual upstream effort এবং exact output marker মিলিয়ে পরীক্ষা প্রস্তুত আছে। এটি full native GUI feature parity পরীক্ষা নয়।

## Evidence

সব task evidence:

`~/Library/Caches/NexaLance/omniroute-gpt-effort-fix-2026-10-10`

`validated-source-0b62ea8e7.json`-এ logs ও overlay-এর SHA-256 আছে। `admission-wait.ndjson` live resource samples রাখে। `predeploy-runtime-paths-and-idsets.json`-এ read-only runtime/data/pointer checks আছে: provider connection ২৩, API key ৩; আগের ২৫-এর সঙ্গে অন্ধভাবে মেলানো হয়নি, operator-এর বর্তমান inventory preserve করতে হবে। Health `/healthz` loopback `28128` ও `omni.local`-এ HTTP 200 ছিল।

Credential, prompt, account পরিচয় বা private verification URL এই প্রতিবেদনে নেই।


---

## সমাপ্তির আপডেট — ২০২৬-১০-১০, 2026-10-10T10:26:32+06:00

আগের অংশটি build-এর আগের checkpoint। তার পরের ফল এখানে যোগ করা হলো; আগের ৯,৮৪২ byte অপরিবর্তিত আছে। **GPT effort fix-এর full production build, deployment এবং নিচে বর্ণিত live acceptance সম্পূর্ণ হয়েছে।** বর্তমান executable `0b62ea8e7`; deployment tool-এর পরবর্তী local commit `1152adf27`।

### কী ঠিক হয়েছে

Responses translator-এর আলাদা capability তালিকা `gpt-6.1-sol`-এর Max সমর্থন চিনছিল না। Shared Codex capability resolver ব্যবহার করায় এই supported model-এ client-এর `max` এখন upstream-এ `max` থাকে। `gpt-reserve`-এর Max capability-ও একই resolver-এ রাখা হয়েছে। Model catalog-এর ৯টি GPT base model-এর ৪৯টি advertised model/effort case এবং ৪৪টি alias case actual translation path দিয়ে যাচাই করা হয়েছে। Unsupported tier এখনও model capability অনুযায়ী সীমিত হয়; `ultra`-এর wire representation `max`, orchestration আলাদা বিষয়।

বর্তমান saved base-model mappings, operator settings বা official Claude configuration বদলানো হয়নি। Client effort অনুপস্থিত হলে আগের `medium` default থাকে। Target alias-এ নির্দিষ্ট effort suffix থাকলে সেই target-এর নির্ধারিত আচরণ থাকে। ব্যবহারকারীর অনুমোদিত `glmt/glm-5.3-max` pinned Max আচরণ বজায় আছে।

### Source, validation ও full build

- Application fix: `0b62ea8e7a5796d37cffed8dd8730688ea4c9d14`।
- Focused regression ৯৫ PASS; related regression ১০৮ PASS; compression-off operator profile-এর MCP suite ৪৯৩ PASS। Core typecheck PASS; ratchet ৫৮১৭ / baseline ৫৮৩০, PASS। আগের checkpoint-এ থাকা fresh-default MCP fixture mismatch ও cold ৩ GiB ratchet OOM-এর সীমাবদ্ধতা মুছে ফেলা হয়নি; warm cache বর্তমান source দিয়ে revalidate হয়েছে। Full unrelated Node suite পুনরায় চালানো হয়নি।
- Full dashboard build, ৬২০ static page, dashboard gate, CLI generation, pack-artifact gate, npm pack এবং strict Bridge package gate PASS; পুরো pipeline exit `0`।
- Build শুরু `2026-10-10T03:56:34.268Z` = **09:56:34 Dhaka**; successful receipt `2026-10-10T04:01:46.073Z` = **10:01:46 Dhaka**। আগের commentary-তে শুরু 10:56 বলা হয়ে থাকলে সেটি এক ঘণ্টার ভুল; এই ISO-ভিত্তিক সময় সঠিক।
- One worker, webpack parallelism ১, heap ৫১২০ MiB, total cap ৮১৯২ MiB। সর্বোচ্চ total RSS **৭৬২৮ MiB**, সর্বনিম্ন physical headroom **১৩.৫১০২ GiB**; pressure normal, swap বৃদ্ধি `0`, render overlap নেই।
- Applied ১৪৫ patch ও ৭৭ new file এবং generated CLI ১২৯টি verified inventory অনুযায়ী restore হয়েছে। Own worktree ও main source clean/pristine।

Release package:

`~/.omniroute-builds/3.8.51-0b62ea8e7/omniroute-3.8.51.tgz`

Bytes: `99590811`; SHA-256: `11ca693d43f523e5275cb8b02ec43445e99772e3f07a0aa288a8075a897109d5`; archive `dist/BUILD_SHA`: `0b62ea8e7`। এই সফল package পুনরায় compile বা pack করা হয়নি।

### প্রথম deployment কেন থেমেছিল এবং কীভাবে সমাধান হয়েছে

প্রথম isolated package install সফল হয়েছিল, কিন্তু smoke-এর hardcoded `cc/claude-opus-5-5` cached quota gate-এ HTTP 429 পেয়েছে। ওই request upstream-এ যায়নি; নতুন করে provider quota fetch করে সব account-এর অবস্থা প্রতিষ্ঠা করা হয়নি। Live service তখন `6e3dd8d50`-এই ছিল। কোনো quota clear, account enable বা verification reset করা হয়নি।

Deployment tool-এ explicit `NEXA_SMOKE_MODEL` যোগ হয়েছে; default Claude target অপরিবর্তিত। এই GPT release-এর real Anthropic-format smoke target ছিল `codex/gpt-6.1-sol`। Health, authenticated management/catalog, migration ১৯৭, Bridge state, real inference marker এবং CORS fail-closed সব gate অক্ষত আছে। Focused deployment config test ৩ PASS, shell/JavaScript syntax PASS এবং normal commit hooks PASS; hook job peak ৪৩৯ MiB।

Deployment tool-এর পাঁচটি file ছাড়া application source `0b62ea8e7` থেকে বদলায়নি। Archive-এর ৮,৪৮২ member-এর মধ্যে `package/nexa/` নেই। Exact changed-path allowlist, ancestry, pristine source, clean main, package SHA-256 ও successful build receipt দিয়ে reuse-এর source equivalence যাচাই হয়েছে। এটি hash/source guard বাদ দিয়ে reuse করা নয়। Updater এখন artifact-এর `BUILD_SHA` ও নিজের source SHA আলাদা করে জানায়, এবং attempt timestamp দিয়ে receipt রাখে।

### Promotion, rollback ও retained data

দ্বিতীয় deployment `2026-10-10T04:16:45.550Z`-এ শুরু; `2026-10-10T04:18:00.593Z`-এ exit `0`। Desktop build/deploy flags `0`। ৩ GiB cap-এর মধ্যে peak **১৪৮৮ MiB**; minimum physical headroom **১৩.৮৯২৫ GiB**, pressure normal, swap বৃদ্ধি `0`। Watchdog কোনো owned process stop করেনি; promotion-এর parent updater-কে signal দেওয়া হয়নি।

Isolated GPT inference PASS হওয়ার পরে SQLite backup API দিয়ে consistent snapshot এবং `PRAGMA integrity_check = ok` হয়েছে। পূর্ববর্তী সম্পূর্ণ runtime prefix রাখা হয়েছে:

`~/.omniroute-builds/runtime-backups/20261010-101645`

Snapshot:

`~/.omniroute-local/update-backups/20261010-101645`

পুরোনো runtime SHA `6e3dd8d50`; নতুন live runtime SHA **`0b62ea8e7`**। Current/previous/previous-runtime pointers মিলেছে। Loopback `28128/healthz` ও `http://omni.local/healthz` HTTP 200; native TLS ingress `443` ও backend `8443` certificate verification-সহ PASS। Persistent `.env`, DNS shim, CA certificate ও private key snapshot-এর সঙ্গে byte-identical আছে; কোনো credential value প্রকাশ করা হয়নি।

Fresh promotion inventory: provider connection **২৩**, API key **৩**, mapping **১৪**, usage record **৭৬,৫৮৮**। Provider/API-key ID-set, operator flags, verification flags, API-key configuration, mappings, alias model hashes এবং সব আগের usage ID retained হয়েছে। `_settingsRevision` ও `codex_catalog_revalidated_version` স্বাভাবিক catalog refresh-এ বদলেছে; manual configuration edit হয়নি। Live QA-এর পর নতুন usage record যোগ হওয়া প্রত্যাশিত।

### Live selected-effort acceptance

বিদ্যমান saved Claude aliases দিয়ে trusted native TLS ingress-এ চারটি sequential request দেওয়া হয়েছে। প্রতিটিতে HTTP 200, exact output marker, trusted TLS, একটিমাত্র matching call-log artifact এবং artifact checksum মিলেছে। Actual provider `codex`, source format `claude`, target Responses path।

| Claude source | Actual GPT target | Client-selected effort | Upstream effort | ফল |
| --- | --- | --- | --- | --- |
| `claude-opus-5-5` | `gpt-6.1-sol` | `max` | `max` | PASS |
| `claude-opus-5-5` | `gpt-6.1-sol` | `low` | `low` | PASS |
| `claude-fable-5` | `gpt-6-astra` | `high` | `high` | PASS |
| `claude-fable-5` | `gpt-6-astra` | `max` | `max` | PASS |

এই চারটি probe-এর peak ১১৮ MiB; minimum headroom ২১.৩৬৪২ GiB।

**Real Claude Code CLI**-তে `--model claude-opus-5-5 --effort max` দিয়ে শুধু task-created ছোট file `Read` করার পরীক্ষা হয়েছে। দুই turn-এ real `Read` tool use + tool result পাওয়া গেছে; exact file marker ফেরত এসেছে। দুই request-এই actual `gpt-6.1-sol`, provider `codex`, requested `max`, upstream `max`, HTTP 200 এবং log artifact checksum মিলেছে। CLI job peak ৩৫৭ MiB, minimum headroom ২০.৭৫৬৩ GiB। Official config edit বা session persistence ব্যবহার করা হয়নি।

৪৯টি advertised case-এর translation coverage এবং এই ছয়টি সফল request evidence আলাদা: সব GPT model/tier upstream-এ নতুন করে চালানো হয়নি। এই acceptance পূর্ণ native GUI tool/integration parity বা সব feature error-free হওয়ার দাবি নয়।

### Claude স্বাভাবিক quit এবং session restoration

ব্যবহারকারীর নির্দিষ্ট অনুমতি অনুযায়ী Claude স্বাভাবিক Quit হয়েছে; force-kill করা হয়নি। বড় build/deploy শেষ হওয়ার পরে Claude আবার খোলা হয়েছে। পূর্বের তিনটি local session `2026-10-10T04:22:12.625Z`-এ `Running`, বর্তমান session-এ responding/Stop control এবং তিনটি native Code runner পাওয়া গেছে:

- `ইমেজ জেনারেশন টুলস গভীর গবেষণা`
- `3D ভিডিও তৈরির দক্ষতা মূল্যায়ন`
- `GitHub account status এবং Remotion updates`

3D session native quit-continuation দিয়ে resume হয়েছে; অন্য দুই original local session-এ একই অসমাপ্ত scope চালিয়ে যাওয়ার continuation দেওয়া হয়েছে। একই নামের আলাদা cloud check-in session-কে original local session বলে ধরা হয়নি। আগে যাচাই করা **১৩টি saved transcript** সব এখনও আছে, size আগের চেয়ে কমেনি। পুনরায় খোলার পরে অন্য কাজ চলতে শুরু করায় physical headroom কমেছে; এরপর আর কোনো বড় build/install চালানো হয়নি।

### আলাদা, এখনও unresolved thread-continuity observation

Logs-এ `previous_message_id`-এর জন্য eligible owning account-এ thread state না পাওয়ার HTTP 404 আছে। Frozen observation window-এ deployment-এর আগে ২৪১টি এবং পরে ১৩টি এমন entry ছিল; error type `model_not_found`, endpoint `POST /v1/messages`। নাম দেখে এটিকে GPT model অনুপস্থিত বা metadata lookup failure বলা ঠিক নয়: retained error summary সরাসরি missing thread state বলে। Rejected entry-গুলোতে selected connection নেই এবং token counters `0`; এটি নিজে থেকে upstream token bill-এর প্রমাণ নয়।

এই effort release thread continuity error-টি fix করেছে এমন দাবি নেই। এর root cause, account ownership/retention এবং client full-conversation replay আচরণ আলাদা traced investigation প্রয়োজন। সফল inference/Read/effort evidence-এর পাশাপাশি এই সীমাবদ্ধতাও রাখা হলো; error logs চাপা দেওয়া বা state force-clear করা হয়নি।

### Build ও ব্যর্থ smoke-এর নিরাপদ archival

নিজের worktree-এর generated `.build` সম্পূর্ণ archive করে ৪০,৪৮২ member-এর file hash, mode ও symlink inventory মিলিয়ে শুধু internal duplicate সরানো হয়েছে। Release `.tgz` ও `dist` আছে। Archive:

`backup/omniroute-gpt-effort-build-2026-10-10/build-output-0b62ea8e7.tar.gz`

Bytes `591482880`; SHA-256 `d31ff85bf00c0b8ca8bef279de4f477ed46b1eff95b8adc9b77f530cf7a978c3`।

প্রথম failed isolated attempt-এর runtime/data/logs-ও ১,২৯,৭৫০ member content-verified archive-এ আছে। শুধু task-created internal duplicate সরানো হয়েছে; T7-এর কিছু delete/overwrite করা হয়নি।

`backup/omniroute-gpt-effort-build-2026-10-10/failed-smoke-20261010-100808.tar.gz`

Bytes `934215680`; SHA-256 `b913e9fd9ba70c7944b253b273b5b5cdb4c47de7ff503947308e578597579bba`। Next deployment admission-এর আগে internal free space **২২.০৪৭৪ GiB** মাপা হয়েছে। সব পুরোনো successful release package, source, live data ও rollback অক্ষত।

### Durable acceptance record

Credential value ছাড়া সমন্বিত receipt:

`<local-setup>/backup/omniroute-gpt-effort-build-2026-10-10/release-acceptance-20261010.json`

মূল task evidence directory আগের মতোই আছে। `full-build-receipt.json`, timestamped deployment result/log/resource trace, `postdeploy-selected-effort-*/summary.json`, `real-cli-effort-trace-proof.json`, `release-retention-attempt2-after.json`, `runtime-snapshot-and-secret-retention.json`, `claude-restoration-verified.json` এবং দুই archive verification inventory ফল সমর্থন করে। সব commit Jillur Rahman-এর identity-তে local normal hooks দিয়ে হয়েছে; remote publication এই release acceptance-এর অংশ নয়।
