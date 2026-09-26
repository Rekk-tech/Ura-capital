import { useMemo } from "react";
import {
  useSimulationSessionsQuery,
  useSimulationPortfolioQuery,
  useSimulationTradesQuery,
} from "../../simulation/hooks/use-simulation";
import {
  calculatePortfolioSummary,
  calculatePnLAnalytics,
  calculateAssetAllocation,
  calculateEquityTrend,
} from "../utils/portfolioCalculations";

export function usePortfolioData(simulationId?: string, accessToken?: string) {
  const sessionsQuery = useSimulationSessionsQuery(accessToken);

  // If no simulationId passed, default to first active session, or first session in list
  const activeSessionId = useMemo(() => {
    if (simulationId) return simulationId;
    const sessions = sessionsQuery.data?.data || [];
    const active = sessions.find((s) => s.status === "ACTIVE");
    return active ? active.id : sessions[0]?.id;
  }, [simulationId, sessionsQuery.data?.data]);

  const portfolioQuery = useSimulationPortfolioQuery(activeSessionId, accessToken);
  const tradesQuery = useSimulationTradesQuery(activeSessionId, accessToken);

  const valuation = portfolioQuery.data?.data;
  const trades = tradesQuery.data?.data || [];

  const summary = useMemo(() => {
    if (!valuation) return null;
    return calculatePortfolioSummary(valuation);
  }, [valuation]);

  const pnlAnalytics = useMemo(() => {
    if (!valuation) return null;
    return calculatePnLAnalytics(valuation, trades);
  }, [valuation, trades]);

  const allocationItems = useMemo(() => {
    if (!valuation) return [];
    return calculateAssetAllocation(valuation);
  }, [valuation]);

  const trendPoints = useMemo(() => {
    if (!valuation) return [];
    return calculateEquityTrend(valuation, trades);
  }, [valuation, trades]);

  const isLoading = sessionsQuery.isLoading || (Boolean(activeSessionId) && portfolioQuery.isLoading);
  const isError = sessionsQuery.isError || portfolioQuery.isError;
  const error = sessionsQuery.error || portfolioQuery.error;

  const refetch = () => {
    sessionsQuery.refetch();
    if (activeSessionId) {
      portfolioQuery.refetch();
      tradesQuery.refetch();
    }
  };

  return {
    sessions: sessionsQuery.data?.data || [],
    activeSessionId,
    valuation,
    trades,
    summary,
    pnlAnalytics,
    allocationItems,
    trendPoints,
    isLoading,
    isError,
    error,
    refetch,
  };
}
