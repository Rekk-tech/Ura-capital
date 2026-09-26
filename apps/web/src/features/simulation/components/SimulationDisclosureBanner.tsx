import React from "react";
import { AlertTriangle, Shield } from "lucide-react";

export const SimulationDisclosureBanner: React.FC = () => {
  return (
    <div
      className="simulation-disclosure-banner"
      role="region"
      aria-label="Simulation Environment Disclosure"
      data-testid="simulation-disclosure-banner"
    >
      <div className="simulation-disclosure-header">
        <div className="simulation-disclosure-badges">
          <span className="badge badge-warning">
            <AlertTriangle size={14} style={{ marginRight: "4px" }} aria-hidden="true" />
            SIMULATION ONLY
          </span>
          <span className="badge badge-warning">NO REAL MONEY</span>
          <span className="badge badge-warning">NO BROKERAGE EXECUTION</span>
        </div>
        <div
          className="simulation-mandatory-notice"
          data-testid="mandatory-virtual-capital-notice"
          style={{ fontWeight: 600, color: "var(--status-warning, #f59e0b)", fontSize: "0.875rem" }}
        >
          Simulated execution only • Virtual funds • No real capital at risk
        </div>
      </div>
      <p className="simulation-disclosure-text">
        <Shield size={14} style={{ marginRight: "6px", display: "inline", verticalAlign: "text-top" }} aria-hidden="true" />
        This trading platform is strictly a pedagogical financial simulation. All assets, prices, cash balances, orders, and portfolio valuations are simulated and hold zero real-world monetary or brokerage value.
      </p>
    </div>
  );
};
