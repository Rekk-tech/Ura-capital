import React from "react";
import { Loader2 } from "lucide-react";
import { CommunityCommentDto } from "../types/community-ui.types";
import { CommentCard } from "./CommentCard";

interface CommentListProps {
  comments: CommunityCommentDto[];
  postId: string;
  accessToken?: string;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  onCommentRemoved?: (commentId: string) => void;
}

export const CommentList: React.FC<CommentListProps> = ({
  comments,
  postId,
  accessToken,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  onCommentRemoved,
}) => {
  if (comments.length === 0) {
    return (
      <div
        data-testid="community-comments-empty"
        style={{
          padding: "1.5rem",
          textAlign: "center",
          color: "var(--text-muted)",
          backgroundColor: "var(--bg-surface)",
          borderRadius: "var(--radius-sm)",
          fontSize: "0.9rem",
        }}
      >
        No comments yet. Be the first to share your thoughts!
      </div>
    );
  }

  return (
    <div className="community-comments-list" data-testid="community-comments-list">
      {comments.map((comment) => (
        <CommentCard
          key={comment.id}
          comment={comment}
          postId={postId}
          accessToken={accessToken}
          onCommentRemoved={onCommentRemoved}
        />
      ))}

      {/* Explicit Load More button for comments */}
      {hasNextPage && (
        <div style={{ textAlign: "center", marginTop: "1rem" }}>
          <button
            type="button"
            data-testid="comments-load-more-btn"
            className="button button-secondary"
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
            style={{
              padding: "0.4rem 1rem",
              fontSize: "0.85rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 size={14} className="spin-animation" aria-hidden="true" />
                <span>Loading more comments...</span>
              </>
            ) : (
              <span>Load More Comments</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
