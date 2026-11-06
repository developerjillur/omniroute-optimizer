import { createHash } from "node:crypto";

/** Scope cached quota data to the complete credential, project and client profile. */
export function getAntigravityCacheIdentity(
  accessToken: string,
  projectId: string | null | undefined,
  clientProfile: string
): string {
  return createHash("sha256")
    .update(JSON.stringify([accessToken, projectId ?? null, clientProfile]))
    .digest("hex");
}
