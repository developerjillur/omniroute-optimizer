# OmniRoute handoff ও document index

রক্ষণাবেক্ষণ: Jillur Rahman / NexaLance। Public documentation snapshot: ২০২৬-১০-১৭।

প্রথমে [বর্তমান handoff](CURRENT-STATUS-2026-10-17.md) পড়ুন। এখানে source/build/deployment, completed QA এবং বাকি কাজ আলাদা করে দেওয়া আছে। **GPT/GLM/return-Claude focused CLI QA PASS; native Artifact automatic comment/reconnect QA এখনও অসম্পূর্ণ। Automation PAUSED।**

## দ্রুত শুরু

| প্রয়োজন | নথি |
| --- | --- |
| বর্তমান source, runtime, সীমা ও বাকি QA | [বর্তমান handoff — ২০২৬-১০-১৭](CURRENT-STATUS-2026-10-17.md) |
| নতুন boot disk-এর checks, commands ও test results | [Post-migration verification](POST-MIGRATION-VERIFICATION-2026-10-17.md) |
| দীর্ঘ consolidated ইতিহাস | [Consolidated handoff](history/HANDOFF-OMNIROUTE-2026-10-03-CONSOLIDATED.md) |
| Native Artifact, pricing ও শেষ focused CLI matrix | [Native Artifact recovery report](history/OMNIROUTE-NATIVE-ARTIFACT-RECOVERY-2026-10-14.md) |
| Usage accounting/transport audit ও unresolved limits | [Usage audit](history/OMNIROUTE-USAGE-AUDIT-2026-10-14.md) |
| Build, isolated smoke, promotion ও rollback contract | [Versioned deployment runbook](../../nexa/deploy/README.md) |
| Source-এর production handoff | [Agent Bridge production handoff](../../nexa/docs/AGENT-BRIDGE-PRODUCTION-HANDOFF-2026-10-02.md) |
| Overlay পরিচালনা | [nexa/README.md](../../nexa/README.md) |
| Source file inventory | [overlay-inventory.json](../../overlay-inventory.json) |
| Archive coverage ও content hashes | [manifest.json](manifest.json) |

## Archive কীভাবে পড়বেন

`history/`-এ ৫১টি handoff ও supporting document আছে: ১১টি সরাসরি handoff, ৩২টি setup/investigation/QA document, ৪টি routing/model/image report এবং ৪টি deployment/restore note। বর্তমান handoff ও migration report নতুন সংযোজন; আগের দুইটি repository release report নিচে linked আছে।

নথির filename সাধারণত প্রথম লেখার তারিখ বহন করে; একই file-এর শেষে পরের তারিখের update থাকতে পারে। মূল ঘটনার ক্রম, ভাষা, পরীক্ষার সংখ্যা ও documented limits রাখা হয়েছে। Latest interpretation-এর জন্য বর্তমান handoff ব্যবহার করুন; পুরোনো `pending`, `private`, `ACTIVE`, cleanup instruction বা source SHA বর্তমান সিদ্ধান্ত নয়।

Public copies-তে private email, account/session/request identifier, private chat URL ও unrelated local client reference সরানো বা pseudonym দিয়ে বদলানো হয়েছে। GitHub-এর document links ঠিক করা হয়েছে; reviewed upstream references স্থির base commit-এ linked। যে screenshot, log, receipt বা backup এখানে প্রকাশিত হয়নি, তার broken local link-কে local/private reference হিসেবে চিহ্নিত করা হয়েছে। Historical paths যেখানে দেখানো আছে, সেগুলো প্রয়োজনমতো local path দিয়ে মিলিয়ে নিতে হবে।

T7-এর original files পরিবর্তিত হয়নি। এটি original private evidence-এর byte-for-byte backup নয়; source ও public copy-এর পৃথক hash এবং publication-edit counts manifest-এ আছে। Live database, secrets, private traces, screenshots, successful packages ও rollback archives এখানে নেই। কিছু source document-এ ওই স্থানীয় evidence-এর নাম উল্লেখ আছে; তা publication বা বর্তমান availability-এর প্রমাণ নয়।

## সম্পূর্ণ handoff

