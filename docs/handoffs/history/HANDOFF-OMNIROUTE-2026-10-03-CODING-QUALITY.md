> **ঐতিহাসিক নথি — public copy, ২০২৬-১০-১৭।** মূল ঘটনার তারিখ ও ফল এই নথির নিজস্ব সময়ের জন্য প্রযোজ্য; পরের সংযোজন থাকতে পারে। বর্তমান অবস্থা ও কাজের নিয়মের জন্য [বর্তমান handoff](../CURRENT-STATUS-2026-10-17.md) পড়ুন। Private reference ও identifier সরানো হয়েছে; স্থানীয় evidence এখানে অন্তর্ভুক্ত নেই। পুরোনো cleanup, build, deploy বা service command বর্তমান অনুমতি হিসেবে ব্যবহার করবেন না।

# OmniRoute coding quality, context ebong long-session configuration

Owner: Jillur Rahman / NexaLance<br>
Date: 2026-10-03, Asia/Dhaka<br>
Live runtime: OmniRoute v3.8.51, `f77079418`<br>
Dashboard: http://omni.local/dashboard/settings/ai

## 1. Result ebong scope

Ei pass-e existing OmniRoute settings diye coding quality preserve korar configuration save ebong verify kora hoyeche. Native CLI-te parallel Opus/Sonnet request, file-reading tool round trip, ebong existing Claude Desktop Code conversation-e response o follow-up successful. Selected model-er context metadata 1,000,000 ebong max output metadata 128,000 verified.

Model-er trained capability settings diye barano hoyni. Configuration-er kaj holo extra prompt rewrite, tool-output trimming, response reuse ebong avoidable local quota policy theke coding workflow-ke bachano; native reasoning o context handling preserve kora. Native-er cheye objectively better coding quality ba 24-hour uninterrupted execution-er benchmark ei pass-e kora hoyni.

Scope holo Claude Code CLI, VS Code-er underlying Claude Code route ebong Claude Desktop-er Code tab. Ordinary Claude web chat, cloud Routines ebong protiti native feature ei test-er coverage-e nei.

## 2. Ei pass-e saved changes

| Setting | Before | After | Keno |
|---|---|---|---|
| Thinking Budget | Default passthrough, explicit row chhilo na | Explicit `mode: passthrough` | Client-er effort, adaptive thinking ebong reasoning fields preserve |
| Usage Token Buffer | 2000 | 0 | Extra gateway context-budget margin remove; native headroom handling retain |
| Combo reasoning token buffer | On | Off | Combo route client-er `max_tokens` rewrite korbe na ei buffer diye |
| MCP accessibility output | On | Off | OmniRoute-er nijer MCP server tool output trim/collapse korbe na |
| Gateway Skills injection | On | Off | Non-stream requests-e gateway registry theke extra skill tools inject korbe na; native client-er nijer skills/tools-er configuration alada |
| Exact response-cache runtime flag | Missing, handler default enabled | `settings.semanticCacheEnabled: false` | Fresh provider response; temperature-0 request-o purono response diye substitute korbe na |
| Legacy cache setting alias | `databaseSettings.semanticCacheEnabled: true` | False | Existing cache master-off policy-r sathe stored alias align |

Thinking Budget-er stored object-e `customBudget: 10240` ebong `effortLevel: medium` ache. Egulo Custom/Adaptive mode-er dormant values. `passthrough` mode-e egulo native effort-ke medium kore na ba thinking-ke 10,240-e cap kore na.

Current source-e Usage Token Buffer reported metering fields inflate kore na; separate `context_budget_*` margin calculate kore. UI description-er reported-usage wording historical. Zero korar effect holo oi extra margin remove kora, provider context window barano noy.

Browser diye Thinking Budget, Usage Buffer, Combo buffer, MCP accessibility ebong Gateway Skills save kora hoyeche. Exact-cache consistency correction-e sudhu dui-ti known setting row transaction-e align kora hoyeche. Karor credential, account ba history change kora hoyni. Tarpor normal dashboard save diye runtime settings cache invalidate ebong authenticated settings GET diye effective value verify kora hoyeche.

## 3. Cache settings-er important implementation finding

Cache page-r master switch `databaseSettings/cache.semanticCacheEnabled` read kore. Kintu `chatCore`-er exact response-cache path `settings.semanticCacheEnabled` read kore; missing hole enabled dhore. Ei duita store-er difference-er jonno UI-te Disabled dekhaleo exact handler independently enabled thakte pare.

Ekhon namespaced cache master, runtime exact-cache flag ebong legacy alias sob false. Vector response cache-o false. Prompt-prefix caching on ebong Client Cache Control `auto` rekhechi. Prompt-prefix caching response reuse-er theke alada: upstream model request cholbe, cached input prefix use korte parbe.

Future-e dashboard cache master on korle runtime exact flag alada bhabe check korte hobe. Ei configuration correction source-code fix ba upstream PR noy; source/runtime build unchanged. Current raw-response policy-te exact cache off intentional.

## 4. Preserved quality settings

