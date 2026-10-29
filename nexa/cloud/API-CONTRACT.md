# NexaOmni cloud API ও Vanalyzer contract

এই profile-এর machine-readable নিয়ম [api-contract.json](api-contract.json)-এ। Application base 3.8.52; upstream source pristine রেখে production fixes `nexa/patches/` ও নতুন tests `nexa/new/`-তে থাকে। Secrets, account inventory ও runtime database Git-এ থাকে না।

## Gemini video input ও output

`POST /v1/antigravity`-তে explicit `stream: false` বা `true`, নির্দিষ্ট `agy/gemini-3.8-flash-low` model এবং Cloud Code `request` envelope দিন। YouTube link media part-এ যাবে:

```json
{
  "model": "agy/gemini-3.8-flash-low",
  "stream": false,
  "request": {
    "contents": [{"role": "user", "parts": [
      {"fileData": {"fileUri": "https://www.youtube.com/watch?v=wFbgrPmVXb0", "mimeType": "video/mp4"}, "videoMetadata": {"startOffset": "40s", "endOffset": "50s"}},
      {"text": "Describe the visible person and setting in this clip."}
    ]}],
    "generationConfig": {"maxOutputTokens": 1024, "thinkingConfig": {"thinkingBudget": 0}}
  }
}
```

JSON ফলের `response.candidates[].content.parts` পড়ুন। Streaming-এ প্রতিটি `data:` event-এ একই native envelope থাকে; `finishReason` terminal event। Native Gemini stream-এ OpenAI-এর `[DONE]` প্রত্যাশা করবেন না। `thought`, `thoughtSignature`, `functionCall`, `functionResponse` ও usage metadata নিজের format-এ সংরক্ষিত থাকে। Tool result ফেরানোর সময় আসল native model parts/signature ও call identity রাখুন।

JSON schema দরকার হলে `request.generationConfig.responseMimeType=application/json` ও `responseSchema` দিন। HTTP 200, catalog entry বা শুধু headers পাওয়া completion নয়। Nonempty expected output, matching schema/video, terminal marker ও error state পরীক্ষা করুন। Invalid/truncated ফল successful transcript হিসেবে cache করবেন না।

OpenAI Chat, Responses ও Anthropic Messages পৃথক wire protocol। YouTube URL-এর জন্য উপরোক্ত Gemini media path ব্যবহার করুন; `image_url` বা prompt-এর text URL-কে video transport ধরে নেবেন না। অন্য provider-এর hosted feature বা inaccessible media-এর সমান support এই contract দাবি করে না।

## যাচাই ও update gate

Applied isolated application-এ synthetic protocol tests:

```sh
bash nexa/cloud/test-contracts.sh /path/to/isolated-application
```

এটি production build gate-এর অংশ। UTF-8/fragmented native SSE, শেষ event-এর newline, usage-only event, function calls ও signatures, legacy buffered response classification, native media/schema preservation এবং পুরোনো translator regressions পরীক্ষা করে।

Candidate অথবা live deployment-এ বাস্তব acceptance:

```sh
python3 nexa/cloud/verify-api.py \
  --credentials /private/credentials.env \
  --output /private/new-acceptance.json \
  --providers gemini,claude,codex --media --tools
```

Output নতুন file হতে হবে; credentials mode 0600। এই test ছোট বাস্তব inference চালায়। Gemini native ও OpenAI JSON/SSE, selected Claude Messages/Codex Responses, video clip/schema, native tool round trip এবং authentication/error gates যাচাই করে। Default profile শুধু Gemini; অন্য provider আলাদাভাবে নির্বাচন করুন। Report-এ response bodies বা key রাখা হয় না। এটি word accuracy benchmark নয়।

Public HTTPS origin ও private loopback candidate গ্রহণ করা হয়; credential-bearing redirect অনুসরণ করা হয় না। Candidate-এ rotating Claude/Codex credentials share করবেন না। Cloud promotion-এর আগে cloned configuration দিয়ে Gemini acceptance করুন; live promotion-এর পরে অন্য configured provider ও Vanalyzer-এর fresh Plan B call পরীক্ষা করুন।

## Vanalyzer configuration

[vanalyzer.env.example](vanalyzer.env.example)-এর প্রয়োজনীয় settings protected main/context environment-এ merge করুন। Actual key ও পুরোনো configuration example file দিয়ে replace করবেন না। মূল captions আগে নেওয়া হয়; Plan B নতুন generated transcript। Source/provenance ও model-estimated timing আলাদা থাকবে। Download ব্যর্থ হলে browser profile retry এবং তারপর semantic fallback চলে। Semantic ফল actual video বা frame file তৈরি করে না।

প্রতি-caption client-এ 2 concurrent Plan B request; context worker-এর single-job limit আলাদা। Source video 24-hour retention ও generated transcript cache Vanalyzer পরিচালনা করে; gateway update দিয়ে এই policy বদলানো হয় না।
