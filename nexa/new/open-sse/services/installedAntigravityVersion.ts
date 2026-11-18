export function versionFromAntigravityPlist(text: string): string | null {
  if (text.length > 65536 || new TextEncoder().encode(text).byteLength > 65536) return null;
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
  const runtime = typeof process === "undefined" ? undefined : process;
  if ((options.platform ?? runtime?.platform) !== "darwin") return null;
  // This reader also belongs to shared browser metadata graphs. Node's
  // conditional builtin access keeps filesystem modules out of those bundles.
  const builtin = runtime?.getBuiltinModule?.bind(runtime);
  const fs = builtin?.("fs") as typeof import("node:fs") | undefined;
  const os = builtin?.("os") as typeof import("node:os") | undefined;
  const read =
    options.readText ??
    (fs
      ? (filename: string) => {
          if (fs.statSync(filename).size > 65536) throw new Error("Oversized app metadata");
          return fs.readFileSync(filename, "utf8");
        }
      : undefined);
  if (!read) return null;
  const home = options.home ?? os?.homedir();
  const roots = ["/Applications", ...(home ? [`${home.replace(/\/+$/, "")}/Applications`] : [])];
  for (const root of roots) {
    try {
      const version = versionFromAntigravityPlist(
        read(`${root}/Antigravity.app/Contents/Info.plist`)
      );
      if (version) return version;
    } catch {
      /* An absent app keeps the existing release-feed fallback. */
    }
  }
  return null;
}
