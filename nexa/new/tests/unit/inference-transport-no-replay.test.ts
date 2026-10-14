import assert from "node:assert/strict";
import { test } from "node:test";
import { proxyFetch } from "../../open-sse/utils/proxyFetch.ts";

test("a generation POST is sent once after an ambiguous accepted-request socket failure", async () => {
  let upstreamCalls = 0;
  let fallbackCalls = 0;
  const result = proxyFetch(
    "https://api.example.test/v1/messages",
    {
      method: "POST",
      body: JSON.stringify({
        model: "claude-sonnet-5-5",
        messages: [{ role: "user", content: "Fixture" }],
      }),
    },
    {
      undiciFetch: async () => {
        upstreamCalls++;
        if (upstreamCalls === 1)
          throw Object.assign(new Error("fetch failed after request acceptance"), {
            code: "UND_ERR_SOCKET",
          });
        return new Response("duplicate generation", { status: 200 });
      },
      nativeFetch: async () => {
        fallbackCalls++;
        return new Response("fallback duplicate", { status: 200 });
      },
    }
  );
  await assert.rejects(result);
  assert.equal(upstreamCalls, 1);
  assert.equal(fallbackCalls, 0);
});

test("a caller-cancelled generation POST is not silently reopened", async () => {
  let calls = 0;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error("Fixture cancelled")), 20);
  try {
    await assert.rejects(
      proxyFetch(
        "https://api.example.test/v1/responses",
        {
          method: "POST",
          body: JSON.stringify({ model: "fixture", input: "Fixture" }),
          signal: controller.signal,
        },
        {
          undiciFetch: async (_input, options) => {
            calls++;
            return new Promise<Response>((_resolve, reject) =>
              options?.signal?.addEventListener("abort", () => reject(options.signal?.reason), {
                once: true,
              })
            );
          },
        }
      )
    );
  } finally {
    clearTimeout(timer);
  }
  assert.equal(calls, 1);
});

test("safe read requests still recover on a fresh connection", async () => {
  let calls = 0;
  const response = await proxyFetch(
    "https://api.example.test/v1/models",
    { method: "GET" },
    {
      undiciFetch: async () => {
        calls++;
        if (calls === 1) throw Object.assign(new Error("fetch failed"), { code: "UND_ERR_SOCKET" });
        return new Response("ok", { status: 200 });
      },
    }
  );
  assert.equal(await response.text(), "ok");
  assert.equal(calls, 2);
});
