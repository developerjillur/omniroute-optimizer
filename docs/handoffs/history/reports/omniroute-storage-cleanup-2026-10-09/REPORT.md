> **ঐতিহাসিক নথি — public copy, ২০২৬-১০-১৭।** মূল ঘটনার তারিখ ও ফল এই নথির নিজস্ব সময়ের জন্য প্রযোজ্য; পরের সংযোজন থাকতে পারে। বর্তমান অবস্থা ও কাজের নিয়মের জন্য [বর্তমান handoff](../../../CURRENT-STATUS-2026-10-17.md) পড়ুন। Private reference ও identifier সরানো হয়েছে; স্থানীয় evidence এখানে অন্তর্ভুক্ত নেই। পুরোনো cleanup, build, deploy বা service command বর্তমান অনুমতি হিসেবে ব্যবহার করবেন না।

# OmniRoute storage cleanup — 2026-10-09

নাম: Jillur Rahman
সময়: 2026-10-09T15:19:16.018359+06:00

## ফল

অনুমোদিত ২৬টি generated/temporary folder নিরাপদে মুছে ফেলা হয়েছে। Cleanup শুরুর সময় থেকে শেষ যাচাই পর্যন্ত internal disk-এর খালি জায়গা **21.44 GB (19.97 GiB)** বেড়েছে। খালি জায়গা **7.12 GB → 28.56 GB**। চলমান অন্য কাজের disk activity-ও এই before/after সংখ্যাকে সামান্য প্রভাবিত করতে পারে।

| মাপ | আগে | পরে |
| --- | ---: | ---: |
| OmniRoute: inode অনুযায়ী একবার গণনা করা allocated size (`du -x -s -k`) | 19.18 GB | 7.92 GB |
| OmniRoute: hard link-সহ logical path size (`du -x -A -l -s -k`) | 30.00 GB | 7.56 GB |
| আলাদা `.omniroute-builds` store: allocated size | 35.14 GB | 25.03 GB |

GB = 1,000,000,000 bytes; GiB = 1,073,741,824 bytes। Folder allocation, logical file size এবং filesystem free space আলাদা মাপ। Disk space বেড়েছে কি না যাচাইয়ের জন্য filesystem free-space পরিবর্তন ব্যবহার করা হয়েছে।

## কেন এত বড় হয়েছিল

- `.claude/worktrees`-এর তিনটি পুরোনো checkout-এ আলাদা successful `.build` ও `dist` output জমে ছিল। শুধু ওই ছয়টি output folder-এর allocation প্রায় ১০.৩ GB।
- তিনটি worktree-তে development dependencies-এর duplicate directory entry ছিল। `next/package.json`-এর inode মূল checkout-এর একই inode ছিল; link count ৪ থেকে ১ হয়েছে। তাই প্রতিটি `node_modules`-এর দেখানো size যোগ করলে physical disk space অতিরিক্ত ধরে ফেলা হয়। মূল dependency copy অক্ষত রয়েছে।
- `.omniroute-builds`-এ deployment smoke test-এর isolated database/runtime copy জমে ছিল। এগুলো live database বা rollback database নয়; smoke script তৈরি করা পরীক্ষার copy।
- শেষ হওয়া automated test-এর temporary environments-ও source worktree-তে রয়ে গিয়েছিল।

স্ক্রিনশটে OmniRoute 32.09 GB দেখা গিয়েছিল। এই cleanup-এর ঠিক আগের সরাসরি logical measurement 30.00 GB এবং inode অনুযায়ী allocated measurement 19.18 GB ছিল। স্ক্রিনশটের সময় ও Storage UI-এর গণনা সরাসরি এই `du` measurement-এর সমান ধরে নেওয়া হয়নি।

## কী মুছে ফেলা হয়েছে

| শ্রেণি | Folder সংখ্যা |
| --- | ---: |
| পুরোনো worktree-র duplicate `node_modules` | ৩ |
| পুরোনো isolated smoke-test `data` | ১১ |
| পুরোনো isolated smoke-test `runtime` | ৪ |
| শেষ হওয়া validation-এর temporary environments | ২ |
| আলাদাভাবে অনুমোদিত successful duplicate `.build`/`dist` | ৬ |
| মোট | ২৬ |

প্রতিটি exact path নিচে দেওয়া আছে; command ছিল `/bin/rm -r -- <verified exact path>`। কোনো glob, `rm -rf`, broad project deletion, app quit বা service stop ব্যবহার করা হয়নি।

