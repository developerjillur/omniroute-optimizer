type RecordValue = Record<string, unknown>;
const record = (value: unknown): RecordValue =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordValue) : {};

/** Hidden thinking is activity, without being a usable completed answer. */
export function allowsAnthropicThinkingProgress(provider: string, body: unknown): boolean {
  if (provider !== "claude" && provider !== "anthropic") return false;
  return ["adaptive", "enabled", "between_tools"].includes(
    String(record(record(body).thinking).type)
  );
}

export function createAnthropicThinkingProgressWatcher() {
  const limit = 64 * 1024;
  const thinking = new Set<number>();
  let pending = "";
  let dropping = false;
  let ended = false;
  return {
    note(text: string): boolean {
      if (ended) return false;
      pending += text;
      let progress = false;
      for (;;) {
        const boundary = pending.search(/\r?\n\r?\n/);
        if (boundary < 0) break;
        const frame = pending.slice(0, boundary);
        pending = pending.slice(boundary).replace(/^\r?\n\r?\n/, "");
        if (dropping || frame.length > limit) {
          dropping = false;
          continue;
        }
        const data = frame
          .split(/\r?\n/)
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trimStart())
          .join("\n");
        let event: RecordValue;
        try {
          event = record(JSON.parse(data));
        } catch {
          continue;
        }
        if (event.type === "error" || event.type === "message_stop") {
          ended = true;
          thinking.clear();
          pending = "";
          break;
        }
        const index = event.index;
        if (!Number.isInteger(index) || Number(index) < 0 || Number(index) > 1024) continue;
        if (event.type === "content_block_start") {
          if (record(event.content_block).type === "thinking" && thinking.size < 32)
            thinking.add(Number(index));
          else thinking.delete(Number(index));
        } else if (event.type === "content_block_stop") {
          thinking.delete(Number(index));
        } else if (event.type === "content_block_delta" && thinking.has(Number(index))) {
          const delta = record(event.delta);
          if (delta.type === "thinking_delta" && typeof delta.thinking === "string")
            progress = true;
          if (
            delta.type === "signature_delta" &&
            typeof delta.signature === "string" &&
            delta.signature.length > 0
          )
            progress = true;
        }
      }
      if (pending.length > limit) {
        pending = "";
        dropping = true;
      }
      return progress;
    },
  };
}
