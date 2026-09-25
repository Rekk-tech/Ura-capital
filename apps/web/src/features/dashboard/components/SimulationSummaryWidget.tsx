import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Activity, AlertTriangle } from "lucide-react";
import { useAuth } from "../../auth/context/AuthContext";
import { simulationApi } from "../../../api/simulation.api";
import { DashboardWidgetWrapper } from "./DashboardWidgetWrapper";

/**
 * FEAT-072: Simulation Portfolio Summary Widget (FR-001, FR-003, FR-004, AC-001..AC-008)
 *
 * Bounded client composition of existing Simulation read contracts:
 * - simulationApi.listSessions (authenticated)
 * - simulationApi.getPortfolioValuation (for active session)
 * Truthful presentation: highlights simulated nature of capital and links to /simulation.
 */
export const SimulationSummaryWidget: React.FC = () => {
  const { accessToken } = useAuth();

  const sessionsQuery = useQuery({
    queryKey: ["dashboard", "simulation", "sessions"],
    queryFn: () => simulationApi.listSessions(accessToken ?? undefined),
    enabled: Boolean(accessToken),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const activeSession =
    sessionsQuery.data?.data?.find((s) => s.status === "ACTIVE") ??
    sessionsQuery.data?.data?.[0];

  const portfolioQuery = useQuery({
    queryKey: ["dashboard", "simulation", "portfolio", activeSession?.id],
    queryFn: () =>
      simulationApi.getPortfolioValuation(activeSession!.id, accessToken ?? undefined),
    enabled: Boolean(accessToken && activeSession?.id),
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });

  const isLoading = sessionsQuery.isLoading || (Boolean(activeSession) && portfolioQuery.isLoading);
  const isError = sessionsQuery.isError || portfolioQuery.isError;

  const handleRetry = () => {
    if (sessionsQuery.isError) void sessionsQuery.refetch();
    if (portfolioQuery.isError) void portfolioQuery.refetch();
  };

  const valuation = portfolioQuery.data?.data;
  const pnlNum = valuation ? parseFloat(valuation.unrealizedPnl) : 0;
  const isPnlPositive = pnlNum >= 0;

  return (
    <DashboardWidgetWrapper
      title="Simulation Portfolio"
      icon={<TrendingUp size={20} className="text-accent" />}
      domainUrl="/simulation"
      domainLabel="Open Desk"
      badge={
        activeSession ? (
          <span className="badge badge-success">{activeSession.status}</span>
        ) : undefined
      }
      isLoading={isLoading}
      isError={isError}
      errorMessage="Unable to load simulation portfolio. Please try again."
      onRetry={handleRetry}
      testId="dashboard-widget-simulation"
    >
      <div className="widget-body">
        {!activeSession ? (
          <div className="widget-empty-state">
            <Activity size={28} className="text-muted" aria-hidden="true" />
            <p className="empty-title font-bold">No Active Simulation</p>
            <p className="text-muted">
              You do not have an active simulated trading desk session.
              Practice institutional strategies with virtual cash.
            </p>
            <Link to="/simulation" className="btn btn-primary btn-sm" style={{ marginTop: "0.75rem" }}>
              Launch Simulation Desk
            </Link>
          </div>
        ) : (
          <>
            {/* Session Scenario Info */}
            <div className="simulation-scenario-banner">
              <span className="scenario-label text-muted">Scenario:</span>
              <span className="scenario-name font-bold">
                {activeSession.scenario?.name || "Standard Market Session"}
              </span>
              <span className="cycle-badge font-mono text-muted">
                Cycle {activeSession.currentCycle}
              </span>
            </div>

            {/* Metrics Grid */}
            <div className="portfolio-metrics-grid">
              <div className="portfolio-metric-box">
                <span className="metric-box-label">Portfolio Equity</span>
                <span className="metric-box-value font-mono" data-testid="portfolio-equity-value">
                  ${valuation ? parseFloat(valuation.totalEquity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                </span>
              </div>

              <div className="portfolio-metric-box">
                <span className="metric-box-label">Cash Balance</span>
                <span className="metric-box-value font-mono">
                  ${valuation ? parseFloat(valuation.cashBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                </span>
              </div>

              <div className="portfolio-metric-box">
                <span className="metric-box-label">Unrealized PnL</span>
                <span
                  className={`metric-box-value font-mono ${isPnlPositive ? "text-success" : "text-error"}`}
                  data-testid="portfolio-pnl-value"
                >
                  {isPnlPositive ? "+" : ""}${valuation ? parseFloat(valuation.unrealizedPnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                </span>
              </div>
            </div>

            {/* Regulatory Simulation Disclosure */}
            <div className="simulation-disclaimer-note" role="note">
              <AlertTriangle size={14} className="text-warning flex-shrink-0" aria-hidden="true" />
              <span>Simulated execution only • Virtual funds • No real capital at risk</span>
            </div>
          </>
        )}
      </div>
    </DashboardWidgetWrapper>
  );
};
