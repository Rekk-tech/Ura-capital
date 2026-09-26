import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  AlertCircle,
  RefreshCw,
  FolderPlus,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "../../auth/context/AuthContext";
import { usePortfolioData } from "../hooks/use-portfolio";
import { PortfolioEquitySummary } from "../components/PortfolioEquitySummary";
import { PnLAnalyticsCard } from "../components/PnLAnalyticsCard";
import { AssetAllocationBreakdown } from "../components/AssetAllocationBreakdown";
import { EquityTrendViewer } from "../components/EquityTrendViewer";
import { SimulationDisclosureBanner } from "../../simulation/components/SimulationDisclosureBanner";

export const PortfolioPage: React.FC = () => {
  const { accessToken, isAuthenticated, isLoading: authLoading } = useAuth();
  const [selectedSessionId, setSelectedSessionId] = useState<string | undefined>(undefined);

  const {
    sessions,
    activeSessionId,
    valuation,
    summary,
    pnlAnalytics,
    allocationItems,
    trendPoints,
    isLoading,
    isError,
    error,
    refetch,
  } = usePortfolioData(selectedSessionId, accessToken ?? undefined);

  // 1. Auth-Required State (Fallback guard if accessed without session)
  if (!authLoading && (!isAuthenticated || !accessToken)) {
    return (
      <div className="auth-required-container" data-testid="portfolio-auth-required" style={{ padding: "3rem 1.5rem", textAlign: "center" }}>
        <div style={{ maxWidth: "480px", margin: "0 auto", background: "var(--bg-surface)", padding: "2.5rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)" }}>
          <ShieldAlert size={48} style={{ color: "var(--accent-primary)", margin: "0 auto 1rem" }} />
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Authentication Required</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
            Please sign in to view your server-authoritative portfolio valuation and performance analytics.
          </p>
          <Link
            to="/login?returnTo=%2Fportfolio"
            className="btn btn-primary"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.5rem" }}
          >
            Sign In to Continue
          </Link>
        </div>
      </div>
    );
  }

  // 2. Loading State (Skeleton)
  if (authLoading || (isLoading && !valuation)) {
    return (
      <div className="portfolio-loading-container" data-testid="portfolio-loading-skeleton" role="status" aria-label="Loading portfolio analytics" style={{ padding: "1.5rem 0" }}>
        <SimulationDisclosureBanner />
        <div style={{ height: "40px", width: "300px", background: "var(--bg-card)", borderRadius: "var(--radius-sm)", marginBottom: "1.5rem", animation: "pulse 1.5s infinite" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: "110px", background: "var(--bg-card)", borderRadius: "var(--radius-md)", animation: "pulse 1.5s infinite" }} />
          ))}
        </div>
        <div style={{ height: "260px", background: "var(--bg-card)", borderRadius: "var(--radius-md)", marginBottom: "1.5rem", animation: "pulse 1.5s infinite" }} />
        <div style={{ height: "300px", background: "var(--bg-card)", borderRadius: "var(--radius-md)", animation: "pulse 1.5s infinite" }} />
        <span className="sr-only">Loading authoritative portfolio data...</span>
      </div>
    );
  }

  // 3. Error State (With Retry)
  if (isError) {
    return (
      <div className="portfolio-error-container" data-testid="portfolio-error-state" style={{ padding: "2rem 0" }}>
        <SimulationDisclosureBanner />
        <div
          role="alert"
          style={{
            background: "var(--status-error-bg)",
            border: "1px solid var(--status-error)",
            borderRadius: "var(--radius-md)",
            padding: "1.5rem",
            marginTop: "1.5rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: "1rem",
          }}
        >
          <AlertCircle size={36} style={{ color: "var(--status-error)" }} />
          <div>
            <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
              Unable to Load Portfolio Valuation
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", maxWidth: "500px" }}>
              {(error as Error)?.message || "A network or server error occurred while retrieving authoritative portfolio figures."}
            </p>
          </div>
          <button
            type="button"
            onClick={refetch}
            className="btn btn-secondary"
            data-testid="portfolio-retry-button"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
          >
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      </div>
    );
  }

  // 4. Empty State (No sessions exist or uninitialized)
  if (!activeSessionId || sessions.length === 0 || !valuation) {
    return (
      <div className="portfolio-empty-container" data-testid="portfolio-empty-state" style={{ padding: "2rem 0" }}>
        <SimulationDisclosureBanner />
        <div
          style={{
            textAlign: "center",
            padding: "3.5rem 1.5rem",
            background: "var(--bg-surface)",
            borderRadius: "var(--radius-lg)",
            border: "1px dashed var(--border-subtle)",
            marginTop: "1.5rem",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "rgba(59, 130, 246, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.25rem",
              color: "var(--accent-primary)",
            }}
          >
            <FolderPlus size={28} />
          </div>
          <h2 style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
            No Trading Sessions Found
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem", maxWidth: "480px", margin: "0 auto 1.75rem" }}>
            You have not launched any simulation trading sessions yet. Start a virtual session in the Simulation Desk to begin trading and building your portfolio.
          </p>
          <Link
            to="/simulation"
            className="btn btn-primary"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.5rem" }}
          >
            <TrendingUp size={18} /> Launch Simulation Desk
          </Link>
        </div>
      </div>
    );
  }

  // 5. Success State (Complete Analytics Dashboard)
  return (
    <div className="portfolio-page" data-testid="portfolio-page" style={{ padding: "1rem 0 3rem" }}>
      {/* Persistent Regulatory Disclosure Banner */}
      <SimulationDisclosureBanner />

      {/* Page Header with Session Selector & Refresh */}
      <div
        className="portfolio-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          margin: "1.5rem 0",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.025em" }}>
            Portfolio & Financial Valuation
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem", marginTop: "0.25rem" }}>
            Server-authoritative analytics, asset allocation, and capital progression for virtual trading sessions
          </p>
        </div>

        {/* Controls: Session Dropdown & Refresh */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {sessions.length > 1 && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <label htmlFor="session-select" style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                Session:
              </label>
              <select
                id="session-select"
                aria-label="Select Trading Session"
                value={activeSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                style={{
                  background: "var(--bg-surface)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  padding: "0.5rem 0.75rem",
                  fontSize: "0.875rem",
                  cursor: "pointer",
                }}
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    Cycle {s.currentCycle} ({s.status}) — {s.scenario?.name || s.id.slice(0, 8)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={refetch}
            aria-label="Refresh valuation"
            className="btn btn-secondary"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.875rem" }}
          >
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {/* Main Analytical Dashboard Layout */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {/* Section 1: Equity Summary KPIs */}
        {summary && <PortfolioEquitySummary summary={summary} />}

        {/* Section 2: PnL Performance Analytics */}
        {pnlAnalytics && <PnLAnalyticsCard analytics={pnlAnalytics} />}

        {/* Section 3: Asset Allocation Breakdown */}
        {summary && (
          <AssetAllocationBreakdown
            items={allocationItems}
            cashBalance={summary.cashBalance}
            cashPercentage={summary.cashPercentage}
          />
        )}

        {/* Section 4: Equity Trend Progression */}
        {trendPoints.length > 0 && <EquityTrendViewer trendPoints={trendPoints} />}

        {/* Section 5: Mandatory Server Authority Notice */}
        <div
          className="server-authority-notice"
          data-testid="server-authority-notice"
          style={{
            background: "rgba(30, 41, 59, 0.4)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-sm)",
            padding: "0.875rem 1rem",
            fontSize: "0.75rem",
            color: "var(--text-muted)",
            lineHeight: 1.5,
          }}
        >
          <strong>Server Authority Notice:</strong> All portfolio balances, valuations, position costs, and performance metrics are server-authoritative facts computed strictly by the Aura Capital accounting engine. Client UI displays do not confer financial authority or execute live orders.
        </div>
      </div>
    </div>
  );
};
