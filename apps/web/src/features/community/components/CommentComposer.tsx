import React, { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { useCreateCommentMutation } from "../hooks/use-community";
import { CommunityApiError } from "../types/community-ui.types";
import {
  CommunityRateLimitedBanner,
  CommunityServiceUnavailableBanner,
} from "./CommunityStates";

interface CommentComposerProps {
  postId: string;
  accessToken?: string;
  onCommentCreated?: () => void;
}

const MAX_COMMENT_LENGTH = 2000;

export const CommentComposer: React.FC<CommentComposerProps> = ({
  postId,
  accessToken,
  onCommentCreated,
}) => {
  const [content, setContent] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const createCommentMutation = useCreateCommentMutation(postId, accessToken);

  const trimmed = content.trim();
  const isTooLong = content.length > MAX_COMMENT_LENGTH;
  const isSubmitting = createCommentMutation.isPending;
  const canSubmit = trimmed.length > 0 && !isTooLong && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (trimmed.length === 0) {
      setValidationError("Comment content cannot be empty.");
      return;
    }

    if (content.length > MAX_COMMENT_LENGTH) {
      setValidationError(`Comment content exceeds maximum length of ${MAX_COMMENT_LENGTH} characters.`);
      return;
    }

    try {
      await createCommentMutation.mutateAsync({ content });
      setContent("");
      setValidationError(null);
      if (onCommentCreated) {
        onCommentCreated();
      }
    } catch (err: unknown) {
      if (err instanceof CommunityApiError) {
        if (err.status === 400) {
          setValidationError(err.message || "Invalid comment content.");
        }
      } else {
        setValidationError("Failed to post comment. Please try again.");
      }
    }
  };

  const error = createCommentMutation.error;
  const isRateLimited = error instanceof CommunityApiError && error.status === 429;
  const isServiceUnavailable = error instanceof CommunityApiError && error.status === 503;
  const retryAfter = isRateLimited ? error.retryAfter : undefined;

  return (
    <div className="card community-comment-composer" style={{ marginTop: "1rem", marginBottom: "1.5rem" }}>
      <form onSubmit={handleSubmit} noValidate>
        <label
          htmlFor={`comment-composer-textarea-${postId}`}
          style={{
            display: "block",
            fontSize: "0.95rem",
            fontWeight: 600,
            marginBottom: "0.5rem",
            color: "var(--text-primary)",
          }}
        >
          Add a Comment
        </label>

        {isRateLimited && <CommunityRateLimitedBanner retryAfter={retryAfter} />}
        {isServiceUnavailable && <CommunityServiceUnavailableBanner />}

        <textarea
          id={`comment-composer-textarea-${postId}`}
          data-testid="comment-composer-textarea"
          className="composer-textarea"
          placeholder="Share your perspective or ask a follow-up question..."
          rows={2}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if (validationError) setValidationError(null);
          }}
          disabled={isSubmitting}
          aria-invalid={Boolean(validationError) || isTooLong}
          aria-describedby={`comment-composer-help-${postId} comment-composer-counter-${postId}`}
          style={{
            width: "100%",
            padding: "0.75rem",
            backgroundColor: "var(--bg-surface)",
            border: `1px solid ${isTooLong || validationError ? "var(--status-error)" : "var(--border-subtle)"}`,
            borderRadius: "var(--radius-sm)",
            color: "var(--text-primary)",
            fontSize: "0.95rem",
            resize: "vertical",
            outline: "none",
            minHeight: "60px",
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "0.5rem",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          <div
            id={`comment-composer-counter-${postId}`}
            style={{ fontSize: "0.85rem", color: isTooLong ? "var(--status-error)" : "var(--text-muted)" }}
          >
            {content.length} / {MAX_COMMENT_LENGTH}
          </div>

          <button
            type="submit"
            data-testid="comment-composer-submit-btn"
            className="button button-primary"
            disabled={!canSubmit}
            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0.8rem" }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="spin-animation" aria-hidden="true" />
                <span>Posting...</span>
              </>
            ) : (
              <>
                <Send size={16} aria-hidden="true" />
                <span>Comment</span>
              </>
            )}
          </button>
        </div>

        {validationError && (
          <div
            id={`comment-composer-help-${postId}`}
            role="alert"
            aria-live="polite"
            style={{
              color: "var(--status-error)",
              fontSize: "0.875rem",
              marginTop: "0.5rem",
            }}
          >
            {validationError}
          </div>
        )}
      </form>
    </div>
  );
};
