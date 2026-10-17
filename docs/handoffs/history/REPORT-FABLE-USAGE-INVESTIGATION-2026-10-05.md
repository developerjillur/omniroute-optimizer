> **ঐতিহাসিক নথি — public copy, ২০২৬-১০-১৭।** মূল ঘটনার তারিখ ও ফল এই নথির নিজস্ব সময়ের জন্য প্রযোজ্য; পরের সংযোজন থাকতে পারে। বর্তমান অবস্থা ও কাজের নিয়মের জন্য [বর্তমান handoff](../CURRENT-STATUS-2026-10-17.md) পড়ুন। Private reference ও identifier সরানো হয়েছে; স্থানীয় evidence এখানে অন্তর্ভুক্ত নেই। পুরোনো cleanup, build, deploy বা service command বর্তমান অনুমতি হিসেবে ব্যবহার করবেন না।

# Fable usage investigation

Author: Jillur Rahman<br>
Review date: 2026-10-05, Asia/Dhaka<br>
Evidence cutoff: 2026-10-05 00:56:38 Dhaka / 2026-10-04 18:56:38 UTC

## 1. Confirmed finding

Official Claude usage screen-er **Fable this week: 28% used** real Fable-family usage-er sathe mile. Current audit-e model-ti **Claude Fable 5.1**, Fable 5 noy.

Native Desktop-er **“ElevenLabs v4 Bangla voice generation”** session-e main model Opus 5.5 chhilo, kintu main session explicitly `Agent` invocation-e `model: "fable"` diye **9-ti subagent** launch korechhilo. Ek-ti chhilo chhoto quota probe; baki 8-ti chhilo engineer/research/ledger work.

Child transcript-gulote actual response model `claude-fable-5-1`. OmniRoute-e eki model-er 199-ti successful HTTP 200 request ache. Tai user manually model picker-e Fable select na korleo background work Fable consume korechhe.

Ei incident-er inspected calls-e OmniRoute Opus-ke automatic Fable-te substitute koreni. Native subagent invocation-ei Fable explicitly select kora hoyechhilo.

## 2. Keno oi session Fable select korechhilo

Main native transcript-er line 27029, UTC 17:02:03-e, public assistant text-e bola hoyechhilo je Sonnet-er tin-ti agent rate limit-e atkechhe. Main session-er nijer Opus request cholchhilo, tai onno model Fable diye agent chole ki na check korar siddhanto ney.

Line 27039, UTC 17:02:10-e, prothom explicit invocation:

```json
{
  "description": "Quota check for Fable model",
  "model": "fable",
  "run_in_background": false
}
```

Tarpor eki main conversation-e Fable diye background work launch kora hoy. Eti native session-er orchestration decision. User-er main model picker Opus 5.5-i thake.

## 3. Verified native launches

Sob somoy Asia/Dhaka. Midnight-er age 2026-10-04, midnight-er pore 2026-10-05.

| Launch time | Task description | Explicit model | Child response model | Parent transcript line |
|---|---|---|---|---|
| Oct 4, 23:02:10 | Quota check for Fable model | fable | claude-fable-5-1 | 27039 |
| Oct 4, 23:02:30 | V11b engineer pass (Fable) | fable | claude-fable-5-1 | 27053 |
| Oct 4, 23:02:39 | V12b engineer pass (Fable) | fable | claude-fable-5-1 | 27057 |
| Oct 4, 23:02:45 | V8c completeness ledger (Fable) | fable | claude-fable-5-1 | 27061 |
| Oct 4, 23:25:23 | V7c completeness ledger (Fable) | fable | claude-fable-5-1 | 27097 |
| Oct 4, 23:52:08 | V9c completeness ledger (Fable) | fable | claude-fable-5-1 | 29248 |
| Oct 4, 23:54:40 | V10c completeness ledger (Fable) | fable | claude-fable-5-1 | 29436 |
| Oct 5, 00:34:01 | V11c completeness ledger (Fable) | fable | claude-fable-5-1 | 31748 |
| Oct 5, 00:34:11 | V12c completeness ledger (Fable) | fable | claude-fable-5-1 | 31752 |

Each child-er full JSONL transcript theke model field verify kora hoyechhe. Transcript-e multiple assistant blocks thake; assistant-block count-ke API request count hisebe dhora hoyni.

## 4. OmniRoute request evidence

Weekly-reset-er porer window: Oct 4 23:00 Dhaka / Oct 4 17:00 UTC theke audit cutoff porjonto.

| Observation | Result |
|---|---|
| Successful Fable API requests | 199 |
| Requested model on successful call rows | claude/claude-fable-5-1 |
| Executed model on successful call rows | claude-fable-5-1 |
| First successful request | Oct 4 23:02:14 Dhaka |
| Last successful request | Oct 5 00:49:49 Dhaka |
| Additional failed outer request rows | 3 HTTP 429 rows, without a selected connection |
| Connected account's latest Fable remaining quota snapshot | 72% |
| Corresponding used quota | 28% |
| Fable weekly reset | Oct 11 23:00 Dhaka |

