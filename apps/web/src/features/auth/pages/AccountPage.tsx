import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Shield, LogOut, CheckCircle2, BookOpen, TrendingUp, KeyRound, AlertTriangle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ProtectedRoute } from "../components/ProtectedRoute";

/**
 * FEAT-071: Read-Only Account Identity & Session Management (FR-001, FR-007, AC-001, AC-007)
 *
 * Implements:
 * - Server-derived, read-only user identity presentation
 * - Working logout action with in-memory session cleanup
 * - Clear disclosure of server-authoritative permissions (no client role authority)
 * - In-memory token storage confirmation
 */
const AccountView: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate("/", { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const formattedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Active Session";

  return (
    <main className="account-page-container" id="main-content">
      <div className="account-layout">
        {/* Account Header Banner */}
        <section className="account-header-card">
          <div className="account-avatar-wrap" aria-hidden="true">
            <User size={36} className="text-accent" />
          </div>
          <div className="account-header-info">
            <div className="account-title-row">
              <h1 className="account-name">
                {user?.displayName || user?.email?.split("@")[0] || "Trader Account"}
              </h1>
              <span className="badge badge-success">
                <CheckCircle2 size={12} aria-hidden="true" />
                <span>{user?.status || "ACTIVE"}</span>
              </span>
            </div>
            <p className="account-email text-muted">{user?.email}</p>
          </div>
          <div className="account-header-action">
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleLogout}
              disabled={isLoggingOut}
              aria-label="Sign out of your account"
            >
              <LogOut size={16} aria-hidden="true" />
              <span>{isLoggingOut ? "Signing Out..." : "Sign Out"}</span>
            </button>
          </div>
        </section>

        <div className="account-grid">
          {/* Identity & Profile Overview Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-icon-wrap" aria-hidden="true">
                <User size={20} />
              </div>
              <h2 className="card-title">Identity Details</h2>
            </div>
            <div className="account-details-list">
              <div className="detail-item">
                <span className="detail-label">Account ID</span>
                <code className="detail-value font-mono">{user?.id || "N/A"}</code>
              </div>
              <div className="detail-item">
                <span className="detail-label">Email Address</span>
                <span className="detail-value">{user?.email || "N/A"}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Display Name</span>
                <span className="detail-value">{user?.displayName || "Not specified"}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Account Status</span>
                <span className="detail-value text-success font-bold">{user?.status || "ACTIVE"}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Member Since</span>
                <span className="detail-value">{formattedDate}</span>
              </div>
            </div>

            <div className="account-authority-notice" role="note">
              <AlertTriangle size={15} className="text-warning flex-shrink-0" aria-hidden="true" />
              <p>
                <strong>Server Authority Notice:</strong> Account permissions and entitlement tiers are
                evaluated exclusively by server-side verification. Client UI displays do not confer authority.
              </p>
            </div>
          </div>

          {/* Session & Security Architecture Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-icon-wrap" aria-hidden="true">
                <Shield size={20} />
              </div>
              <h2 className="card-title">Session Security</h2>
            </div>
            <div className="account-security-content">
              <div className="security-feature-item">
                <div className="security-feature-icon" aria-hidden="true">
                  <KeyRound size={16} className="text-accent" />
                </div>
                <div>
                  <h3 className="security-feature-title">In-Memory Token Lifecycle</h3>
                  <p className="security-feature-desc">
                    Your access token is held strictly in volatile memory per ADR-004.
                    No tokens, credentials, or sensitive secrets are ever written to browser storage.
                  </p>
                </div>
              </div>

              <div className="security-feature-item">
                <div className="security-feature-icon" aria-hidden="true">
                  <Shield size={16} className="text-success" />
                </div>
                <div>
                  <h3 className="security-feature-title">HTTP-only Refresh Cookies</h3>
                  <p className="security-feature-desc">
                    Session refresh is handled securely via isolated HTTP-only cookies protected
                    against client-side JavaScript inspection and XSS extraction.
                  </p>
                </div>
              </div>
            </div>

            <div className="card-footer-action">
              <span className="badge badge-info">Zero Token Persistence</span>
              <span className="text-muted" style={{ fontSize: "0.85rem" }}>ADR-004 Compliant</span>
            </div>
          </div>
        </div>

        {/* Quick Navigation Shortcuts */}
        <section className="account-shortcuts-section">
          <h2 className="section-title">Continue Platform Activities</h2>
          <div className="account-shortcuts-grid">
            <Link to="/academy" className="shortcut-card">
              <BookOpen size={22} className="text-accent" aria-hidden="true" />
              <div>
                <h3 className="shortcut-title">Academy Courses</h3>
                <p className="shortcut-copy">Resume financial learning lessons and flashcard reviews.</p>
              </div>
            </Link>

            <Link to="/simulation" className="shortcut-card">
              <TrendingUp size={22} className="text-accent" aria-hidden="true" />
              <div>
                <h3 className="shortcut-title">Simulation Desk</h3>
                <p className="shortcut-copy">Execute simulated trades and monitor your paper portfolio.</p>
              </div>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
};

export const AccountPage: React.FC = () => {
  return (
    <ProtectedRoute>
      <AccountView />
    </ProtectedRoute>
  );
};
