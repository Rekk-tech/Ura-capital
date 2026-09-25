import React from "react";
import { useLocation, Link } from "react-router-dom";
import { Lock, LogIn, Home } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface Props {
  children: React.ReactNode;
}

/**
 * FEAT-071: Protected Route Guard (FR-001, FR-007, AC-001, AC-007)
 *
 * Checks authenticated session state. If unauthenticated, displays
 * a deterministic authentication-required state with safe sign-in exit.
 * Never confers authorization privileges or relies on client-side role authority.
 */
export const ProtectedRoute: React.FC<Props> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <main className="auth-guard-container" id="main-content" role="status" aria-label="Loading authentication">
        <div className="auth-card text-center">
          <div className="loading-spinner" aria-hidden="true" />
          <p className="text-muted" style={{ marginTop: "1rem" }}>
            Verifying your session...
          </p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    const returnTo = encodeURIComponent(`${location.pathname}${location.search}${location.hash}`);

    return (
      <main className="auth-guard-container" id="main-content">
        <div className="auth-card text-center">
          <div className="auth-icon-wrap" aria-hidden="true">
            <Lock size={36} className="text-accent" />
          </div>

          <span className="badge badge-warning" style={{ alignSelf: "center", marginBottom: "0.5rem" }}>
            Authentication Required
          </span>

          <h1 className="auth-title">Please Sign In</h1>

          <p className="auth-subtitle">
            You must be signed in to access this section of Aura Capital.
            Please sign in with your credentials or create a new account.
          </p>

          <div className="auth-actions-group">
            <Link to={`/login?returnTo=${returnTo}`} className="btn btn-primary">
              <LogIn size={16} aria-hidden="true" />
              <span>Sign In to Continue</span>
            </Link>
            <Link to="/" className="btn btn-secondary">
              <Home size={16} aria-hidden="true" />
              <span>Return to Home</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
};