The 199 successful rows select the same connected Claude account. The three failed rows are separate outer request records; tara successful-generation count-er moddhe nei. Latest quota snapshot-e Fable window exhausted noy. Screenshot-e current-session quota 100% used, ja Fable weekly quota theke alada window.

Call logs and native child transcripts usage-er source confirm kore. Account-er sob product-er usage meter-er protiti percentage point independently reconstruct kora hoyni; direct web/mobile traffic local router logs-e nao thakte pare.

## 5. Native Opus display ar Fable calls-er apparent mismatch

Parent transcript-e Opus 5.5 thaka ar child transcript-e Fable 5.1 thaka contradictory noy. Main conversation ar subagents-er model selection alada.

Claude Code-er documented selection order-e per-invocation `model` parameter priority pay. Tai Opus main conversation theke `model: "fable"` subagent launch korle child Fable use korte pare. [Official subagent model selection](https://code.claude.com/docs/en/sub-agents#choose-a-model).

Ei case-e initial parent-only transcript inspection insufficient chhilo. Final conclusion-e parent tool invocation, child transcript, request artifact, routing mapping, ar quota snapshot ek sathe milano hoyechhe.

## 6. Inspected routing and defaults

Live stored Agent Bridge mapping:

```text
claude-opus-5-5  -> cc/claude-opus-5-5
claude-fable-5   -> cc/claude-fable-5
claude-fable-5-1 -> cc/claude-fable-5-1
```

Legacy `mitmAlias` claude-code mapping-o eki model family/version preserve kore. Inspected global aliases-e Opus 5.5 theke Fable-te mapping nei. Native global settings-e default model `opus`; relevant model environment override paoa jayni. Desktop-er ei session metadata-o Opus 5.5 / max effort dekhay.

Installed standalone Bridge resolver stored `mitmAlias` source-model mapping pore. Native explicit Fable child, same-model Bridge mapping, ar actual Fable request/response records ei event-er explanation ek sathe support kore.

## 7. “Fable this week” mane ki

Fable weekly meter Fable 5 ar Fable 5.1 family-r jonno relevant. Max plan-e Fable models plan-er regular weekly allowance theke consume kore, ar Fable-r nijer cap-o ache. Official guide-e up to 50% weekly allowance Fable-r jonno included bole. Eti extra independent free allowance noy. [Official Fable plan guide](https://support.claude.com/en/articles/15424964-claude-fable-models-on-your-plan).

Tai total weekly 19% ar Fable-specific 28% ekoi denominator-er percentage dhore jog/subtract kora thik noy. Ei audit displayed values ar matching snapshot verify korechhe; exact billing conversion formula claim kore na.

## 8. Purono model QA-er sathe relation

Oct 2-er all-Claude-model QA-te Fable 5 ar Fable 5.1 requests-o chhilo. Current screenshot-er 28% meter-er reset-window Oct 4 23:00 Dhaka theke shuru; verified heavy Fable 5.1 subagent calls tar porer.

Tai current incident-ke shudhu purono small model tests diye explain kora thik hobe na. Ei week-er substantial source holo uporer native-session subagents.

## 9. Future control options, ekhono apply kora hoyni

Fable avoid korte future native session instruction-e bola jay: main model ar subagents Opus-e rakhte, quota error hole account availability check korte, ebong permission chara onno model family select na korte. Eti instruction-based control, hard enforcement noy.

Official Claude Code-e `CLAUDE_CODE_SUBAGENT_MODEL`-er sathe `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` diye subagent model enforce korar supported option ache; minimum version 2.1.257. Shudhu default variable set korle explicit invocation override korte pare. [Official forced-subagent model option](https://code.claude.com/docs/en/sub-agents#run-every-subagent-on-one-model).

Hard enforcement model choice change kore. Ei investigation-e native configuration, Bridge mappings, API-key model permissions ba running tasks bodlano hoyni. Existing session-ke na thamie evidence collect kora hoyechhe.

## 10. Local evidence paths

Sanitized audit directory:

`~/Documents/Codex/2026-10-05/omniroute-fable-usage-investigation/`

- `confirmed-fable-subagent-cause.json`: all nine invocations, child models, successful/failed request groups, quota snapshots.
- `launch-reason-and-agent-identifiers.json`: relevant public explanation and first child launch identifiers.
- `explicit-agent-model-invocations.json`: model-selected native agent invocation timeline.
- `request-model-trace.json`: filtered request model/session metadata from first Fable API artifacts.
- `native-session-model-timeline.json`: parent model timeline, including Opus main session.
- `routing-and-usage-audit.json`: earlier aggregate snapshot and mapping audit.

Parent native transcript:

`~/.claude/projects/-home-user-Desktop-NexaLance-All-Projects-nexa-media/private-id-029.jsonl`

Child transcripts are in the sibling session directory's `subagents/` folder. Proof JSON records their exact paths. Private prompts, credentials, OAuth tokens, API keys, and account email addresses are not copied into this report.

## 11. Investigation scope

Read-only live configuration/log inspection, read-only SQLite queries, native transcript correlation, and current official documentation review. No build, test generation, quota-consuming experiment, service restart, public contribution, or account change was performed for this investigation. Only this new report and local sanitized evidence files were written.
