import fs from "node:fs";
import { mock } from "node:test";

/** Keep release-feed fallback tests independent of the app installed on the test host. */
export function hideInstalledAntigravityApp(): () => void {
  const original = fs.statSync;
  const replacement = mock.method(fs, "statSync", (...args: Parameters<typeof fs.statSync>) => {
    if (String(args[0]).endsWith("/Antigravity.app/Contents/Info.plist")) {
      throw Object.assign(new Error("No installed app in this fixture"), { code: "ENOENT" });
    }
    return original(...args);
  });
  return () => replacement.mock.restore();
}
