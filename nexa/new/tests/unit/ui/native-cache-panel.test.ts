import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import NativeCachePanel from "../../../src/app/(dashboard)/dashboard/analytics/NativeCachePanel.tsx";
import { summarizeNativeCacheHealth } from "../../../src/lib/usage/nativeCacheHealth.ts";

test("cache panel distinguishes unknown evidence from zero and alerts from price estimates", () => {
  const models = summarizeNativeCacheHealth([
    { model: "claude-sonnet-5-5", inputTokens: 30000, cacheRead: 0, cacheCreation: 30000 },
  ]).models.map((m) => ({ ...m, apiEquivalent: { lowerUsd: 0.075, upperUsd: 0.12 } }));
  const html = renderToStaticMarkup(
    createElement(NativeCachePanel, {
      models,
      hourly: {
        alerts: [{ model: "claude-sonnet-5-5", reason: "low-cache-read", measured: 0 }],
        truncated: true,
      },
    })
  );
  assert.match(html, /Unknown/);
  assert.match(html, /1 unknown/);
  assert.match(html, /role="alert"/);
  assert.match(html, /below 80%/);
  assert.match(html, /\$0\.0750–\$0\.1200/);
  assert.match(html, /newest 5000/);
  assert.match(html, /not a subscription bill/);
});

test("empty cache accounting renders no fabricated rates or prices", () => {
  assert.equal(renderToStaticMarkup(createElement(NativeCachePanel, { models: [] })), "");
});
