// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { AgentBridgePageData } from "../../../src/app/(dashboard)/dashboard/tools/agent-bridge/AgentBridgePageClient";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("next/link", () => ({
  default: ({ children, href }: React.ComponentProps<"a">) => <a href={href}>{children}</a>,
}));
vi.mock("@/shared/components", () => ({
  Button: ({ children, ...props }: React.ComponentProps<"button">) => (
    <button {...props}>{children}</button>
  ),
  Input: (props: React.ComponentProps<"input">) => <input {...props} />,
  Modal: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
    isOpen ? <div role="dialog">{children}</div> : null,
}));
vi.mock(
  "../../../src/app/(dashboard)/dashboard/tools/agent-bridge/hooks/useAgentBridgeState",
  () => ({
    useAgentBridgeState: ({ initialData }: { initialData: AgentBridgePageData }) => ({
      data: initialData,
      refresh: async () => {},
    }),
  })
);
vi.mock(
  "../../../src/app/(dashboard)/dashboard/tools/agent-bridge/components/AgentBridgeServerCard",
  () => ({
    AgentBridgeServerCard: ({
      onAction,
    }: {
      onAction: (action: "stop" | "restart") => Promise<void>;
    }) => (
      <>
        {(["stop", "restart"] as const).map((action) => (
          <button key={action} onClick={() => onAction(action)}>
            {action}
          </button>
        ))}
      </>
    ),
  })
);
vi.mock(
  "../../../src/app/(dashboard)/dashboard/tools/agent-bridge/components/RiskNoticeBanner",
  () => ({ RiskNoticeBanner: () => null })
);
vi.mock(
  "../../../src/app/(dashboard)/dashboard/tools/agent-bridge/components/AgentBridgeMaintenanceCard",
  () => ({ AgentBridgeMaintenanceCard: () => null })
);
vi.mock("../../../src/app/(dashboard)/dashboard/tools/agent-bridge/components/AgentList", () => ({
  AgentList: () => null,
}));

import AgentBridgePageClient from "../../../src/app/(dashboard)/dashboard/tools/agent-bridge/AgentBridgePageClient";

const initialData: AgentBridgePageData = {
  serverState: {
    running: true,
    port: 8443,
    certTrusted: true,
    upstreamCa: null,
    orphanedStateDetected: false,
    dnsConfigured: true,
    activeConns: 0,
    interceptedCount: 0,
    lastStartedAt: null,
    hasCachedPassword: false,
    needsSudoPassword: true,
    isWin: false,
  },
  agentStates: [],
  bypassPatterns: [],
  mappings: {},
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it.each(["stop", "restart"] as const)(
  "%s waits for elevation and sends the selected action with its password",
  async (action) => {
    const request = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    vi.stubGlobal("fetch", request);
    render(<AgentBridgePageClient initialData={initialData} targets={[]} hasProviders />);
    fireEvent.click(screen.getByRole("button", { name: action }));
    expect(await screen.findByRole("dialog")).toBeTruthy();
    expect(request).not.toHaveBeenCalled();
    fireEvent.change(screen.getByPlaceholderText("enterSudoPassword"), {
      target: { value: "synthetic-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "confirm" }));
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
    expect(request.mock.calls[0][0]).toBe("/api/tools/agent-bridge/server");
    expect(JSON.parse(request.mock.calls[0][1].body)).toEqual({
      action,
      sudoPassword: "synthetic-password",
    });
  }
);

it("canceling the Stop password prompt leaves the server untouched", async () => {
  const request = vi.fn();
  vi.stubGlobal("fetch", request);
  render(<AgentBridgePageClient initialData={initialData} targets={[]} hasProviders />);
  fireEvent.click(screen.getByRole("button", { name: "stop" }));
  expect(await screen.findByRole("dialog")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "cancel" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(request).not.toHaveBeenCalled();
});
