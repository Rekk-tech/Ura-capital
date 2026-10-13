import React from "react";
import { Coins, PieChart, TrendingUp, TrendingDown, ShieldCheck } from "lucide-react";
import { SimulationPortfolioValuationDto } from "../types/simulation-ui.types";
import { formatCurrency } from "../../portfolio/utils/portfolioCalculations";

interface PortfolioSummaryCardProps {
  portfolio: SimulationPortfolioValuationDto;
}

export const PortfolioSummaryCard: React.FC<PortfolioSummaryCardProps> = ({ portfolio }) => {
  const isPositiveRealized = !portfolio.realizedPnl.startsWith("-") && portfolio.realizedPnl !== "0.0000";
  const isNegativeRealized = portfolio.realizedPnl.startsWith("-");

  const isPositiveUnrealized = !portfolio.unrealizedPnl.startsWith("-") && portfolio.unrealizedPnl !== "0.0000";
  const isNegativeUnrealized = portfolio.unrealizedPnl.startsWith("-");

  return (
    <div className="card portfolio-summary-card" data-testid="portfolio-summary-card">
      <div className="portfolio-summary-header">
        <div className="portfolio-header-left">
          <h2 className="card-title">
            Định Giá Danh Mục & Tổng Tài Sản <span className="sr-only">Portfolio Valuation & Equity</span>
          </h2>
          <span className="badge badge-info" style={{ fontSize: "0.75rem", padding: "0.2rem 0.6rem" }}>
            <ShieldCheck size={12} style={{ marginRight: "4px" }} />
            Máy Chủ Chuẩn Hóa
          </span>
        </div>
        <span className="portfolio-updated-at">
          Cập nhật: {new Date(portfolio.updatedAt).toLocaleTimeString()}
        </span>
      </div>

      {/* Portfolio Allocation Mini Ratio Bar */}
      <div className="portfolio-ratio-bar-wrap" style={{ margin: "0.6rem 0 1rem", padding: "0.5rem 0.75rem", background: "var(--bg-page)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "4px" }}>
          <span>Tiền mặt khả dụng: <strong className="font-mono text-primary">{formatCurrency(portfolio.cashBalance)}</strong></span>
          <span>Giá trị cổ phiếu: <strong className="font-mono text-primary">{formatCurrency(portfolio.marketValue)}</strong> ({portfolio.positions.length} vị thế)</span>
        </div>
        <div style={{ height: "6px", width: "100%", background: "var(--aura-blue-100)", borderRadius: "9999px", overflow: "hidden", display: "flex" }}>
          <div style={{ height: "100%", width: `${Math.min(100, Math.max(0, (Number(portfolio.cashBalance) / Number(portfolio.totalEquity || 1)) * 100))}%`, background: "var(--aura-green-500)", transition: "width 0.3s ease" }} title="Tỷ trọng tiền mặt" />
          <div style={{ height: "100%", flex: 1, background: "var(--aura-blue-600)", transition: "width 0.3s ease" }} title="Tỷ trọng cổ phiếu" />
        </div>
      </div>

      <div className="portfolio-metrics-grid">
        {/* Total Equity */}
        <div className="metric-box metric-highlight" data-testid="metric-total-equity">
          <div className="metric-top">
            <span className="metric-label">Tổng Tài Sản (Equity)</span>
            <span className="metric-icon-wrap" style={{ background: "rgba(59, 130, 246, 0.15)", color: "var(--accent-primary)" }}>
              <PieChart size={18} />
            </span>
          </div>
          <span className="metric-value font-mono" data-testid="portfolio-total-equity">
            {formatCurrency(portfolio.totalEquity)}
          </span>
          <span className="metric-subtext">Tiền mặt + Giá trị thị trường</span>
        </div>

        {/* Cash Balance */}
        <div className="metric-box" data-testid="metric-cash-balance">
          <div className="metric-top">
            <span className="metric-label">Tiền Mặt Khả Dụng</span>
            <span className="metric-icon-wrap" style={{ background: "rgba(16, 185, 129, 0.15)", color: "var(--status-success)" }}>
              <Coins size={18} />
            </span>
          </div>
          <span className="metric-value font-mono" data-testid="portfolio-cash-balance">
            {formatCurrency(portfolio.cashBalance)}
          </span>
          <span className="metric-subtext">Sức mua sẵn sàng đặt lệnh</span>
        </div>

        {/* Market Value */}
        <div className="metric-box" data-testid="metric-market-value">
          <div className="metric-top">
            <span className="metric-label">Giá Trị Cổ Phiếu</span>
            <span className="metric-icon-wrap" style={{ background: "rgba(6, 182, 212, 0.15)", color: "var(--accent-cyan)" }}>
              <TrendingUp size={18} />
            </span>
          </div>
          <span className="metric-value font-mono" data-testid="portfolio-market-value">
            {formatCurrency(portfolio.marketValue)}
          </span>
          <span className="metric-subtext">{portfolio.positions.length} vị thế đang mở</span>
        </div>

        {/* Unrealized PnL */}
        <div className={`metric-box ${isPositiveUnrealized ? "pnl-positive" : isNegativeUnrealized ? "pnl-negative" : ""}`} data-testid="metric-unrealized-pnl">
          <div className="metric-top">
            <span className="metric-label">Lãi/Lỗ Tạm Tính (PnL)</span>
            <span className="metric-icon-wrap">
              {isNegativeUnrealized ? <TrendingDown size={18} /> : <TrendingUp size={18} />}
            </span>
          </div>
          <span className="metric-value font-mono" data-testid="portfolio-unrealized-pnl">
            {isPositiveUnrealized ? `+${formatCurrency(portfolio.unrealizedPnl)}` : formatCurrency(portfolio.unrealizedPnl)}
          </span>
          <span className="metric-subtext">Biến động vị thế hiện tại</span>
        </div>

        {/* Realized PnL */}
        <div className={`metric-box ${isPositiveRealized ? "pnl-positive" : isNegativeRealized ? "pnl-negative" : ""}`} data-testid="metric-realized-pnl">
          <div className="metric-top">
            <span className="metric-label">PnL Thực Hiện</span>
            <span className="metric-icon-wrap">
              {isNegativeRealized ? <TrendingDown size={18} /> : <TrendingUp size={18} />}
            </span>
          </div>
          <span className="metric-value font-mono" data-testid="portfolio-realized-pnl">
            {isPositiveRealized ? `+${formatCurrency(portfolio.realizedPnl)}` : formatCurrency(portfolio.realizedPnl)}
          </span>
          <span className="metric-subtext">Lợi nhuận đã chốt</span>
        </div>
      </div>
    </div>
  );
};
