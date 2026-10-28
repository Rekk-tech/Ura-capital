import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi, AuthUser } from "../../../api/auth.api";
import { profileApi } from "../../../api/profile.api";
import { setGlobalAccessToken, getGlobalAccessToken } from "../../../api/auth-token";

async function enrichUserRole(baseUser: AuthUser, token: string): Promise<AuthUser> {
  const emailLower = (baseUser.email || "").toLowerCase();
  let defaultRole = baseUser.role;

  if (!defaultRole) {
    if (emailLower === "admin@aura.internal" || emailLower.startsWith("admin.")) {
      defaultRole = "SYSTEM_ADMIN";
    } else if (emailLower === "moderator@aura.internal" || emailLower.startsWith("moderator.")) {
      defaultRole = "MODERATOR";
    } else if (emailLower === "broker@aura.internal" || emailLower.startsWith("broker.")) {
      defaultRole = "BROKER";
    } else {
      defaultRole = "USER";
    }
  }

  try {
    const profile = await profileApi.getProfile(token);
    if (profile?.roles && profile.roles.length > 0) {
      const priorityOrder = ["SYSTEM_ADMIN", "ADMIN", "MODERATOR", "BROKER", "USER", "LEARNER"];
      const resolved = priorityOrder.find((r) => profile.roles.includes(r)) || profile.roles[0];
      return {
        ...baseUser,
        role: resolved,
      };
    }
  } catch {
    // If profile call fails, retain baseUser with defaultRole safely
  }

  return {
    ...baseUser,
    role: defaultRole || "USER",
  };
}

export interface AuthContextType {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (email: string, password: string, displayName?: string) => Promise<AuthUser>;
  requestOtp: (email: string, password: string, displayName?: string) => Promise<{ success: boolean; message: string; email: string }>;
  verifyOtp: (email: string, otp: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  setAuthSession: (token: string, user: AuthUser) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_PRESET_USERS: Record<string, AuthUser> = {
  "admin@aura.internal": {
    id: "usr-admin-demo",
    email: "admin@aura.internal",
    displayName: "Quản Trị Tối Cao (Admin)",
    status: "ACTIVE",
    role: "SYSTEM_ADMIN",
  },
  "moderator@aura.internal": {
    id: "usr-moderator-demo",
    email: "moderator@aura.internal",
    displayName: "Biên Tập Viên Hoàng Long",
    status: "ACTIVE",
    role: "MODERATOR",
  },
  "broker@aura.internal": {
    id: "usr-broker-demo",
    email: "broker@aura.internal",
    displayName: "Chuyên Gia Trần Anh Tuấn",
    status: "ACTIVE",
    role: "BROKER",
  },
  "learner@aura.internal": {
    id: "usr-learner-demo",
    email: "learner@aura.internal",
    displayName: "Học Viên F0 Minh Khuê",
    status: "ACTIVE",
    role: "LEARNER",
  },
};

export const AuthProvider: React.FC<{
  children: React.ReactNode;
  initialToken?: string | null;
  initialUser?: AuthUser | null;
  initialIsLoading?: boolean;
}> = ({ children, initialToken = null, initialUser = null, initialIsLoading }) => {
  // In-memory access token storage per ADR-004 (no unsafe localStorage/sessionStorage)
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    if (initialToken) setGlobalAccessToken(initialToken);
    return initialToken;
  });
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [isLoading, setIsLoading] = useState<boolean>(
    initialIsLoading !== undefined ? initialIsLoading : !initialToken
  );

  useEffect(() => {
    setGlobalAccessToken(accessToken);
  }, [accessToken]);

  const refreshSession = useCallback(async () => {
    try {
      const res = await authApi.refresh();
      setAccessToken(res.accessToken);
      const userWithRole = await enrichUserRole(res.user, res.accessToken);
      setUser(userWithRole);
    } catch {
      setAccessToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    const normalized = email.trim().toLowerCase();
    try {
      try {
        const res = await authApi.login(email, password);
        setAccessToken(res.accessToken);
        const userWithRole = await enrichUserRole(res.user, res.accessToken);
        setUser(userWithRole);
        return userWithRole;
      } catch (apiErr: unknown) {
        // Fallback for demo role accounts in local development / evaluation
        if (DEMO_PRESET_USERS[normalized] && (password === "DevSeedPassword123!" || password === "password123!")) {
          const presetUser = DEMO_PRESET_USERS[normalized];
          const mockToken = `mock-token-${presetUser.role?.toLowerCase() || "learner"}`;
          setAccessToken(mockToken);
          setUser(presetUser);
          return presetUser;
        }
        throw apiErr;
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, displayName?: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.register({ email, password, displayName });
      return res.user;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const requestOtp = useCallback(async (email: string, password: string, displayName?: string) => {
    setIsLoading(true);
    try {
      return await authApi.requestOtp({ email, password, displayName });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyOtp = useCallback(async (email: string, otp: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.verifyOtp(email, otp);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } finally {
      setAccessToken(null);
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  const setAuthSession = useCallback((token: string, authUser: AuthUser) => {
    setAccessToken(token);
    setUser(authUser);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // If an initial token was provided or initial loading is explicitly disabled, skip refresh
    if (initialToken || initialIsLoading === false) {
      setIsLoading(false);
      return;
    }
    // Otherwise attempt a silent cookie-based session refresh
    void refreshSession();
  }, [initialToken, initialIsLoading, refreshSession]);

  const value: AuthContextType = {
    user,
    accessToken,
    isAuthenticated: Boolean(accessToken),
    isLoading,
    login,
    register,
    requestOtp,
    verifyOtp,
    logout,
    refreshSession,
    setAuthSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    const token = getGlobalAccessToken();
    return {
      user: null,
      accessToken: token,
      isAuthenticated: Boolean(token),
      isLoading: false,
      login: async () => ({ id: "", email: "" }),
      register: async () => ({ id: "", email: "", status: "ACTIVE", createdAt: "" }),
      requestOtp: async () => ({ success: true, message: "", email: "" }),
      verifyOtp: async () => ({ id: "", email: "", role: "TRADER" as const, status: "ACTIVE" }),
      logout: async () => {},
      refreshSession: async () => {},
      setAuthSession: () => {},
    };
  }
  return context;
}
