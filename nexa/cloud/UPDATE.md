# Cloud update, acceptance ও rollback

Public service `https://nexaomni.nexaconnect.cloud`; live data `/opt/nexaomni/data`, protected environment `/opt/nexaomni/private/runtime.env`। Application base ও custom overlay-এর pin আলাদা রাখুন। [API contract](API-CONTRACT.md) ও [machine-readable profile](api-contract.json) release acceptance-এর অংশ।

## ১. Source ও resource admission

নতুন release-এর জন্য নতুন directory নিন। Existing application checkout বা T7 source overwrite করবেন না। Current upstream base `nexa/manifest.json`-এ আছে; অন্য version হলে patch compatibility ও migration review আবার করতে হবে। Canonical optimizer commit এবং application integration commit দুটোই receipt-এ রাখুন।

সব custom code `nexa/` থেকে apply হবে। Retired patch-এর path/hash অক্ষত রাখুন; একই target-এ নতুন fix লাগলে আলাদা active patch দিন। Applied tree থেকে commit করবেন না। Before build:

```sh
node nexa/check/pristine-base.mjs
node nexa/apply.mjs --check
```

Source inventory-এর প্রতিটি byte/hash এবং নতুন files registration মিলতে হবে। Diagnostic source copy থাকলে exact file ও তার canonical `nexa/` copy যাচাই করে retained directory-তে রাখুন; pristine-base gate এড়িয়ে যাবেন না।

Build admission: host-এ অন্তত 10 GiB headroom-এর সঙ্গে build-এর 8 GiB RSS budget থাকতে হবে, swap growth ও disk headroom মাপতে হবে। Node 24.15.0, one worker, heap 6144 MiB, process-group RSS cap 8192 MiB, Docker memory 10 GiB/CPU 4 ব্যবহার করুন। Existing dependency cache কেবল exact `package-lock.json` মেলা সাপেক্ষে reuse করুন। Heavy jobs ধারাবাহিকভাবে চলবে।

Named build-এ `nexalance.job` label দিন। Host guard-এর আলাদা receipt রাখুন:

```sh
python3 nexa/cloud/watch-build.py \
  --container YOUR_BUILD_CONTAINER \
  --expected-job YOUR_BUILD_LABEL \
  --report /opt/nexaomni/releases/RELEASE_ID/resource-guard.json
```

Guard container-এর immutable ID ধরে রাখে। Available RAM 8 GiB-এর নিচে, swap growth 1 GiB-এর বেশি বা free disk 15 GiB-এর নিচে গেলে শুধু ওই container বন্ধ হয়। Previous resource receipt overwrite হয় না। App ও অন্য services বন্ধ করে build-এর জায়গা তৈরি করবেন না।

## ২. Build ও artifact gate

Pristine isolated application থেকে `nexa/cloud/build.sh` অথবা recorded dependency-reuse build চালান। Mandatory gates: core types, completed full compiler ratchet, provider/deployment/native Bridge/UI/security regressions, `test-contracts.sh`, production dashboard, CLI, package artifact ও package hash। Compiler interruption বা `tscErrors=SKIP` acceptance নয়। Existing TypeScript ceiling বাড়িয়ে gate সবুজ করবেন না।

নতুন image শুধু verified `dist/`, `Dockerfile` ও `start-cloud.sh` দিয়ে বানান। Runtime environment/data/source history build context-এ দেবেন না। Image tag ও immutable ID receipt-এ রাখুন। Compose-এ `pull_policy: never` থাকে; required local image না থাকলে promotion থামে।

## ৩. Isolated candidate

একটি নতুন private directory-তে live database-এর consistent snapshot এবং independent candidate তৈরি করুন:

```sh
python3 nexa/cloud/prepare-candidate.py \
  --root /opt/nexaomni \
  --destination /opt/nexaomni/releases/RELEASE_ID/candidate

python3 nexa/deploy/check-upgrade-data.py \
  --database /opt/nexaomni/releases/RELEASE_ID/candidate/snapshot.sqlite
```