| নথি | বিষয় / মূল শিরোনাম |
| --- | --- |
| [AGENT-BRIDGE-CONNECTION-FIX-HANDOFF-2026-10-02.md](history/AGENT-BRIDGE-CONNECTION-FIX-HANDOFF-2026-10-02.md) | Agent Bridge connection repair: বাংলা handoff |
| [AGENT-BRIDGE-DURABILITY-HANDOFF-2026-10-02.md](history/AGENT-BRIDGE-DURABILITY-HANDOFF-2026-10-02.md) | Agent Bridge স্থায়ী setup ও update handoff |
| [AGENT-BRIDGE-FULL-QA-HANDOFF-2026-10-02.md](history/AGENT-BRIDGE-FULL-QA-HANDOFF-2026-10-02.md) | Final production overlay সংযোজন: ২০২৬-১০-০২ |
| [AGENT-BRIDGE-LOCAL-COEXISTENCE-DNS-HANDOFF-2026-10-02.md](history/AGENT-BRIDGE-LOCAL-COEXISTENCE-DNS-HANDOFF-2026-10-02.md) | Agent Bridge ও Local coexistence: DNS follow-up |
| [CODEX-AGENT-BRIDGE-SETUP-HANDOFF-2026-10-02.md](history/CODEX-AGENT-BRIDGE-SETUP-HANDOFF-2026-10-02.md) | OmniRoute Agent Bridge setup handoff |
| [HANDOFF-OMNIROUTE-2026-10-02-NATIVE-QUALITY-AND-BUILD-BUDGET.md](history/HANDOFF-OMNIROUTE-2026-10-02-NATIVE-QUALITY-AND-BUILD-BUDGET.md) | OmniRoute native quality and build budget handoff |
| [HANDOFF-OMNIROUTE-2026-10-02.md](history/HANDOFF-OMNIROUTE-2026-10-02.md) | সর্বশেষ হ্যান্ডঅফ: 2026-10-06 |
| [HANDOFF-OMNIROUTE-2026-10-03-CODING-QUALITY.md](history/HANDOFF-OMNIROUTE-2026-10-03-CODING-QUALITY.md) | OmniRoute coding quality, context ebong long-session configuration |
| [HANDOFF-OMNIROUTE-2026-10-03-CONSOLIDATED.md](history/HANDOFF-OMNIROUTE-2026-10-03-CONSOLIDATED.md) | সর্বশেষ হ্যান্ডঅফ নির্দেশনা: 2026-10-06 |
| [HANDOFF-OMNIROUTE-2026-10-03-QUOTA-RECOVERY.md](history/HANDOFF-OMNIROUTE-2026-10-03-QUOTA-RECOVERY.md) | OmniRoute Agent Bridge: quota recovery, native verification, deployment |
| [HANDOFF-OMNIROUTE-2026-10-04-CLAUDE-QUOTA-RECOVERY.md](history/HANDOFF-OMNIROUTE-2026-10-04-CLAUDE-QUOTA-RECOVERY.md) | OmniRoute Claude quota recovery: live setup ebong verification |

## Setup, investigation ও QA reports

