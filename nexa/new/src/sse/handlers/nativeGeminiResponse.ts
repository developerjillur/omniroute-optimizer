import { FETCH_BODY_TIMEOUT_MS } from "@omniroute/open-sse/config/constants.ts";

type JsonRecord = Record<string, unknown>;
const record = (value: unknown): value is JsonRecord =>
  value !== null && typeof value === "object" && !Array.isArray(value);

export class NativeGeminiResponseError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "NativeGeminiResponseError";
  }
}

/** Buffer the native protocol directly; opaque parts and metadata never pass through OpenAI. */
export async function collectNativeGeminiResponse(
  response: Response,
  signal?: AbortSignal,
  options: { maxBytes?: number; timeoutMs?: number } = {}
): Promise<JsonRecord> {
  if (!response.body)
    throw new NativeGeminiResponseError("native_empty_response", "Native response has no body");
  const maxBytes = options.maxBytes ?? 4 * 1024 * 1024;
  const timeoutMs = options.timeoutMs ?? FETCH_BODY_TIMEOUT_MS;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const candidates = new Map<number, JsonRecord>();
  let root: JsonRecord = {};
  let envelope: JsonRecord = {};
  let pending = "";
  let bytes = 0;
  let complete = false;
  let timer: ReturnType<typeof setTimeout>;
  let abort = () => {};
  const interrupted = new Promise<never>((_, reject) => {
    abort = () =>
      reject(new NativeGeminiResponseError("native_cancelled", "Native request was cancelled"));
    timer = setTimeout(
      () =>
        reject(
          new NativeGeminiResponseError(
            "native_timeout",
            "Native response exceeded its time budget"
          )
        ),
      timeoutMs
    );
    signal?.addEventListener("abort", abort, { once: true });
    if (signal?.aborted) abort();
  });

  function frame(value: string) {
    const data = value
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n");
    if (!data) return;
    let event: unknown;
    try {
      event = JSON.parse(data);
    } catch {
      throw new NativeGeminiResponseError(
        "native_invalid_response",
        "Native event is not valid JSON"
      );
    }
    if (!record(event))
      throw new NativeGeminiResponseError(
        "native_invalid_response",
        "Native event must be an object"
      );
    const payload = record(event.response) ? event.response : event;
    if (event.error || payload.error)
      throw new NativeGeminiResponseError(
        "native_upstream_error",
        "Native stream reported an upstream error"
      );
    if (record(event.response)) {
      envelope = { ...envelope, ...event };
      delete envelope.response;
    }
    root = { ...root, ...payload };
    if (!Array.isArray(payload.candidates)) return;
    for (const [position, value] of payload.candidates.entries()) {
      if (!record(value))
        throw new NativeGeminiResponseError(
          "native_invalid_response",
          "Native candidate is malformed"
        );
      const index = typeof value.index === "number" ? value.index : position;
      if (!Number.isSafeInteger(index) || index < 0 || index > 127)
        throw new NativeGeminiResponseError(
          "native_invalid_response",
          "Native candidate index is invalid"
        );
      const previous = candidates.get(index) ?? {};
      const content = record(value.content) ? value.content : {};
      const oldContent = record(previous.content) ? previous.content : {};
      const parts = Array.isArray(content.parts) ? content.parts : [];
      const oldParts = Array.isArray(oldContent.parts) ? oldContent.parts : [];
      const merged: JsonRecord = { ...previous, ...value };
      for (const part of parts) oldParts.push(part);
      if (record(value.content) || record(previous.content))
        merged.content = {
          ...oldContent,
          ...content,
          parts: oldParts,
        };
      candidates.set(index, merged);
    }
  }

  try {
    while (true) {
      const next = await Promise.race([reader.read(), interrupted]);
      if (next.done) break;
      bytes += next.value.byteLength;
      if (bytes > maxBytes)
        throw new NativeGeminiResponseError(
          "native_response_limit",
          "Native response exceeded its byte limit"
        );
      pending += decoder.decode(next.value, { stream: true });
      while (true) {
        const boundary = pending.search(/\r?\n\r?\n/);
        if (boundary < 0) break;
        frame(pending.slice(0, boundary));
        pending = pending.slice(boundary).replace(/^\r?\n\r?\n/, "");
      }
    }
    pending += decoder.decode();
    if (pending.trim()) frame(pending);
    const output = [...candidates.entries()]
      .sort(([left], [right]) => left - right)
      .map(([, value]) => value);
    const blocked =
      record(root.promptFeedback) && typeof root.promptFeedback.blockReason === "string";
    if (
      (!output.length && !blocked) ||
      output.some((value) => typeof value.finishReason !== "string" || !value.finishReason)
    ) {
      throw new NativeGeminiResponseError(
        "native_incomplete",
        "Native stream ended without a candidate terminal"
      );
    }
    if (output.length) root.candidates = output;
    complete = true;
    return { ...envelope, response: root };
  } finally {
    clearTimeout(timer!);
    signal?.removeEventListener("abort", abort);
    if (!complete) void reader.cancel("native JSON collection stopped").catch(() => {});
    try {
      reader.releaseLock();
    } catch {
      /* cancellation may still be draining */
    }
  }
}
