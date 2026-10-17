> **ঐতিহাসিক নথি — public copy, ২০২৬-১০-১৭।** মূল ঘটনার তারিখ ও ফল এই নথির নিজস্ব সময়ের জন্য প্রযোজ্য; পরের সংযোজন থাকতে পারে। বর্তমান অবস্থা ও কাজের নিয়মের জন্য [বর্তমান handoff](../CURRENT-STATUS-2026-10-17.md) পড়ুন। Private reference ও identifier সরানো হয়েছে; স্থানীয় evidence এখানে অন্তর্ভুক্ত নেই। পুরোনো cleanup, build, deploy বা service command বর্তমান অনুমতি হিসেবে ব্যবহার করবেন না।

# Agent Bridge connection repair: বাংলা handoff

মালিক: Jillur Rahman / NexaLance<br>
তারিখ: 2026-10-02, Asia/Dhaka<br>
চূড়ান্ত native পরীক্ষার সময়: প্রায় 12:51; রিপোর্ট প্রস্তুত: প্রায় 13:00।

এই ফাইল আগের HANDOFF-OMNIROUTE-2026-10-02.md এবং Agent Bridge durability রিপোর্টের পরবর্তী সংযোজন। আগের ফাইলগুলো পরিবর্তন করা হয়নি। আগের রিপোর্টে root helper activation বা permanent overlay নিয়ে যে কাজ বাকি ছিল, তার বর্তমান অবস্থা নিচে আছে। গোপন credentials ও ব্যক্তিগত chat content এই রিপোর্টে নেই।

## 1. বর্তমান ফলাফল

স্থায়ী overlay fixes build/package-এর মধ্যে আছে এবং live runtime-এ deploy হয়েছে। Service health, isolated inference, localhost HTTPS ingress, native Claude Code Sonnet/Opus এবং একই session resume পাস করেছে। আলাদা DNS failure অন্য চলমান stream বা Bridge listener বন্ধ করেনি। Configuration এবং original account login অক্ষত আছে।

| বিষয় | যাচাইকৃত অবস্থা |
|---|---|
| OmniRoute stable base | 3.8.51, upstream c1e30b767 |
| Production source | nexalance, 5b26705ba, origin-এ pushed, working tree clean |
| Production Bridge | PID 22377, 127.0.0.1:8443; এটি পরীক্ষার সময়কার PID, restart-এ বদলাবে |
| Service | 127.0.0.1:28128, health ok |
| Dashboard | http://omni.local/dashboard/tools/agent-bridge |
| Native HTTPS ingress | localhost 443, root-owned LaunchDaemon; TLS ও native requests সফল |
| Native account | Claude firstParty / claude.ai / Max, logged in |
| Active Claude OAuth connections | 2; পরিকল্পিত তৃতীয় account এখনও যুক্ত হয়নি |
| Exact-model mappings | 13, আগের mappings অপরিবর্তিত |
| Prompt compression | off |
| Native app signature | /Applications/Claude.app-এ codesign --verify --deep --strict সফল |
| Upstream fix | PR #15323, open draft; CI/review এখনও সম্পূর্ণ নয় |

## 2. শুধু option configure করেছি, নাকি code-ও বদলেছি?

OmniRoute-এর code-এ compatibility ও reliability fixes লাগানো হয়েছে। শুধু dashboard options দিয়ে এই সমস্যাগুলো সমাধান করা যায়নি। Production fork-এর upstream base সরাসরি edit করে রাখা হয়নি: সব পরিবর্তন nexa/patches/, nexa/new/ এবং nexa/deploy/-এ versioned আছে। Build-এর সময় apply হয়; source checkout আবার pristine অবস্থায় ফিরে আসে। চূড়ান্ত pristine-base check সফল।

Native Claude app bundle বা Claude Code binary patch করা হয়নি। Existing account, history/project directory ও native login ব্যবহার করা হচ্ছে। Persistent Claude settings বা shell-এ ANTHROPIC_BASE_URL, ANTHROPIC_AUTH_TOKEN, ANTHROPIC_API_KEY override দিয়ে বিকল্প account profile বানানো হয়নি।

প্রধান versioned অংশ:

