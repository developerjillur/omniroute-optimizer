import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const pages = {
  quota: "autoRefreshProviderQuotaInterval",
  "tools/agent-bridge": "/api/tools/agent-bridge/state",
};

export function dashboardChunks(source, page) {
  const match = source.match(/__RSC_MANIFEST\[[^\n]+?\]\s*=\s*({[\s\S]*});?\s*$/);
  if (!match) throw new Error(`Missing dashboard client manifest: ${page}`);
  const manifest = JSON.parse(match[1]);
  const prefix = `static/chunks/app/(dashboard)/dashboard/${page}/`;
  const chunks = [
    ...new Set(
      Object.values(manifest.clientModules ?? {}).flatMap((module) => module.chunks ?? [])
    ),
  ].filter(
    (chunk) =>
      typeof chunk === "string" &&
      chunk.startsWith(prefix) &&
      !chunk.includes("..") &&
      chunk.endsWith(".js")
  );
  if (!chunks.length) throw new Error(`Missing dashboard client chunks: ${page}`);
  return chunks;
}

export function inspectDashboardPage(source, page) {
  const marker = pages[page];
  if (!marker || !source.includes(marker)) {
    throw new Error(`Dashboard page is missing its controls: ${page}`);
  }
}

export function verifyDashboard(target) {
  const archive = fs.statSync(target).isFile();
  const read = (member) =>
    archive
      ? execFileSync("tar", ["-xOf", target, `package/dist/.build/next/${member}`], {
          encoding: "utf8",
          maxBuffer: 32 * 1024 * 1024,
        })
      : fs.readFileSync(path.join(target, member), "utf8");
  for (const page of Object.keys(pages)) {
    const manifest = read(
      `server/app/(dashboard)/dashboard/${page}/page_client-reference-manifest.js`
    );
    const code = dashboardChunks(manifest, page).map(read).join("\n");
    inspectDashboardPage(code, page);
  }
  return { ok: true, pages: Object.keys(pages) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    console.log(JSON.stringify(verifyDashboard(process.argv[2])));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
