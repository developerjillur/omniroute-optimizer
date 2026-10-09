# omniroute-optimizer

Jillur Rahman / NexaLance-এর OmniRoute optimization ও fixing overlay। OmniRoute-এর pristine upstream source অপরিবর্তিত রেখে custom পরিবর্তনগুলো `nexa/` folder-এ রাখা হয়েছে।

## সংরক্ষিত source

| বিষয় | মান |
| --- | --- |
| Source repository | `developerjillur/OmniRoute` |
| Source branch | `nexalance` |
| Source commit | `6e3dd8d503b7fde3718384c84bb058c6e570fe39` |
| Upstream version | `3.8.51` |
| Pristine upstream base | `c1e30b7676975feb298b49eff6ff58923c04b89e` |
| `nexa/` tree SHA | `3d2902b5f69e91673d627fa51421341596fb80ae` |
| Versioned overlay files | 292 |

`nexa/`-এর সব 292টি file মূল source commit-এর সঙ্গে byte-for-byte মিলে। প্রতিটি file-এর path, size, mode, Git blob SHA ও SHA-256 [overlay-inventory.json](overlay-inventory.json)-এ আছে। Manifest-এর 222টি entry-তে 141টি patch, 76টি নতুন file এবং 5টি tooling entry আছে; অন্যান্য tracked file-এ deployment scripts, tests ও documentation রয়েছে।

## কী রয়েছে

- Native Claude request, cache TTL, session/account continuity, sparse Thread continuation, effort ও streaming usage accounting-এর fixes এবং regression tests।
- Compression বন্ধ করার configuration policy ও management script। Live policy প্রয়োগ আলাদা authenticated operation।
- Model switch/restart-এর পরে native tools ও context replay সংরক্ষণ, valid silent prompt suggestion-কে অকারণে retry না করা, এবং cross-provider advisor/WebSearch সীমা স্পষ্টভাবে জানানোর fixes। Anthropic-hosted feature-এর সমান support এতে দাবি করা হচ্ছে না।
- Cache-health diagnostics, quota-aware selection, quota refresh/deduplication এবং model catalog cache-এর fixes।
- Google connection routing ও verification-state handling, native Agent Bridge TLS/DNS/lifecycle, CLI ও packaging-এর fixes।
- Bounded build, isolated package smoke, database snapshot, deployment ও rollback scripts।
- পূর্বের QA evidence, source validation notes এবং overlay পরিচালনার documentation।

মূল layout ও tooling: [nexa/README.md](nexa/README.md)। Deployment ও rollback: [nexa/deploy/README.md](nexa/deploy/README.md)। Native Thread ও usage fixes-এর evidence: [nexa/docs/NATIVE-THREAD-USAGE-2026-10-07.md](nexa/docs/NATIVE-THREAD-USAGE-2026-10-07.md)।

## ব্যবহার

এই repository-তে overlay রয়েছে; সম্পূর্ণ OmniRoute application source ও dependencies আলাদাভাবে প্রয়োজন।

1. একটি isolated OmniRoute checkout-এ উপরের pristine upstream base নিশ্চিত করুন। Overlay engine-এর `upstream-main` local ref ওই base-এ থাকতে হবে। অন্য upstream version ব্যবহার করলে আগে patch compatibility যাচাই করুন।
2. সেই checkout-এ `nexa/` folder কপি করুন। আগে থেকে `nexa/` থাকলে তার changes ও backup যাচাই করুন; সরাসরি overwrite করবেন না।
3. **OmniRoute checkout-এর root থেকে** inventory ও patch compatibility যাচাই করুন:

   ```sh
   node nexa/status.mjs
   node nexa/apply.mjs --check
   ```

4. Build/deployment-এর আগে [versioned deployment runbook](nexa/deploy/README.md) অনুসরণ করে memory pressure, swap, disk, process budget, validation ও rollback gates যাচাই করুন। Existing verified artifact থাকলে সেটি পুনর্ব্যবহার করুন।

Application-এ পরিবর্তন শুধু overlay apply-এর সময় হয়। Applied checkout থেকে source commit করবেন না; pristine state ফিরিয়ে যাচাই করুন। Commit-এর normal hooks চালু রাখুন। এই repository upload কোনো নতুন build, deployment বা live QA-এর প্রমাণ নয়; dated documentation-এর evidence ও সীমা আলাদাভাবে পড়ুন।

## Scope ও license

এখানে tracked `nexa/` source আছে। Live database, API keys, OAuth credentials, secret environment, certificate private keys, runtime prefixes, build archives এবং local task caches অন্তর্ভুক্ত নেই। Account state ও production settings source snapshot থেকে পুনরুদ্ধার করা যাবে না।

OmniRoute-derived code-এর মূল MIT license [LICENSE](LICENSE)-এ অক্ষত রাখা হয়েছে; বিস্তারিত [NOTICE.md](NOTICE.md)-এ।
