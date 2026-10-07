# Native Thread ও cache accounting সংশোধন

তারিখ: 2026-10-07। লেখক: Jillur Rahman। ভিত্তি: `65c6c608a9a6e78b206c8f1cd199f7cf0e062ddf`।

এই পরিবর্তন `OMNIROUTE-AND-NEXT-STEPS.md`-এর OmniRoute অংশের জন্য। Global Claude settings,
skill family ও public OSS workflow এই পরিবর্তনের অংশ নয়। পুরোনো সফল artifact ও rollback অক্ষত থাকবে।

## সমস্যার প্রমাণ

Live read-only log-এ native continuation-এর প্রথম user message একটি server-owned `tool_result`;
পরের message একটি native system directive। বর্তমান full-history repair প্রথম message-কে orphan
ধরে বাদ দিতে পারে, তারপর directive system prefix-এ উঠে যায়। পাশাপাশি request-এর বর্তমান shape থেকে
beta যোগ করার ফলে create ও sparse continuation-এর negotiated headers আলাদা হয়। উপরের পরিবর্তনগুলো
provider-এর Thread invariant-এর সঙ্গে বিরোধ তৈরি করে। একই account-এ client-এর full replay সফল হয়েছে;
সেই sample-এ 161,582 input-এর মধ্যে 160,887 cache থেকে পড়া হয়েছে। তাই failed 400-কে double token
billing বলা হচ্ছে না।

## পরিবর্তন

- Explicit native `thread.type=create/continue`-এর system, messages, tools, cache markers, thinking,
  output_config ও Thread/diagnostics fields local account/model normalization শেষে অপরিবর্তিত থাকে।
  Native beta negotiation request shape থেকে পুনরায় অনুমান করা হয় না। Native CCH re-signing আগে
  integrity token-কে placeholder-এ ফিরিয়ে নেয়।
- সফল provider response-এর `message_start`/root message ID থেকে hashed session/message ownership
  রাখা হয়। Transcript বা credential রাখা হয় না। Response-এর bytes অপরিবর্তিতভাবে forward হয়;
  পর্যবেক্ষণ 64 KiB-তে সীমাবদ্ধ। Ownership 24 ঘণ্টা রাখা হয়, expired/corrupt record prune হয় এবং
  periodic retention limit 10,000।
- Sparse continuation শুধু eligible owning account-এ যায়। Owner অজানা, paused, exhausted অথবা
  allowlist-এর বাইরে হলে native client-কে full replay করতে বলা হয়। Sparse delta থেকে history বানানো
  বা Thread fields সরিয়ে sibling account-এ অসম্পূর্ণ prompt পাঠানো হয় না।
- Native `output_config.effort`, সর্বশেষ per-message directive ও API `reasoning_effort` log হয়;
  encrypted thinking থাকা তার পূর্বশর্ত নয়। Explicit effort বদলানো হয় না।
- Provider-এর 5m/1h cache creation counters nullable columns-এ থাকে। পুরোনো log বা missing counter-এর
  TTL অনুমান করা হয় না। Shared parent metadata-র child prompt/tools আলাদা hashed cache group পায়;
  sparse continuation আগের Thread-এর group ব্যবহার করে। প্রথম successful group/model request বাদ দিয়ে
  write ≥20,000 এবং read < write হলে large rewrite হয়। Retained older rows-ও first-request test-এ থাকে।
- Dashboard-এ token অনুযায়ী cache read share, large rewrite share, known/unknown coverage, 5m/1h write,
  configured standard API price equivalent ও last-hour threshold alerts যোগ হয়েছে। Missing TTL-এর
  price একটি range। Weekly percentage-এর জন্য স্থির dollar conversion নেই।
- Default fill-first-এ নতুন native Claude session eligible pool-এর বেশি quota-যুক্ত account পছন্দ করে;
  চলমান eligible affinity অপরিবর্তিত থাকে। Explicit alternate routing strategy বজায় থাকে।
- Known exhausted account প্রতি 30 মিনিটে usage recheck করে, এবং প্রকৃত reset-এর পর bounded retry করে।
  Fresh positive provider evidence ছাড়া wall উঠে যায় না; operator activation বদলানো হয় না।
- Claude snapshot-এর একই percentage/state/metadata এবং সর্বোচ্চ 2-second reset jitter deduplicate হয়;
  30 মিনিটে evidence checkpoint থাকে। Cache-এর actual deadline বা snapshot-এর stored deadline hour-এ
  গোল করা হয় না; quota/state/real reset পরিবর্তন সঙ্গে সঙ্গে সংরক্ষিত হয়।
