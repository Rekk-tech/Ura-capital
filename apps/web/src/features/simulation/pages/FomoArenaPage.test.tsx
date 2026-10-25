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

    // Verify 100px yellow disclaimer banner is completely HIDDEN during gameplay
    expect(screen.queryByText("SIMULATION ONLY")).toBeNull();

    // Verify subtle footer disclaimer badge is present
    expect(screen.getByText(/🛡️ Sàn đấu thực chiến giả lập • 100% vốn ảo/)).toBeDefined();

    // Verify Vietnamese Financial Hybrid terminology in Cockpit
    expect(screen.getAllByText(/TỔNG TÀI SẢN \(NAV\)/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/TIỀN MẶT \(CASH\)/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/LÃI\/LỖ \(P&L\)/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/MUA \(BUY\)/i)).toBeDefined();
    expect(screen.getByText(/BÁN \(SELL\)/i)).toBeDefined();
  });

  it("renders FEAT-089 scenario selector with 3 cards, metrics, filters, and switches active scenario", () => {
    vi.spyOn(useMapGameModule, "useMap1Game").mockReturnValue({
      sessionId: null,
      state: null,
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

    // Verify top room id
    expect(screen.getByText("ROOM_ID: ARENA-VN30-SIM-07")).toBeDefined();

    // Verify 4 metric cards
    expect(screen.getByText("VỐN CẤP KHỞI ĐIỂM")).toBeDefined();
    expect(screen.getByText("10.000.000")).toBeDefined();
    expect(screen.getByText("THỜI LƯỢNG MỖI VÒNG")).toBeDefined();
    expect(screen.getByText("7 Vòng × 45 Giây")).toBeDefined();
    expect(screen.getByText("CHỈ TIÊU VƯỢT ẢI")).toBeDefined();
    expect(screen.getByText("ROI ≥ +5.0%")).toBeDefined();
    expect(screen.getByText("TỶ LỆ SỐNG SÓT F0")).toBeDefined();
    expect(screen.getByText("34.2%")).toBeDefined();

    // Verify 3 code tags
    expect(screen.getByText("SVIX_PUMP")).toBeDefined();
    expect(screen.getByText("SNVL_CRASH")).toBeDefined();
    expect(screen.getByText("SFPT_EXP")).toBeDefined();

    // Verify initial active scenario in bottom bar
    expect(screen.getByText("KỊCH BẢN ĐANG CHỌN")).toBeDefined();
    expect(screen.getAllByText("Sóng Đầu Cơ Penny & Bẫy Kéo Xả ATO").length).toBeGreaterThanOrEqual(1);

    // Click on SNVL_CRASH card to select it
    const nvlCard = screen.getByText("Đóng Băng Thanh Khoản BĐS & Khủng Hoảng Nợ");
    fireEvent.click(nvlCard);

    // Now bottom action bar should display SNVL_CRASH scenario name
    expect(screen.getAllByText("Đóng Băng Thanh Khoản BĐS & Khủng Hoảng Nợ").length).toBeGreaterThanOrEqual(2);

    // Test difficulty filter tabs
    const hardFilterBtn = screen.getByRole("button", { name: "Khốc Liệt" });
    fireEvent.click(hardFilterBtn);

    // In Khốc Liệt filter, only SNVL_CRASH is rendered
    expect(screen.getByText("SNVL_CRASH")).toBeDefined();
    expect(screen.queryByText("SVIX_PUMP")).toBeNull();
    expect(screen.queryByText("SFPT_EXP")).toBeNull();

    // Switch back to Tất Cả
    const allFilterBtn = screen.getByRole("button", { name: "Tất Cả (3)" });
    fireEvent.click(allFilterBtn);
    expect(screen.getByText("SVIX_PUMP")).toBeDefined();
    expect(screen.getByText("SNVL_CRASH")).toBeDefined();
    expect(screen.getByText("SFPT_EXP")).toBeDefined();
  });
});
