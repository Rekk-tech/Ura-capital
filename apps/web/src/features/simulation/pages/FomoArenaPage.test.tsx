import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { FomoArenaPage } from "./FomoArenaPage";
import * as useMapGameHooks from "../hooks/use-map-game";
import * as AuthContextModule from "../../auth/context/AuthContext";

vi.mock("../../auth/context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../hooks/use-map-game", () => ({
  useMap1Game: vi.fn(),
  useMap2Game: vi.fn(),
}));

describe("FomoArenaPage (FEAT-082)", () => {
  const mockStartNewGame = vi.fn();
  const mockSubmitOrder = vi.fn();
  const mockSubmitTrap = vi.fn();
  const mockSubmitQuiz = vi.fn();
  const mockCompleteTutorial = vi.fn();
  const mockResetGame = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      user: { id: "user-1", email: "trader@ura.capital", role: "USER" },
      accessToken: "mock-token",
      refreshToken: "mock-refresh",
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshAuth: vi.fn(),
    } as unknown as ReturnType<typeof AuthContextModule.useAuth>);
  });

  it("renders disclosure banner and empty start screen when no session is active", () => {
    vi.mocked(useMapGameHooks.useMap1Game).mockReturnValue({
      sessionId: null,
      state: null,
      debrief: null,
      isLoading: false,
      isSubmittingOrder: false,
      error: null,
      tutorialCompleted: true,
      startNewGame: mockStartNewGame,
      submitOrder: mockSubmitOrder,
      submitTrap: mockSubmitTrap,
      submitQuiz: mockSubmitQuiz,
      finishGame: vi.fn(),
      completeTutorial: mockCompleteTutorial,
      resetGame: mockResetGame,
    });

    render(
      <MemoryRouter>
        <FomoArenaPage />
      </MemoryRouter>,
    );

    // Disclosure banner
    expect(screen.getByText(/SIMULATION ONLY/i)).toBeDefined();
    expect(screen.getByText(/NO REAL MONEY/i)).toBeDefined();
    // Empty state heading
    expect(screen.getByText(/Đấu Trường Tâm Lý — FOMO Arena/i)).toBeDefined();
    // Start button
    const startBtn = screen.getByRole("button", { name: /Bắt Đầu Vòng 1 Ngay/i });
    expect(startBtn).toBeDefined();

    fireEvent.click(startBtn);
    expect(mockStartNewGame).toHaveBeenCalledTimes(1);
  });

  it("renders loading state spinner during game initialization", () => {
    vi.mocked(useMapGameHooks.useMap1Game).mockReturnValue({
      sessionId: null,
      state: null,
      debrief: null,
      isLoading: true,
      isSubmittingOrder: false,
      error: null,
      tutorialCompleted: true,
      startNewGame: mockStartNewGame,
      submitOrder: mockSubmitOrder,
      submitTrap: mockSubmitTrap,
      submitQuiz: mockSubmitQuiz,
      finishGame: vi.fn(),
      completeTutorial: mockCompleteTutorial,
      resetGame: mockResetGame,
    });

    render(
      <MemoryRouter>
        <FomoArenaPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Đang khởi tạo đấu trường \$FOMO Arena.../i)).toBeDefined();
  });

  it("renders error banner with retry button on failure", () => {
    vi.mocked(useMapGameHooks.useMap1Game).mockReturnValue({
      sessionId: null,
      state: null,
      debrief: null,
      isLoading: false,
      isSubmittingOrder: false,
      error: "Không thể kết nối máy chủ giả lập",
      tutorialCompleted: true,
      startNewGame: mockStartNewGame,
      submitOrder: mockSubmitOrder,
      submitTrap: mockSubmitTrap,
      submitQuiz: mockSubmitQuiz,
      finishGame: vi.fn(),
      completeTutorial: mockCompleteTutorial,
      resetGame: mockResetGame,
    });

    render(
      <MemoryRouter>
        <FomoArenaPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Không thể kết nối máy chủ giả lập/i)).toBeDefined();
    const retryBtn = screen.getByRole("button", { name: /Thử lại/i });
    fireEvent.click(retryBtn);
    expect(mockStartNewGame).toHaveBeenCalledTimes(1);
  });

  it("renders active battleground with chart, news, timer, and order ticket", () => {
    vi.mocked(useMapGameHooks.useMap1Game).mockReturnValue({
      sessionId: "session-fomo-1",
      state: {
        sessionId: "session-fomo-1",
        round: 1,
        totalRounds: 7,
        phase: "trading_window",
        roundDurationSeconds: 45,
        secondInRound: 15,
        timeRemainingInPhase: 15,
        status: "active",
        currentPrice: 10500,
        priceChangePercent: 5.0,
        pricePoints: [
          { second: 0, price: 10000 },
          { second: 15, price: 10500 },
        ],
        news: "Cổ phiếu $FOMO bất ngờ bứt phá đỉnh cũ với thanh khoản kỷ lục",
        botChat: [
          { sender: "Thánh_Allin", message: "Múc cật lực anh em ơi!" },
        ],
        trap: null,
        quiz: null,
        roundConfig: {
          roundNumber: 1,
          name: "Bùng Nổ F0",
          priceChangePercent: 5.0,
          estimatedClosePrice: 10500,
          news: "Cổ phiếu $FOMO bất ngờ bứt phá đỉnh cũ với thanh khoản kỷ lục",
          botChat: [],
          trap: null,
          quiz: null,
          hint: "Thị trường hưng phấn quá đà",
        },
        cash: 100000000,
        shares: 0,
        marginUsed: 0,
        nav: 100000000,
        equity: 100000000,
        unrealizedPnl: 0,
        canUseMargin: false,
        freeStopLossAwarded: false,
      },
      debrief: null,
      isLoading: false,
      isSubmittingOrder: false,
      error: null,
      tutorialCompleted: true,
      startNewGame: mockStartNewGame,
      submitOrder: mockSubmitOrder,
      submitTrap: mockSubmitTrap,
      submitQuiz: mockSubmitQuiz,
      finishGame: vi.fn(),
      completeTutorial: mockCompleteTutorial,
      resetGame: mockResetGame,
    });

    render(
      <MemoryRouter>
        <FomoArenaPage />
      </MemoryRouter>,
    );

    // Chart header
    expect(screen.getAllByText(/\$FOMO/i)[0]).toBeDefined();
    // News banner
    expect(screen.getByText(/Cổ phiếu \$FOMO bất ngờ bứt phá đỉnh cũ/i)).toBeDefined();
    // Bot chat
    expect(screen.getByText(/\[Thánh_Allin\]:/i)).toBeDefined();
    // Order ticket
    expect(screen.getByText(/LỆNH MUA NHANH/i)).toBeDefined();
    // Margin locked warning in Round 1
    expect(screen.getByText(/Mở khóa từ Round 3/i)).toBeDefined();
  });

  it("renders debrief view when game concludes", () => {
    vi.mocked(useMapGameHooks.useMap1Game).mockReturnValue({
      sessionId: "session-fomo-1",
      state: null,
      debrief: {
        sessionId: "session-fomo-1",
        status: "completed_survived",
        isSurvived: true,
        initialCash: 100000000,
        finalNav: 112000000,
        pnlAmount: 12000000,
        pnlPercent: 12.0,
        fomoScore: 35,
        fomoClassification: "Kiểm Soát Tốt",
        disciplineScore: 82,
        disciplineClassification: "Kỷ Luật Vững Vàng",
        badgeAwarded: "Bàn Tay Kim Cương",
        unlocksMap2: true,
        topMistakes: [
          "Bán hoảng loạn ở đáy sóng giảm Round 5",
        ],
        ordersCount: 6,
        navHistory: [
          { round: 1, nav: 100000000, price: 10000 },
          { round: 7, nav: 112000000, price: 11200 },
        ],
      },
      isLoading: false,
      isSubmittingOrder: false,
      error: null,
      tutorialCompleted: true,
      startNewGame: mockStartNewGame,
      submitOrder: mockSubmitOrder,
      submitTrap: mockSubmitTrap,
      submitQuiz: mockSubmitQuiz,
      finishGame: vi.fn(),
      completeTutorial: mockCompleteTutorial,
      resetGame: mockResetGame,
    });

    render(
      <MemoryRouter>
        <FomoArenaPage />
      </MemoryRouter>,
    );

    // Debrief outcome
    expect(screen.getByText(/SỐNG SÓT QUA BÃO FOMO/i)).toBeDefined();
    expect(screen.getByText(/Survivor of FOMO Storm/i)).toBeDefined();
    expect(screen.getByText(/Vào Map 2: Pro Room/i)).toBeDefined();
  });
});
