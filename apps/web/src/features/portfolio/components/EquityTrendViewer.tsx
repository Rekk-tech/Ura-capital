import React from "react";
import { Milestone } from "lucide-react";
import { EquityTrendPoint } from "../types/portfolio-ui.types";
import { formatCurrency } from "../utils/portfolioCalculations";

interface EquityTrendViewerProps {
  trendPoints: EquityTrendPoint[];
}

export const EquityTrendViewer: React.FC<EquityTrendViewerProps> = ({ trendPoints }) => {
  return (
    <section
      className="card equity-trend-card"
      data-testid="equity-trend-viewer"
      aria-label="Equity Curve Progression"
    >
      <div className="card-header-flex">
        <div>
          <h2 className="card-title">Equity Curve & Milestone Progression</h2>
          <p className="card-subtitle">
            Capital evolution tracked across simulation cycles and trade events
          </p>
        </div>
        <span className="badge badge-info">
          {trendPoints.length} Milestones
        </span>
      </div>

      <div style={{ marginTop: "1.25rem" }}>
        {/* Milestone Steps Timeline */}
        <div
          className="trend-timeline-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "0.75rem",
            marginBottom: "1.5rem",
          }}
        >
          {trendPoints.map((point) => (
            <div
              key={point.pointIndex}
              className="trend-step-card"
              data-testid={`trend-step-${point.pointIndex}`}
              style={{
                background: "var(--bg-surface)",
                padding: "0.875rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-secondary)", marginBottom: "0.25rem", fontSize: "0.75rem" }}>
                <Milestone size={14} style={{ color: "var(--accent-primary)" }} aria-hidden="true" />
                <span>{point.label}</span>
              </div>
              <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)" }}>
                {formatCurrency(point.equity)}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                Cycle {point.cycle} • Cash: {formatCurrency(point.cash)}
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Progression Table */}
        <div className="table-responsive">
          <table className="simulation-table" data-testid="equity-trend-table" aria-label="Equity Progression Table">
            <thead>
              <tr>
                <th scope="col">Milestone / Event</th>
                <th scope="col" className="text-center">Cycle</th>
                <th scope="col" className="text-right">Total Equity</th>
                <th scope="col" className="text-right">Cash Balance</th>
                <th scope="col" className="text-right">Asset Market Value</th>
                <th scope="col" className="text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {trendPoints.map((point) => (
                <tr key={point.pointIndex} data-testid={`trend-row-${point.pointIndex}`}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: point.pointIndex === trendPoints.length - 1 ? "var(--status-success)" : "var(--accent-primary)",
                          display: "inline-block",
                        }}
                        aria-hidden="true"
                      />
                      <span style={{ fontWeight: 500 }}>{point.label}</span>
                    </div>
                  </td>
                  <td className="text-center font-mono">{point.cycle}</td>
                  <td className="text-right font-mono" style={{ fontWeight: 600 }}>
                    {formatCurrency(point.equity)}
                  </td>
                  <td className="text-right font-mono text-muted">
                    {formatCurrency(point.cash)}
                  </td>
                  <td className="text-right font-mono text-muted">
                    {formatCurrency(point.marketValue)}
                  </td>
                  <td className="text-right font-mono text-muted" style={{ fontSize: "0.75rem" }}>
                    {point.timestamp ? new Date(point.timestamp).toLocaleTimeString() : "Baseline"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
