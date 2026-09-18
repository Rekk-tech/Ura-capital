export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUser;
}

export interface IAuthApiClient {
  login(email: string, password: string): Promise<LoginResponse>;
  refresh(): Promise<LoginResponse>;
  logout(): Promise<{ success: boolean }>;
  getMe(accessToken: string): Promise<{ user: { userId: string; email: string; role: string } }>;
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
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      let message = "Login failed";
      try {
        const errorData = await res.json();
        message = errorData?.error?.message ?? message;
      } catch {
        // use default
      }
      throw new Error(message);
    }

    return (await res.json()) as LoginResponse;
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
      throw new Error("Session refresh failed");
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

  async getMe(accessToken: string): Promise<{ user: { userId: string; email: string; role: string } }> {
    const res = await fetch(`${this.baseUrl}/me`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      throw new Error("Unauthorized");
    }

    return (await res.json()) as { user: { userId: string; email: string; role: string } };
  }
}

export const authApi = new AuthApiClient();
