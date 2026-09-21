import React, { useState } from "react";
import { Trash2, Loader2, User } from "lucide-react";
import { CommunityCommentDto } from "../types/community-ui.types";
import { useRemoveCommentMutation } from "../hooks/use-community";

interface CommentCardProps {
  comment: CommunityCommentDto;
  postId: string;
  accessToken?: string;
  onCommentRemoved?: (commentId: string) => void;
}

export const CommentCard: React.FC<CommentCardProps> = ({
  comment,
  postId,
  accessToken,
  onCommentRemoved,
}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const removeMutation = useRemoveCommentMutation(postId, accessToken);

  const isRemovePending = removeMutation.isPending;

  const handleRemove = async () => {
    if (isRemovePending) return;
    if (!window.confirm("Are you sure you want to remove this comment?")) {
      return;
    }

    try {
      await removeMutation.mutateAsync(comment.id);
      if (onCommentRemoved) {
        onCommentRemoved(comment.id);
      }
    } catch {
      setErrorMessage("Failed to remove comment. Please try again.");
    }
  };

  const formattedDate = new Date(comment.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const authorName = comment.author?.displayName || "Aura Learner";

  return (
    <div
      className="community-comment-item"
      data-testid={`community-comment-${comment.id}`}
      style={{
        padding: "0.85rem 1rem",
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-sm)",
        marginBottom: "0.75rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.4rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              backgroundColor: "var(--bg-surface)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent-primary)",
            }}
          >
            <User size={14} aria-hidden="true" />
          </div>
          <span
            style={{
              fontWeight: 600,
              fontSize: "0.875rem",
              color: "var(--text-primary)",
            }}
          >
            {authorName}
          </span>
          <time
            dateTime={comment.createdAt}
            style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
            }}
          >
            {formattedDate}
          </time>
        </div>

        {/* Owner-only comment removal control */}
        {comment.ownedByCurrentUser && (
          <button
            type="button"
            data-testid={`comment-remove-btn-${comment.id}`}
            aria-label="Remove comment"
            className="button button-ghost"
            onClick={handleRemove}
            disabled={isRemovePending}
            style={{
              color: "var(--status-error)",
              padding: "0.25rem 0.5rem",
              fontSize: "0.75rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.25rem",
            }}
          >
            {isRemovePending ? (
              <Loader2 size={14} className="spin-animation" aria-hidden="true" />
            ) : (
              <Trash2 size={14} aria-hidden="true" />
            )}
            <span>Remove</span>
          </button>
        )}
      </div>

      {/* Safe plain text content rendering — zero XSS */}
      <div
        data-testid={`comment-content-${comment.id}`}
        style={{
          color: "var(--text-primary)",
          fontSize: "0.925rem",
          lineHeight: 1.5,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {comment.content}
      </div>

      {errorMessage && (
        <div
          role="alert"
          style={{
            fontSize: "0.8rem",
            color: "var(--status-error)",
            marginTop: "0.35rem",
          }}
        >
          {errorMessage}
        </div>
      )}
    </div>
  );
};