| Feature | Verified configuration |
|---|---|
| Prompt Compression master / effective pipeline | Off / off |
| Adaptive context budget | Off |
| Context Editing | Current normalized default off; explicit enabled row nei |
| Output styles: Terse prose, Less code, Ponytail, action-first | Off |
| Global System Prompt | Off |
| Gateway conversational Memory / Qdrant | Off / off |
| Claude System-block Transform Pipeline | Disabled; empty pipeline |
| Payload rules | Empty default/override/filter/defaultRaw lists |
| Background Task Degradation | Off |
| Zero-latency hedging / proactive fallback compression | Off |
| Adaptive Volume Routing | Off |
| Prompt cache | On, strategy auto |
| Client cache_control handling | Auto |
| Prompt-cache locality / session stickiness | Locality on; disable-stickiness off |
| Native model mapping | Existing exact Claude mappings; selected model stays on Claude route |
| Optional fast-mode spoofing / paid fast mode override | Off |
| Security-classifier synthetic ALLOW bypass | Off |

Compression master off thakay panel-er disabled child switches-er kichu default checked dekha jay, jemon Lite ba Session Dedup. Egulo current effective pipeline-e cholchhe na. MCP accessibility independent store, tai seti separately off kora hoyeche.

`auto/*` virtual combos available ache, kintu native exact-model Bridge request auto model choice use kore na. Selected Opus-ke cost-optimized ba cheaper model-e remap korar rule enable kora hoyni. Kono global fixed output/thinking budget force kora hoyni.

## 5. Maximum context-er evidence ebong interpretation

Controlled native CLI results:

| Request | Effort | CLI context metadata | Max output metadata | Result |
|---|---|---:|---:|---|
| `claude-opus-5-5[1m]` | xhigh | 1,000,000 | 128,000 | Read + exact text + marker passed, exit 0 |
| `claude-sonnet-5-5` | high | 1,000,000 | 128,000 | Read + exact text + marker passed, exit 0 |

Sonnet result 8.40 seconds, Opus result 11.78 seconds. Egulo chhoto fixture-er observed duration; general performance benchmark noy. Opus response-e thinking tokens-o recorded ache.

Live existing user traffic-e `claude-opus-5-5` request-er logged input 846,739, status 200, cache source upstream, cached input 846,255 observed. Eti notun synthetic full-window test noy; running user conversation-er metadata read-only observation. Eta dekhay Bridge diye 200k-er beshi context actual provider request-e cholchhe. Controlled test-e pura 1M window fill ba 128k output generate kora hoyni.

Native Desktop usage popover-e current verification conversation ~95.8k / 1M. Existing native config-e `CLAUDE_CODE_DISABLE_1M_CONTEXT`, prompt-cache disable, fixed max-thinking/output ba autocompact-threshold override paowa jayni.

