# NexaOmni cloud deployment

এই deployment local `omni.local` ও server-এর অন্য OmniRoute service থেকে স্বাধীন। Application base `v3.8.52` / `ad6f33f66bda34eba98645d3bfdabbde294bc843`; routing ও reliability overlay `614c46cca8a4480fb300ff6bc6d603f363cbcca9` থেকে নেওয়া। Cloud tools এই directory-তে সংরক্ষিত। Full build-এর সময় ধরা পড়া `mitm-unexpected-child-exit` test fixture-এর event lifecycle সংশোধনের একটি patch যোগ হয়েছে; production routing code বদলায়নি।

## Source ও build

একটি নতুন isolated checkout-এ exact application base রাখুন এবং `upstream-main` local ref ওই commit-এ বসান। Reviewed optimizer source থেকে `nexa/` copy করে integration commit সংরক্ষণ করুন। `build.sh` pristine checkout-এ একবার চলে; ইতিমধ্যে applied source-এ আবার চালানো যাবে না।

Build runtime `node:24.15.0-bookworm`, heap 6144 MiB, process-tree RSS 8192 MiB, worker 1। Build container-এ memory 10 GiB, swap নিষ্ক্রিয়, CPU 4 এবং PID limit 768। `watch-build.py` server-এ শুধু `nexaomni-build` container পর্যবেক্ষণ করে; available RAM 8 GiB-এর নিচে, swap বৃদ্ধি 1 GiB-এর বেশি বা free disk 15 GiB-এর নিচে গেলে ওই job বন্ধ করে। কাজ শুরুর আগে অন্তত 10 GiB system headroom-এর সঙ্গে build budget-এর জায়গাও রাখতে হবে।

`build.sh` overlay compatibility, dependency installation, core types, provider tests, deployment tests, full TypeScript ratchet, native Bridge tests, UI/security tests, production dashboard, CLI এবং package artifact checks চালায়। কোনো gate ব্যর্থ হলে runtime promotion বন্ধ থাকবে। Linux test result macOS native DNS/desktop acceptance প্রতিষ্ঠা করে না।

Runtime-এর packaged entry `server-ws.mjs`; `start-cloud.sh` secrets, বাধ্যতামূলক API key ও secure-cookie configuration যাচাই করে এটি চালায়। Packaged SQL migrations এই version-এ `/app/src/lib/db/migrations`-এ আছে; `OMNIROUTE_MIGRATIONS_DIR` সেট করলে সেই path দিন। Runtime heap 2048 MiB, container limit 3 GiB এবং graceful stop period 45 seconds।

Build container-এর mounts:

```text
/opt/nexaomni/source       -> /app
/opt/nexaomni/build-output -> /output
/opt/nexaomni/evidence     -> /evidence
```

Package-verified `dist/` থেকে `Dockerfile` দিয়ে runtime image বানান। Docker build context-এ শুধু `dist/`, এই Dockerfile ও `start-cloud.sh` রাখুন; `.env`, private data, source history বা browser profiles দেবেন না। `compose.yaml` শুধু authenticated gateway-টি প্রকাশ করে। Management dashboard ও API একই service-এ চলে।

## Configuration migration

চলমান WAL database সাধারণ file copy করবেন না। Python SQLite backup API দিয়ে নতুন consistent snapshot তৈরি করুন, তারপর:

```sh
python3 nexa/cloud/prepare-config.py --snapshot /private/completed-snapshot.sqlite --destination /private/cloud-config.sqlite
python3 nexa/tests/test_cloud_config.py
```

Exporter snapshot read-only রাখে এবং destination থাকলে overwrite করে না। Provider configuration, aliases, model overrides, quota configuration, database settings ও migration identities সংরক্ষিত হয়। Request history, conversation owners, active sessions ও local API keys বহন করা হয় না। Cloud-এর জন্য আলাদা API key তৈরি করতে হবে।

