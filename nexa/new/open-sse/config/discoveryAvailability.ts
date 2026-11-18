/** Upstream placeholder IDs are retained in evidence, never promoted to callable models. */
export function isDisabledDiscoveryModelId(modelId: unknown): boolean {
  return typeof modelId === "string" && /-disabled$/i.test(modelId.trim());
}
