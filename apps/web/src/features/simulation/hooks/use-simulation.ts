import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { simulationApi } from "../../../api/simulation.api";
import {
  SubmitOrderRequestDto,
  SimulationApiError,
} from "../types/simulation-ui.types";

const MARKET_PORTFOLIO_STALE_TIME = 15_000;

function isTestEnv(): boolean {
  return typeof process !== "undefined" && process.env?.NODE_ENV === "test";
}

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (isTestEnv()) return false;
  if (
    error instanceof SimulationApiError &&
    (error.status === 401 || error.status === 403 || error.status === 404)
  ) {
    return false;
  }
  return failureCount < 1;
}

export function useSimulationAssetsQuery(accessToken?: string) {
  return useQuery({
    queryKey: ["simulation", "assets", accessToken],
    queryFn: ({ signal }) => simulationApi.listAssets(accessToken, { signal }),
    staleTime: MARKET_PORTFOLIO_STALE_TIME,
    refetchOnWindowFocus: false,
    retry: shouldRetry,
  });
}

export function useSimulationSessionsQuery(accessToken?: string) {
  return useQuery({
    queryKey: ["simulation", "sessions", accessToken],
    queryFn: ({ signal }) => simulationApi.listSessions(accessToken, { signal }),
    refetchOnWindowFocus: false,
    retry: shouldRetry,
  });
}

export function useSimulationSessionQuery(simulationId?: string, accessToken?: string) {
  return useQuery({
    queryKey: ["simulation", "sessions", simulationId, accessToken],
    queryFn: ({ signal }) => simulationApi.getSessionById(simulationId!, accessToken, { signal }),
    enabled: Boolean(simulationId),
    refetchOnWindowFocus: false,
    retry: shouldRetry,
  });
}

export function useSimulationPortfolioQuery(simulationId?: string, accessToken?: string) {
  return useQuery({
    queryKey: ["simulation", "portfolio", simulationId, accessToken],
    queryFn: ({ signal }) => simulationApi.getPortfolioValuation(simulationId!, accessToken, { signal }),
    enabled: Boolean(simulationId),
    staleTime: MARKET_PORTFOLIO_STALE_TIME,
    refetchOnWindowFocus: false,
    retry: shouldRetry,
  });
}

export function useSimulationOrdersQuery(simulationId?: string, accessToken?: string) {
  return useQuery({
    queryKey: ["simulation", "orders", simulationId, accessToken],
    queryFn: ({ signal }) => simulationApi.getOrders(simulationId!, accessToken, { signal }),
    enabled: Boolean(simulationId),
    refetchOnWindowFocus: false,
    retry: shouldRetry,
  });
}

export function useSimulationTradesQuery(simulationId?: string, accessToken?: string) {
  return useQuery({
    queryKey: ["simulation", "trades", simulationId, accessToken],
    queryFn: ({ signal }) => simulationApi.getTrades(simulationId!, accessToken, { signal }),
    enabled: Boolean(simulationId),
    refetchOnWindowFocus: false,
    retry: shouldRetry,
  });
}

export function useSimulationSnapshotsQuery(scenarioKey?: string, cycle?: number, accessToken?: string) {
  return useQuery({
    queryKey: ["simulation", "snapshots", scenarioKey, cycle, accessToken],
    queryFn: ({ signal }) => simulationApi.listSnapshots(scenarioKey!, cycle!, accessToken, { signal }),
    enabled: Boolean(scenarioKey && cycle),
    staleTime: MARKET_PORTFOLIO_STALE_TIME,
    refetchOnWindowFocus: false,
    retry: shouldRetry,
  });
}

export function useCreateSessionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      accessToken,
    }: {
      data?: Record<string, never>;
      accessToken?: string;
    } = {}) => simulationApi.createSession({}, accessToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["simulation", "sessions"] });
    },
  });
}

export function useStartSessionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      simulationId,
      accessToken,
    }: {
      simulationId: string;
      accessToken?: string;
    }) => simulationApi.startSession(simulationId, accessToken),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["simulation", "sessions"] });
      queryClient.invalidateQueries({ queryKey: ["simulation", "sessions", variables.simulationId] });
      queryClient.invalidateQueries({ queryKey: ["simulation", "portfolio", variables.simulationId] });
    },
  });
}

export function useCompleteSessionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      simulationId,
      accessToken,
    }: {
      simulationId: string;
      accessToken?: string;
    }) => simulationApi.completeSession(simulationId, accessToken),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["simulation", "sessions"] });
      queryClient.invalidateQueries({ queryKey: ["simulation", "sessions", variables.simulationId] });
      queryClient.invalidateQueries({ queryKey: ["simulation", "portfolio", variables.simulationId] });
    },
  });
}

export function useCancelSessionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      simulationId,
      accessToken,
    }: {
      simulationId: string;
      accessToken?: string;
    }) => simulationApi.cancelSession(simulationId, accessToken),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["simulation", "sessions"] });
      queryClient.invalidateQueries({ queryKey: ["simulation", "sessions", variables.simulationId] });
      queryClient.invalidateQueries({ queryKey: ["simulation", "portfolio", variables.simulationId] });
    },
  });
}

export function useResetSessionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      simulationId,
      accessToken,
    }: {
      simulationId: string;
      accessToken?: string;
    }) => simulationApi.resetSession(simulationId, accessToken),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["simulation", "sessions"] });
      queryClient.invalidateQueries({ queryKey: ["simulation", "sessions", variables.simulationId] });
      queryClient.invalidateQueries({ queryKey: ["simulation", "portfolio", variables.simulationId] });
      queryClient.invalidateQueries({ queryKey: ["simulation", "orders", variables.simulationId] });
      queryClient.invalidateQueries({ queryKey: ["simulation", "trades", variables.simulationId] });
    },
  });
}

export function useSubmitOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      simulationId,
      order,
      accessToken,
    }: {
      simulationId: string;
      order: SubmitOrderRequestDto;
      accessToken?: string;
    }) => simulationApi.submitOrder(simulationId, order, accessToken),
    onSuccess: (_, variables) => {
      // Invalidate all server-authoritative portfolio, orders, and trades state
      queryClient.invalidateQueries({ queryKey: ["simulation", "portfolio", variables.simulationId] });
      queryClient.invalidateQueries({ queryKey: ["simulation", "orders", variables.simulationId] });
      queryClient.invalidateQueries({ queryKey: ["simulation", "trades", variables.simulationId] });
      queryClient.invalidateQueries({ queryKey: ["simulation", "sessions", variables.simulationId] });
    },
  });
}
