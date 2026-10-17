# OmniRoute disk migration verification — ২০২৬-১০-১৭

রক্ষণাবেক্ষণ: Jillur Rahman / NexaLance।

এটি ২০২৬-১০-১৭ `03:23:47 UTC`-এ সংরক্ষিত read-only migration verification-এর public summary। Machine readings point-in-time; এগুলো পরবর্তী heavy কাজের fresh admission নয়। বিস্তারিত local receipt `migration-readiness-receipt.json` public repository-তে অন্তর্ভুক্ত নেই। [বর্তমান handoff](CURRENT-STATUS-2026-10-17.md)-এ বাকি কাজ ও অনুমতির নিয়ম আছে।

## Environment ও live service

| পরীক্ষা | পর্যবেক্ষিত ফল |
| --- | --- |
| Startup disk | `Studio-2TB`, external Samsung 990 EVO Plus 2TB / ACASIS TB501Pro |
| macOS | `26.7.1`, build `25G241` |
| Disk headroom | প্রায় 1.4 TiB free; build/install free-space checks PASS |
| Home/source/runtime | Migration-এর পরে একই home-based locations |
| Temporary directory | নতুন boot-এর temporary directory; আগের `/var/folders/bn/...` attachment paths unavailable |
| Runtime | OmniRoute `3.8.51`, `BUILD_SHA=2b4158371` |
| `http://omni.local/` | HTTP 307, `/dashboard` redirect |
| `http://omni.local/login` | HTTP 200 |
| `http://omni.local/api/health` | HTTP 200 |
| `http://127.0.0.1:28128/` | HTTP 307 |
| Loopback/DNS | `127.0.0.2`, `fd6f:6d6e::2` ও `omni.local` mapping উপস্থিত |
| Root helpers | `com.nexalance.omni-local`, `com.nexalance.omniroute-native-ingress` running |
| User service | `com.nexalance.omniroute`, node listeners `28128` ও `8443` running; audit-এ restart হয়নি |
| Updater | Current boot-এ runs 0 / `never exited`; পুরোনো boot-এর `last exit 0`-কে current boot-এর result বলা হয়নি |
| Hosts ও CA | Migration record-এর hosts bytes মিলে; `OmniRoute MITM CA` certificate trust verification PASS |
| Node | `/usr/local/bin/node`, `v24.15.0` |
| Old path scan | Current runtime/config/overlay-এর reviewed text scope-এ old disk/temp reference পাওয়া যায়নি; secrets, DB, logs ও caches scan scope-এর বাইরে |
| Existing package | 99,699,156 bytes, protected SHA-256 মিলে; rollback locations আছে |
| Automation | `omniroute-build-deployment` PAUSED |

Fallback internal volumes `/Volumes/Data` ও `/Volumes/Macintosh HD`-এর content পড়া, build/deploy বা cleanup করা হয়নি। Token values, keychain values, secret environment ও private keys প্রকাশ করা হয়নি।

## Source ও deploy-path checks

Application checkout-এর root থেকে চালানো command ও সংরক্ষিত ফল:

| Command | Result |
| --- | --- |
| `/usr/local/bin/node nexa/status.mjs` | Exit 0; base `3.8.51`, pristine source, 166 patches ও 95 new files |
| `/usr/local/bin/node nexa/check/pristine-base.mjs` | Exit 0; guard PASS |
| `/usr/local/bin/node nexa/apply.mjs --check` | Exit 0; 166/166 strict applicability PASS; source apply হয়নি |
| `/usr/local/bin/node nexa/deploy/ensure-free-space.mjs "$HOME/.omniroute-builds" build` | Exit 0; required 24 GiB; available প্রায় 1471 GiB |
| `/usr/local/bin/node nexa/deploy/ensure-free-space.mjs "$HOME/.omniroute-builds" install` | Exit 0; required 6 GiB; available প্রায় 1471 GiB |
| `/bin/bash -n nexa/deploy/omni-updater.sh` | Exit 0 |
| `/bin/bash -n nexa/deploy/omni-ctl.sh` | Exit 0 |
| `/bin/bash -n nexa/deploy/build-candidate.sh` | Exit 0 |

