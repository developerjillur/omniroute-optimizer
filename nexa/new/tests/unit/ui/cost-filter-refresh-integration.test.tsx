// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("range=all&apiKeyIds=old-key&groupBy=model"),
}));
vi.mock("@/lib/display/useProviderNodeMap", () => ({
  useProviderNodeMap: () => ({}),
  resolveProviderName: (id: string) => id,
}));
vi.mock("@/app/(dashboard)/dashboard/costs/components/CostCharts", () => ({
  CostTrendCard: () => null,
  ProviderSpendCard: () => null,
  WeeklyPatternCard: () => null,
}));
vi.mock("@/shared/components", () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  EmptyState: ({ description }: { description: string }) => <div>{description}</div>,
  SegmentedControl: () => null,
  CardSkeleton: () => <div>Loading</div>,
}));

const { default: CostOverviewTab } =
  await import("@/app/(dashboard)/dashboard/costs/CostOverviewTab");
let root: Root;
let container: HTMLDivElement;
let cost = 10;
let requests: string[];

beforeEach(() => {
  cost = 10;
  requests = [];
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string) => {
      requests.push(String(input));
      const data = input.includes("/api/usage/analytics")
        ? {
            summary: {
              totalCost: cost,
              totalRequests: 1,
              totalTokens: 20,
              promptTokens: 10,
              completionTokens: 10,
              fallbackCount: 0,
              fallbackRatePct: 0,
              requestedModelCoveragePct: 100,
              streak: 0,
            },
            byProvider: [],
            byModel: [],
            byAccount: [],
            dailyTrend: [],
            weeklyPattern: [],
            activityMap: {},
            byApiKey: [{ apiKeyId: "old-key", apiKeyName: "local-default", requests: 1, cost }],
            presetSummaries: {
              "1d": { totalCost: cost },
              "7d": { totalCost: cost },
              "30d": { totalCost: cost },
            },
          }
        : null;
      return new Response(JSON.stringify(data), { status: 200 });
    })
  );
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

it("shows the actual key filter and offers an all-key view without changing history", async () => {
  await act(async () => {
    root.render(<CostOverviewTab />);
  });
  const filtered = requests.find((url) => url.startsWith("/api/usage/analytics"))!;
  const params = new URL(filtered, "http://localhost").searchParams;
  expect(params.get("apiKeyIds")).toBe("old-key");
  expect(params.get("includeFlatRateEstimates")).toBe("true");
  expect(container.textContent).toContain("API Key: local-default");
  const all = container.querySelector('a[aria-label="All API Key"]')!;
  expect(all.getAttribute("href")).toBe("/dashboard/costs?range=all&groupBy=model");
  expect(requests.every((url) => !url.includes("/purge"))).toBe(true);
});

it("updates the displayed spend when the user presses Refresh", async () => {
  await act(async () => {
    root.render(<CostOverviewTab />);
  });
  expect(container.textContent).toContain("$10.00");
  cost = 20;
  await act(async () => {
    container.querySelector<HTMLButtonElement>('button[aria-label="Refresh"]')!.click();
  });
  expect(container.textContent).toContain("$20.00");
  expect(requests.filter((url) => url.startsWith("/api/usage/analytics"))).toHaveLength(2);
});
