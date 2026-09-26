import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PortfolioPage } from "./PortfolioPage";
import { AuthProvider } from "../../auth/context/AuthContext";
import { AuthUser } from "../../../api/auth.api";
import { simulationApi } from "../../simulation/api/simulationApi";

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

function renderPortfolioPage(
  token: string | null = "mock-token",
  user: AuthUser | null = {
    id: "usr-p-1",
    email: "test@auracapital.io",
    displayName: "Portfolio Tester",
    status: "ACTIVE",
  }
) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider initialToken={token} initialUser={user} initialIsLoading={false}>
        <MemoryRouter initialEntries={["/portfolio"]}>
          <PortfolioPage />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

describe("PortfolioPage (FEAT-075 / AC-001..AC-008)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockActiveSession = {
    id: "session-1",
    userId: "usr-p-1",
    scenarioId: "scen-1",
    status: "ACTIVE" as const,
    startingCash: "100000.0000",
    currentCycle: 2,
    startedAt: "2026-09-26T00:00:00Z",
    completedAt: null,
    cancelledAt: null,
    createdAt: "2026-09-26T00:00:00Z",
    updatedAt: "2026-09-26T00:00:00Z",
    scenario: { name: "Tech Rally", key: "tech_rally" },
    simulated: true,
  };

  const mockValuation = {
    sessionId: "session-1",
    currentCycle: 2,
    cashBalance: "75000.0000",
    marketValue: "32000.0000",
    totalEquity: "107000.0000",
    realizedPnl: "2000.0000",
    unrealizedPnl: "5000.0000",
    updatedAt: "2026-09-26T10:00:00Z",
    simulated: true,
    positions: [
      {
        assetId: "ast-1",
        symbol: "AAPL",
        name: "Apple Inc.",
        quantity: 100,
        averageCost: "270.0000",
        currentPrice: "320.0000",
        marketValue: "32000.0000",
        unrealizedPnl: "5000.0000",
        simulated: true,
      },
    ],
  };

  describe("Async State 1: Auth-Required State", () => {
    it("renders authentication required prompt when user has no token or session", () => {
      renderPortfolioPage(null, null);

      expect(screen.getByTestId("portfolio-auth-required")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /authentication required/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /sign in to continue/i })).toHaveAttribute(
        "href",
        "/login?returnTo=%2Fportfolio"
      );
    });
  });

  describe("Async State 2: Loading State", () => {
    it("renders loading skeleton with status role while fetching session and valuation", () => {
      vi.spyOn(simulationApi, "listSessions").mockReturnValue(new Promise(() => {}));

      renderPortfolioPage();

      expect(screen.getByTestId("portfolio-loading-skeleton")).toBeInTheDocument();
      expect(screen.getByRole("status")).toBeInTheDocument();
      expect(screen.getByTestId("simulation-disclosure-banner")).toBeInTheDocument();
    });
  });

  describe("Async State 3: Empty State", () => {
    it("renders empty state with link to simulation desk when user has no trading sessions", async () => {
      vi.spyOn(simulationApi, "listSessions").mockResolvedValue({ data: [] });

      renderPortfolioPage();

      expect(await screen.findByTestId("portfolio-empty-state")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /no trading sessions found/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /launch simulation desk/i })).toHaveAttribute(
        "href",
        "/simulation"
      );
      expect(screen.getByTestId("simulation-disclosure-banner")).toBeInTheDocument();
    });
  });

  describe("Async State 4: Error State", () => {
    it("renders error alert with retry button when API fails, and calls refetch on retry", async () => {
      const listSessionsSpy = vi.spyOn(simulationApi, "listSessions").mockRejectedValue(
        new Error("Connection refused by server")
      );

      renderPortfolioPage();

      expect(await screen.findByTestId("portfolio-error-state")).toBeInTheDocument();
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("Connection refused by server")).toBeInTheDocument();

      const retryBtn = screen.getByTestId("portfolio-retry-button");
      expect(retryBtn).toBeInTheDocument();

      // Trigger retry
      listSessionsSpy.mockResolvedValueOnce({ data: [mockActiveSession] });
      vi.spyOn(simulationApi, "getPortfolioValuation").mockResolvedValueOnce({ data: mockValuation });
      vi.spyOn(simulationApi, "getTrades").mockResolvedValueOnce({ data: [] });

      fireEvent.click(retryBtn);

      expect(await screen.findByTestId("portfolio-page")).toBeInTheDocument();
    });
  });

  describe("Async State 5: Success State", () => {
    it("renders complete analytics dashboard, disclosure banner, and server authority notice", async () => {
      vi.spyOn(simulationApi, "listSessions").mockResolvedValue({ data: [mockActiveSession] });
      vi.spyOn(simulationApi, "getPortfolioValuation").mockResolvedValue({ data: mockValuation });
      vi.spyOn(simulationApi, "getTrades").mockResolvedValue({ data: [] });

      renderPortfolioPage();

      expect(await screen.findByTestId("portfolio-page")).toBeInTheDocument();
      expect(screen.getByTestId("simulation-disclosure-banner")).toHaveTextContent(
        /simulated execution only • virtual funds • no real capital at risk/i
      );
      expect(screen.getByTestId("portfolio-equity-summary")).toBeInTheDocument();
      expect(screen.getByTestId("pnl-analytics-card")).toBeInTheDocument();
      expect(screen.getByTestId("asset-allocation-card")).toBeInTheDocument();
      expect(screen.getByTestId("equity-trend-viewer")).toBeInTheDocument();
      expect(screen.getByTestId("server-authority-notice")).toHaveTextContent(
        /all portfolio balances, valuations, position costs, and performance metrics are server-authoritative facts/i
      );
    });

    it("allows switching trading sessions when multiple sessions exist", async () => {
      const secondSession = {
        ...mockActiveSession,
        id: "session-2",
        currentCycle: 5,
        scenario: { name: "Bear Market", key: "bear_market" },
      };

      vi.spyOn(simulationApi, "listSessions").mockResolvedValue({
        data: [mockActiveSession, secondSession],
      });
      const getValuationSpy = vi.spyOn(simulationApi, "getPortfolioValuation").mockResolvedValue({
        data: mockValuation,
      });
      vi.spyOn(simulationApi, "getTrades").mockResolvedValue({ data: [] });

      renderPortfolioPage();

      expect(await screen.findByTestId("portfolio-page")).toBeInTheDocument();

      const sessionSelect = screen.getByLabelText(/select trading session/i);
      expect(sessionSelect).toBeInTheDocument();

      // Switch session to session-2
      fireEvent.change(sessionSelect, { target: { value: "session-2" } });

      await waitFor(() => {
        expect(getValuationSpy).toHaveBeenCalledWith("session-2", "mock-token", expect.any(Object));
      });
    });
  });
});
