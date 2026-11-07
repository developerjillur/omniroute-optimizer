import { createHash } from "node:crypto";

/** A preserved patch may be retired only for the exact reviewed base and bytes. */
export function verifyRetiredPatches(registry, baseSha, patchNames, readPatch, readTargetBlob) {
  if (!registry || registry.upstreamBase !== baseSha || !/^[a-f0-9]{40}$/.test(baseSha)) {
    throw new Error("Retired patches require their exact reviewed upstream base");
  }
  if (!Array.isArray(registry.patches)) throw new Error("Invalid retired patch registry");
  const retired = new Set();
  for (const item of registry.patches) {
    if (
      !item ||
      typeof item.patch !== "string" ||
      !/^[a-zA-Z0-9_.-]+\.patch$/.test(item.patch) ||
      !patchNames.includes(item.patch) ||
      retired.has(item.patch)
    ) {
      throw new Error("Unknown or duplicate retired patch");
    }
    if (
      typeof item.target !== "string" ||
      item.target.startsWith("/") ||
      item.target.split("/").some((part) => !part || part === "..") ||
      !/^[a-f0-9]{40}$/.test(item.upstreamBlob) ||
      !/^[a-f0-9]{64}$/.test(item.patchSha256) ||
      !item.reason?.trim()
    ) {
      throw new Error(`Invalid retired patch proof: ${item.patch}`);
    }
    const data = readPatch(item.patch);
    const target = data.toString().match(/^\+\+\+ b\/(.+)$/m)?.[1];
    if (
      target !== item.target ||
      createHash("sha256").update(data).digest("hex") !== item.patchSha256 ||
      readTargetBlob(item.target) !== item.upstreamBlob
    ) {
      throw new Error(`Retired patch evidence changed: ${item.patch}`);
    }
    retired.add(item.patch);
  }
  return retired;
}
