import { isDisabledDiscoveryModelId } from "../../../open-sse/config/discoveryAvailability.ts";

type Row = Record<string, unknown>;

/** Project active, policy-filtered discovery rows into the dashboard's existing wire shape. */
export function projectDashboardSyncedModel(
  provider: string,
  value: unknown,
  alias = provider
): Row | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const model = value as Row;
  const id = typeof model.id === "string" ? model.id.trim() : "";
  if (
    !id ||
    isDisabledDiscoveryModelId(id) ||
    model.isInternal === true ||
    model.visibility === "hide" ||
    model.visibility === "hidden"
  )
    return null;
  const endpoints = model.supportedEndpoints;
  if (
    Array.isArray(endpoints) &&
    endpoints.length > 0 &&
    !endpoints.some((endpoint) => endpoint === "chat" || endpoint === "responses")
  )
    return null;
  const row: Row = {
    provider: alias,
    model: id,
    fullModel: `${alias}/${id}`,
    name: typeof model.name === "string" ? model.name : id,
    alias: id,
    available: true,
  };
  for (const key of [
    "description",
    "apiFormat",
    "targetFormat",
    "supportedEndpoints",
    "supportedThinkingEfforts",
    "defaultThinkingEffort",
    "inputTokenLimit",
    "outputTokenLimit",
    "contextWindow",
    "supportsVision",
    "supportsThinking",
    "supportsTools",
  ])
    if (model[key] !== undefined) row[key] = model[key];
  return row;
}

/** Keep one row per provider/model; keep operator aliases when refreshing metadata. */
export function mergeDashboardModelRows(staticRows: Row[], liveRows: Row[]): Row[] {
  const rows = new Map(staticRows.map((row) => [String(row.fullModel), row]));
  for (const row of liveRows) {
    const key = String(row.fullModel);
    const previous = rows.get(key);
    rows.set(key, {
      ...previous,
      ...row,
      alias: typeof previous?.alias === "string" ? previous.alias : row.alias,
    });
  }
  return [...rows.values()];
}

/** Only the project-scoped Cloud Code roster accepts this field. */
export function buildAntigravityDiscoveryBody(
  url: string,
  project: unknown
): Record<string, string> {
  if (typeof project !== "string" || !project.trim()) return {};
  try {
    return new URL(url).pathname.endsWith(":fetchAvailableModels") ? { project } : {};
  } catch {
    return {};
  }
}
