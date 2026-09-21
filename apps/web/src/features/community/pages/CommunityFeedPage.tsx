import React from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "../../auth/context/AuthContext";
import { useCommunityFeedQuery } from "../hooks/use-community";
import { PostComposer } from "../components/PostComposer";
import { PostCard } from "../components/PostCard";
import {
  CommunityAuthRequiredCard,
  CommunityLoadingSkeleton,
  CommunityEmptyState,
  CommunityErrorCard,
} from "../components/CommunityStates";

export const CommunityFeedPage: React.FC = () => {
  const { accessToken, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  // Auth boundary: If unauthenticated, no community HTTP requests are dispatched (AC-003)
  const feedQuery = useCommunityFeedQuery(accessToken ?? undefined);

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
        <section className="community-hero" style={{ marginBottom: "1.5rem" }}>
          <h1 className="hero-title" style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>
            Community Discussions
          </h1>
          <p className="hero-subtitle" style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            Exchange financial analysis, learning takeaways, and investment strategies with peers.
          </p>
        </section>
        <CommunityAuthRequiredCard />
      </main>
    );
  }

  const posts = feedQuery.data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <main className="community-page-container">
      <section className="community-hero" style={{ marginBottom: "1.5rem" }}>
        <h1 className="hero-title" style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>
          Community Discussions
        </h1>
        <p className="hero-subtitle" style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
          Exchange financial analysis, learning takeaways, and investment strategies with peers.
        </p>
      </section>

      {/* Post Composer */}
      <PostComposer accessToken={accessToken} />

      {/* Feed content states */}
      {feedQuery.isLoading ? (
        <CommunityLoadingSkeleton />
      ) : feedQuery.isError ? (
        <CommunityErrorCard
          message="Failed to load community feed. Please try again."
          onRetry={() => feedQuery.refetch()}
        />
      ) : posts.length === 0 ? (
        <CommunityEmptyState />
      ) : (
        <section className="community-feed-list" aria-label="Community Posts">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} accessToken={accessToken} />
          ))}

          {/* Explicit Load More pagination */}
          {feedQuery.hasNextPage && (
            <div style={{ textAlign: "center", margin: "1.5rem 0" }}>
              <button
                type="button"
                data-testid="feed-load-more-btn"
                className="button button-secondary"
                onClick={() => feedQuery.fetchNextPage()}
                disabled={feedQuery.isFetchingNextPage}
                style={{
                  padding: "0.6rem 1.5rem",
                  fontSize: "0.95rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                {feedQuery.isFetchingNextPage ? (
                  <>
                    <Loader2 size={16} className="spin-animation" aria-hidden="true" />
                    <span>Loading more posts...</span>
                  </>
                ) : (
                  <span>Load More Posts</span>
                )}
              </button>
            </div>
          )}
        </section>
      )}
    </main>
  );
};
