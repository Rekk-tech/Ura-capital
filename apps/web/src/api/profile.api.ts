import { getApiBaseUrl } from "./config";
import { getGlobalAccessToken } from "./auth-token";

export interface ProfileRequestOptions {
  signal?: AbortSignal;
}

export class ProfileApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ProfileApiError";
    this.status = status;
    this.code = code;
  }
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string | null;
  status: string;
  roles: string[];
  createdAt: string;
}

export interface UpdateProfilePayload {
  displayName?: string;
  preferences?: Record<string, unknown>;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string;
}

export interface UserSession {
  id: string;
  device: string;
  browser: string;
  ipAddress?: string;
  lastActive: string;
  isCurrent: boolean;
  createdAt: string;
}

export interface IProfileApiClient {
  getProfile(accessToken?: string, options?: ProfileRequestOptions): Promise<UserProfile>;
  updateProfile(data: UpdateProfilePayload, accessToken?: string, options?: ProfileRequestOptions): Promise<UserProfile>;
  changePassword(data: ChangePasswordPayload, accessToken?: string, options?: ProfileRequestOptions): Promise<{ success: boolean; message: string }>;
  listSessions(accessToken?: string, options?: ProfileRequestOptions): Promise<UserSession[]>;
}

export class ProfileApiClient implements IProfileApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl = `${getApiBaseUrl()}/api/auth`) {
    this.baseUrl = baseUrl;
  }

  private getEffectiveToken(accessToken?: string): string {
    const token = accessToken || getGlobalAccessToken();
    if (!token) {
      throw new ProfileApiError("Authentication required", 401, "UNAUTHENTICATED");
    }
    return token;
  }

  private getHeaders(token: string, isJson = false): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };
    if (isJson) {
      headers["Content-Type"] = "application/json";
    }
    return headers;
  }

  async getProfile(accessToken?: string, options?: ProfileRequestOptions): Promise<UserProfile> {
    const token = this.getEffectiveToken(accessToken);
    const url = `${this.baseUrl}/profile`;

    const res = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(token),
      credentials: "include",
      signal: options?.signal,
    });

    if (!res.ok) {
      let message = "Failed to load user profile";
      let code: string | undefined;
      try {
        const errorData = await res.json();
        message = errorData?.error?.message ?? errorData?.message ?? message;
        code = errorData?.error?.code ?? errorData?.code;
      } catch {
        // fallback
      }
      throw new ProfileApiError(message, res.status, code);
    }

    const json = await res.json();
    return json.profile ?? json.data ?? json;
  }

  async updateProfile(
    data: UpdateProfilePayload,
    accessToken?: string,
    options?: ProfileRequestOptions
  ): Promise<UserProfile> {
    const token = this.getEffectiveToken(accessToken);
    const url = `${this.baseUrl}/profile`;

    const res = await fetch(url, {
      method: "PATCH",
      headers: this.getHeaders(token, true),
      credentials: "include",
      body: JSON.stringify(data),
      signal: options?.signal,
    });

    if (!res.ok) {
      let message = "Failed to update profile";
      let code: string | undefined;
      try {
        const errorData = await res.json();
        message = errorData?.error?.message ?? errorData?.message ?? message;
        code = errorData?.error?.code ?? errorData?.code;
      } catch {
        // fallback
      }
      throw new ProfileApiError(message, res.status, code);
    }

    const json = await res.json();
    return json.profile ?? json.data ?? json;
  }

  async changePassword(
    data: ChangePasswordPayload,
    accessToken?: string,
    options?: ProfileRequestOptions
  ): Promise<{ success: boolean; message: string }> {
    const token = this.getEffectiveToken(accessToken);
    const url = `${this.baseUrl}/change-password`;

    const res = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(token, true),
      credentials: "include",
      body: JSON.stringify({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }),
      signal: options?.signal,
    });

    if (!res.ok) {
      let message = "Failed to change password";
      let code: string | undefined;
      try {
        const errorData = await res.json();
        message = errorData?.error?.message ?? errorData?.message ?? message;
        code = errorData?.error?.code ?? errorData?.code;
      } catch {
        // fallback
      }
      throw new ProfileApiError(message, res.status, code);
    }

    const json = await res.json();
    return {
      success: json.success ?? true,
      message: json.message ?? "Password changed successfully",
    };
  }

  async listSessions(accessToken?: string, options?: ProfileRequestOptions): Promise<UserSession[]> {
    const token = this.getEffectiveToken(accessToken);
    const url = `${this.baseUrl}/sessions`;

    const res = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(token),
      credentials: "include",
      signal: options?.signal,
    });

    if (!res.ok) {
      let message = "Failed to list active sessions";
      let code: string | undefined;
      try {
        const errorData = await res.json();
        message = errorData?.error?.message ?? errorData?.message ?? message;
        code = errorData?.error?.code ?? errorData?.code;
      } catch {
        // fallback
      }
      throw new ProfileApiError(message, res.status, code);
    }

    const json = await res.json();
    return json.sessions ?? json.data ?? [];
  }
}

export const profileApi = new ProfileApiClient();
