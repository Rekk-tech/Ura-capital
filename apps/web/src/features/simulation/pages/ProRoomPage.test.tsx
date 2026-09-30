import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { ProRoomPage } from "./ProRoomPage";
import * as useMapGameModule from "../hooks/use-map-game";

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

    // Allocation sliders
    expect(screen.getByText(/EQ_GROWTH/)).toBeDefined();
    expect(screen.getByText(/EQ_VALUE/)).toBeDefined();
    expect(screen.getByText(/BOND/)).toBeDefined();
    expect(screen.getByText(/CASH/)).toBeDefined();

    // AI Advisor box
    expect(screen.getByText("Cố Vấn Đầu Tư Giá Trị (AI Advisor)")).toBeDefined();
  });
});