Candidate-এ Google connections সক্রিয় থাকে; অন্য providers inactive ও তাদের credentials বাদ যায়। Claude/Codex rotating refresh token দুই runtime-এ ব্যবহার হয় না। Existing API-key records শুধু private candidate-এ authentication যাচাইয়ের জন্য থাকে; production-এ নতুন key তৈরি হয় না। Conversation/request history বহন করা হয় না। Snapshot/environment/receipt private থাকে।

Migration preflight-এ affected record থাকলে promotion থামে; record মুছে gate সবুজ করবেন না। নতুন upstream version হলে অতিরিক্ত migrations-ও cloned data-তে যাচাই করতে হবে।

```sh
export NEXAOMNI_CANDIDATE_IMAGE=nexaomni:YOUR_VERIFIED_TAG
export NEXAOMNI_CANDIDATE_ENV=/opt/nexaomni/releases/RELEASE_ID/candidate/runtime.env
export NEXAOMNI_CANDIDATE_DATA=/opt/nexaomni/releases/RELEASE_ID/candidate/data
docker compose -f nexa/cloud/compose.candidate.yaml up -d --wait

python3 nexa/cloud/verify-api.py \
  --base http://127.0.0.1:18129 \
  --credentials /opt/nexaomni/releases/RELEASE_ID/credentials.env \
  --output /opt/nexaomni/releases/RELEASE_ID/candidate-acceptance.json \
  --providers gemini --media --tools
```

`credentials.env`-এ existing `NEXAOMNI_API_KEY` লাগবে; mode 0600। Key terminal/chat/log-এ ছাপাবেন না। Candidate port শুধু loopback; Traefik exposure disabled। আগে port/container ownership যাচাই করুন। Report-এর প্রত্যেক `passed` সত্য হতে হবে; HTTP 200 বা health একা যথেষ্ট নয়। Candidate database কখনো production-এ copy back করবেন না।

## ৪. Promotion ও পরের পরীক্ষা

Fresh consistent live database snapshot, matching encryption environment, current compose ও image ID একটি নতুন protected rollback directory-তে রাখুন। Verified image ID মিলিয়ে production compose-এর image tag update করুন; private environment/data paths বহাল রাখুন। Existing requests-এর অবস্থা দেখে 45-second graceful stop period দিয়ে service recreate করুন।

Live acceptance-এ `verify-api.py --providers gemini,claude,codex --media --tools` চালান। Configured accounts-এর individual test-এ actual selected connection trace যাচাই করুন। আগে cached transcript পড়াকে fresh Plan B generation বলবেন না; Vanalyzer-এ অন্তত একটি uncached generated transcript ও নতুন semantic context call পরীক্ষা করুন। API key, provider count, aliases/settings এবং restart durability আলাদা করে যাচাই করুন।

Source, CI, artifact, candidate, deployment ও upstream inference-এর ফল receipt-এ আলাদা থাকবে। সব provider/model/hosted feature-এর universal parity কোনো ছোট smoke test প্রমাণ করে না। Media inaccessible/quota/auth failure-এ explicit error ও bounded recovery থাকবে।

## ৫. Rollback

একই database schema-তে code rollback হলে retained পুরোনো image দিয়ে একই live data/environment চালানো যায়। Incompatible migration rollback-এ consistent matching database/environment pair প্রয়োজন; stale rotating OAuth state আলাদা recovery চাইতে পারে। কোনো restore-এর আগে বর্তমান state নতুন rollback snapshot-এ ধরে রাখুন।

শুধু নিজের candidate/build container বন্ধ করুন। Derived packet, source video, browser profile বা অন্য service-এর volume এই update workflow পরিষ্কার করে না। Vanalyzer-এর source 24-hour retention ও generated cache policy তার নিজস্ব service পরিচালনা করে।
