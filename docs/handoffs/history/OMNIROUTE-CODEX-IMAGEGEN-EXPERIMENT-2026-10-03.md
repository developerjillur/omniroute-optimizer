> **ঐতিহাসিক নথি — public copy, ২০২৬-১০-১৭।** মূল ঘটনার তারিখ ও ফল এই নথির নিজস্ব সময়ের জন্য প্রযোজ্য; পরের সংযোজন থাকতে পারে। বর্তমান অবস্থা ও কাজের নিয়মের জন্য [বর্তমান handoff](../CURRENT-STATUS-2026-10-17.md) পড়ুন। Private reference ও identifier সরানো হয়েছে; স্থানীয় evidence এখানে অন্তর্ভুক্ত নেই। পুরোনো cleanup, build, deploy বা service command বর্তমান অনুমতি হিসেবে ব্যবহার করবেন না।

# OmniRoute API key diye Codex image generation: verified experiment

Author: Jillur Rahman

Date: 2026-10-03, Asia/Dhaka. Live generation records: 09:12-09:15.

## 1. Result

Hae, client-er sudhu OmniRoute API key diye local OmniRoute-e connected Codex account use kore image generate kora gechhe. Browser diye notun key create kora hoyeche. Current catalog-er tin-ti Codex image model-er protita diye ekta image, tarpor existing `codex-imagegen` skill-er API mode diye aro ekta image hoyeche. Mot 4-ti real generation, 4-ti HTTP 200, 4-ti valid PNG.

Ei result current local setup-er actual request evidence. Client kono OpenAI platform API key, local Codex login file ba local Codex CLI use koreni. OmniRoute server tar age theke connected Codex OAuth account use koreche. Server-e oi connection active thaka ebong provider-er image entitlement/quota thaka proyojon.

## 2. Live environment

| Item | Verified value |
|---|---|
| Dashboard | `http://omni.local/dashboard/api-manager` |
| Connected provider | `http://omni.local/dashboard/providers/codex`, 1 active connection |
| Client API base | `http://omni.local/v1` |
| Generation endpoint | `POST /v1/images/generations` |
| Image catalog | `GET /v1/images/generations` |
| OmniRoute version | `3.8.51` |
| Source HEAD | `f77079418d844a618fd0429afe0a62c86fbcb795` |
| Installed runtime receipt | `f77079418` |
| Source checkout | `~/Developer/OmniRoute`, clean |

Ei experiment-e source edit, rebuild, service restart, Agent Bridge change, Claude account change ba Codex re-login hoyni. Connected provider-er existing proxy setting-o bodlano hoyni.

## 3. Notun API key

Browser-er Create API Key form diye create kora key-er name `codex-imagegen-experiment-2026-10-03`. User-er final confirmation-er por create kora hoyeche, tarpor browser-e permissions restrict kore save kora hoyeche.

| Setting | Saved value |
|---|---|
| Active | On |
| Management access | Off |
| Model access | Restricted to `codex/gpt-5.6-sol-image`, `codex/gpt-5.6-terra-image`, `codex/gpt-5.6-luna-image` |
| Connection access | Sudhu currently connected Codex account |
| Inference endpoint | Images |
| Own usage visibility | On, `self:usage` |
| Shared quota visibility / local usage command | Off |
| Prompt compression / Auto Combos | Off |
| Max active sessions / throttle delay | 0 / 0 |
| Custom key rate limits / access schedule / USD quota | Konota add kora hoyni |
| Expiry | Set kora hoyni |

Full credential report, repository, screenshot ba T7 evidence archive-e nei. Protected local credential file: `~/Documents/Codex/2026-10-03/omniroute-image-experiment/private/omniroute-api-key`; file mode `600`, containing directory mode `700`. API key dashboard-e masked ache. Key-ti currently active rekhe dewa hoyeche, jate ei local experiment-er setup reuse kora jay.

Browser-e created restricted key (স্থানীয় image; প্রকাশিত নয়)

## 4. Real generation matrix

