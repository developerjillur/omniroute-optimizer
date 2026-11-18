import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export function versionFromAntigravityPlist(text: string): string | null {
  if (Buffer.byteLength(text) > 65536) return null;
  const version = text.match(
    /<key>CFBundleShortVersionString<\/key>\s*<string>([^<]+)<\/string>/
  )?.[1];
  return version && /^\d+\.\d+\.\d+$/.test(version.trim()) ? version.trim() : null;
}

/** Read only the official installed app metadata; never rewrite or launch the app. */
export function readInstalledAntigravityIdeVersion(
  options: {
    platform?: string;
    home?: string;
    readText?: (filename: string) => string;
  } = {}
): string | null {
  if ((options.platform ?? process.platform) !== "darwin") return null;
  const read =
    options.readText ??
    ((filename) => {
      if (fs.statSync(filename).size > 65536) throw new Error("Oversized app metadata");
      return fs.readFileSync(filename, "utf8");
    });
  for (const root of ["/Applications", path.join(options.home ?? os.homedir(), "Applications")]) {
    try {
      const version = versionFromAntigravityPlist(
        read(path.join(root, "Antigravity.app/Contents/Info.plist"))
      );
      if (version) return version;
    } catch {
      /* An absent app keeps the existing release-feed fallback. */
    }
  }
  return null;
}
