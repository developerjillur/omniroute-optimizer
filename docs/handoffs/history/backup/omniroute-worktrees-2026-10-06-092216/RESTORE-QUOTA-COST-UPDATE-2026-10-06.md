> **ঐতিহাসিক নথি — public copy, ২০২৬-১০-১৭।** মূল ঘটনার তারিখ ও ফল এই নথির নিজস্ব সময়ের জন্য প্রযোজ্য; পরের সংযোজন থাকতে পারে। বর্তমান অবস্থা ও কাজের নিয়মের জন্য [বর্তমান handoff](../../../CURRENT-STATUS-2026-10-17.md) পড়ুন। Private reference ও identifier সরানো হয়েছে; স্থানীয় evidence এখানে অন্তর্ভুক্ত নেই। পুরোনো cleanup, build, deploy বা service command বর্তমান অনুমতি হিসেবে ব্যবহার করবেন না।

# Quota/Cost source update recovery

তারিখ: 2026-10-06। রক্ষণাবেক্ষণ: Jillur Rahman।

`RESTORE-FINAL.md` মূল চারটি archived checkout-এর recovery বর্ণনা করে। এই
নতুন guide পরবর্তী পাঁচটি source commit ও চূড়ান্ত live setting-এর supplement।
পুরোনো guide-এর diagnosis-time `Cached quota filtering OFF` এখন superseded:
final setting ON, per-request quota preflight OFF ও cutoff 0।

## অক্ষত source ও runtime

বর্তমান `nexalance` source HEAD:

```text
a15864e120e58f5f2c5a82fe46e974c3bfc30952
```

Main source, shared dependencies, installed runtime, data ও package rollback
পৃথকভাবে retained। Latest source এখনও নতুন production package-এ deploy হয়নি।
Source recovery package promotion বা typecheck gate পাসের বিকল্প নয়।

## নতুন artifacts

- `nexa-overlay-a15864e12.tar`: 182 tracked `nexa/` file hash-verified।
- `quota-cost-update-a15864e12.patch`: base `79412f0ec` থেকে পাঁচটি commit।
- `quota-cost-source-recovery-a15864e12.json`: archive/evidence size ও SHA-256।
- `final-validation-summary.json`: source, tests, live setting ও pending gate।
- `cost-worktree-cleanup-receipt.json`: দ্বিতীয় নিজস্ব worktree ও fixture cleanup।
- `SOURCE-UPDATE-SHA256SUMS-2026-10-06.txt`: নতুন supplement artifacts-এর hashes।

এই files original archive বা e67 source archive overwrite করেনি।

## প্রয়োজনে source restore

প্রথমে SHA-256 verify করুন। Main source এখনও থাকলে restore প্রয়োজন নেই;
সেখানে latest committed source আছে। হারানো কাজ পুনরুদ্ধারে নতুন খালি isolated
worktree ব্যবহার করতে হবে। Existing checkout/data directory-র উপর extract বা
`reset --hard` করবেন না। Internal disk/RAM budget এবং branch/path অনুপস্থিতি
আগে যাচাই করুন।

Local Git-এ base commit থাকলে নতুন recovery checkout ও branch-এর উদাহরণ:

```bash
git -C "$HOME/Developer/OmniRoute" worktree add -b 'recover/quota-cost-2026-10-06' "$HOME/Developer/OmniRoute/.claude/worktrees/recover-quota-cost-2026-10-06" '79412f0ec61a9d000862705e5c57b75f26181313'
git -C "$HOME/Developer/OmniRoute/.claude/worktrees/recover-quota-cost-2026-10-06" -c user.name='Jillur Rahman' -c user.email='22579419+developerjillur@users.noreply.github.com' am '<local-setup>/backup/omniroute-worktrees-2026-10-06-092216/quota-cost-update-a15864e12.patch'
```

এরপর `nexa/check/pristine-base.mjs`, patch apply health ও archive file hashes
মিলিয়ে source tree যাচাই করতে হবে। Author/committer timestamps ভিন্ন হলে
recovered commit SHA ভিন্ন হতে পারে; file content যাচাই জরুরি।

শুধু overlay archive থাকলে নতুন খালি directory-তে extract করে manifest-এর
base version/commit-এর pristine upstream tree-এর সঙ্গে মেলাতে হবে। পুরো
source বা dependencies ছাড়া standalone runtime চালানো যাবে না। Partial-clone
Git metadata snapshot সম্পূর্ণ historical Git bundle নয়।

## পুনরায় release করা

যথেষ্ট resources পেলে isolated build, core typecheck, পূর্ণ measured TypeScript
ratchet, regression, packaged dashboard check ও isolated smoke পাস করতে হবে।
তারপর rollback রেখে promote, এবং available provider quota দিয়ে native
desktop/CLI ও service restart acceptance। সব gate পাস হওয়ার আগে runtime
binary-তে হাতে patch বা live package replacement করবেন না।
