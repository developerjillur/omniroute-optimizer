#!/usr/bin/env python3
"""Bounded native protocol and video-media acceptance; credentials and bodies stay private."""
import argparse
import hashlib
import json
import math
import re
import time
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener

LIMIT = 2 * 1024**2
MARKER = "NEXA_GATEWAY_OK"


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, message, headers, newurl):
        return None


def exchange(base, path, key=None, body=None):
    headers = {"User-Agent": "NexaOmniAcceptance/1.0", "Content-Type": "application/json"}
    if key:
        headers["Authorization"] = "Bearer " + key
    if body and body.get("stream"):
        headers["Accept"] = "text/event-stream"
    started = time.monotonic()
    raw, response_headers, status = b"", {}, 0
    try:
        request = Request(base + path, data=json.dumps(body).encode() if body is not None else None, headers=headers)
        with build_opener(NoRedirect()).open(request, timeout=90) as response:
            status, response_headers = response.status, dict(response.headers)
            blocks = []
            size = 0
            while True:
                block = response.read1(65536)
                if not block:
                    break
                size += len(block)
                if size > LIMIT or time.monotonic() - started > 120:
                    raise ValueError("response_budget")
                blocks.append(block)
            raw = b"".join(blocks)
    except HTTPError as error:
        status, response_headers, raw = error.code, dict(error.headers), error.read(LIMIT + 1)
    except Exception as error:
        return {"http_status": status, "seconds": round(time.monotonic() - started, 3), "transport_error": type(error).__name__}, [], ""
    values = []
    text = raw.decode("utf-8", errors="replace")
    if "text/event-stream" in next((v for k, v in response_headers.items() if k.lower() == "content-type"), ""):
        for line in text.splitlines():
            if line.startswith("data:") and line[5:].strip() != "[DONE]":
                try:
                    value = json.loads(line[5:])
                    if isinstance(value, dict):
                        values.append(value)
                except ValueError:
                    pass
    else:
        try:
            value = json.loads(text)
            if isinstance(value, dict):
                values.append(value)
        except ValueError:
            pass
    lower = {k.lower(): v for k, v in response_headers.items()}
    connection = lower.get("x-omniroute-selected-connection-id", "")
    metadata = {"http_status": status, "seconds": round(time.monotonic() - started, 3), "bytes": len(raw),
                "events": len(values), "content_type": lower.get("content-type"),
                "provider": lower.get("x-omniroute-provider"), "model": lower.get("x-omniroute-model"),
                "request_id": lower.get("x-omniroute-request-id"),
                "connection_reference": hashlib.sha256(connection.encode()).hexdigest()[:12] if connection else None}
    return metadata, values, text


