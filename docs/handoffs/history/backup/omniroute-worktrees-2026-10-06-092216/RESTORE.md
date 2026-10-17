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

প্রতিটি `.tar`-এর পাশে `.manifest.json` আছে। Manifest-এ content hash, size, mode ও symlink target আছে। `retained-branches.bundle`-এ মূল `nexalance` এবং চারটি development branch-এর Git history থাকবে। Bundle-এর যাচাই ও checksum receipt-এ থাকবে।

## Archive থেকে বাদ দেওয়া ফাইল

- Checkout-root `node_modules`: shared dependencies মূল repository-তে অক্ষত রাখা হয়েছে। এগুলো আবার কপি করে T7-তে জায়গা বাড়ানো হয়নি।
- Checkout-root `.git`: এটি মূল repository-এর worktree pointer। পুরোনো pointer ব্যবহার না করে Git দিয়ে নতুন checkout তৈরি করতে হবে। Branch ও commit মূল repository-তে রাখা হয়েছে।

## অক্ষত রাখা setup

- Source ও স্থায়ী overlay: `~/Developer/OmniRoute` এবং তার `nexa/`।
- Runtime: `~/.omniroute-runtime`।
- Configuration/provider database: `~/.omniroute-local`।
- Release/rollback files: `~/.omniroute-builds`।
- Boot helper: `/Library/Application Support/OmniRoute-Native-Ingress` এবং `/Library/Application Support/OmniRoute-Local`।

এই কাজ কোনো build, deploy, account/configuration change বা service restart করে না।

## Checkout ফিরিয়ে আনা

প্রথমে receipt-এর archive ও bundle SHA-256 মিলিয়ে নিন। Main repository ও branch থাকলে নিচের command দিয়েই commit-এর source ফিরবে। Original path অনুপস্থিত থাকলেই command চালাবেন; existing checkout overwrite করবেন না।

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

Main Git history অনুপস্থিত হলে `retained-branches.bundle` দিয়ে আলাদা repository-তে history উদ্ধার করা যায়। Bundle-এর verification status ও SHA-256 receipt-এ আছে।
