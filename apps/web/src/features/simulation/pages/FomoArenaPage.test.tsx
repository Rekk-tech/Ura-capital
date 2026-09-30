import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { FomoArenaPage } from "./FomoArenaPage";
import * as useMapGameModule from "../hooks/use-map-game";

vi.mock("../hooks/use-map-game");
vi.mock("../../auth/context/AuthContext", () => ({
  useAuth: () => ({
    accessToken: "mock-token",
    isAuthenticated: true,
    user: { id: "user-1", email: "user@ura.local" },
  }),
}));

describe("FomoArenaPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders empty state with Start Game CTA and Disclosure banner", () => {
    const mockStartNewGame = vi.fn();
    vi.spyOn(useMapGameModule, "useMap1Game").mockReturnValue({
      sessionId: null,
      state: null,
      debrief: null,
      isLoading: false,
      isSubmittingOrder: false,
      error: null,
      tutorialCompleted: true,
      startNewGame: mockStartNewGame,
      submitOrder: vi.fn(),
      submitTrap: vi.fn(),
      submitQuiz: vi.fn(),
      completeTutorial: vi.fn(),
      finishGame: vi.fn(),
      resetGame: vi.fn(),
    });

    render(
      <BrowserRouter>
        <FomoArenaPage />
      </BrowserRouter>
    );

    // Mandatory disclosure banner
    expect(screen.getByText("SIMULATION ONLY")).toBeDefined();
    expect(screen.getByText(/Simulated execution only • Virtual funds/)).toBeDefined();

    // Empty state title & CTA
    expect(screen.getByText("Đấu Trường Tâm Lý — FOMO Arena")).toBeDefined();

    const startBtn = screen.getByRole("button", { name: /Bắt Đầu Vòng 1 Ngay/i });
    expect(startBtn).toBeDefined();
    fireEvent.click(startBtn);
    expect(mockStartNewGame).toHaveBeenCalled();
  });

  it("renders loading state when initializing session", () => {
    vi.spyOn(useMapGameModule, "useMap1Game").mockReturnValue({
      sessionId: null,
      state: null,
      debrief: null,
      isLoading: true,
      isSubmittingOrder: false,
      error: null,
      tutorialCompleted: true,
      startNewGame: vi.fn(),
      submitOrder: vi.fn(),
      submitTrap: vi.fn(),
      submitQuiz: vi.fn(),
      completeTutorial: vi.fn(),
      finishGame: vi.fn(),
      resetGame: vi.fn(),
    });

    render(
      <BrowserRouter>
        <FomoArenaPage />
      </BrowserRouter>
    );

    expect(screen.getByText("Đang khởi tạo đấu trường $FOMO Arena...")).toBeDefined();
  });

  it("renders error state with retry action", () => {
    const mockStartNewGame = vi.fn();
    vi.spyOn(useMapGameModule, "useMap1Game").mockReturnValue({
      sessionId: null,
      state: null,
      debrief: null,
      isLoading: false,
      isSubmittingOrder: false,
      error: "Không thể kết nối máy chủ mô phỏng.",
      tutorialCompleted: true,
      startNewGame: mockStartNewGame,
      submitOrder: vi.fn(),
      submitTrap: vi.fn(),
      submitQuiz: vi.fn(),
      completeTutorial: vi.fn(),
      finishGame: vi.fn(),
      resetGame: vi.fn(),
    });

    render(
      <BrowserRouter>
        <FomoArenaPage />
      </BrowserRouter>
    );

    expect(screen.getByText("Không thể kết nối máy chủ mô phỏng.")).toBeDefined();
    const retryBtn = screen.getByText("Thử lại");
    fireEvent.click(retryBtn);
    expect(mockStartNewGame).toHaveBeenCalled();
  });

  it("renders active in-progress game layout with chart, order ticket, and news", () => {
    vi.spyOn(useMapGameModule, "useMap1Game").mockReturnValue({
      sessionId: "session-1",
      state: {
        sessionId: "session-1",
        round: 1,
        totalRounds: 7,
        phase: "trading_window",
        secondInRound: 15,
        roundDurationSeconds: 45,
        timeRemainingInPhase: 15,
        status: "active",
        currentPrice: 12000,
        priceChangePercent: 15.5,
        cash: 10000000,
        shares: 0,
        marginUsed: 0,
        nav: 10000000,
        equity: 10000000,
        unrealizedPnl: 0,
        canUseMargin: false,
        freeStopLossAwarded: false,
        roundConfig: {
          roundNumber: 1,
          name: "Vòng 1: Tin đồn đầu tiên",
          priceChangePercent: 15,
          estimatedClosePrice: 12000,
          news: "Cổ phiếu $FOMO công bố tăng trưởng doanh thu 300%!",
          botChat: [
            { sender: "TraderPro99", message: "Múc cật lực anh em ơi!" },
          ],
          trap: null,
          quiz: null,
        },
        news: "Cổ phiếu $FOMO công bố tăng trưởng doanh thu 300%!",
        botChat: [
          { sender: "TraderPro99", message: "Múc cật lực anh em ơi!" },
        ],
        trap: null,
        quiz: null,
        pricePoints: [{ second: 1, price: 10000 }, { second: 15, price: 12000 }],
      },
      debrief: null,
      isLoading: false,
      isSubmittingOrder: false,
      error: null,
      tutorialCompleted: true,
      startNewGame: vi.fn(),
      submitOrder: vi.fn(),
      submitTrap: vi.fn(),
      submitQuiz: vi.fn(),
      completeTutorial: vi.fn(),
      finishGame: vi.fn(),
      resetGame: vi.fn(),
    });

    render(
      <BrowserRouter>
        <FomoArenaPage />
      </BrowserRouter>
    );

    // Verify news and bot chat
    expect(screen.getByText("Cổ phiếu $FOMO công bố tăng trưởng doanh thu 300%!")).toBeDefined();
    expect(screen.getByText("TraderPro99")).toBeDefined();
    expect(screen.getByText("Múc cật lực anh em ơi!")).toBeDefined();
    expect(screen.getByText(/Vòng 1: Tin đồn đầu tiên/)).toBeDefined();
  });
});