- `nexa/build.mjs` এখন production compilation-এর আগে bounded native regression gate চালায়। পুরোনো
  native cache/TTL tests এবং নতুন Thread, effort, usage, selection ও quota tests ওই gate-এ আছে।
- Related full-suite checks-এ quota/catalog source সমস্যা পাওয়া গেছে: Gemini Flash/Pro-র aggregate
  `gemini_weekly` quota window বাদ পড়ছিল, এবং model catalog cache settings-এর নতুন database
  generation চিনছিল না। Family-specific window selection ও generation-aware cache invalidation
  ঠিক হয়েছে; পুরোনো inflight catalog response নতুন cache-এ ফিরে বসতে পারে না।
- পুরোনো test contract ও fixture সংশোধন হয়েছে: exact-account eligibility-তে সঠিক forced selector,
  cold route import-এর পরে fetch mock, explicit rotation-এর আগে retention isolation, APFS directory
  iteration-এ bounded eventual cleanup, implicit native TTL অপরিবর্তিত থাকার assertion, এবং
  unpublished model pricing-এ explicit unknown। Fresh artifact retention ও প্রতি sweep-এর কাজের
  সীমা পরীক্ষা হয়; অজানা price বানানো বা baseline বাড়ানো হয়নি।

## সীমা ও অসম্পূর্ণ প্রমাণ

অব্যাখ্যাত Haiku weekly-limit বার্তার matching request trace নেই। Native non-message endpoint-গুলো
Bridge থেকে সরাসরি মূল provider-এ যেতে পারে; এটি সেই বার্তার সম্ভাব্য পথ, নিশ্চিত root cause নয়।
Selected account-এর সত্যিকারের rate-limit headers আড়াল করা বা pooled quota বলে মিথ্যা success দেখানো হয়নি।

Attachment-এর $24.7–29.6/weekly-point regression পুনরায় যাচাই করার raw `REPORT.md` পাওয়া যায়নি।
API price equivalent ও subscription weekly allowance এক জিনিস নয়। Official prompt caching pricing-এ
5m write 1.25× এবং 1h write 2× input price; configured model-specific cache read price ব্যবহার হয়।
[Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing)।

Compression master ও engines OFF policy retained। Native implicit TTL-এ 1h চাপানো হয়নি।
Quota reset-এর millisecond jitter থেকে নতুন reset event বানানো হয়নি।

## Validation অবস্থান

Final applied source-এর native regression gate 75/75, core typecheck, touched ESLint ও complexity
ratchets PASS। Full TypeScript ratchet 5824 ≤ 5830; baseline বাড়ানো হয়নি।

পূর্ণ Node main sweep: 45,115 PASS, 4 failed assertions, 28 skipped, 0 cancelled; process exit 1।
Chrome-এর occupied 9222 port ও startup/deadline fixture timing-এর failed groups এক worker-এ
পুনরায় যাচাই: 31 PASS, 1 platform skip, 0 failed। Dashboard 134/134 ও serial 23/23 PASS।
পূর্ণ run-এর exit 1-কে exit 0 বলা হচ্ছে না; failed groups-এর সফল recovery আলাদা evidence।

MCP Vitest 493/493 PASS। UI sweep 2844 PASS, 6 failed assertions; required server-state props
ও পুরোনো WebSocket source expectation সংশোধনের পরে সংশ্লিষ্ট 14/14 PASS। Product transport
এখন same-origin SSE; DNS consent ও risk-notice assertions বহাল। অন্যান্য passing source
অপরিবর্তিত আছে। MCP description-এর outdated article সংশোধনও শুধু fixture-তে হয়েছে।

প্রথম Node attempt-এর cancelled tests, প্রথম TypeScript 4 GiB heap OOM এবং পুরোনো fixture
failures evidence-এ রাখা আছে। Per-file database isolation, short TMPDIR ও bounded workers
ব্যবহার হয়েছে; validation-এর জন্য live credential/config বদলানো বা app force-quit করা হয়নি।
Owner-authorized Chrome, VS Code, Claude ও OrbStack normal quit হয়েছে।

নতুন production build, deployment ও live native QA এই source receipt-এর পরের ধাপ; আগের
65c6c608a release এই পরিবর্তনের deployment নয়। নতুন SHA-এর full dashboard/CLI build ও npm pack
সফল হলে verified package দিয়ে isolated install, real smoke, consistent database snapshot,
complete runtime rollback preservation ও promotion হবে। Native CLI/app, concurrent sessions,
effort/TTL persistence ও data retention পৃথক live evidence দিয়ে যাচাই হবে। এক ঘণ্টার passive
traffic window পূর্ণ না হলে error/rewrite threshold acceptance pending থাকবে; quota পোড়াতে
synthetic এক ঘণ্টার traffic তৈরি হবে না।

