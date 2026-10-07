import { AsyncLocalStorage } from "node:async_hooks";

// This context is entered only by management model tests, never by an HTTP header.
// A probe of one connection must not test a session-affinity pin or a fallback sibling.
export type ModelTestScope = {
  connectionId: string | null;
  selectedConnectionId: string | null;
};
const modelTestScope = new AsyncLocalStorage<ModelTestScope>();

export function createModelTestScope(connectionId?: string): ModelTestScope {
  return { connectionId: connectionId?.trim() || null, selectedConnectionId: null };
}

export function runWithModelTestScope<T>(
  connectionId: string | undefined | ModelTestScope,
  fn: () => Promise<T>
): Promise<T> {
  return modelTestScope.run(
    typeof connectionId === "object" ? connectionId : createModelTestScope(connectionId),
    fn
  );
}

export function recordModelTestSelection(connectionId: string): void {
  const scope = modelTestScope.getStore();
  if (!scope) return;
  if (scope.connectionId && scope.connectionId !== connectionId) {
    throw new Error("Model test selected an unexpected connection");
  }
  scope.selectedConnectionId = connectionId;
}

export function getModelTestConnectionId(): string | null {
  return modelTestScope.getStore()?.connectionId ?? null;
}

export function restrictModelTestConnections<T extends { id?: unknown }>(connections: T[]): T[] {
  const connectionId = getModelTestConnectionId();
  return connectionId
    ? connections.filter((connection) => connection.id === connectionId)
    : connections;
}
