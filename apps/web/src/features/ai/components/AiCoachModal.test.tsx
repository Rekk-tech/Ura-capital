import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AiCoachModal } from "./AiCoachModal";
import { AiCoachFab } from "./AiCoachFab";
import { AiCoachWidget } from "./AiCoachWidget";
import { openAiCoach } from "../events";
import * as aiApiModule from "../../../api/ai.api";

// Configurable mock states
let mockAuthState: {
  user: { id: string; email: string; role?: string } | null;
  accessToken: string | null;
  isAuthenticated: boolean;
} = {
  user: { id: "user-1", email: "admin@aura.internal", role: "ADMIN" },
  accessToken: "mock-token",
  isAuthenticated: true,
};

let mockSubscriptionState: {
  data: { data: { plan: string; status: string } } | null;
  isLoading: boolean;
} = {
  data: {
    data: {
      plan: "PREMIUM",
      status: "ACTIVE",
    },
  },
  isLoading: false,
};

// Mock AuthContext
vi.mock("../../auth/context/AuthContext", () => ({
  useAuth: () => mockAuthState,
}));

// Mock Subscription Query
vi.mock("../../subscription/hooks/use-subscription", () => ({
  useCurrentSubscriptionQuery: () => mockSubscriptionState,
}));

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe("AiCoachModal (Unit Tests)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockAuthState = {
      user: { id: "user-1", email: "admin@aura.internal", role: "ADMIN" },
      accessToken: "mock-token",
      isAuthenticated: true,
    };
    mockSubscriptionState = {
      data: {
        data: {
          plan: "PREMIUM",
          status: "ACTIVE",
        },
      },
      isLoading: false,
    };
    // Scroll mock
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it("does not render dialog when isOpen is false", () => {
    renderWithRouter(<AiCoachModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders dialog when isOpen is true with brand, initial greeting, and quick suggestions for entitled users", () => {
    renderWithRouter(<AiCoachModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByRole("dialog")).toBeDefined();
    expect(screen.getByText("Aura Intelligence")).toBeDefined();
    expect(screen.getByText("ADMIN VIP")).toBeDefined();
    expect(screen.getByText(/Tôi là Aura Intelligence/i)).toBeDefined();
    expect(screen.getByText("Giải thích chỉ số P/E & P/B trong đầu tư chứng khoán")).toBeDefined();
    expect(screen.getByText(/Mọi tư vấn chỉ mang tính chất giáo dục mô phỏng/i)).toBeDefined();
  });

  it("calls onClose when close button is clicked", () => {
    const handleClose = vi.fn();
    renderWithRouter(<AiCoachModal isOpen={true} onClose={handleClose} />);

    const closeBtn = screen.getByLabelText("Đóng cửa sổ cố vấn");
    fireEvent.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("toggles between docked mode and expanded study mode when clicking maximize button", () => {
    renderWithRouter(<AiCoachModal isOpen={true} onClose={vi.fn()} />);

    const toggleBtn = screen.getByLabelText("Phóng to hoặc thu nhỏ cửa sổ cố vấn");
    expect(toggleBtn).toBeDefined();

    // Initial state is docked mode
    const dialog = screen.getByRole("dialog");
    expect(dialog.className).toContain("ai-coach-dialog-docked");

    // Click to maximize
    fireEvent.click(toggleBtn);
    expect(dialog.className).toContain("ai-coach-dialog-expanded");

    // Click again to shrink back to docked mode
    fireEvent.click(toggleBtn);
    expect(dialog.className).toContain("ai-coach-dialog-docked");
  });

  it("calls onClose when minimize button is clicked", () => {
    const handleClose = vi.fn();
    renderWithRouter(<AiCoachModal isOpen={true} onClose={handleClose} />);

    const minBtn = screen.getByLabelText("Thu gọn cửa sổ cố vấn");
    fireEvent.click(minBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("sends query when clicking suggestion chip and displays coach response for entitled users", async () => {
    vi.spyOn(aiApiModule, "askAiCoach").mockResolvedValueOnce({
      answer: "P/E thấp phản ánh mức định giá hấp dẫn trong điều kiện lợi nhuận bền vững.",
      intent: "CONCEPT_EXPLANATION",
      confidence: 0.95,
      suggestions: ["Làm thế nào để nhận diện bẫy giá rẻ?"],
      disclaimer: "Mọi tư vấn mang tính giáo dục mô phỏng.",
      source: "deterministic_engine",
    });

    renderWithRouter(<AiCoachModal isOpen={true} onClose={vi.fn()} />);

    const chip = screen.getByText("Giải thích chỉ số P/E & P/B trong đầu tư chứng khoán");
    fireEvent.click(chip);

    await waitFor(() => {
      expect(screen.getByText(/P\/E thấp phản ánh mức định giá hấp dẫn/i)).toBeDefined();
    });
  });

  it("renders luxury membership gating card and upgrade CTA when user is on FREE tier", () => {
    mockAuthState = {
      user: { id: "user-free", email: "free@aura.internal", role: "USER" },
      accessToken: "mock-token",
      isAuthenticated: true,
    };
    mockSubscriptionState = {
      data: {
        data: {
          plan: "FREE",
          status: "ACTIVE",
        },
      },
      isLoading: false,
    };

    renderWithRouter(<AiCoachModal isOpen={true} onClose={vi.fn()} />);

    // Header displays gated badge
    expect(screen.getByText("KHÓA HỘI VIÊN")).toBeDefined();

    // Gating Card is shown
    expect(screen.getByText("ĐẶC QUYỀN HỘI VIÊN CAO CẤP")).toBeDefined();
    expect(screen.getByText(/Mở Khóa Trợ Lý Cố Vấn/i)).toBeDefined();
    expect(screen.getByText(/Aura Intelligence AI Coach/i)).toBeDefined();
    expect(screen.getByText("Nâng Cấp Gói Premium Ngay")).toBeDefined();
    expect(screen.getByRole("link", { name: /Nâng Cấp Gói Premium Ngay/i })).toBeDefined();

    // Reset button should not be present
    expect(screen.queryByLabelText("Khởi tạo lại cuộc trò chuyện")).toBeNull();
    // Input form should not be present
    expect(screen.queryByPlaceholderText(/Đặt câu hỏi về P\/E/i)).toBeNull();
  });

  it("renders gating card with login CTA when user is unauthenticated", () => {
    mockAuthState = {
      user: null,
      accessToken: null,
      isAuthenticated: false,
    };
    mockSubscriptionState = {
      data: null,
      isLoading: false,
    };

    renderWithRouter(<AiCoachModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText("KHÓA HỘI VIÊN")).toBeDefined();
    expect(screen.getByText("Đăng Nhập Tài Khoản")).toBeDefined();
    expect(screen.getByRole("link", { name: /Đăng Nhập Tài Khoản/i })).toBeDefined();
    expect(screen.getByText("Xem Bảng Gói Hội Viên")).toBeDefined();
  });

  it("renders full co-pilot interface with PREMIUM VIP badge when user has active PREMIUM subscription", () => {
    mockAuthState = {
      user: { id: "user-vip", email: "vip@aura.internal", role: "USER" },
      accessToken: "mock-token",
      isAuthenticated: true,
    };
    mockSubscriptionState = {
      data: {
        data: {
          plan: "PREMIUM",
          status: "ACTIVE",
        },
      },
      isLoading: false,
    };

    renderWithRouter(<AiCoachModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText("PREMIUM VIP")).toBeDefined();
    expect(screen.getByPlaceholderText(/Đặt câu hỏi về P\/E/i)).toBeDefined();
    expect(screen.getByLabelText("Khởi tạo lại cuộc trò chuyện")).toBeDefined();
  });
});

describe("AiCoachFab & AiCoachWidget", () => {
  it("renders floating action button and triggers onClick", () => {
    const handleClick = vi.fn();
    renderWithRouter(<AiCoachFab onClick={handleClick} />);

    const fab = screen.getByRole("button", { name: /Mở Cố vấn Trợ lý AI/i });
    expect(fab).toBeDefined();

    fireEvent.click(fab);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("opens docked co-pilot via global openAiCoach event", async () => {
    renderWithRouter(<AiCoachWidget />);

    // Initially closed, FAB is visible
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("button", { name: /Mở Cố vấn Trợ lý AI/i })).toBeDefined();

    // Trigger global event inside act
    act(() => {
      openAiCoach("MAP1");
    });

    // Co-Pilot dialog should appear
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeDefined();
    });
  });
});