- nexa/patches/src__mitm__server.cjs.patch: native transport, request error isolation ও bounded shutdown।
- nexa/patches/src__mitm__manager.ts.patch: shared lifecycle, startup/stop locking, PID ownership ও recovery।
- nexa/new/src/mitm/processLifecycle.ts: আলাদা runtime bundle-এর মধ্যে একই process lifecycle state।
- nexa/patches/open-sse__config__anthropicHeaders.ts.patch: client-negotiated message-thread beta।
- nexa/new/tests/unit/agent-bridge-native-transport.test.ts, agent-bridge-lifecycle.test.ts, agent-bridge-client-beta.test.ts: regression coverage।
- nexa/deploy/: scoped HTTPS ingress installer, launchd bootstrap retry, owned-process shutdown, package gates, disk-space guard ও updater।

## 3. Connection path ও Start/Stop-এর অর্থ

```text
Existing native Claude / Claude Code
  → api.anthropic.com, HTTPS :443
  → localhost SNI forwarder
  → Agent Bridge :8443
  → local OmniRoute :28128 / native Anthropic messages route
  → connected Claude OAuth provider / requested model
```

Root ingress নিজে TLS decrypt করে না; encrypted bytes forward করে। Trusted local CA দিয়ে TLS termination হয় Agent Bridge-এ। Forwarder শুধু api.anthropic.com-এর SNI Bridge-এ পাঠায়। অন্য hostname Local router-এর 127.0.0.2:443-এ যায়। IPv4 ও IPv6 loopback support আছে। Bridge backend বন্ধ থাকলে Anthropic connection direct upstream-এ যায়; original account-এর quota/entitlement তখন প্রযোজ্য।

Dashboard Start/Stop-এর উদ্দেশ্য provider routing চালু/বন্ধ করা। Stop-এর পরে native default connection মানে default account-এর quota ফিরে পাওয়া নয়। সেই account-এর weekly limit শেষ থাকলে native default service limit দেখাতে পারে।

Stop/update-এর সময় অসম্পূর্ণ request বন্ধ হতে পারে। বর্তমান bounded shutdown পুরোনো process আটকে থাকার সমস্যা সমাধান করে; চলমান stream transfer করে zero-downtime deployment করার ব্যবস্থা এটি নয়।

## 4. প্রতিটি observed সমস্যা এবং স্থায়ী সমাধান

### 4.1 Restart/login-এর পরে ECONNREFUSED

Hosts routing localhost-এ ছিল, কিন্তু native HTTPS :443 ingress boot-এ প্রস্তুত ছিল না। Root-owned LaunchDaemon দিয়ে stable :443 → :8443 path স্থাপন হয়েছে। Bridge বন্ধ থাকলে direct upstream fallback রয়েছে। Helper বর্তমান account, certificate বা app bundle পরিবর্তন করে না।

Installer: ~/Developer/OmniRoute/nexa/deploy/install-native-ingress.sh<br>
Helper: /Library/Application Support/OmniRoute-Native-Ingress/native-ingress.mjs<br>
Plist: /Library/LaunchDaemons/com.nexalance.omniroute-native-ingress.plist

একবার actual Mac reboot-এর পরে helper auto-start ও native Max login বজায় থাকার প্রমাণ পাওয়া গেছে। সেটি শেষ 5b26705ba deployment-এর আগে। শেষ deployment-এর পরে service recovery ও real native inference পরীক্ষা হয়েছে; আরেকটি পূর্ণ Mac reboot করা হয়নি।

### 4.2 MITM server failed to start: port 8443 is already in use

Manager-এর আলাদা bundled copy-তে আলাদা ownership/starting state ছিল। Recovery ও dashboard একই সঙ্গে child spawn করতে পারত। Failed child active server-এর PID record মুছতে পারত।

এখন global Symbol registry-তে lifecycle state ও locks থাকে। Existing persisted live PID থাকলে নতুন listener spawn হয় না। Ready হওয়ার পরে PID publish হয়। Exiting child শুধু নিজের PID record মুছতে পারে। Live duplicate-start test-এ দ্বিতীয় start প্রত্যাখ্যাত হয়েছে এবং original PID/listener অক্ষত ছিল।

### 4.3 Connection lost mid-response / Connection problem / gateway failure

একটি passthrough DNS lookup-এর async rejection server request boundary-তে handle হচ্ছিল না। project-01.local resolve না হলে পুরো Bridge process বন্ধ হতে পারত, যার ফলে অন্য native sessions-এর stream কেটে যেত।

