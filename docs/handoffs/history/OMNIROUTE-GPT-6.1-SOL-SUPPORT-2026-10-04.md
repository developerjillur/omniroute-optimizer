> **ঐতিহাসিক নথি — public copy, ২০২৬-১০-১৭।** মূল ঘটনার তারিখ ও ফল এই নথির নিজস্ব সময়ের জন্য প্রযোজ্য; পরের সংযোজন থাকতে পারে। বর্তমান অবস্থা ও কাজের নিয়মের জন্য [বর্তমান handoff](../CURRENT-STATUS-2026-10-17.md) পড়ুন। Private reference ও identifier সরানো হয়েছে; স্থানীয় evidence এখানে অন্তর্ভুক্ত নেই। পুরোনো cleanup, build, deploy বা service command বর্তমান অনুমতি হিসেবে ব্যবহার করবেন না।

# OmniRoute GPT 6.1 Sol support: setup, QA ar handoff

Maintained by Jillur Rahman. Date: 2026-10-04.

## Current status

Source fix local `nexalance` branch-er `nexa/` overlay-te ache. Backend package build,
isolated service smoke, 17-ti model/client integration test ar effort audit successful.

**Production runtime install ekhono pending.** Live service-e original `f77079418` package
cholchhe. Base model-er temporary configuration workaround diye live HTTP 200 age
verified hoyeche, kintu complete alias ar max-preservation fix installed runtime-e ekhono nei.

Installer prai 15 minute idle window-er jonno check korechhe; health-e duiti active
request consistently dekhano hoyeche. Safe idle window na paoway install stop korechhe.
`stopped=false`, `movedOld=false`, `movedNew=false`: service restart ba runtime replace
kora hoyni. New production database snapshot-o ei attempt-e create hoyni.

Current response shesh hole prai 1 minute notun request pause kore janano dorkar.
Tarpor already-verified package diye promotion, temporary identity override removal,
production API/native CLI tests ar Bridge re-verification kora jabe. Ar source build
dorkar nei. Background-e kono delayed promotion process rakha hoyni.

## Ki problem chhilo

1. OmniRoute-er original static Codex model registry-te `gpt-6.1-sol` chhilo na.
   Initial request HTTP 400 diye active live catalog-e model nei bole reject korto.
2. Existing default client identity `0.156.1` diye custom model-er request-o fail korto.
   Installed native Codex CLI-er `0.160.0` identity diye same connected provider successful chhilo.
   Eta ei environment-er observed result; `0.160.0`-ke universal minimum version bola hocchhe na.
3. Existing reasoning executor `gpt-6.1-sol`-er `max` request silently `xhigh`-e clamp korto.
   Before-fix call-log id: `private-id-025`.
4. Temporary custom model initial context fallback 400,000 dekhato.
   Native model metadata-er maximum-er sathe miliye dashboard override 872,000 set kora hoyeche.
5. Native bare model id future-e Codex ar Codex API-r moddhe ambiguous hote parto.
   Connected Codex preference set-e base ar chhoyti suffix add kora hoyeche.

## Durable child overlay

All source change `nexa/`-er moddhe. Upstream base byte-for-byte pristine.
Local source commit: `284f0d4ae3d0fd45f20e05d0dacfec4382736de1`.
Base branch: operator-confirmed `nexalance`; parent commit `f77079418d844a618fd0429afe0a62c86fbcb795`.
Work branch: `fix/gpt-6-1-sol-support`.
Public PR, issue, comment ba push kora hoyni.

| File | Ki kore |
| --- | --- |
| `nexa/patches/open-sse__config__providers__registry__codex__index.ts.patch` | Base model, six effort aliases, Responses, tools, vision ar context metadata |
| `nexa/patches/open-sse__executors__codex__reasoningSuffix.ts.patch` | Ei model-er max/ultra compatibility ar max preservation |
| `nexa/patches/open-sse__services__model.ts.patch` | Native bare ids-er Codex routing preference |
| `nexa/patches/src__shared__constants__codexClient.ts.patch` | Shared default client identity 0.160.0 |
| `nexa/patches/Dockerfile.patch` | Existing overlay preserve kore matching CLI pin |
| `nexa/new/tests/unit/gpt-6-1-sol-support.test.ts` | Catalog, aliases, effort, native routing ar later caller-version regression tests |
| `nexa/manifest.json` | Overlay inventory updated |
| `nexa/docs/GPT-6-1-SOL-SUPPORT-2026-10-04.md` | Maintenance ar compatibility guide |

Manifest-e 107 entries: 71 patches, 34 new files ar 2 tooling entries.
All 71 patches cleanly apply kore. Native app bundle, account, project/history ar
ordinary app update mechanism ei model fix-er jonno edit kora hoyni.

