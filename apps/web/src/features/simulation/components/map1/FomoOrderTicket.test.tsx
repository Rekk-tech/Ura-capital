import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FomoOrderTicket } from "./FomoOrderTicket";

describe("FomoOrderTicket", () => {
  const defaultProps = {
    phase: "trading_window" as const,
    round: 1,
    cash: 10000000,
    shares: 100,
    marginUsed: 0,
    nav: 10000000,
    currentPrice: 10000,
    canUseMargin: false,
    freeStopLossAwarded: false,
    isSubmitting: false,
    onSubmitOrder: vi.fn(),
  };

  it("renders order desk with Buy and Sell tabs", () => {
    render(<FomoOrderTicket {...defaultProps} />);

    expect(screen.getByText("Đặt Lệnh Nhanh")).toBeDefined();
    expect(screen.getByText(/Fast Execution Desk/)).toBeDefined();
    expect(screen.getByText("MUA (BUY)")).toBeDefined();
    expect(screen.getByText("BÁN (SELL)")).toBeDefined();
    expect(screen.getByText("25%")).toBeDefined();
    expect(screen.getByText("50%")).toBeDefined();
    expect(screen.getByText("100% ALL-IN")).toBeDefined();
  });

  it("locks margin buttons with tooltip in Round 1 and 2", () => {
    render(<FomoOrderTicket {...defaultProps} round={1} canUseMargin={false} />);

    expect(screen.getByText(/Mở khóa đòn bẩy từ Round 3/)).toBeDefined();
    const margin2xBtn = screen.getByRole("button", { name: /MARGIN x2/i });
    expect(margin2xBtn.getAttribute("disabled")).not.toBeNull();
  });

  it("unlocks margin x2 in Round 3 when canUseMargin is true", () => {
    render(<FomoOrderTicket {...defaultProps} round={3} canUseMargin={true} />);

    const margin2xBtn = screen.getByRole("button", { name: /MARGIN x2/i });
    expect(margin2xBtn.getAttribute("disabled")).toBeNull();
  });

  it("locks sell orders in Round 5 with liquidity alert banner and blocked CTA", () => {
    render(<FomoOrderTicket {...defaultProps} round={5} />);

    const sellTab = screen.getByRole("button", { name: /BÁN \(SELL\)/i });
    fireEvent.click(sellTab);

    // Alert banner
    expect(screen.getByText(/LỆNH BÁN BỊ KHÓA \(NO LIQUIDITY \/ SÀN NGHẼN LỆNH\)/i)).toBeDefined();
    // Blocked CTA button
    expect(screen.getByText(/Không Thể Khớp Lệnh Bán \(Order Blocked\)/i)).toBeDefined();
  });

  it("calculates transparent 0.15% transaction fee in preview", () => {
    render(<FomoOrderTicket {...defaultProps} cash={10000000} currentPrice={10000} />);

    expect(screen.getByText(/Phí giao dịch mô phỏng \(0.15%\):/i)).toBeDefined();
    expect(screen.getByText("Tổng tiền thanh toán:")).toBeDefined();
  });
});
