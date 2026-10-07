// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLiveCostRequest } from "@/app/(dashboard)/dashboard/costs/useLiveCostRequest";
import {
  ApiKeyUsageLimitCard,
  type ApiKeyUsageLimitPayload,
} from "@/app/(dashboard)/dashboard/costs/components/ApiKeyUsageLimitCard";

vi.mock("@/shared/components", () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

let root: Root;
let container: HTMLDivElement;
let request: ReturnType<typeof vi.fn>;
const result = (count: number) => new Response(JSON.stringify({ count }), { status: 200 });

function View({ url = "/costs?apiKeyIds=old-key" }: { url?: string | null }) {
  const state = useLiveCostRequest<{ count: number }>(url, "Cost request failed");
  return (
    <div>
      <output>{state.payload?.count ?? "empty"}</output>
      <span role="alert">{state.error}</span>
      <button onClick={state.refresh}>Refresh</button>
    </div>
  );
}

async function mount(view: React.ReactNode = <View />) {
  await act(async () => {
    root.render(view);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  request = vi.fn().mockResolvedValue(result(1));
  vi.stubGlobal("fetch", request);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("visible cost refresh", () => {
  it("refreshes changed usage at 30 seconds without caching the response", async () => {
    await mount();
    expect(container.querySelector("output")?.textContent).toBe("1");
    request.mockResolvedValue(result(2));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(container.querySelector("output")?.textContent).toBe("2");
    expect(request).toHaveBeenCalledTimes(2);
    expect(request.mock.calls[1][1].cache).toBe("no-store");
  });

  it("pauses hidden views and reloads when the page becomes visible", async () => {
    await mount();
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(request).toHaveBeenCalledTimes(1);
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
    request.mockResolvedValue(result(3));
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(container.querySelector("output")?.textContent).toBe("3");
  });

  it("does not overlap a slow request with timer or focus refreshes", async () => {
    let finish!: (value: Response) => void;
    request.mockReturnValue(
      new Promise<Response>((resolve) => {
        finish = resolve;
      })
    );
    await mount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(90_000);
      window.dispatchEvent(new Event("focus"));
    });
    expect(request).toHaveBeenCalledTimes(1);
    await act(async () => {
      finish(result(4));
    });
    expect(container.querySelector("output")?.textContent).toBe("4");
  });

  it("aborts the old key request and ignores its late result", async () => {
    let finish!: (value: Response) => void;
    request.mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        finish = resolve;
      })
    );
    await mount();
    const oldSignal = request.mock.calls[0][1].signal as AbortSignal;
    request.mockResolvedValue(result(5));
    await mount(<View url="/costs?apiKeyIds=new-key" />);
    expect(oldSignal.aborted).toBe(true);
    await act(async () => {
      finish(result(999));
    });
    expect(container.querySelector("output")?.textContent).toBe("5");
  });

  it("keeps existing totals on refresh failure and permits manual recovery", async () => {
    await mount();
    request.mockRejectedValue(new Error("Cost request failed"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(container.querySelector("output")?.textContent).toBe("1");
    expect(container.querySelector('[role="alert"]')?.textContent).toBe("Cost request failed");
    request.mockResolvedValue(result(6));
    await act(async () => {
      container.querySelector("button")!.click();
    });
    expect(container.querySelector("output")?.textContent).toBe("6");
  });

  it("removes the timer and aborts its request on unmount", async () => {
    request.mockReturnValue(new Promise(() => {}));
    await mount();
    const signal = request.mock.calls[0][1].signal as AbortSignal;
    await mount(null);
    expect(signal.aborted).toBe(true);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("preserves an unfinished quota edit when only spend changes", async () => {
    const payload: ApiKeyUsageLimitPayload = {
      key: {
        id: "key-a",
        name: "Example key",
        usageLimitEnabled: false,
        dailyUsageLimitUsd: 10,
        weeklyUsageLimitUsd: 20,
      },
      status: {
        enabled: false,
        dailyLimitUsd: 10,
        weeklyLimitUsd: 20,
        dailySpentUsd: 1,
        weeklySpentUsd: 2,
        dailyWindowStartIso: "2026-10-06T00:00:00Z",
        dailyResetAtIso: "2026-10-07T00:00:00Z",
        weeklyWindowStartIso: "2026-10-05T00:00:00Z",
        weeklyResetAtIso: null,
        dailyExceeded: false,
        weeklyExceeded: false,
      },
    };
    const view = (value: ApiKeyUsageLimitPayload) => (
      <ApiKeyUsageLimitCard payload={value} loading={false} locale="en" onSave={vi.fn()} />
    );
    await mount(view(payload));
    const daily = container.querySelectorAll("input")[0];
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    await act(async () => {
      setter.call(daily, "17");
      daily.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await mount(view({ ...payload, status: { ...payload.status, dailySpentUsd: 9 } }));
    expect(daily.value).toBe("17");
    expect(container.textContent).toContain("$9.00");
    await mount(view({ ...payload, key: { ...payload.key, id: "key-b", dailyUsageLimitUsd: 30 } }));
    expect(daily.value).toBe("30");
  });
});
