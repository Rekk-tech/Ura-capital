import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useSimulationSessionsQuery,
  useSimulationSessionQuery,
  useSimulationAssetsQuery,
  useSimulationSnapshotsQuery,
  useSimulationPortfolioQuery,
  useSimulationOrdersQuery,
  useSimulationTradesQuery,
  useCreateSessionMutation,
  useStartSessionMutation,
  useResetSessionMutation,
  useCompleteSessionMutation,
  useCancelSessionMutation,
  useSubmitOrderMutation,
} from "../hooks/use-simulation";
import { useAuth } from "../../auth/context/AuthContext";
import { SimulationDisclosureBanner } from "../components/SimulationDisclosureBanner";
import { SimulationSessionBar } from "../components/SimulationSessionBar";
import { PortfolioSummaryCard } from "../components/PortfolioSummaryCard";
import { PositionsTable } from "../components/PositionsTable";
import { MarketOrderTicket } from "../components/MarketOrderTicket";
import { OrdersTable } from "../components/OrdersTable";
import { TradesTable } from "../components/TradesTable";
import {
  SimulationLoadingSkeleton,
  SimulationAuthRequiredCard,
  SimulationNotFoundCard,
  SimulationErrorState,
} from "../components/SimulationStates";
import {
  SimulationOrderSide,
  SimulationApiError,
} from "../types/simulation-ui.types";
import { Sparkles, PlusCircle } from "lucide-react";

