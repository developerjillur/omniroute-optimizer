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
