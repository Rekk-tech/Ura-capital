import React from "react";
import { Link } from "react-router-dom";
import { Wallet, PiggyBank, TrendingUp, AlertTriangle, ArrowUpRight } from "lucide-react";
import { formatCurrency } from "../../../portfolio/utils/portfolioCalculations";

interface ProMacroTopRibbonProps {
  currentQuarter: number;
  totalQuarters: number;
  stageName: string;
  stageKey: string;
  stageDescription: string;
  currentNav: number;
  initialCash: number;
  unallocatedCash: number;
  unallocatedPercent: number;
  alpha: number;
  maxDrawdown: number;
  pnlQoQPercent: number;
}

export const ProMacroTopRibbon: React.FC<ProMacroTopRibbonProps> = ({
  currentQuarter,
  totalQuarters,
  stageName,
  stageKey: _stageKey,
  stageDescription,
  currentNav,
  initialCash: _initialCash,
  unallocatedCash,
  unallocatedPercent,
  alpha,
  maxDrawdown,
  pnlQoQPercent: _pnlQoQPercent,
}) => {
  const progressPercent = Number(((currentQuarter / totalQuarters) * 100).toFixed(1));
  const remainingQuarters = totalQuarters - currentQuarter;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* 1. Mode Pill & Switch Map Link */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", fontSize: "0.78rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: "4px",
              fontWeight: 800,
              fontSize: "0.7rem",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              backgroundColor: "#f0fdfa",
              color: "#0f766e",
              border: "1px solid #5eead4",
            }}
          >
            MAP 2: PRO ROOM
          </span>
          <span style={{ color: "#94a3b8" }}>•</span>
          <span style={{ color: "#475569", fontWeight: 600 }}>
            Disciplined Value Investing &amp; Macro Allocation
          </span>
          <span style={{ color: "#94a3b8" }}>•</span>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: "4px",
              fontWeight: 600,
              fontSize: "0.7rem",
              backgroundColor: "#ecfeff",
              color: "#0e7490",
              border: "1px solid #a5f3fc",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
            }}
          >
            <span>🔄 Turn-based</span>
            <span>• 12 Economic Quarters</span>
          </span>
        </div>

        <Link
          to="/simulation"
          style={{
            fontSize: "0.78rem",
            fontWeight: 600,
            color: "#64748b",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.3rem",
            textDecoration: "none",
          }}
        >
          <span>Switch Simulation Map</span>
          <ArrowUpRight size={13} />
        </Link>
      </div>

      {/* 2. Hero Quarter Title & Macro Progression */}
      <div
        className="pro-card"
        style={{
          padding: "1.35rem 1.75rem",
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1.25rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
            <h1 style={{ fontSize: "1.85rem", fontWeight: 900, color: "#0f172a", margin: 0, letterSpacing: "-0.03em" }}>
              Quarter {currentQuarter} of {totalQuarters}
            </h1>
            <span
              style={{
                padding: "0.25rem 0.75rem",
                borderRadius: "9999px",
                fontSize: "0.72rem",
                fontWeight: 800,
                backgroundColor: "#059669",
                color: "#ffffff",
                letterSpacing: "0.02em",
              }}
            >
              {currentQuarter === 1 ? "Active Round" : `${stageName} Phase`}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b" }}>
            Cycle Phase: <span style={{ color: "#334155", fontWeight: 600 }}>{stageDescription}</span>
          </p>
        </div>

        {/* Progression Progress Bar */}
        <div style={{ width: "260px", maxWidth: "100%", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
            <span style={{ color: "#64748b", fontWeight: 500 }}>Macro Progression</span>
            <strong style={{ color: "#0f172a", fontFamily: "var(--font-mono)" }}>
              Q{currentQuarter} Completed: {progressPercent}%
            </strong>
          </div>
          <div
            style={{
              width: "100%",
              height: "6px",
              borderRadius: "9999px",
              backgroundColor: "#f1f5f9",
              overflow: "hidden",
              border: "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progressPercent}%`,
                backgroundColor: "#0d9488",
                borderRadius: "9999px",
                transition: "width 0.4s ease",
              }}
            />
          </div>
          <span style={{ fontSize: "0.68rem", color: "#94a3b8" }}>
            {remainingQuarters > 0
              ? `${remainingQuarters} Quarters remaining until institutional audit`
              : "Final institutional audit completed"}
          </span>
        </div>
      </div>

      {/* 3. Top 4 KPI Metrics Cards */}
      <div className="pro-kpi-grid-4">
        {/* Card 1: Total Capital Pool */}
        <div className="pro-card" style={{ padding: "1.15rem 1.25rem", gap: "0.35rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              TOTAL CAPITAL POOL
            </span>
            <Wallet size={16} style={{ color: "#0d9488" }} />
          </div>
          <div style={{ fontSize: "1.45rem", fontWeight: 900, fontFamily: "var(--font-mono)", color: "#0f172a", margin: "0.2rem 0" }}>
            {formatCurrency(currentNav)}
          </div>
          <div style={{ fontSize: "0.72rem", color: "#059669", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span>🛡️ 100% Guaranteed Virtual Funds</span>
          </div>
        </div>

        {/* Card 2: Unallocated Cash */}
        <div className="pro-card" style={{ padding: "1.15rem 1.25rem", gap: "0.35rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              UNALLOCATED CASH
            </span>
            <PiggyBank size={16} style={{ color: "#64748b" }} />
          </div>
          <div style={{ fontSize: "1.45rem", fontWeight: 900, fontFamily: "var(--font-mono)", color: "#0f172a", margin: "0.2rem 0" }}>
            {formatCurrency(unallocatedCash)}
          </div>
          <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 500 }}>
            ⏱️ {unallocatedPercent.toFixed(1)}% of Portfolio
          </div>
        </div>

        {/* Card 3: Benchmark Alpha */}
        <div className="pro-card" style={{ padding: "1.15rem 1.25rem", gap: "0.35rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              BENCHMARK ALPHA (VS VN30)
            </span>
            <TrendingUp size={16} style={{ color: "#059669" }} />
          </div>
          <div style={{ fontSize: "1.45rem", fontWeight: 900, fontFamily: "var(--font-mono)", color: "#059669", margin: "0.2rem 0" }}>
            {alpha >= 0 ? `+${alpha.toFixed(2)}%` : `${alpha.toFixed(2)}%`}
          </div>
          <div style={{ fontSize: "0.72rem", color: "#059669", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span>✓ Top 5% Cohort Performance</span>
          </div>
        </div>

        {/* Card 4: Max Drawdown Limit */}
        <div className="pro-card" style={{ padding: "1.15rem 1.25rem", gap: "0.35rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              MAX DRAWDOWN LIMIT
            </span>
            <AlertTriangle size={16} style={{ color: "#64748b" }} />
          </div>
          <div style={{ fontSize: "1.45rem", fontWeight: 900, fontFamily: "var(--font-mono)", color: "#0f172a", margin: "0.2rem 0" }}>
            &lt; 15.0%
          </div>
          <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: maxDrawdown > 12 ? "#e11d48" : "#059669" }} />
            <span>Current Risk: {maxDrawdown.toFixed(1)}% ({maxDrawdown > 12 ? "Warning" : "Clean"})</span>
          </div>
        </div>
      </div>
    </div>
  );
};
