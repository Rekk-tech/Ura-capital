import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../../auth/context/AuthContext";
import {
  useCommunityPostQuery,
  useCommunityCommentsQuery,
} from "../hooks/use-community";
import { PostCard } from "../components/PostCard";
import { CommentComposer } from "../components/CommentComposer";
import { CommentList } from "../components/CommentList";
import {
  CommunityAuthRequiredCard,
  CommunityLoadingSkeleton,
  CommunityNotFoundCard,
  CommunityErrorCard,
} from "../components/CommunityStates";
import { CommunityApiError } from "../types/community-ui.types";

export const PostDetailPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { accessToken, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const postQuery = useCommunityPostQuery(postId, accessToken ?? undefined);
  const commentsQuery = useCommunityCommentsQuery(postId, accessToken ?? undefined);

  if (isAuthLoading) {
    return (
      <main className="community-page-container" aria-busy="true">
        <CommunityLoadingSkeleton />
      </main>
    );
  }

  if (!isAuthenticated || !accessToken) {
    return (
      <main className="community-page-container">
        <CommunityAuthRequiredCard />
      </main>
    );
  }

  if (!postId) {
    return (
      <main className="community-page-container">
        <CommunityNotFoundCard message="Invalid post identifier." />
      </main>
    );
  }

  const isNotFound =
    postQuery.error instanceof CommunityApiError && postQuery.error.status === 404;

  if (postQuery.isLoading) {
    return (
      <main className="community-page-container" aria-busy="true">
        <div style={{ marginBottom: "1rem" }}>
          <Link to="/community" className="button button-ghost" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Back to Feed</span>
          </Link>
        </div>
        <CommunityLoadingSkeleton />
      </main>
    );
  }

  if (isNotFound) {
    return (
      <main className="community-page-container">
        <div style={{ marginBottom: "1rem" }}>
          <Link to="/community" className="button button-ghost" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Back to Feed</span>
          </Link>
        </div>
        <CommunityNotFoundCard />
      </main>
    );
  }

  if (postQuery.isError) {
    return (
      <main className="community-page-container">
        <div style={{ marginBottom: "1rem" }}>
          <Link to="/community" className="button button-ghost" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Back to Feed</span>
          </Link>
        </div>
        <CommunityErrorCard
          message="Failed to load post details. Please try again."
          onRetry={() => postQuery.refetch()}
        />
      </main>
    );
  }

  const post = postQuery.data?.data;
  if (!post) {
    return (
      <main className="community-page-container">
        <CommunityNotFoundCard />
      </main>
    );
  }

  const comments = commentsQuery.data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <main className="community-page-container" data-testid="post-detail-page">
      {/* Back to feed navigation */}
      <nav aria-label="Community navigation" style={{ marginBottom: "1.25rem" }}>
        <Link
          to="/community"
          data-testid="back-to-feed-link"
          className="button button-ghost"
          style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0" }}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Back to Feed</span>
        </Link>
      </nav>

      {/* Main Post Card in Detail View */}
      <PostCard
        post={post}
        accessToken={accessToken}
        isDetailView={true}
        onPostRemoved={() => {
          navigate("/community");
        }}
      />

      {/* Comments Section */}
      <section
        className="community-comments-section"
        aria-labelledby="comments-heading"
        style={{ marginTop: "2rem" }}
      >
        <h2
          id="comments-heading"
          style={{
            fontSize: "1.25rem",
            fontWeight: 600,
            marginBottom: "1rem",
            color: "var(--text-primary)",
          }}
        >
          Comments ({post.commentCount})
        </h2>

        {/* Comment Composer */}
        <CommentComposer
          postId={post.id}
          accessToken={accessToken}
          onCommentCreated={() => {
            void commentsQuery.refetch();
          }}
        />

        {/* Flat Comments List */}
        {commentsQuery.isLoading ? (
          <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)" }}>
            Loading comments...
          </div>
        ) : commentsQuery.isError ? (
          <CommunityErrorCard
            message="Failed to load comments."
            onRetry={() => commentsQuery.refetch()}
          />
        ) : (
          <CommentList
            comments={comments}
            postId={post.id}
            accessToken={accessToken}
            hasNextPage={commentsQuery.hasNextPage}
            isFetchingNextPage={commentsQuery.isFetchingNextPage}
            onLoadMore={() => commentsQuery.fetchNextPage()}
          />
        )}
      </section>
    </main>
  );
};