- `~/Developer/OmniRoute/.claude/worktrees/deploy-resource-safety-2026-10-06/node_modules`
- `~/Developer/OmniRoute/.claude/worktrees/native-cache-no-compression-2026-10-07/node_modules`
- `~/Developer/OmniRoute/.claude/worktrees/native-thread-usage-2026-10-07/node_modules`
- `~/.omniroute-builds/smoke-20261007-052632/data`
- `~/.omniroute-builds/smoke-20261007-052632/runtime`
- `~/.omniroute-builds/smoke-20261007-052939/data`
- `~/.omniroute-builds/smoke-20261007-052939/runtime`
- `~/.omniroute-builds/smoke-20261007-053156/data`
- `~/.omniroute-builds/smoke-20261007-053156/runtime`
- `~/.omniroute-builds/smoke-20261007-053535/data`
- `~/.omniroute-builds/smoke-20261007-054004/data`
- `~/.omniroute-builds/smoke-20261007-054130/data`
- `~/.omniroute-builds/smoke-20261007-094811/data`
- `~/.omniroute-builds/smoke-20261007-094811/runtime`
- `~/.omniroute-builds/smoke-20261007-095622/data`
- `~/.omniroute-builds/smoke-20261007-154439/data`
- `~/.omniroute-builds/smoke-20261007-160438/data`
- `~/.omniroute-builds/smoke-20261007-162346/data`
- `~/Developer/OmniRoute/.claude/worktrees/native-thread-usage-2026-10-07/nexa/.work/native-validation-20261007`
- `~/Developer/OmniRoute/.claude/worktrees/native-thread-usage-2026-10-07/nexa/.work/native-claude-regressions`
- `~/Developer/OmniRoute/.claude/worktrees/deploy-resource-safety-2026-10-06/.build`
- `~/Developer/OmniRoute/.claude/worktrees/deploy-resource-safety-2026-10-06/dist`
- `~/Developer/OmniRoute/.claude/worktrees/native-cache-no-compression-2026-10-07/.build`
- `~/Developer/OmniRoute/.claude/worktrees/native-cache-no-compression-2026-10-07/dist`
- `~/Developer/OmniRoute/.claude/worktrees/native-thread-usage-2026-10-07/.build`
- `~/Developer/OmniRoute/.claude/worktrees/native-thread-usage-2026-10-07/dist`

## কী সংরক্ষিত ও যাচাই করা হয়েছে

- Main checkout এবং তিনটি worktree-র source, branch, HEAD ও Git status অপরিবর্তিত; সব checkout clean। Worktree/branch মুছে ফেলা হয়নি।
- Main `node_modules`, `nexa/` fixes, `omniroute-optimizer` export, test reports ও source files রাখা হয়েছে।
- চারটি release `.tgz` package-এর SHA-256 cleanup-এর আগে ও পরে মিলে গেছে। তিনটি unpacked build সরানোর আগে archive-এর মোট ১৩,৩৪৫টি regular `dist` file সংশ্লিষ্ট local output-এর সঙ্গে hash দিয়ে মিলেছে; mismatch শূন্য।
- `current`, `previous`, `previous-runtime` pointer অপরিবর্তিত; সব `runtime-backups` এবং live database-এর `update-backups` রাখা হয়েছে।
- Live runtime `a535572e5`, runtime/package files, `.env` hash ও permissions অপরিবর্তিত।
- Live database-এর inode, ২৫টি provider connection-এর ID set, ৩টি API key-এর ID set এবং provider active/paused state hash অপরিবর্তিত। কোনো credential value report-এ নেই।
- পুরোনো sandbox-এর ১৯টি retained log/verification file-এর hash অপরিবর্তিত।
- Gateway listener-এর PID অপরিবর্তিত; Desktop app PID 705 এখনও চলছে।
- `http://127.0.0.1:28128/healthz` এবং `http://omni.local/healthz`: HTTP 200, `ok`।
- API-key ছাড়া `/v1/models`: HTTP 401; authentication protection সচল।
- সব ২৬টি target absent। T7 mounted ছিল; T7-এর কোনো আগের file মুছে বা overwrite করা হয়নি।

## Resource guard ও সীমা

এটি সীমিত memory-র সরাসরি deletion; নতুন build, model, download, install, large copy বা inference test চালানো হয়নি। Cleanup process budget 512 MiB ছিল। Live pressure, headroom, swap ও free space পর্যবেক্ষণ করা হয়েছে; কোনো guard stop হয়নি। সংরক্ষিত resource sample-এ pressure সবসময় normal (level 1)।

এই যাচাই source, data, release/rollback ও চলমান service সংরক্ষিত থাকার প্রমাণ। নতুন production deployment বা নতুন model-quality test-এর দাবি নয়।

## Evidence

- `cleanup-summary.json`: চূড়ান্ত মাপ ও যাচাইয়ের সারাংশ।
- `cleanup-plan.json`: deletion-এর আগের exact path, inode ও size inventory।
- `build-output-removal-authorization.json`: ছয়টি পূর্বে protected output সরানোর নির্দিষ্ট অনুমোদন।
- `deletion-journal.jsonl`: প্রতি target-এর শুরু, deletion result ও resource sample।
- `protected-packages.json`, `duplicate-build-package-equivalence.json`: সংরক্ষিত package এবং output equivalence।
- `pre-cleanup.json`, `post-cleanup-verification.json`, `execution-complete.json`: preservation এবং health evidence।