`STORAGE_ENCRYPTION_KEY`-এর সঠিক মান encrypted provider credentials-এর সঙ্গে প্রয়োজন। সেটি secret channel-এ `/opt/nexaomni/private/runtime.env`-এ রাখুন; source control-এ নয়। নতুন JWT/API secret ব্যবহার করুন। Local dashboard password ও session metadata export হয় না। Cloud-এর জন্য নতুন strong `INITIAL_PASSWORD` দিন; প্রথম login-এ bcrypt hash সংরক্ষিত হয়। সফল bootstrap test-এর private credentials file-এ cloud password ও API key থাকে। Data directory UID/GID 1000:1000 এবং mode 0700; database ও environment mode 0600।

Claude ও Codex-এর rotating refresh tokens দুই runtime-এ ভাগ করা হয় না। ওই connections inactive metadata হিসেবে থাকে এবং credentials বাদ যায়। Cloud-এ আলাদা OAuth login শেষ করার পরে activate করতে হবে। Google-এর non-rotating OAuth ও API-key connections স্বাধীনভাবে স্থানান্তর হয়; successful migration নিজে থেকে upstream acceptance প্রমাণ করে না।

Host DNS, macOS launchd, interception certificates ও local CLI services cloud container-এ স্থানান্তর করা হয় না। Container-এর public API ব্যবহারকারীকে এসব host service-এর access দেওয়া হয় না।

## Runtime ও verification

```text
Dashboard: https://nexaomni.nexaconnect.cloud/
API base:  https://nexaomni.nexaconnect.cloud/v1
Health:    https://nexaomni.nexaconnect.cloud/healthz
Data:      /opt/nexaomni/data
Compose:   /opt/nexaomni/compose.yaml
```

Public domain চালু হওয়ার পরে এই প্রতিটি ফল আলাদা করে সংরক্ষণ করতে হবে: HTTPS certificate ও redirect, health, অননুমোদিত request প্রত্যাখ্যান, dashboard login, authenticated catalog, explicit provider-এর non-streaming ও SSE completion, invalid model/invalid key error, restart-এর পরে configuration ও key durability। Catalog-এ model থাকা real inference acceptance-এর বিকল্প নয়। Provider rejection, quota ও login failure নিজের status-সহ report করুন।

## Backup ও update

`backup.py` consistent SQLite backup, matching environment এবং integrity receipt `/opt/nexaomni/backups/`-এ রাখে। Daily timer 01:30 UTC-এর পরে সর্বোচ্চ 300-second jitter-এ চলে; সর্বশেষ সাতটি marked backup থাকে। Backup-এর পুরো directory private রাখুন এবং আলাদা machine-এ একটি copy সংরক্ষণ করুন। Restore-এর আগে service বন্ধ করে current data অক্ষত নতুন rollback directory-তে রাখুন; database ও environment জোড়া মিলিয়ে ফিরিয়ে আনুন।

Updates নতুন pinned source ও image দিয়ে করুন। পুরোনো image ও fresh consistent data backup রেখে candidate-এ migration ও বাস্তব inference যাচাই করুন। এই service-এর volume ব্যবহার করে দ্বিতীয় instance একসঙ্গে চালাবেন না। অন্য OmniRoute বা Vanalyzer service এই compose project-এর অংশ নয়।

## HTTP clients

2026-10-28-এর public পরীক্ষায় curl, Node ও OpenAI Python SDK-এর user agent accepted হয়েছে। Default `Python-urllib` agent Cloudflare Error 1010 পেতে পারে। নিজের HTTP client-এ application-এর পরিচয়সহ header দিন, যেমন `User-Agent: nexaomni-client/1.0`; `smoke.py` এটি ব্যবহার করে। [Cloudflare-এর নির্দেশনা](https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-1xxx-errors/error-1010/) এই পদ্ধতিই উল্লেখ করে।

`smoke.py` public health, unauthenticated rejection, actual dashboard password login, API key creation ও authenticated catalog যাচাই করে। `--environment`, `--credentials` ও `--evidence`-এ private file path দিন। Existing credentials থাকলে এটি নতুন key তৈরি করে না। Model-এর catalog entry বাস্তব completion-এর নিশ্চয়তা নয়; প্রয়োজনীয় provider/model আলাদাভাবে যাচাই করুন।
