import React from "react";
import { DollarSign, PieChart, TrendingUp, TrendingDown, ShieldCheck } from "lucide-react";
import { SimulationPortfolioValuationDto } from "../types/simulation-ui.types";

interface PortfolioSummaryCardProps {
  portfolio: SimulationPortfolioValuationDto;
}

export const PortfolioSummaryCard: React.FC<PortfolioSummaryCardProps> = ({ portfolio }) => {
  const isPositiveRealized = !portfolio.realizedPnl.startsWith("-") && portfolio.realizedPnl !== "0.0000";
  const isNegativeRealized = portfolio.realizedPnl.startsWith("-");

  const isPositiveUnrealized = !portfolio.unrealizedPnl.startsWith("-") && portfolio.unrealizedPnl !== "0.0000";
  const isNegativeUnrealized = portfolio.unrealizedPnl.startsWith("-");

  const formatCurrency = (val: string) => {
    // Retain fixed-scale precision from server DTO
    if (val.startsWith("-")) {
      return `-$${val.slice(1)}`;
    }
    return `$${val}`;
  };

  return (
    <div className="card portfolio-summary-card" data-testid="portfolio-summary-card">
      <div className="portfolio-summary-header">
        <div className="portfolio-header-left">
          <h2 className="card-title">Portfolio Valuation & Equity</h2>
          <span className="badge badge-info" style={{ fontSize: "0.75rem", padding: "0.2rem 0.6rem" }}>
            <ShieldCheck size={12} style={{ marginRight: "4px" }} />
            Server-Authoritative
          </span>
        </div>
        <span className="portfolio-updated-at">
          Updated: {new Date(portfolio.updatedAt).toLocaleTimeString()}
        </span>
      </div>

      <div className="portfolio-metrics-grid">
        {/* Total Equity */}
        <div className="metric-box metric-highlight" data-testid="metric-total-equity">
          <div className="metric-top">
            <span className="metric-label">Total Equity</span>
            <span className="metric-icon-wrap" style={{ background: "rgba(59, 130, 246, 0.15)", color: "var(--accent-primary)" }}>
              <PieChart size={18} />
            </span>
          </div>
          <span className="metric-value font-mono" data-testid="portfolio-total-equity">
            {formatCurrency(portfolio.totalEquity)}
          </span>
          <span className="metric-subtext">Cash + Open Market Value</span>
        </div>

        {/* Cash Balance */}
        <div className="metric-box" data-testid="metric-cash-balance">
          <div className="metric-top">
            <span className="metric-label">Cash Balance</span>
            <span className="metric-icon-wrap" style={{ background: "rgba(16, 185, 129, 0.15)", color: "var(--status-success)" }}>
              <DollarSign size={18} />
            </span>
          </div>
          <span className="metric-value font-mono" data-testid="portfolio-cash-balance">
            {formatCurrency(portfolio.cashBalance)}
          </span>
          <span className="metric-subtext">Available Purchasing Power</span>
        </div>

        {/* Market Value */}
        <div className="metric-box" data-testid="metric-market-value">
          <div className="metric-top">
            <span className="metric-label">Market Value</span>
            <span className="metric-icon-wrap" style={{ background: "rgba(6, 182, 212, 0.15)", color: "var(--accent-cyan)" }}>
              <TrendingUp size={18} />
            </span>
          </div>
          <span className="metric-value font-mono" data-testid="portfolio-market-value">
            {formatCurrency(portfolio.marketValue)}
          </span>
          <span className="metric-subtext">{portfolio.positions.length} Open Position(s)</span>
        </div>

        {/* Unrealized PnL */}
        <div className={`metric-box ${isPositiveUnrealized ? "pnl-positive" : isNegativeUnrealized ? "pnl-negative" : ""}`} data-testid="metric-unrealized-pnl">
          <div className="metric-top">
            <span className="metric-label">Unrealized PnL</span>
            <span className="metric-icon-wrap">
              {isNegativeUnrealized ? <TrendingDown size={18} /> : <TrendingUp size={18} />}
            </span>
          </div>
          <span className="metric-value font-mono" data-testid="portfolio-unrealized-pnl">
            {isPositiveUnrealized ? `+${formatCurrency(portfolio.unrealizedPnl)}` : formatCurrency(portfolio.unrealizedPnl)}
          </span>
          <span className="metric-subtext">Open Positions Gain/Loss</span>
        </div>

        {/* Realized PnL */}
        <div className={`metric-box ${isPositiveRealized ? "pnl-positive" : isNegativeRealized ? "pnl-negative" : ""}`} data-testid="metric-realized-pnl">
          <div className="metric-top">
            <span className="metric-label">Realized PnL</span>
            <span className="metric-icon-wrap">
              {isNegativeRealized ? <TrendingDown size={18} /> : <TrendingUp size={18} />}
            </span>
          </div>
          <span className="metric-value font-mono" data-testid="portfolio-realized-pnl">
            {isPositiveRealized ? `+${formatCurrency(portfolio.realizedPnl)}` : formatCurrency(portfolio.realizedPnl)}
          </span>
          <span className="metric-subtext">Closed Trades Cumulative</span>
        </div>
      </div>
    </div>
  );
};
