> **ঐতিহাসিক নথি — public copy, ২০২৬-১০-১৭।** মূল ঘটনার তারিখ ও ফল এই নথির নিজস্ব সময়ের জন্য প্রযোজ্য; পরের সংযোজন থাকতে পারে। বর্তমান অবস্থা ও কাজের নিয়মের জন্য [বর্তমান handoff](../CURRENT-STATUS-2026-10-17.md) পড়ুন। Private reference ও identifier সরানো হয়েছে; স্থানীয় evidence এখানে অন্তর্ভুক্ত নেই। পুরোনো cleanup, build, deploy বা service command বর্তমান অনুমতি হিসেবে ব্যবহার করবেন না।

# OmniRoute diye Antigravity / agy image generation: live research ar experiment

**Author:** Jillur Rahman<br>
**Research date:** 2026-10-03, Asia/Dhaka<br>
**Local runtime:** OmniRoute 3.8.51<br>
**Scope:** Connected Google accounts diye OmniRoute client API key use kore image generation; actual files, requests, failures ar supported options verify kora.

## 1. Main result

**Hae, ei local setup-e OmniRoute API key diye `antigravity/gemini-3.1-flash-image` use kore actual image generate kora gechhe.** 1K ar 2K square image, English poster ar Bangla poster successful. Client request-e Google API key ba OAuth token dite hoyni; OmniRoute nijer connected account-er credential diye upstream request korechhe.

**Kintu exact `agy/gemini-3.1-flash-image` ID current image endpoint-e kaj koreni.** Dashboard-e ID-ti visible, kintu `POST /v1/images/generations` local routing stage-e `400 Invalid image model` diyechhe. Model permission temporary allow-list-e chhilo, tai ei failure experiment key-er model permission rejection chhilo na.

4K request-e image paowa jayni: 62.08 second por local response-start timeout theke `502`. `0.5K` request adapter 1K-e clamp korechhe. Successful shob original image JPEG; PNG request-er format guarantee nei. Ei differences practical use-er jonno significant.

Test scope-e **8-ti generation POST** kora hoyechhe: **6-ti HTTP 200 with image**, **1-ti local invalid-model 400**, **1-ti timeout 502**. Er baire restoration-er por 1-ti model-permission rejection control, 2-ti authentication control ar 3-ti catalog read ache. Ei chhoto, mixed test matrix production success-rate benchmark noy.

Shob successful sample-er comparison preview (স্থানীয় image; প্রকাশিত নয়)

Comparison preview-te images scale kora hoyechhe. Original file-er resolution, bytes ar provenance alada bhabe preserve kora ache.

## 2. Nano Banana-r sathe model-er relation

Google-er current model page-e **Nano Banana 2 = `gemini-3.1-flash-image`**, stable ID. Page-ti 2026-09-03 UTC updated bole dekhachchhe. Public model-er 1K default, 0.5K, 2K ar 4K output, thinking ar search-grounding support mention kora ache. Eita vendor documentation; local adapter-e protiti feature exposed ache, emon evidence noy. [Google model documentation](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-image).