Protita direct request-e same labeled red-mug brief, `n: 1`, `size: 1024x1024`, `quality: high`, `response_format: b64_json` pathano hoyeche. Returned base64 decode kore PNG signature, actual dimensions ar SHA-256 record kora hoyeche. Protita image khule visual inspection kora hoyeche.

| Run | Requested routing model | HTTP | Elapsed | Actual PNG | Artifact |
|---|---|---|---|---|---|
| Direct Sol | `codex/gpt-5.6-sol-image` | 200 | 27.14 s | 1254x1254 | Sol PNG (স্থানীয় বা private reference; প্রকাশিত নয়) |
| Direct Terra | `codex/gpt-5.6-terra-image` | 200 | 28.58 s | 1254x1254 | Terra PNG (স্থানীয় বা private reference; প্রকাশিত নয়) |
| Direct Luna | `codex/gpt-5.6-luna-image` | 200 | 23.62 s | 1254x1254 | Luna PNG (স্থানীয় বা private reference; প্রকাশিত নয়) |
| Existing skill API mode | `codex/gpt-5.6-sol-image` | 200 | about 25.7 s | 1254x1254 | Skill PNG (স্থানীয় বা private reference; প্রকাশিত নয়) |

Direct response headers identify provider `cx`, the requested image routing ID, version `3.8.51`, unique request IDs ar `cache-hit: false`. Gateway call log-e provider `codex` ar backing model `codex/gpt-5.6-sol`, `terra`, `luna` record hoyeche. Four log rows-i notun experiment key-er ID/name-er sathe matched.

Visual inspection-e sob image-e one red mug, one handle, tabletop support ar natural-looking light ache. Sol, Terra ar skill output-e brief-er main subject thik ache. Luna output-e background chair/plant-o ache, jodio brief extra objects na dite bolechhilo. Eta API transport failure noy; visual brief-er ekta deviation. Ei chhoto sample diye model-gulor quality ranking ba native image workflow-er complete parity establish kora hoyni.

## 5. Authentication ar permission checks

| Probe | Result | Meaning |
|---|---|---|
| Image catalog, no key | 401 `Authentication required` | Keyless access diye experiment successful hoyni |
| Image catalog, deliberately invalid key | 401 `Invalid API key` | Wrong credential rejected |
| Image catalog, new key | 200, exactly 3 Codex image models | Notun key authentication ar model listing successful |
| `openai/gpt-image-2` generation, new key | 403 model permission denied | Other provider model-e access nei; no generation |
| Chat completions, same allowed image ID | 403 endpoint category `chat` denied | Key-er inference access Images-e restricted |
| General `GET /v1/models` | 200 | Read-only model catalog available; inference access-er sathe eta ek noy |

Four successful generation chara kono fallback provider diye image banano hoyni. Skill API test-e subprocess execution block kora chhilo, ar outbound image request sudhu `http://omni.local/v1/images/generations` ar selected Sol image model-e allow kora hoyechhilo.

## 6. Existing codex-imagegen skill-er sathe connection

Read skill: `~/.claude/skills/codex-imagegen/SKILL.md`; current helper: `~/.claude/skills/codex-imagegen/scripts/codex_image.py`, version `2026.09.27.1`.

Default `--engine codex` local Codex CLI ar ChatGPT login use kore. Oi default path sudhu notun OmniRoute key diye automatically replace hoy na. Existing `--engine api` path `OPENAI_BASE_URL` support kore, tai per-process configuration diye ei experiment kora gechhe:

```text
OPENAI_BASE_URL = http://omni.local/v1
OPENAI_API_KEY  = newly created OmniRoute key
--engine api
--model codex/gpt-5.6-sol-image
--quality high --api-size 1024x1024 --aspect 1:1 --n 1
--raw-prompt --no-judge --no-qa --finish none --look none
```

Ekhane variable-er name `OPENAI_API_KEY` holeo tar value OmniRoute gateway key. Alada OpenAI platform key set kora hoyni. Existing skill file ba global shell configuration edit kora hoyni; experiment launcher process-er vitore variables set koreche.

