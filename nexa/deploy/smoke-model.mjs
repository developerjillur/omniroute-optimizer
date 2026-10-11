const DEFAULT_SMOKE_MODEL = "cc/claude-opus-5-5";

export function smokeModel(env = process.env) {
  if (env.NEXA_SMOKE_MODEL === undefined) return DEFAULT_SMOKE_MODEL;
  const model = env.NEXA_SMOKE_MODEL.trim();
  if (!/^[a-z0-9][a-z0-9_-]*\/[a-zA-Z0-9][a-zA-Z0-9._:-]*$/.test(model))
    throw Error("NEXA_SMOKE_MODEL must name one explicit provider/model");
  return model;
}
