export interface AuthUser {
  id: string;
  email: string;
  displayName?: string | null;
  status?: string;
  createdAt?: string;
  role?: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUser;
}

export interface RegisterPayload {
  email: string;
  password: string;
  displayName?: string;
}

export interface RegisterResponse {
  user: AuthUser;
}

export class AuthApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "AuthApiError";
    this.status = status;
    this.code = code;
  }
}

export interface IAuthApiClient {
  login(email: string, password: string): Promise<LoginResponse>;
  register(payload: RegisterPayload): Promise<RegisterResponse>;
  refresh(): Promise<LoginResponse>;
  logout(): Promise<{ success: boolean }>;
  getMe(accessToken: string): Promise<{ user: AuthUser }>;
}

export class AuthApiClient implements IAuthApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl = "/api/auth") {
    this.baseUrl = baseUrl;
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const res = await fetch(`${this.baseUrl}/login`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: "include", // for refresh token cookie
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });

    if (!res.ok) {
      let message = "Invalid email or password";
      let code: string | undefined;
      try {
        const errorData = await res.json();
        message = errorData?.error?.message ?? message;
        code = errorData?.error?.code;
      } catch {
        // use default
      }
      throw new AuthApiError(message, res.status, code);
    }

    return (await res.json()) as LoginResponse;
  }

  async register(payload: RegisterPayload): Promise<RegisterResponse> {
    const res = await fetch(`${this.baseUrl}/register`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        email: payload.email.trim().toLowerCase(),
        password: payload.password,
        ...(payload.displayName?.trim() ? { displayName: payload.displayName.trim() } : {}),
      }),
    });

    if (!res.ok) {
      let message = "Registration failed";
      let code: string | undefined;
      try {
        const errorData = await res.json();
        message = errorData?.error?.message ?? message;
        code = errorData?.error?.code;
      } catch {
        // use default
      }
      throw new AuthApiError(message, res.status, code);
    }

    return (await res.json()) as RegisterResponse;
  }

  async refresh(): Promise<LoginResponse> {
    const res = await fetch(`${this.baseUrl}/refresh`, {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      credentials: "include", // sends refresh token cookie
    });

    if (!res.ok) {
      throw new AuthApiError("Session refresh failed", res.status);
    }

    return (await res.json()) as LoginResponse;
  }

  async logout(): Promise<{ success: boolean }> {
    const res = await fetch(`${this.baseUrl}/logout`, {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      credentials: "include",
    });

    return { success: res.ok };
  }

  async getMe(accessToken: string): Promise<{ user: AuthUser }> {
    const res = await fetch(`${this.baseUrl}/me`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      throw new AuthApiError("Unauthorized", res.status);
    }

    return (await res.json()) as { user: AuthUser };
  }
}

export const authApi = new AuthApiClient();
