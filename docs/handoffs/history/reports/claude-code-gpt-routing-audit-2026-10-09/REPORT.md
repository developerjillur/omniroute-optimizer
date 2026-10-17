> **ঐতিহাসিক নথি — public copy, ২০২৬-১০-১৭।** মূল ঘটনার তারিখ ও ফল এই নথির নিজস্ব সময়ের জন্য প্রযোজ্য; পরের সংযোজন থাকতে পারে। বর্তমান অবস্থা ও কাজের নিয়মের জন্য [বর্তমান handoff](../../../CURRENT-STATUS-2026-10-17.md) পড়ুন। Private reference ও identifier সরানো হয়েছে; স্থানীয় evidence এখানে অন্তর্ভুক্ত নেই। পুরোনো cleanup, build, deploy বা service command বর্তমান অনুমতি হিসেবে ব্যবহার করবেন না।

# Claude Code → OmniRoute target routing audit — 2026-10-09

নাম: Jillur Rahman
সময়: 2026-10-09T16:11:13.570616+06:00

## সরাসরি উত্তর

বর্তমান ১৩টি mapping-এর সবগুলো native Bridge দিয়ে text request-এ সফল। এর মধ্যে ১২টি mapping OpenAI-এর দুইটি GPT target-এ যায়; একটি mapping GLM-এ যায়। সবগুলো OpenAI model নয়।

| Target model | Source mapping সংখ্যা | Actual provider | Text | Streaming + tool round-trip |
| --- | ---: | --- | --- | --- |
| `cx/gpt-6-astra` | ২ | `codex` / OpenAI | PASS | PASS |
| `cx/gpt-6.1-sol` | ১০ | `codex` / OpenAI | PASS | PASS |
| `glmt/glm-5.3-max` | ১ | `glmt` / Z.AI | PASS | PASS |

`claude-sonnet-5-5` বর্তমান configuration অনুযায়ী `glmt/glm-5.3-max` ব্যবহার করে। Claude Code-এর source model label দেখে underlying provider নির্ধারণ করা যাবে না; saved mapping, actual response model এবং correlated provider trace একসঙ্গে পরীক্ষা করা হয়েছে।

## সব mapping-এর ফল

| Source model | Saved target | Live response model | Provider | HTTP | ফল |
| --- | --- | --- | --- | ---: | --- |
| `claude-fable-5` | `cx/gpt-6-astra` | `gpt-6-astra` | `codex` | 200 | PASS |
| `claude-fable-5-1` | `cx/gpt-6-astra` | `gpt-6-astra` | `codex` | 200 | PASS |
| `claude-haiku-4-5-20251001` | `cx/gpt-6.1-sol` | `gpt-6.1-sol` | `codex` | 200 | PASS |
| `claude-opus-4-5-20251101` | `cx/gpt-6.1-sol` | `gpt-6.1-sol` | `codex` | 200 | PASS |
| `claude-opus-4-6` | `cx/gpt-6.1-sol` | `gpt-6.1-sol` | `codex` | 200 | PASS |
| `claude-opus-4-7` | `cx/gpt-6.1-sol` | `gpt-6.1-sol` | `codex` | 200 | PASS |
| `claude-opus-4-8` | `cx/gpt-6.1-sol` | `gpt-6.1-sol` | `codex` | 200 | PASS |
| `claude-opus-5` | `cx/gpt-6.1-sol` | `gpt-6.1-sol` | `codex` | 200 | PASS |
| `claude-opus-5-5` | `cx/gpt-6.1-sol` | `gpt-6.1-sol` | `codex` | 200 | PASS |
| `claude-sonnet-4-5-20250929` | `cx/gpt-6.1-sol` | `gpt-6.1-sol` | `codex` | 200 | PASS |
| `claude-sonnet-4-6` | `cx/gpt-6.1-sol` | `gpt-6.1-sol` | `codex` | 200 | PASS |
| `claude-sonnet-5` | `cx/gpt-6.1-sol` | `gpt-6.1-sol` | `codex` | 200 | PASS |
| `claude-sonnet-5-5` | `glmt/glm-5.3-max` | `glm-5.3-max` | `glmt` | 200 | PASS |

## OpenAI route-এর প্রমাণ

- `cx` এই setup-এ `codex` provider-এর alias। Active provider connection-এর auth type `oauth`।
- Configured Codex upstream: `https://chatgpt.com/backend-api/codex/responses`। OAuth token endpoint: `https://auth.openai.com/oauth/token`।
- দুইটি GPT target-এর response model যথাক্রমে `gpt-6-astra` ও `gpt-6.1-sol` ছিল।
- সব GPT test trace-এ provider `codex`, input/source protocol `claude`, upstream/target protocol `openai-responses`, HTTP 200 এবং provider-reported usage পাওয়া গেছে।
- GPT target-এর text ও tool tests মিলিয়ে ১৬টি request trace পাওয়া গেছে; একটিও Anthropic, GLM বা অন্য provider-এ যায়নি।
- এগুলো connected OpenAI/Codex account ব্যবহার করা route। `openai/` prefix-এ আলাদা API-key billing route এই test-এর target ছিল না।