| নথি | বিষয় / মূল শিরোনাম |
| --- | --- |
| [AGENT-BRIDGE-CONNECTION-FIX-PRD-2026-10-02.md](history/AGENT-BRIDGE-CONNECTION-FIX-PRD-2026-10-02.md) | Agent Bridge connection repair: PRD ও acceptance record |
| [AGENT-BRIDGE-FULL-QA-PRD-2026-10-02.md](history/AGENT-BRIDGE-FULL-QA-PRD-2026-10-02.md) | Agent Bridge QA ও durability PRD |
| [AGENT-BRIDGE-NATIVE-DNS-RECOVERY-VERIFIED-2026-10-02.md](history/AGENT-BRIDGE-NATIVE-DNS-RECOVERY-VERIFIED-2026-10-02.md) | Agent Bridge: Native DNS recovery verified |
| [AGENT-BRIDGE-UPDATE-PRD-BN-2026-10-02.md](history/AGENT-BRIDGE-UPDATE-PRD-BN-2026-10-02.md) | Agent Bridge update durability — PRD |
| [OMNIROUTE-AGENT-BRIDGE-BANGLA-2026-10-02.md](history/OMNIROUTE-AGENT-BRIDGE-BANGLA-2026-10-02.md) | OmniRoute Agent Bridge: বিস্তারিত গবেষণা ও লোকাল যাচাই |
| [OMNIROUTE-ANTIGRAVITY-AGY-IMAGE-GENERATION-RESEARCH-2026-10-03.md](history/OMNIROUTE-ANTIGRAVITY-AGY-IMAGE-GENERATION-RESEARCH-2026-10-03.md) | OmniRoute diye Antigravity / agy image generation: live research ar experiment |
| [OMNIROUTE-CLAUDE-NATIVE-PARITY-BANGLA-2026-10-02.md](history/OMNIROUTE-CLAUDE-NATIVE-PARITY-BANGLA-2026-10-02.md) | OmniRoute দিয়ে native Claude: account, quality, scheduled task ও routine যাচাই |
| [OMNIROUTE-CLAUDE-QUOTA-AND-CLEANUP-2026-10-06.md](history/OMNIROUTE-CLAUDE-QUOTA-AND-CLEANUP-2026-10-06.md) | OmniRoute: Claude quota, account pool, Cost Analyzer ও নিরাপদ cleanup |
| [OMNIROUTE-CLAUDE-SETUP-TEST-BANGLA-2026-10-02.md](history/OMNIROUTE-CLAUDE-SETUP-TEST-BANGLA-2026-10-02.md) | OmniRoute দিয়ে native Claude Code: setup ও বাস্তব পরীক্ষার রিপোর্ট |
| [OMNIROUTE-CODEX-IMAGEGEN-EXPERIMENT-2026-10-03.md](history/OMNIROUTE-CODEX-IMAGEGEN-EXPERIMENT-2026-10-03.md) | OmniRoute API key diye Codex image generation: verified experiment |
| [OMNIROUTE-DOCUMENT-MAP-2026-10-02.md](history/OMNIROUTE-DOCUMENT-MAP-2026-10-02.md) | OmniRoute document map |
| [OMNIROUTE-EXISTING-CLAUDE-ACCOUNT-BRIDGE-BANGLA-2026-10-02.md](history/OMNIROUTE-EXISTING-CLAUDE-ACCOUNT-BRIDGE-BANGLA-2026-10-02.md) | বিদ্যমান Claude account রেখে Agent Bridge ব্যবহার: যাচাই ও বর্তমান setup |
| [OMNIROUTE-FLASH-LOW-ACCOUNT-TEST-2026-10-06.md](history/OMNIROUTE-FLASH-LOW-ACCOUNT-TEST-2026-10-06.md) | Gemini 3.8 Flash Low: পুনরায় connected account পরীক্ষার রিপোর্ট |
| [OMNIROUTE-GOOGLE-ACCOUNT-HEALTH-2026-10-06.md](history/OMNIROUTE-GOOGLE-ACCOUNT-HEALTH-2026-10-06.md) | OmniRoute: Google account verification, Gemini quota ও token refresh |
| [OMNIROUTE-GOOGLE-VERIFICATION-BUILD-2026-10-06.md](history/OMNIROUTE-GOOGLE-VERIFICATION-BUILD-2026-10-06.md) | OmniRoute Google verification, routing ও production build: 2026-10-06 |
| [OMNIROUTE-GPT-6.1-SOL-SUPPORT-2026-10-04.md](history/OMNIROUTE-GPT-6.1-SOL-SUPPORT-2026-10-04.md) | OmniRoute GPT 6.1 Sol support: setup, QA ar handoff |
| [OMNIROUTE-GPT-EMPTY-RESPONSE-ROOT-CAUSE-2026-10-10.md](history/OMNIROUTE-GPT-EMPTY-RESPONSE-ROOT-CAUSE-2026-10-10.md) | GPT routing-এ Claude Code-এর misleading 502: নিশ্চিত কারণ |
| [OMNIROUTE-GPT-SELECTED-EFFORT-FIX-2026-10-10.md](history/OMNIROUTE-GPT-SELECTED-EFFORT-FIX-2026-10-10.md) | OmniRoute: GPT selected effort সংশোধন |
| [OMNIROUTE-IMAGE-GENERATION-COMPLETE-RESEARCH-2026-10-03.md](history/OMNIROUTE-IMAGE-GENERATION-COMPLETE-RESEARCH-2026-10-03.md) | OmniRoute image generation: complete research, experiments ar creation references |
| [OMNIROUTE-NATIVE-ARTIFACT-RECOVERY-2026-10-14.md](history/OMNIROUTE-NATIVE-ARTIFACT-RECOVERY-2026-10-14.md) | Native Artifacts, thinking progress, Thread recovery ও GPT-6.1 Sol pricing |
| [OMNIROUTE-NATIVE-COMPACTION-ROOT-CAUSE-2026-10-11.md](history/OMNIROUTE-NATIVE-COMPACTION-ROOT-CAUSE-2026-10-11.md) | OmniRoute native `/compact` ব্যর্থতা — ২০২৬-১০-১১ |
| [OMNIROUTE-NATIVE-CONNECTORS-QA-2026-10-11.md](history/OMNIROUTE-NATIVE-CONNECTORS-QA-2026-10-11.md) | Native connector পরীক্ষা ও discovery সংশোধন — ২০২৬-১০-১১ |
| [OMNIROUTE-NATIVE-MODEL-SWITCH-TOOLS-FIX-2026-10-09.md](history/OMNIROUTE-NATIVE-MODEL-SWITCH-TOOLS-FIX-2026-10-09.md) | OmniRoute native model switch ও tool continuity — ২০২৬-১০-০৯ |
| [OMNIROUTE-NATIVE-THINKING-SIGNATURE-2026-10-12.md](history/OMNIROUTE-NATIVE-THINKING-SIGNATURE-2026-10-12.md) | Native thinking signature ও model-switch release — ২০২৬-১০-১২ |
| [OMNIROUTE-NATIVE-TOOLS-INTEGRATIONS-QA-2026-10-09.md](history/OMNIROUTE-NATIVE-TOOLS-INTEGRATIONS-QA-2026-10-09.md) | Claude Code CLI ও Claude native app — tools, integrations ও Skills QA |
| [OMNIROUTE-REVIEW-2026-10-02.md](history/OMNIROUTE-REVIEW-2026-10-02.md) | OmniRoute local setup: detailed review ar practical guide |
| [OMNIROUTE-REVIEW-BANGLA-2026-10-02.md](history/OMNIROUTE-REVIEW-BANGLA-2026-10-02.md) | OmniRoute লোকাল সেটআপ: বিস্তারিত পর্যালোচনা ও ব্যবহারিক নির্দেশিকা |
| [OMNIROUTE-STORAGE-CLEANUP-2026-10-13.md](history/OMNIROUTE-STORAGE-CLEANUP-2026-10-13.md) | OmniRoute storage cleanup — ২০২৬-১০-১৩ |
| [OMNIROUTE-TOKEN-USAGE-INVESTIGATION-2026-10-07.md](history/OMNIROUTE-TOKEN-USAGE-INVESTIGATION-2026-10-07.md) | OmniRoute দিয়ে Claude usage বেড়ে যাওয়ার পূর্ণ তদন্ত |
| [OMNIROUTE-USAGE-AUDIT-2026-10-14.md](history/OMNIROUTE-USAGE-AUDIT-2026-10-14.md) | Native usage audit — 2026-10-14 |
| [README.md](history/README.md) | OmniRoute লোকাল সেটআপ (NexaLance) |
| [REPORT-FABLE-USAGE-INVESTIGATION-2026-10-05.md](history/REPORT-FABLE-USAGE-INVESTIGATION-2026-10-05.md) | Fable usage investigation |

