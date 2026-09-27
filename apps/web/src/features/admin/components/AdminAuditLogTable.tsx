import React, { useState } from "react";
import {
  RotateCw,
  AlertTriangle,
  FileCheck,
  ShieldAlert,
  Clock,
  User,
  Shield,
} from "lucide-react";
import { useAuth } from "../../auth/context/AuthContext";
import { useAdminAuditRecords } from "../hooks/use-admin";

export const AdminAuditLogTable: React.FC = () => {
  const { accessToken } = useAuth();
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("ALL");
  const [actorFilter, setActorFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  const {
    data: auditResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useAdminAuditRecords(
    {
      eventType: eventTypeFilter !== "ALL" ? eventTypeFilter : undefined,
      actorId: actorFilter.trim() || undefined,
      page,
      limit: 25,
    },
    accessToken,
  );

  return (
    <div className="admin-panel" data-testid="admin-audit-log-panel">
      {/* Server Authority Mandatory Notice */}
      <div
        className="admin-authority-notice"
        data-testid="server-authority-notice"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "0.85rem 1.25rem",
          backgroundColor: "rgba(6, 182, 212, 0.08)",
          border: "1px solid rgba(6, 182, 212, 0.25)",
          borderRadius: "var(--radius-md)",
          marginBottom: "1.5rem",
          fontSize: "0.9rem",
          color: "var(--text-primary)",
        }}
      >
        <Shield size={18} style={{ color: "var(--accent-cyan, #06b6d4)", flexShrink: 0 }} aria-hidden="true" />
        <span>
          <strong>Server Authority Notice:</strong> All administrative actions and role evaluations are strictly server-authoritative and immutably audited.
        </span>
      </div>

      {/* Controls Bar */}
      <div
        className="admin-controls-bar"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
          <select
            className="form-select"
            aria-label="Filter audit log by event type"
            value={eventTypeFilter}
            onChange={(e) => {
              setEventTypeFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">All Event Types</option>
            <option value="USER_AUTHENTICATION">User Authentication</option>
            <option value="USER_STATUS_CHANGE">User Status Change</option>
            <option value="CONTENT_FLAGGED">Content Flagged</option>
            <option value="CONTENT_MODERATED">Content Moderated</option>
            <option value="ADMIN_ACCESS_VERIFIED">Admin Access Verified</option>
            <option value="SECURITY_GUARD_TRIGGERED">Security Guard Triggered</option>
          </select>

          <input
            type="text"
            className="form-input"
            aria-label="Filter by actor ID"
            placeholder="Filter by actor ID..."
            value={actorFilter}
            onChange={(e) => {
              setActorFilter(e.target.value);
              setPage(1);
            }}
            style={{ width: "200px" }}
          />
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => refetch()}
          aria-label="Refresh audit logs"
        >
          <RotateCw size={14} aria-hidden="true" />
          <span>Refresh</span>
        </button>
      </div>

      {/* 5 Async States */}

      {/* 1. Loading State */}
      {isLoading && (
        <div
          role="status"
          aria-label="Loading audit trail"
          aria-busy="true"
          data-testid="admin-audit-loading"
          style={{ padding: "2rem", textAlign: "center" }}
        >
          <div className="loading-spinner" aria-hidden="true" style={{ margin: "0 auto 1rem" }} />
          <p className="text-muted">Loading immutable security audit records...</p>
        </div>
      )}

      {/* 2. Error State */}
      {!isLoading && isError && (
        <div
          className="card text-center"
          role="alert"
          data-testid="admin-audit-error"
          style={{ padding: "2rem", borderColor: "rgba(239, 68, 68, 0.3)" }}
        >
          <AlertTriangle size={36} style={{ color: "#ef4444", margin: "0 auto 0.75rem" }} aria-hidden="true" />
          <h2 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Unable to load audit records</h2>
          <p className="text-muted" style={{ marginBottom: "1.25rem" }}>
            {error instanceof Error ? error.message : "Failed to fetch audit log."}
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => refetch()}
            style={{ margin: "0 auto" }}
          >
            <RotateCw size={14} aria-hidden="true" />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* 3. Empty State */}
      {!isLoading && !isError && (!auditResponse?.data || auditResponse.data.length === 0) && (
        <div
          className="card text-center"
          data-testid="admin-audit-empty"
          style={{ padding: "3rem 1.5rem" }}
        >
          <Clock size={40} style={{ color: "var(--text-muted)", margin: "0 auto 1rem" }} aria-hidden="true" />
          <h2 style={{ fontSize: "1.15rem", marginBottom: "0.5rem" }}>No audit records found</h2>
          <p className="text-muted" style={{ maxWidth: "400px", margin: "0 auto" }}>
            No administrative or security events recorded matching your query.
          </p>
        </div>
      )}

      {/* 4 & 5. Success / Table State */}
      {!isLoading && !isError && auditResponse?.data && auditResponse.data.length > 0 && (
        <div className="table-responsive-container" style={{ overflowX: "auto" }}>
          <table
            className="data-table"
            style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}
            aria-label="Security and administrative audit trail"
          >
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <th style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>Timestamp</th>
                <th style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>Event Type</th>
                <th style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>Actor</th>
                <th style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>Target</th>
                <th style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {auditResponse.data.map((record) => {
                const isSuccess = record.status === "SUCCESS";
                const isDenied = record.status === "DENIED";

                return (
                  <tr
                    key={record.id}
                    style={{ borderBottom: "1px solid var(--border-subtle)" }}
                    data-testid={`audit-row-${record.id}`}
                  >
                    <td
                      style={{
                        padding: "0.85rem 1rem",
                        fontSize: "0.85rem",
                        color: "var(--text-secondary)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {new Date(record.timestamp).toLocaleString()}
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: "rgba(59, 130, 246, 0.12)",
                          color: "#3b82f6",
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.75rem",
                        }}
                      >
                        {record.eventType}
                      </span>
                    </td>
                    <td style={{ padding: "0.85rem 1rem", fontSize: "0.85rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <User size={13} aria-hidden="true" className="text-muted" />
                        <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                          {record.actorEmail || record.actorId}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "0.85rem 1rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                      {record.targetEntity} {record.targetId ? `(${record.targetId})` : ""}
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <span
                        className="badge"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          backgroundColor: isSuccess
                            ? "rgba(16, 185, 129, 0.12)"
                            : isDenied
                            ? "rgba(239, 68, 68, 0.12)"
                            : "rgba(245, 158, 11, 0.12)",
                          color: isSuccess ? "#10b981" : isDenied ? "#ef4444" : "#f59e0b",
                          fontSize: "0.75rem",
                        }}
                      >
                        {isSuccess ? (
                          <FileCheck size={12} aria-hidden="true" />
                        ) : (
                          <ShieldAlert size={12} aria-hidden="true" />
                        )}
                        <span>{record.status}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {auditResponse.totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "1rem 0",
              }}
            >
              <span className="text-muted text-sm">
                Showing Page {auditResponse.page} of {auditResponse.totalPages} ({auditResponse.total} records)
              </span>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label="Previous page"
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={page >= auditResponse.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  aria-label="Next page"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
