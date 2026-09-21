import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, MessageSquare, Trash2, Loader2, User } from "lucide-react";
import { CommunityPostDto, CommunityApiError } from "../types/community-ui.types";
import {
  useLikePostMutation,
  useUnlikePostMutation,
  useRemovePostMutation,
} from "../hooks/use-community";

interface PostCardProps {
  post: CommunityPostDto;
  accessToken?: string;
  onPostRemoved?: (postId: string) => void;
  isDetailView?: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  accessToken,
  onPostRemoved,
  isDetailView = false,
}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const likeMutation = useLikePostMutation(accessToken);
  const unlikeMutation = useUnlikePostMutation(accessToken);
  const removeMutation = useRemovePostMutation(accessToken);

  const isLikePending = likeMutation.isPending || unlikeMutation.isPending;
  const isRemovePending = removeMutation.isPending;

  const handleLikeToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLikePending) return;
    setErrorMessage(null);

    try {
      if (post.likedByCurrentUser) {
        await unlikeMutation.mutateAsync(post.id);
      } else {
        await likeMutation.mutateAsync(post.id);
      }
    } catch (err: unknown) {
      if (err instanceof CommunityApiError) {
        if (err.status === 429) {
          setErrorMessage(`Rate limit: please wait ${err.retryAfter ?? 60}s`);
        } else if (err.status === 503) {
          setErrorMessage("Service temporarily unavailable");
        } else {
          setErrorMessage(err.message || "Failed to update like");
        }
      } else {
        setErrorMessage("Action failed. Please try again.");
      }
    }
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isRemovePending) return;

    if (!window.confirm("Are you sure you want to remove this post?")) {
      return;
    }

    try {
      await removeMutation.mutateAsync(post.id);
      if (onPostRemoved) {
        onPostRemoved(post.id);
      }
    } catch {
      setErrorMessage("Failed to remove post. Please try again.");
    }
  };

  // Safe formatting of creation date
  const formattedDate = new Date(post.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const authorName = post.author?.displayName || "Aura Learner";

  return (
    <article
      className="card community-post-card"
      data-testid={`community-post-card-${post.id}`}
      style={{
        marginBottom: "1rem",
        padding: "1.25rem",
        borderRadius: "var(--radius-md)",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: "var(--bg-surface)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent-primary)",
            }}
          >
            <User size={18} aria-hidden="true" />
          </div>
          <div>
            <span
              style={{
                fontWeight: 600,
                color: "var(--text-primary)",
                fontSize: "0.95rem",
              }}
            >
              {authorName}
            </span>
            <time
              dateTime={post.createdAt}
              style={{
                display: "block",
                fontSize: "0.8rem",
                color: "var(--text-muted)",
              }}
            >
              {formattedDate}
            </time>
          </div>
        </div>

        {/* Owner-only logical removal control */}
        {post.ownedByCurrentUser && (
          <button
            type="button"
            data-testid={`post-remove-btn-${post.id}`}
            aria-label="Remove post"
            className="button button-ghost"
            onClick={handleRemove}
            disabled={isRemovePending}
            style={{
              color: "var(--status-error)",
              padding: "0.4rem 0.6rem",
              fontSize: "0.85rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
            }}
          >
            {isRemovePending ? (
              <Loader2 size={16} className="spin-animation" aria-hidden="true" />
            ) : (
              <Trash2 size={16} aria-hidden="true" />
            )}
            <span>Remove</span>
          </button>
        )}
      </header>

      {/* Safe plain text content rendering — strictly prevents XSS injection */}
      <div
        data-testid={`post-content-${post.id}`}
        style={{
          color: "var(--text-primary)",
          fontSize: "1rem",
          lineHeight: 1.6,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          marginBottom: "1rem",
        }}
      >
        {post.content}
      </div>

      {errorMessage && (
        <div
          role="alert"
          style={{
            fontSize: "0.85rem",
            color: "var(--status-error)",
            marginBottom: "0.5rem",
          }}
        >
          {errorMessage}
        </div>
      )}

      <footer
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid var(--border-subtle)",
          paddingTop: "0.75rem",
          fontSize: "0.875rem",
        }}
      >
        <div style={{ display: "flex", gap: "1.25rem", alignItems: "center" }}>
          {/* Like toggle button */}
          <button
            type="button"
            data-testid={`post-like-btn-${post.id}`}
            aria-label={post.likedByCurrentUser ? "Unlike post" : "Like post"}
            className="button button-ghost"
            onClick={handleLikeToggle}
            disabled={isLikePending}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              color: post.likedByCurrentUser ? "var(--status-error)" : "var(--text-secondary)",
              padding: "0.3rem 0.6rem",
            }}
          >
            {isLikePending ? (
              <Loader2 size={16} className="spin-animation" aria-hidden="true" />
            ) : (
              <Heart
                size={16}
                fill={post.likedByCurrentUser ? "currentColor" : "none"}
                aria-hidden="true"
              />
            )}
            <span data-testid={`post-like-count-${post.id}`}>{post.likeCount}</span>
          </button>

          {/* Comment count link or indicator */}
          {isDetailView ? (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                color: "var(--text-secondary)",
                padding: "0.3rem 0.6rem",
              }}
            >
              <MessageSquare size={16} aria-hidden="true" />
              <span data-testid={`post-comment-count-${post.id}`}>{post.commentCount} comments</span>
            </div>
          ) : (
            <Link
              to={`/community/posts/${post.id}`}
              data-testid={`post-comments-link-${post.id}`}
              aria-label={`View comments for post: ${post.commentCount} comments`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                color: "var(--text-secondary)",
                padding: "0.3rem 0.6rem",
                textDecoration: "none",
              }}
            >
              <MessageSquare size={16} aria-hidden="true" />
              <span data-testid={`post-comment-count-${post.id}`}>{post.commentCount}</span>
            </Link>
          )}
        </div>

        {!isDetailView && (
          <Link
            to={`/community/posts/${post.id}`}
            style={{
              color: "var(--accent-primary)",
              fontSize: "0.85rem",
              fontWeight: 500,
            }}
          >
            View Thread →
          </Link>
        )}
      </footer>
    </article>
  );
};
