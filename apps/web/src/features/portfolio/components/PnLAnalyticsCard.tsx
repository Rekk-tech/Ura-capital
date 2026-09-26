import React from "react";
import { TrendingUp, TrendingDown, Target, CheckCircle2, XCircle } from "lucide-react";
import { PnLAnalyticsData } from "../types/portfolio-ui.types";
import { formatCurrency, formatPercentage } from "../utils/portfolioCalculations";

interface PnLAnalyticsCardProps {
  analytics: PnLAnalyticsData;
}

export const PnLAnalyticsCard: React.FC<PnLAnalyticsCardProps> = ({ analytics }) => {
  const isRealizedPositive = !analytics.realizedPnl.startsWith("-") && analytics.realizedPnl !== "0.0000";
  const isRealizedNegative = analytics.realizedPnl.startsWith("-");

  const isUnrealizedPositive = !analytics.unrealizedPnl.startsWith("-") && analytics.unrealizedPnl !== "0.0000";
  const isUnrealizedNegative = analytics.unrealizedPnl.startsWith("-");

  const isTotalPositive = !analytics.totalPnl.startsWith("-") && analytics.totalPnl !== "0.0000";
  const isTotalNegative = analytics.totalPnl.startsWith("-");

  return (
    <section
      className="card pnl-analytics-card"
      data-testid="pnl-analytics-card"
      aria-label="Profit and Loss Analytics"
    >
      <div className="card-header-flex">
        <div>
          <h2 className="card-title">PnL & Performance Analytics</h2>
          <p className="card-subtitle">
            Authoritative breakdown of closed trades, active positions, and ROI
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <span
            className={`badge ${analytics.roiPercentage >= 0 ? "badge-success" : "badge-error"}`}
            data-testid="roi-badge"
          >
            ROI: {formatPercentage(analytics.roiPercentage, 2)}
          </span>
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "1rem",
        marginTop: "1.25rem",
      }}>
        {/* Cumulative Realized PnL */}
        <div
          className="metric-box"
          data-testid="metric-realized-pnl"
          style={{
            background: "var(--bg-surface)",
            padding: "1rem",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)", fontWeight: 500 }}>
              Realized PnL (Closed)
            </span>
            {isRealizedPositive ? (
              <TrendingUp size={16} style={{ color: "var(--status-success)" }} aria-hidden="true" />
            ) : isRealizedNegative ? (
              <TrendingDown size={16} style={{ color: "var(--status-error)" }} aria-hidden="true" />
            ) : null}
          </div>
          <div
            style={{
              fontSize: "1.375rem",
              fontWeight: 700,
              color: isRealizedPositive
                ? "var(--status-success)"
                : isRealizedNegative
                ? "var(--status-error)"
                : "var(--text-primary)",
            }}
          >
            {formatCurrency(analytics.realizedPnl)}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            From completed sell orders
          </div>
        </div>

        {/* Unrealized PnL */}
        <div
          className="metric-box"
          data-testid="metric-unrealized-pnl"
          style={{
            background: "var(--bg-surface)",
            padding: "1rem",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)", fontWeight: 500 }}>
              Unrealized PnL (Open)
            </span>
            {isUnrealizedPositive ? (
              <TrendingUp size={16} style={{ color: "var(--status-success)" }} aria-hidden="true" />
            ) : isUnrealizedNegative ? (
              <TrendingDown size={16} style={{ color: "var(--status-error)" }} aria-hidden="true" />
            ) : null}
          </div>
          <div
            style={{
              fontSize: "1.375rem",
              fontWeight: 700,
              color: isUnrealizedPositive
                ? "var(--status-success)"
                : isUnrealizedNegative
                ? "var(--status-error)"
                : "var(--text-primary)",
            }}
          >
            {formatCurrency(analytics.unrealizedPnl)}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            Current mark-to-market positions
          </div>
        </div>

        {/* Total Combined PnL */}
        <div
          className="metric-box"
          data-testid="metric-total-pnl"
          style={{
            background: "var(--bg-surface)",
            padding: "1rem",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)", fontWeight: 500 }}>
              Total Combined PnL
            </span>
            <Target size={16} style={{ color: "var(--accent-primary)" }} aria-hidden="true" />
          </div>
          <div
            style={{
              fontSize: "1.375rem",
              fontWeight: 700,
              color: isTotalPositive
                ? "var(--status-success)"
                : isTotalNegative
                ? "var(--status-error)"
                : "var(--text-primary)",
            }}
          >
            {formatCurrency(analytics.totalPnl)}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            Realized + Unrealized Net PnL
          </div>
        </div>

        {/* Win/Loss Ratio */}
        <div
          className="metric-box"
          data-testid="metric-win-loss"
          style={{
            background: "var(--bg-surface)",
            padding: "1rem",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)", fontWeight: 500 }}>
              Win Rate & Trades
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              {analytics.totalTrades} Executed
            </span>
          </div>
          <div style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--text-primary)" }}>
            {formatPercentage(analytics.winRatePercentage, 2, false)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.25rem", fontSize: "0.75rem" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--status-success)" }}>
              <CheckCircle2 size={13} aria-hidden="true" /> {analytics.winCount} Wins
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--status-error)" }}>
              <XCircle size={13} aria-hidden="true" /> {analytics.lossCount} Losses
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
