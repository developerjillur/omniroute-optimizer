> **ঐতিহাসিক নথি — public copy, ২০২৬-১০-১৭।** মূল ঘটনার তারিখ ও ফল এই নথির নিজস্ব সময়ের জন্য প্রযোজ্য; পরের সংযোজন থাকতে পারে। বর্তমান অবস্থা ও কাজের নিয়মের জন্য [বর্তমান handoff](../CURRENT-STATUS-2026-10-17.md) পড়ুন। Private reference ও identifier সরানো হয়েছে; স্থানীয় evidence এখানে অন্তর্ভুক্ত নেই। পুরোনো cleanup, build, deploy বা service command বর্তমান অনুমতি হিসেবে ব্যবহার করবেন না।

# OmniRoute storage cleanup — ২০২৬-১০-১৩

Jillur Rahman / NexaLance

## ফল

OmniRoute source folder-এর 38.81 GB পুরোটা প্রয়োজনীয় ছিল না। পুরোনো isolated worktree, তাদের production build/dependency copy এবং আলাদা preserved build outputs বড় অংশ দখল করেছিল। Live production runtime এই source folder-এর বাইরে থাকে।

| মাপ | আগে | পরে |
| --- | ---: | ---: |
| `~/Developer/OmniRoute` — hard links একাধিকবার গোনা file-path size | 38.81 GB | 14.18 GB |
| একই folder — hard links একবার গোনা allocated size | 25.89 GB | 9.73 GB |

File-path size কমেছে 24.63 GB; hard-link-aware allocated footprint কমেছে 16.16 GB। এগুলোকে একই পরিমাণ actual physical disk recovery বলা হয়নি; APFS shared extents, swap ও অন্য চলমান কাজ free-space পরিবর্তনে প্রভাব ফেলে।

প্রথম preflight-এ internal free ছিল প্রায় 8.17 GiB; প্রথম mutation-এর baseline 12.29 GiB। শেষ যাচাইয়ে internal free **30.08 GB / 28.02 GiB**। Final verification UTC `2026-10-13T12:30:23.856517+00:00`; local timezone Asia/Dhaka।

## কী পরিষ্কার হয়েছে

13টি নির্দিষ্ট পুরোনো generated folder সরানো হয়েছে। পাঁচটি clean, merged, inactive duplicate worktree normal Git worktree removal দিয়ে retire হয়েছে। Nested generated folder ও তাদের parent worktree-এর count যোগ করে unique storage recovery দেখানো হয়নি।

### সরানো generated folder

- `~/Developer/OmniRoute/.claude/worktrees/gpt-effort-passthrough-2026-10-10/.build`
- `~/Developer/OmniRoute/.claude/worktrees/gpt-effort-passthrough-2026-10-10/dist`
- `~/Developer/OmniRoute/.claude/worktrees/native-connectors-release-2026-10-11/.build`
- `~/Developer/OmniRoute/.claude/worktrees/native-connectors-release-2026-10-11/dist`
- `~/Developer/OmniRoute/.claude/worktrees/native-model-switch-tools-2026-10-09/.build`
- `~/Developer/OmniRoute/.claude/worktrees/native-model-switch-tools-2026-10-09/dist`
- `~/Developer/OmniRoute/.claude/worktrees/native-model-switch-tools-2026-10-09/node_modules`
- `~/Developer/OmniRoute/.claude/worktrees/native-suggestion-silence-2026-10-09/.build`
- `~/Developer/OmniRoute/.claude/worktrees/native-suggestion-silence-2026-10-09/dist`
- `~/Developer/OmniRoute/.claude/worktrees/native-suggestion-silence-2026-10-09/node_modules`
- `~/.omniroute-builds/3.8.51-0b62ea8e7/preserved-worktree-dist-20261010-context-error`
- `~/.omniroute-builds/3.8.51-7dd92427f/preserved-worktree-dist-20261011-compaction`
- `~/.omniroute-builds/3.8.51-7dd92427f/preserved-worktree-build-20261011-compaction`

### Retired worktree — commit/branch সংরক্ষিত

