/** Haiku 5.5 accepts effort; older Haiku models still use the legacy request contract. */
export function isClaudeHaiku55(model: unknown): boolean {
  return (
    typeof model === "string" && /(?:^|[\/._:-])claude-haiku-5[.-]5(?:$|[\/._:@-])/i.test(model)
  );
}
