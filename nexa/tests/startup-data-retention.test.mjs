import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import test from "node:test";

const root = process.env.NEXA_SOURCE_ROOT || process.cwd();
const require = createRequire(path.join(root, "package.json"));
const ts = require("typescript");
const filename =
  process.env.NEXA_RETENTION_SOURCE ||
  path.join(root, "src/instrumentation-node.ts");
const source = ts.createSourceFile(
  filename,
  fs.readFileSync(filename, "utf8"),
  ts.ScriptTarget.Latest,
  true,
);
const registration = source.statements.find(
  (node) =>
    ts.isFunctionDeclaration(node) && node.name?.text === "registerNodejs",
);
assert.ok(
  registration?.body,
  "Inspect the actual production startup registration",
);

function calls(name) {
  const found = [];
  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === name
    )
      found.push(node);
    ts.forEachChild(node, visit);
  }
  visit(registration.body);
  return found;
}

function disabledGuard(call) {
  for (
    let node = call.parent;
    node && node !== registration;
    node = node.parent
  ) {
    if (!ts.isIfStatement(node)) continue;
    const condition = node.expression;
    if (
      ts.isPrefixUnaryExpression(condition) &&
      condition.operator === ts.SyntaxKind.ExclamationToken &&
      ts.isCallExpression(condition.operand) &&
      condition.operand.expression.getText(source) ===
        "isBackgroundServicesDisabled" &&
      node.thenStatement.pos <= call.pos &&
      call.end <= node.thenStatement.end
    )
      return true;
  }
  return false;
}

test("startup initializes auditing without forcing unrelated retention defaults or row caps", () => {
  assert.equal(calls("initAuditLog").length, 1);
  assert.equal(
    calls("cleanupExpiredLogs").length,
    0,
    "Boot must not silently prune audit/history using separate seven-day/100000-row defaults",
  );
});

test("disabled background services also suppress affinity startup pruning", () => {
  const affinity = calls("startSessionAccountAffinityCleanup");
  assert.equal(affinity.length, 1, "Keep normal affinity maintenance wired");
  assert.ok(
    affinity.every(disabledGuard),
    "Read-only migration fixtures must retain stored affinity evidence",
  );
});

test("configured retention scheduler remains wired behind its background-services guard", () => {
  const scheduled = calls("startCleanupScheduler");
  assert.equal(scheduled.length, 1);
  assert.ok(scheduled.every(disabledGuard));
  const cleanup = fs.readFileSync(
    path.join(root, "src/lib/db/cleanup.ts"),
    "utf8",
  );
  assert.ok(
    cleanup.includes("autoCleanupEnabled"),
    "Preserve the operator's configured retention policy",
  );
});

test("enabled native Bridge recovery is registered before server readiness", () => {
  const scheduled = calls("scheduleBridgeRecovery");
  const ready = calls("markServerReady");
  assert.equal(
    scheduled.length,
    1,
    "Enabled native Bridge recovery must remain registered at startup",
  );
  assert.equal(ready.length, 1);
  const block = scheduled[0].parent.parent;
  const guard = block.parent;
  assert.ok(ts.isBlock(block) && ts.isIfStatement(guard));
  assert.equal(
    guard.parent,
    registration.body,
    "Recovery belongs to the actual startup path",
  );
  const condition = guard.expression;
  assert.ok(ts.isBinaryExpression(condition));
  assert.equal(condition.left.getText(source), "process.env.MITM_AUTO_RECOVER");
  assert.equal(
    condition.operatorToken.kind,
    ts.SyntaxKind.EqualsEqualsEqualsToken,
  );
  assert.ok(
    ts.isStringLiteral(condition.right) && condition.right.text === "true",
  );
  assert.ok(block.getText(source).includes('import("@/mitm/bootRecovery")'));
  assert.ok(
    scheduled[0].end < ready[0].pos,
    "Schedule recovery before publishing server readiness",
  );
});
