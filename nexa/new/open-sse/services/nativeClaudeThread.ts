type Body = Record<string, unknown>;

export function isNativeClaudeThreadReplayError(status: number, error: unknown): boolean {
  return (
    (status === 400 || status === 404) &&
    /(?:no thread state (?:is available|was found)|request does not match the stored Thread)/i.test(
      String(error ?? "")
    )
  );
}

function record(value: unknown): Body {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Body) : {};
}

export function isNativeClaudeThreadContinuation(body: unknown): boolean {
  const thread = record(record(body).thread);
  return (
    thread.type === "continue" &&
    typeof thread.previous_message_id === "string" &&
    /^msg_[A-Za-z0-9_-]{1,200}$/.test(thread.previous_message_id)
  );
}

export function isNativeClaudeThreadRequest(body: unknown): boolean {
  return record(record(body).thread).type === "create" || isNativeClaudeThreadContinuation(body);
}

// Native message threads already own the preceding tool calls and prompt. Full-history
// orphan repair, cache injection and leading-system hoisting corrupt sparse continuations.
const NATIVE_FIELDS = [
  "system",
  "messages",
  "tools",
  "tool_choice",
  "cache_control",
  "thinking",
  "output_config",
  "context_management",
  "thread",
  "diagnostics",
] as const;

export function captureNativeClaudeThreadFields(body: Body): Body {
  return structuredClone(
    Object.fromEntries(NATIVE_FIELDS.filter((k) => k in body).map((k) => [k, body[k]]))
  );
}

/** Preserve native semantics while model resolution and selected-account identity remain local. */
export function restoreNativeClaudeThreadFields(body: Body, captured: Body): void {
  for (const key of NATIVE_FIELDS) {
    if (key in captured) body[key] = structuredClone(captured[key]);
    else delete body[key];
  }
}

export function nativeClaudeThreadBeta(
  headers: Record<string, string> | null | undefined
): string | null {
  const raw = Object.entries(headers ?? {}).find(
    ([k]) => k.toLowerCase() === "anthropic-beta"
  )?.[1];
  if (!raw?.trim()) return null;
  const flags = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!flags.includes("oauth-2025-04-20")) flags.push("oauth-2025-04-20");
  return flags.join(",");
}

function rootMessageIdPrefix(text: string): string | null {
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{" || ch === "[") depth++;
    else if (ch === "}" || ch === "]") depth--;
    else if (ch === '"') {
      const start = i++;
      for (; i < text.length; i++) {
        if (text[i] === "\\") i++;
        else if (text[i] === '"') break;
      }
      if (i >= text.length) return null;
      if (depth !== 1 || text.slice(start, i + 1) !== '"id"') continue;
      const value = text.slice(i + 1).match(/^\s*:\s*"(msg_[A-Za-z0-9_-]{1,200})"\s*[,}]/);
      if (value) return value[1];
    }
  }
  return null;
}

/** Commit ownership after a complete response, without retaining the transcript. */
export function observeNativeClaudeThreadResponse(
  response: Response,
  onMessage: (id: string) => void
): Response {
  if (!response.ok || !response.body) return response;
  const sse = response.headers.get("content-type")?.includes("text/event-stream");
  const decoder = new TextDecoder();
  let pending = "";
  let seenBytes = 0;
  let done = false;
  let candidate: string | null = null;
  let droppingFrame = false;
  let jsonDepth = 0;
  let jsonString = false;
  let jsonEscape = false;
  let jsonStarted = false;
  let jsonInvalid = false;
  const commit = () => {
    if (done || !candidate) return;
    done = true;
    pending = "";
    try {
      onMessage(candidate);
    } catch {
      /* Persistence must not break a valid response. */
    }
  };
  const note = (value: unknown) => {
    const envelope = record(value);
    if (sse && envelope.type === "error") {
      candidate = null;
      done = true;
      return;
    }
    if (sse && envelope.type === "message_stop") {
      commit();
      return;
    }
    const id =
      sse && envelope.type === "message_start"
        ? record(envelope.message).id
        : !sse
          ? envelope.id
          : null;
    if (typeof id !== "string" || !/^msg_[A-Za-z0-9_-]{1,200}$/.test(id)) return;
    candidate = id;
  };
  const stream = response.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        controller.enqueue(chunk);
        if (done) return;
        const decoded = decoder.decode(chunk, { stream: true });
        seenBytes += chunk.byteLength;
        if (!sse) {
          if (pending.length < 64 * 1024) pending += decoded.slice(0, 64 * 1024 - pending.length);
          if (!candidate) candidate = rootMessageIdPrefix(pending);
          for (const ch of decoded) {
            if (jsonString) {
              if (jsonEscape) jsonEscape = false;
              else if (ch === "\\") jsonEscape = true;
              else if (ch === '"') jsonString = false;
              continue;
            }
            if (!jsonStarted && !/\s/.test(ch)) {
              jsonStarted = true;
              if (ch !== "{") jsonInvalid = true;
            } else if (jsonStarted && jsonDepth === 0 && !/\s/.test(ch)) jsonInvalid = true;
            if (ch === '"') jsonString = true;
            else if (ch === "{" || ch === "[") jsonDepth++;
            else if (ch === "}" || ch === "]") jsonDepth--;
            if (jsonDepth < 0 || jsonDepth > 256) jsonInvalid = true;
          }
          return;
        }
        pending += decoded;
        pending = pending.replace(/\r\n/g, "\n");
        let boundary: number;
        while (!done && (boundary = pending.indexOf("\n\n")) !== -1) {
          const frame = pending.slice(0, boundary);
          pending = pending.slice(boundary + 2);
          if (droppingFrame || frame.length > 64 * 1024) {
            droppingFrame = false;
            continue;
          }
          const data = frame
            .split("\n")
            .filter((line) => line.startsWith("data:"))
            .map((line) => line.slice(5).trimStart())
            .join("\n");
          if (!data || data === "[DONE]") continue;
          try {
            note(JSON.parse(data));
          } catch {
            /* Keep forwarding malformed or non-JSON frames. */
          }
        }
        if (pending.length > 64 * 1024) {
          pending = "";
          droppingFrame = true;
        }
      },
      flush() {
        if (sse || done || jsonInvalid || jsonString || jsonDepth !== 0 || !jsonStarted) return;
        if (seenBytes <= 64 * 1024) {
          try {
            note(JSON.parse(pending));
          } catch {
            return;
          }
        }
        commit();
      },
    })
  );
  return new Response(stream, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}