## Model use korar ids

Ei tin form connected Codex route-e test kora hoyeche:

```text
gpt-6.1-sol
codex/gpt-6.1-sol
cx/gpt-6.1-sol
```

Suffix aliases:

```text
gpt-6.1-sol-low
gpt-6.1-sol-medium
gpt-6.1-sol-high
gpt-6.1-sol-xhigh
gpt-6.1-sol-max
gpt-6.1-sol-ultra
```

Suffix-gulor satheo `codex/` ba `cx/` prefix use kora jay. Base + six suffix,
ei tin naming form miliye connected Codex catalog-e 21-ti related entry verified.
Catalog-e separately `cxa/` provider-er entries-o thake; ei report segulor account
entitlement ba successful routing claim korchhe na.

## Effort-er actual behavior

| Selection | Provider request-er effort |
| --- | --- |
| low | low |
| medium | medium |
| high | high |
| xhigh | xhigh |
| max | max |
| ultra alias | max |

Suffix request-body-r conflicting effort-er upor priority pay, existing alias contract
onusare. Test-e suffix request-er body-te low dewa hoyechhilo; xhigh/max/ultra suffix-er
upstream audit jothakrome xhigh/max/max confirm korechhe.

After-fix explicit max call-log id: `private-id-026`,
requested max, upstream max, HTTP 200.
Explicit ultra call-log id: `private-id-027`,
requested ultra, upstream max, HTTP 200.

OmniRoute API-r ultra alias upstream max use kore. Native client-er automatic task
delegation alada client behavior; ordinary API request-e ei alias seta add kore na.

## Context ar output metadata

Current native catalog:

```text
context_window: 272000
max_context_window: 872000
effective_context_window_percent: 95
default_reasoning_level: low
input_modalities: text, image
```

OmniRoute registry ar dashboard override-e `context_length=872000` ebong
`max_input_tokens=872000` consistent ache. Native client-er nijer default context ar
maximum context alada field. Dashboard maximum set thaka diye client-er effective
remaining context ba compaction behavior 100% establish hoy na.

Ei QA-te full 872,000-token input stress test kora hoyni. Shared Codex capability
definition-er `max_output_tokens=128000` metadata inherited; full output limit-o
measure kora hoyni. Ei change kono coding-quality benchmark noy. Same model-er
max effort silently downgrade howar bug fix kora hoyeche.

