import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ProRoomPage } from "./ProRoomPage";
import * as useMapGameHooks from "../hooks/use-map-game";
import * as AuthContextModule from "../../auth/context/AuthContext";

vi.mock("../../auth/context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../hooks/use-map-game", () => ({
  useMap1Game: vi.fn(),
  useMap2Game: vi.fn(),
}));

describe("ProRoomPage (FEAT-082)", () => {
  const mockStartNewGame = vi.fn();
  const mockCommitQuarter = vi.fn();
  const mockSubmitQuiz = vi.fn();
  const mockUpdateAllocation = vi.fn();
  const mockResetGame = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      user: { id: "user-pro-1", email: "pro@ura.capital", role: "USER" },
      accessToken: "mock-pro-token",
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
    vi.mocked(useMapGameHooks.useMap2Game).mockReturnValue({
      sessionId: null,
      session: null,
      lastQuarterRecord: null,
      report: null,
      isLoading: false,
      isCommitting: false,
      error: null,
      startNewGame: mockStartNewGame,
      updateAllocation: mockUpdateAllocation,
      submitQuiz: mockSubmitQuiz,
      commitQuarter: mockCommitQuarter,
      fetchReport: vi.fn(),
      resetGame: mockResetGame,
    });

    render(
      <MemoryRouter>
        <ProRoomPage />
      </MemoryRouter>,
    );

    // Disclosure banner
    expect(screen.getByText(/SIMULATION ONLY/i)).toBeDefined();
    expect(screen.getByText(/NO REAL MONEY/i)).toBeDefined();
    // Empty state heading
    expect(screen.getByText(/Phòng Quản Trị Danh Mục — Pro Room/i)).toBeDefined();
    // Start button
    const startBtn = screen.getByRole("button", { name: /Khai Mạc Chu Kỳ 12 Quý/i });
    expect(startBtn).toBeDefined();

    fireEvent.click(startBtn);
    expect(mockStartNewGame).toHaveBeenCalledTimes(1);
  });

  it("renders loading state spinner during Pro Room initialization", () => {
    vi.mocked(useMapGameHooks.useMap2Game).mockReturnValue({
      sessionId: null,
      session: null,
      lastQuarterRecord: null,
      report: null,
      isLoading: true,
      isCommitting: false,
      error: null,
      startNewGame: mockStartNewGame,
      updateAllocation: mockUpdateAllocation,
      submitQuiz: mockSubmitQuiz,
      commitQuarter: mockCommitQuarter,
      fetchReport: vi.fn(),
      resetGame: mockResetGame,
    });

    render(
      <MemoryRouter>
        <ProRoomPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Đang khởi tạo phòng quản trị Pro Room.../i)).toBeDefined();
  });

  it("renders error state with retry button", () => {
    vi.mocked(useMapGameHooks.useMap2Game).mockReturnValue({
      sessionId: null,
      session: null,
      lastQuarterRecord: null,
      report: null,
      isLoading: false,
      isCommitting: false,
      error: "Không thể kết nối máy chủ Map 2",
      startNewGame: mockStartNewGame,
      updateAllocation: mockUpdateAllocation,
      submitQuiz: mockSubmitQuiz,
      commitQuarter: mockCommitQuarter,
      fetchReport: vi.fn(),
      resetGame: mockResetGame,
    });

    render(
      <MemoryRouter>
        <ProRoomPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Không thể kết nối máy chủ Map 2/i)).toBeDefined();
    const retryBtn = screen.getByRole("button", { name: /Thử lại/i });
    fireEvent.click(retryBtn);
    expect(mockStartNewGame).toHaveBeenCalledTimes(1);
  });

  it("renders active cockpit with macro metrics, sliders, and Graham & Buffett AI advisor", () => {
    vi.mocked(useMapGameHooks.useMap2Game).mockReturnValue({
      sessionId: "session-pro-1",
      session: {
        id: "session-pro-1",
        userId: "user-pro-1",
        status: "active",
        currentQuarter: 1,
        initialCash: 100000000,
        currentNav: 100000000,
        peakNav: 100000000,
        maxDrawdown: 0,
        creditScore: 0,
        currentAllocation: {
          growth: 40,
          value: 30,
          bond: 20,
          cash: 10,
        },
        history: [],
        startedAt: "2026-09-30T00:00:00.000Z",
      },
      lastQuarterRecord: {
        quarter: 1,
        stage: "BÙNG NỔ",
        stageKey: "BOOM",
        rate: 5.0,
        inflation: 2.5,
        gdp: 7.5,
        allocation: { growth: 40, value: 30, bond: 20, cash: 10 },
        returns: { growth: 6.0, value: 3.0, bond: 1.5, cash: 1.0, portfolio: 3.75 },
        nav: 103750000,
        pnlQuarterAmount: 3750000,
        pnlQuarterPercent: 3.75,
        drawdown: 0,
        advisorNote: "Giai đoạn Bùng nổ: kinh tế tăng trưởng tốt nhưng định giá bắt đầu tiệm cận mức cao.",
      },
      report: null,
      isLoading: false,
      isCommitting: false,
      error: null,
      startNewGame: mockStartNewGame,
      updateAllocation: mockUpdateAllocation,
      submitQuiz: mockSubmitQuiz,
      commitQuarter: mockCommitQuarter,
      fetchReport: vi.fn(),
      resetGame: mockResetGame,
    });

    render(
      <MemoryRouter>
        <ProRoomPage />
      </MemoryRouter>,
    );

    // Stage indicator
    expect(screen.getAllByText(/BÙNG NỔ/i)[0]).toBeDefined();
    expect(screen.getByText(/CHU KỲ VĨ MÔ 3 NĂM/i)).toBeDefined();

    // AI Advisor speech box
    expect(screen.getByText(/Triết Lý Giá Trị Graham & Buffett/i)).toBeDefined();
    expect(screen.getByText(/Giai đoạn Bùng nổ: kinh tế tăng trưởng tốt/i)).toBeDefined();

    // Allocation sliders
    expect(screen.getByText(/Phân Bổ Tài Sản/i)).toBeDefined();
    expect(screen.getByText(/Cổ phiếu Tăng trưởng/i)).toBeDefined();
    expect(screen.getByText(/Cổ phiếu Giá trị/i)).toBeDefined();

    // Macro causality button opens modal
    const explainerBtn = screen.getByRole("button", { name: /Sơ đồ phản ứng dây chuyền vĩ mô/i });
    fireEvent.click(explainerBtn);
    expect(screen.getByText(/Cơ Chế Phản Ứng Dây Chuyền Vĩ Mô/i)).toBeDefined();
  });

  it("renders final portfolio report when quarter 12 concludes", () => {
    vi.mocked(useMapGameHooks.useMap2Game).mockReturnValue({
      sessionId: "session-pro-1",
      session: null,
      lastQuarterRecord: null,
      report: {
        sessionId: "session-pro-1",
        status: "completed",
        initialCash: 100000000,
        finalNav: 138500000,
        totalPnlAmount: 38500000,
        totalPnlPercent: 38.5,
        cagr: 0.1145,
        benchmarkCagr: 0.085,
        alpha: 0.0295,
        maxDrawdown: 0.112,
        sharpeRatio: 1.42,
        creditScore: 90,
        investmentStyle: "Nhà Đầu Tư Giá Trị Bền Vững",
        styleDescription: "Quản trị rủi ro xuất sắc qua cả 4 pha chu kỳ vĩ mô.",
        advisorOverallSummary: "Danh mục thể hiện bản lĩnh đầu tư giá trị vượt trội.",
        quarterHistory: [
          {
            quarter: 1,
            stage: "BÙNG NỔ",
            stageKey: "BOOM",
            rate: 5.0,
            inflation: 2.5,
            gdp: 7.5,
            allocation: { growth: 40, value: 30, bond: 20, cash: 10 },
            returns: { growth: 6.0, value: 3.0, bond: 1.5, cash: 1.0, portfolio: 3.75 },
            nav: 103750000,
            pnlQuarterAmount: 3750000,
            pnlQuarterPercent: 3.75,
            drawdown: 0,
            advisorNote: "Khởi đầu vững chắc.",
          },
          {
            quarter: 12,
            stage: "HỒI PHỤC & TÁI THIẾT",
            stageKey: "RECOVERY",
            rate: 6.0,
            inflation: 3.0,
            gdp: 6.0,
            allocation: { growth: 50, value: 30, bond: 10, cash: 10 },
            returns: { growth: 5.0, value: 3.0, bond: 1.5, cash: 1.0, portfolio: 3.65 },
            nav: 138500000,
            pnlQuarterAmount: 4800000,
            pnlQuarterPercent: 3.65,
            drawdown: 0.08,
            advisorNote: "Hoàn tất chu kỳ 12 quý.",
          },
        ],
      },
      isLoading: false,
      isCommitting: false,
      error: null,
      startNewGame: mockStartNewGame,
      updateAllocation: mockUpdateAllocation,
      submitQuiz: mockSubmitQuiz,
      commitQuarter: mockCommitQuarter,
      fetchReport: vi.fn(),
      resetGame: mockResetGame,
    });

    render(
      <MemoryRouter>
        <ProRoomPage />
      </MemoryRouter>,
    );

    // Report metrics
    expect(screen.getByText(/Báo Cáo Tổng Kết Danh Mục 3 Năm/i)).toBeDefined();
    expect(screen.getAllByText(/Nhà Đầu Tư Giá Trị Bền Vững/i)[0]).toBeDefined();
    expect(screen.getByText(/11.45%/i)).toBeDefined();
    expect(screen.getByText(/\+2.95%/i)).toBeDefined();
  });
});
