import { DEFAULT_THINKING_CLAUDE_SIGNATURE } from "../config/defaultThinkingSignature.ts";

type RecordValue = Record<string, unknown>;
type Position = { message: number; block: number };

function record(value: unknown): value is RecordValue {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function thinking(value: unknown): value is RecordValue {
  return record(value) && (value.type === "thinking" || value.type === "redacted_thinking");
}

function unsignedOrSynthetic(block: RecordValue): boolean {
  const signature = block.type === "thinking" ? block.signature : block.data;
  return (
    typeof signature !== "string" ||
    !signature.trim() ||
    signature === DEFAULT_THINKING_CLAUDE_SIGNATURE
  );
}

/**
 * Removing a thinking block changes the prefix bound to later signed blocks.
 * Drop that thinking suffix only; retain ordinary text, tool IDs/results,
 * documents, directives and earlier native signatures without modifying them.
 */
function dropThinkingSuffix<T>(body: T, start: Position): T {
  if (!record(body) || !Array.isArray(body.messages)) return body;
  let changed = false;
  const messages = body.messages.flatMap((message, index) => {
    if (!record(message) || message.role !== "assistant" || !Array.isArray(message.content)) {
      return [message];
    }
    if (index < start.message) return [message];
    const content = message.content.filter(
      (block, blockIndex) =>
        !thinking(block) || (index === start.message && blockIndex < start.block)
    );
    if (content.length === message.content.length) return [message];
    changed = true;
    // Anthropic rejects an empty assistant content array. No usable history
    // is lost when this turn consisted entirely of rejected thinking blocks.
    return content.length ? [{ ...message, content }] : [];
  });
  return changed ? ({ ...body, messages } as T) : body;
}

/** Call only at an Anthropic dispatch boundary, never on GPT/GLM replay. */
export function sanitizeAnthropicThinkingReplay<T>(body: T): T {
  if (!record(body) || !Array.isArray(body.messages)) return body;
  for (const [messageIndex, message] of body.messages.entries()) {
    if (!record(message) || message.role !== "assistant" || !Array.isArray(message.content))
      continue;
    for (const [blockIndex, block] of message.content.entries()) {
      if (thinking(block) && unsignedOrSynthetic(block)) {
        return dropThinkingSuffix(body, { message: messageIndex, block: blockIndex });
      }
    }
  }
  return body;
}

/**
 * An explicit upstream rejection identifies an unusable block even inside a
 * pending tool cycle. Keep its tool calls/results, but not the rejected signature.
 * Null means no position was supplied; the caller may use its conservative
 * historical-only recovery. An invalid named position must never broaden removal.
 */
export function stripRejectedThinkingSuffix<T>(body: T, message: unknown): T | null {
  if (typeof message !== "string") return null;
  const match = message.match(/messages\.(\d+)\.content\.(\d+)(?:\D|$)/);
  if (!match) return null;
  if (!record(body) || !Array.isArray(body.messages)) return body;
  const position = { message: Number(match[1]), block: Number(match[2]) };
  if (!Number.isSafeInteger(position.message) || !Number.isSafeInteger(position.block)) return body;
  const assistant = body.messages[position.message];
  if (
    !record(assistant) ||
    assistant.role !== "assistant" ||
    !Array.isArray(assistant.content) ||
    !thinking(assistant.content[position.block])
  ) {
    return body;
  }
  return dropThinkingSuffix(body, position);
}
