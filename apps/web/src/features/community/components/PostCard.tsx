import React, { useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, Trash2, Loader2, User, Flag } from "lucide-react";
import { CommunityPostDto } from "../types/community-ui.types";
import { useRemovePostMutation } from "../hooks/use-community";
import { PostLikeButton } from "./PostLikeButton";
import { ReportDialog } from "./ReportDialog";

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
  const [isReportOpen, setIsReportOpen] = useState(false);

  const removeMutation = useRemovePostMutation(accessToken);
  const isRemovePending = removeMutation.isPending;

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

  // Check for formatted title line (e.g. "# My Title\n\nContent")
  const hasMarkdownTitle = post.content.startsWith("# ");
  const lines = post.content.split("\n");
  const extractedTitle = hasMarkdownTitle && lines[0] ? lines[0].replace(/^#\s*/, "").trim() : null;
  const displayedContent = hasMarkdownTitle ? lines.slice(1).join("\n").trim() : post.content;

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

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {/* Content moderation reporting flag */}
          <button
            type="button"
            data-testid={`post-report-btn-${post.id}`}
            aria-label="Report post"
            className="button button-ghost"
            onClick={() => setIsReportOpen(true)}
            style={{
              color: "var(--text-muted)",
              padding: "0.35rem 0.5rem",
              fontSize: "0.85rem",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            <Flag size={14} aria-hidden="true" />
          </button>

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
        </div>
      </header>

      {/* Prominently render extracted title if present */}
      {extractedTitle && (
        <h2
          data-testid={`post-title-${post.id}`}
          style={{
            fontSize: "1.15rem",
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: "0.5rem",
          }}
        >
          {extractedTitle}
        </h2>
      )}

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
        {displayedContent}
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
          {/* Integrated PostLikeButton */}
          <PostLikeButton
            postId={post.id}
            likedByCurrentUser={post.likedByCurrentUser}
            likeCount={post.likeCount}
            accessToken={accessToken}
          />

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

      {/* Moderation reporting modal dialog */}
      <ReportDialog
        postId={post.id}
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />
    </article>
  );
};
