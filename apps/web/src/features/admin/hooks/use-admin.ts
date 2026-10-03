import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminApi,
  AdminApiError,
  AdminSystemMetrics,
  ListUsersParams,
  ListUsersResponse,
  UpdateUserStatusPayload,
  ListModerationParams,
  ListModerationResponse,
  ModerationResolutionAction,
  ListAuditParams,
  ListAuditResponse,
  UserRole,
  LearnerProgressDetail,
} from "../../../api/admin.api";

/**
 * Suppress retries on 401 Unauthorized, 403 Forbidden, and 404 Not Found.
 * Maximum 2 retries for transient 5xx network errors.
 */
export const shouldAdminRetry = (failureCount: number, error: unknown): boolean => {
  if (failureCount >= 2) return false;
  if (error instanceof AdminApiError) {
    if (error.status === 401 || error.status === 403 || error.status === 404) {
      return false;
    }
  }
  const status = (error as { status?: number })?.status;
  if (status === 401 || status === 403 || status === 404) {
    return false;
  }
  return true;
};

export const ADMIN_QUERY_DEFAULTS = {
  staleTime: 30_000,
  refetchOnWindowFocus: false,
  retry: shouldAdminRetry,
  retryDelay: 10,
};

/**
 * Authoritative admin verification check against GET /admin/ping.
 */
export function useAdminVerification(accessToken: string | null, enabled = true) {
  return useQuery({
    queryKey: ["admin", "verify", accessToken],
    queryFn: ({ signal }) => {
      if (!accessToken) throw new AdminApiError("Unauthenticated", 401, "UNAUTHENTICATED");
      return adminApi.verifyAdminAccess(accessToken, { signal });
    },
    enabled: Boolean(accessToken && enabled),
    ...ADMIN_QUERY_DEFAULTS,
  });
}

/**
 * Fetches high-level operational system metrics.
 */
export function useAdminMetrics(accessToken: string | null, enabled = true) {
  return useQuery<{ data: AdminSystemMetrics }>({
    queryKey: ["admin", "metrics", accessToken],
    queryFn: ({ signal }) => {
      if (!accessToken) throw new AdminApiError("Unauthenticated", 401, "UNAUTHENTICATED");
      return adminApi.getSystemMetrics(accessToken, { signal });
    },
    enabled: Boolean(accessToken && enabled),
    ...ADMIN_QUERY_DEFAULTS,
  });
}

/**
 * Fetches paginated user list with filters.
 */
export function useAdminUsers(params: ListUsersParams, accessToken: string | null, enabled = true) {
  return useQuery<ListUsersResponse>({
    queryKey: ["admin", "users", params, accessToken],
    queryFn: ({ signal }) => {
      if (!accessToken) throw new AdminApiError("Unauthenticated", 401, "UNAUTHENTICATED");
      return adminApi.listUsers(params, accessToken, { signal });
    },
    enabled: Boolean(accessToken && enabled),
    ...ADMIN_QUERY_DEFAULTS,
  });
}

/**
 * Mutation to update user status (activate / suspend).
 */
export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      data,
      accessToken,
    }: {
      userId: string;
      data: UpdateUserStatusPayload;
      accessToken: string;
    }) => adminApi.updateUserStatus(userId, data, accessToken),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "audit"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "metrics"] });
    },
  });
}

/**
 * Mutation to update user role (LEARNER / ADMIN).
 */
export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      role,
      accessToken,
    }: {
      userId: string;
      role: UserRole;
      accessToken: string;
    }) => adminApi.updateUserRole(userId, role, accessToken),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "audit"] });
    },
  });
}

/**
 * Fetches real-time learner progress and domain stats.
 */
export function useLearnerDetails(userId: string | null, accessToken: string | null, enabled = true) {
  return useQuery<{ data: LearnerProgressDetail }>({
    queryKey: ["admin", "learner-details", userId, accessToken],
    queryFn: ({ signal }) => {
      if (!accessToken || !userId) throw new AdminApiError("Unauthenticated", 401, "UNAUTHENTICATED");
      return adminApi.getLearnerDetails(userId, accessToken, { signal });
    },
    enabled: Boolean(accessToken && userId && enabled),
    ...ADMIN_QUERY_DEFAULTS,
  });
}

/**
 * Mutation to reset a stalled simulation session.
 */
export function useResetSimulationSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      accessToken,
    }: {
      sessionId: string;
      accessToken: string;
    }) => adminApi.resetSimulationSession(sessionId, accessToken),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "metrics"] });
    },
  });
}

/**
 * Fetches moderation queue items.
 */
export function useAdminModerationQueue(
  params: ListModerationParams,
  accessToken: string | null,
  enabled = true,
) {
  return useQuery<ListModerationResponse>({
    queryKey: ["admin", "moderation", params, accessToken],
    queryFn: ({ signal }) => {
      if (!accessToken) throw new AdminApiError("Unauthenticated", 401, "UNAUTHENTICATED");
      return adminApi.listModerationQueue(params, accessToken, { signal });
    },
    enabled: Boolean(accessToken && enabled),
    ...ADMIN_QUERY_DEFAULTS,
  });
}

/**
 * Mutation to resolve a moderation item.
 */
export function useResolveModerationItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      action,
      accessToken,
    }: {
      itemId: string;
      action: ModerationResolutionAction;
      accessToken: string;
    }) => adminApi.resolveModerationItem(itemId, action, accessToken),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "moderation"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "audit"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "metrics"] });
    },
  });
}

/**
 * Fetches security and administrative audit records.
 */
export function useAdminAuditRecords(
  params: ListAuditParams,
  accessToken: string | null,
  enabled = true,
) {
  return useQuery<ListAuditResponse>({
    queryKey: ["admin", "audit", params, accessToken],
    queryFn: ({ signal }) => {
      if (!accessToken) throw new AdminApiError("Unauthenticated", 401, "UNAUTHENTICATED");
      return adminApi.listAuditRecords(params, accessToken, { signal });
    },
    enabled: Boolean(accessToken && enabled),
    ...ADMIN_QUERY_DEFAULTS,
  });
}
