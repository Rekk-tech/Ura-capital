import React, { useState, useEffect } from "react";
import { Heart, Loader2 } from "lucide-react";
import { useLikePostMutation, useUnlikePostMutation } from "../hooks/use-community";
import { CommunityApiError } from "../types/community-ui.types";

export interface PostLikeButtonProps {
  postId: string;
  likedByCurrentUser: boolean;
  likeCount: number;
  accessToken?: string;
  onLikeChanged?: (liked: boolean, count: number) => void;
}

export const PostLikeButton: React.FC<PostLikeButtonProps> = ({
  postId,
  likedByCurrentUser,
  likeCount,
  accessToken,
  onLikeChanged,
}) => {
  const [isLiked, setIsLiked] = useState(likedByCurrentUser);
  const [count, setCount] = useState(likeCount);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Synchronize state when server DTO props update
  useEffect(() => {
    setIsLiked(likedByCurrentUser);
    setCount(likeCount);
  }, [likedByCurrentUser, likeCount]);

  const likeMutation = useLikePostMutation(accessToken);
  const unlikeMutation = useUnlikePostMutation(accessToken);

  const isPending = likeMutation.isPending || unlikeMutation.isPending;

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Guard unauthenticated interaction safely without crashing
    if (!accessToken) {
      setAuthNotice("Please sign in to like this post");
      setTimeout(() => setAuthNotice(null), 3000);
      return;
    }

    if (isPending) return;

    setErrorMessage(null);
    setAuthNotice(null);

    try {
      if (isLiked) {
        const res = await unlikeMutation.mutateAsync(postId);
        setIsLiked(res.data.likedByCurrentUser);
        setCount(res.data.likeCount);
        if (onLikeChanged) {
          onLikeChanged(res.data.likedByCurrentUser, res.data.likeCount);
        }
      } else {
        const res = await likeMutation.mutateAsync(postId);
        setIsLiked(res.data.likedByCurrentUser);
        setCount(res.data.likeCount);
        if (onLikeChanged) {
          onLikeChanged(res.data.likedByCurrentUser, res.data.likeCount);
        }
      }
    } catch (err: unknown) {
      if (err instanceof CommunityApiError) {
        if (err.status === 429) {
          setErrorMessage(`Rate limit: wait ${err.retryAfter ?? 60}s`);
        } else if (err.status === 503) {
          setErrorMessage("Service temporarily unavailable");
        } else {
          setErrorMessage(err.message || "Failed to update like");
        }
      } else {
        setErrorMessage("Action failed. Try again.");
      }
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  return (
    <div style={{ display: "inline-flex", alignItems: "center", position: "relative" }}>
      <button
        type="button"
        data-testid={`post-like-btn-${postId}`}
        className={`button button-ghost post-like-btn ${isLiked ? "liked" : ""}`}
        onClick={handleToggle}
        disabled={isPending}
        aria-pressed={isLiked}
        aria-label={isLiked ? "Unlike post" : "Like post"}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.35rem",
          color: isLiked ? "var(--color-danger, #ef4444)" : "var(--text-secondary)",
          padding: "0.35rem 0.6rem",
          fontSize: "0.85rem",
          borderRadius: "var(--radius-sm)",
          border: "1px solid transparent",
          transition: "all 0.15s ease",
          cursor: "pointer",
        }}
      >
        {isPending ? (
          <Loader2 size={16} className="spin-animation" aria-hidden="true" />
        ) : (
          <Heart
            size={16}
            fill={isLiked ? "currentColor" : "none"}
            stroke="currentColor"
            aria-hidden="true"
          />
        )}
        <span
          data-testid={`post-like-count-${postId}`}
          style={{ fontWeight: 600 }}
        >
          {count}
        </span>
      </button>

      {/* Unauthenticated notice without crash */}
      {authNotice && (
        <span
          role="status"
          data-testid={`like-auth-notice-${postId}`}
          style={{
            position: "absolute",
            bottom: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "var(--bg-secondary, #1f2937)",
            color: "var(--text-primary, #ffffff)",
            fontSize: "0.75rem",
            padding: "0.25rem 0.5rem",
            borderRadius: "var(--radius-sm, 4px)",
            whiteSpace: "nowrap",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            zIndex: 10,
            marginBottom: "4px",
          }}
        >
          {authNotice}
        </span>
      )}

      {/* Inline error notice */}
      {errorMessage && (
        <span
          role="alert"
          style={{
            position: "absolute",
            bottom: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "var(--color-danger, #ef4444)",
            color: "#ffffff",
            fontSize: "0.75rem",
            padding: "0.25rem 0.5rem",
            borderRadius: "var(--radius-sm, 4px)",
            whiteSpace: "nowrap",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            zIndex: 10,
            marginBottom: "4px",
          }}
        >
          {errorMessage}
        </span>
      )}
    </div>
  );
};
