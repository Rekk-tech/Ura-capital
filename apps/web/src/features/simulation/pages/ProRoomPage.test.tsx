import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { ProRoomPage } from "./ProRoomPage";
import * as useMapGameModule from "../hooks/use-map-game";
import type { Map2FinalReport } from "../types/map-game.types";

vi.mock("../hooks/use-map-game");
vi.mock("../../auth/context/AuthContext", () => ({
  useAuth: () => ({
    accessToken: "mock-token",
    isAuthenticated: true,
    user: { id: "user-1", email: "user@ura.local" },
  }),
}));

describe("ProRoomPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders empty state with Start Room CTA and Disclosure banner", () => {
    const mockStartNewGame = vi.fn();
    vi.spyOn(useMapGameModule, "useMap2Game").mockReturnValue({
      sessionId: null,
      session: null,
      lastQuarterRecord: null,
      report: null,
      isLoading: false,
      isCommitting: false,
      error: null,
      startNewGame: mockStartNewGame,
      updateAllocation: vi.fn(),
      submitQuiz: vi.fn(),
      commitQuarter: vi.fn(),
      fetchReport: vi.fn(),
      resetGame: vi.fn(),
    });

    render(
      <BrowserRouter>
        <ProRoomPage />
      </BrowserRouter>
    );

    // Disclosure banner
    expect(screen.getByText("SIMULATION ONLY")).toBeDefined();
    expect(screen.getByText(/Simulated execution only • Virtual funds/)).toBeDefined();

    // Empty state title & CTA
    expect(screen.getByText("Phòng Quản Trị Danh Mục — Pro Room")).toBeDefined();
    expect(screen.getByText("Khai Mạc Chu Kỳ 12 Quý")).toBeDefined();

    const startBtn = screen.getByRole("button", { name: /Khai Mạc Chu Kỳ 12 Quý/i });
    expect(startBtn).toBeDefined();
    fireEvent.click(startBtn);
    expect(mockStartNewGame).toHaveBeenCalled();
  });

  it("renders loading state when initializing session", () => {
    vi.spyOn(useMapGameModule, "useMap2Game").mockReturnValue({
      sessionId: null,
      session: null,
      lastQuarterRecord: null,
      report: null,
      isLoading: true,
      isCommitting: false,
      error: null,
      startNewGame: vi.fn(),
      updateAllocation: vi.fn(),
      submitQuiz: vi.fn(),
      commitQuarter: vi.fn(),
      fetchReport: vi.fn(),
      resetGame: vi.fn(),
    });

    render(
      <BrowserRouter>
        <ProRoomPage />
      </BrowserRouter>
    );

    expect(screen.getByText("Đang khởi tạo phòng quản trị Pro Room...")).toBeDefined();
  });

  it("renders active session with ProMacroPanel, ProAllocationSliders, and AI Advisor", () => {
    vi.spyOn(useMapGameModule, "useMap2Game").mockReturnValue({
      sessionId: "pro-session-1",
      session: {
        id: "pro-session-1",
        userId: "user-1",
        currentQuarter: 1,
        initialCash: 100000000,
        currentNav: 100000000,
        peakNav: 100000000,
        maxDrawdown: 0,
        creditScore: 100,
        status: "active",
        currentAllocation: { growth: 40, value: 30, bond: 20, cash: 10 },
        history: [],
        startedAt: "2026-09-30T00:00:00.000Z",
      },
      lastQuarterRecord: null,
      report: null,
      isLoading: false,
      isCommitting: false,
      error: null,
      startNewGame: vi.fn(),
      updateAllocation: vi.fn(),
      submitQuiz: vi.fn(),
      commitQuarter: vi.fn(),
      fetchReport: vi.fn(),
      resetGame: vi.fn(),
    });

    render(
      <BrowserRouter>
        <ProRoomPage />
      </BrowserRouter>
    );

    // Active session header
    expect(screen.getByText(/DỮ LIỆU MÔ PHỎNG QUÝ 1/)).toBeDefined();

    // Allocation sliders & donut legend (getAllByText since both slider and donut have asset keys)
    expect(screen.getAllByText(/EQ_GROWTH/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/EQ_VALUE/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/BOND/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/CASH/).length).toBeGreaterThan(0);

    // AI Advisor box
    expect(screen.getByText("Cố Vấn Đầu Tư Giá Trị (AI Advisor)")).toBeDefined();
  });

  it("renders final report state with investment certificate, metrics, and community share button", () => {
    const mockReport: Map2FinalReport = {
      sessionId: "pro-session-1",
      status: "completed",
      initialCash: 100000000,
      finalNav: 118500000,
      totalPnlAmount: 18500000,
      totalPnlPercent: 18.5,
      cagr: 0.058,
      benchmarkCagr: 0.085,
      alpha: -0.027,
      maxDrawdown: 0.112,
      sharpeRatio: 1.45,
      creditScore: 110,
      investmentStyle: "Nhà đầu tư Giá trị (Value Investor)",
      styleDescription: "Bạn kiên định phân bổ vào các doanh nghiệp nền tảng tài chính lành mạnh.",
      advisorOverallSummary: "Kỷ luật phân bổ tài sản phòng thủ vững vàng qua 12 quý.",
      quarterHistory: [
        {
          quarter: 1,
          stage: "BÙNG NỔ",
          stageKey: "BOOM",
          rate: 5.0,
          inflation: 2.5,
          gdp: 7.5,
          allocation: { growth: 25, value: 25, bond: 25, cash: 25 },
          returns: { growth: 0.05, value: 0.02, bond: 0.018, cash: 0.01, portfolio: 0.024 },
          nav: 102400000,
          pnlQuarterAmount: 2400000,
          pnlQuarterPercent: 2.4,
          drawdown: 0,
          advisorNote: "Khởi đầu vững chắc.",
        },
      ],
    };

    const mockResetGame = vi.fn();
    const mockStartNewGame = vi.fn();

    vi.spyOn(useMapGameModule, "useMap2Game").mockReturnValue({
      sessionId: "pro-session-1",
      session: null,
      lastQuarterRecord: null,
      report: mockReport,
      isLoading: false,
      isCommitting: false,
      error: null,
      startNewGame: mockStartNewGame,
      updateAllocation: vi.fn(),
      submitQuiz: vi.fn(),
      commitQuarter: vi.fn(),
      fetchReport: vi.fn(),
      resetGame: mockResetGame,
    });

    render(
      <BrowserRouter>
        <ProRoomPage />
      </BrowserRouter>
    );

    // Certificate and style
    expect(screen.getByText("CHỨNG CHỈ TỐT NGHIỆP PRO ROOM")).toBeDefined();
    expect(screen.getAllByText(/Nhà đầu tư Giá trị \(Value Investor\)/i).length).toBeGreaterThan(0);

    // 4 Quantitative Metrics
    expect(screen.getByText("Tỷ Suất CAGR / Năm")).toBeDefined();
    expect(screen.getByText("Alpha vs VN-Index")).toBeDefined();
    expect(screen.getByText("Max Drawdown (MDD)")).toBeDefined();
    expect(screen.getByText("Tỷ Số Sharpe Ratio")).toBeDefined();

    // Action buttons
    expect(screen.getByRole("button", { name: /Chia Sẻ Lên Cộng Đồng/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Chơi Lại Map 2/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Về Sảnh Giả Lập/i })).toBeDefined();

    // Replay button triggers reset
    fireEvent.click(screen.getByRole("button", { name: /Chơi Lại Map 2/i }));
    expect(mockResetGame).toHaveBeenCalled();
    expect(mockStartNewGame).toHaveBeenCalled();
  });

  it("opens macro explanation modal when clicking transmission diagram button", () => {
    vi.spyOn(useMapGameModule, "useMap2Game").mockReturnValue({
      sessionId: "pro-session-1",
      session: {
        id: "pro-session-1",
        userId: "user-1",
        currentQuarter: 1,
        initialCash: 100000000,
        currentNav: 100000000,
        peakNav: 100000000,
        maxDrawdown: 0,
        creditScore: 100,
        status: "active",
        currentAllocation: { growth: 25, value: 25, bond: 25, cash: 25 },
        history: [],
        startedAt: "2026-09-30T00:00:00.000Z",
      },
      lastQuarterRecord: null,
      report: null,
      isLoading: false,
      isCommitting: false,
      error: null,
      startNewGame: vi.fn(),
      updateAllocation: vi.fn(),
      submitQuiz: vi.fn(),
      commitQuarter: vi.fn(),
      fetchReport: vi.fn(),
      resetGame: vi.fn(),
    });

    render(
      <BrowserRouter>
        <ProRoomPage />
      </BrowserRouter>
    );

    const explainerBtn = screen.getByRole("button", { name: /Sơ đồ truyền dẫn vĩ mô/i });
    expect(explainerBtn).toBeDefined();

    fireEvent.click(explainerBtn);

    // Modal should be visible
    expect(screen.getByRole("dialog")).toBeDefined();
    expect(screen.getByText(/Sơ Đồ Phản Ứng Dây Chuyền Vĩ Mô/i)).toBeDefined();

    // Close button
    const closeBtn = screen.getByRole("button", { name: /Đã hiểu cơ chế vĩ mô/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