- `~/Developer/OmniRoute/.claude/worktrees/deploy-resource-safety-2026-10-06` — `fix/deploy-resource-safety-2026-10-06`, `29329aa46d1aa3c8d23377225175365219f8edb6`।
- `~/Developer/OmniRoute/.claude/worktrees/native-cache-no-compression-2026-10-07` — `fix/native-cache-no-compression-2026-10-07`, `65c6c608a9a6e78b206c8f1cd199f7cf0e062ddf`।
- `~/Developer/OmniRoute/.claude/worktrees/native-thread-usage-2026-10-07` — `fix/native-thread-usage-2026-10-07`, `a535572e52f54d557391e57087bac9ef0e08e6bc`।
- `~/Developer/OmniRoute/.claude/worktrees/native-model-switch-tools-2026-10-09` — `fix/native-model-switch-tools-2026-10-09`, `770a768b11d154020518a540cc7276fd41817a1f`।
- `~/Developer/OmniRoute/.claude/worktrees/native-suggestion-silence-2026-10-09` — `fix/native-suggestion-silence-2026-10-09`, `6e3dd8d503b7fde3718384c84bb058c6e570fe39`।

ওই পাঁচটি commit বর্তমান main HEAD-এর ancestor। Source refs অপরিবর্তিত, কোনো branch/commit বাদ দেওয়া হয়নি। Main source clean/pristine। ছোট original test evidence একই volume-এ rename করে এক copy-তে রাখা হয়েছে:

- `~/Developer/OmniRoute/.claude/worktrees/native-thread-usage-2026-10-07/.artifacts` → `~/Library/Caches/NexaLance/omniroute-storage-cleanup-2026-10-13/retired-worktree-evidence/native-thread-usage-2026-10-07/.artifacts`।
- `~/Developer/OmniRoute/.claude/worktrees/native-thread-usage-2026-10-07/.sandbox` → `~/Library/Caches/NexaLance/omniroute-storage-cleanup-2026-10-13/retired-worktree-evidence/native-thread-usage-2026-10-07/.sandbox`।
- `~/Developer/OmniRoute/.claude/worktrees/native-model-switch-tools-2026-10-09/nexa/.work` → `~/Library/Caches/NexaLance/omniroute-storage-cleanup-2026-10-13/retired-worktree-evidence/native-model-switch-tools-2026-10-09/nexa/.work`।

## পুরোনো runtime backup

`~/.omniroute-builds/runtime-backups/20261011-145841`-এর সম্পূর্ণ archive T7-এ file/hash/type/mode/symlink এবং source-unchanged verification-এর পরে শুধু internal copy সরানো হয়েছে। মোট 129741 entries: 116714 regular files, 12978 directories, 49 symlinks; regular-file bytes 2155566514।

Archive দুইটি অংশে আছে; প্রথম interrupted run-এর সম্পূর্ণ valid prefix পুনর্ব্যবহার হয়েছে। কোনো T7 archive overwrite বা delete করা হয়নি। Restore-এর ক্রম নিচে দেওয়া হলো; নতুন খালি destination এবং fresh resource admission নিয়ে প্রথম archive, তারপর দ্বিতীয় archive extract করতে হবে।

- `<local-setup>/rollback-archives/storage-cleanup-2026-10-13-older-runtime/runtime-backups-20261011-145841.tar` — 694153216 bytes; SHA-256 `fc1a0b1498149cffdd695ed669f93392907da8c8c236e4240d70ae8ece620e5b`।
- `<local-setup>/rollback-archives/storage-cleanup-2026-10-13-older-runtime/runtime-backups-20261011-145841.part2.tar` — 1692784640 bytes; SHA-256 `de6874f5bac51cd9e094072b1cd6ee4eb005b93fbcbf09fb0da41cdc9f12d77d`।

প্রতিটি অংশের `.manifest.jsonl` এবং combined `runtime-backups-20261011-145841.verified.json` একই archive directory-তে আছে। Verified receipt `~/Library/Caches/NexaLance/omniroute-storage-cleanup-2026-10-13/old-runtime-archive-resumed-final-receipt.json`।

Internal disk-এ newest two complete runtime rollbacks রাখা হয়েছে:

- `~/.omniroute-builds/runtime-backups/20261011-200008` — `e26be697f`।
- `~/.omniroute-builds/runtime-backups/20261012-000136` — `b03f80bca`।

