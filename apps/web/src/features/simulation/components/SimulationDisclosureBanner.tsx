import React from "react";
import { AlertTriangle } from "lucide-react";

export const SimulationDisclosureBanner: React.FC = () => {
  return (
    <div
      className="simulation-disclosure-banner"
      role="region"
      aria-label="Simulation Environment Disclosure"
      data-testid="simulation-disclosure-banner"
    >
      <div className="disclosure-ribbon-content">
        <div className="disclosure-ribbon-left">
          <AlertTriangle size={15} className="disclosure-alert-icon" aria-hidden="true" />
          <span className="disclosure-ribbon-text">
            <strong className="disclosure-ribbon-label">Môi trường mô phỏng học thuật:</strong>{" "}
            100% dòng tiền, danh mục và lệnh khớp lệnh mang tính chất huấn luyện tâm lý thực chiến &amp; quản trị rủi ro — Không phát sinh giao dịch tiền tệ thực.
          </span>
          <span
            className="simulation-mandatory-notice sr-only"
            data-testid="mandatory-virtual-capital-notice"
          >
            <span>SIMULATION ONLY</span>
            <span>NO REAL MONEY</span>
            <span>NO BROKERAGE EXECUTION</span>
            Simulated execution only • Virtual funds • No real capital at risk
          </span>
        </div>
        <div className="disclosure-ribbon-right">
          <span className="disclosure-tag-pill font-mono">VIRTUAL ASSETS ONLY</span>
          <span className="disclosure-divider">•</span>
          <span className="disclosure-sandbox-link">Quy chế Sandbox</span>
        </div>
      </div>
    </div>
  );
};