এখন request handler-এর rejection ধরে শুধু সেই request-এ sanitized 502 দেওয়া হয়। Response শুরু হয়ে গেলে শুধু আক্রান্ত response connection বন্ধ হয়। Fixture-এ অন্য SSE stream সম্পূর্ণ হয়েছে। Final live native stream চলার সময় deliberately failing DNS request-এ 502 এসেছে, কিন্তু PID 22377 ও listener টিকে ছিল। এটি observed crash cause-এর fix; সব ধরনের internet/upstream error অদৃশ্য করার দাবি নয়।

### 4.4 Bootstrap failed: 5: Input/output error

launchd bootout-এর teardown শেষ হওয়ার আগে bootstrap হলে অথবা job ইতিমধ্যে loaded থাকলে error 5 আসতে পারে। Installer এখন job state দেখে অপেক্ষা ও bounded retries করে; job ইতিমধ্যে loaded থাকলে সেটিকে success হিসেবে চিনতে পারে। Identical loaded helper অকারণে বদলানো হয় না। বারবার bare launchctl bootstrap চালানো সমাধান নয়।

### 4.5 Native thread payload-এ 400

Installed Claude Code 2.1.287 message-threads-2026-08-12 beta negotiate করে। Header whitelist-এ flag না থাকায় provider thread/diagnostics payload reject করতে পারত, পরে SDK fields বাদ দিয়ে retry করত।

Client নিজে যে beta negotiate করেছে, শুধু সেটি forward করা হয়। thread/diagnostics payload অক্ষত থাকে। Final Sonnet high এবং resumed medium request দুটিতে thread ও diagnostics ছিল এবং দুটিই 200 পেয়েছে। তিনটি final test request-এ thread-সংক্রান্ত 400 artifact পাওয়া যায়নি। Specific flag-এর প্রমাণ installed CLI এবং local request evidence; সাধারণ beta header documentation সেই নির্দিষ্ট flag-এর public documentation নয়।

### 4.6 Restart-এর সময় পুরোনো process alive, কিন্তু port বন্ধ

373b7db7b deployment-এ server.close-এর পরে unfinished TLS/keepalive connection পুরোনো process ধরে রেখেছিল। PID alive থাকায় recovery নতুন listener শুরু করেনি। Deployment verification ব্যর্থ হয়েছে এবং updater আগের complete runtime ও database restore করেছে। ব্যর্থ update-কে success বলা হয়নি।

Permanent fix-এ connection tracking, idle cleanup এবং 1-second bounded deadline আছে। updater-এর stop-owned-bridge.mjs exact Node/current-runtime Bridge argv ও PID ownership যাচাই করে soft stop দেয়; প্রয়োজন হলে আবার ownership যাচাই করে bounded force stop করে। Unrelated/reused PID-তে signal দেয় না। Unfinished TLS fixture fix-এর আগে failed এবং পরে passed। Final deployment এরপর সফল হয়েছে।

### 4.7 Build-এর সময় ENOSPC

প্রথম নতুন build internal disk full হওয়ায় থেমেছিল; live service তখন replace হয়নি। শুধু inactive generated build output T7-তে নতুন archive directory-তে রাখা এবং file/symlink hash verification-এর পরে internal generated copies সরানো হয়েছে। Personal data বা T7 original মুছে ফেলা হয়নি।

নতুন guard source build-এর আগে 24 GiB ও staged install-এর আগে 6 GiB free space চায়। এগুলো বর্তমান package/build-এর জন্য guard budget; ভবিষ্যতে package বড় হলে budget review দরকার। Low-space rejection পরীক্ষায় live Bridge সচল ছিল।

## 5. বর্তমান runtime configuration

গোপন key values এখানে রাখা হয়নি। DATA_DIR হল ~/.omniroute-local/।

```dotenv
OMNIROUTE_SERVER_HOST=127.0.0.1
PORT=28128
MITM_LOCAL_HOST=127.0.0.1
MITM_LOCAL_PORT=8443
MITM_TARGET_AGENT=claude-code
MITM_SELECTED_ONLY=true
MITM_AUTO_RECOVER=true
MITM_ROOT_CA_ENABLED=true
MITM_DISABLE_TLS_VERIFY=0
MITM_IDLE_TIMEOUT_MS=600000
STREAM_READINESS_TIMEOUT_MS=600000
STREAM_READINESS_MAX_TIMEOUT_MS=600000
STREAM_IDLE_TIMEOUT_MS=600000
```

