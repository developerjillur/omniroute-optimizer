> **ঐতিহাসিক নথি — public copy, ২০২৬-১০-১৭।** মূল ঘটনার তারিখ ও ফল এই নথির নিজস্ব সময়ের জন্য প্রযোজ্য; পরের সংযোজন থাকতে পারে। বর্তমান অবস্থা ও কাজের নিয়মের জন্য [বর্তমান handoff](../CURRENT-STATUS-2026-10-17.md) পড়ুন। Private reference ও identifier সরানো হয়েছে; স্থানীয় evidence এখানে অন্তর্ভুক্ত নেই। পুরোনো cleanup, build, deploy বা service command বর্তমান অনুমতি হিসেবে ব্যবহার করবেন না।

# Agent Bridge connection repair: PRD ও acceptance record

মালিক: Jillur Rahman / NexaLance<br>
তারিখ: 2026-10-02, Asia/Dhaka<br>
Production source: 5b26705ba; upstream generic head: 38adfbd81।

## উদ্দেশ্য

Existing native Claude account, projects ও sessions ব্যবহার করে provider routing OmniRoute দিয়ে নিয়ন্ত্রণ করা। Observed connection crashes, duplicate 8443 listener, reboot/login ingress failure এবং update-এ fixes হারিয়ে যাওয়ার ঝুঁকি সমাধান করা। Tested native protocol, requested model ও effort বজায় রাখা।

## ব্যবহারকারীর দৃশ্যমান আচরণ

- Agent Bridge চালু থাকলে selected native Claude Code message route connected Claude provider ব্যবহার করবে।
- Original native login/history directory এবং application bundle বজায় থাকবে।
- Bridge বন্ধ বা backend unavailable হলে scoped ingress direct Anthropic connection করতে পারবে; original account quota প্রযোজ্য।
- আলাদা passthrough request failure অন্য sessions-এর listener বন্ধ করবে না।
- Managed update incompatible build/package হলে live promotion-এর আগে থামবে; failed promotion হলে verified previous runtime/database ফিরবে।

## Requirements ও evidence

| ID | Requirement | Acceptance / বর্তমান অবস্থা |
|---|---|---|
| AB-01 | Original account login বজায় | Claude auth firstParty / Max loggedIn; native signature passed |
| AB-02 | Existing session context থাকে | Final synthetic Sonnet session resume previous marker মনে রেখেছে; সব পুরোনো project contents review করা হয়নি |
| AB-03 | Native query/headers/model/effort/payload | Native transport fixture + real high/medium requests passed |
| AB-04 | Native message-thread compatibility | Client-negotiated beta forwarded; final thread-bearing requests 200 |
| AB-05 | Correct shared-host agent owner | MITM_TARGET_AGENT=claude-code; regression test passed |
| AB-06 | One live listener/PID owner | Shared lifecycle locks, readiness PID publication, own-record cleanup; duplicate-start live proof passed |
| AB-07 | Per-request error isolation | Bad DNS 502 while native stream completes; listener survives |
| AB-08 | Bounded shutdown | Unfinished TLS fixture fails before fix, passes after; owned-process helper tested |
| AB-09 | Boot ingress | Root-owned scoped LaunchDaemon installed; earlier actual reboot verified; latest runtime redeploy/recovery/native calls passed |
| AB-10 | launchd installer race handling | Wait/retry/already-loaded fixture tests passed; helper currently active |
| AB-11 | Durable overlay | Source nexa/ only, pristine base check passed, fork 5b26705ba pushed |
| AB-12 | Update/reinstall safety | Package gate + isolated inference + config backup + full-prefix promotion/rollback; managed stock path blocked |
| AB-13 | Rollback proof | Failed 373 deployment restored previous working runtime/database; final 5b deployment successful |
| AB-14 | Disk-full safety | Preflight 24 GiB build / 6 GiB install; low-space rejection without live replacement |
| AB-15 | Config/data preservation | .env/DNS shim/CA/target objects/mappings unchanged; DB integrity ok |
| AB-16 | Final native success | Sonnet high, resumed medium, Opus high stream: three requests 200 |
| AB-17 | Reviewable generic fix | Open draft PR #15323 updated with final scope/tests; upstream review/CI pending |
| AB-18 | Three-account pool | 2 active now; third owner OAuth connection pending |
| AB-19 | Scheduled/Routine feature parity | Cloud execution does not route through local Bridge; scheduled E2E not validated |
| AB-20 | All future app versions and output quality | No universal guarantee; new protocol/model support needs validation; no blind quality benchmark |

## Implementation boundaries

Native app bundle বা CLI binary বদলানো হয়নি। Production base pristine থাকে; build overlay apply হয়। Selected-agent local HTTPS interception ব্যবহার করা হয়, তাই runtime certificate trust, DNS/hosts ও ingress availability relevant থাকে। Provider executor adaptation থাকার কারণে API request-এর semantic equivalence সব ক্ষেত্রে independently প্রমাণিত নয়।

Bounded shutdown stale process recovery করে; explicit stop/update চলমান response বন্ধ করতে পারে। Zero-downtime stream handover implemented নয়। Provider quota exhaustion এবং internet/upstream outages local lifecycle fix দিয়ে দূর হয় না। অন্য Local-site SNI fixture passed; Local router বন্ধ থাকায় live WordPress HTTPS QA সীমিত।

## Release gates

1. Clean/pristine source, applying overlay without conflict।
2. Core TypeScript এবং ratchet budget, required regression suite।
3. Native package contract: source/dist match, ownership, request isolation, beta support, bounded shutdown।
4. Adequate disk space ও root-scoped helper verification।
5. Isolated installed-package health/auth/catalog/inference/CORS/Bridge checks।
6. Complete current prefix ও private database/config backup।
7. Live service health, ingress/backend TLS, enabled-intent recovery।
8. Real native request ও session evidence after deployment।

Final local gates passed: required regression 64/64, focused 19/19, helper 15/15, core typecheck, 5830/5830 ratchet। Earlier relevant broader tests 411/411 এবং Vitest 493/493। Full unrelated Node suite baseline failures #15306-এ tracked; full repository green বা upstream approval claimed নয়।

## Delivery ও follow-up

- Production fix deploy হয়েছে, update-status ok at 12:50:58।
- Final native request evidence প্রায় 12:51-এ তৈরি।
- Bengali detailed handoff: AGENT-BRIDGE-CONNECTION-FIX-HANDOFF-2026-10-02.md।
- Incremental patch export: NEXA-AGENT-BRIDGE-CONNECTION-FIX-2026-10-02.patch, base c5ce21a1c।
- PR: https://github.com/diegosouzapw/OmniRoute/pull/15323; draft, merge হয়নি।
- Future version release-এ overlay drift review এবং native regression প্রয়োজন। Third account OAuth, latest full Mac reboot এবং scheduled workflow parity পৃথক pending validations; এই repair-কে সম্পূর্ণ করার জন্য নতুন account/login প্রয়োজন নেই।
