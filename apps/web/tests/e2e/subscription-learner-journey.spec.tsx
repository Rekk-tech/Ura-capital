import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppContent } from "../../src/app/App";
import { AuthProvider } from "../../src/features/auth/context/AuthContext";

/**
 * Phase 9 Subscription Learner Journey
 *
 * In Phase 9, the /subscription route renders a PlannedRoutePlaceholder
 * (owned by FEAT-076). The real SubscriptionPage from Phase 7 is no longer
 * directly mounted in the Phase 9 shell. These tests verify the route
 * renders the appropriate placeholder without dispatching subscription
 * API requests.
 */
describe("Subscription learner journey (Phase 9)", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("renders planned route placeholder at /subscription without dispatching subscription API requests", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("No request expected"));
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    render(
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

    // Phase 9 renders PlannedRoutePlaceholder for /subscription (FEAT-076 planned)
    await waitFor(() =>
      expect(screen.getByText("Planned for MVP Release")).toBeDefined(),
    );
    expect(screen.getByText("FEAT-076")).toBeDefined();

    // No subscription API requests should have been dispatched
    const subscriptionRequests = vi.mocked(globalThis.fetch).mock.calls.filter(([input]) =>
      String(input).includes("/subscriptions/"),
    );
    expect(subscriptionRequests).toHaveLength(0);
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

    // Phase 9 renders PlannedRoutePlaceholder regardless of auth
    await waitFor(() =>
      expect(screen.getByText("Planned for MVP Release")).toBeDefined(),
    );

    const subscriptionRequests = vi.mocked(globalThis.fetch).mock.calls.filter(([input]) =>
      String(input).includes("/subscriptions/"),
    );
    expect(subscriptionRequests).toHaveLength(0);
  });
});
