> **ঐতিহাসিক নথি — public copy, ২০২৬-১০-১৭।** মূল ঘটনার তারিখ ও ফল এই নথির নিজস্ব সময়ের জন্য প্রযোজ্য; পরের সংযোজন থাকতে পারে। বর্তমান অবস্থা ও কাজের নিয়মের জন্য [বর্তমান handoff](../CURRENT-STATUS-2026-10-17.md) পড়ুন। Private reference ও identifier সরানো হয়েছে; স্থানীয় evidence এখানে অন্তর্ভুক্ত নেই। পুরোনো cleanup, build, deploy বা service command বর্তমান অনুমতি হিসেবে ব্যবহার করবেন না।

# Agent Bridge update durability — PRD

মালিক: Jillur Rahman / NexaLance<br>
তারিখ: ২০২৬-১০-০২

## উদ্দেশ্য

Original native Claude account/history/projects রেখে provider routing OmniRoute দিয়ে চালানো। Runtime update, restart এবং rejected deployment-এর পরে working Bridge, persistent configuration এবং native connectivity রক্ষা করা।

## যে সমস্যাগুলো সমাধান করা হয়েছে

Installed runtime-এর fixes build source-এ ছিল না; reboot-এর পরে localhost 443 এবং 8443 listener নির্ভরযোগ্য ছিল না; compressed native requests, shared-host owner, response headers/status এবং long reasoning timeout-এ compatibility gap ছিল। CLI client socket-কে listener ধরছিল। পুরোনো updater আংশিক package overwrite এবং Bridge fixes-হীন rollback archive ব্যবহার করতে পারত।

## আচরণ এবং acceptance

| প্রয়োজন | গ্রহণযোগ্য আচরণ | যাচাই |
| --- | --- | --- |
| Source durability | upstream pristine, fixes nexa/ overlay-তে | 46 patches apply, guard pass, fork push |
| Native protocol | model/effort/system/tools এবং প্রয়োজনীয় headers/query অক্ষুণ্ণ forwarding | transport fixtures pass |
| Compression compatibility | gzip/deflate/br/zstd routing, raw passthrough bytes preserved | pass |
| Error/stream protocol | আসল status/content type/request ID/retry headers, JSON/SSE | pass |
| Native HTTPS ingress | loopback 443, backend 8443, existing trusted CA | প্রথম ingress live pass |
| Hostname isolation | শুধু api.anthropic.com; অন্য local HTTPS আগের Local router | 5 fixtures pass; শেষ root revision activation pending |
| Start/Stop | explicit intent saved, Stop restart-এর পরে বন্ধ থাকে | live pass |
| Recovery | existing trusted CA/hosts/router key দিয়ে enabled listener recover | service restart pass |
| Update | isolated build/package smoke আগে, native TLS check পরে | gates এবং real package smoke pass |
| Rollback | complete prefix + consistent SQLite restore, failed evidence preserved | দুই fault tests pass |
| Native account | first-party Max login, settings/history/bundle preserved | auth/settings fingerprint ও signature pass |
| Quality protection | exact model mapping, compression off, effort forwarding | 13 same-model mappings; native Opus low/Sonnet high pass |

## Update contract

`omni-ctl update`, `redeploy` এবং `build-only` versioned source deployment tools ব্যবহার করবে। Stock package replacement/reinstall দিয়ে existing runtime বদলানো এই command-এ block করা হয়েছে। Updater missing/obsolete root ingress, dirty source, patch conflict, unmeasured/increased typecheck budget, failed regression, failed isolated inference বা failed native TLS gate গ্রহণ করবে না।

Desktop shell rebuild ব্যর্থ হলে installed shell থাকবে। Native Claude Desktop bundle updater এই workflow পরিবর্তন করে না। API/data/encryption key/CA replaceable package-এর বাইরে থাকে। Source এবং rollback archives/failed database স্বয়ংক্রিয়ভাবে delete হবে না।

## Validation-এর সীমা

Full Node প্রথম batch: 44,860 pass, 68 fail, 29 skip। Failures-এর 35 files আগের fork-এ reproduce হয়েছে; অন্য তিন files clean-source rerun-এ pass। Dashboard 134, serial 23, final focused 86 pass/1 skip/0 fail, Vitest 493, broader Bridge 315 এবং Bridge/security 54 pass। পুরো repository green হওয়ার দাবি নেই। Core TypeScript clean, full ratchet accepted inherited 5830 diagnostics; pristine upstream comparison 5875।

Output quality বা সব ভবিষ্যৎ protocol/feature-এর 100% parity guarantee দেওয়া যায় না। Provider executor adaptation আছে। নতুন model/provider entitlement এবং future native app version আলাদাভাবে verify করতে হবে। Cloud routines/scheduled cloud execution original execution account-এর quota ব্যবহার করে। Local scheduled feature-এর end-to-end test হয়নি। Full Mac reboot acceptance নতুন build-এর পরে হয়নি।

## বাকি activation

Root-owned scoped helper-এর source ও tests প্রস্তুত; Terminal-এ administrator installer চালানো বাকি। সেই ধাপ ছাড়া updater ইচ্ছাকৃতভাবে live service untouched রেখে বন্ধ হবে। বর্তমান native API workflow কাজ করছে।

```sh
sudo /bin/bash "$HOME/Developer/OmniRoute/nexa/deploy/install-native-ingress.sh"
```

তারপর ingress/live gates ও native real request verify করতে হবে। দুটি active Claude OAuth connection আছে; তৃতীয় account-এর owner OAuth sign-in এখনও বাকি।

## Delivery

সম্পূর্ণ technical record: `AGENT-BRIDGE-DURABILITY-HANDOFF-2026-10-02.md`। Generic upstream draft: https://github.com/diegosouzapw/OmniRoute/pull/15323 । PR create হয়েছে; upstream merge/acceptance হয়নি। Implementation source commit c5ce21a1c; runtime compiled Next SHA e8916b0c8 এবং tested CLI preflight repack আলাদাভাবে documented।
