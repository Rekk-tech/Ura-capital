import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  MessageSquare,
  Trash2,
  Loader2,
  Flag,
  Share2,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
} from "lucide-react";
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
  const [copied, setCopied] = useState(false);

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

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/community/posts/${post.id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Safe formatting of creation date
  const formattedDate = new Date(post.createdAt).toLocaleDateString("vi-VN", {
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
  const extractedTitle =
    hasMarkdownTitle && lines[0] ? lines[0].replace(/^#\s*/, "").trim() : null;
  const displayedContent = hasMarkdownTitle
    ? lines.slice(1).join("\n").trim()
    : post.content;

  // Extract author initials for avatar
  const initials = authorName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Avatar background colors based on author
  const getAvatarBg = (name: string) => {
    if (name.includes("Yến") || name.includes("2")) return "#059669";
    if (name.includes("Admin")) return "#1D6FF2";
    if (name.includes("Dev") || name.includes("1")) return "#4F46E5";
    return "#334155";
  };

  // Role badges matching financial hub mockup
  const getAuthorBadge = (name: string) => {
    if (name.includes("Yến") || name.includes("User 2")) {
      return {
        text: "Nhà Đầu Tư Giá Trị",
        style: { background: "#F0FDFA", color: "#0F766E", borderColor: "#99F6E4" },
      };
    }
    if (name.includes("User 1") || name.includes("Top 1")) {
      return {
        text: "🏆 Top 1 Đấu Lập Tuần #2",
        style: { background: "#FEF3C7", color: "#92400E", borderColor: "#FDE68A" },
      };
    }
    if (name.includes("Admin")) {
      return {
        text: "Hệ Thống",
        style: { background: "#EFF6FF", color: "#1D4ED8", borderColor: "#BFDBFE" },
      };
    }
    return null;
  };

  const roleBadge = getAuthorBadge(authorName);

  // Auto-detect tickers like $FPT, $MWG, $HPG to display financial tag pills
  const knownTickers: Record<string, { change: string; isUp: boolean }> = {
    $FPT: { change: "+2.4%", isUp: true },
    $MWG: { change: "+1.1%", isUp: true },
    $HPG: { change: "-0.6%", isUp: false },
    $TCB: { change: "+1.6%", isUp: true },
    $VNM: { change: "+0.8%", isUp: true },
    $SSI: { change: "-1.2%", isUp: false },
  };

  const detectedTickers = Object.entries(knownTickers).filter(([symbol]) =>
    post.content.includes(symbol)
  );

  return (
    <article
      className="card community-post-card"
      data-testid={`community-post-card-${post.id}`}
    >
      <header className="post-header-row">
        {/* Author Avatar & Info */}
        <div className="post-author-info">
          <div
            className="author-circle-avatar"
            style={{ background: getAvatarBg(authorName) }}
          >
            {initials || "AU"}
          </div>

          <div>
            <div className="author-name-row">
              <span className="post-author-name">{authorName}</span>
              {roleBadge && (
                <span
                  className="author-role-badge"
                  style={roleBadge.style}
                >
                  {roleBadge.text}
                </span>
              )}
            </div>

            <time
              dateTime={post.createdAt}
              className="post-timestamp-sub"
              style={{ display: "block" }}
            >
              {formattedDate} • Luận điểm Vĩ mô
            </time>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          {/* Moderation Report Button */}
          <button
            type="button"
            data-testid={`post-report-btn-${post.id}`}
            aria-label="Report post"
            className="button button-ghost"
            style={{ padding: "0.35rem", color: "#94A3B8" }}
            onClick={() => setIsReportOpen(true)}
            title="Báo cáo vi phạm"
          >
            <Flag size={14} aria-hidden="true" />
          </button>

          {/* Owner Remove Button */}
          {post.ownedByCurrentUser && (
            <button
              type="button"
              data-testid={`post-remove-btn-${post.id}`}
              aria-label="Remove post"
              className="button button-ghost"
              style={{
                color: "#E11D48",
                padding: "0.35rem 0.6rem",
                fontSize: "0.75rem",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.3rem",
              }}
              onClick={handleRemove}
              disabled={isRemovePending}
              title="Xóa bài viết"
            >
              {isRemovePending ? (
                <Loader2 size={13} className="animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 size={13} aria-hidden="true" />
              )}
              <span>Remove</span>
            </button>
          )}

          <button
            type="button"
            className="button button-ghost"
            style={{ padding: "0.35rem", color: "#94A3B8" }}
            aria-label="Tùy chọn khác"
          >
            <MoreHorizontal size={15} />
          </button>
        </div>
      </header>

      {/* Extracted Title */}
      {extractedTitle && (
        <h2
          data-testid={`post-title-${post.id}`}
          className="post-title-text"
        >
          {extractedTitle}
        </h2>
      )}

      {/* Safe Plain Text Content */}
      <div
        data-testid={`post-content-${post.id}`}
        className="post-body-content"
      >
        {displayedContent}
      </div>

      {/* Detected Ticker Pills */}
      {detectedTickers.length > 0 && (
        <div className="post-tickers-row">
          {detectedTickers.map(([symbol, info]) => (
            <span
              key={symbol}
              className={`ticker-tag-pill ${info.isUp ? "ticker-tag-up" : "ticker-tag-down"}`}
            >
              <span>{symbol}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.15rem", fontSize: "0.7rem" }}>
                {info.isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {info.change}
              </span>
            </span>
          ))}
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          style={{
            fontSize: "0.75rem",
            color: "#E11D48",
            background: "#FEF2F2",
            padding: "0.5rem",
            borderRadius: "8px",
            marginBottom: "0.75rem",
          }}
        >
          {errorMessage}
        </div>
      )}

      {/* Card Footer with Interactions */}
      <footer className="post-interaction-footer">
        <div className="interaction-actions-group">
          {/* Integrated PostLikeButton */}
          <PostLikeButton
            postId={post.id}
            likedByCurrentUser={post.likedByCurrentUser}
            likeCount={post.likeCount}
            accessToken={accessToken}
          />

          {/* Comment Count */}
          {isDetailView ? (
            <div className="btn-interaction">
              <MessageSquare size={15} aria-hidden="true" />
              <span data-testid={`post-comment-count-${post.id}`}>
                {post.commentCount}
              </span>
              <span>bình luận</span>
            </div>
          ) : (
            <Link
              to={`/community/posts/${post.id}`}
              data-testid={`post-comments-link-${post.id}`}
              aria-label={`View comments for post: ${post.commentCount} comments`}
              className="btn-interaction"
            >
              <MessageSquare size={15} aria-hidden="true" />
              <span data-testid={`post-comment-count-${post.id}`}>
                {post.commentCount}
              </span>
              <span>bình luận</span>
            </Link>
          )}

          {/* Share Button */}
          <button
            type="button"
            onClick={handleShare}
            className="btn-interaction"
          >
            <Share2 size={14} />
            <span>{copied ? "Đã chép" : "Chia sẻ"}</span>
          </button>
        </div>

        {!isDetailView && (
          <Link
            to={`/community/posts/${post.id}`}
            className="btn-view-details-link"
          >
            <span>Chi Tiết</span>
            <ArrowRight size={13} />
          </Link>
        )}
      </footer>

      {/* Moderation Reporting Modal Dialog */}
      <ReportDialog
        postId={post.id}
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />
    </article>
  );
};