Selected-agent ownership থাকায় একই api.anthropic.com hostname ব্যবহার করা Kiro mapping native Claude request-এর owner হয়ে যায় না। Model ও effort fields native transport-এ রাখা হয়। Exact-model routing এবং compression off আছে; provider executor-এর নিজস্ব adaptation থাকার কারণে upstream payload সর্বক্ষেত্রে byte-for-byte identical বা output quality সর্বক্ষেত্রে 100% identical দাবি করা হয়নি।

## 6. Build এবং update durability

Final source commit: 5b26705ba। Compiled frontend/TypeScript build: 373b7db7b। এই দুই commit-এর মধ্যে production frontend/TS inputs বদলায়নি; final changes separately loaded CJS server, tests ও deployment tooling-এ। তাই verified compiled output রেখে নতুন CJS deploy করা হয়েছে। dist/BUILD_BRIDGE_SHA component provenance হিসেবে 5b26705ba রেকর্ড করে। Frontend নতুন করে 5b-তে compile হয়েছে বলা হচ্ছে না।

Final package: ~/.omniroute-builds/3.8.51-5b26705ba/omniroute-3.8.51.tgz<br>
Runtime: ~/.omniroute-runtime/lib/node_modules/omniroute/<br>
CJS server SHA256: 0146995e5381c7d9ca8b4e64df83007a2c57af7286e6fa82c29d964b8ec97d9d

Update path:

1. Dashboard Update button বা omni-ctl update versioned overlay updater চালায়। Continuously automatic release-install scheduler নেই।
2. Latest stable release source নেওয়া হয়; local overlay apply হয়। Dirty source বা patch conflict থাকলে deploy-এর আগে থামে।
3. Core typecheck, TypeScript ratchet, required regression এবং native package gate চালায়।
4. Source/dist CJS match, lifecycle, request isolation, thread-beta source support এবং bounded shutdown যাচাই করে।
5. Isolated package smoke-এ service, auth, catalog, inference, Bridge state ও CORS যাচাই হয়।
6. Private database/config backup এবং complete previous runtime prefix রেখে নতুন prefix promote হয়।
7. Service ও actual local Bridge/ingress TLS verification সফল হলে update status ok হয়। ব্যর্থ হলে previous prefix/database rollback হয়।

Managed omni-ctl update-npm/stock replacement path blocked, কারণ stock npm package custom overlay বাদ দিতে পারে। এই guard সরাসরি অন্য কোনো manual npm command-কে আটকায় না; managed update path ব্যবহার করতে হবে। ভবিষ্যতে upstream patched region বদলালে updater নিরাপদে reject করতে পারে; তখন overlay re-cut ও নতুন validation লাগবে। তাই update-safe অর্থ incompatible update deploy না হওয়া এবং fixes versioned থাকা, ভবিষ্যতের সব release অজানা অবস্থায় guaranteed compatible বলা নয়।

দৈনন্দিন commands:

```bash
omni-ctl status
omni-ctl update-status
omni-ctl logs
# নতুন stable upstream release + overlay build/deploy:
omni-ctl update
# বর্তমান committed overlay আবার build/deploy:
omni-ctl redeploy
# live service না বদলে build + isolated smoke:
omni-ctl build-only
```

Update deployment চলমান stream বন্ধ করতে পারে; active কাজ শেষ করে update দেওয়া সুবিধাজনক। Build ও validation background-এ চলতে পারে, কিন্তু runtime promotion-এর ছোট interruption থাকে।

## 7. চূড়ান্ত পরীক্ষার প্রমাণ

Evidence directory: ~/Documents/Codex/2026-10-02/agent-bridge-lifecycle-1128/। Raw logs-এ private operational data থাকতে পারে; public PR-তে copy করা হয়নি।

