export interface AdminRequestOptions {
  signal?: AbortSignal;
}

export class AdminApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
    this.code = code;
  }
}

export interface AdminSystemMetrics {
  totalUsers: number;
  activeUsers24h: number;
  activeSimulationSessions: number;
  flaggedContentCount: number;
  pendingReviewCount: number;
  systemHealth: "HEALTHY" | "DEGRADED" | "MAINTENANCE";
  uptimeSeconds: number;
  databaseStatus: "CONNECTED" | "DISCONNECTED";
  lastAuditTimestamp: string;
}

export type UserRole = "LEARNER" | "ADMIN";
export type UserStatus = "ACTIVE" | "SUSPENDED";

export interface AdminUserItem {
  id: string;
  email: string;
  displayName: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  lastLoginAt?: string | null;
}

export interface ListUsersParams {
  search?: string;
  status?: UserStatus | "ALL";
  role?: UserRole | "ALL";
  page?: number;
  limit?: number;
}

export interface ListUsersResponse {
  data: AdminUserItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UpdateUserStatusPayload {
  status: UserStatus;
  reason?: string;
}

export type ModerationItemType = "POST" | "COMMENT";
export type ModerationStatus = "PENDING" | "DISMISSED" | "RESOLVED" | "DELETED";

export interface ModerationQueueItem {
  id: string;
  targetType: ModerationItemType;
  targetId: string;
  authorId: string;
  authorName: string;
  snippet: string;
  reason: string;
  reportCount: number;
  status: ModerationStatus;
  reportedAt: string;
}

export interface ListModerationParams {
  status?: ModerationStatus | "ALL";
  targetType?: ModerationItemType | "ALL";
  page?: number;
  limit?: number;
}

export interface ListModerationResponse {
  data: ModerationQueueItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type ModerationResolutionAction = "DISMISS" | "HIDE" | "DELETE";

export interface ResolveModerationPayload {
  action: ModerationResolutionAction;
  notes?: string;
}

export type AuditEventType =
  | "USER_AUTHENTICATION"
  | "USER_STATUS_CHANGE"
  | "CONTENT_FLAGGED"
  | "CONTENT_MODERATED"
  | "ADMIN_ACCESS_VERIFIED"
  | "SECURITY_GUARD_TRIGGERED";

export interface AuditRecordItem {
  id: string;
  eventType: AuditEventType;
  actorId: string;
  actorEmail?: string;
  targetEntity: string;
  targetId?: string;
  status: "SUCCESS" | "DENIED" | "FAILURE";
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface ListAuditParams {
  eventType?: string;
  actorId?: string;
  page?: number;
  limit?: number;
}

export interface ListAuditResponse {
  data: AuditRecordItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function getSafeErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return "The administrative request was invalid.";
    case 401:
      return "Authentication is required to access administrative controls.";
    case 403:
      return "Administrative authority required. Access denied.";
    case 404:
      return "The requested administrative resource was not found.";
    case 409:
      return "Conflict occurred while performing administrative operation.";
    case 429:
      return "Rate limit exceeded. Please wait before retrying.";
    case 500:
    case 502:
    case 503:
    case 504:
      return "Administrative service is temporarily unavailable.";
    default:
      return `Administrative operation failed with status ${status}.`;
  }
}

function getSafeErrorCode(status: number): string {
  switch (status) {
    case 401:
      return "UNAUTHENTICATED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    case 429:
      return "TOO_MANY_REQUESTS";
    default:
      return status >= 500 ? "SERVICE_ERROR" : "REQUEST_FAILED";
  }
}

export interface IAdminApiClient {
  verifyAdminAccess(
    accessToken: string,
    options?: AdminRequestOptions,
  ): Promise<{ status: string; scope: string }>;

  getSystemMetrics(
    accessToken: string,
    options?: AdminRequestOptions,
  ): Promise<{ data: AdminSystemMetrics }>;

  listUsers(
    params: ListUsersParams,
    accessToken: string,
    options?: AdminRequestOptions,
  ): Promise<ListUsersResponse>;

  updateUserStatus(
    userId: string,
    data: UpdateUserStatusPayload,
    accessToken: string,
    options?: AdminRequestOptions,
  ): Promise<{ success: boolean; user: AdminUserItem }>;

  listModerationQueue(
    params: ListModerationParams,
    accessToken: string,
    options?: AdminRequestOptions,
  ): Promise<ListModerationResponse>;

  resolveModerationItem(
    itemId: string,
    action: ModerationResolutionAction,
    accessToken: string,
    options?: AdminRequestOptions,
  ): Promise<{ success: boolean; itemId: string; status: ModerationStatus }>;

  listAuditRecords(
    params: ListAuditParams,
    accessToken: string,
    options?: AdminRequestOptions,
  ): Promise<ListAuditResponse>;
}

export class AdminApiClient implements IAdminApiClient {
  private baseUrl: string;
  private pingUrl: string;

