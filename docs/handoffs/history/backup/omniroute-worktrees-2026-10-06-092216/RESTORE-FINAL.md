> **ঐতিহাসিক নথি — public copy, ২০২৬-১০-১৭।** মূল ঘটনার তারিখ ও ফল এই নথির নিজস্ব সময়ের জন্য প্রযোজ্য; পরের সংযোজন থাকতে পারে। বর্তমান অবস্থা ও কাজের নিয়মের জন্য [বর্তমান handoff](../../../CURRENT-STATUS-2026-10-17.md) পড়ুন। Private reference ও identifier সরানো হয়েছে; স্থানীয় evidence এখানে অন্তর্ভুক্ত নেই। পুরোনো cleanup, build, deploy বা service command বর্তমান অনুমতি হিসেবে ব্যবহার করবেন না।

# OmniRoute development checkout backup

রক্ষণাবেক্ষণ: Jillur Rahman

এই backup-এ চারটি inactive development checkout-এর source ও ignored local files রাখা হয়েছে। Source file-এর SHA-256 archive-এর কপির সঙ্গে মিলিয়ে যাচাই করা হয়েছে। বর্তমান অবস্থা ও পরিমাপ `cleanup-receipt.json`-এ আছে।

## সংরক্ষিত checkout

| Checkout | Branch | Commit | Source files |
|---|---|---|---:|
| `agent-bridge-update-durability` | `fix/agent-bridge-update-durability` | `f77079418d844a618fd0429afe0a62c86fbcb795` | 24048 |
| `auto-update-command` | `feat/auto-update-command-mode` | `d1fe09dac1196596f63a74c5f2ebb979b203dc54` | 23985 |
| `claude-quota-alerts` | `fix/claude-quota-alerts` | `79412f0ec61a9d000862705e5c57b75f26181313` | 24061 |
| `gpt-6-1-sol-support` | `fix/gpt-6-1-sol-support` | `284f0d4ae3d0fd45f20e05d0dacfec4382736de1` | 24057 |

প্রতিটি `.tar`-এর পাশে `.manifest.json` আছে। Manifest-এ content hash, size, mode ও symlink target আছে। `local-git-metadata.tar`-এ মূল repository-এর স্থানীয় Git object store ও branch metadata রাখা হয়েছে। এটি partial-clone snapshot: তখন স্থানীয়ভাবে থাকা objects সংরক্ষিত, remote-এর অনুপস্থিত historical blobs নতুন করে download করা হয়নি। চারটি branch মূল repository-তেও অক্ষত আছে। SHA-256 ও content verification receipt-এ আছে।

## Archive থেকে বাদ দেওয়া ফাইল

- Checkout-root `node_modules`: shared dependencies মূল repository-তে অক্ষত রাখা হয়েছে। এগুলো আবার কপি করে T7-তে জায়গা বাড়ানো হয়নি।
- Checkout-root `.git`: এটি মূল repository-এর worktree pointer। পুরোনো pointer ব্যবহার না করে Git দিয়ে নতুন checkout তৈরি করতে হবে। Branch ও commit মূল repository-তে রাখা হয়েছে।

## অক্ষত রাখা setup

- Source ও স্থায়ী overlay: `~/Developer/OmniRoute` এবং তার `nexa/`।
- Runtime: `~/.omniroute-runtime`।
- Configuration/provider database: `~/.omniroute-local`।
- Release/rollback files: `~/.omniroute-builds`।
- Boot helper: `/Library/Application Support/OmniRoute-Native-Ingress` এবং `/Library/Application Support/OmniRoute-Local`।

Checkout cleanup কোনো build, deploy বা service restart করেনি। পরে আলাদাভাবে rate-limit incident পরীক্ষা করে dashboard-এর `Cached quota filtering` OFF করা হয়েছে; সেই পরিবর্তন ও live test আলাদা report-এ থাকবে।

## Checkout ফিরিয়ে আনা

প্রথমে receipt-এর archive SHA-256 ও manifest মিলিয়ে নিন। Main repository ও branch থাকলে নিচের command দিয়েই commit-এর source ফিরবে। Original path অনুপস্থিত থাকলেই command চালাবেন; existing checkout overwrite করবেন না।

### agent-bridge-update-durability

```bash
git -C "$HOME/Developer/OmniRoute" worktree add "$HOME/Developer/OmniRoute/.claude/worktrees/agent-bridge-update-durability" 'fix/agent-bridge-update-durability'
```

### auto-update-command

```bash
git -C "$HOME/Developer/OmniRoute" worktree add "$HOME/Developer/OmniRoute/.claude/worktrees/auto-update-command" 'feat/auto-update-command-mode'
```

### claude-quota-alerts

```bash
git -C "$HOME/Developer/OmniRoute" worktree add "$HOME/Developer/OmniRoute/.claude/worktrees/claude-quota-alerts" 'fix/claude-quota-alerts'
```

### gpt-6-1-sol-support

```bash
git -C "$HOME/Developer/OmniRoute" worktree add "$HOME/Developer/OmniRoute/.claude/worktrees/gpt-6-1-sol-support" 'fix/gpt-6-1-sol-support'
```

নতুন checkout-এ dependencies প্রয়োজন হলে main `node_modules` থেকে repository guide অনুযায়ী hard link তৈরি করুন। Ignored local files প্রয়োজন হলে `.tar` একটি নতুন খালি temporary directory-তে খুলে যাচাই করে নিন। Source directory-তে অন্ধভাবে archive extract করবেন না।

Main Git metadata অনুপস্থিত হলে `local-git-metadata.tar` একটি আলাদা খালি directory-তে extract করে recovery বিশেষভাবে যাচাই করতে হবে। পুরোনো worktree registration সরাসরি ব্যবহার করবেন না। এই snapshot-এ partial clone-এর অনুপস্থিত remote blobs নেই। Failed bundle-এর ক্ষুদ্র `.lock` file usable backup নয়।


## Cleanup verification

চারটি checkout সরানো হয়েছে। মূল branch, চারটি retained branch ও 180টি protected file-এর hash অপরিবর্তিত ছিল। `omni.local/healthz` এবং `127.0.0.1:28128/healthz` HTTP 200 ছিল; localhost HTTPS routing-এ certificate validation সফল ছিল। Source archive-এ মোট 96,151টি file যাচাই হয়েছে। মূল source tree-এর measured size 5,368,620 KiB; hard-link duplicate count ধরলে 5,580,292 KiB। Removal interval-এ internal filesystem-এর free space প্রায় 2.16 GiB বেড়েছে; একই সময়ে অন্যান্য app-ও disk ব্যবহার করে, তাই এটি filesystem observation।
