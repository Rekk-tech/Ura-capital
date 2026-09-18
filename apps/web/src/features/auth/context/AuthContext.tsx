import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi, AuthUser } from "../../../api/auth.api";

export interface AuthContextType {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  setAuthSession: (token: string, user: AuthUser) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{
  children: React.ReactNode;
  initialToken?: string | null;
  initialUser?: AuthUser | null;
}> = ({ children, initialToken = null, initialUser = null }) => {
  // In-memory access token storage per ADR-004 (no unsafe localStorage/sessionStorage)
  const [accessToken, setAccessToken] = useState<string | null>(initialToken);
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [isLoading, setIsLoading] = useState<boolean>(!initialToken);

  const refreshSession = useCallback(async () => {
    try {
      const res = await authApi.refresh();
      setAccessToken(res.accessToken);
      setUser(res.user);
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
      setUser(res.user);
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
    // If an initial token was provided, we are already initialized
    if (initialToken) {
      setIsLoading(false);
      return;
    }
    // Otherwise attempt a silent cookie-based session refresh
    void refreshSession();
  }, [initialToken, refreshSession]);

  const value: AuthContextType = {
    user,
    accessToken,
    isAuthenticated: Boolean(accessToken),
    isLoading,
    login,
    logout,
    refreshSession,
    setAuthSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