Model-er window sob input, system instructions, tool definitions/results ebong output diye share hoy. Prompt caching oi input-er context occupancy komay na. Native auto-compaction finite window-r moddhe long conversation continue korte shahajjo kore; eti disable korle eventually provider context overflow hote pare. Current native automatic compaction handling retain kora hoyeche. Latest native 1M default compaction threshold official docs-e ~967k; tai usable input-er sathe output headroom-o thakbe. [Claude Code model configuration](https://code.claude.com/docs/en/model-config), [Claude context windows](https://platform.claude.com/docs/en/build-with-claude/context-windows).

Haiku ba older model-er window-ke false 1M override deya hoyni. Ei capacity numbers specifically tested Opus/Sonnet 5.5-er jonno.

## 6. Long sessions, local limits ebong quota recovery

- `local-default` key active-session cap 0, throttle delay 0, custom rate limits empty, access schedule off, expiration empty, USD quota off. Token/quota allocation tables empty.
- Duita Claude connection-e rate-limit protection off, max concurrent null, rate-limit overrides null; global API-key queue auto-enable off.
- `STREAM_ACTIVE_TIMEOUT_MS=0`: active stream-er local wall-clock timeout nei. `STREAM_IDLE_TIMEOUT_MS=600000`, readiness ebong MITM idle cleanup 10 minutes. Egulo ekta idle network request-er cleanup; whole chat-er 24-hour duration cap noy.
- Session affinity TTL 86,400 seconds. Source-e protiti eligible use-e expiry refresh hoy. Eta rolling inactivity lifetime, continuously running chat-ke 24 ghonta pore bondho korar timer noy. Account exhausted/unavailable hole eligible-account failover thake.
- Native exact model direct route use kore. Combo path-er inherited whole-combo hang-stop ei native direct route-er total-chat cap noy.
- Quota preflight reserve cutoff off. Cached quota filtering on rakha hoyeche, jate actual exhausted account-e repeated model request na jay. Current quota-recovery worker known reset-e usage recheck kore; fresh quota pele account eligible kore, abar exhausted hole bounded retry rakhe.
- Duita connected Claude account-er moddhe ekti exhausted, ekti eligible. Live routing eligible `70075336` use korchhe; log-e `1 with quota, skipping 1 exhausted`. Third account ekhono connected noy.

Machine awake, service running, working network ebong eligible provider quota thakle multiple-turn sessions-er jonno extra local 24-hour session wall deya nei. Provider-er weekly/session/rate limit, real context/output maximum, auth/network failure ba native client-er nijer lifecycle behavior gateway configuration diye remove kora jay na. Paid overage enable kora hoyni.

## 7. Native validation ebong remaining uncertainty

1. Parallel native CLI Opus + Sonnet: both exit 0; Read tool actually used; fixture-r apostrophe, double quotes, Bangla, Greek text, tag, backticks ebong path exact preserve.
2. Existing Desktop Code verification conversation: Opus 5.5 Extra diye Read successful, `NATIVE_APP_QUALITY_OK` returned.
3. Final settings-er pore same existing conversation-e follow-up Read successful, `NATIVE_SETTINGS_FINAL_OK` + `FULL_CONTEXT_CODING_OK` returned; native UI Idle.
4. Saved configuration-er 14 targeted checks passed; effective settings authenticated GET ebong database re-read diye verify.
5. Live Bridge gate passed: backend TLS, native ingress TLS, hostname scope, client DNS ebong enabled state. Test-er age/pore Bridge PID record unchanged.
6. Source checkout clean; runtime build f770 unchanged. Service restart, package rebuild ba app-bundle edit ei pass-e kora hoyni.

Audit interval-er mixed live traffic-e provider `Thread` mismatch 400-o observed: differing fields anthropic-beta, cache_control, system. Subsequent requests successful 200 hoyeche, controlled native UI completed. Kintu protiti such retry-ke ei synthetic test-er sathe attribute kora hoyni, ebong direct-provider-versus-Bridge comparison ei pass-e hoyni. Ei observation-ke ignore kore zero-error native parity claim kora thik hobe na.

Full 24-hour soak, every native feature, all model/effort combinations, 1M saturation ebong native-er cheye coding-quality improvement benchmark pending coverage. Egulo current configuration checks ba chhoto successful requests-er equivalent noy.

## 8. Persistence, update ebong evidence

Settings store: `~/.omniroute-local/storage.sqlite`. Ei settings runtime package-er source files-er moddhe hard-code kora hoyni. Current managed updater `nexa/deploy/omni-updater.sh` local data snapshot, runtime preservation ebong rollback recovery use kore. Normal managed update ei saved DB/environment carry korbe; future schema/protocol change hole actual native requests abar verify korte hobe. Ei pass-e update/rollback repeat kora hoyni.

Code fixes-er durable overlay ebong quota-worker deployment-er report: [Quota recovery handoff](HANDOFF-OMNIROUTE-2026-10-03-QUOTA-RECOVERY.md). Sei source/runtime f770-ei cholchhe. Configuration-only pass-er jonno notun build, source commit ba PR dorkar hoyni.

Private evidence folder:
`~/Documents/Codex/2026-10-03/omniroute-coding-quality-0130/`

- `settings-before-redacted.json`, `settings-after-redacted.json`, `effective-settings-final.json`
- `exact-cache-setting-alignment.json`, `quality-configuration-checks.json`
- `native-parallel-summary.json`, `opus-native-summary.json`, `sonnet-native-summary.json`
- `native-desktop-quality-ok.png`, native Desktop AX captures
- `ai-settings-final.jpg`, `context-settings-final.jpg`
- `observed-large-context-live.json`, native route metadata captures
- `bridge-live-final.json`, `bridge-pid-continuity.json`

Credentials report-e nei. Before/after snapshots selective redacted settings; full database backup noy. Unnecessary temporary builds ba large backup create kora hoyni.


<!-- handoff-consolidation-2026-10-03 -->

## Latest consolidated handoff: 2026-10-03

Puro setup, Agent Bridge connection/lifecycle fixes, Local coexistence/DNS, durable nexa overlay, quota recovery, coding/context configuration, build RAM/disk control, tests, update/rollback ebong remaining gaps ekshathe: [HANDOFF-OMNIROUTE-2026-10-03-CONSOLIDATED.md](HANDOFF-OMNIROUTE-2026-10-03-CONSOLIDATED.md).

Latest recorded deployment/source/runtime f77079418, OmniRoute 3.8.51; final native CLI Opus/Sonnet ebong Desktop Code response successful. Tar pore coding settings-er 14 checks, native Read/follow-up, large-context observation ebong TLS/DNS gate successful. Ei file-er earlier builds, pending promotion ba cached-quota OFF descriptions historical; latest policy cached exhausted-account skip ON, preflight OFF. Future reset live recovery, remaining Thread mismatch telemetry, full 24-hour soak/new reboot ebong every native feature ekhono separate scope.

Documentation consolidation-e earlier content preserve kora hoyeche; new build ba live service mutation hoyni. User-er 2026-10-03 rule onujayi other people's public repositories-e PR/issue action designated owner session-er; help findings/patch oss-contrib/inbox-e hand over korte hobe. Purono direct-PR workflow latest authorization noy.
