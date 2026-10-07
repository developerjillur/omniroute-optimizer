"use client";

import { useCallback, useEffect, useState } from "react";

interface CostResult<T> {
  url: string | null;
  value: T | null;
  error: string | null;
  updatedAt: number | null;
}

/** Refresh visible cost views without overlapping requests or mixing key filters. */
export function useLiveCostRequest<T>(url: string | null, failureMessage: string) {
  const [result, setResult] = useState<CostResult<T>>({
    url: null,
    value: null,
    error: null,
    updatedAt: null,
  });
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((previous) => previous + 1), []);

  useEffect(() => {
    if (!url) return;
    let active = true;
    let inFlight = false;
    let controller: AbortController | null = null;

    async function load() {
      if (!active || inFlight) return;
      inFlight = true;
      controller = new AbortController();
      setBusy(true);
      try {
        const response = await fetch(url!, { signal: controller.signal, cache: "no-store" });
        if (!response.ok) throw new Error(failureMessage);
        const value = (await response.json()) as T;
        if (active) setResult({ url, value, error: null, updatedAt: Date.now() });
      } catch (error) {
        if (active) {
          const message = error instanceof Error ? error.message : failureMessage;
          setResult((previous) => ({
            url,
            value: previous.url === url ? previous.value : null,
            error: message,
            updatedAt: previous.url === url ? previous.updatedAt : null,
          }));
        }
      } finally {
        inFlight = false;
        if (active) setBusy(false);
      }
    }

    function loadVisible() {
      if (document.visibilityState === "visible") void load();
    }

    void load();
    const timer = window.setInterval(loadVisible, 30_000);
    window.addEventListener("focus", loadVisible);
    document.addEventListener("visibilitychange", loadVisible);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", loadVisible);
      document.removeEventListener("visibilitychange", loadVisible);
      controller?.abort();
    };
  }, [url, failureMessage, revision]);

  const current = result.url === url ? result : null;
  return {
    payload: current?.value ?? null,
    error: current?.error ?? null,
    updatedAt: current?.updatedAt ?? null,
    loading: Boolean(url) && current?.value == null && !current?.error,
    refreshing: busy,
    refresh,
  };
}
