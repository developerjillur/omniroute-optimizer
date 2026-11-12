# VS Code-এর Fable 5.2 ও routing — ২০২৬-১১-১২

লেখক: Jillur Rahman

## সরাসরি দেখা ফল

Installed official VS Code extension `2.1.322`-এর model picker-এ এই row দেখা গেছে:

`Fable 5.2 · Custom Fable model (claude-fable-5-2)`

একই picker-এ আলাদা `Fable · Fable 5.1` row-ও আছে। Fable 5.2 বেছে নিতে explicit
`claude-fable-5-2` row ব্যবহার করতে হবে। উপস্থিত conversation-এর Sonnet 5.5
selection বদলানো হয়নি; window reload, conversation restart বা message পাঠানো হয়নি।

Shared settings-এর `ANTHROPIC_DEFAULT_FABLE_MODEL` আগে থেকেই
`claude-fable-5-2` ছিল। তাই এই যাচাইয়ে pin দ্বিতীয়বার edit করা হয়নি। Installed
extension বা binary পরিবর্তন/upgrade প্রয়োজন প্রমাণিত হয়নি।

## তিনটি surface-এর বর্তমান সীমা

| Surface | বর্তমান routing |
| --- | --- |
| Claude native app | Existing OmniRoute/Agent Bridge; shared settings অপরিবর্তিত |
| নতুন managed Terminal `claude` launch | `OMNIROUTE_AUTO_SYNC_CLAUDE_PROFILES=false`: নিজের Claude subscription; On করলে OmniRoute profile |
| VS Code extension panel | Existing shared gateway configuration; Terminal-এর zsh function extension-এর bundled CLI launch-কে wrap করে না |

Terminal-এর flag read-only query-তে `false` পাওয়া গেছে। Installed পাঁচটি helper
তার installation manifest-এর SHA256-এর সঙ্গে মিলেছে। Subscription mode-এর
per-launch settings, public upstream TLS tunnel, shared login ও On-mode gateway
behavior আগের [Terminal note](CLAUDE-TERMINAL-PROFILES-2026-11-11.md)-এ আছে।

VS Code-এর জন্য `claudeCode.claudeProcessWrapper` configured নয়। VS Code panel-ও
Terminal-এর একই switch অনুসরণ করবে, সবসময় gateway ব্যবহার করবে, নাকি সবসময়
subscription ব্যবহার করবে—এই preference জানতে চাওয়া হয়েছে। উত্তর ছাড়া সেই
surface-এর billing/routing পরিবর্তন করা হয়নি। Native app-এর Bridge এবং
Terminal-এর existing Off default বহাল।

## Default model ও shared settings

Shared settings-এ `ANTHROPIC_MODEL=claude-sonnet-5-5` এবং `model: fable` দুটোই
রয়েছে। Official precedence-এ startup environment-এর `ANTHROPIC_MODEL` settings-এর
`model` field-এর আগে আসে; explicit in-session selection আরও আগে আসে। তাই শুধু
`model` field দেখে নতুন extension session-এর model নিশ্চিত করা যায় না।

এই conflict সরাতে shared gateway/default মুছে native app-এর পছন্দ পরিবর্তন করা
হয়নি। Terminal-এর existing isolated launcher native mode-এ shared gateway-এর
model override সরায়। User-supplied transcript-এর পুরোনো `(default)` failure-কে
Fable 5.2 unavailable হওয়ার প্রমাণ বলা হয়নি; এই যাচাইয়ে সেই failure reproduce
বা তার একক কারণ প্রতিষ্ঠিত হয়নি।

## Evidence ও সীমা

Private metadata-only receipt:
`/Volumes/NexaWork/Work/omniroute-vscode-fable-2026-11-12/verified-configuration-v1.json`।
Public summary: [VS Code receipt](../../reports/vscode-fable-2026-11-12.json)।

Live trusted HTTPS health read-only check HTTP `200` দিয়েছে। System memory
pressure warning ছিল; নতুন CLI/model process, inference, test suite বা full build
চালানো হয়নি। Picker-এর দৃশ্যমান entry ও routing configuration যাচাই হয়েছে;
নতুন VS Code Fable generation, account entitlement, quota ও সব hosted feature-এর
end-to-end acceptance দাবি করা হচ্ছে না। কোনো credential, private transcript
বা unrelated project content repository-তে নেওয়া হয়নি।

Official references, checked ২০২৬-১১-১২:

- [VS Code extension settings ও bundled binary](https://code.claude.com/docs/en/vs-code#extension-settings)
- [Model aliases, Fable 5.2 ও precedence](https://code.claude.com/docs/en/model-config)
- [Proxy environment ও startup scope](https://code.claude.com/docs/en/network-config)
