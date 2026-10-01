import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FomoPriceChart } from "./FomoPriceChart";

describe("FomoPriceChart", () => {
  const defaultProps = {
    symbol: "$FOMO / VIN",
    currentPrice: 46350,
    initialPrice: 45000,
    priceChangePercent: 3.0,
    pricePoints: [
      { second: 0, price: 45000 },
      { second: 15, price: 46350 },
    ],
    round: 1,
  };

  it("renders ticker header, price, and Round 1 status badge", () => {
    render(<FomoPriceChart {...defaultProps} />);

    expect(screen.getByText("$FOMO / VIN")).toBeDefined();
    expect(screen.getByText("VinAlpha Corp (HOSE)")).toBeDefined();
    expect(screen.getByText("46.350")).toBeDefined();
    expect(screen.getByText("+3.0% TĂNG NHẸ")).toBeDefined();
    expect(screen.getByText("Khớp Gần Nhất")).toBeDefined();
    expect(screen.getByText("Dư Mua (Bid)")).toBeDefined();
    expect(screen.getByText("Dư Bán (Ask)")).toBeDefined();
    expect(screen.getByText("Tổng Khối Lượng")).toBeDefined();
  });

  it("renders purple Ceiling badge in Round 2", () => {
    render(<FomoPriceChart {...defaultProps} round={2} priceChangePercent={6.9} currentPrice={48100} />);

    expect(screen.getByText(/CEILING \(TÍM TRẦN\)/)).toBeDefined();
    expect(screen.getByText("TRẮNG BÊN BÁN (0 CP)")).toBeDefined();
  });

  it("renders freeze banner and white bid indicator in Round 5", () => {
    render(<FomoPriceChart {...defaultProps} round={5} priceChangePercent={-7.0} currentPrice={39200} />);

    expect(screen.getByText(/SÀN ĐÓNG BĂNG... TRẮNG BÊN MUA/i)).toBeDefined();
    expect(screen.getByText("TRẮNG BÊN MUA (0 CP)")).toBeDefined();
  });
});