def inspect(values, protocol, streaming):
    text, finishes, calls, usage = [], [], [], []
    native_envelopes = True
    for value in values:
        if protocol == "antigravity":
            native_envelopes = native_envelopes and isinstance(value.get("response"), dict)
            data = value.get("response", value)
            if data.get("usageMetadata") is not None:
                usage.append(data["usageMetadata"])
            for candidate in data.get("candidates", []):
                if candidate.get("finishReason"):
                    finishes.append(candidate["finishReason"])
                for part in candidate.get("content", {}).get("parts", []):
                    if isinstance(part.get("text"), str) and not part.get("thought"):
                        text.append(part["text"])
                    if isinstance(part.get("functionCall"), dict):
                        calls.append(part["functionCall"])
        elif protocol == "claude":
            if streaming:
                if value.get("type") == "content_block_delta" and value.get("delta", {}).get("type") == "text_delta":
                    text.append(value["delta"].get("text", ""))
                if value.get("type") == "message_stop":
                    finishes.append("message_stop")
            else:
                text.extend(part.get("text", "") for part in value.get("content", []) if part.get("type") == "text")
                if value.get("stop_reason"):
                    finishes.append(value["stop_reason"])
        elif protocol == "responses":
            if streaming:
                if value.get("type") == "response.output_text.delta":
                    text.append(value.get("delta", ""))
                if value.get("type") == "response.completed" and value.get("response", {}).get("status") == "completed":
                    finishes.append("completed")
            else:
                for item in value.get("output", []):
                    text.extend(part.get("text", "") for part in item.get("content", []) if part.get("type") == "output_text")
                if value.get("status"):
                    finishes.append(value["status"])
        else:
            for choice in value.get("choices", []):
                content = choice.get("delta", choice.get("message", {})).get("content")
                if isinstance(content, str):
                    text.append(content)
                if choice.get("finish_reason"):
                    finishes.append(choice["finish_reason"])
    return {"text": "".join(text), "finish_reasons": finishes, "calls": calls, "usage": usage,
            "native_envelopes": native_envelopes}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", default="https://nexaomni.nexaconnect.cloud")
    parser.add_argument("--credentials", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--providers", default="gemini")
    parser.add_argument("--gemini-model", default="agy/gemini-3.8-flash-low")
    parser.add_argument("--claude-model", default="claude/claude-sonnet-5-5")
    parser.add_argument("--codex-model", default="codex/gpt-6.1-sol")
    parser.add_argument("--media", action="store_true")
    parser.add_argument("--tools", action="store_true")
    parser.add_argument("--video-id", default="wFbgrPmVXb0")
    args = parser.parse_args()
    parsed = urlsplit(args.base)
    if (parsed.scheme != "https" and not (parsed.scheme == "http" and parsed.hostname in {"127.0.0.1", "localhost"})) or not parsed.hostname or parsed.username or parsed.password or parsed.query or parsed.fragment or parsed.path not in ("", "/"):
        parser.error("Use an HTTPS origin or an isolated loopback candidate")
    if args.output.exists() or not args.output.parent.is_dir():
        parser.error("Output must be new and its parent directory must exist")
    if args.credentials.stat().st_mode & 0o077:
        parser.error("Credentials file must be private (mode 0600)")
    if not re.fullmatch(r"[A-Za-z0-9_-]{11}", args.video_id):
        parser.error("Invalid video ID")
    providers = {value.strip() for value in args.providers.split(",") if value.strip()}
    if not providers or not providers <= {"gemini", "claude", "codex"}:
        parser.error("Providers must be gemini, claude or codex")
    if (args.media or args.tools) and "gemini" not in providers:
        parser.error("Media and native tool checks require the Gemini profile")
    if "gemini" in providers and not re.fullmatch(r"(?:agy|antigravity)/gemini-[A-Za-z0-9.-]+", args.gemini_model):
        parser.error("Native media acceptance requires an explicit Gemini route")
    credentials = dict(line.split("=", 1) for line in args.credentials.read_text().splitlines() if "=" in line and not line.lstrip().startswith("#"))
    key = credentials["NEXAOMNI_API_KEY"].strip().strip("\"'")
    base = args.base.rstrip("/")
    report = {"base": base, "checks": [], "word_accuracy_verified": False}

    def record(name, metadata, passed, **details):
        row = {"name": name, **metadata, "passed": bool(passed), **details}
        report["checks"].append(row)
        report["passed"] = all(check["passed"] for check in report["checks"])
        args.output.write_text(json.dumps(report, indent=2) + "\n")
        print(json.dumps({k: row[k] for k in ("name", "passed", "http_status", "seconds")}), flush=True)

    for name, path, auth, expected in [("health", "/healthz", None, {200}), ("authentication_required", "/v1/models", None, {401, 403}),
            ("invalid_key", "/v1/models", "invalid-acceptance-key", {401, 403}), ("authenticated_catalog", "/v1/models", key, {200})]:
        metadata, values, _ = exchange(base, path, auth)
        record(name, metadata, metadata["http_status"] in expected and not metadata.get("transport_error"),
               model_count=len(values[0].get("data", [])) if name == "authenticated_catalog" and values else None)

    def check(name, protocol, model, stream, extra=None, media=False, tool=False):
        body = {"model": model, "stream": stream}
        prompt = "Reply with only the exact text " + MARKER + "."
        if protocol == "antigravity":
            body["request"] = {"contents": [{"role": "user", "parts": [{"text": prompt}]}],
                "generationConfig": {"maxOutputTokens": 256, "temperature": 0, "thinkingConfig": {"thinkingBudget": 0}}}
            path = "/v1/antigravity"
        elif protocol == "claude":
            body.update(messages=[{"role": "user", "content": prompt}], max_tokens=256)
            path = "/v1/messages"
        elif protocol == "responses":
            body.update(input=prompt, reasoning={"effort": "low"}, max_output_tokens=512)
            path = "/v1/responses"
        else:
            body.update(messages=[{"role": "user", "content": prompt}], max_tokens=256)
            path = "/v1/chat/completions"
        if extra:
            body.update(extra)
        metadata, values, raw = exchange(base, path, key, body)
        observed = inspect(values, protocol, stream)
        passed = metadata["http_status"] == 200 and bool(observed["finish_reasons"]) and not metadata.get("transport_error")
        passed = passed and not any(value.get("error") for value in values)
        if protocol == "antigravity":
            passed = passed and bool(values) and observed["native_envelopes"] and "[DONE]" not in raw
            passed = passed and any(isinstance(item, dict) and item.get("promptTokenCount", 0) > 0 for item in observed["usage"])
            if not stream:
                passed = passed and metadata["provider"] in {"antigravity", "agy"} and str(metadata["model"]).startswith("gemini-")
        if media:
            try:
                output = json.loads(observed["text"])
                passed = passed and output["video_id"] == args.video_id and output["start_seconds"] == 40 and output["end_seconds"] == 50 and len(output["summary"].strip()) >= 10
                passed = passed and all(math.isfinite(output[k]) for k in ["start_seconds", "end_seconds"])
            except (ValueError, KeyError, TypeError):
                passed = False
        elif tool:
            passed = passed and any(call.get("name") == "report_time" and call.get("args", {}).get("second") == 42 for call in observed["calls"])
        else:
            passed = passed and observed["text"].strip() == MARKER
        record(name, metadata, passed, visible_characters=len(observed["text"]), finish_reasons=observed["finish_reasons"],
               native_envelopes=observed["native_envelopes"] if protocol == "antigravity" else None,
               tool_calls=len(observed["calls"]), usage=observed["usage"])
        return values, body, passed

    if "gemini" in providers:
        for protocol in ["antigravity", "openai"]:
            for stream in [False, True]:
                check(protocol + ("_sse" if stream else "_json"), protocol, args.gemini_model, stream)
        if args.media:
            schema = {"type": "OBJECT", "properties": {"video_id": {"type": "STRING"}, "start_seconds": {"type": "NUMBER"},
                "end_seconds": {"type": "NUMBER"}, "summary": {"type": "STRING"}}, "required": ["video_id", "start_seconds", "end_seconds", "summary"]}
            request = {"contents": [{"role": "user", "parts": [{"fileData": {"fileUri": "https://www.youtube.com/watch?v=" + args.video_id, "mimeType": "video/mp4"},
                "videoMetadata": {"startOffset": "40s", "endOffset": "50s"}}, {"text": "Describe the visible person and setting in the attached clip. Return video_id=" + args.video_id + ", start_seconds=40, end_seconds=50 and a grounded summary."}]}],
                "generationConfig": {"maxOutputTokens": 1024, "temperature": 0, "thinkingConfig": {"thinkingBudget": 0}, "responseMimeType": "application/json", "responseSchema": schema}}
            for stream in [False, True]:
                check("video_schema" + ("_sse" if stream else "_json"), "antigravity", args.gemini_model, stream, {"request": request}, media=True)
        if args.tools:
            tools = [{"functionDeclarations": [{"name": "report_time", "parameters": {"type": "OBJECT", "properties": {"second": {"type": "INTEGER"}}, "required": ["second"]}}]}]
            request = {"contents": [{"role": "user", "parts": [{"text": "Call report_time with second=42. After the function response reply only " + MARKER + "."}]}], "tools": tools,
                "toolConfig": {"functionCallingConfig": {"mode": "ANY", "allowedFunctionNames": ["report_time"]}},
                "generationConfig": {"maxOutputTokens": 512, "temperature": 0, "thinkingConfig": {"thinkingBudget": 0}}}
            values, _, passed = check("native_tool_call", "antigravity", args.gemini_model, False, {"request": request}, tool=True)
            if passed:
                content = values[0]["response"]["candidates"][0]["content"]
                call = next(part["functionCall"] for part in content["parts"] if "functionCall" in part)
                result = {"name": call["name"], "response": {"result": {"second": 42}}}
                if call.get("id"):
                    result["id"] = call["id"]
                follow = {**request, "contents": [*request["contents"], content, {"role": "user", "parts": [{"functionResponse": result}]}],
                          "toolConfig": {"functionCallingConfig": {"mode": "AUTO"}}}
                check("native_tool_response", "antigravity", args.gemini_model, False, {"request": follow})
    for provider, protocol, model in [("claude", "claude", args.claude_model), ("codex", "responses", args.codex_model)]:
        if provider in providers:
            for stream in [False, True]:
                check(provider + ("_sse" if stream else "_json"), protocol, model, stream)
    metadata, _, _ = exchange(base, "/v1/chat/completions", key, {"model": "unavailable-acceptance-provider/not-a-model", "messages": [{"role": "user", "content": MARKER}], "stream": False})
    record("invalid_model_rejected", metadata, metadata["http_status"] in {400, 404, 422})
    return 0 if report["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