| পরীক্ষা | ফলাফল / evidence |
|---|---|
| Required final regression gate | 64/64, shutdown-regressions.log |
| Native transport + lifecycle + beta | 19/19, shutdown-after.log |
| Updater/installer/ingress/disk/ownership helpers | 15/15, shutdown-helpers.log |
| Core TypeScript | passed, shutdown-core.log |
| TypeScript ratchet | 5830 measured / 5830 baseline, shutdown-ratchet.log; full TS zero-error নয় |
| MCP/service Vitest | 493/493; relevant compiled TS unchanged in final CJS-only revision |
| Generic upstream focused suite | 19/19 at 38adfbd81, upstream-shutdown.log |
| Earlier broader generic suite | 411/411, upstream-broad-serial.log |
| New package gate | passed, shutdown-package-gate.json |
| Isolated installed package | all checks true, 3.8.51-5b26705ba/isolated-smoke-20261002-124823.json |
| Native Sonnet high | success, 2902 ms, final-native-sonnet.json |
| Same native session resume, medium | success, 2453 ms; previous marker remembered, final-native-resume.json |
| Native Opus high stream | success, 13542 ms, 227 partial events, completion marker; final-native-opus.jsonl |
| Actual provider request status | তিনটি own request-ই 200; Sonnet thread retained; high/medium effort retained |
| Duplicate start | rejected, same live PID; final-live-failure-isolation.json |
| Concurrent bad DNS | 502, listener survived, PID preserved; same artifact |
| Config/CA/targets/mappings/DB | unchanged relevant values + integrity ok; final-config-preservation.json |
| Native app integrity | codesign deep/strict passed |

Full repository Node run-এ inherited failures ছিল: 44957 total, 44860 passed, 68 failed, 29 skipped; baseline comparison ও #15306-এ tracked। Focused green checks-কে full repository green বলা হয়নি। PR checks এখনও pending/queued থাকতে পারে।

## 8. Backups এবং recovery

| অবস্থান | ব্যবহার |
|---|---|
| ~/.omniroute-local/update-backups/20261002-124823 | latest pre-deploy database/config backup |
| ~/.omniroute-builds/runtime-backups/20261002-124823 | latest complete previous runtime prefix |
| ~/.omniroute-builds/3.8.51-9aafb2c4c/omniroute-3.8.51.tgz | আগের working package |
| ~/.omniroute-builds/runtime-backups/failed-20261002-123247 | failed 373 deployment retained for diagnosis |
| ~/.omniroute-builds/runtime-backups/failed-data-20261002-123247 | failed-deploy database state retained |
| source tag nexa-prelease-20261002-1247-bounded-shutdown | pre-final-fix rollback anchor, 373b7db7b |

T7 generated-output archives: Build-Artifact-Archive-20261002-1219/।

- build-before-beta-1214.tar: 139557 files ও 17 symlinks verified; SHA256 bb7f94774a8551d8a4dcc0bf8b1dad18cc5bfffe4b0acbf2a20c0346ef44ae10।
- main-source-build.tar: 200260 files ও 18 symlinks verified; SHA256 997a3b5e2714523b42333c33ce2f2bdca6408a0086b39aa2907434c8e0731481।
- verification-complete.json এবং main-source-verification.json archive evidence রাখে।

Updater failed promotion-এর পরে previous complete prefix ও database restore করে actual health যাচাই করে। Database restore করার আগে নতুন live writes থাকলে সেগুলো সংরক্ষণ করতে হবে; পুরোনো snapshot blindly copy করলে নতুন provider/config changes হারাতে পারে। Manual rollback দরকার হলে updater log ও exact backup scope আগে review করতে হবে। কোনো recursive delete বা shared-source reset প্রয়োজন নেই।

## 9. Native updates, quota, features এবং বাকি সীমা

Claude app/CLI-এর native update mechanism আগের setup review-এ active পাওয়া গেছে। Bundle অপরিবর্তিত এবং signature valid। নতুন vendor version endpoint/header/protocol বদলালে compatibility আবার test করতে হবে। Latest future version install করে সব workflow পরীক্ষা করা হয়নি।

Current original account login বজায় আছে। Provider pool-এ 2 active Claude OAuth connection আছে। তৃতীয় account যোগ করতে account owner-এর OAuth login প্রয়োজন; এটি এই repair-এর অংশ হিসেবে করা হয়নি। Account quota শেষ হলে Bridge নতুন credits তৈরি করে না। Available provider entitlement ও upstream availability প্রযোজ্য।

