# OmniRoute v3.8.52 source alignment — ২০২৬-১০-২৮

Canonical repository: `developerjillur/omniroute-optimizer`। Pristine upstream target:
`ad6f33f66bda34eba98645d3bfdabbde294bc843` (`v3.8.52`)। আগের validated canonical
source `968fe6b68dac7ccd34f4652c9f967ed1a8bb2cc0` ছিল `v3.8.51`-এর overlay।

Source acceptance-এর authoritative ফল exact commit-এর `native-validation.json`
receipt ও বাধ্যতামূলক CI gates। অসমাপ্ত বা ব্যর্থ run গ্রহণ করা যায় না।
Full build, package install, live migration বা deployment হয়নি। Installed build
`15533a05c` এই কাজের ফলে বদলায়নি। আগের version-এর সবুজ CI নতুন version-এর
compatibility প্রমাণ করে না।

## Customization সংরক্ষণ

- আগের ১৮১টি patch path এবং ১১৬টি new-file path রাখা হয়েছে।
- পরিবর্তিত upstream source-এর সঙ্গে native request/streaming, Thread ownership,
  thinking signatures, refusal terminals, cache TTL, usage/cost হিসাব, model-test
  scope, quota scheduling, Bridge lifecycle ও deployment helpers মিলিয়ে port করা হয়েছে।
- ছয়টি incorporated বা relocated patch file মূল path-এ রাখা আছে।
  `nexa/retired-patches.json`-এর base SHA, target blob ও original patch hash মিললেই
  কেবল সেগুলো apply থেকে বাদ যায়; অমিল হলে operation থামে।
- `197_native_claude_cache_details.sql` ও `198_usage_history_cache_ttl.sql`-এর path
  অপরিবর্তিত। Runtime migration identity যথাক্রমে
  `legacy-197-native_claude_cache_details` ও `legacy-198-usage_history_cache_ttl`।
  বিদ্যমান ledger rows-এর timestamp রেখে এই identity-তে rehome করা হয়, যাতে upstream
  `197/198`-এর additive columns-ও প্রয়োগ করা যায়।
- নতুন LLMLingua service upstream migration-এ `not_installed`, `auto_start=0`,
  `auto_update=0`, `provider_expose=0` দিয়ে seed হয়। এই update কোনো model download
  বা compression service শুরু করার অনুমতি দেয় না।
- Native translated usage-এ Nexa-এর prompt count cache read/write-সহ inclusive।
  নতুন upstream-এর creation-exclusion marker সরাসরি রেখে দিলে একই write সাধারণ
  input rate এবং cache creation rate—দুইভাবে গণনা হতে পারে। Translated marker ও
  5-minute/1-hour metadata এই inclusive producer-এর সঙ্গে মিলিয়ে রাখা হয়েছে;
  native wire counters পাল্টানো হয় না। আলাদা failing/passing fixture এই seam পরীক্ষা করে।

## Validation এবং data boundary

Pinned পূর্ণ application fixture-এ strict patch applicability, baseline/native
differential, native/protocol/stream/translator/cache regressions, সব custom Node
tests, custom interface tests, migration identity/preservation, core typecheck,
paired pristine/applied TypeScript diagnostics, lint ও docs gates চালানো হবে।
Compiler crash, import/setup error বা resource stop-কে regression reproduction
বা PASS ধরা হয় না। কোনো test দুর্বল করে বা skip করে acceptance নেওয়া যাবে না।

Synthetic migration fixtures-এ fresh schema, পুরোনো `197/198` ledger, nonzero cache
values, partial physical schema, repeat/idempotence এবং unknown collision পরীক্ষা
হয়। Private runtime database, credentials বা কথোপকথন CI-তে পাঠানো হয় না।

Upstream migration `207_remove_opencode_free_provider.sql` পুরোনো OpenCode
configuration সরায় বা provider id remap করে। `nexa/deploy/check-upgrade-data.py`
read-only affected-count gate; কোনো affected row থাকলে promotion বন্ধ রাখতে হবে।
Live read-only snapshot-এ সংশ্লিষ্ট পাঁচটি scope-এর count শূন্য ছিল; future promotion-এর
আগে আবার পরীক্ষা আবশ্যক। Existing database snapshot, cloned-data acceptance,
package smoke, full build এবং live native acceptance আলাদা release gates।

## Compiler backlog

প্রথম সম্পূর্ণ pristine v3.8.52 measurement-এ ৬,৫৭২টি diagnostic পাওয়া গেছে:
৬,০৯৮টি tests-এর মধ্যে, ৪৭৪টি অন্য paths-এ। Source comparison-এ applied count
৬,৫২৯ এবং নতুন diagnostic identity ০। Operator অনুমোদিত v3.8.52 budget ৬,৫২৯;
v3.8.51-এর সম্পূর্ণ ৫,৮৩০ record `previousReleaseBudgets`-এ সংরক্ষিত। Budget-এর
পরবর্তী পরিবর্তন কেবল নিচের দিকে হবে। এটি inherited backlog; zero-error দাবি নয়।

