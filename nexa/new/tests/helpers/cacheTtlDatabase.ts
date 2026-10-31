import test from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), "cache-ttl-db-group-"));
process.env.DATA_DIR = fixtureDir;
process.env.DISABLE_SQLITE_AUTO_BACKUP = "true";

export const core = await import("../../src/lib/db/core.ts");
export const history = await import("../../src/lib/usage/usageHistory.ts");
export const queries = await import("../../src/lib/db/usageAnalytics.ts");
const { computeCostFromPricing } = await import("../../src/lib/usage/costCalculator.ts");
export const { updatePricing } = await import("../../src/lib/db/settings/pricing.ts");
test.after(() => core.resetDbInstance());

export const rates = {
  input: 2,
  output: 10,
  cached: 0.2,
  cache_creation: 2.5,
  cache_creation_1h: 4,
};
let sequence = 0;

export async function seed(
  model: string,
  ttl: { cacheCreation5m?: number | null; cacheCreation1h?: number | null } = {},
  timestamp = new Date(Date.now() - 2000 + sequence++).toISOString()
) {
  await history.saveRequestUsage({
    provider: "openai",
    model,
    connectionId: `connection-${model}`,
    apiKeyId: `key-${model}`,
    tokens: { input: 1_000_000, output: 0, cacheCreation: 1_000_000, ...ttl },
    success: true,
    timestamp,
  });
}

export function rowCost(row: Record<string, unknown>) {
  return computeCostFromPricing(
    rates,
    {
      input: Number(row.promptTokens),
      output: Number(row.completionTokens),
      cacheRead: Number(row.cacheReadTokens),
      cacheCreation: Number(row.cacheCreationTokens),
      cacheCreation5m: Number(row.cacheCreation5mTokens ?? 0),
      cacheCreation1h: Number(row.cacheCreation1hTokens ?? 0),
      reasoning: Number(row.reasoningTokens),
    },
    { provider: "openai", model: String(row.model), longContext: row.longContext === 1 }
  );
}

export async function seedMixed(model: string, timestamps?: string[]) {
  await updatePricing({ openai: { [model]: rates } });
  await seed(model, { cacheCreation5m: 0, cacheCreation1h: 1_000_000 }, timestamps?.[0]);
  await seed(model, { cacheCreation5m: 1_000_000, cacheCreation1h: 0 }, timestamps?.[1]);
  await seed(model, {}, timestamps?.[2]);
}

export function sourceForModel(model: string) {
  const source = queries.buildUnifiedSource({
    sinceIso: null,
    untilIso: null,
    rawCutoffDate: "2000-01-01",
    apiKeyWhere: "model = @fixtureModel",
    apiKeyParams: { fixtureModel: model },
  });
  return source;
}