13 mappings: Fable 5/5.1, Haiku 4.5, Opus 4.5/4.6/4.7/4.8/5/5.5, Sonnet 4.5/4.6/5/5.5। Mapping থাকা মানেই retired model বা সব effort combination upstream-এ available নয়। Latest final live checks Sonnet 5.5 high/medium এবং Opus 5.5 high-এর। Earlier model/effort tests আগের handoff-এ আছে।

Cloud Routine execution এই Mac-এর local Bridge দিয়ে automatically যায় না; original account-এর quota/entitlement থাকে। Local scheduled task-এর জন্য app open/computer awake লাগতে পারে; scheduled execution-এর end-to-end parity এখনও পরীক্ষিত নয়। Desktop-এর latest repair-এর পরে নতুন বাস্তব project task submit করা হয়নি; আগের successful user confirmation এবং বর্তমান native CLI transport proof আলাদা evidence।

Local WordPress HTTPS live QA সীমিত: reboot-এর পরে Local/router চালু ছিল না, direct 127.0.0.2:443 ও HTTP80 refused হয়েছে। অন্য-SNI routing-এর fixture পাস করেছে, কিন্তু চলমান Local site-এর পূর্ণ browser QA করা হয়নি।

Network drop, exhausted upstream quota, provider error, explicit Stop বা future protocol change এখনও connection/error ঘটাতে পারে। এই repair-এ reproduced local crash, duplicate listener, stale ownership, thread-header ও reboot ingress causes সমাধান হয়েছে। Output quality blind benchmark বা all-feature 100% parity দাবি করা হয়নি।

## 10. Source ও upstream handoff

Fork: https://github.com/developerjillur/OmniRoute, branch nexalance, 5b26705ba।<br>
Generic fix PR: https://github.com/diegosouzapw/OmniRoute/pull/15323, head 38adfbd81।

PR-তে native protocol preservation, shared ownership, failure isolation, client-negotiated thread beta, bounded shutdown এবং LISTEN-only preflight আছে। Machine-specific root installer/updater paths, credentials ও local provider configuration PR-তে নেই। PR open draft; upstream acceptance/merge এবং queued CI এখনও আলাদা pending কাজ। Fork source pushed আছে, তাই live fixes শুধু installed runtime-এর অস্থায়ী edits নয়।

NEXA-AGENT-BRIDGE-CONNECTION-FIX-2026-10-02.patch হল c5ce21a1c → 5b26705ba incremental nexa/ change export। এটি complete original setup installer নয়; current HEAD-এ আবার apply করা যাবে না। Complete current setup-এর source-of-truth হল versioned fork commit ও আগের durability files।

এখন নতুন login বা administrator command প্রয়োজন নেই। কোনো সমস্যা ফিরলে প্রথমে timestamp, update-status, service health, 8443 listener, ingress state ও upstream response/quota আলাদা করে দেখতে হবে; অন্য process kill বা account logout দিয়ে শুরু করা যাবে না।


<!-- handoff-consolidation-2026-10-03 -->

## Latest consolidated handoff: 2026-10-03

Puro setup, Agent Bridge connection/lifecycle fixes, Local coexistence/DNS, durable nexa overlay, quota recovery, coding/context configuration, build RAM/disk control, tests, update/rollback ebong remaining gaps ekshathe: [HANDOFF-OMNIROUTE-2026-10-03-CONSOLIDATED.md](HANDOFF-OMNIROUTE-2026-10-03-CONSOLIDATED.md).

Latest recorded deployment/source/runtime f77079418, OmniRoute 3.8.51; final native CLI Opus/Sonnet ebong Desktop Code response successful. Tar pore coding settings-er 14 checks, native Read/follow-up, large-context observation ebong TLS/DNS gate successful. Ei file-er earlier builds, pending promotion ba cached-quota OFF descriptions historical; latest policy cached exhausted-account skip ON, preflight OFF. Future reset live recovery, remaining Thread mismatch telemetry, full 24-hour soak/new reboot ebong every native feature ekhono separate scope.

Documentation consolidation-e earlier content preserve kora hoyeche; new build ba live service mutation hoyni. User-er 2026-10-03 rule onujayi other people's public repositories-e PR/issue action designated owner session-er; help findings/patch oss-contrib/inbox-e hand over korte hobe. Purono direct-PR workflow latest authorization noy.