## পুনরাবৃত্তিযোগ্য validation-এর প্রস্তুতি

Migration সংখ্যা README.md, AGENTS.md ও llm.txt-তে overlay apply-এর সময় প্রকৃত SQL inventory থেকে গণনা হয়; restore-এ upstream bytes ফিরে আসে। Scaffolding source commit-এ যোগ হয় না। Cloud success fixture এখন signed response যাচাই করে; request দিয়ে guardrail বন্ধ করার পুরোনো expectation বাদ দিয়ে trusted API-key policy ও untrusted override rejection পরীক্ষা হয়। Catalog order, CLI health ping, model header version ও locale parity বর্তমান overlay-এর সঙ্গে মেলে। Golden snapshot-এর শুধু Copilot OS value normalize হয়েছে; provider URL/model/header semantics অপরিবর্তিত। Source-asset audit generated .work/.build/.source directories বাদ দেয়।

Validation TMPDIR repository-এর নিচে হলে synthetic CommonJS executable real package.json-এর module type পায় এবং macOS Unix socket path limit ছাড়ায়। পরবর্তী isolated validation একটি সংক্ষিপ্ত, নিয়মিত /private/tmp/ directory ব্যবহার করে; আগের evidence রাখা হয়েছে। Node 26 IP-address SNI প্রত্যাখ্যান করে; HTTPS proxy-তে IP হলে SNI বাদ যায়, certificate verification বহাল থাকে।

## Installed package-এর migration directory

প্রথম release `d8cc12b84`-এর পূর্ণ build ও isolated inference সফল হয়েছিল, কিন্তু live database-এ
migration 197 অনুপস্থিত ছিল। Package-এ SQL file থাকা সত্ত্বেও bundled `import.meta.url` থেকে
পুরোনো build checkout-এর migration directory আগে পাওয়া যায়। ফলে নতুন nullable usage columns
ছিল না; এটি live schema যাচাইয়ে ধরা পড়েছে। প্রথম সফল package ও runtime backup সংরক্ষিত আছে।

CLI এখন configured environment load-এর পরে installed package-এর `src/lib/db/migrations`
directory pin করে। Explicit migration override অপরিবর্তিত থাকে। Isolated package smoke-এ
real inference-এর আগেই migration 197 এবং চারটি native usage column থাকা বাধ্যতামূলক। শুধু
SQL file archive-এ থাকা অথবা health 200 হওয়া এই gate-এর success নয়।

এই সংশোধনের native gate 80/80 এবং entrypoint/env/provisioning-এর targeted CLI tests 25/25
PASS। আগে যাচাই করা 74টি application/source path-এর hash অপরিবর্তিত; TypeScript, dashboard ও
বড় suite-এর evidence পুনর্ব্যবহার হয়। নতুন release-এর build/deployment ও live schema/response
receipt আলাদা artifact directory-তে এবং বাংলা handoff-এ রাখা হয়।

## Live Thread regression-এর দ্বিতীয় সংশোধন

`b53c1cea3`-এর live migration 197, data retention, Anthropic smoke ও TLS PASS। Real concurrent
Sonnet/Opus CLI-তে দুই turn-এর response সফল হলেও ছয়টি provider request-এর মধ্যে দুটি
continuation 400 হয়েছে; client replay করে উত্তর দিয়েছে। তাই সেই release-কে Thread fix complete
বলা যাবে না। Provider error-এ cache_control ও system-এর invariant mismatch ছিল।

Native Thread preservation-এর condition false হলে সাধারণ normalization-এর else branch চলত;
সেখানে sparse turn-এর system directive top-level-এ hoist হতো। এখন native branch পৃথক এবং raw
native fields parameter sanitation-এর পরেও পুনঃস্থাপিত হয়। Prompt/history তৈরি বা sibling
account-এ sparse delta পাঠানো হয় না।

Passthrough stream wrapper native format না দেওয়ায় provider reducer OpenAI format ধরেছিল;
তারপর final provider summary-ও synthesized chat summary দিয়ে প্রতিস্থাপিত হয়েছিল। এতে
provider-reported nested 5m/1h cache creation হারাত। Native format ও raw provider summary এখন
থাকে; client stream-এর bytes অপরিবর্তিত। একটি full chat pipeline test native create/continue,
sparse system directives, চারটি native cache marker, owner/cache group এবং 0/1000 TTL counters
প্রকৃত database persistence পর্যন্ত পরীক্ষা করে। Native gate 81/81, related stream/payload
regressions 100/100 ও touched-file lint PASS। নতুন artifact ও provider-correlated live QA পৃথক
receipt-এ হবে; শুধু marker response দিয়ে replay bug মিটেছে বলা হবে না।
