import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../../auth/context/AuthContext";
import { DashboardPage } from "./DashboardPage";
import { academyApi } from "../../../api/academy.api";
import { simulationApi } from "../../../api/simulation.api";
import { communityApi } from "../../../api/community.api";
import { subscriptionApi } from "../../../api/subscription.api";
import { AuthUser } from "../../../api/auth.api";

describe("DashboardPage (FEAT-072: AC-001..AC-008)", () => {
  let queryClient: QueryClient;

  const mockUser: AuthUser = {
    id: "usr-learner-1",
    email: "learner@auracapital.io",
    displayName: "Alex Trader",
    status: "ACTIVE",
    createdAt: "2026-02-01T12:00:00.000Z",
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  const setupDefaultMocks = () => {
    // Academy mocks
    vi.spyOn(academyApi, "getMyXp").mockResolvedValue({
      data: { totalXp: 1250 },
    });
    vi.spyOn(academyApi, "listCourses").mockResolvedValue({
      data: [
        {
          slug: "equity-derivatives-101",
          title: "Equity Derivatives 101",
          description: "Foundational options and futures.",
          level: "BEGINNER",
          order: 1,
          lessonCount: 8,
        },
        {
          slug: "macro-hedging",
          title: "Macro Hedging Strategies",
          description: "Institutional hedging practices.",
          level: "INTERMEDIATE",
          order: 2,
          lessonCount: 6,
        },
      ],
      pagination: { page: 1, limit: 3, total: 2, totalPages: 1 },
    });

    // Simulation mocks
    vi.spyOn(simulationApi, "listSessions").mockResolvedValue({
      data: [
        {
          id: "sim-session-100",
          userId: "usr-learner-1",
          scenarioId: "scen-1",
          status: "ACTIVE",
          startingCash: "100000.00",
          currentCycle: 4,
          startedAt: "2026-09-25T10:00:00.000Z",
          completedAt: null,
          cancelledAt: null,
          createdAt: "2026-09-25T10:00:00.000Z",
          updatedAt: "2026-09-25T11:00:00.000Z",
          scenario: {
            name: "Q3 Tech Volatility",
            key: "q3-tech-vol",
          },
        },
      ],
    });
    vi.spyOn(simulationApi, "getPortfolioValuation").mockResolvedValue({
      data: {
        sessionId: "sim-session-100",
        currentCycle: 4,
        cashBalance: "82500.00",
        marketValue: "23450.00",
        totalEquity: "105950.00",
        realizedPnl: "1200.00",
        unrealizedPnl: "4750.00",
        positions: [],
        simulated: true,
        updatedAt: "2026-09-25T11:00:00.000Z",
      },
    });

    // Community mocks
    vi.spyOn(communityApi, "listPosts").mockResolvedValue({
      data: [
        {
          id: "post-1",
          author: { displayName: "Samantha H." },
          content: "Sharing an analysis of semiconductor supply chain bottlenecks.",
          createdAt: "2026-09-24T15:30:00.000Z",
          likeCount: 8,
          commentCount: 4,
          likedByCurrentUser: false,
          ownedByCurrentUser: false,
        },
        {
          id: "post-2",
          author: { displayName: "David K." },
          content: "What are your preferred delta neutral strategies for earnings season?",
          createdAt: "2026-09-23T09:15:00.000Z",
          likeCount: 15,
          commentCount: 9,
          likedByCurrentUser: true,
          ownedByCurrentUser: false,
        },
      ],
      pageInfo: { nextCursor: null, hasNextPage: false },
    });

    // Subscription mocks
    vi.spyOn(subscriptionApi, "getCurrent").mockResolvedValue({
      data: {
        plan: "PREMIUM",
        planKey: "PREMIUM",
        status: "ACTIVE",
        entitlements: ["PREMIUM_ACCESS" as const],
        isEntitled: true,
        currentPeriodStart: "2026-09-01T00:00:00.000Z",
        currentPeriodEnd: "2026-10-01T00:00:00.000Z",
        cancelAtPeriodEnd: false,
      },
    });
  };

  const renderDashboard = ({
    initialToken = "valid-token" as string | null,
    initialUser = mockUser as AuthUser | null,
    initialPath = "/dashboard",
  }: {
    initialToken?: string | null;
    initialUser?: AuthUser | null;
    initialPath?: string;
  } = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider initialToken={initialToken} initialUser={initialUser} initialIsLoading={false}>
          <MemoryRouter initialEntries={[initialPath]}>
            <Routes>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/login" element={<div>Login Page Target</div>} />
              <Route path="/academy" element={<div>Academy Target Page</div>} />
              <Route path="/simulation" element={<div>Simulation Target Page</div>} />
              <Route path="/community" element={<div>Community Target Page</div>} />
              <Route path="/subscription" element={<div>Subscription Target Page</div>} />
              <Route path="/account" element={<div>Account Target Page</div>} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    );
  };

  describe("AC-001: Authenticated Session Requirement", () => {
    it("renders deterministic auth-required view when unauthenticated and issues zero domain queries", () => {
      const getXpSpy = vi.spyOn(academyApi, "getMyXp");
      const getSessionsSpy = vi.spyOn(simulationApi, "listSessions");
      const getPostsSpy = vi.spyOn(communityApi, "listPosts");
      const getSubSpy = vi.spyOn(subscriptionApi, "getCurrent");

      renderDashboard({ initialToken: null, initialUser: null });

      expect(screen.getByRole("heading", { name: /please sign in/i })).toBeDefined();
      expect(screen.getByText("Authentication Required")).toBeDefined();

      const signInLink = screen.getByRole("link", { name: /sign in to continue/i });
      expect(signInLink.getAttribute("href")).toBe("/login?returnTo=%2Fdashboard");

      // Verify ZERO domain API calls were dispatched
      expect(getXpSpy).not.toHaveBeenCalled();
      expect(getSessionsSpy).not.toHaveBeenCalled();
      expect(getPostsSpy).not.toHaveBeenCalled();
      expect(getSubSpy).not.toHaveBeenCalled();
    });

    it("renders dashboard greeting and all 4 domain widgets when authenticated", async () => {
      setupDefaultMocks();
      renderDashboard();

      expect(screen.getByRole("heading", { name: /welcome back, alex trader/i })).toBeDefined();
      expect(screen.getByText("ACTIVE")).toBeDefined();

      await waitFor(() => {
        expect(screen.getByTestId("dashboard-widget-academy")).toBeDefined();
        expect(screen.getByTestId("dashboard-widget-simulation")).toBeDefined();
        expect(screen.getByTestId("dashboard-widget-community")).toBeDefined();
        expect(screen.getByTestId("dashboard-widget-subscription")).toBeDefined();
      });
    });
  });

  describe("AC-002 & AC-003: Traceable Server Facts & Domain Navigation", () => {
    it("renders server-derived metrics for Academy, Simulation, Community, and Subscription", async () => {
      setupDefaultMocks();
      renderDashboard();

      // Academy facts
      await waitFor(() => {
        expect(screen.getByTestId("learner-xp-value").textContent).toContain("1,250 XP");
        expect(screen.getByText("Equity Derivatives 101")).toBeDefined();
        expect(screen.getByText("Macro Hedging Strategies")).toBeDefined();
      });

      // Simulation facts
      await waitFor(() => {
        expect(screen.getByText("Q3 Tech Volatility")).toBeDefined();
        expect(screen.getByTestId("portfolio-equity-value").textContent).toContain("105,950.00");
        expect(screen.getByTestId("portfolio-pnl-value").textContent).toContain("+$4,750.00");
      });

      // Community facts
      await waitFor(() => {
        expect(screen.getByText("Samantha H.")).toBeDefined();
        expect(screen.getByText(/semiconductor supply chain/i)).toBeDefined();
      });

      // Subscription facts
      await waitFor(() => {
        expect(screen.getByTestId("subscription-plan-value").textContent).toBe("Institutional Premium");
        expect(screen.getByText("PREMIUM")).toBeDefined();
      });

      // Domain Navigation links
      expect(screen.getByRole("link", { name: /view academy/i }).getAttribute("href")).toBe("/academy");
      expect(screen.getByRole("link", { name: /open desk/i }).getAttribute("href")).toBe("/simulation");
      expect(screen.getByRole("link", { name: /join forum/i }).getAttribute("href")).toBe("/community");
      expect(screen.getByRole("link", { name: /manage plan/i }).getAttribute("href")).toBe("/subscription");
    });
  });

  describe("AC-004: Isolated Widget Error Boundaries & Partial Failure", () => {
    it("isolates Academy failure without breaking Simulation, Community, or Subscription", async () => {
      setupDefaultMocks();
      // Force Academy to reject with 500 error
      vi.spyOn(academyApi, "getMyXp").mockRejectedValue(new Error("Academy Service Down"));

      renderDashboard();

      // Academy widget should show error and retry button
      await waitFor(() => {
        const academyWidget = screen.getByTestId("dashboard-widget-academy");
        expect(academyWidget.textContent).toContain("Unable to load Academy progress");
        expect(screen.getByRole("button", { name: /retry loading academy learning/i })).toBeDefined();
      });

      // Other widgets MUST continue to render successfully
      await waitFor(() => {
        expect(screen.getByTestId("portfolio-equity-value").textContent).toContain("105,950.00");
        expect(screen.getByText("Samantha H.")).toBeDefined();
        expect(screen.getByTestId("subscription-plan-value").textContent).toBe("Institutional Premium");
      });
    });

    it("isolates Simulation failure without breaking other widgets", async () => {
      setupDefaultMocks();
      // Force Simulation to reject with 500 error
      vi.spyOn(simulationApi, "listSessions").mockRejectedValue(new Error("Simulation Engine Timeout"));

      renderDashboard();

      await waitFor(() => {
        const simWidget = screen.getByTestId("dashboard-widget-simulation");
        expect(simWidget.textContent).toContain("Unable to load simulation portfolio");
        expect(screen.getByRole("button", { name: /retry loading simulation portfolio/i })).toBeDefined();
      });

      // Other widgets remain live and functional
      expect(screen.getByTestId("learner-xp-value").textContent).toContain("1,250 XP");
      expect(screen.getByText("Samantha H.")).toBeDefined();
      expect(screen.getByTestId("subscription-plan-value").textContent).toBe("Institutional Premium");
    });

    it("renders clean empty state when user has no active simulation session", async () => {
      setupDefaultMocks();
      // Return empty sessions list
      vi.spyOn(simulationApi, "listSessions").mockResolvedValue({ data: [] });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText("No Active Simulation")).toBeDefined();
        expect(screen.getByText(/you do not have an active simulated trading desk session/i)).toBeDefined();
        expect(screen.getByRole("link", { name: /launch simulation desk/i })).toBeDefined();
      });

      // Other widgets still functional
      expect(screen.getByTestId("learner-xp-value").textContent).toContain("1,250 XP");
    });

    it("renders clean empty state when community has no posts", async () => {
      setupDefaultMocks();
      vi.spyOn(communityApi, "listPosts").mockResolvedValue({
        data: [],
        pageInfo: { nextCursor: null, hasNextPage: false },
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText("No Recent Discussions")).toBeDefined();
        expect(screen.getByRole("link", { name: /start discussion/i })).toBeDefined();
      });
    });

    it("renders accessible loading states while domain queries are in flight", () => {
      vi.spyOn(academyApi, "getMyXp").mockImplementation(() => new Promise(() => {}));
      vi.spyOn(academyApi, "listCourses").mockImplementation(() => new Promise(() => {}));
      vi.spyOn(simulationApi, "listSessions").mockImplementation(() => new Promise(() => {}));
      vi.spyOn(communityApi, "listPosts").mockImplementation(() => new Promise(() => {}));
      vi.spyOn(subscriptionApi, "getCurrent").mockImplementation(() => new Promise(() => {}));

      renderDashboard();

      const loadingIndicators = screen.getAllByRole("status");
      expect(loadingIndicators.length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/loading summary\.\.\./i).length).toBeGreaterThanOrEqual(1);
    });

    it("recovers to success when user clicks the retry button on a failed widget", async () => {
      setupDefaultMocks();
      const xpSpy = vi
        .spyOn(academyApi, "getMyXp")
        .mockRejectedValueOnce(new Error("Transient Network Glitch"))
        .mockResolvedValue({
          data: { totalXp: 1250 },
        });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/unable to load academy progress/i)).toBeDefined();
      });

      const retryBtn = screen.getByRole("button", { name: /retry loading academy learning/i });
      fireEvent.click(retryBtn);

      await waitFor(() => {
        expect(screen.getByTestId("learner-xp-value").textContent).toContain("1,250 XP");
      });
      expect(xpSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe("AC-005 & AC-006: Request Bounds & Authority Invariants", () => {
    it("displays explicit Server Authority and Simulation disclosures", async () => {
      setupDefaultMocks();
      renderDashboard();

      // Authority notice
      expect(screen.getByText(/server authority notice:/i)).toBeDefined();
      expect(
        screen.getByText(
          /all xp, simulation balances, community counts, and tier entitlements shown on this dashboard are server-authoritative facts/i
        )
      ).toBeDefined();

      // Simulation disclaimer
      await waitFor(() => {
        expect(
          screen.getByText(/simulated execution only • virtual funds • no real capital at risk/i)
        ).toBeDefined();
      });

      // Bottom footer platform disclosure
      expect(screen.getByText(/platform disclosure:/i)).toBeDefined();
    });

    it("triggers bounded manual refresh when Refresh Overview button is clicked", async () => {
      setupDefaultMocks();
      const listCoursesSpy = vi.spyOn(academyApi, "listCourses");

      renderDashboard();

      await waitFor(() => {
        expect(listCoursesSpy).toHaveBeenCalledTimes(1);
      });

      const refreshBtn = screen.getByRole("button", { name: /refresh all dashboard data/i });
      fireEvent.click(refreshBtn);

      await waitFor(() => {
        // Query invalidation causes a single bounded refetch
        expect(listCoursesSpy).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("AC-007: Accessibility & Single H1 Structure", () => {
    it("maintains a single H1 element and proper heading hierarchy", async () => {
      setupDefaultMocks();
      renderDashboard();

      const h1Headings = screen.getAllByRole("heading", { level: 1 });
      expect(h1Headings.length).toBe(1);
      expect(h1Headings[0]?.textContent).toContain("Welcome back, Alex Trader");

      // Widget titles are level 2 headings
      const h2Headings = screen.getAllByRole("heading", { level: 2 });
      expect(h2Headings.length).toBe(4);
    });
  });
});
