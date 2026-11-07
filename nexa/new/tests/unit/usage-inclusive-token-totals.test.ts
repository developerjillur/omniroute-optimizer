import assert from "node:assert/strict";
import { test } from "node:test";
import { DatabaseSync } from "node:sqlite";
import { buildApiKeySelfServiceStatus } from "../../src/lib/usage/apiKeySelfService.ts";
import { getDbInstance } from "../../src/lib/db/core.ts";
import { getMonthlyProviderTokensForConnection } from "../../src/lib/usage/usageStats.ts";
import { extractUsage } from "../../open-sse/utils/usageTracking.ts";
import { getAntigravityCacheIdentity } from "../../open-sse/services/usage/antigravityCacheIdentity.ts";
import { fetchAntigravityUserQuotaSummaryCached } from "../../open-sse/services/usage/antigravityWeeklyQuota.ts";

const { getUsageForProvider } = await import("../../open-sse/services/usage.ts");

const metadata = {
  id: "inclusive-token-owner",
  name: "Usage fixture",
  scopes: ["self:usage"],
  allowedConnections: [],
};

const budget = {
  budget: null,
  totalCostMonth: 12.34,
  totalCostPeriod: 0,
  activeLimitUsd: 0,
  resetInterval: null,
  budgetResetAt: null,
  periodStartAt: null,
  nextResetAt: null,
  warningThreshold: null,
};

for (const fixture of [
  {
    name: "Responses cached input and reasoning",
    input: 200_000,
    output: 1_000,
    read: 190_000,
    write: 0,
    reasoning: 700,
  },
  {
    name: "native Claude cache reads and writes",
    input: 104_002,
    output: 9,
    read: 100_000,
    write: 4_000,
    reasoning: 3,
  },
  { name: "uncached input", input: 900, output: 30, read: 0, write: 0, reasoning: 0 },
]) {
  test(`self-service counts ${fixture.name} once and keeps the breakdown`, async () => {
    const db = new DatabaseSync(":memory:");
    try {
      db.exec(`CREATE TABLE usage_history (
        api_key_id TEXT, timestamp TEXT, tokens_input INTEGER, tokens_output INTEGER,
        tokens_cache_read INTEGER, tokens_cache_creation INTEGER, tokens_reasoning INTEGER
      )`);
      const insert = db.prepare("INSERT INTO usage_history VALUES (?, ?, ?, ?, ?, ?, ?)");
      insert.run(
        metadata.id,
        "2026-11-05T12:00:00.000Z",
        fixture.input,
        fixture.output,
        fixture.read,
        fixture.write,
        fixture.reasoning
      );
      insert.run("another-owner", "2026-11-05T12:00:00.000Z", 999_999, 999, 900_000, 500, 900);
      insert.run(metadata.id, "2026-10-05T12:00:00.000Z", 888_888, 888, 800_000, 400, 800);
      const result = await buildApiKeySelfServiceStatus(metadata, {
        now: () => Date.UTC(2026, 10, 6),
        getCostSummary: () => budget,
        checkBudget: () => ({ allowed: true }),
        getDbInstance: () => ({
          prepare: (sql: string) => {
            const statement = db.prepare(sql);
            return {
              get: (...params: unknown[]) => {
                assert.ok(params.every((value) => typeof value === "string"));
                return statement.get(...(params as string[]));
              },
            };
          },
        }),
        getProviderConnectionById: async () => null,
        getProviderConnections: async () => [],
        fetchAndPersistProviderLimits: async () => {
          throw new Error("Usage totals must not fetch provider quota or generate a response");
        },
      });
      assert.equal(result.usage.tokens.totalTokens, fixture.input + fixture.output);
      assert.equal(result.usage.tokens.inputTokens, fixture.input);
      assert.equal(result.usage.tokens.outputTokens, fixture.output);
      assert.equal(result.usage.tokens.cacheReadTokens, fixture.read);
      assert.equal(result.usage.tokens.cacheCreationTokens, fixture.write);
      assert.equal(result.usage.tokens.reasoningTokens, fixture.reasoning);
      assert.equal(
        result.usage.cost.usedUsd,
        12.34,
        "token display must not rewrite a measured cost"
      );
    } finally {
      db.close();
    }
  });
}

