> **ঐতিহাসিক নথি — public copy, ২০২৬-১০-১৭।** মূল ঘটনার তারিখ ও ফল এই নথির নিজস্ব সময়ের জন্য প্রযোজ্য; পরের সংযোজন থাকতে পারে। বর্তমান অবস্থা ও কাজের নিয়মের জন্য [বর্তমান handoff](../CURRENT-STATUS-2026-10-17.md) পড়ুন। Private reference ও identifier সরানো হয়েছে; স্থানীয় evidence এখানে অন্তর্ভুক্ত নেই। পুরোনো cleanup, build, deploy বা service command বর্তমান অনুমতি হিসেবে ব্যবহার করবেন না।

# Agent Bridge QA ও durability PRD

লেখক: Jillur Rahman<br>
তারিখ: ২০২৬-১০-০২<br>
Implemented production build: `f002e7654`, OmniRoute `3.8.51`।

## উদ্দেশ্য

Original native Claude app/account/configuration রেখে OmniRoute Agent Bridge দিয়ে model-provider routing চালানো; একাধিক conversation-এর context ও streaming স্থিতিশীল রাখা; update-এ verified runtime হারানো ঠেকানো।

## Implemented requirements ও acceptance evidence

| Requirement | Acceptance | Status |
| --- | --- | --- |
| Final native model availability | ১৩ exact configured model-এর real CLI | ১২ পাস; Sonnet 4.5 quota/availability exception খোলা |
| Modern effort controls | Sonnet/Opus latest-এর পাঁচ effort option করে | পাস |
| Per-chat isolation | চার simultaneous session ও চার নিজস্ব marker resume | পাস |
| Failure isolation | একটি stream cancel-এর পর অন্য তিন stream success; listener PID অপরিবর্তিত | পাস |
| Request transport | UTF-8 raw bytes/backpressure; কোনো foreign JSON SSE-তে append নয় | regression ও live streaming পাস |
| Lifecycle | readiness before publish, exact PID owner, actual exit before restart | regression পাস; তিন live cycle পাস |
| Duplicate Start | পাঁচ concurrent duplicate Start ownership বদলাবে না | পাস |
| Native count endpoint | provider count route/query preserve | পাস |
| Legacy models | adaptive thinking/context beta eligibility respected | real CLI ও focused regression পাস |
| Conversation continuity | final দুই turn-এ same native thread ও remembered marker | পাস; বর্তমান pool একই eligible connection বেছেছে |
| Two-account rotation | final সময়ে দুই পৃথক eligible connection দিয়ে request | final run-এ প্রমাণ হয়নি; আগের candidate-এ পাস |
| Original native account | firstParty Max auth/signature preserved | পাস |
| Durable update | overlay/gates/isolated smoke/live TLS/full prefix+DB recovery | implemented ও managed deploy পাস |
| Config retention | env/DNS shim/CA/key/maps/targets/integrity | পাস |
| Native GUI final QA | original account-এ Code response, পুরোনো QA chat resume, দুই actual parallel Agent; dashboard controls | পাস |
| Three-account pool | তৃতীয় account OAuth configured ও rotation exercise | pending owner login/configuration |
| Scheduled/cloud Routine | actual chosen runner ও entitlement-সহ end-to-end | pending |
| Future native/upstream versions | পুনরায় compatibility gates ও real native request | release প্রতি প্রয়োজন |

## Update decision rules

১. Overlay apply conflict হলে deploy নয়; working live service ধরে রাখতে হবে।
২. Typecheck/core, ratchet, mandatory Bridge/security regression বা package policy fail হলে promote নয়।
৩. Source/dist contract, legacy header support বা archived compiled route missing হলে package reject।
৪. Isolated install/authenticated inference/catalog/CORS smoke fail হলে live prefix untouched।
৫. Promote-এর আগে পূর্ণ prefix এবং consistent SQLite snapshot preserve।
৬. Post-promote health ও verified native TLS fail হলে matching prefix/database recovery।
৭. কোনও manual runtime-only patch final solution হিসেবে গ্রহণ নয়; source overlay + build + archive + deployed proof লাগবে।

## Boundaries

Future provider outage, exhausted subscription, unavailable model/feature, changed endpoint এবং cloud entitlement zero-error guarantee-এর আওতায় নয়। Transport parity test response quality benchmark নয়। Default cloud execution নিজে localhost Bridge-এ আসবে না। Unlimited parallel requests, সব legacy effort combination, Windows live, সব Desktop Chat/Cowork features বা latest full reboot পরীক্ষিত নয়।

## Test ও release reference

Final Bridge suite ৫২৮/৫২৮; component suite ২১/২১; generic upstream targeted ৮৯/৮৯; helper/storage tests ১৫/১৫। Overlapping counts যোগ করা হবে না। Detailed real-request outcomes, exact models, backup paths, source commits, signature/config evidence এবং pending scope accompanying full QA handoff-এ আছে।

Upstream draft review: [PR #15323](https://github.com/diegosouzapw/OmniRoute/pull/15323)। Draft-এর skipped CI jobs-এর কারণে aggregate gates green নয়। Generic changes upstream-এ; local durability `nexa/`-তে।


## Final overlay delivery

Source documentation/QA commit `986ba64e8`; deployed application code `f002e7654`। পূর্ণ বাংলা report, frozen acceptance record এবং repeatable native concurrency script এখন nexa/docs ও nexa/qa-তে versioned। Final script recheck ১২/১২ concurrency case পাস; archived package ও live ingress/backend TLS gates পাস। Source update কেবল documentation/tooling; নতুন executable deploy হয়েছে দাবি নয়। Prior T7 handoff backups সংরক্ষিত।

Sonnet 4.5 current pool availability/quota exception, final two-account rotation ও অন্য pending scope অপরিবর্তিত। Future native version-এর জন্য পুনরায় actual native acceptance দরকার; OmniRoute-এর mandatory gates fail হলে promote নয়।


আগে installed upstream DNS shim-এর source এখন nexa/deploy/bridge-upstream-dns.cjs-এ আছে; installed bytes-এর সঙ্গে মিলে গেছে। Public environment reference nexa/config/agent-bridge.env.example। Secret .env, encrypted provider connections ও model mappings DATA_DIR/consistent backups-এ সংরক্ষিত থাকবে; repository-তে secret copy নেই।
