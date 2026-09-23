import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppContent } from "../../src/app/App";
import { AuthProvider } from "../../src/features/auth/context/AuthContext";

const plans = {
  data: [
    {
      planKey: "FREE",
      name: "Free Plan",
      description: "Foundational learning and simulation access.",
      entitlements: [],
      available: true,
    },
    {
      planKey: "PREMIUM",
      name: "Premium Plan",
      description: "Advanced platform capabilities.",
      entitlements: ["PREMIUM_ACCESS"],
      available: true,
    },
  ],
};

const free = {
  data: {
    plan: "FREE",
    planKey: "FREE",
    status: "NONE",
    entitlements: [],
    isEntitled: false,
    currentPeriodStart: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  },
};

const premium = {
  data: {
    plan: "PREMIUM",
    planKey: "PREMIUM",
    status: "ACTIVE",
    entitlements: ["PREMIUM_ACCESS"],
    isEntitled: true,
    currentPeriodStart: "2026-09-01T00:00:00.000Z",
    currentPeriodEnd: "2026-10-01T00:00:00.000Z",
    cancelAtPeriodEnd: false,
  },
};

function renderJourney() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/subscription"]}>
        <AuthProvider
          initialToken="same-access-token"
          initialUser={{ id: "learner-1", email: "learner@example.test", role: "LEARNER" }}
        >
          <AppContent />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Subscription learner journey", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("uses the real API adapter path and reflects a same-token server state change", async () => {
    let currentReadCount = 0;
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/plans")) {
        return new Response(JSON.stringify(plans), { status: 200 });
      }
      if (url.endsWith("/me")) {
        currentReadCount += 1;
        return new Response(JSON.stringify(currentReadCount === 1 ? free : premium), { status: 200 });
      }
      throw new Error("Unexpected request");
    });

    renderJourney();
    await waitFor(() => expect(screen.getByText("Your Free plan is active")).toBeDefined());

    fireEvent.click(screen.getByRole("button", { name: "Refresh subscription status" }));
    await waitFor(() => expect(screen.getByText("Premium access is active")).toBeDefined());

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/subscriptions/me",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ Authorization: "Bearer same-access-token" }),
      }),
    );
    expect(screen.queryByRole("button", { name: /buy|upgrade|subscribe|checkout|renew/i })).toBeNull();
  });

  it("does not dispatch subscription requests for an unauthenticated route visit", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("No request expected"));
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/subscription"]}>
          <AuthProvider initialToken={null} initialUser={null}>
            <AppContent />
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("subscription-auth-required")).toBeDefined());
    const subscriptionRequests = vi.mocked(globalThis.fetch).mock.calls.filter(([input]) =>
      String(input).includes("/subscriptions/"),
    );
    expect(subscriptionRequests).toHaveLength(0);
  });
});
