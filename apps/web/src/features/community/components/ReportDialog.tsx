import React, { useState } from "react";
import { Flag, X, CheckCircle2 } from "lucide-react";

export interface ReportDialogProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
}

export type ReportReason = "SPAM" | "HARASSMENT" | "MISINFORMATION" | "OFF_TOPIC";

export const ReportDialog: React.FC<ReportDialogProps> = ({ postId, isOpen, onClose }) => {
  const [reason, setReason] = useState<ReportReason>("SPAM");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setNotes("");
      onClose();
    }, 2000);
  };

  return (
    <div
      className="report-dialog-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`report-dialog-title-${postId}`}
      data-testid="report-dialog"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "1rem",
      }}
    >
      <div
        className="card report-dialog-card"
        style={{
          width: "100%",
          maxWidth: "460px",
          backgroundColor: "var(--bg-card, #111827)",
          border: "1px solid var(--border-subtle, #374151)",
          borderRadius: "var(--radius-lg, 8px)",
          padding: "1.5rem",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2
            id={`report-dialog-title-${postId}`}
            style={{ fontSize: "1.15rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <Flag size={18} color="var(--color-danger, #ef4444)" aria-hidden="true" />
            Report Content
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="button button-ghost"
            aria-label="Close report dialog"
            data-testid="report-close-btn"
            style={{ padding: "0.3rem", borderRadius: "var(--radius-sm)" }}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {submitted ? (
          <div
            data-testid="report-success-state"
            style={{ textAlign: "center", padding: "1.5rem 0", color: "var(--color-success, #10b981)" }}
          >
            <CheckCircle2 size={40} style={{ margin: "0 auto 0.75rem" }} aria-hidden="true" />
            <p style={{ fontWeight: 600, fontSize: "1rem" }}>Report Submitted</p>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "0.35rem" }}>
              Thank you for keeping Aura Capital safe. Our moderation team will review this post.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "1rem" }}>
              Please select the primary reason for reporting this post:
            </p>

            <div style={{ marginBottom: "1rem" }}>
              <label
                htmlFor={`report-reason-select-${postId}`}
                style={{ display: "block", fontSize: "0.85rem", fontWeight: 500, marginBottom: "0.35rem" }}
              >
                Reason
              </label>
              <select
                id={`report-reason-select-${postId}`}
                data-testid="report-reason-select"
                value={reason}
                onChange={(e) => setReason(e.target.value as ReportReason)}
                style={{
                  width: "100%",
                  padding: "0.5rem 0.75rem",
                  backgroundColor: "var(--bg-secondary, #1f2937)",
                  color: "var(--text-primary, #ffffff)",
                  border: "1px solid var(--border-subtle, #374151)",
                  borderRadius: "var(--radius-sm, 4px)",
                  fontSize: "0.9rem",
                }}
              >
                <option value="SPAM">Spam or Unsolicited Promotion</option>
                <option value="HARASSMENT">Harassment, Hate Speech, or Abuse</option>
                <option value="MISINFORMATION">Financial Misinformation or Scam</option>
                <option value="OFF_TOPIC">Off-Topic or Irrelevant Discussion</option>
              </select>
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <label
                htmlFor={`report-notes-textarea-${postId}`}
                style={{ display: "block", fontSize: "0.85rem", fontWeight: 500, marginBottom: "0.35rem" }}
              >
                Additional Context (Optional)
              </label>
              <textarea
                id={`report-notes-textarea-${postId}`}
                data-testid="report-notes-textarea"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Provide any details to assist moderators..."
                maxLength={500}
                style={{
                  width: "100%",
                  padding: "0.5rem 0.75rem",
                  backgroundColor: "var(--bg-secondary, #1f2937)",
                  color: "var(--text-primary, #ffffff)",
                  border: "1px solid var(--border-subtle, #374151)",
                  borderRadius: "var(--radius-sm, 4px)",
                  fontSize: "0.875rem",
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={onClose}
                className="button button-ghost"
                style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                data-testid="report-submit-btn"
                className="button button-primary"
                style={{
                  padding: "0.5rem 1.25rem",
                  fontSize: "0.875rem",
                  backgroundColor: "var(--color-danger, #ef4444)",
                  borderColor: "var(--color-danger, #ef4444)",
                }}
              >
                Submit Report
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
