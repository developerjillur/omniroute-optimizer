"use strict";

const LOCAL_CLAUDE_MODEL = /^(?:cc|claude)\/(claude-[A-Za-z0-9._-]+)$/;

/** Remove only local routing metadata before the native provider captures tools. */
function prepareMappedClaudeBody(body, agentId) {
  if (
    agentId !== "claude-code" ||
    !body ||
    typeof body !== "object" ||
    typeof body.model !== "string" ||
    !LOCAL_CLAUDE_MODEL.test(body.model) ||
    !Array.isArray(body.tools)
  )
    return body;
  let changed = false;
  const tools = body.tools.map((tool) => {
    if (!tool || typeof tool !== "object" || typeof tool.model !== "string") return tool;
    const match = tool.model.match(LOCAL_CLAUDE_MODEL);
    if (!match) return tool;
    changed = true;
    return { ...tool, model: match[1] };
  });
  return changed ? { ...body, tools } : body;
}

module.exports = { prepareMappedClaudeBody };
