import React from "react";
import { Laptop, Smartphone, Globe, Shield, CheckCircle2, Clock } from "lucide-react";
import { UserSession } from "../../../api/profile.api";

export interface ActiveSessionsListProps {
  sessions: UserSession[];
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const ActiveSessionsList: React.FC<ActiveSessionsListProps> = ({
  sessions,
  onRefresh,
  isLoading,
}) => {
  if (sessions.length === 0) {
    return (
      <div className="card active-sessions-card">
        <div className="card-header">
          <div className="card-icon-wrap" aria-hidden="true">
            <Globe size={20} className="text-accent" />
          </div>
          <h2 className="card-title">Active Sessions</h2>
        </div>
        <div className="card-body" style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
          <Shield size={36} className="text-muted" style={{ margin: "0 auto 1rem" }} aria-hidden="true" />
          <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>No Active Remote Sessions</h3>
          <p className="text-muted" style={{ fontSize: "0.9rem", maxWidth: "400px", margin: "0 auto" }}>
            No secondary login sessions detected. Your credentials are only active on this device.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card active-sessions-card">
      <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div className="card-icon-wrap" aria-hidden="true">
            <Globe size={20} className="text-accent" />
          </div>
          <h2 className="card-title">Active Sessions</h2>
        </div>
        {onRefresh && (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onRefresh}
            disabled={isLoading}
            aria-label="Refresh active sessions"
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        )}
      </div>

      <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <p className="text-muted" style={{ fontSize: "0.875rem", margin: 0 }}>
          Devices and web browsers currently holding valid refresh authority for your account per ADR-004.
        </p>

        <div className="sessions-list" role="list" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {sessions.map((sess) => {
            const isMobile = sess.device.toLowerCase().includes("mobile") || sess.device.toLowerCase().includes("phone");
            const formattedActive = sess.lastActive
              ? new Date(sess.lastActive).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })
              : "Just now";

            return (
              <div
                key={sess.id}
                role="listitem"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "1rem 1.25rem",
                  borderRadius: "0.5rem",
                  background: "rgba(255, 255, 255, 0.03)",
                  border: sess.isCurrent
                    ? "1px solid rgba(16, 185, 129, 0.35)"
                    : "1px solid rgba(255, 255, 255, 0.08)",
                  gap: "1rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: sess.isCurrent ? "rgba(16, 185, 129, 0.15)" : "rgba(255, 255, 255, 0.06)",
                      color: sess.isCurrent ? "#10b981" : "#94a3b8",
                      flexShrink: 0,
                    }}
                    aria-hidden="true"
                  >
                    {isMobile ? <Smartphone size={20} /> : <Laptop size={20} />}
                  </div>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontWeight: 600, color: "var(--color-text, #f1f5f9)" }}>
                        {sess.browser} on {sess.device}
                      </span>
                      {sess.isCurrent && (
                        <span
                          className="badge badge-success"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            fontSize: "0.75rem",
                            padding: "0.2rem 0.5rem",
                          }}
                        >
                          <CheckCircle2 size={11} aria-hidden="true" />
                          <span>This Device</span>
                        </span>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.8rem", color: "#94a3b8", marginTop: "0.25rem" }}>
                      {sess.ipAddress && <span>IP: {sess.ipAddress}</span>}
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                        <Clock size={12} aria-hidden="true" />
                        <span>Active: {formattedActive}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="badge badge-info" style={{ fontSize: "0.75rem" }}>
                    Active
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            padding: "0.75rem 1rem",
            background: "rgba(14, 165, 233, 0.08)",
            border: "1px solid rgba(14, 165, 233, 0.2)",
            borderRadius: "0.5rem",
            fontSize: "0.8rem",
            color: "#38bdf8",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Shield size={16} className="flex-shrink-0" aria-hidden="true" />
          <span>
            <strong>ADR-004 Enforcement:</strong> All tokens are in-memory only. Signing out will immediately invalidate this device session.
          </span>
        </div>
      </div>
    </div>
  );
};
