import React, { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { useCreatePostMutation } from "../hooks/use-community";
import { CommunityApiError } from "../types/community-ui.types";
import {
  CommunityRateLimitedBanner,
  CommunityServiceUnavailableBanner,
} from "./CommunityStates";

interface PostComposerProps {
  accessToken?: string;
  onPostCreated?: () => void;
}

const MAX_POST_LENGTH = 5000;

export const PostComposer: React.FC<PostComposerProps> = ({ accessToken, onPostCreated }) => {
  const [content, setContent] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const createPostMutation = useCreatePostMutation(accessToken);

  const trimmed = content.trim();
  const isTooLong = content.length > MAX_POST_LENGTH;
  const isSubmitting = createPostMutation.isPending;
  const canSubmit = trimmed.length > 0 && !isTooLong && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (trimmed.length === 0) {
      setValidationError("Post content cannot be empty.");
      return;
    }

    if (content.length > MAX_POST_LENGTH) {
      setValidationError(`Post content exceeds maximum length of ${MAX_POST_LENGTH} characters.`);
      return;
    }

    try {
      await createPostMutation.mutateAsync({ content });
      setContent("");
      setValidationError(null);
      if (onPostCreated) {
        onPostCreated();
      }
    } catch (err: unknown) {
      if (err instanceof CommunityApiError) {
        if (err.status === 400) {
          setValidationError(err.message || "Invalid post content.");
        }
      } else {
        setValidationError("Failed to create post. Please try again.");
      }
    }
  };

  const error = createPostMutation.error;
  const isRateLimited = error instanceof CommunityApiError && error.status === 429;
  const isServiceUnavailable = error instanceof CommunityApiError && error.status === 503;
  const retryAfter = isRateLimited ? error.retryAfter : undefined;

  return (
    <div className="card community-composer-card" style={{ marginBottom: "1.5rem" }}>
      <form onSubmit={handleSubmit} noValidate>
        <label
          htmlFor="post-composer-textarea"
          className="composer-label"
          style={{
            display: "block",
            fontSize: "1rem",
            fontWeight: 600,
            marginBottom: "0.5rem",
            color: "var(--text-primary)",
          }}
        >
          Create a Community Post
        </label>

        {isRateLimited && <CommunityRateLimitedBanner retryAfter={retryAfter} />}
        {isServiceUnavailable && <CommunityServiceUnavailableBanner />}

        <textarea
          id="post-composer-textarea"
          data-testid="post-composer-textarea"
          className="composer-textarea"
          placeholder="Share your financial questions, learning takeaways, or market analysis..."
          rows={3}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if (validationError) setValidationError(null);
          }}
          disabled={isSubmitting}
          aria-invalid={Boolean(validationError) || isTooLong}
          aria-describedby="post-composer-help post-composer-counter"
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
            minHeight: "80px",
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
          <div id="post-composer-counter" style={{ fontSize: "0.85rem", color: isTooLong ? "var(--status-error)" : "var(--text-muted)" }}>
            {content.length} / {MAX_POST_LENGTH}
          </div>

          <button
            type="submit"
            data-testid="post-composer-submit-btn"
            className="button button-primary"
            disabled={!canSubmit}
            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="spin-animation" aria-hidden="true" />
                <span>Posting...</span>
              </>
            ) : (
              <>
                <Send size={16} aria-hidden="true" />
                <span>Post</span>
              </>
            )}
          </button>
        </div>

        {validationError && (
          <div
            id="post-composer-help"
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
