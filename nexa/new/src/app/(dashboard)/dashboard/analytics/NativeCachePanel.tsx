import Card from "@/shared/components/Card";
import type { NativeCacheModel } from "@/lib/usage/nativeCacheHealth";

type Model = NativeCacheModel & { apiEquivalent: { lowerUsd: number; upperUsd: number } | null };
type Alert = { model: string; reason: "rewrite" | "low-cache-read"; measured: number };
const number = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });
const percent = (n: number | null) => (n === null ? "Unknown" : `${(n * 100).toFixed(2)}%`);
const dollars = (n: number) => `$${n.toFixed(4)}`;

export default function NativeCachePanel({
  models,
  hourly,
}: {
  models: Model[];
  hourly?: { alerts: Alert[]; truncated: boolean };
}) {
  if (!models.length) return null;
  return (
    <Card>
      <h3 className="mb-2 text-sm font-semibold text-text-main">Native cache accounting</h3>
      <p className="mb-3 text-xs text-text-muted">
        Read share uses input tokens. A large rewrite writes at least 20,000 tokens and reads fewer,
        excluding the first successful request per conversation prefix and model. Unknown session or
        TTL data stays unknown.
      </p>
      {hourly?.alerts.length ? (
        <ul role="alert" className="mb-3 list-inside list-disc text-sm text-amber-500">
          {hourly.alerts.map((a) => (
            <li key={`${a.model}:${a.reason}`}>
              {a.model}: last hour{" "}
              {a.reason === "rewrite"
                ? `large rewrites ${percent(a.measured)} (above 2%)`
                : `cache read ${percent(a.measured)} (below 80%)`}
            </li>
          ))}
        </ul>
      ) : hourly ? (
        <p className="mb-3 text-xs text-text-muted">No cache threshold breach in the last hour.</p>
      ) : null}
      {hourly?.truncated ? (
        <p className="mb-3 text-xs text-text-muted">Hourly alerts cover the newest 5000 calls.</p>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase text-text-muted">
              {[
                "Model",
                "Read share",
                "Large rewrites",
                "5m writes",
                "1h writes",
                "Unknown TTL",
                "API price equivalent",
              ].map((label) => (
                <th key={label} className="pb-2 pr-4 font-medium">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {models.map((m) => (
              <tr key={m.model} className="border-b border-border/50 last:border-0">
                <td className="py-2 pr-4 font-mono text-xs text-text-main">{m.model}</td>
                <td className="py-2 pr-4 text-text-muted">{percent(m.cacheReadShare)}</td>
                <td className="py-2 pr-4 text-text-muted">
                  {percent(m.largeRewriteShare)}
                  <span className="block text-xs">
                    {number(m.largeRewriteCalls)} / {number(m.rewriteEligibleCalls)} eligible
                    {m.firstRequestUnknownCalls > 0
                      ? ` · ${number(m.firstRequestUnknownCalls)} unknown`
                      : ""}
                  </span>
                </td>
                <td className="py-2 pr-4 text-text-muted">{number(m.cacheCreation5mTotal)}</td>
                <td className="py-2 pr-4 text-text-muted">{number(m.cacheCreation1hTotal)}</td>
                <td className="py-2 pr-4 text-text-muted">{number(m.unknownTtlWriteTotal)}</td>
                <td className="py-2 text-text-muted">
                  {m.apiEquivalent
                    ? m.apiEquivalent.lowerUsd === m.apiEquivalent.upperUsd
                      ? dollars(m.apiEquivalent.lowerUsd)
                      : `${dollars(m.apiEquivalent.lowerUsd)}–${dollars(m.apiEquivalent.upperUsd)}`
                    : "Unknown price"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-text-muted">
        Configured standard API prices provide a comparison, not a subscription bill. Unknown cache
        TTL produces a price range. Weekly percentage is reported by the provider; a fixed
        dollar-to-weekly-point conversion is unavailable.
      </p>
    </Card>
  );
}