test("monthly self-tracked provider quotas count inclusive tokens once within their connection and month", (t) => {
  const db = getDbInstance();
  const connection = "inclusive-monthly-connection";
  const key = "inclusive-monthly-fixture";
  const now = new Date();
  const stamp = now.toISOString();
  const previousMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 15)
  ).toISOString();
  const insert = db.prepare(`INSERT INTO usage_history
    (provider, model, connection_id, api_key_id, timestamp, tokens_input, tokens_output,
     tokens_cache_read, tokens_cache_creation, tokens_reasoning, status, success)
    VALUES (?, 'inclusive-model', ?, ?, ?, 200000, 1000, 190000, 4000, 700, 'success', 1)`);
  t.after(() => db.prepare("DELETE FROM usage_history WHERE api_key_id = ?").run(key));
  insert.run("mimo", connection, key, stamp);
  insert.run("mimo", connection, key, stamp);
  insert.run("another-provider", connection, key, stamp);
  insert.run("mimo", "another-connection", key, stamp);
  insert.run("mimo", connection, key, previousMonth);
  assert.equal(getMonthlyProviderTokensForConnection("mimo", connection), 402_000);
  assert.equal(getMonthlyProviderTokensForConnection("", connection), 0);
  assert.equal(getMonthlyProviderTokensForConnection("mimo", ""), 0);
});

