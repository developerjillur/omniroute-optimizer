import test from "node:test";
import assert from "node:assert/strict";
import { rates, updatePricing } from "../../helpers/cacheTtlDatabase.ts";
const { createCombo } = await import("../../../src/lib/db/combos.ts");
const { saveCallLog } = await import("../../../src/lib/usage/callLogs.ts");
const { getComboForecastUsageRows } = await import("../../../src/lib/db/comboForecast.ts");
const { buildComboForecastResponse } = await import("../../../src/lib/usage/comboForecast.ts");

test("combo forecasts price known TTL from call logs while legacy writes remain unclassified", async () => {
  const model = "fixture-ttl-forecast";
  const comboName = "fixture-ttl-forecast-combo";
  await updatePricing({ openai: { [model]: rates } });
  const combo = await createCombo({
    name: comboName,
    strategy: "weighted",
    models: [
      {
        kind: "model",
        providerId: "openai",
        model: `openai/${model}`,
        connectionId: "fixture-ttl-forecast-connection",
      },
    ],
  });
  const splits = [
    { cacheCreation5mTokens: 0, cacheCreation1hTokens: 1_000_000 },
    { cacheCreation5mTokens: 1_000_000, cacheCreation1hTokens: 0 },
    {},
  ];
  for (const [index, split] of splits.entries()) {
    await saveCallLog({
      id: `fixture-ttl-forecast-${index}`,
      timestamp: new Date(Date.now() - 1000).toISOString(),
      status: 200,
      provider: "openai",
      model,
      connectionId: "fixture-ttl-forecast-connection",
      comboName,
      tokens: {
        prompt_tokens: 1_000_000,
        completion_tokens: 0,
        cache_creation_input_tokens: 1_000_000,
      },
      ...split,
    });
  }
  const rows = getComboForecastUsageRows({ since: "2000-01-01T00:00:00.000Z", comboName });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].cacheCreationTokens, 3_000_000);
  assert.equal(rows[0].cacheCreation5mTokens, 1_000_000);
  assert.equal(rows[0].cacheCreation1hTokens, 1_000_000);
  const forecast = await buildComboForecastResponse({
    range: "7d",
    horizon: "7d",
    comboId: String(combo.id),
  });
  assert.equal(forecast.combos.length, 1);
  assert.equal(forecast.combos[0].history.requests, 3);
  assert.equal(forecast.combos[0].history.costUsd, 9);
});
