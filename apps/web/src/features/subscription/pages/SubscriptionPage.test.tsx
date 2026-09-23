import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { subscriptionApi } from "../../../api/subscription.api";
import type { AuthUser } from "../../../api/auth.api";
import { AuthProvider } from "../../auth/context/AuthContext";
import { SubscriptionApiError } from "../types/subscription-ui.types";
import { SubscriptionPage, isSubscriptionCommandUiEnabled } from "./SubscriptionPage";

const user: AuthUser = { id: "user-1", email: "learner@example.test", role: "LEARNER" };

const plansResponse = {
  data: [
    {
      planKey: "FREE" as const,
      name: "Free Plan",
      description: "Foundational learning and simulation access.",
      entitlements: [],
      available: true,
    },
    {
      planKey: "PREMIUM" as const,
      name: "Premium Plan",
      description: "Advanced platform capabilities.",
      entitlements: ["PREMIUM_ACCESS" as const],
      available: true,
    },
  ],
};

function currentResponse(overrides: Record<string, unknown> = {}) {
  return {
    data: {
      plan: "FREE" as const,
      planKey: "FREE" as const,
      status: "NONE" as const,
      entitlements: [],
      isEntitled: false,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      ...overrides,
    },
  };
}

function renderPage({
  token = "access-token" as string | null,
  authUser = user as AuthUser | null,
  environment = "production",
}: {
  token?: string | null;
  authUser?: AuthUser | null;
  environment?: string;
} = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/subscription"]}>
        <AuthProvider initialToken={token} initialUser={authUser}>
          <SubscriptionPage commandEnvironment={environment} />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("SubscriptionPage", () => {
  beforeEach(() => {
    vi.spyOn(subscriptionApi, "getPlans").mockResolvedValue(plansResponse);
    vi.spyOn(subscriptionApi, "getCurrent").mockResolvedValue(currentResponse());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fails the command UI closed outside development and test", () => {
    expect(isSubscriptionCommandUiEnabled("development")).toBe(true);
    expect(isSubscriptionCommandUiEnabled("test")).toBe(true);
    expect(isSubscriptionCommandUiEnabled("production")).toBe(false);
    expect(isSubscriptionCommandUiEnabled("staging")).toBe(false);
    expect(isSubscriptionCommandUiEnabled("preview")).toBe(false);
    expect(isSubscriptionCommandUiEnabled("")).toBe(false);
  });

  it("renders auth required and sends zero subscription requests without a token", async () => {
    renderPage({ token: null, authUser: null });

    await waitFor(() => expect(screen.getByTestId("subscription-auth-required")).toBeDefined());
    expect(subscriptionApi.getPlans).not.toHaveBeenCalled();
    expect(subscriptionApi.getCurrent).not.toHaveBeenCalled();
  });

  it("renders a stable loading state without a premium claim", () => {
    vi.mocked(subscriptionApi.getCurrent).mockImplementation(() => new Promise(() => {}));
    renderPage();

    expect(screen.getByTestId("subscription-loading")).toBeDefined();
    expect(screen.queryByText("Premium access is active")).toBeNull();
  });

  it("renders a missing subscription row as FREE without a commerce CTA", async () => {
    renderPage();

    await waitFor(() => expect(screen.getByText("Your Free plan is active")).toBeDefined());
    expect(screen.getByText("No paid subscription")).toBeDefined();
    expect(screen.getByText("Not enabled")).toBeDefined();
    expect(screen.queryByRole("button", { name: /buy|upgrade|subscribe|checkout|renew/i })).toBeNull();
  });

  it("renders server-confirmed ACTIVE Premium state", async () => {
    vi.mocked(subscriptionApi.getCurrent).mockResolvedValue(
      currentResponse({
        plan: "PREMIUM",
        planKey: "PREMIUM",
        status: "ACTIVE",
        entitlements: ["PREMIUM_ACCESS"],
        isEntitled: true,
        currentPeriodStart: "2026-09-01T00:00:00.000Z",
        currentPeriodEnd: "2026-10-01T00:00:00.000Z",
      }),
    );
    renderPage();

    await waitFor(() => expect(screen.getByText("Premium access is active")).toBeDefined());
    expect(screen.getByText("Enabled by server")).toBeDefined();
    expect(screen.getByText("Advanced platform capabilities")).toBeDefined();
  });

  it("renders cancellation pending only from server facts", async () => {
    vi.mocked(subscriptionApi.getCurrent).mockResolvedValue(
      currentResponse({
        plan: "PREMIUM",
        planKey: "PREMIUM",
        status: "ACTIVE",
        entitlements: ["PREMIUM_ACCESS"],
        isEntitled: true,
        cancelAtPeriodEnd: true,
        currentPeriodStart: "2026-09-01T00:00:00.000Z",
        currentPeriodEnd: "2026-10-01T00:00:00.000Z",
      }),
    );
    renderPage({ environment: "test" });

    await waitFor(() => expect(screen.getByText("Premium remains active for now")).toBeDefined());
    expect(screen.getByText("Cancellation pending")).toBeDefined();
    expect(screen.queryByRole("button", { name: "Schedule cancellation" })).toBeNull();
  });

  it.each([
    ["PAST_DUE", "Premium access is paused", "Past due"],
    ["CANCELLED", "Subscription cancelled", "Cancelled"],
    ["EXPIRED", "Subscription expired", "Expired"],
  ])("renders %s as non-premium", async (status, title, label) => {
    vi.mocked(subscriptionApi.getCurrent).mockResolvedValue(
      currentResponse({
        plan: "PREMIUM",
        planKey: "PREMIUM",
        status,
        entitlements: [],
        isEntitled: false,
      }),
    );
    renderPage();

    await waitFor(() => expect(screen.getByText(title)).toBeDefined());
    expect(screen.getByText(label)).toBeDefined();
    expect(screen.getByText("Not enabled")).toBeDefined();
  });

  it("does not trust ACTIVE status when the server says there is no effective entitlement", async () => {
    vi.mocked(subscriptionApi.getCurrent).mockResolvedValue(
      currentResponse({
        plan: "PREMIUM",
        planKey: "PREMIUM",
        status: "ACTIVE",
        entitlements: [],
        isEntitled: false,
      }),
    );
    renderPage();

    await waitFor(() => expect(screen.getByText("Premium access is unavailable")).toBeDefined());
    expect(screen.queryByText("Premium access is active")).toBeNull();
  });

  it("keeps all commerce actions absent in production", async () => {
    vi.mocked(subscriptionApi.getCurrent).mockResolvedValue(
      currentResponse({
        plan: "PREMIUM",
        planKey: "PREMIUM",
        status: "ACTIVE",
        entitlements: ["PREMIUM_ACCESS"],
        isEntitled: true,
      }),
    );
    renderPage({ environment: "production" });

    await waitFor(() => expect(screen.getByText("Premium access is active")).toBeDefined());
    expect(screen.queryByRole("button", { name: /cancel|buy|upgrade|subscribe|checkout|renew/i })).toBeNull();
    expect(screen.getByText("Plan changes are currently unavailable.")).toBeDefined();
  });

  it("requires accessible confirmation and refetches after a development/test cancellation", async () => {
    const active = currentResponse({
      plan: "PREMIUM",
      planKey: "PREMIUM",
      status: "ACTIVE",
      entitlements: ["PREMIUM_ACCESS"],
      isEntitled: true,
      currentPeriodEnd: "2026-10-01T00:00:00.000Z",
    });
    const pending = currentResponse({
      ...active.data,
      cancelAtPeriodEnd: true,
    });
    vi.mocked(subscriptionApi.getCurrent).mockResolvedValueOnce(active).mockResolvedValue(pending);
    vi.spyOn(subscriptionApi, "cancel").mockResolvedValue({
      status: "ACTIVE",
      planKey: "PREMIUM",
      cancelAtPeriodEnd: true,
      currentPeriodEnd: "2026-10-01T00:00:00.000Z",
    });
    renderPage({ environment: "test" });

    const scheduleButton = await screen.findByRole("button", { name: "Schedule cancellation" });
    fireEvent.click(scheduleButton);
    const dialog = screen.getByRole("dialog", { name: "Schedule cancellation?" });
    expect(dialog).toBeDefined();
    expect(screen.getByRole("button", { name: "Confirm cancellation" })).toBe(document.activeElement);

    fireEvent.click(screen.getByRole("button", { name: "Confirm cancellation" }));

    await waitFor(() => expect(subscriptionApi.cancel).toHaveBeenCalledWith("access-token"));
    await waitFor(() => expect(screen.getByText("Cancellation pending")).toBeDefined());
    expect(vi.mocked(subscriptionApi.getCurrent).mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("shows safe 429 cancellation feedback and honors Retry-After", async () => {
    vi.mocked(subscriptionApi.getCurrent).mockResolvedValue(
      currentResponse({
        plan: "PREMIUM",
        planKey: "PREMIUM",
        status: "ACTIVE",
        entitlements: ["PREMIUM_ACCESS"],
        isEntitled: true,
      }),
    );
    vi.spyOn(subscriptionApi, "cancel").mockRejectedValue(
      new SubscriptionApiError(429, "TOO_MANY_REQUESTS", "safe", 75),
    );
    renderPage({ environment: "test" });

    fireEvent.click(await screen.findByRole("button", { name: "Schedule cancellation" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm cancellation" }));

    await waitFor(() => {
      expect(screen.getByTestId("subscription-mutation-error").textContent).toContain("75 seconds");
    });
    expect(screen.getByText("Premium access is active")).toBeDefined();
  });

  it("renders a safe auth-required state for a server 401", async () => {
    vi.mocked(subscriptionApi.getCurrent).mockRejectedValue(
      new SubscriptionApiError(401, "UNAUTHENTICATED", "safe"),
    );
    renderPage();

    await waitFor(() => expect(screen.getByTestId("subscription-auth-required")).toBeDefined());
  });

  it.each([
    [403, "FORBIDDEN", "forbidden"],
    [429, "TOO_MANY_REQUESTS", "rate-limited"],
    [503, "SERVICE_UNAVAILABLE", "unavailable"],
    [500, "SERVICE_ERROR", "generic"],
  ])("renders a safe %s read failure", async (status, code, kind) => {
    vi.mocked(subscriptionApi.getCurrent).mockRejectedValue(
      new SubscriptionApiError(status, code, "raw provider text", status === 429 ? 45 : undefined),
    );
    renderPage();

    await waitFor(() => expect(screen.getByTestId(`subscription-error-${kind}`)).toBeDefined());
    expect(screen.queryByText("raw provider text")).toBeNull();
  });

  it("renders server display copy as text without creating provider HTML", async () => {
    vi.mocked(subscriptionApi.getPlans).mockResolvedValue({
      data: [
        plansResponse.data[0]!,
        {
          ...plansResponse.data[1]!,
          description: '<img src="provider" onerror="alert(1)">Safe text',
        },
      ],
    });
    vi.mocked(subscriptionApi.getCurrent).mockResolvedValue(
      currentResponse({
        plan: "PREMIUM",
        planKey: "PREMIUM",
        status: "ACTIVE",
        entitlements: ["PREMIUM_ACCESS"],
        isEntitled: true,
      }),
    );
    renderPage();

    await waitFor(() => expect(screen.getByText(/<img src=/)).toBeDefined());
    expect(document.querySelector('img[src="provider"]')).toBeNull();
  });

  it("reflects same-token server changes only after authoritative refetch", async () => {
    const premium = currentResponse({
      plan: "PREMIUM",
      planKey: "PREMIUM",
      status: "ACTIVE",
      entitlements: ["PREMIUM_ACCESS"],
      isEntitled: true,
    });
    vi.mocked(subscriptionApi.getCurrent)
      .mockResolvedValueOnce(currentResponse())
      .mockResolvedValue(premium);
    renderPage();

    await waitFor(() => expect(screen.getByText("Your Free plan is active")).toBeDefined());
    fireEvent.click(screen.getByRole("button", { name: "Refresh subscription status" }));
    await waitFor(() => expect(screen.getByText("Premium access is active")).toBeDefined());
    expect(subscriptionApi.getCurrent).toHaveBeenLastCalledWith(
      "access-token",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });
});