test("Antigravity local quota fallback counts normalized reasoning once within its account model and window", async (t) => {
  const db = getDbInstance();
  const key = "inclusive-antigravity-fixture";
  const connection = "inclusive-antigravity-connection";
  const model = "gemini-3.8-flash-high";
  const now = Date.now();
  const resetAt = new Date(now + 60 * 60000).toISOString();
  const usage = extractUsage({
    response: {
      usageMetadata: {
        promptTokenCount: 1000,
        candidatesTokenCount: 100,
        thoughtsTokenCount: 900,
        totalTokenCount: 2000,
      },
    },
  });
  assert.equal(usage?.prompt_tokens, 1000);
  assert.equal(usage?.completion_tokens, 1000, "normalized output already includes thoughts");
  assert.equal(usage?.reasoning_tokens, 900, "reasoning remains a separate breakdown");
  const insert = db.prepare(`INSERT INTO usage_history
    (provider, model, connection_id, api_key_id, timestamp, tokens_input, tokens_output,
     tokens_cache_read, tokens_reasoning, status, success)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  t.after(() => db.prepare("DELETE FROM usage_history WHERE api_key_id = ?").run(key));
  insert.run(
    "antigravity",
    model,
    connection,
    key,
    new Date(now - 60000).toISOString(),
    usage!.prompt_tokens,
    usage!.completion_tokens,
    800,
    usage!.reasoning_tokens,
    "success",
    1
  );
  for (const [provider, rowModel, owner, stamp, success] of [
    ["antigravity", model, "another-connection", now - 60000, 1],
    ["antigravity", "another-model", connection, now - 60000, 1],
    ["agy", model, connection, now - 60000, 1],
    ["antigravity", model, connection, now - 6 * 60 * 60000, 1],
    ["antigravity", model, connection, Date.parse(resetAt), 1],
    ["antigravity", model, connection, now - 60000, 0],
  ] as const) {
    insert.run(
      provider,
      rowModel,
      owner,
      key,
      new Date(stamp).toISOString(),
      900000,
      100000,
      800000,
      90000,
      success ? "success" : "error",
      success
    );
  }
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (url.includes("retrieveUserQuota")) {
      return new Response("{}", { status: 404 });
    }
    return new Response(
      JSON.stringify({
        models: { [model]: { quotaInfo: { remainingFraction: 1.0, resetTime: resetAt } } },
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  });
  const result = await getUsageForProvider(
    {
      id: connection,
      provider: "antigravity",
      accessToken: "inclusive-fake-token",
      providerSpecificData: {},
      projectId: undefined,
    },
    { forceRefresh: true }
  );
  const quota = (result as { quotas?: Record<string, { quotaSource?: string; used?: number }> })
    .quotas?.[model];
  assert.ok(quota, "the requested model must retain its quota entry");
  assert.equal(quota.quotaSource, "localUsageHistory");
  assert.equal(quota.used, 2, "1000 input plus 1000 inclusive output is two units, not three");
  const saved = db
    .prepare(
      "SELECT tokens_output, tokens_reasoning FROM usage_history WHERE api_key_id = ? AND tokens_input = 1000"
    )
    .get(key) as { tokens_output: number; tokens_reasoning: number };
  assert.ok(saved);
  assert.equal(saved.tokens_output, 1000);
  assert.equal(saved.tokens_reasoning, 900);
});

test("Antigravity quota caches isolate credentials sharing a prefix and preserve same-account reuse", async (t) => {
  const model = "gemini-3.8-flash-high";
  const prefix = "shared-prefix-1234567890";
  const firstToken = `${prefix}-first`;
  const secondToken = `${prefix}-second`;
  const identity = getAntigravityCacheIdentity(firstToken, null, "ide");
  assert.match(identity, /^[a-f0-9]{64}$/);
  assert.equal(identity.includes(prefix), false);
  assert.notEqual(identity, getAntigravityCacheIdentity(secondToken, null, "ide"));
  assert.notEqual(identity, getAntigravityCacheIdentity(firstToken, "default", "ide"));
  assert.notEqual(identity, getAntigravityCacheIdentity(firstToken, null, "cli"));
  assert.equal(identity, getAntigravityCacheIdentity(firstToken, undefined, "ide"));
  const resetAt = new Date(Date.now() + 60 * 60000).toISOString();
  let modelRequests = 0;
  let summaryRequests = 0;
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const headers = new Headers(init?.headers);
    const accountMarker = headers.get("authorization")?.endsWith("-second") ? "second" : "first";
    if (url.includes("retrieveUserQuotaSummary")) {
      summaryRequests += 1;
      return new Response(JSON.stringify({ accountMarker }), { status: 200 });
    }
    if (url.includes("retrieveUserQuota")) return new Response("{}", { status: 404 });
    if (url.includes("loadCodeAssist")) {
      return new Response(JSON.stringify({ accountMarker }), { status: 200 });
    }
    if (url.includes("fetchAvailableModels")) modelRequests += 1;
    const remainingFraction = accountMarker === "second" ? 0.8 : 0.2;
    return new Response(
      JSON.stringify({
        models: { [model]: { quotaInfo: { remainingFraction, resetTime: resetAt } } },
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  });
  const connection = (id: string, accessToken: string) => ({
    id,
    provider: "antigravity",
    accessToken,
    providerSpecificData: {},
    projectId: undefined,
  });
  const first = await getUsageForProvider(connection("cache-first", firstToken));
  const second = await getUsageForProvider(connection("cache-second", secondToken));
  const again = await getUsageForProvider(connection("cache-first", firstToken));
  const remaining = (result: unknown) =>
    (result as { quotas?: Record<string, { remainingPercentage?: number }> }).quotas?.[model]
      ?.remainingPercentage;
  assert.equal(remaining(first), 20);
  assert.equal(
    remaining(second),
    80,
    "another credential must not inherit the first account's quota"
  );
  assert.equal(remaining(again), 20);
  assert.equal(modelRequests, 2, "same-account reads retain the existing cache benefit");
  const subscription = (result: unknown) =>
    (result as { subscriptionInfo?: { accountMarker?: string } }).subscriptionInfo?.accountMarker;
  assert.equal(subscription(first), "first");
  assert.equal(subscription(second), "second");
  const readSummary = async (token: string) =>
    (await fetchAntigravityUserQuotaSummaryCached(token, "identity-check", "ide")) as {
      accountMarker?: string;
    };
  const summaryCallsBefore = summaryRequests;
  assert.equal((await readSummary(firstToken)).accountMarker, "first");
  assert.equal((await readSummary(secondToken)).accountMarker, "second");
  assert.equal((await readSummary(firstToken)).accountMarker, "first");
  assert.equal(summaryRequests - summaryCallsBefore, 2);
});
