import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../../auth/context/AuthContext";
import { AiStudioPage } from "./AiStudioPage";
import { subscriptionApi } from "../../../api/subscription.api";
import * as aiApi from "../../../api/ai.api";
import { AuthUser } from "../../../api/auth.api";

describe("AiStudioPage (FEAT-086: AC-001..AC-004)", () => {
  let queryClient: QueryClient;

  const mockLearnerUser: AuthUser = {
    id: "usr-learner-vip",
    email: "vip.trader@auracapital.io",
    displayName: "VIP Trader",
    status: "ACTIVE",
    role: "LEARNER",
  };

  const mockAdminUser: AuthUser = {
    id: "usr-admin-1",
    email: "admin@auracapital.io",
    displayName: "Admin Operator",
    status: "ACTIVE",
    role: "ADMIN",
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderPage = ({
    user = mockLearnerUser,
    token = "mock-access-token" as string | null,
    plan = "PREMIUM",
    status = "ACTIVE",
  }: {
    user?: AuthUser | null;
    token?: string | null;
    plan?: "FREE" | "PREMIUM";
    status?: "ACTIVE" | "NONE" | "CANCELLED";
  } = {}) => {
    vi.spyOn(subscriptionApi, "getCurrent").mockResolvedValue({
      data: {
        plan,
        planKey: plan,
        status,
        entitlements: plan === "PREMIUM" ? ["PREMIUM_ACCESS"] : [],
        isEntitled: plan === "PREMIUM" && status === "ACTIVE",
        currentPeriodStart: "2026-09-01T00:00:00Z",
        currentPeriodEnd: "2026-10-01T00:00:00Z",
        cancelAtPeriodEnd: false,
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider initialToken={token} initialUser={user} initialIsLoading={false}>
          <MemoryRouter initialEntries={["/ai"]}>
            <Routes>
              <Route path="/ai" element={<AiStudioPage />} />
              <Route path="/subscription" element={<div>Subscription Target</div>} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    );
  };

  it("renders luxury membership gating card for Free Explorer learners", async () => {
    renderPage({ plan: "FREE", status: "NONE" });

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Mở Khóa Trợ Lý Cố Vấn/i })).toBeDefined();
    });
    expect(screen.getByText(/Gói Miễn Phí \(Free Tier\)/i)).toBeDefined();
    expect(screen.getByText(/Nâng Cấp Gói Premium Ngay/i)).toBeDefined();
  });

  it("renders full AI Studio workspace for authenticated VIP members", async () => {
    renderPage({ plan: "PREMIUM", status: "ACTIVE" });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Nhập câu hỏi tài chính/i)).toBeDefined();
    });

    // Guardrail security status badge
    const guardrailBadge = screen.getByTestId("guardrail-status-badge");
    expect(guardrailBadge.textContent).toContain("AI Guardrail Engine: ACTIVE");

    // Quota indicator
    expect(screen.getByText(/50 req\/phút/i)).toBeDefined();

    // Preset categories
    expect(screen.getByText("Định Giá & Báo Cáo Tài Chính")).toBeDefined();
    expect(screen.getByText("Đấu Trường FOMO (Map 1)")).toBeDefined();
    expect(screen.getByText("Chiến Lược Vĩ Mô Pro Room (Map 2)")).toBeDefined();
  });

  it("renders full AI Studio workspace for Administrator accounts regardless of subscription", async () => {
    renderPage({ user: mockAdminUser, plan: "FREE", status: "NONE" });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Nhập câu hỏi tài chính/i)).toBeDefined();
    });
    expect(screen.getByTestId("guardrail-status-badge")).toBeDefined();
  });

  it("submits prompt query and renders AI response stream", async () => {
    vi.spyOn(aiApi, "askAiCoach").mockResolvedValue({
      answer: "P/E (Price-to-Earnings) phản ánh tỷ lệ giá cổ phiếu so với lợi nhuận trên mỗi cổ phần.",
      suggestions: ["So sánh P/E ngành", "Ý nghĩa chỉ số P/B"],
      intent: "EQUITY_VALUATION",
      confidence: 0.95,
      disclaimer: "Thông tin tham khảo giáo dục tài chính Aura Capital.",
      source: "gemini",
    });

    renderPage({ plan: "PREMIUM", status: "ACTIVE" });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Nhập câu hỏi tài chính/i)).toBeDefined();
    });

    const input = screen.getByPlaceholderText(/Nhập câu hỏi tài chính/i);
    fireEvent.change(input, { target: { value: "Giải thích P/E" } });
    fireEvent.click(screen.getByRole("button", { name: /Gửi/i }));

    await waitFor(() => {
      expect(screen.getByText(/P\/E \(Price-to-Earnings\) phản ánh/i)).toBeDefined();
    });
  });
});
