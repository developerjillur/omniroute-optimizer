import assert from "node:assert/strict";
import test from "node:test";
import { rawUsage } from "../helpers/cacheTtlFixture.ts";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "cache-ttl-stream-"));
process.env.DISABLE_SQLITE_AUTO_BACKUP = "true";

const { createSSEStream } = await import("../../open-sse/utils/stream.ts");
const { FORMATS } = await import("../../open-sse/translator/formats.ts");
const core = await import("../../src/lib/db/core.ts");
test.after(() => core.resetDbInstance());

test("late streamed TTL reaches internal metering while client frames stay unchanged", async () => {
  let completed: Record<string, unknown> | undefined;
  const body = {
    model: "claude-sonnet-5-5",
    thread: { type: "continue", previous_message_id: "msg_ttl_previous" },
    messages: [{ role: "user", content: "fixture" }],
  };
  const startUsage = { ...rawUsage, output_tokens: 0, cache_creation: undefined };
  const deltaUsage = { output_tokens: 7, cache_creation: rawUsage.cache_creation };
  const stream = createSSEStream({
    mode: "passthrough",
    sourceFormat: FORMATS.CLAUDE,
    clientResponseFormat: FORMATS.CLAUDE,
    provider: "claude",
    model: body.model,
    body,
    onComplete: (result) => {
      completed = result;
    },
  });
  const events = [
    {
      type: "message_start",
      message: {
        type: "message",
        id: "msg_ttl_fixture",
        role: "assistant",
        model: body.model,
        content: [],
        usage: startUsage,
      },
    },
    { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } },
    {
      type: "content_block_delta",
      index: 0,
      delta: { type: "text_delta", text: "fixture result" },
    },
    { type: "content_block_stop", index: 0 },
    { type: "message_delta", delta: { stop_reason: "end_turn" }, usage: deltaUsage },
    { type: "message_stop" },
  ];
  const reading = new Response(stream.readable).text();
  const writer = stream.writable.getWriter();
  for (const event of events)
    await writer.write(
      new TextEncoder().encode(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`)
    );
  await writer.close();
  const frames = (await reading)
    .split("\n")
    .filter((line) => line.startsWith("data: "))
    .map((line) => JSON.parse(line.slice(6)));
  assert.deepEqual(
    frames.find((frame) => frame.type === "message_start").message.usage,
    JSON.parse(JSON.stringify(startUsage))
  );
  assert.deepEqual(frames.find((frame) => frame.type === "message_delta").usage, deltaUsage);
  const metered = completed?.usage as Record<string, number>;
  assert.equal(metered.prompt_tokens, 112);
  assert.equal(metered.cacheCreation5m, 40);
  assert.equal(metered.cacheCreation1h, 60);
});