  constructor(baseUrl = "/api/admin", pingUrl = "/admin/ping") {
    this.baseUrl = baseUrl;
    this.pingUrl = pingUrl;
  }

  setBaseUrl(baseUrl: string, pingUrl?: string): void {
    this.baseUrl = baseUrl;
    if (pingUrl) {
      this.pingUrl = pingUrl;
    }
  }

  private async executeFetch<T>(
    url: string,
    method: "GET" | "POST" | "PATCH" | "DELETE",
    accessToken: string,
    options?: AdminRequestOptions,
    body?: unknown,
  ): Promise<T> {
    const headers: Record<string, string> = {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    };

    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: options?.signal,
    });

    if (!res.ok) {
      let code: string | undefined;
      let message = getSafeErrorMessage(res.status);
      try {
        const resBody = await res.json();
        if (resBody?.code) code = resBody.code;
        if (resBody?.message) message = resBody.message;
      } catch {
        // ignore parse failure
      }
      throw new AdminApiError(message, res.status, code || getSafeErrorCode(res.status));
    }

    return (await res.json()) as T;
  }

  async verifyAdminAccess(
    accessToken: string,
    options?: AdminRequestOptions,
  ): Promise<{ status: string; scope: string }> {
    return this.executeFetch<{ status: string; scope: string }>(
      this.pingUrl,
      "GET",
      accessToken,
      options,
    );
  }

  async getSystemMetrics(
    accessToken: string,
    options?: AdminRequestOptions,
  ): Promise<{ data: AdminSystemMetrics }> {
    return this.executeFetch<{ data: AdminSystemMetrics }>(
      `${this.baseUrl}/metrics`,
      "GET",
      accessToken,
      options,
    );
  }

  async listUsers(
    params: ListUsersParams = {},
    accessToken: string,
    options?: AdminRequestOptions,
  ): Promise<ListUsersResponse> {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.status && params.status !== "ALL") query.set("status", params.status);
    if (params.role && params.role !== "ALL") query.set("role", params.role);
    if (params.page !== undefined) query.set("page", String(params.page));
    if (params.limit !== undefined) query.set("limit", String(params.limit));

    const qs = query.toString();
    const url = `${this.baseUrl}/users${qs ? `?${qs}` : ""}`;

    return this.executeFetch<ListUsersResponse>(url, "GET", accessToken, options);
  }

  async updateUserStatus(
    userId: string,
    data: UpdateUserStatusPayload,
    accessToken: string,
    options?: AdminRequestOptions,
  ): Promise<{ success: boolean; user: AdminUserItem }> {
    return this.executeFetch<{ success: boolean; user: AdminUserItem }>(
      `${this.baseUrl}/users/${encodeURIComponent(userId)}/status`,
      "PATCH",
      accessToken,
      options,
      data,
    );
  }

  async listModerationQueue(
    params: ListModerationParams = {},
    accessToken: string,
    options?: AdminRequestOptions,
  ): Promise<ListModerationResponse> {
    const query = new URLSearchParams();
    if (params.status && params.status !== "ALL") query.set("status", params.status);
    if (params.targetType && params.targetType !== "ALL") query.set("targetType", params.targetType);
    if (params.page !== undefined) query.set("page", String(params.page));
    if (params.limit !== undefined) query.set("limit", String(params.limit));

    const qs = query.toString();
    const url = `${this.baseUrl}/moderation${qs ? `?${qs}` : ""}`;

    return this.executeFetch<ListModerationResponse>(url, "GET", accessToken, options);
  }

  async resolveModerationItem(
    itemId: string,
    action: ModerationResolutionAction,
    accessToken: string,
    options?: AdminRequestOptions,
  ): Promise<{ success: boolean; itemId: string; status: ModerationStatus }> {
    return this.executeFetch<{ success: boolean; itemId: string; status: ModerationStatus }>(
      `${this.baseUrl}/moderation/${encodeURIComponent(itemId)}/resolve`,
      "POST",
      accessToken,
      options,
      { action },
    );
  }

  async listAuditRecords(
    params: ListAuditParams = {},
    accessToken: string,
    options?: AdminRequestOptions,
  ): Promise<ListAuditResponse> {
    const query = new URLSearchParams();
    if (params.eventType) query.set("eventType", params.eventType);
    if (params.actorId) query.set("actorId", params.actorId);
    if (params.page !== undefined) query.set("page", String(params.page));
    if (params.limit !== undefined) query.set("limit", String(params.limit));

    const qs = query.toString();
    const url = `${this.baseUrl}/audit${qs ? `?${qs}` : ""}`;

    return this.executeFetch<ListAuditResponse>(url, "GET", accessToken, options);
  }
}

export const adminApi = new AdminApiClient();