export const SimulationDashboardPage: React.FC = () => {
  const { simulationId: routeSessionId } = useParams<{ simulationId?: string }>();
  const navigate = useNavigate();

  const [selectedSymbol, setSelectedSymbol] = useState<string | undefined>(undefined);
  const [selectedSide, setSelectedSide] = useState<SimulationOrderSide>("BUY");

  const { accessToken, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  // 1. Fetch user's sessions list
  const sessionsQuery = useSimulationSessionsQuery(accessToken ?? undefined);
  const sessions = sessionsQuery.data?.data ?? [];

  // Determine active session ID: prefer URL param, fallback to first available session
  const activeSessionId = routeSessionId ?? (sessions.length > 0 ? sessions[0]!.id : undefined);

  // 2. Fetch specific session details
  const sessionQuery = useSimulationSessionQuery(activeSessionId, accessToken ?? undefined);
  const session = sessionQuery.data?.data;

  // 3. Fetch assets universe and snapshots
  const assetsQuery = useSimulationAssetsQuery(accessToken ?? undefined);
  const assets = assetsQuery.data?.data ?? [];

  const scenarioKey = session?.scenario?.key ?? "MVP_SCENARIO";
  const currentCycle = session?.currentCycle ?? 1;
  const snapshotsQuery = useSimulationSnapshotsQuery(scenarioKey, currentCycle, accessToken ?? undefined);
  const snapshots = snapshotsQuery.data?.data ?? [];

  // 4. Fetch authoritative portfolio, orders, and trades
  const portfolioQuery = useSimulationPortfolioQuery(activeSessionId, accessToken ?? undefined);
  const ordersQuery = useSimulationOrdersQuery(activeSessionId, accessToken ?? undefined);
  const tradesQuery = useSimulationTradesQuery(activeSessionId, accessToken ?? undefined);

  // 5. Mutations
  const createSessionMutation = useCreateSessionMutation();
  const startSessionMutation = useStartSessionMutation();
  const resetSessionMutation = useResetSessionMutation();
  const completeSessionMutation = useCompleteSessionMutation();
  const cancelSessionMutation = useCancelSessionMutation();
  const submitOrderMutation = useSubmitOrderMutation();

  const handleCreateSession = async () => {
    try {
      const res = await createSessionMutation.mutateAsync({
        accessToken: accessToken ?? undefined,
      });
      if (res?.data?.id) {
        navigate(`/simulation/sessions/${res.data.id}`);
      }
    } catch {
      // Error handled by mutation state
    }
  };

  const handleSelectSession = (newSessionId: string) => {
    navigate(`/simulation/sessions/${newSessionId}`);
  };

  const handleStartSession = () => {
    if (!activeSessionId) return;
    startSessionMutation.mutate({ simulationId: activeSessionId, accessToken: accessToken ?? undefined });
  };

  const handleResetSession = () => {
    if (!activeSessionId) return;
    resetSessionMutation.mutate({ simulationId: activeSessionId, accessToken: accessToken ?? undefined });
  };

  const handleCompleteSession = () => {
    if (!activeSessionId) return;
    completeSessionMutation.mutate({ simulationId: activeSessionId, accessToken: accessToken ?? undefined });
  };

  const handleCancelSession = () => {
    if (!activeSessionId) return;
    cancelSessionMutation.mutate({ simulationId: activeSessionId, accessToken: accessToken ?? undefined });
  };

  const handleSelectAssetAction = (symbol: string, side: SimulationOrderSide = "BUY") => {
    setSelectedSymbol(symbol);
    setSelectedSide(side);
  };

  const handleSubmitOrder = async (
    side: SimulationOrderSide,
    assetSymbol: string,
    quantity: number,
    idempotencyKey: string,
  ) => {
    if (!activeSessionId) throw new Error("No active session selected");

    const result = await submitOrderMutation.mutateAsync({
      simulationId: activeSessionId,
      order: {
        side,
        type: "MARKET",
        assetSymbol,
        quantity,
        idempotencyKey,
      },
      accessToken: accessToken ?? undefined,
    });

    return result.data;
  };

  // Auth Error Handler
  const isAuthError =
    (!isAuthLoading && !isAuthenticated && !accessToken) ||
    (sessionsQuery.error instanceof SimulationApiError && sessionsQuery.error.status === 401) ||
    (sessionQuery.error instanceof SimulationApiError && sessionQuery.error.status === 401) ||
    (portfolioQuery.error instanceof SimulationApiError && portfolioQuery.error.status === 401);

  if (isAuthError) {
    return (
      <main className="simulation-page" data-testid="simulation-page">
        <SimulationDisclosureBanner />
        <SimulationAuthRequiredCard />
      </main>
    );
  }

  // Not Found / IDOR Error Handler (AC-009)
  const isNotFoundError =
    (sessionQuery.error instanceof SimulationApiError && sessionQuery.error.status === 404) ||
    (portfolioQuery.error instanceof SimulationApiError && portfolioQuery.error.status === 404);

  if (isNotFoundError) {
    return (
      <main className="simulation-page" data-testid="simulation-page">
        <SimulationDisclosureBanner />
        <SimulationNotFoundCard onCreateNew={handleCreateSession} />
      </main>
    );
  }

  // Generic Error Handler
  if (sessionQuery.isError || portfolioQuery.isError) {
    const err = sessionQuery.error ?? portfolioQuery.error;
    return (
      <main className="simulation-page" data-testid="simulation-page">
        <SimulationDisclosureBanner />
        <SimulationErrorState
          message={err instanceof Error ? err.message : "Failed to load simulation state."}
          onRetry={() => {
            sessionQuery.refetch();
            portfolioQuery.refetch();
          }}
        />
      </main>
    );
  }

  // Loading State
  if (sessionsQuery.isLoading || (activeSessionId && (sessionQuery.isLoading || portfolioQuery.isLoading))) {
    return (
      <main className="simulation-page" data-testid="simulation-page">
        <SimulationDisclosureBanner />
        <SimulationLoadingSkeleton />
      </main>
    );
  }

  // Zero sessions state
  if (sessions.length === 0 || !session || !portfolioQuery.data?.data) {
    return (
      <main className="simulation-page" data-testid="simulation-page">
        <SimulationDisclosureBanner />
        <div className="card simulation-state-card" data-testid="no-sessions-card">
          <div className="card-icon-wrap" style={{ background: "rgba(59, 130, 246, 0.15)", color: "var(--accent-primary)" }}>
            <Sparkles size={28} />
          </div>
          <h2 className="card-title" style={{ marginTop: "1rem" }}>Welcome to Simulation Lab</h2>
          <p className="card-description" style={{ margin: "0.5rem 0 1.5rem" }}>
            Start your investment journey in a safe sandbox. You will receive $100,000.0000 virtual USD to practice trading equities across discrete market cycles.
          </p>
          <button
            type="button"
            className="button button-primary"
            onClick={handleCreateSession}
            disabled={createSessionMutation.isPending}
            data-testid="create-first-session-button"
          >
            <PlusCircle size={16} style={{ marginRight: "6px" }} />
            {createSessionMutation.isPending ? "Creating Simulation..." : "Create Simulation Session"}
          </button>
        </div>
      </main>
    );
  }

  const portfolio = portfolioQuery.data.data;
  const orders = ordersQuery.data?.data ?? [];
  const trades = tradesQuery.data?.data ?? [];

  return (
    <main className="simulation-page" data-testid="simulation-page">
      {/* 1. Mandatory Simulation Disclosure Banner (AC-008, AC-009, AC-010) */}
      <SimulationDisclosureBanner />

      {/* 2. Page Header & Session Bar (AC-001) */}
      <div className="simulation-page-header">
        <h1 className="page-title">Simulation Trading Cockpit</h1>
        <p className="page-subtitle">
          Practice market order execution, position risk management, and portfolio accounting in an isolated virtual sandbox.
        </p>
      </div>

      <SimulationSessionBar
        session={session}
        sessions={sessions}
        onSelectSession={handleSelectSession}
        onStartSession={handleStartSession}
        onResetSession={handleResetSession}
        onCompleteSession={handleCompleteSession}
        onCancelSession={handleCancelSession}
        onCreateSession={handleCreateSession}
        isStarting={startSessionMutation.isPending}
        isResetting={resetSessionMutation.isPending}
        isCompleting={completeSessionMutation.isPending}
        isCancelling={cancelSessionMutation.isPending}
        isCreating={createSessionMutation.isPending}
      />

      {/* 3. Server-Authoritative Portfolio Summary (AC-005, AC-007, AC-011) */}
      <PortfolioSummaryCard portfolio={portfolio} />

      {/* 4. Main Operations Grid */}
      <div className="simulation-dashboard-grid">
        {/* Left Column: Positions & Market Order Ticket */}
        <div className="dashboard-grid-column">
          <PositionsTable
            positions={portfolio.positions}
            onSelectAsset={handleSelectAssetAction}
          />

          <MarketOrderTicket
            simulationId={session.id}
            sessionStatus={session.status}
            assets={assets}
            snapshots={snapshots}
            onSubmitOrder={handleSubmitOrder}
            isSubmitting={submitOrderMutation.isPending}
            selectedSymbol={selectedSymbol}
            selectedSide={selectedSide}
          />
        </div>

        {/* Right Column: Orders History & Executed Trades */}
        <div className="dashboard-grid-column">
          <OrdersTable orders={orders} />
          <TradesTable trades={trades} />
        </div>
      </div>
    </main>
  );
};
