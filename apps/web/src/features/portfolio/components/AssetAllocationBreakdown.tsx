import React from "react";
import { DollarSign } from "lucide-react";
import { AssetAllocationItem } from "../types/portfolio-ui.types";
import { formatCurrency, formatPercentage } from "../utils/portfolioCalculations";

interface AssetAllocationBreakdownProps {
  items: AssetAllocationItem[];
  cashBalance: string;
  cashPercentage: number;
}

const ALLOCATION_COLORS = [
  "#3b82f6", // Blue
  "#06b6d4", // Cyan
  "#10b981", // Emerald
  "#8b5cf6", // Purple
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#14b8a6", // Teal
  "#6366f1", // Indigo
];

export const AssetAllocationBreakdown: React.FC<AssetAllocationBreakdownProps> = ({
  items,
  cashBalance,
  cashPercentage,
}) => {
  const hasPositions = items.length > 0;

  return (
    <section
      className="card asset-allocation-card"
      data-testid="asset-allocation-card"
      aria-label="Asset Allocation Breakdown"
    >
      <div className="card-header-flex">
        <div>
          <h2 className="card-title">Asset Allocation & Holdings</h2>
          <p className="card-subtitle">
            Proportional portfolio exposure across virtual assets and cash reserves
          </p>
        </div>
        <span className="badge badge-info">
          {items.length} {items.length === 1 ? "Holding" : "Holdings"}
        </span>
      </div>

      {!hasPositions ? (
        <div
          className="empty-state-wrap"
          data-testid="allocation-empty-state"
          style={{
            textAlign: "center",
            padding: "2.5rem 1rem",
            background: "var(--bg-surface)",
            borderRadius: "var(--radius-md)",
            border: "1px dashed var(--border-subtle)",
            marginTop: "1.25rem",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "rgba(59, 130, 246, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem",
              color: "var(--accent-primary)",
            }}
          >
            <DollarSign size={24} />
          </div>
          <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
            100% Cash Portfolio
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", maxWidth: "420px", margin: "0 auto" }}>
            Your entire portfolio is held in cash ({formatCurrency(cashBalance)}). You currently have no open equity positions.
          </p>
        </div>
      ) : (
        <div style={{ marginTop: "1.25rem" }}>
          {/* Segmented Distribution Bar */}
          <div
            role="progressbar"
            aria-label="Portfolio Asset Distribution"
            aria-valuenow={100}
            aria-valuemin={0}
            aria-valuemax={100}
            style={{
              height: "12px",
              display: "flex",
              borderRadius: "999px",
              overflow: "hidden",
              background: "var(--border-subtle)",
              marginBottom: "1.5rem",
            }}
          >
            {/* Cash Segment */}
            <div
              style={{
                width: `${cashPercentage}%`,
                background: "var(--accent-cyan)",
                transition: "width 0.3s ease",
              }}
              title={`Cash: ${formatPercentage(cashPercentage, 1, false)}`}
            />

            {/* Position Segments */}
            {items.map((item, idx) => {
              const color = ALLOCATION_COLORS[idx % ALLOCATION_COLORS.length];
              return (
                <div
                  key={item.assetId}
                  style={{
                    width: `${item.weightPercentage}%`,
                    background: color,
                    transition: "width 0.3s ease",
                  }}
                  title={`${item.symbol}: ${formatPercentage(item.weightPercentage, 1, false)}`}
                />
              );
            })}
          </div>

          {/* Allocation Breakdown Table */}
          <div className="table-responsive">
            <table className="simulation-table" data-testid="allocation-table" aria-label="Asset Allocation Table">
              <thead>
                <tr>
                  <th scope="col">Asset / Ticker</th>
                  <th scope="col" className="text-right">Weight</th>
                  <th scope="col" className="text-right">Quantity</th>
                  <th scope="col" className="text-right">Current Price</th>
                  <th scope="col" className="text-right">Market Value</th>
                  <th scope="col" className="text-right">Unrealized PnL</th>
                </tr>
              </thead>
              <tbody>
                {/* Cash row */}
                <tr data-testid="allocation-row-CASH">
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          background: "var(--accent-cyan)",
                          display: "inline-block",
                        }}
                        aria-hidden="true"
                      />
                      <div>
                        <span style={{ fontWeight: 600 }}>CASH</span>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Liquid Reserves</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-right font-mono" style={{ fontWeight: 600 }}>
                    {formatPercentage(cashPercentage, 1, false)}
                  </td>
                  <td className="text-right font-mono">—</td>
                  <td className="text-right font-mono">$1.00</td>
                  <td className="text-right font-mono">{formatCurrency(cashBalance)}</td>
                  <td className="text-right font-mono text-muted">$0.00</td>
                </tr>

                {/* Positions rows */}
                {items.map((item, idx) => {
                  const color = ALLOCATION_COLORS[idx % ALLOCATION_COLORS.length];
                  const isPositive = !item.unrealizedPnl.startsWith("-") && item.unrealizedPnl !== "0.0000";
                  const isNegative = item.unrealizedPnl.startsWith("-");

                  return (
                    <tr key={item.assetId} data-testid={`allocation-row-${item.symbol}`}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span
                            style={{
                              width: "10px",
                              height: "10px",
                              borderRadius: "50%",
                              background: color,
                              display: "inline-block",
                            }}
                            aria-hidden="true"
                          />
                          <div>
                            <span style={{ fontWeight: 600 }}>{item.symbol}</span>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{item.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-right font-mono" style={{ fontWeight: 600 }}>
                        {formatPercentage(item.weightPercentage, 1, false)}
                      </td>
                      <td className="text-right font-mono">{item.quantity.toLocaleString()}</td>
                      <td className="text-right font-mono">{formatCurrency(item.currentPrice)}</td>
                      <td className="text-right font-mono" style={{ fontWeight: 600 }}>
                        {formatCurrency(item.marketValue)}
                      </td>
                      <td
                        className={`text-right font-mono ${
                          isPositive ? "text-success" : isNegative ? "text-error" : ""
                        }`}
                      >
                        {formatCurrency(item.unrealizedPnl)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};