Skill output-e `engine: api`, valid PNG path ar `codex_runs: 0` ache. HTTP audit-e sudhu ekta local OmniRoute image request, HTTP 200, tarpor completed ache. Judge deliberately off chhilo jate ei API-only test-e local Codex CLI dependency na ashe. Generated image manually dekha hoyeche; skill-er automatic judge/export/repair pipeline API-only hisebe ei test-e verified noy.

Existing API engine-er fallback chain-e native OpenAI image model names ache. Current restricted key diye segulo allowed noy. Experiment launcher unexpected fallback-o block kore, tai route silently bodlayni. Normal API mode-e future failure hole oi fallback behavior alada kore configure/review korte hobe.

Reusable local test launcher: skill_api_probe.py (স্থানীয় বা private reference; প্রকাশিত নয়). Eta abar chalale aro ekta real image request hobe, provider quota use hote pare:

```bash
python3 "$HOME/Documents/Codex/2026-10-03/omniroute-image-experiment/skill_api_probe.py"
```

## 7. Model name-er meaning

OmniRoute-er `codex/gpt-5.6-*-image` IDs image-capable routing entries. Current handler Codex Responses backend-e backing GPT model-er sathe `image_generation` tool call kore, tool result theke base64 image niye OpenAI-compatible Images response dey. Sol/Terra/Luna name-gulo nijera pixel-generation engine-er exact version-er proof noy.

