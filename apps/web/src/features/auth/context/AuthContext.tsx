import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi, AuthUser } from "../../../api/auth.api";
import { profileApi } from "../../../api/profile.api";
import { setGlobalAccessToken, getGlobalAccessToken } from "../../../api/auth-token";

async function enrichUserRole(baseUser: AuthUser, token: string): Promise<AuthUser> {
  if (baseUser.role) return baseUser;
  try {
    const profile = await profileApi.getProfile(token);
    if (profile?.roles && profile.roles.length > 0) {
      return {
        ...baseUser,
        role: profile.roles.includes("ADMIN") ? "ADMIN" : profile.roles[0],
      };
    }
  } catch {
    // If profile call fails, retain baseUser safely
  }
  return baseUser;
}

export interface AuthContextType {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  setAuthSession: (token: string, user: AuthUser) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
    try {
      const res = await authApi.login(email, password);
      setAccessToken(res.accessToken);
      const userWithRole = await enrichUserRole(res.user, res.accessToken);
      setUser(userWithRole);
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
      login: async () => {},
      register: async () => ({ id: "", email: "", status: "ACTIVE", createdAt: "" }),
      logout: async () => {},
      refreshSession: async () => {},
      setAuthSession: () => {},
    };
  }
  return context;
}
