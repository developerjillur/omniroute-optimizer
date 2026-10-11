import { isClaudeCodeOriginatedHeaders } from "../config/codexIdentity.ts";

const SUGGESTION_PREFIX =
  "[SUGGESTION MODE: Suggest what the user might naturally type next into Claude Code.]";

type RecordValue = Record<string, unknown>;
const record = (value: unknown): RecordValue | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordValue) : null;

/** Only the native client's optional next-prompt request may intentionally return no text. */
export function isNativeSuggestionRequest(
  body: unknown,
  headers: Headers | Record<string, unknown> | null | undefined
): boolean {
  if (!isClaudeCodeOriginatedHeaders(headers)) return false;
  const messages = record(body)?.messages;
  if (!Array.isArray(messages)) return false;
  const last = record(messages.at(-1));
  if (last?.role !== "user") return false;
  const content = last.content;
  const text =
    typeof content === "string"
      ? content
      : Array.isArray(content) &&
          content.every(
            (part) => record(part)?.type === "text" && typeof record(part)?.text === "string"
          )
        ? content.map((part) => record(part)?.text).join("\n")
        : "";
  return text.startsWith(SUGGESTION_PREFIX);
}

/** Require an actual successful Responses completion, never an empty/truncated transport. */
export function isCompletedSilentSuggestion(response: unknown): boolean {
  const body = record(response);
  if (
    body?.object !== "response" ||
    body.status !== "completed" ||
    body.error != null ||
    body.incomplete_details != null ||
    !Array.isArray(body.output)
  )
    return false;
  return body.output.every((item) => {
    const message = record(item);
    // A completed reasoning item with no summary contributes no visible output.
    // Keep this exception narrower than ordinary reasoning-only task responses.
    if (message?.type === "reasoning") {
      return (
        (message.status == null || message.status === "completed") &&
        Array.isArray(message.summary) &&
        message.summary.length === 0
      );
    }
    return (
      message?.type === "message" &&
      message.role === "assistant" &&
      (message.status == null || message.status === "completed") &&
      Array.isArray(message.content) &&
      message.content.every((part) => {
        const text = record(part);
        return (
          text?.type === "output_text" && typeof text.text === "string" && text.text.trim() === ""
        );
      })
    );
  });
}

export function isEmptyTranslatedSuggestion(response: unknown): boolean {
  const body = record(response);
  return (
    body?.type === "message" &&
    body.stop_reason === "end_turn" &&
    Array.isArray(body.content) &&
    body.content.every((part) => {
      const block = record(part);
      return (
        block?.type === "text" &&
        typeof block.text === "string" &&
        (block.text.trim() === "" || block.text === "(empty response)")
      );
    })
  );
}
