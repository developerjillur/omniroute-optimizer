"use strict";

function shouldBufferNativeThinking(body, agentId) {
  return (
    agentId === "claude-code" &&
    body?.stream === false &&
    /^(?:cc|claude|anthropic)\//.test(String(body.model || "")) &&
    ["adaptive", "enabled", "between_tools"].includes(body.thinking?.type)
  );
}

function failure(message, code = "agent_bridge_incomplete_response", statusCode = 502) {
  return Object.assign(new Error(message), { code, statusCode, retryable: false });
}

function hasUsableContent(message) {
  return message.content.some((block) => {
    if (!block || typeof block !== "object") return false;
    if (["text", "thinking", "compaction"].includes(block.type))
      return [block.text, block.thinking, block.content].some(
        (value) => typeof value === "string" && value.trim().length > 0
      );
    return (
      ["tool_use", "server_tool_use", "mcp_tool_use"].includes(block.type) &&
      typeof block.id === "string" &&
      block.id.length > 0 &&
      typeof block.name === "string" &&
      block.name.length > 0
    );
  });
}

/** Accumulate one native response, preserving opaque signatures and tool JSON. */
async function bufferAnthropicMessage(response, { maxBytes = 32 * 1024 * 1024 } = {}) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > 32 * 1024 * 1024)
    throw new RangeError("Buffered response limit must be 1..33554432 bytes");
  if (!response.body) throw failure("The selected model returned no response body.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const blocks = new Map(),
    inputs = new Map(),
    openBlocks = new Set();
  const jsonResponse = /^application\/json(?:\s*;|$)/i.test(
    response.headers.get("content-type") || ""
  );
  let bytes = 0,
    pending = "",
    message = null,
    terminal = false;
  const finishInput = (index) => {
    if (!inputs.has(index)) return;
    try {
      if (inputs.get(index).trim()) blocks.get(index).input = JSON.parse(inputs.get(index));
    } catch {
      throw failure("The selected model returned incomplete tool arguments.");
    }
    inputs.delete(index);
  };
  const inspect = (frame) => {
    const data = frame
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n");
    if (!data || data === "[DONE]") return;
    let event;
    try {
      event = JSON.parse(data);
    } catch {
      throw failure("The selected model returned an invalid event.");
    }
    if (event.type === "error") {
      const error = event.error || {};
      const status =
        error.type === "invalid_request_error"
          ? 400
          : error.type === "rate_limit_error"
            ? 429
            : 502;
      throw failure(
        String(error.message || "The selected model rejected the request."),
        "agent_bridge_upstream_error",
        status
      );
    }
    if (event.type === "message_start") {
      if (message) throw failure("The selected model returned multiple message envelopes.");
      if (
        event.message?.type !== "message" ||
        event.message?.role !== "assistant" ||
        !/^msg_[A-Za-z0-9_-]{1,200}$/.test(String(event.message?.id || ""))
      )
        throw failure("The selected model returned an invalid message envelope.");
      message = { ...event.message, content: [] };
    } else if (event.type === "message_stop") {
      if (!message) throw failure("The selected model ended before starting a message.");
      if (openBlocks.size)
        throw failure("The selected model ended with incomplete content blocks.");
      terminal = true;
    } else if (event.type === "message_delta" && message) {
      Object.assign(message, event.delta || {});
      if (event.usage) message.usage = { ...message.usage, ...event.usage };
      for (const [key, value] of Object.entries(event))
        if (!["type", "delta", "usage"].includes(key)) message[key] = value;
    } else if (event.type === "content_block_start") {
      const index = event.index;
      if (!message || !Number.isInteger(index) || index < 0 || index > 4095 || blocks.has(index))
        throw failure("The selected model returned an invalid content block.");
      blocks.set(index, { ...event.content_block });
      openBlocks.add(index);
    } else if (event.type === "content_block_delta") {
      const block = blocks.get(event.index),
        delta = event.delta || {};
      if (!block || !openBlocks.has(event.index))
        throw failure("The selected model returned a delta without an open content block.");
      if (delta.type === "text_delta") block.text = (block.text || "") + (delta.text || "");
      else if (delta.type === "thinking_delta")
        block.thinking = (block.thinking || "") + (delta.thinking || "");
      else if (delta.type === "signature_delta")
        block.signature = (block.signature || "") + (delta.signature || "");
      else if (delta.type === "input_json_delta")
        inputs.set(event.index, (inputs.get(event.index) || "") + (delta.partial_json || ""));
      else if (delta.type === "citations_delta") (block.citations ||= []).push(delta.citation);
      else if (delta.type === "compaction_delta")
        block.content = (block.content || "") + (delta.content || "");
      else
        throw failure(
          "The selected model returned an unsupported content delta.",
          "agent_bridge_unsupported_delta"
        );
    } else if (event.type === "content_block_stop") {
      if (!openBlocks.has(event.index))
        throw failure("The selected model closed an unknown content block.");
      finishInput(event.index);
      openBlocks.delete(event.index);
    }
  };
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes)
        throw failure(
          "The selected model response exceeded the buffered size limit.",
          "agent_bridge_response_too_large"
        );
      pending += decoder.decode(value, { stream: true });
      if (jsonResponse) continue;
      let boundary;
      while ((boundary = pending.search(/\r?\n\r?\n/)) >= 0) {
        const frame = pending.slice(0, boundary);
        pending = pending.slice(boundary).replace(/^\r?\n\r?\n/, "");
        inspect(frame);
        if (terminal) break;
      }
      if (terminal) break;
    }
    pending += decoder.decode();
    if (jsonResponse) {
      try {
        message = JSON.parse(pending);
      } catch {
        throw failure("The selected model returned an incomplete JSON message.");
      }
      if (
        message?.type !== "message" ||
        message?.role !== "assistant" ||
        !/^msg_[A-Za-z0-9_-]{1,200}$/.test(String(message?.id || "")) ||
        !Array.isArray(message?.content) ||
        !message?.stop_reason
      )
        throw failure("The selected model returned an incomplete JSON message.");
      if (!hasUsableContent(message))
        throw failure("The selected model returned no usable output.");
      return message;
    }
    if (!terminal && pending.trim()) inspect(pending);
    if (!terminal || !message)
      throw failure(
        "The selected model response was interrupted before completion. Retry once; the conversation is preserved."
      );
    for (const index of inputs.keys()) finishInput(index);
    message.content = [...blocks.entries()].sort(([a], [b]) => a - b).map(([, block]) => block);
    if (!hasUsableContent(message)) throw failure("The selected model returned no usable output.");
    return message;
  } catch (error) {
    const code = error?.cause?.code || error?.code;
    if (
      ["AbortError", "TimeoutError"].includes(error?.name) ||
      ["UND_ERR_HEADERS_TIMEOUT", "UND_ERR_BODY_TIMEOUT"].includes(code)
    )
      throw failure(
        "The selected model exceeded the bounded response deadline. Retry once; the conversation is preserved.",
        "agent_bridge_timeout",
        504
      );
    if (String(code || "").startsWith("agent_bridge_")) throw error;
    throw failure(
      "The selected model response was interrupted before completion. Retry once; the conversation is preserved."
    );
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

module.exports = { shouldBufferNativeThinking, bufferAnthropicMessage };
