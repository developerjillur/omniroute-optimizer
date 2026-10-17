> **ঐতিহাসিক নথি — public copy, ২০২৬-১০-১৭।** মূল ঘটনার তারিখ ও ফল এই নথির নিজস্ব সময়ের জন্য প্রযোজ্য; পরের সংযোজন থাকতে পারে। বর্তমান অবস্থা ও কাজের নিয়মের জন্য [বর্তমান handoff](../CURRENT-STATUS-2026-10-17.md) পড়ুন। Private reference ও identifier সরানো হয়েছে; স্থানীয় evidence এখানে অন্তর্ভুক্ত নেই। পুরোনো cleanup, build, deploy বা service command বর্তমান অনুমতি হিসেবে ব্যবহার করবেন না।

# Agent Bridge ও Local coexistence: DNS follow-up

তারিখ: 2026-10-02, সন্ধ্যা। রক্ষণাবেক্ষণ: Jillur Rahman / NexaLance।

## বর্তমান ফলাফল

Native Desktop-এর quota error পুনরুৎপাদন হয়েছে। সম্পূর্ণ সমাধান নিশ্চিত করা এখনও বাকি: administrator DNS cache refresh এবং তার পরে বাস্তব Desktop response যাচাই প্রয়োজন। এই রিপোর্ট আগের production acceptance ও section 3.9-এর পরবর্তী evidence; আগের handoff/history প্রতিস্থাপন করে না।

## যাচাই করা কারণ

`/etc/hosts`-এ api.anthropic.com-এর IPv4 ও IPv6 loopback entries আছে। তবু `dns.lookup` ও `dscacheutil` আসল client lookup-এ public vendor address ফেরত দিয়েছে। পুরোনো Desktop processes-এর established connections-ও public vendor address-এ ছিল। Native test chat-এ একই quota error হয়েছে এবং সেই test-এর model request Bridge log-এ পাওয়া যায়নি। শুধু জোর করে localhost-এ TLS health request পাঠালে সফল হয়েছে। ফলে এই healthy listener state native client interception-এর যথেষ্ট প্রমাণ ছিল না।

সাধারণ Opus CLI synthetic request সফল হয়েছে, কিন্তু তার corresponding Opus interception পাওয়া যায়নি; সেই success-কে Bridge acceptance বলা যাবে না। Native app স্বাভাবিকভাবে quit/reopen করে account এবং existing session list অক্ষত পাওয়া গেছে, কিন্তু system DNS তখনও public ছিল। App restart একা যথেষ্ট হয়নি।

## Local-এর অবস্থা

বর্তমান installed ingress ও তার Perl socket helper পরিবর্তন বা restart করা হয়নি। Loopback TLS health সফল। Explicit local address ব্যবহার করে Local site checks: Sagrilo HTTP wp-admin 302, Sagrilo HTTPS 200, Acima HTTP 200, omni.local health 200। Normal domain checks-এ initial Sagrilo HTTP request timeout হয়েছিল; পরের HTTPS/Acima/Omni requests সফল হয়েছে। তাই নিরবচ্ছিন্ন domain-resolution performance-এর দাবি করা হচ্ছে না।

## স্থায়ী source পরিবর্তন

Commit: `56b8b34af`, শুধুমাত্র `nexa/`।

- `nexa/deploy/omni-bind.pl`: বর্তমানে ব্যবহৃত Local-user-owned socket design versioned করা হয়েছে। Root bind শেষে forwarder nobody হিসেবে চলে।
- `native-ingress.mjs`: inherited descriptors গ্রহণ করে, exact loopback 443 metadata যাচাই করে, duplicate/invalid descriptors প্রত্যাখ্যান করে। TLS routing ও raw bytes বজায় থাকে।
- `install-native-ingress.sh`: নিজস্ব root-owned binder install করে, non-root Local user-কে socket owner রাখে, পুরোনো files/plist backup রাখে, daemon load শেষে macOS DNS cache refresh করে। ফলে ভবিষ্যৎ installer পুরোনো root-owned socket design ফিরিয়ে দেবে না।
- `bridge-gate.mjs`: enabled Bridge-এর জন্য সাধারণ OS DNS resolution loopback হওয়া বাধ্যতামূলক; installed daemon/binder-এর ownership, permissions ও invocation পরীক্ষা করে।
- `omni-updater.sh`: public native DNS থাকলে build/promotion-এর আগেই থামে; running runtime অক্ষত থাকে।

এই source পরিবর্তন live root-owned ingress files-এ install করা হয়নি। Runtime application package এখনও আগের verified build; এই investigation-এ model executor বদলানো হয়নি।

## Tests

৯/৯ targeted regressions সফল: public/mixed DNS rejection, loopback DNS acceptance, descriptor validation, inherited descriptor দিয়ে বাস্তব connection forwarding, byte preservation/fallback, other-SNI isolation, fragmented TLS, loopback restriction ও macOS wildcard coexistence। Perl syntax, shell syntax, docs checks, normal commit hooks, pristine-base এবং ৫৩টি patch applicability checks সফল। Updated live gate সঠিকভাবে বর্তমান DNS mismatch প্রত্যাখ্যান করেছে। Boot/reboot এবং revised root installer live execution এখনও যাচাই হয়নি।

## অবশিষ্ট administrator ধাপ

Terminal-এ:

```sh
sudo /usr/bin/killall -HUP mDNSResponder
```

Password শুধু Terminal-এ দিন। এরপর সাধারণ DNS lookup loopback হয় কি না এবং versioned live gate সফল হয় কি না পরীক্ষা করতে হবে। প্রয়োজনে পুরোনো native connections বাদ দিতে app আবার খুলতে হবে। একই existing native QA chat-এ response ও matching intercepted model log না পাওয়া পর্যন্ত issue closed বলা যাবে না। HUP-এর পরেও lookup public থাকলে hosts reload/cache investigation চালাতে হবে।

## Evidence

Private local directory: `~/Documents/Codex/2026-10-02/agent-bridge-local-coexistence-1859`। CLI result, targeted test log, docs check এবং normal commit gate output সেখানে আছে। Credentials বা private project transcript এই report-এ নেই।


<!-- handoff-consolidation-2026-10-03 -->

## Latest consolidated handoff: 2026-10-03

Puro setup, Agent Bridge connection/lifecycle fixes, Local coexistence/DNS, durable nexa overlay, quota recovery, coding/context configuration, build RAM/disk control, tests, update/rollback ebong remaining gaps ekshathe: [HANDOFF-OMNIROUTE-2026-10-03-CONSOLIDATED.md](HANDOFF-OMNIROUTE-2026-10-03-CONSOLIDATED.md).

Latest recorded deployment/source/runtime f77079418, OmniRoute 3.8.51; final native CLI Opus/Sonnet ebong Desktop Code response successful. Tar pore coding settings-er 14 checks, native Read/follow-up, large-context observation ebong TLS/DNS gate successful. Ei file-er earlier builds, pending promotion ba cached-quota OFF descriptions historical; latest policy cached exhausted-account skip ON, preflight OFF. Future reset live recovery, remaining Thread mismatch telemetry, full 24-hour soak/new reboot ebong every native feature ekhono separate scope.

Documentation consolidation-e earlier content preserve kora hoyeche; new build ba live service mutation hoyni. User-er 2026-10-03 rule onujayi other people's public repositories-e PR/issue action designated owner session-er; help findings/patch oss-contrib/inbox-e hand over korte hobe. Purono direct-PR workflow latest authorization noy.