## Routing, model audit ও image experiment addendum

| নথি | বিষয় / মূল শিরোনাম |
| --- | --- |
| [evidence/image-model-matrix-2026-10-03/report-addendum.md](history/evidence/image-model-matrix-2026-10-03/report-addendum.md) | Ei second round-e 12-ti requested model combination ar 1-ti invalid-model control diye real generation kora hoyeche. Sob request successful PNG return koreche. Kintu 13-ti completed response-i image tool-er model `gpt-image-2-codex` boleche. Ei connected Codex route diye GPT Image 2.5 Sunburst ba Flare select kora verified hoyni. |
| [reports/claude-code-gpt-routing-audit-2026-10-09/REPORT.md](history/reports/claude-code-gpt-routing-audit-2026-10-09/REPORT.md) | Claude Code → OmniRoute target routing audit — 2026-10-09 |
| [reports/glm-model-audit-2026-10-09/REPORT.md](history/reports/glm-model-audit-2026-10-09/REPORT.md) | OmniRoute GLM model ও max-thinking live audit — ২০২৬-১০-০৯ |
| [reports/omniroute-storage-cleanup-2026-10-09/REPORT.md](history/reports/omniroute-storage-cleanup-2026-10-09/REPORT.md) | OmniRoute storage cleanup — 2026-10-09 |

