import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FomoTutorialModal } from "./FomoTutorialModal";

describe("FomoTutorialModal", () => {
  it("renders null when isOpen is false", () => {
    const { container } = render(
      <FomoTutorialModal isOpen={false} onClose={vi.fn()} onStartGame={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders all 4 infographic step cards and triggers CTA on click", () => {
    const handleClose = vi.fn();
    const handleStart = vi.fn();

    render(
      <FomoTutorialModal isOpen={true} onClose={handleClose} onStartGame={handleStart} />
    );

    // Modal title
    expect(screen.getByText(/LUẬT CHƠI & QUY TẮC SINH TỒN — ĐẤU TRƯỜNG FOMO/i)).toBeDefined();

    // Step 1: 7 rounds
    expect(screen.getByText(/7 Vòng Đấu Sinh Tử/i)).toBeDefined();
    expect(screen.getByText(/Tích lũy/i)).toBeDefined();
    expect(screen.getByText(/Đỉnh FOMO/i)).toBeDefined();
    expect(screen.getByText(/Bẫy Margin/i)).toBeDefined();
    expect(screen.getByText(/Bull-trap/i)).toBeDefined();
    expect(screen.getByText(/Tắt thanh khoản/i)).toBeDefined();

    // Step 2: 10,000,000 VND capital & 0.15% fee
    expect(screen.getByText(/Quản Lý Vốn 10.000.000 VND Ảo/i)).toBeDefined();
    expect(screen.getByText(/0\.15%/i)).toBeDefined();

    // Step 3: Red warning stop out 5,000,000 VND / 20% equity
    expect(screen.getByText(/Ranh Giới Cháy Tài Khoản \(Stop-Out\)/i)).toBeDefined();
    expect(screen.getByText(/5.000.000 VND/i)).toBeDefined();
    expect(screen.getByText(/20%/i)).toBeDefined();

    // Step 4: Unlock Map 2 & FOMO survivor badge
    expect(screen.getByText(/Điều Kiện Mở Khóa Map 2/i)).toBeDefined();
    expect(screen.getByText(/Sống sót qua bão FOMO/i)).toBeDefined();

    // CTA button
    const ctaBtn = screen.getByRole("button", { name: /ĐÃ HIỂU LUẬT — VÀO TRẬN NGAY 🚀/i });
    expect(ctaBtn).toBeDefined();

    fireEvent.click(ctaBtn);
    expect(handleClose).toHaveBeenCalled();
    expect(handleStart).toHaveBeenCalled();
  });
});
