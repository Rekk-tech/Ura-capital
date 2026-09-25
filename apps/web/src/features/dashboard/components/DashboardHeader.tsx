import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { User, RefreshCw, CheckCircle2, ShieldAlert } from "lucide-react";
import { useAuth } from "../../auth/context/AuthContext";

/**
 * FEAT-072: Dashboard Header & Identity Summary (FR-001, FR-003, AC-001, AC-006)
 *
 * Renders server-derived user identity facts, account status,
 * and a bounded manual refresh trigger with spin feedback.
 */
export const DashboardHeader: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const displayName = user?.displayName || user?.email?.split("@")[0] || "Trader";

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  return (
    <section className="dashboard-header-banner" aria-label="Learner Profile Summary">
      <div className="dashboard-header-content">
        <div className="dashboard-avatar-wrap" aria-hidden="true">
          <User size={32} className="text-accent" />
        </div>
        <div className="dashboard-header-text">
          <div className="dashboard-title-row">
            <h1 className="dashboard-greeting">
              Welcome back, <span className="greeting-name">{displayName}</span>
            </h1>
            <span className="badge badge-success">
              <CheckCircle2 size={12} aria-hidden="true" />
              <span>{user?.status || "ACTIVE"}</span>
            </span>
          </div>
          <p className="dashboard-subtitle text-muted">
            {user?.email} • Institutional learning desk and paper portfolio overview
          </p>
        </div>
      </div>

      <div className="dashboard-header-actions">
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={handleRefreshAll}
          disabled={isRefreshing}
          aria-label="Refresh all dashboard data"
        >
          <RefreshCw size={14} className={isRefreshing ? "spin-animation" : ""} aria-hidden="true" />
          <span>{isRefreshing ? "Refreshing..." : "Refresh Overview"}</span>
        </button>
        <Link to="/account" className="btn btn-secondary btn-sm" aria-label="Go to Account Settings">
          Account Details
        </Link>
      </div>

      {/* Non-Authoritative Server Fact Notice */}
      <div className="dashboard-authority-notice" role="note">
        <ShieldAlert size={14} className="text-info flex-shrink-0" aria-hidden="true" />
        <span>
          <strong>Server Authority Notice:</strong> All XP, simulation balances, community counts, and
          tier entitlements shown on this dashboard are server-authoritative facts. Client displays do not
          confer authority or alter durable state.
        </span>
      </div>
    </section>
  );
};