## Deployment resume ও restore notes

| নথি | বিষয় / মূল শিরোনাম |
| --- | --- |
| [backup/omniroute-production-deploy-2026-10-06/DEPLOYMENT-RESUME-2026-10-06.md](history/backup/omniroute-production-deploy-2026-10-06/DEPLOYMENT-RESUME-2026-10-06.md) | 2026-10-06 deployment প্রস্তুতি: resume ও recovery |
| [backup/omniroute-worktrees-2026-10-06-092216/RESTORE-FINAL.md](history/backup/omniroute-worktrees-2026-10-06-092216/RESTORE-FINAL.md) | OmniRoute development checkout backup |
| [backup/omniroute-worktrees-2026-10-06-092216/RESTORE-QUOTA-COST-UPDATE-2026-10-06.md](history/backup/omniroute-worktrees-2026-10-06-092216/RESTORE-QUOTA-COST-UPDATE-2026-10-06.md) | Quota/Cost source update recovery |
| [backup/omniroute-worktrees-2026-10-06-092216/RESTORE.md](history/backup/omniroute-worktrees-2026-10-06-092216/RESTORE.md) | OmniRoute development checkout backup |

## আগে থেকেই repository-তে থাকা release reports

- [Production release — ২০২৬-১০-১১](../../reports/RELEASE-2026-10-11.md)
- [Thinking-signature/model-switch release — ২০২৬-১০-১২](../../reports/RELEASE-2026-10-12-SIGNATURE-SWITCH.md)
- [Native Artifact ও pricing source validation — ২০২৬-১০-১৪](../../nexa/docs/NATIVE-ARTIFACT-RECOVERY-AND-GPT61-PRICING-2026-10-14.md)
- [Usage audit source notes — ২০২৬-১০-১৪](../../nexa/docs/USAGE-AUDIT-2026-10-14.md)

Source-adjacent dated notes-ও তাদের নিজস্ব সময়ের record; পরের CLI QA ও migration ফল বর্তমান handoff-এ একত্র করা হয়েছে।

## Coverage ও বাদ দেওয়া উপাদান

সব ১১টি named handoff অন্তর্ভুক্ত। Supporting documents-এর পাশাপাশি পাওয়া চারটি restore/deployment-resume note ও তিনটি nested audit report, এবং image-model report addendum অন্তর্ভুক্ত। খালি `sample.md`, ব্যক্তিগত setup request এবং upstream release changelog handoff archive-এ যোগ করা হয়নি; manifest-এ কারণ আছে। Raw backup trees, caches, transcripts, media ও unrelated projects export করা হয়নি।

## রক্ষণাবেক্ষণ

নতুন meaningful QA/release result হলে নতুন dated document লিখুন এবং এই index update করুন। পুরোনো historical outcome মুছে বর্তমান ফল বসাবেন না। Source overlay বদলালে source commit, tree ও inventory আলাদাভাবে মিলিয়ে নিন; documentation publication একা build, deployment বা user acceptance প্রমাণ করে না। সব repository কাজ Jillur Rahman-এর নামে, normal hooks ও owner-এর অনুমতির নিয়ম মেনে হবে।
