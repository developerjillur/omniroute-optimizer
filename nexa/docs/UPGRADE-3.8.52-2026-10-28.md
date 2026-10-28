# OmniRoute v3.8.52 source alignment — ২০২৬-১০-২৮

Canonical repository: `developerjillur/omniroute-optimizer`। Pristine upstream target:
`ad6f33f66bda34eba98645d3bfdabbde294bc843` (`v3.8.52`)। আগের validated canonical
source `968fe6b68dac7ccd34f4652c9f967ed1a8bb2cc0` ছিল `v3.8.51`-এর overlay।

বর্তমান অবস্থা: source reconciliation হয়েছে; নতুন version-এর validation চলছে।
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
৬,০৯৮টি tests-এর মধ্যে, ৪৭৪টি অন্য paths-এ। পুরোনো v3.8.51-এর absolute ceiling
৫,৮৩০ অপরিবর্তিত আছে। Applied measurement ও নতুন diagnostic-এর পার্থক্য review
করতে হবে; inherited backlog-কে zero-error বা নতুন version-এর PASS বলা যাবে না।

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
compiler run inherited baseline হিসেবে গ্রহণ করা হয় না। Absolute ceiling বাড়ানো হয়নি।