## Port regression review

প্রথম বিস্তৃত v3.8.52 run-এ migration tests ১০/১০ এবং stream tests ৩৯২/৩৯২ পাস
করেছে। Native ও compatibility suite ব্যর্থ হওয়ায় release আটকে আছে। Review-এ
missing import/helper, merge-এর duplicate declaration, generic empty end-turn
exemption, দ্বিতীয় pricing entry-তে হারানো legacy long-context fields এবং
legacy analytics source-এর নতুন cost-column contract সংশোধন করা হয়েছে।
পরের run-এর আগে এগুলোকে verified fix ধরা যাবে না।

Cloud sync-এর success fixture এখন বৈধ HMAC response ব্যবহার করে; unsigned
response rejection চালু থাকে। Agent Bridge stop-এর privilege-required branch
internal dependency দিয়ে পরীক্ষা হয়, যাতে privileged CI host-এ সেটি skip না হয়।
Mac-এর kernel listener coexistence test Linux source fixture-এ যাচাই হয় না;
এটি acceptance receipt-এ আলাদা limitation হিসেবে থাকবে।

TypeScript comparison-এ একই file, diagnostic code, source statement ও column-এর
পুরোনো diagnostic চিহ্নিত করা হয়; line insertion-এ তার identity বদলায় না।
Inferred union-এর message বদলালে আগের ও পরের message review artifact-এ থাকে।
নতুন statement/code/column, বেশি occurrences, global compiler error বা অসমাপ্ত
compiler run inherited baseline হিসেবে গ্রহণ করা হয় না। এই পর্যায়ে absolute ceiling বাড়ানো হয়নি।

## পূর্ণ পুরোনো schema থেকে synthetic upgrade

চারটি colliding migration-এর focused test ছাড়াও পুরোনো pinned v3.8.51-এর
১৯৩টি SQL file এবং দুই native SQL file নিয়ে একটি পূর্ণ history-preservation
fixture প্রস্তুত আছে। নতুন runtime data ব্যবহার না করে এই fixture-এ credential
bytes, API key, combo JSON, settings, usage/cache TTL, call-log metadata, memory
content/search এবং Artifact file hash যাচাই হবে। Ledger timestamps সংরক্ষণ ও
দ্বিতীয় run-এর mutation-free আচরণও পরীক্ষা হয়। এই lane-এর ফল exact source-এর
CI receipt-এ যাচাই করতে হবে; আগের version-এর ফল দিয়ে এটি পূরণ হয় না।

## দ্বিতীয় বিস্তৃত measurement

Source `b3c3d5a5906f9bc50381b1689070cd150ab9ace4`-এর run
`40639840969`-এ core typecheck, full lint, docs-all, ১৭১/১৭১ extended,
৩৯২/৩৯২ stream, ১০/১০ migration এবং Node 24-এর ৬/৬ focused migration case পাস।
Native suite ১৫৬/১৫৭; broad compatibility ১১৬৬/১১৬৮। এটি rejected attempt।
Cache-cost baseline-এর প্রথম fixture শুধু message_stop-এর return দেখেছিল,
যেখানে terminal usage ইতিমধ্যেই message_delta-তে বেরিয়েছিল; ওই assertion
প্রকৃত marker regression-এর RED proof হিসেবে গ্রহণ করা হয়নি। সংশোধিত fixture
সব emitted frame সংগ্রহ করে এবং RED verifier নির্দিষ্ট inclusive marker-এর
assertion পর্যন্ত পৌঁছানো বাধ্যতামূলক করে।

পূর্ণ compiler measurement ৬,৫২৯; pristine ৬,৫৭২। সংরক্ষিত source statement/code/column
তুলনায় নতুন identity পাওয়া যায়নি; CI comparison-এর working-directory error
সংশোধন করা হয়েছে এবং পরের CI-তে সেটি পুনরায় যাচাই আবশ্যক। বর্তমান ceiling
এই attempt-এ ৫,৮৩০ ছিল এবং release blocked ছিল; পরের source-এ অনুমোদিত version budget ৬,৫২৯।

## সম্পূর্ণ execution ও পুরোনো bootstrap

Run `40642844559`-এ Node 26 ও installed-version Node 24-এর effort suites-এ
১০২/১০২ case এবং execution-completion marker পাস। Paired compiler comparison-এ
৬,৫২৯ বনাম pristine ৬,৫৭২, নতুন diagnostic identity ০। Cache-cost RED fixture
নির্দিষ্ট inclusive marker assertion-এ পৌঁছেছে; green translated cost case-ও পাস।
তবু native wrapper-এর opaque-signature empty boundary ও historical fixture setup
ব্যর্থ হওয়ায় run গ্রহণ করা হয়নি।

