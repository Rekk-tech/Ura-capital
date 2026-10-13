import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppContent } from "../../src/app/App";
import { AuthProvider } from "../../src/features/auth/context/AuthContext";

/**
 * FEAT-085 Commercial Subscription Learner Journey
 *
 * Verifies that the /subscription route renders the commercial SubscriptionPage
 * with plan details for authenticated learners, and presents authentication
 * requirements for unauthenticated visitors.
 */
describe("Subscription learner journey (Commercial Production)", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("renders live subscription center for authenticated learners", async () => {
    globalThis.fetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/subscriptions/plans")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: [
                {
                  planKey: "FREE",
                  name: "Free Plan",
                  description: "Foundational learning",
                  entitlements: [],
                  available: true,
                },
                {
                  planKey: "PREMIUM",
                  name: "Premium VIP",
                  description: "Full AI Coach & Simulation",
                  entitlements: ["PREMIUM_ACCESS"],
                  available: true,
                },
              ],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          )
        );
      }
      if (url.includes("/subscriptions/me")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
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
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          )
        );
      }
      return Promise.resolve(
        new Response(JSON.stringify({ data: {} }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    });

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

    // Live Subscription Page renders
    await waitFor(() =>
      expect(screen.getByTestId("subscription-page")).toBeDefined(),
    );
    expect(screen.getByText("Subscription")).toBeDefined();
    expect(screen.getByText("Your Free plan is active")).toBeDefined();
  });

  it("renders authentication required state for an unauthenticated route visit", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/subscription"]}>
          <AuthProvider initialToken={null} initialUser={null} initialIsLoading={false}>
            <AppContent />
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    // Renders Authentication Required prompt for visitors
    await waitFor(() =>
      expect(screen.getByTestId("subscription-auth-required")).toBeDefined(),
    );
    expect(screen.getByText(/Sign in to view your subscription/i)).toBeDefined();
  });
});
