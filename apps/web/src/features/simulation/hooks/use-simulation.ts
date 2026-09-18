import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { simulationApi } from "../../../api/simulation.api";
import {
  SubmitOrderRequestDto,
} from "../types/simulation-ui.types";

export function useSimulationAssetsQuery(accessToken?: string) {
  return useQuery({
    queryKey: ["simulation", "assets", accessToken],
    queryFn: () => simulationApi.listAssets(accessToken),
  });
}

export function useSimulationSessionsQuery(accessToken?: string) {
  return useQuery({
    queryKey: ["simulation", "sessions", accessToken],
    queryFn: () => simulationApi.listSessions(accessToken),
  });
}

export function useSimulationSessionQuery(simulationId?: string, accessToken?: string) {
  return useQuery({
    queryKey: ["simulation", "sessions", simulationId, accessToken],
    queryFn: () => simulationApi.getSessionById(simulationId!, accessToken),
    enabled: Boolean(simulationId),
  });
}

export function useSimulationPortfolioQuery(simulationId?: string, accessToken?: string) {
  return useQuery({
    queryKey: ["simulation", "portfolio", simulationId, accessToken],
    queryFn: () => simulationApi.getPortfolioValuation(simulationId!, accessToken),
    enabled: Boolean(simulationId),
  });
}

export function useSimulationOrdersQuery(simulationId?: string, accessToken?: string) {
  return useQuery({
    queryKey: ["simulation", "orders", simulationId, accessToken],
    queryFn: () => simulationApi.getOrders(simulationId!, accessToken),
    enabled: Boolean(simulationId),
  });
}

export function useSimulationTradesQuery(simulationId?: string, accessToken?: string) {
  return useQuery({
    queryKey: ["simulation", "trades", simulationId, accessToken],
    queryFn: () => simulationApi.getTrades(simulationId!, accessToken),
    enabled: Boolean(simulationId),
  });
}

export function useSimulationSnapshotsQuery(scenarioKey?: string, cycle?: number, accessToken?: string) {
  return useQuery({
    queryKey: ["simulation", "snapshots", scenarioKey, cycle, accessToken],
    queryFn: () => simulationApi.listSnapshots(scenarioKey!, cycle!, accessToken),
    enabled: Boolean(scenarioKey && cycle),
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