OpenAI-er [official image-generation tool documentation](https://developers.openai.com/api/docs/guides/tools-image-generation) mainline response model ar GPT Image tool-er alada role explain kore, ar `image_generation_call` result-e base64 image return korar format dey. Ei public API documentation connected subscription backend-er sob entitlement ba billing rule confirm kore na.

Original PNG-gulote `c2pa` ar `gpt-image` byte markers ache. Exact underlying GPT Image version response-e return hoyni; specific `gpt-image-2`, `2.5-flare` ba `2.5-sunburst` model guarantee kora jachhe na. C2PA signature cryptographically validate kora hoyni. Original bytes archive-e preserve kora hoyeche.

## 8. Findings ar limits

1. **Exact dimensions:** catalog-e `1024x1024`, `1024x1536`, `1536x1024` advertised. Tested square request-er char-ti output-i `1254x1254`. Size parameter source handler-e forward kora hoy, kintu observed output requested exact pixels mane ni. Ei experiment-e crop/resize kora hoyni. Exact delivery size lagle original preserve kore separate export/resize step proyojon, ba upstream size behavior alada test korte hobe. Other aspect ratios test kora hoyni.
2. **Usage counter:** browser-e new key-er row `0 reqs` dekhay; four HTTP-200 image calls key-attributed call log-e ache. Page-er request count usage analytics theke, last-used call logs theke ashe. Tai image workflow-e analytics ar call-log evidence ek noy. Current image logger connection ID-o return/log row-e fill koreni; saved key permission ekta connection-e bounded, ar provider log matched.
3. **Cost/quota:** direct response-e OmniRoute cost metadata `0`, tokens `0`, skill usage `null`. Eta invoice, unlimited usage ba zero subscription-quota consumption-er proof noy. Existing server OAuth account ar provider entitlement/quota applicable thake; key limit remove kore provider limit remove hoy na.
4. **Old guide:** `~/Developer/OmniRoute/nexa/docs/CODEX-IMAGE-GENERATION.md` July 21-er remote-server verification ar `gpt-5.5` instruction niye lekha. Current local live catalog ar successful tests-er model set alada. Oi purono guide-er supported/unsupported model statements local October result-er jaygay use kora uchit noy.
5. **Coverage:** text-to-image, one image per request, high quality, one connected Codex account, sequential requests verified. Image edit, mask, transparent background, batch/parallel generation, all chat/effort models, exact output engine selection, quota exhaustion/failover ar future update compatibility ei experiment-e test kora hoyni.

## 9. Evidence ar handoff

New evidence folder: image-api-experiment-2026-10-03 (স্থানীয় বা private reference; প্রকাশিত নয়). 22-ti artifact copy kore SHA-256 verify kora hoyeche; `file-manifest.json` hashes record kore. Existing T7 file replace/delete kora hoyni.

Main evidence:

- Catalog (স্থানীয় বা private reference; প্রকাশিত নয়)
- Sol request/result (স্থানীয় বা private reference; প্রকাশিত নয়), Terra request/result (স্থানীয় বা private reference; প্রকাশিত নয়), Luna request/result (স্থানীয় বা private reference; প্রকাশিত নয়)
- Skill HTTP audit (স্থানীয় বা private reference; প্রকাশিত নয়) ar skill output metadata (স্থানীয় বা private reference; প্রকাশিত নয়)
- Key permissions, credential value excluded (স্থানীয় বা private reference; প্রকাশিত নয়)
- Gateway call logs, payloads/credentials excluded (স্থানীয় বা private reference; প্রকাশিত নয়)

Consolidated handoff-e ei experiment-er result ar report link append kora hoyeche. Local-only experiment complete; kono public PR, issue ba contribution action kora hoyni.


## 10. GPT-5.5, GPT-5.6 ar explicit image-model experiment, 2026-10-03

**Ei second round-e 12-ti requested model combination ar 1-ti invalid-model control diye real generation kora hoyeche. Sob request successful PNG return koreche. Kintu 13-ti completed response-i image tool-er model `gpt-image-2-codex` boleche. Ei connected Codex route diye GPT Image 2.5 Sunburst ba Flare select kora verified hoyni.**

Sections 1-9 prothom Images endpoint experiment-er record; segulo preserve kora hoyeche. Ei section-er Responses endpoint evidence model identity somporke notun information dey. `gpt-image-2-codex` holo provider-reported tool identity. Exact training checkpoint ba tar public API snapshot-er equivalence independently verify kora hoyni.

Client authentication-e ager newly-created OmniRoute experiment key-i use hoyeche. Client OpenAI platform key, local Codex OAuth file ba native Codex CLI use koreni. Server tar existing connected Codex OAuth connection use koreche.

## 11. Method, permission ar route

Char-ti main/backing model: `codex/gpt-5.5`, `codex/gpt-5.6-sol`, `codex/gpt-5.6-terra`, `codex/gpt-5.6-luna`. Protitar sathe tin-ti requested image tool model: `gpt-image-2`, `gpt-image-2.5-sunburst`, `gpt-image-2.5-flare`. Same original red-mug product-photo brief, ek image per request, sequential execution, no client retry ba fallback.

`POST http://omni.local/v1/responses`-e request-er relevant fields:

```json
{
  "model": "codex/gpt-5.5",
  "tools": [{
    "type": "image_generation",
    "model": "gpt-image-2.5-sunburst",
    "output_format": "png",
    "size": "1024x1024",
    "quality": "high"
  }],
  "tool_choice": {"type": "image_generation"},
  "reasoning": {"effort": "high"},
  "stream": true,
  "store": false
}
```

Full request-er `input`, instructions ar completed response protita case JSON-e ache; base64 payload report/evidence JSON theke bad dewa, original PNG alada save kora. Success-er jonno HTTP 200-er sathe terminal `response.completed`, valid PNG ar exactly one unique generated image require kora hoyeche. Sudhu stream shuru howa-ke generation success dhora hoyni.

Current Images handler Codex-er image-generation tool call banay, kintu explicit nested image-model selector forward kore na. Responses route diye selector pathano hoyeche, jate direct Images handler-er oi limitation ei test-ke mask na kore.

Test-er jonno same key-te samoyik bhabe char-ti backing model ar endpoint category `chat` add kora hoyechhilo. Existing single allowed Codex connection, management scopes, compression-off ar auto-combos-off preserve kora hoyeche. Test shesh-e original three-model image-only policy restore kore original metadata-r sathe equality verify kora hoyeche. Final GET image catalog HTTP 200, exactly three original entries; final POST Responses HTTP 403, `Endpoint category "chat" is not allowed for this API key`. Eta intentional restored restriction, generation regression noy. Responses experiment repeat korar age scoped permission samoyik bhabe add korte hobe.

## 12. Complete live matrix

**Sob row-e HTTP 200, completed stream, requested backing model-er sathe returned main model match, one PNG, actual size `1254x1254`, returned image tool `gpt-image-2-codex`.** Table-er image model column request-er name, generated engine-er identity noy. Requested image quality sob row-e `high` chhilo.

| Returned main model | Requested image tool | Elapsed seconds | Output quality metadata | Evidence case |
|---|---|---:|---|---|
| `gpt-5.5` | `gpt-image-2` | 29.50 | medium | `m55-image2.json` |
| `gpt-5.5` | `gpt-image-2.5-sunburst` | 25.11 | low | `m55-sunburst.json` |
| `gpt-5.5` | `gpt-image-2.5-flare` | 28.19 | low | `m55-flare.json` |
| `gpt-5.6-sol` | `gpt-image-2` | 25.92 | low | `sol-image2.json` |
| `gpt-5.6-sol` | `gpt-image-2.5-sunburst` | 32.36 | medium | `sol-sunburst.json` |
| `gpt-5.6-sol` | `gpt-image-2.5-flare` | 37.76 | low | `sol-flare.json` |
| `gpt-5.6-terra` | `gpt-image-2` | 30.23 | medium | `terra-image2.json` |
| `gpt-5.6-terra` | `gpt-image-2.5-sunburst` | 28.14 | medium | `terra-sunburst.json` |
| `gpt-5.6-terra` | `gpt-image-2.5-flare` | 26.35 | low | `terra-flare.json` |
| `gpt-5.6-luna` | `gpt-image-2` | 29.18 | medium | `luna-image2.json` |
| `gpt-5.6-luna` | `gpt-image-2.5-sunburst` | 28.67 | low | `luna-sunburst.json` |
| `gpt-5.6-luna` | `gpt-image-2.5-flare` | 30.21 | medium | `luna-flare.json` |

Measured range 25.11-37.76 seconds. Eta local request-to-completed-image time, ei brief ar ei account-er ek sample per combination. Ei latency diye actual Sunburst vs Flare speed ranking kora jabe na, karon returned image engine change hoyni.

## 13. Model selection ar quality controls-er important finding

Invalid control-e `tools[0].model = gpt-image-invalid-selection-control` pathano hoy. Expected strict-selection behavior hoto rejection. Observed: HTTP 200, completed generation, 26.60 seconds, `1254x1254` PNG, returned tool `gpt-image-2-codex`, output quality `low`. Tai successful response ba request-e 2.5 name thaka-ke oi model use howar proof dhora uchit noy.

Completed response-er normalized tool configuration sob matrix row-e:

```json
{
  "type": "image_generation",
  "model": "gpt-image-2-codex",
  "quality": "auto",
  "size": "auto",
  "n": 1,
  "output_format": "png"
}
```

12-ti actual output-e 6-ti `low`, 6-ti `medium`, 0-ti `high`; requested exact 1024x1024 size honor hoyeche 0-ti case-e. Square aspect ratio ar PNG format match koreche. `reasoning.effort = high` main model-er response-e preserved ache; main-model reasoning effort ar image-rendering quality duita alada control.

Gateway call logs-e requested client tools ar model recorded ache. Matching source executor-ke dummy paid-plan metadata diye isolated transform check-e nested tool `model`, `quality`, `size` preserve korte dekha hoyeche, native ar non-native duita mode-e. Ei check kono provider network request koreni. Installed runtime receipt ar clean source HEAD duita-i `f77079418` build-er sathe match.

Ei evidence bole tested Codex path-e requested image selector/quality/size end-to-end honor hoyni. Kon exact gateway middleware ba upstream backend layer configuration normalize koreche, raw upstream wire capture chara definitive attribution kora hoyni. Public OpenAI API-r tool behavior-ke ei ChatGPT subscription backend-er equivalent bole dhora hoyni.

Original 13 PNG-r sobgulote `c2pa` ar generic `gpt-image` markers ache. `gpt-image-2.5` ba `gpt-image-2-codex` byte marker nei. Marker-er absence diye engine version decide kora hoyni; provider response-er tool metadata stronger evidence. C2PA signatures cryptographically verify kora hoyni, original image bytes ar hashes preserve kora hoyeche.

## 14. Image quality ar instruction adherence

12-ti original image manually inspect kora hoyeche. Rubric: exactly one red mug, one ordinary handle, open upright rim, stable base touching table, natural window light/shadow, ceramic/wood detail, no people/hands/text/logo, no extra objects, requested output dimensions.

Sob image-e one red ceramic mug, one handle, supported base, readable material texture ar plausible window lighting dekha geche. Kono visible person, hand ba logo/text nei. Ceramic highlights ar wood grain clear. Eta ei simple product-photo brief-e useful visual output, kintu all-purpose professional quality benchmark noy.

| Backing model | Ei three samples-er visual result | No-extra-objects adherence |
|---|---|---|
| `gpt-5.5` | Clear glossy mug, plausible geometry; background-e plant/chair add hoyeche | 0/3 fully clean backgrounds |
| `gpt-5.6-sol` | Three samples-e cleaner neutral background, clear rim/handle, natural wood/light | 3/3 fully clean backgrounds |
| `gpt-5.6-terra` | Image2 ar Flare-labelled request-e clean background; Sunburst-labelled request-e plant | 2/3 fully clean backgrounds |
| `gpt-5.6-luna` | Clear mug/material detail, kintu background-e plant/chair; ek sample-e wall frame-o | 0/3 fully clean backgrounds |

Sol ei single brief-er samples-e instruction adherence-e clean result diyeche. Eta Sol sob image task-e best, ba Luna sob task-e worse, emon conclusion noy. All images same reported pixel-generation engine use koreche; main model-er prompt rewriting ar generation randomness-o result-e contribution korte pare. Numeric aesthetic score ba universal quality ranking banano hoyni.

**Important quality boundary:** attractive image thaka ar requested `high` quality parameter honor howa ek jinis noy. Current Codex route-e `high`, exact resolution ba specific 2.5 engine enforced ache, seta bola jabe na. Prompt-er constraints-o output review chara guaranteed noy. Ei experiment transparent backgrounds, exact typography, image edit/mask, subject-preserving multi-turn editing ba 4K delivery validate koreni.

Comparison-er column labels requested model names; sob actual returned tool `gpt-image-2-codex` bole clearly labelled:

- 12-image comparison sheet (স্থানীয় বা private reference; প্রকাশিত নয়)
- Responsive comparison, original PNG open korar links (স্থানীয় বা private reference; প্রকাশিত নয়)
- Complete machine-readable matrix (স্থানীয় বা private reference; প্রকাশিত নয়)

## 15. Official GPT Image 2.5 Sunburst vs Flare

Nicher difference official documentation-er description, current local matrix-er measured 2.5 result noy.

| Item | GPT Image 2.5 Sunburst | GPT Image 2.5 Flare |
|---|---|---|
| API model ID | `gpt-image-2.5-sunburst` | `gpt-image-2.5-flare` |
| Model positioning | Base model; demanding quality/precision | Small model; speed ar everyday generation |
| Relevant workflow | Detailed creative work, controlled edits, polished product/campaign imagery | Frequent generation, iteration, drafts ar everyday assets |
| Input/output | Text/image input, image output | Text/image input, image output |
| Quality options | low, medium, high, xhigh, max, auto | low, medium, high, xhigh, max, auto |

OpenAI-er [image prompting guide](https://developers.openai.com/api/docs/guides/image-prompting) Sunburst-ke quality-oriented ar Flare-ke speed-oriented bole; both editing ar subject preservation improve korar jonno positioned. Model pages explicit selection ar quality settings describe kore: [Sunburst](https://developers.openai.com/api/docs/models/gpt-image-2.5-sunburst), [Flare](https://developers.openai.com/api/docs/models/gpt-image-2.5-flare).

[Official launch announcement](https://openai.com/index/introducing-chatgpt-images-2-5/) ChatGPT, ChatGPT Work ar Codex-e Images 2.5 availability bole, ar Flare-er latency improvement advertise kore. Eta apnar connected subscription route explicit Sunburst/Flare selector expose korchhe, tar proof noy. Prompting guide Flare-er quality-ke GPT Image 2-er comparable bole, launch page higher quality bole; tai workload-specific actual validation chara universal quality/speed promise dewa hoyni.

Maximum setting mane protita prompt-e automatically best output noy. Apnar quality-first use case-e actual accessible Sunburst diye requirements pass korano, tarpor same inputs-e Flare compare kora reasonable evaluation order. Current experiment-e oi true two-engine comparison kora jayni, karon server onno tool identity return koreche.

## 16. GPT Image 2.5 access korar supported method ar local boundary

Public OpenAI API-te duita documented route ache:

1. **Images API:** generation request-er top-level `model`-e `gpt-image-2.5-sunburst` ba `gpt-image-2.5-flare` select kora.
2. **Responses API:** supported mainline GPT model top-level-e, ar `tools[].model`-e specific image model. Main model conversation/tool orchestration kore; image tool pixel-generation engine select kore. [Official image-generation guide](https://developers.openai.com/api/docs/guides/image-generation), [image tool guide](https://developers.openai.com/api/docs/guides/tools-image-generation).

Ei method OpenAI platform/API credential ar relevant access/billing-er sathe documented. OmniRoute gateway key client-er credential; eta nije notun upstream provider entitlement create kore na. Public ChatGPT/Codex product-e feature available thaka ar proxy-used subscription endpoint-e exact model controls available thaka ek jinis noy.

Current local read-only connection check-e Codex active 1, OpenAI active 0, OpenRouter active 0. OmniRoute source image registry-te OpenRouter-er duita 2.5 image entry ache; native OpenAI image catalog-e currently 2.5 entries nei. Provider-prefixed parser unregistered model ID-o native handler-e pass korte pare, kintu catalog absence, credential availability ar actual upstream acceptance alada gate. Ei turn-e OpenAI/OpenRouter route-e external generation test kora hoyni.

**Local gateway key diye specifically 2.5 use korte hole** server-side-e oi exact engine actually expose kore emon provider connection, correct model routing ar key permission lagbe. Connected Codex account-er current tested path-e oi guarantee nei. Additional OpenAI/OpenRouter account/key configure ba paid-provider request ei experiment-e kora hoyni; tar compatibility ar cost alada verify korte hobe.

Existing `codex-imagegen` skill-er API mode Images endpoint use kore. OmniRoute base URL-er sathe `--model codex/gpt-5.6-sol-image` successful generation dey, prothom round-e test hoyeche. Oi top-level routing ID Sol backing model select kore; exact Sunburst/Flare engine force kore na. Skill-er default native mode-er `gpt-image-2` claim ba generic C2PA label theke 2.5 infer kora uchit noy. Skill/global settings edit kora hoyni; native skill engine ei round-e chalano hoyni.

## 17. Evidence, usage ar final state

New archive: image-model-matrix-2026-10-03 (স্থানীয় বা private reference; প্রকাশিত নয়). Eta prothom round-er evidence folder replace kore na. 12 matrix PNG + 1 control PNG, redacted request/response JSON, tool-preservation check, call logs, key-policy before/test/restored records, comparison files ar SHA-256 manifest save kora hoyeche. Credential value archive/report-e nei.

13 successful Responses calls matching experiment key ar same connected Codex account ID diye call logs-e attributed. Previous Images path-er logging gap-er biporite ei Responses rows-e connection ID ache. GPT response usage metadata available, kintu image-tool invoice/cost ba subscription quota consumption ei metadata theke conclusively calculate kora hoyni. Console/response cost 0 ba generic token count-ke free/unlimited image generation bola hoyni.

Final key ager three-model image-only policy-te active; management off, compression off, auto combos off, same connection restriction. Source/runtime change, rebuild, service restart, native app/account configuration change ba public contribution action ei experiment-e kora hoyni. Original report/handoff-er existing byte prefixes preserve kore new findings append kora hoyeche.

Ei round-er confirmed outcome: GPT-5.5 ar GPT-5.6 Sol/Terra/Luna diye same OmniRoute key-e images generate kora jay; returned image tool `gpt-image-2-codex`. Requested Sunburst/Flare selection ar requested high-quality/exact-size controls honor howa verify hoyni. True GPT Image 2.5 quality/editing/speed comparison ekhono unverified; ei default-engine samples-ke 2.5 benchmark bole use kora jabe na.