Primary reference: [OpenAI Codex model manifest](https://raw.githubusercontent.com/openai/codex/refs/heads/main/codex-rs/models-manager/models.json).
Native local catalog-er selected metadata private evidence folder-e saved ache.

## Connection configuration

Connected Codex discovery `autoFetchModels=true`, `codexDiscoveryMode=safe`.
Before deployment, existing runtime-e upstream compatibility prove korar jonno
temporary connection-specific `Version=0.160.0` ebong `customUserAgent=codex_cli_rs/0.160.0`
set kora hoyechhilo. Ei temporary overrides production-e ekhono ache. Patched shared default verify howar pore ei settings
clear korte hobe, jate future native caller nijer newer version forward korte pare.
Later native caller version 0.161.0 forwarding regression test pass korechhe.

Existing manual custom model-er Responses ar Vision metadata preserve kora hoyeche;
context override 872,000. Compiled registry-teo ei model ar metadata ache.
Ei fix global default model ba onno provider-er routing preference change kore na.

## Validation results

| Gate | Result |
| --- | --- |
| Before-fix focused regression | 5 failures, 0 passes; defect reproduced |
| Final focused model/routing tests | 43/43 pass; peak 302 MiB |
| Core typecheck | Pass |
| Full TypeScript ratchet | Existing 5,830 baseline unchanged |
| Deployment helpers | 23 tests pass |
| Bridge regression | 553 tests across 97 files pass |
| UI regression | 21 tests pass |
| Protocol ar identity regression | 72 tests pass |
| Build security gate | 34 tests pass |
| Package Bridge contract | Pass; source ar dist match |
| Isolated general service smoke | Health, auth, Bridge state, catalog, Claude inference ar CORS pass |
| Isolated model/client integration | 17/17 pass |
| Test-key policy restoration | Exact original policy restored in isolated database |

Full TypeScript baseline clean noy. Docs generated-source absent thakay initial-e
5-ti extra diagnostic esechhilo; generated source create korar pore original baseline-e
fire esechhe. Baseline backlog ei model task-er scope-e fix kora hoyni.

17-ti integration test-er breakdown:

- Six explicit effort requests: low, medium, high, xhigh, max, ultra.
- Six effort suffix requests, conflicting body effort low diye.
- Native bare model-id request.
- Responses SSE stream, terminal response.completed verified.
- Chat Completions endpoint request.
- Existing gpt-6-astra regression request.
- Actual native Codex CLI invocation, response `GPT61_NATIVE_CLI_OK`.

Native CLI test ephemeral, read-only sandbox, user config ignore kore specific test
provider override diye run kora hoyeche. Permanent native provider/account configuration
change kora hoyni. Short marker responses-er measured latency prai 1.9-6.6 seconds;
eta large coding workload-er latency guarantee noy.

## Build ar storage

Backend-only ekbar full compile kora hoyeche. Desktop shell ba Docker build kora hoyni.
Bounded runner: heap 6,144 MiB, RSS watchdog 8,192 MiB, one worker, low CPU priority.
Actual final peak 5,429 MiB, prai 5.3 GiB; exit code 0; watchdog stop hoyni.

Final package:

```text
~/.omniroute-builds/3.8.51-284f0d4ae/omniroute-3.8.51.tgz
size: 99573230 bytes
SHA-256: 945c8a7c6b21d414855ebf26385e0e7b3604459c70b9b8e81faae3ad6b3d71e6
```

Initial disk-space gate sufficient free space payni. Initial command gate fail-er pore
validation continue koray owned process stop kora hoyechhilo; full compile shuru hoyni.
Pore gate + mutation sequences fail-fast kora hoyeche. Existing live service untouched chhilo.

Older generated HOME-side runtime/app copies ar regenerable npm cache age inventory,
archive ar hash verify kore cleanup kora hoyeche. Current live runtime, user projects,
provider data ar latest rollback preserve kora hoyeche. T7-r existing file delete ba
overwrite kora hoyni; new archive folder use kora hoyeche:

```text
<local-setup>/archives/generated-builds-2026-10-04-gpt-6-1-sol
```

Main generated-files archive 318,862 entries verify korechhe; missing 0, mismatch 0.
SHA-256 `fee78f2c89a431803d4951dd31ac8512ab90908baaa59ba54efc5d428de3cb06`.
Older unreferenced package ar inactive Prisma cache-o separately archived/hash verified.
Active MCP cache packages preserve kora hoyeche.

## Update ar rollback behavior

Installed runtime-er raw TypeScript edit diye compiled Next.js route change hoy na.
Ei fix source patches theke normal backend package-e compile kora hoyeche.
Future OmniRoute update-e `nexa/apply.mjs --check` diye patch compatibility check hobe;
conflict thakle updater working runtime replace korar age stop korbe.

Current verified rollback package:

```text
~/.omniroute-builds/3.8.51-f77079418/omniroute-3.8.51.tgz
```

Production promotion-e current runtime prefix rename kore preserve korte hobe,
one consistent private database/config snapshot rakhte hobe, runtime extras preserve
korte hobe, tarpor health ar native 443/8443 TLS Bridge gate run korte hobe.
Native-ingress helper ar Local by Flywheel socket arrangement ei model fix-e replace
kora hoyni. Pre-deployment live Bridge TLS, client DNS ar scoped ingress check pass.

Future provider protocol, account entitlement ba upstream rate-limit change local
overlay diye guarantee kora jay na. Next update-er pore real model response ar effort
mapping verify korte hobe; ei workflow update-er age compatibility conflict dhore.

## Evidence locations

Source repo:
`~/Developer/OmniRoute`.

Isolated source worktree:
`~/Developer/OmniRoute/.claude/worktrees/gpt-6-1-sol-support`.

Private QA evidence:
`~/Documents/Codex/2026-10-04/omniroute-gpt-6.1-sol`.

Relevant files: `validation-summary.json`, `package-build-final.log`,
`isolated-model-tests.json`, `isolated-effort-audit.json`,
`isolated-model-catalog.json`, `isolated-test-key-restored.json`,
`native-cli-output.txt`, `provider-model-settings.png` ar `package-identity.json`.
Credentials ba full private account payload ei report-e rakha hoyni.

## Baki production checks

1. Current native model response-gulo shesh kore idle window create kora.
2. `promote-verified-runtime.mjs` diye existing verified prefix promote kora; source/package identity guard ar rollback preserve kora.
3. `check-production-model.mjs` diye temporary Version/User-Agent clear, discovery refresh, base/max/ultra SSE, existing-model regression ar native CLI verify kora.
4. Production call-log-e max ar alias effort audit, native 443/8443 TLS ar dashboard screenshot verify kora.
5. Existing image experiment API key permissions unchanged ache kina confirm kora.

Ei remaining steps complete howar age ei report-ke production deployment completion receipt dhora jabe na.