Historical fixture এখন একই pinned release-এর `core.ts`-এর static schema এবং
`schemaColumns.ts`-এর startup healers-এর Git blob-ও যাচাই করে। Tables তৈরি,
legacy columns heal, indexes তৈরি, তারপর versioned migrations—এই পুরোনো startup
ক্রম অনুসরণ করা হয়। কোনো অনুপস্থিত column বানিয়ে assertion এড়ানো হয় না।

Native wrapper-এ opaque thinking/signature progress হিসেবে গণ্য হয়। Actual
`message_delta` ও top-level `message_stop` দিয়ে native terminal যাচাই হয়; nested
metadata terminal হতে পারে না। সত্যিকারের `max_tokens` truncation অক্ষত থাকে।
কয়েকটি trailing case report-এ না পাওয়ায় CI থেকে forced worker exit বাদ দেওয়া
হয়েছে; bounded timeout থাকছে, এবং অসমাপ্ত report গ্রহণ করা হবে না।

## Native boundary ও সম্পূর্ণ broad report

Source `a00f615a1ba20a61592ad98023f9e4c7f922fb4a`-এর run `40646262083`-এ
native ১৬১/১৬১, production Node native ১৬২/১৬২, extended ১৭১/১৭১, stream
৩৯২/৩৯২ এবং দুই Node-এর effort ১০২/১০২ পাস। Forced exit ছাড়াই broad report-এ
১,১৮০টি case শেষ হয়েছে; একমাত্র failing file historical-schema fixture, যেখানে
bootstrap table list ও preserved table list-এর একই variable name ছিল। এই
setup error-কে migration regression বা acceptance ধরা হয়নি। Compiler comparison
ওই দুই নতুন declaration diagnostic ধরেছে এবং ৬,৫৩১ count অনুমোদিত ৬,৫২৯ ceiling
অতিক্রম করায় gate আটকে দিয়েছে। নামের collision ঠিক করা হয়েছে; পরের exact-source
run-এ সম্পূর্ণ fixture ও compiler পুনরায় পাস করতে হবে।

Ratchet এখন abnormal compiler exit-এর partial diagnostic, global/configuration
error ও inconsistent exit status গ্রহণ করে না। Unmeasured standalone `--update`-ও
ব্যর্থ হয়। Raw diagnostic এবং version budget history অক্ষত রেখে এই failure modes-এর
পৃথক negative tests রাখা হয়েছে।

## নতুন release-এর দুইটি contract সংশোধন

[Upstream #18390](https://github.com/cheaper-inference/OmniRoute/issues/18390)-এর
সঙ্গে pinned source মিলিয়ে `waitForCooldown.budgetMs`-এর schema/runtime mismatch
নিশ্চিত হয়েছে। Runtime সেটি পড়লেও strict settings schema field-টি গ্রহণ করত না।
এখন optional integer `0..300000` গ্রহণ করে; existing runtime floor, defaults এবং
unknown-key rejection অপরিবর্তিত। `requestQueue.globalConcurrentRequests`-এর
স্বীকৃতি Nexa overlay-তে আগেই ছিল। ছয়টি contract case, targeted failing baseline,
green repeat ও production Node run এই দুই setting-এর compatibility যাচাই করবে।
Live setting বা provider configuration পরিবর্তন করা হয়নি।

Streaming Claude-to-OpenAI translator explicit `content_filter`-কে সাধারণ `stop`
করছিল, যেখানে buffered translator সেটি ঠিক রাখে। এই mapping সমান করা হয়েছে এবং
একটি duplicate `refusal` switch case বাদ দেওয়া হয়েছে। নতুন control tests actual
filtered terminal, opaque thinking signature ও usage অপরিবর্তিত থাকা এবং দুই
translator-এর filter status পরীক্ষা করে। [Upstream #17324](https://github.com/cheaper-inference/OmniRoute/issues/17324)-এর
damaged-history retry loop live-এ reproduce করা হয়নি; এই source change পুরোনো
conversation history repair বা refusal retry-এর দাবি করে না।

Compiler message review-এ পুরোনো auto-update tests-এর নয়টি অসম্পূর্ণ config
fixture-ও পাওয়া গেছে। Source/compose fixtures-এ বিদ্যমান required auxiliary
defaults যোগ করা হয়েছে; command updater-এর production contract ও আগের সব
assertion অক্ষত। এই সাতটি existing upstream test-ও broad compatibility lane-এ
চলে। Test-এ spawn/exec mock থাকে; কোনো update command বাস্তবে চালানো হয় না।

Settings-এর omitted-field control valid partial PATCH ব্যবহার করে defaults
সংরক্ষণ যাচাই করে এবং empty PATCH rejection-ও ধরে রাখে। Process probes শুধু
`execFile`-এর fulfilled result await করে; তাদের injected dependency সেই typed
result ও ব্যবহৃত `cwd/timeout` options প্রকাশ করে। Child-process control আগের মতো
`spawnImpl`-এ থাকে। Cast ছাড়া ordinary async probe-এর নতুন case দুই Node version-এ
চলে; required production config fields শিথিল করা হয়নি।
