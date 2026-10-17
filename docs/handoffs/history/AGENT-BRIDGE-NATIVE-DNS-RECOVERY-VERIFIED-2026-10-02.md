> **ঐতিহাসিক নথি — public copy, ২০২৬-১০-১৭।** মূল ঘটনার তারিখ ও ফল এই নথির নিজস্ব সময়ের জন্য প্রযোজ্য; পরের সংযোজন থাকতে পারে। বর্তমান অবস্থা ও কাজের নিয়মের জন্য [বর্তমান handoff](../CURRENT-STATUS-2026-10-17.md) পড়ুন। Private reference ও identifier সরানো হয়েছে; স্থানীয় evidence এখানে অন্তর্ভুক্ত নেই। পুরোনো cleanup, build, deploy বা service command বর্তমান অনুমতি হিসেবে ব্যবহার করবেন না।

# Agent Bridge: Native DNS recovery verified

লেখক: Jillur Rahman। যাচাই: ২০২৬-১০-০২, Asia/Dhaka।

## বর্তমান ফলাফল

Claude Desktop-এর আগের account ও পুরোনো session রেখেই response পাওয়া গেছে। Local by Flywheel-এর site এবং omni.local একই সঙ্গে চলছে। মূল HANDOFF-OMNIROUTE-2026-10-02.md-এর section 3.9 ও পুরোনো recovery notes অক্ষত রাখা হয়েছে; এই ফাইলটি তার পরের verified recovery record।

## কেন native app quota error দেখাচ্ছিল

/etc/hosts-এ সঠিক IPv4/IPv6 routing লেখা থাকলেও macOS-এর স্বাভাবিক client DNS resolver public Anthropic address ফেরত দিচ্ছিল। ফলে localhost জোর করে TLS test সফল হলেও native app-এর request Bridge এড়িয়ে original account-এ যাচ্ছিল। সেই account-এর weekly limit তাই কার্যকর হচ্ছিল। শুধু dashboard healthy দেখানো বা CLI response পাওয়া দিয়ে native interception প্রমাণ করা যায়নি।

## কীভাবে ঠিক করা হয়েছে

Agent Bridge dashboard-এর Claude Code Stop DNS ব্যবহার করা হয়েছে। ব্যবহারকারী dashboard-এর নিজস্ব administrator password prompt পূরণ করেছেন। তারপর Start DNS চালু করা হয়েছে। এরপর actual system lookup-এ শুধু ::1 ও 127.0.0.1 পাওয়া গেছে। Official app, login, account, project files বা certificate বদলানো হয়নি। এই recovery-তে app restart প্রয়োজন হয়নি।

## সরাসরি প্রমাণ

- Existing Local connection check chat-এ LOCAL_COEXISTENCE_NATIVE_OK response এসেছে। matching Opus 5.5 interception 19:21:19 Dhaka, completed HTTP 200 19:21:24।
- ওই chat-এর পরের synthetic turn-ও HTTP 200 হয়েছে।
- মূল failing project chat-এর 823.2k context রেখে harmless check পাঠানো হয়েছে। project work resume বা tools ব্যবহার করতে বলা হয়নি। Response: EXISTING_SESSION_ROUTE_OK। Matching Opus stream 19:25:17-এ complete, HTTP 200।
- Native account-এর usage UI-তে weekly 100% এখনও দেখা যেতে পারে। এটি signed-in account-এর usage; intercepted model traffic eligible connected provider account ব্যবহার করছে। Cloud feature/entitlement-কে local Bridge দিয়ে বদলানো হয়েছে, এমন দাবি করা হয়নি।
- আরেকটি request-এ thread compatibility 400 এসেছিল; পরের fresh intercepted request HTTP 200 complete হয়েছে। সব future thread variation যাচাই হয়েছে, এমন দাবি করা হয়নি।

## nexa overlay-তে স্থায়ী source

- 56b8b34af: Local-user-owned inherited sockets, actual client DNS gate এবং update preflight routing verification।
- fa011c349: refresh-native-dns.mjs, তার regression tests, installer integration এবং recovery documentation।
- Installer enabled DNS-এর ক্ষেত্রে প্রয়োজন হলে hosts-এর content ও inode অক্ষত রেখে write event/flush/verify করে। Backup রাখে। DNS off থাকলে off-ই রাখে। Partial/unexpected entries-এ fail করে; নিজে account বা hosts mapping বদলায় না। এই privileged recovery helper-এর fixture tests হয়েছে; live recovery dashboard দিয়ে হয়েছে, helper দিয়ে নয়।
- সব customization nexa/-তে। Upstream base pristine; 53 patches cleanly apply। Documentation gate ও normal commit hooks pass। Runtime package rebuild/restart এই DNS recovery-তে করা হয়নি। বর্তমানে installed Local-compatible ingress-টি সচল রাখা হয়েছে।

## যাচাই

Targeted tests: 12/12 pass। Live gate: backendTlsVerified, ingressTlsVerified, nativeIngressScoped, clientDnsVerified সব true।

Normal client HTTP checks:

| URL | Status |
| --- | --- |
| http://omni.local/healthz | 200 |
| [private-reference] | 302 |
| [private-reference] | 302 |
| [private-reference] | 200 |

wp-admin-এর 302 login redirect স্বাভাবিক। launchd native-ingress running; একটিমাত্র Bridge 8443 listener; Local nginx-এর wildcard 443 listener সহ coexist করছে।

Evidence: ~/Documents/Codex/2026-10-02/agent-bridge-local-coexistence-1859

মূল evidence files: existing-project-native-recovered.png, native-dns-final-response.png, dashboard-dns-recovered.png, live-gate-recovered.json, local-sites-recovered.json, model-calls-recovered.json, targeted-final-tests.log, dns-recovery-commit.log।

## সীমা ও ভবিষ্যৎ recovery

এই live routing সমস্যা ঠিক হয়েছে। ভবিষ্যতের সব app/API version, cold boot, cloud Routines বা সব model/effort combination 100% নিশ্চয়তা এই test দেয় না। Update gate detected routing incompatibility-তে promotion বন্ধ করবে। একই সমস্যা হলে account logout বা app settings বদলানোর আগে actual native DNS পরীক্ষা করতে হবে; Agent Bridge Stop DNS/Start DNS-এর পর native response ও matching interception log দুটোই চাই। পুরোনো error message chat history-তে রয়ে যেতে পারে; সেটি নতুন request-এর failure নয়।