Original Nano Banana (`gemini-2.5-flash-image`) ar Nano Banana Pro (`gemini-3-pro-image`) alada model. Ei experiment user-er specified 3.1 Flash Image niye. Original ar Pro-r quality comparison kora hoyni. [Google image-generation guide](https://ai.google.dev/gemini-api/docs/image-generation).

Google-er 2026-02-26 launch article Nano Banana 2-r availability-r moddhe Google Antigravity-o list kore. Eita Antigravity product-e model availability-r primary-source support; OmniRoute-er internal HTTP format-er public API contract noy. [Google launch announcement](https://blog.google/innovation-and-ai/technology/ai/nano-banana-2/).

Current Google documentation-e stable ID ache. OmniRoute-er purono `gemini-3.1-flash-image-preview` alias-o test kora hoyechhe; etake alada image engine hishebe treat kora thik hobe na.

## 3. Duita dashboard ar account pool

| Dashboard | Display name | Image ID visible | Active rows | Disabled rows |
| --- | --- | --- | ---: | ---: |
| [agy](http://omni.local/dashboard/providers/agy) | Antigravity CLI | `agy/gemini-3.1-flash-image` | 6 | 1 |
| [antigravity](http://omni.local/dashboard/providers/antigravity) | Antigravity | `antigravity/gemini-3.1-flash-image` | 6 | 1 |

Browser-e model IDs dekhano ar actual image API-te dispatch kora duita alada gate. Provider page-er chat/playground catalog-er ID image endpoint-e automatically valid hoy na.

Read-only database comparison-e active `agy` ar `antigravity` pool-er **6-ti account identity shobgulo shared**. Orthaat 12-ti active connection row thakleo ei setup-e 6-ti distinct active Google account identity. Raw email report ba evidence-e export kora hoyni.

Credential lookup source `antigravity` ar `agy` row-ke search pool-e ekshathe rakhe. Tai canonical Antigravity routing-er account lookup-e CLI-profile connection-o candidate hote pare. Kintu ei run-e proti account-ke alada kore force/isolate kora hoyni. Generated-image call log-e `connection_id` null, tai kon specific row request serve korechhe seta report claim korchhe na.

Evidence: browser ar source findings (স্থানীয় বা private reference; প্রকাশিত নয়), safe account inventory (স্থানীয় বা private reference; প্রকাশিত নয়), shared-identity counts (স্থানীয় বা private reference; প্রকাশিত নয়).

## 4. Client API key ar test setup

Existing experiment key-er name: **`codex-imagegen-experiment-2026-10-03`**. Eki key temporary scope diye use kora hoyechhe; notun credential create kora hoyni.

| Property | Test-er shomoy | Test shesh-e |
| --- | --- | --- |
| Model policy | Existing 3 Codex image ID + canonical Antigravity ID + agy ID + Antigravity preview alias | Original 3 Codex image ID |
| Endpoint policy | `images` | `images` |
| Management scope | Off; `self:usage` | Same |
| Compression | Off | Same |
| Auto combos | Off | Same |
| Connection metadata allow-list | Original Codex row + 12 active Google rows | Original Codex row |
| Original/current policy comparison | Snapshot saved | Selected policy fields exactly equal |

Generation request-er Authorization header-e shudhu OmniRoute client key chhilo. Google access/refresh token client-ke dewa hoyni. Policy configure/restore korte local supported management CLI helper use kora hoyechhe; shei management credential image-generation request-e use kora hoyni.

Model ar endpoint policy actual controls diye verify kora ache. Connection metadata allow-list save kora mane image execution-e individual account isolation verified, emon claim nei. Source generation route credential selector-e ei parameter `null` pass kore; runtime account-isolation enforcement alada verification-er gap.

Evidence: original policy (স্থানীয় বা private reference; প্রকাশিত নয়), temporary policy (স্থানীয় বা private reference; প্রকাশিত নয়), restored policy (স্থানীয় বা private reference; প্রকাশিত নয়), preservation checks (স্থানীয় বা private reference; প্রকাশিত নয়).

**Ekhon existing experiment key abar Codex-only.** Ei key diye Google model request korle `403` hobe, ar eta expected restored permission. Regular Google image use-er jonno API Manager-e dedicated image key-te `antigravity/gemini-3.1-flash-image` model permission ar `images` endpoint select korte hobe. Connected Google OAuth account backend-e available thakte hobe.

## 5. Full live generation matrix

| Case | Requested model | image_size | HTTP | Seconds | Actual output | Evidence |
| --- | --- | --- | ---: | ---: | --- | --- |
| mug-1k | `antigravity/gemini-3.1-flash-image` | `1K` | 200 | 13.42 | 1024×1024 JPEG | JSON (স্থানীয় বা private reference; প্রকাশিত নয়) |
| agy mug-1k | `agy/gemini-3.1-flash-image` | `1K` | 400 | 0.04 | No image | JSON (স্থানীয় বা private reference; প্রকাশিত নয়) |
| mug-2k | `antigravity/gemini-3.1-flash-image` | `2K` | 200 | 19.98 | 2048×2048 JPEG | JSON (স্থানীয় বা private reference; প্রকাশিত নয়) |
| mug-4k | `antigravity/gemini-3.1-flash-image` | `4K` | 502 | 62.08 | No image | JSON (স্থানীয় বা private reference; প্রকাশিত নয়) |
| poster-1k | `antigravity/gemini-3.1-flash-image` | `1K` | 200 | 20.68 | 1376×768 JPEG | JSON (স্থানীয় বা private reference; প্রকাশিত নয়) |
| preview-alias-1k | `antigravity/gemini-3.1-flash-image-preview` | `1K` | 200 | 13.21 | 1024×1024 JPEG | JSON (স্থানীয় বা private reference; প্রকাশিত নয়) |
| bangla-poster-1k | `antigravity/gemini-3.1-flash-image` | `1K` | 200 | 11.79 | 1376×768 JPEG | JSON (স্থানীয় বা private reference; প্রকাশিত নয়) |
| half-k-control | `antigravity/gemini-3.1-flash-image` | `0.5K` | 200 | 14.16 | 1024×1024 JPEG | JSON (স্থানীয় বা private reference; প্রকাশিত নয়) |

Elapsed time client HTTP request start theke complete response porjonto. File dimensions actual decoded image theke, requested `size` string theke noy. Successful response-er base64 bytes decode kore original file save kora hoyechhe; image resize ba transcode kora hoyni.

## 6. Example A: product photograph, canonical 1K

Requested model: `antigravity/gemini-3.1-flash-image`. Exact same mug baseline prompt previous Codex experiment theke reuse kora hoyechhe.

```json
{
  "model": "antigravity/gemini-3.1-flash-image",
  "prompt": "One unbranded red ceramic coffee mug on a plain wooden table, natural window light. Exactly one mug, no people, no text or branding.",
  "n": 1,
  "size": "1024x1024",
  "aspect_ratio": "1:1",
  "image_size": "1K",
  "quality": "high",
  "response_format": "b64_json"
}
```

Ei code block concise request example. Actual tested full prompt prompt-mug.txt (স্থানীয় বা private reference; প্রকাশিত নয়)-e, ar exact wire body request/result evidence (স্থানীয় বা private reference; প্রকাশিত নয়)-e ache.

Result: HTTP 200, **13.42 second**, **1024×1024 JPEG**, 655,419 bytes. One red mug, ordinary handle, upright rim, natural light ar tabletop contact dekha jay. Rear background-e defocused furniture-r shape ache; strict `no extra objects` condition-ke 100% pass bola jabe na. Prompt-e PNG bola chhilo, kintu actual JPEG eshechhe.

Canonical 1K mug original (স্থানীয় image; প্রকাশিত নয়)

## 7. Example B: verified 2K output

`image_size: "2K"` diye **2048×2048 JPEG**, **19.98 second**, 2,682,951 bytes paowa gechhe. `size: "1024x1024"` same thaka shotteo `image_size` resolution axis 2K apply hoyechhe.

Resolution tests-er full prompt prompt-mug-resolution.txt (স্থানীয় বা private reference; প্রকাশিত নয়)-e. Ekhane contradictory `1024x1024 PNG` prompt instruction-er bodole API resolution follow korte bola hoyechhe.

Glaze, mug geometry ar wood texture readable. 1K ar 2K duita fresh generation; composition ar lighting alada. Eita same-seed upscale test noy, tai resolution barar sathe artistic quality uniformly improve hoy, emon conclusion dewa hoyni.

Canonical 2K mug original (স্থানীয় image; প্রকাশিত নয়)

Evidence: 2K request/result (স্থানীয় বা private reference; প্রকাশিত নয়).

## 8. Example C: English typography ar layout

Prompt-e exactly `BUILD BETTER`, three cards-er `PLAN`, `CODE`, `VERIFY`, ar `NexaLance | 2026` footer dewa hoyechhilo. Actual output-e shob text visually shothik, corresponding icons ar three-card layout ache.

Result: **1376×768 JPEG**, **20.68 second**. Request-e `size: "1536x864"`, `aspect_ratio: "16:9"`, `image_size: "1K"` chhilo. Actual output exact 1536×864 noy. Output ratio 1.7917; requested 16:9 ratio 1.7778. Native resolution bucket-er rounding difference prai 0.78%.

Image-ti flat vector style-er **raster JPEG**. Editable SVG, text layer ba vector file generate hoyni.

English text poster original (স্থানীয় image; প্রকাশিত নয়)

Evidence: full poster prompt (স্থানীয় বা private reference; প্রকাশিত নয়), poster request/result (স্থানীয় বা private reference; প্রকাশিত নয়).

## 9. Example D: Bangla text rendering

Supplied title chhilo **ভাবনা থেকে নির্মাণ**, three labels **পরিকল্পনা**, **কোড**, **পরীক্ষা**, ar footer **NexaLance**. Direct visual reading-e ei strings shothik dekha gechhe. Card layout ar icons-o requested structure follow korechhe.

Result: **1376×768 JPEG**, **11.79 second**. Eita ekta successful Bangla sample; shob Bengali conjunct, word, font, poster density ba future generation-er typography guarantee noy. Font embedding ar editable text return hoyni.

Bangla text poster original (স্থানীয় image; প্রকাশিত নয়)

Evidence: Bangla prompt (স্থানীয় বা private reference; প্রকাশিত নয়), Bangla request/result (স্থানীয় বা private reference; প্রকাশিত নয়), visual review (স্থানীয় বা private reference; প্রকাশিত নয়).

## 10. agy failure ar working preview alias

Exact `agy/gemini-3.1-flash-image` request-er response:

```json
{
  "error": {
    "message": "Invalid image model: agy/gemini-3.1-flash-image. Use format: provider/model",
    "type": "invalid_request_error",
    "code": "bad_request"
  }
}
```

HTTP 400, 0.04 second, no image. Key-te model allowed chhilo. Provider page-e ID visible thaka shotteo image registry-r `antigravity` config-e `alias: "agy"` nei. `parseImageModel()` image-specific registry use kore, general chat alias resolver use kore na. Source finding ar live failure eki direction-e point kore.

Ei run-er practical working ID **`antigravity/gemini-3.1-flash-image`**. `agy` dashboard-er model ID-ke image endpoint-er supported alias dhore neya jabe na. Ekhane source edit kore alias enable kora hoyni.

`antigravity/gemini-3.1-flash-image-preview` request successful: HTTP 200, **13.21 second**, 1024×1024 JPEG. Registry etake canonical `gemini-3.1-flash-image`-e resolve kore. Response header original requested alias dekhay; provider call log canonical model record kore. Eita alada Nano Banana engine-er access proof noy.

Preview alias-er original output (স্থানীয় image; প্রকাশিত নয়)

Evidence: agy failure (স্থানীয় বা private reference; প্রকাশিত নয়), preview alias result (স্থানীয় বা private reference; প্রকাশিত নয়), provider call logs (স্থানীয় বা private reference; প্রকাশিত নয়).

## 11. Resolution ar parameter-er actual behavior

| Option | Current adapter behavior | Evidence level |
| --- | --- | --- |
| `image_size: "1K"` | Actual 1024×1024 square; landscape poster 1376×768 | Live output verified |
| `image_size: "2K"` | Actual 2048×2048 square | Live output verified |
| `image_size: "4K"` | Upstream envelope-e 4K apply; request timeout, no output | Requested/apply verified; delivered 4K unverified |
| `image_size: "0.5K"` | Adapter clamp kore `1K` | Live 1024×1024 output + applied-value call log |
| `aspect_ratio: "16:9"` | Upstream imageConfig-e forward hoy; output native bucket 1376×768 | Source + live output |
| `size: "1536x864"` | Exact pixel dimensions guarantee noy; aspect-ratio fallback-er jonno use hote pare | Live mismatch + source |
| `quality: "high"` | Gemini image handler upstream quality option forward kore na | Source verified; high-versus-auto quality benchmark noy |
| `response_format: "b64_json"` | Base64 output paowa gechhe | Live verified |
| Prompt-e PNG instruction | Actual JPEG eshechhe | Live verified |
| `output_format: "png"` | Ei adapter-e output-format forwarding path dekha jayni | Source only; extra live format test kora hoyni |
| `n: 1` | Candidate count 1; successful run-e one image | Live verified |
| `n > 1` | Source candidateCount forward kore | Live test kora hoyni |

0.5K control-e `image_size: "0.5K"`, `size: "512x512"` chhilo. Actual **1024×1024 JPEG**, **14.16 second**. Call log-e raw `image_size` 0.5K ar `image_size_applied` 1K, tai eita native 0.5K support proof noy.

Half-K request-er actual 1K output (স্থানীয় image; প্রকাশিত নয়)

Evidence: half-K result (স্থানীয় বা private reference; প্রকাশিত নয়), applied settings in call logs (স্থানীয় বা private reference; প্রকাশিত নয়).

## 12. 4K timeout: cause ar practical implication

4K request **62.08 second** pore HTTP 502 diyechhe:

```text
Image provider error: Direct response did not start within 30000ms — retrying on a fresh socket
```

Provider call log-er handler duration 60,008 ms; applied setting `4K`. Client elapsed time-e routing ar response overhead-o included.

Source ar installed runtime-er timeout helper hash identical. Direct external fetch-er response-start budget default 30,000 ms. Fresh-socket retry-te caller deadline signal na thakle same flat budget thake. Gemini image handler-er fetch call-e signal/deadline pass hoy na. Observed prai 60-second failure ei duita 30-second response-start window-r sathe consistent.

**Eta local timeout-er evidence. Google-er 4K unsupported, account-er quota exhausted, ba model invalid, emon response paowa jayni.** Ei run-e 4K image deliver hoyni bole 4K-ready setup bola jabe na. Slow upstream, socket/transport state, ar model processing time-r contribution alada kore measure kora hoyni.

Follow-up solution-er jonno image-generation request-e suitable bounded response-start/caller deadline support evaluate korte hobe, tarpor actual 4K image receive kore dimensions verify korte hobe. Global timeout configure korle running service-er setting apply korte hoy; probe shell-er environment bodlale current server bodlay na. Ei research run-e global service setting ba service restart kora hoyni.

Image generation non-idempotent. Timeout-er por upstream job cancel hoyechhe ba quota use hoyni, emon proof nei. Ei report automatic blind repeat-ke verified reliable method bole recommend korchhe na.

Evidence: 4K request failure (স্থানীয় বা private reference; প্রকাশিত নয়), timeout source analysis (স্থানীয় বা private reference; প্রকাশিত নয়), applied-setting call log (স্থানীয় বা private reference; প্রকাশিত নয়).

## 13. Upstream request ar feature coverage

Observed/source-confirmed path:

```text
Client with OmniRoute key
  -> http://omni.local/v1/images/generations
  -> local model/endpoint policy
  -> image registry model resolution
  -> connected Google OAuth account selection / token lifecycle
  -> https://daily-cloudcode-pa.googleapis.com/v1internal:generateContent
  -> inline image bytes
  -> OpenAI-style JSON data[].b64_json
```

Internal request-er safe structure:

```json
{
  "project": "<connected-account-project>",
  "model": "gemini-3.1-flash-image",
  "requestType": "image_gen",
  "request": {
    "contents": [{"role": "user", "parts": [{"text": "<prompt>"}]}],
    "generationConfig": {
      "candidateCount": 1,
      "imageConfig": {"aspectRatio": "1:1", "imageSize": "2K"}
    }
  }
}
```

Actual project ID, request identity ar OAuth Authorization value export kora hoyni. Eita illustrative envelope; complete signed/authenticated upstream request copy noy.

Ei path-e Codex-er moto separate GPT main model prompt rewrite kore hosted image tool call korar architecture nei. Current Gemini handler client prompt-ke text part hishebe forward kore. Response-er `revised_prompt` fallback input prompt-o hote pare; etake verified model-written revised prompt bola jabe na.

| Capability | Ei local path-e result |
| --- | --- |
| Text-to-image | Actual generation verified |
| English typography | One poster sample verified |
| Bangla typography | One poster sample verified |
| 1K / 2K | Actual pixels verified |
| 4K | Delivery unverified due to timeout |
| Image input/reference editing | Generation handler text-only envelope banay; input-image fields forward korar path nei |
| `/v1/images/edits` with Antigravity | Source-e built-in unsupported-provider response path; live edit request kora hoyni |
| Multi-turn image editing / subject consistency | Ei endpoint path-e test kora hoyni |
| Search grounding / tools | Current image envelope-e tool configuration nei; grounding test kora hoyni |
| Thinking controls | Current image envelope-e thinking config forwarding nei |
| Transparent background / SVG / editable text | Test kora hoyni; observed outputs RGB JPEG |
| Streaming / async job retrieval | Ei test non-streaming JSON response; long-job retrieval verify kora hoyni |

Google-er public image-generation guide generation ar reference-image editing cover kore. Public model capability ar ei local adapter-er exposed capability compare kore use korte hobe. [Google image-generation guide](https://ai.google.dev/gemini-api/docs/image-generation).

Image catalog-er generic `vision`, `tool_calling`, `reasoning` flags dekhe ei image route shob corresponding request options forward kore dhora jabe na. `supported_sizes` catalog-e shudhu 1024×1024, kintu live 2K successful; catalog-o complete parameter contract noy.

## 14. Returned model identity, provenance ar quota behavior

Successful response header-e provider `antigravity`, requested model ar runtime version ache. Provider call logs canonical model `antigravity/gemini-3.1-flash-image` record kore. Image handler upstream `modelVersion` ar `inlineData.mimeType` normalized response-e rakhe na.

Tai exact upstream engine build/modelVersion client response theke independent verify kora jayni. Nano Banana 2 identification-er support holo canonical request/source path, official model naming ar returned Google image artifacts.

Shob **6-ti original JPEG-e C2PA marker** ar `Google Generative AI`-related public generator strings ache. Original bytes preserve kora hoyechhe. C2PA signature/trust chain cryptographically verify kora hoyni; string presence-ke verified signature dhora hoyni. Invisible SynthID watermark-er independent detector test-o kora hoyni. Google launch article provenance-er jonno SynthID ar C2PA use-er kotha bole. [Google provenance announcement](https://blog.google/innovation-and-ai/technology/ai/nano-banana-2/).

Successful headers-er cost ar token counters zero. Handler source-o summarized zero token counts log kore. **Zero metadata mane Google subscription quota use hoyni ba generation free, emon proof noy.** Account usage/billing before-after comparison ei run-e kora hoyni.

Ei generation matrix-e upstream 429/401/403 quota/authentication failure aseni. `agy` 400 local model resolution failure; restored key-er 403 local permission control. Multi-account quota failover live provoke kora hoyni. Source image retry helper 401, explicit retryable account failure, ar Antigravity quota-exhausted 429-r jonno bounded account fallback path rakhe; ordinary 429-te automatic account rotation-er guarantee nei.

Evidence: image integrity/provenance (স্থানীয় বা private reference; প্রকাশিত নয়), public generator markers (স্থানীয় বা private reference; প্রকাশিত নয়), call logs (স্থানীয় বা private reference; প্রকাশিত নয়).

## 15. Authentication, restoration ar preservation checks

| Control | Actual result |
| --- | --- |
| Catalog GET without key | HTTP 401 Authentication required |
| Catalog GET with invalid key | HTTP 401 Invalid API key |
| Original restricted key catalog | 3 Codex image models; no Google entry |
| Temporary scope catalog | 4 image models; canonical Antigravity entry ache, agy entry nei |
| Restored scope catalog | Original 3 Codex image models |
| Restored key Google generation POST | HTTP 403 Model not allowed; no image |
| Original/restored selected policy fields | Exactly equal |
| Source working tree before/after | Clean |
| Reviewed source file hashes | Unchanged |

Catalog count 4 mane 4 distinct successful image engine noy; metadata list-er count. Management access test scope-e off chhilo. Evidence files credential values contain kore na.

Ei task-e generation ar evidence analysis run hoyechhe. Production rebuild, deployment ba service restart hoyni. Native app/account files-o modify hoyni. Prompt compression ar auto-combo settings original off obosthay ache. Existing report/archive-ke overwrite kora hoyni.

Evidence: no-key control (স্থানীয় বা private reference; প্রকাশিত নয়), invalid-key control (স্থানীয় বা private reference; প্রকাশিত নয়), catalog before (স্থানীয় বা private reference; প্রকাশিত নয়), catalog during (স্থানীয় বা private reference; প্রকাশিত নয়), catalog after (স্থানীয় বা private reference; প্রকাশিত নয়), restored rejection (স্থানীয় বা private reference; প্রকাশিত নয়), preservation (স্থানীয় বা private reference; প্রকাশিত নয়).

## 16. Practical request example

Regular use-er jonno ei request model ID use korte hobe:

```json
{
  "model": "antigravity/gemini-3.1-flash-image",
  "prompt": "Create a clean product photograph of one red ceramic mug on a wooden table. No people, text or logos.",
  "n": 1,
  "aspect_ratio": "1:1",
  "image_size": "2K",
  "response_format": "b64_json"
}
```

`quality: high`-ke additional quality boost dhore use kora uchit noy: current handler eta forward kore na. Exact pixels-er jonno `image_size` ar returned file dimensions check korte hobe. JPEG bytes-ke `.png` extension diye save kora thik noy.

Nicher example local credential file read kore, same local API-te POST kore, returned bytes-er format inspect kore. Secret print kore na; redirect block kore ar native client fallback-o nei. `key_file` authorized Google-image key-er actual protected local file-e point korte hobe.

```python
import base64
import io
import json
import urllib.request
from pathlib import Path
from PIL import Image

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        raise RuntimeError("Redirect refused")

key_file = Path("/absolute/path/to/protected/omniroute-api-key")
payload = {
    "model": "antigravity/gemini-3.1-flash-image",
    "prompt": "One red ceramic mug on a wooden table, natural window light.",
    "n": 1,
    "aspect_ratio": "1:1",
    "image_size": "2K",
    "response_format": "b64_json",
}
request = urllib.request.Request(
    "http://omni.local/v1/images/generations",
    data=json.dumps(payload).encode(),
    headers={
        "Authorization": "Bearer " + key_file.read_text().strip(),
        "Content-Type": "application/json",
    },
    method="POST",
)
opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect())
with opener.open(request, timeout=240) as response:
    data = json.load(response)
raw = base64.b64decode(data["data"][0]["b64_json"], validate=True)
with Image.open(io.BytesIO(raw)) as image:
    format_name = image.format
    dimensions = image.size
suffix = {"JPEG": ".jpg", "PNG": ".png", "WEBP": ".webp"}[format_name]
with Path("generated-image" + suffix).open("xb") as output:
    output.write(raw)
print(format_name, dimensions)
```

Exact tested client implementation: image_probe.py (স্থানীয় বা private reference; প্রকাশিত নয়). Eita bounded timeout, no proxy inheritance, no redirect, verified image decoding ar credential-redacted evidence save kore.

## 17. Identified gaps ar follow-up order

| Gap | Observed implication | Suitable next work |
| --- | --- | --- |
| agy catalog/routing mismatch | Visible ID image POST-e 400 | Image-specific alias support review + canonical/alias regression test |
| Slow-image response-start timeout | 4K request 502; no image | Bounded image timeout/deadline support + actual 4K retest |
| Half-K clamp | 512-size request actual 1K | Provider-supported resolution enum ar explicit unsupported-setting feedback review |
| Output format/mime metadata | PNG instruction actual JPEG; mime field stripped | Return/retain actual MIME; document format selection limits |
| Model-version metadata stripped | Exact engine build unavailable | Preserve upstream returned modelVersion when available |
| Image-edit parity missing | Native model editing capability image route-e exposed noy | Dedicated multimodal/edit path review, reference preservation QA |
| Connection allow-list path | Metadata scope isolation-er proof noy | Runtime generation/fallback connection-policy test before isolation claim |
| Catalog size/capability metadata | Catalog 1K-only but live 2K works; generic tool flags | Catalog ar handler-supported options align kora |
| Account usage metering | Zero cost/token metadata ambiguous | Real subscription usage measurement support review |

Ei gap-gulo research result. Ei task-e source patch, rebuild ba upstream PR kora hoyni. Verified working 1K/2K text-to-image path-ke full native Gemini feature parity, 24-hour reliability, shob-account entitlement ba production-ready 4K implementation bola jabe na.

## 18. Previous Codex experiment-er sathe relation

Previous [complete Codex image research](OMNIROUTE-IMAGE-GENERATION-COMPLETE-RESEARCH-2026-10-03.md)-e GPT main-model/hosted-image-tool selection ar returned tool identity-r experiment ache. Ei Google experiment alada adapter ar account pool test kore.

Mug baseline reuse howay sample images subjective side-by-side review-er jonno useful. Kintu different provider/account, actual pixel size, format ar stochastic generation-er jonno ei result-ke controlled quality/latency ranking bola jabe na. English/Bangla poster-er ei prompts previous Codex models-e same conditions-e run hoyni.

Ei evidence theke universal `Nano Banana better than GPT Image` ba tar ulto conclusion dewa hoyni. Practical confirmed difference holo local Antigravity path actual 2048×2048 output diyechhe, JPEG return korechhe, ar exact agy prefix accept koreni.

## 19. Evidence index ar validation

New evidence folder: antigravity-agy-image-experiment-2026-10-03 (স্থানীয় বা private reference; প্রকাশিত নয়).

- All generation/control result summary (স্থানীয় বা private reference; প্রকাশিত নয়)
- Exact test client (স্থানীয় বা private reference; প্রকাশিত নয়) ar temporary policy helper (স্থানীয় বা private reference; প্রকাশিত নয়)
- Source/runtime fingerprints (স্থানীয় বা private reference; প্রকাশিত নয়)
- Source findings ar official links (স্থানীয় বা private reference; প্রকাশিত নয়)
- 7 redacted provider call logs (স্থানীয় বা private reference; প্রকাশিত নয়)
- Original-image integrity (স্থানীয় বা private reference; প্রকাশিত নয়) ar visual assessments (স্থানীয় বা private reference; প্রকাশিত নয়)
- Original policy restored (স্থানীয় বা private reference; প্রকাশিত নয়) ar source preservation (স্থানীয় বা private reference; প্রকাশিত নয়)
- File manifest / SHA-256 (স্থানীয় বা private reference; প্রকাশিত নয়)

Original images, prompts, request settings, timing, actual dimensions, HTTP errors ar model-policy controls preserve kora ache. Private API key file, OAuth credentials ar raw account emails ei archive-e include kora hoyni.

Validation-e **40 copied research payload file-er SHA-256 match**, **6-ti original image decode/dimensions check**, JSON code example parse, Python example syntax check, local file links ar original/restored policy comparison verify kora hoyechhe. Payload snapshot 5.50 MiB. Manifest nijer file ar macOS filesystem-er automatic metadata sidecar-ke payload hishebe count kore na. Contact sheet derivative; original JPEG bytes intact.

## 20. Sources ar exact local code pointers

Primary external references, accessed 2026-10-03:

1. [Google: Gemini 3.1 Flash Image model](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-image)
2. [Google: Nano Banana image-generation guide](https://ai.google.dev/gemini-api/docs/image-generation)
3. [Google: Nano Banana 2 launch / Antigravity availability / provenance](https://blog.google/innovation-and-ai/technology/ai/nano-banana-2/)

Local inspected implementation:

- Antigravity image provider registry (স্থানীয় বা private reference; প্রকাশিত নয়)
- Image-specific model parser (স্থানীয় বা private reference; প্রকাশিত নয়)
- Resolution normalization (স্থানীয় বা private reference; প্রকাশিত নয়)
- Gemini image request envelope (স্থানীয় বা private reference; প্রকাশিত নয়)
- Image response normalization (স্থানীয় বা private reference; প্রকাশিত নয়)
- Generation-route credential arguments (স্থানীয় বা private reference; প্রকাশিত নয়)
- Shared Antigravity/agy credential lookup (স্থানীয় বা private reference; প্রকাশিত নয়)
- Image account retry helper (স্থানীয় বা private reference; প্রকাশিত নয়)
- Built-in image edit unsupported path (স্থানীয় বা private reference; প্রকাশিত নয়)
- Direct response-start timeout helper (স্থানীয় বা private reference; প্রকাশিত নয়)

Source ar runtime image registry, Gemini handler, retry helper ar timeout helper-er compared copies match kore. Runtime raw Next image-route source package-e available noy; compiled route ache. `auth.ts` source/runtime hash different chhilo age thekei, ar ei task-e source files unchanged. Tai repository-r shob file deployed runtime-er sathe identical, emon claim kora hoyni.