Source `nexalance` HEAD `2b4158371223293db12d3a6de00a9b22d44600fb`, working tree clean। ছয়টি registered checkout/worktree location ও registered HEAD মিলে। Release metadata read-only check-এ upstream latest release `v3.8.51` ছিল।

## Non-production tests

নিচের Node test invocation task-specific fixture-retention preload ও resource watchdog-এর অধীনে চালানো হয়েছে। Preload নতুন temporary directories retained রেখেছে এবং file deletion block করেছে। এটি live service-এর build/install/deploy invocation নয়।

```sh
/usr/local/bin/node --test --test-concurrency=1 \
  --test-skip-pattern='stale metadata cannot terminate an unrelated live process' \
  nexa/deploy/bootstrap-launchdaemon.test.mjs \
  nexa/deploy/bridge-client-dns.test.mjs \
  nexa/deploy/bridge-gate.test.mjs \
  nexa/deploy/build-candidate.test.mjs \
  nexa/deploy/dashboard-gate.test.mjs \
  nexa/deploy/ensure-free-space.test.mjs \
  nexa/deploy/native-ingress.test.mjs \
  nexa/deploy/refresh-native-dns.test.mjs \
  nexa/deploy/run-bounded-build.test.mjs \
  nexa/deploy/smoke-model.test.mjs \
  nexa/deploy/stop-owned-bridge.test.mjs \
  nexa/deploy/tsc-ratchet.test.mjs \
  nexa/new/tests/unit/deployment-policy.test.mjs
```

**59 executed tests PASS, 0 fail।** Named fixture-cleanup-dependent case স্পষ্টভাবে বাদ দেওয়া হয়েছিল। Node output-এ skipped 0 থাকলেও পুরো unrestricted suite PASS বলা হয়নি।

Database rollback পরীক্ষা original `nexa/tests/test_database_rollback.py` দিয়ে task-local `database-tests-retained.py` wrapper-এর মাধ্যমে চালানো হয়েছে। `/usr/bin/python3 <local-cache>/database-tests-retained.py` exit 0; **2 tests PASS**। `TemporaryDirectory` cleanup disabled ছিল, fixtures retained এবং rollback assertions অপরিবর্তিত। Wrapper ও temporary fixtures public distribution-এর অংশ নয়।

প্রথম 3 GiB process-budget attempt admission-এ reject হয়; কোনো test শুরু হয়নি। ছোট unit workload-এর জন্য cap 768 MiB করা হয়; তারপর fresh 30.34 seconds / 30 samples-এর quiet admission ও 10 GiB system reserve যাচাই হয়। Node peak RSS প্রায় 200 MiB; watchdog stop হয়নি। Python run ছোট হওয়ায় RSS sampler কোনো nonzero peak ধরেনি—এটি zero-memory usage-এর দাবি নয়।

## Updater dry run-এর সীমা

`nexa/deploy/omni-updater.sh`-এর reviewed modes হলো `update`, `redeploy`, `build-only`। নিরাপদ dry-run mode নেই। `build-only` actual build ও install smoke চালায়। `nexa/update.mjs`-এ dry-run flag নেই; `--dry-run` ধরে সেটি চালালে read-only ফল নিশ্চিত হয় না এবং fetch/merge হতে পারে। তাই updater বা source updater চালানো হয়নি।

এই verification-এ build, pack, install, deploy, LaunchDaemon reload, sudo, secret rotation বা source push হয়নি। Source ও runtime health যাচাই existing artifact দিয়ে হয়েছে।

## পরবর্তী কাজ

Disk-space blocker এই snapshot-এ দূর হয়েছে; RAM/process admission প্রতি কাজের আগে দরকার। Native Artifact automatic comment/reconnect QA বাকি। Completed CLI route probes পুনরাবৃত্তির কারণ নেই। Owner checks মেনে স্পষ্ট নির্দেশ না দেওয়া পর্যন্ত automation paused থাকবে।