## GLM route-এর প্রমাণ

- `glmt` provider-এর upstream: `https://api.z.ai/api/coding/paas/v4/chat/completions`। Auth type `apikey`।
- GLM-এর তিনটি trace-এ provider `glmt` পাওয়া গেছে। `target_format=openai` এখানে OpenAI-compatible API format বোঝায়; provider OpenAI হয়ে যায় না।
- `glm-5.3-max` executor-এর effort alias: upstream base model `glm-5.3`, `thinking.type=enabled`, `reasoning_effort=max`। পরীক্ষার তিনটি trace-এই upstream reasoning effort `max` ছিল।
- JSON response-এ logical model `glm-5.3-max` এবং SSE response-এ base model `glm-5.3` পাওয়া গেছে। এটি alias normalization-এর সঙ্গে সামঞ্জস্যপূর্ণ।

## পরীক্ষা কীভাবে হয়েছে

- বর্তমান database-এর `agent_bridge_mappings` এবং runtime-read `mitmAlias` mapping সমান ছিল; শেষে দুটোই অপরিবর্তিত আছে।
- Native endpoint `https://api.anthropic.com/v1/messages` ব্যবহার করা হয়েছে। Host resolution ছিল loopback; বর্তমান native TLS ingress দিয়েই request গেছে। Target model দিয়ে সরাসরি gateway call করে source mapping এড়িয়ে যাওয়া হয়নি।
- ১৩টি source model-এর প্রতিটির জন্য আলাদা ছোট nonce prompt পাঠানো হয়েছে। Exact expected output মিলে গেছে। প্রতিটি request-এর response correlation ID দিয়ে SQLite call log মিলেছে।
- তিনটি unique target-এর প্রতিটিতে streaming forced tool call, সঠিক tool name/arguments, tool-result গ্রহণ এবং final text response পরীক্ষা হয়েছে। ছয়টি SSE request-এই `message_stop` পাওয়া গেছে; tool call-এ `stop_reason=tool_use`, final response-এ `stop_reason=end_turn`।
- মোট ১৯টি live request; ১৯টি PASS। Trace count: `codex` ১৬, `glmt` ৩। Unexpected provider বা local response-cache result পাওয়া যায়নি; cache source ছিল `upstream`।
- TLS certificate chain ও hostname যাচাই করা হয়েছে। OS `security verify-cert`-ও সফল (exit 0); TLS verification বন্ধ করা হয়নি।
- এই run-এর client একটি সীমিত HTTP test harness; native Anthropic protocol ও deployed Bridge পরীক্ষা করেছে। নতুন interactive Claude Code CLI/desktop session launch করা হয়নি। বড় coding workload, long-session stability বা quality benchmark এই পরীক্ষার scope নয়।

## Token usage ও resource

এই ১৯টি request-এর correlated log-এ input **11,276**, output **416** tokens পাওয়া গেছে। Cache-read breakdown **5,056**। Cache-read/known reasoning counters আবার যোগ করে token total বাড়ানো হয়নি। এটি provider-reported counter-এর সারাংশ; weekly allowance কত percentage point বদলেছে বা billing cost কত হয়েছে তা এই test দিয়ে নির্ধারণ করা হয়নি।

একসঙ্গে একটি remote request চালানো হয়েছে। Client budget 512 MiB, estimated peak 100 MiB; live pressure, headroom, swap ও disk পর্যবেক্ষণ হয়েছে। কোনো app/service quit, local build, model loading বা নতুন installation প্রয়োজন হয়নি।

## সংরক্ষিত অবস্থা

- Mapping ও তার timestamps, runtime alias map, provider/API-key ID sets অপরিবর্তিত।
- Source checkout clean; HEAD `a535572e52f54d557391e57087bac9ef0e08e6bc`। Runtime `a535572e5`।
- Gateway `/healthz`: HTTP 200, `ok`। Native TLS এখনও valid।
- Official app/config, credentials বা mapping edit করা হয়নি। Report-এ credential values, account identity বা private verification links নেই।

## Evidence files

- `baseline.json`: শুরুতে current mapping ও preservation hashes।
- `summary.json`: counts, usage ও preservation verification।
- `all-results.json`: ১৯টি test-এর source/target, response, correlation ও trace।
- `matched-request-traces.json`: পরীক্ষার নির্দিষ্ট ১৯টি provider trace।
- `request-results.jsonl`: streaming/tool tests-সহ sequential result journal।
- `resource-admission.json`: conservative client resource budget।

Configuration reference: `~/Developer/OmniRoute/open-sse/config/providers/registry/codex/index.ts`, `open-sse/config/providers/registry/glm/t/index.ts`, `open-sse/executors/glm.ts` এবং deployed `dist/src/mitm/server.cjs`।