## যা রাখা হয়েছে এবং কেন

- Main source, `nexa/`, `.git` ও source history; private `omniroute-optimizer` snapshot।
- Main dependency environment এবং `gpt-effort-passthrough-2026-10-10/node_modules`। Latest source/build child ওই shared environment ব্যবহার করে; তাদের symlink resolution যাচাই হয়েছে। একই hard-linked bytes দুই path-এ দেখা যায়।
- Latest successful `native-thinking-signature-build-2026-10-11/.build` এবং `dist`; current/previous `.tgz` এবং অন্য unique successful release packages। Packaging evidence ও failure receipts রাখা হয়েছে।
- Live `~/.omniroute-runtime` এবং `~/.omniroute-local`-এর database, WAL, configuration, account/key data, usage history, certificates, database snapshots ও logs। এগুলোকে disposable build cache ধরা হয়নি।
- Installed `/Applications/OmniRoute.app` ও সংরক্ষিত Desktop application bundle। Desktop bundle এবং server package আলাদা recovery artifact।
- Existing T7 source, archives ও অন্যান্য project assets। T7-এ শুধু নতুন archive/report লেখা হয়েছে।

Latest build/retained source worktree রাখা আছে; পাঁচটি পুরোনো worktree retire হয়েছে। Remaining folder size মূলত dependencies, source/docs/history ও latest successful build-এর জন্য।

## Post-cleanup verification

সব 20টি check PASS: removed targets absent, retired branches/refs preserved, main pristine, relocated evidence retained, release package ও protected-file hashes unchanged, shared dependency links valid, update pointers unchanged, two newest rollbacks retained, older runtime archive verified, live runtime/directory preserved, database inode/inventory retained, health এবং trusted native TLS।

- Live runtime SHA `0c0d3b1d4` অপরিবর্তিত। Localhost ও `omni.local` health HTTP 200।
- Provider connections 26, API keys 3; baseline ID/value/operator-state hashes মিলে। Credential values বা account identities report-এ নেই।
- Usage rows 124711 → 125017; live usage চলছিল, history cleared হয়নি।
- Private overlay commit `d9a4c33069350171d7c19bbf0d1b23d832d511dd` ও তার `nexa/` tree অক্ষত/clean। Cleanup-এর জন্য source commit/push, build বা paid model inference হয়নি।
- কোনো app, browser tab, unrelated service বা অন্য task বন্ধ করা হয়নি।

## Resource interruption ও resume

প্রথম cleanup run-এ physical headroom 7.825 GiB-তে নামায় শুধু own removal process থামে; already completed removals ও partial disposable target-এর checkpoint সংরক্ষিত ছিল। Fresh admission ও শুধু বাকি দুই generated target-এর ছোট workload নিয়ে resume সফল হয়; coordinator peak প্রায় 30.17 MiB।

প্রথম runtime archive 128 MiB-relative disk-change guard-এ থামে; original backup অক্ষত ছিল। নতুন অংশ capture হওয়ার পরে memory guard verification থামায়। Saved archive অংশগুলো পুনর্ব্যবহার করে final verification 64 MiB coordinator cap, 64 KiB buffer ও bounded tar-header cache-এ সম্পন্ন হয়; peak 28.45 MiB। Memory warning/low reserve-এ own I/O থামার ব্যবস্থা ছিল; normal pressure ও fresh reserve admission ছাড়া heavy I/O শুরু হয়নি। Running internal disk floor 20 GiB ছিল, owner stop floor 15 GiB-এর চেয়ে বেশি। Swap-growth guard 1 GiB ও minimum physical headroom 8 GiB বজায় ছিল। Failed/preflight receipts ও logs অক্ষত আছে।

## Evidence

Task directory `~/Library/Caches/NexaLance/omniroute-storage-cleanup-2026-10-13`। প্রধান files: `cleanup-plan.json`, `baseline.json`, `cleanup-results.jsonl`, `cleanup-results-resume1.jsonl`, `cleanup-stage1-receipt.json`, `old-runtime-archive-resumed-final-receipt.json`, `cleanup-final-verification.json`। Cleanup checks application feature parity বা নতুন deployment-এর দাবি নয়; application code ও live runtime পরিবর্তিত হয়নি।
