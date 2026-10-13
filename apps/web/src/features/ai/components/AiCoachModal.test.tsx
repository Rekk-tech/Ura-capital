import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { AiCoachModal } from "./AiCoachModal";
import { AiCoachFab } from "./AiCoachFab";
import { AiCoachWidget } from "./AiCoachWidget";
import { openAiCoach } from "../events";
import * as aiApiModule from "../../../api/ai.api";

// Mock AuthContext
vi.mock("../../auth/context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "user-1", email: "learner@aura.internal" },
    accessToken: "mock-token",
    isAuthenticated: true,
  }),
}));

describe("AiCoachModal (Unit Tests)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Scroll mock
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it("does not render dialog when isOpen is false", () => {
    render(<AiCoachModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders dialog when isOpen is true with brand, initial greeting, and quick suggestions", () => {
    render(<AiCoachModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByRole("dialog")).toBeDefined();
    expect(screen.getByText("Aura Intelligence")).toBeDefined();
    expect(screen.getByText("AI COACH")).toBeDefined();
    expect(screen.getByText(/Tôi là Aura Intelligence/i)).toBeDefined();
    expect(screen.getByText("Giải thích chỉ số P/E & P/B trong đầu tư chứng khoán")).toBeDefined();
    expect(screen.getByText(/Mọi tư vấn chỉ mang tính chất giáo dục mô phỏng/i)).toBeDefined();
  });

  it("calls onClose when close button is clicked", () => {
    const handleClose = vi.fn();
    render(<AiCoachModal isOpen={true} onClose={handleClose} />);

    const closeBtn = screen.getByLabelText("Đóng cửa sổ cố vấn");
    fireEvent.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("toggles between docked mode and expanded study mode when clicking maximize button", () => {
    render(<AiCoachModal isOpen={true} onClose={vi.fn()} />);

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
    render(<AiCoachModal isOpen={true} onClose={handleClose} />);

    const minBtn = screen.getByLabelText("Thu gọn cửa sổ cố vấn");
    fireEvent.click(minBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("sends query when clicking suggestion chip and displays coach response", async () => {
    vi.spyOn(aiApiModule, "askAiCoach").mockResolvedValueOnce({
      answer: "P/E thấp phản ánh mức định giá hấp dẫn trong điều kiện lợi nhuận bền vững.",
      intent: "CONCEPT_EXPLANATION",
      confidence: 0.95,
      suggestions: ["Làm thế nào để nhận diện bẫy giá rẻ?"],
      disclaimer: "Mọi tư vấn mang tính giáo dục mô phỏng.",
      source: "deterministic_engine",
    });

    render(<AiCoachModal isOpen={true} onClose={vi.fn()} />);

    const chip = screen.getByText("Giải thích chỉ số P/E & P/B trong đầu tư chứng khoán");
    fireEvent.click(chip);

    await waitFor(() => {
      expect(screen.getByText(/P\/E thấp phản ánh mức định giá hấp dẫn/i)).toBeDefined();
    });
  });
});

describe("AiCoachFab & AiCoachWidget", () => {
  it("renders floating action button and triggers onClick", () => {
    const handleClick = vi.fn();
    render(<AiCoachFab onClick={handleClick} />);

    const fab = screen.getByRole("button", { name: /Mở Cố vấn Trợ lý AI/i });
    expect(fab).toBeDefined();

    fireEvent.click(fab);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("opens docked co-pilot via global openAiCoach event", async () => {
    render(<AiCoachWidget />);

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
