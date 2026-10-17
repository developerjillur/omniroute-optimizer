> **ঐতিহাসিক নথি — public copy, ২০২৬-১০-১৭।** মূল ঘটনার তারিখ ও ফল এই নথির নিজস্ব সময়ের জন্য প্রযোজ্য; পরের সংযোজন থাকতে পারে। বর্তমান অবস্থা ও কাজের নিয়মের জন্য [বর্তমান handoff](../../../CURRENT-STATUS-2026-10-17.md) পড়ুন। Private reference ও identifier সরানো হয়েছে; স্থানীয় evidence এখানে অন্তর্ভুক্ত নেই। পুরোনো cleanup, build, deploy বা service command বর্তমান অনুমতি হিসেবে ব্যবহার করবেন না।

# 2026-10-06 deployment প্রস্তুতি: resume ও recovery

রক্ষণাবেক্ষণ: Jillur Rahman / NexaLance।

Source `a3571d5b29bf53e5fb4b23cbe43269596eb31122`, clean/pristine `nexalance`। Installed `dist/BUILD_SHA` এখনও `79412f0ec`। নতুন package তৈরি বা promote হয়নি। Source fix উপস্থিত থাকা live executable update-এর প্রমাণ নয়।

User সব apps খোলা রাখতে বলেছেন। Full TypeScript ratchet-এর 1024 MiB heap/1280 MiB RSS-budget attempt signal-এ incomplete; `tscErrors=SKIP`, exit 75। MDX generation পাস। Full ratchet/build/package/isolated smoke/native acceptance ছাড়া promotion নয়।

নিজস্ব prepared worktree:

```text
~/Developer/OmniRoute/.claude/worktrees/deploy-resource-safety-2026-10-06
```

এই checkout APPLIED; cached dependencies ও compiler cache reuse করা হয়েছে। এখানে commit করার আগে overlay restore প্রয়োজন। মূল source pristine থাকবে। Normal entry point `omni-ctl build-only` ও `omni-ctl redeploy`; default Desktop build/close/replace off, local updater Git publish করে না।

বড় কাজের আগে live resources মাপুন। Process budget-এর বাইরে user apps-এর 10 GiB reserve; default full-candidate RSS budget 8 GiB, অর্থাৎ preflight 18 GiB headroom। Internal disk build gate 24 GiB। Budget বা pressure fail হলে job শুরু নয়। Runtime-এ warning/critical, headroom under 8 GiB, swap growth over 1 GiB বা internal free under 15 GiB হলে শুধু own job বন্ধ। User apps বন্ধ করা অনুমোদিত নয়।

এই folder-এর `deployment-preparation-2026-10-06.json` source/current runtime, fresh quota/resource, policy tests ও incomplete compiler outcome রাখে। `archive-receipt-final.json` তিন obsolete internal path-এর full read-back hash verification, cleanup result ও protected assets রাখে। এই archive-এ পুরোনো runtime এবং cloned-data smoke state আছে; এগুলো private recovery assets।

Current/previous TGZ ও immediate previous runtime internal disk-এ retained। Source backup-এর আগের ভিত্তি:

```text
../omniroute-worktrees-2026-10-06-092216/nexa-overlay-a15864e12.tar
../omniroute-worktrees-2026-10-06-092216/quota-cost-update-a15864e12.patch
```

এর পরের source commit `deployment-source-update-a3571d5b2.patch`; bytes ও SHA-256 নতুন receipt-এ আছে। Source intact হলে restore করবেন না। প্রয়োজন হলে খালি owned destination-এ আগের recovery guide অনুযায়ী a15864e12 restore, delta hash যাচাই, `git apply --check` এবং overlay pristine/applicability validation করুন। Existing T7 files overwrite বা archive extract-overwrite নয়।

Promotion-এর আগে real isolated smoke এবং idle traffic যাচাই, consistent database snapshot ও immediate rollback রাখতে হবে। এরপর runtime SHA, certificate-verified native ingress, actual CLI/Desktop/parallel/resume/cancel, dashboard Cost Refresh ও restart acceptance নথিভুক্ত করুন। Provider quota snapshot successful inference বা 24-hour reliability-এর প্রমাণ নয়।

সম্পূর্ণ update: [মূল handoff-এর বিকেলের সংযোজন](../../HANDOFF-OMNIROUTE-2026-10-02.md#deployment-preparation-2026-10-06)।
