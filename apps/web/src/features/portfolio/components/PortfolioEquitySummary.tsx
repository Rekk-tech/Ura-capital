import React from "react";
import { Wallet, TrendingUp, Layers, Award } from "lucide-react";
import { PortfolioEquitySummaryData } from "../types/portfolio-ui.types";
import { formatCurrency, formatPercentage } from "../utils/portfolioCalculations";

interface PortfolioEquitySummaryProps {
  summary: PortfolioEquitySummaryData;
}

export const PortfolioEquitySummary: React.FC<PortfolioEquitySummaryProps> = ({ summary }) => {
  return (
    <section
      className="card portfolio-equity-summary-card"
      data-testid="portfolio-equity-summary"
      aria-label="Portfolio Equity Summary"
    >
      <div className="card-header-flex">
        <div>
          <h2 className="card-title">Portfolio Equity & Net Asset Value</h2>
          <p className="card-subtitle">
            Server-authoritative valuation across virtual cash and open asset positions
          </p>
        </div>
        <span className="badge badge-success" data-testid="nav-badge">
          NAV: {formatCurrency(summary.netAssetValue)}
        </span>
      </div>

      {/* Main KPI Grid */}
      <div className="portfolio-kpi-grid" style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "1rem",
        marginTop: "1.25rem",
        marginBottom: "1.5rem",
      }}>
        {/* Total Equity */}
        <div
          className="kpi-card"
          data-testid="kpi-total-equity"
          style={{
            background: "var(--bg-surface)",
            padding: "1rem",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
            <Award size={18} style={{ color: "var(--accent-primary)" }} aria-hidden="true" />
            <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>Total Equity</span>
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>
            {formatCurrency(summary.totalEquity)}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            Authoritative Server Valuation
          </div>
        </div>

        {/* Cash Balance */}
        <div
          className="kpi-card"
          data-testid="kpi-cash-balance"
          style={{
            background: "var(--bg-surface)",
            padding: "1rem",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
            <Wallet size={18} style={{ color: "var(--accent-cyan)" }} aria-hidden="true" />
            <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>Cash Balance</span>
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>
            {formatCurrency(summary.cashBalance)}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            {formatPercentage(summary.cashPercentage, 1, false)} of Total Portfolio
          </div>
        </div>

        {/* Position Market Value */}
        <div
          className="kpi-card"
          data-testid="kpi-market-value"
          style={{
            background: "var(--bg-surface)",
            padding: "1rem",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
            <TrendingUp size={18} style={{ color: "var(--status-success)" }} aria-hidden="true" />
            <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>Asset Market Value</span>
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>
            {formatCurrency(summary.marketValue)}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            {formatPercentage(summary.assetPercentage, 1, false)} of Total Portfolio
          </div>
        </div>

        {/* Total Cost Basis */}
        <div
          className="kpi-card"
          data-testid="kpi-cost-basis"
          style={{
            background: "var(--bg-surface)",
            padding: "1rem",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
            <Layers size={18} style={{ color: "var(--status-warning)" }} aria-hidden="true" />
            <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>Total Cost Basis</span>
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>
            {formatCurrency(summary.totalCostBasis)}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            Weighted Purchase Capital
          </div>
        </div>
      </div>

      {/* Asset vs Cash Distribution Bar */}
      <div className="portfolio-ratio-section" style={{ marginTop: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
          <span>
            <strong>Cash:</strong> {formatPercentage(summary.cashPercentage, 1, false)} ({formatCurrency(summary.cashBalance)})
          </span>
          <span>
            <strong>Equities:</strong> {formatPercentage(summary.assetPercentage, 1, false)} ({formatCurrency(summary.marketValue)})
          </span>
        </div>

        <div
          role="progressbar"
          aria-valuenow={Math.round(summary.cashPercentage)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Cash to Assets Ratio"
          style={{
            height: "10px",
            background: "var(--border-subtle)",
            borderRadius: "999px",
            overflow: "hidden",
            display: "flex",
          }}
        >
          <div
            style={{
              width: `${summary.cashPercentage}%`,
              background: "var(--accent-cyan)",
              transition: "width 0.3s ease",
            }}
            title={`Cash: ${formatPercentage(summary.cashPercentage, 1, false)}`}
          />
          <div
            style={{
              width: `${summary.assetPercentage}%`,
              background: "var(--status-success)",
              transition: "width 0.3s ease",
            }}
            title={`Equities: ${formatPercentage(summary.assetPercentage, 1, false)}`}
          />
        </div>
      </div>
    </section>
  );
};
