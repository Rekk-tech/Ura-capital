import React, { useState } from "react";
import {
  AlertTriangle,
  RotateCw,
  Check,
  Trash2,
  MessageSquare,
  FileText,
  ShieldCheck,
  Flag,
} from "lucide-react";
import { useAuth } from "../../auth/context/AuthContext";
import {
  useAdminModerationQueue,
  useResolveModerationItem,
} from "../hooks/use-admin";
import {
  ModerationStatus,
  ModerationItemType,
  ModerationResolutionAction,
} from "../types/admin-ui.types";

export const AdminModerationQueue: React.FC = () => {
  const { accessToken } = useAuth();
  const [statusFilter, setStatusFilter] = useState<ModerationStatus | "ALL">("PENDING");
  const [typeFilter, setTypeFilter] = useState<ModerationItemType | "ALL">("ALL");
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const {
    data: modResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useAdminModerationQueue(
    {
      status: statusFilter,
      targetType: typeFilter,
      page: 1,
      limit: 20,
    },
    accessToken,
  );

  const resolveMutation = useResolveModerationItem();

  const handleResolve = async (itemId: string, action: ModerationResolutionAction) => {
    if (!accessToken) return;
    setResolvingId(itemId);
    try {
      await resolveMutation.mutateAsync({
        itemId,
        action,
        accessToken,
      });
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="admin-panel" data-testid="admin-moderation-queue-panel">
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
            aria-label="Filter moderation by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ModerationStatus | "ALL")}
          >
            <option value="PENDING">Pending Review</option>
            <option value="DISMISSED">Dismissed</option>
            <option value="RESOLVED">Resolved / Handled</option>
            <option value="ALL">All Items</option>
          </select>

          <select
            className="form-select"
            aria-label="Filter moderation by item type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as ModerationItemType | "ALL")}
          >
            <option value="ALL">All Content Types</option>
            <option value="POST">Posts Only</option>
            <option value="COMMENT">Comments Only</option>
          </select>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => refetch()}
          aria-label="Refresh moderation queue"
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
          aria-label="Loading moderation queue"
          aria-busy="true"
          data-testid="admin-moderation-loading"
          style={{ padding: "2rem", textAlign: "center" }}
        >
          <div className="loading-spinner" aria-hidden="true" style={{ margin: "0 auto 1rem" }} />
          <p className="text-muted">Loading moderation items...</p>
        </div>
      )}

      {/* 2. Error State */}
      {!isLoading && isError && (
        <div
          className="card text-center"
          role="alert"
          data-testid="admin-moderation-error"
          style={{ padding: "2rem", borderColor: "rgba(239, 68, 68, 0.3)" }}
        >
          <AlertTriangle size={36} style={{ color: "#ef4444", margin: "0 auto 0.75rem" }} aria-hidden="true" />
          <h2 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Unable to load moderation queue</h2>
          <p className="text-muted" style={{ marginBottom: "1.25rem" }}>
            {error instanceof Error ? error.message : "Failed to fetch moderation queue."}
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
      {!isLoading && !isError && (!modResponse?.data || modResponse.data.length === 0) && (
        <div
          className="card text-center"
          data-testid="admin-moderation-empty"
          style={{ padding: "3rem 1.5rem" }}
        >
          <ShieldCheck size={40} style={{ color: "var(--status-success, #10b981)", margin: "0 auto 1rem" }} aria-hidden="true" />
          <h2 style={{ fontSize: "1.15rem", marginBottom: "0.5rem" }}>Moderation queue is clear</h2>
          <p className="text-muted" style={{ maxWidth: "400px", margin: "0 auto" }}>
            {statusFilter === "PENDING"
              ? "No pending community reports require administrative action at this time."
              : "No flagged items match the selected filter criteria."}
          </p>
        </div>
      )}

      {/* 4 & 5. Success State: Moderation Queue Items */}
      {!isLoading && !isError && modResponse?.data && modResponse.data.length > 0 && (
        <div className="moderation-queue-list" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {modResponse.data.map((item) => {
            const isPending = item.status === "PENDING";
            const isProcessing = resolvingId === item.id;

            return (
              <div
                key={item.id}
                className="card moderation-item-card"
                data-testid={`moderation-item-${item.id}`}
                style={{
                  border: "1px solid var(--border-subtle)",
                  padding: "1.25rem",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "1rem",
                    marginBottom: "0.75rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    <span
                      className="badge"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        backgroundColor: "rgba(59, 130, 246, 0.12)",
                        color: "#3b82f6",
                      }}
                    >
                      {item.targetType === "POST" ? (
                        <FileText size={12} aria-hidden="true" />
                      ) : (
                        <MessageSquare size={12} aria-hidden="true" />
                      )}
                      <span>{item.targetType}</span>
                    </span>

                    <span
                      className="badge"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        backgroundColor: "rgba(245, 158, 11, 0.15)",
                        color: "#f59e0b",
                      }}
                    >
                      <Flag size={12} aria-hidden="true" />
                      <span>{item.reason}</span>
                    </span>

                    <span className="badge" style={{ backgroundColor: "rgba(255, 255, 255, 0.05)", color: "var(--text-secondary)" }}>
                      {item.reportCount} {item.reportCount === 1 ? "report" : "reports"}
                    </span>

                    <span className="text-muted text-sm">
                      Reported {new Date(item.reportedAt).toLocaleString()}
                    </span>
                  </div>

                  <span
                    className="badge"
                    style={{
                      backgroundColor:
                        item.status === "PENDING"
                          ? "rgba(245, 158, 11, 0.15)"
                          : item.status === "DISMISSED"
                          ? "rgba(100, 116, 139, 0.15)"
                          : "rgba(16, 185, 129, 0.15)",
                      color:
                        item.status === "PENDING"
                          ? "#f59e0b"
                          : item.status === "DISMISSED"
                          ? "var(--text-muted)"
                          : "#10b981",
                    }}
                  >
                    {item.status}
                  </span>
                </div>

                {/* Author Info */}
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                  Author: <strong style={{ color: "var(--text-primary)" }}>{item.authorName}</strong> (ID: {item.authorId})
                </div>

                {/* Content Snippet */}
                <div
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.25)",
                    borderLeft: "3px solid var(--accent-primary, #3b82f6)",
                    padding: "0.75rem 1rem",
                    borderRadius: "0 var(--radius-sm) var(--radius-sm) 0",
                    marginBottom: "1rem",
                    fontSize: "0.9rem",
                    fontStyle: "italic",
                    color: "var(--text-secondary)",
                  }}
                >
                  &ldquo;{item.snippet}&rdquo;
                </div>

                {/* Actions */}
                {isPending && (
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleResolve(item.id, "DISMISS")}
                      disabled={isProcessing}
                      aria-label={`Dismiss report for ${item.targetType} by ${item.authorName}`}
                      data-testid={`dismiss-report-${item.id}`}
                    >
                      <Check size={14} aria-hidden="true" />
                      <span>Dismiss Report</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.4)" }}
                      onClick={() => handleResolve(item.id, "DELETE")}
                      disabled={isProcessing}
                      aria-label={`Delete content for ${item.targetType} by ${item.authorName}`}
                      data-testid={`delete-content-${item.id}`}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                      <span>{isProcessing ? "Processing..." : "Hide / Delete Content"}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
