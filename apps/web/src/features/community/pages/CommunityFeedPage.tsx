import React, { useState } from "react";
import { useLocation } from "react-router-dom";
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
import { SimulationLeaderboard } from "../../simulation/components/SimulationLeaderboard";

export const CommunityFeedPage: React.FC = () => {
  const { accessToken, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [sortBy, setSortBy] = useState<"LATEST" | "POPULAR">("LATEST");
  const location = useLocation();
  const prefillState = location.state as { prefillTitle?: string; prefillContent?: string } | null;

  // Auth boundary: If unauthenticated, no community HTTP requests are dispatched (AC-003)
  const feedQuery = useCommunityFeedQuery(accessToken ?? undefined, 20, sortBy);

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
          <h1 className="hero-title" aria-label="Community Discussions" style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>
            Diễn Đàn Thảo Luận Cộng Đồng
          </h1>
          <p className="hero-subtitle" style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            Trao đổi phân tích tài chính, bài học kinh nghiệm và chiến lược đầu tư cùng cộng đồng học viên Aura Capital.
          </p>
        </section>
        <CommunityAuthRequiredCard />
      </main>
    );
  }

  const posts = feedQuery.data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <main className="community-page-container" data-testid="community-feed-page">
      <section className="community-hero" style={{ marginBottom: "1.5rem" }}>
        <h1 className="hero-title" aria-label="Community Discussions" style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>
          Diễn Đàn Thảo Luận Cộng Đồng
        </h1>
        <p className="hero-subtitle" style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
          Trao đổi phân tích tài chính, bài học kinh nghiệm và chiến lược đầu tư cùng cộng đồng học viên Aura Capital.
        </p>
      </section>

      {/* Community Trader Leaderboard Spotlight */}
      <div style={{ marginBottom: "2rem" }}>
        <SimulationLeaderboard
          title="Bảng Vinh Danh Nhà Đầu Tư Cộng Đồng"
          subtitle="Top các nhà đầu tư giả lập có hiệu suất sinh lời và kỷ luật rủi ro cao nhất được cộng đồng Aura Capital vinh danh."
        />
      </div>

      {/* Post Composer */}
      <PostComposer
        accessToken={accessToken}
        initialTitle={prefillState?.prefillTitle}
        initialContent={prefillState?.prefillContent}
      />

      {/* Sorting Tabs */}
      <div
        className="community-sort-controls"
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1rem",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginRight: "0.25rem" }}>
          Sắp xếp theo (Sort by):
        </span>
        <button
          type="button"
          data-testid="feed-sort-latest-btn"
          className={`button ${sortBy === "LATEST" ? "button-primary" : "button-ghost"}`}
          onClick={() => setSortBy("LATEST")}
          aria-pressed={sortBy === "LATEST"}
          style={{ padding: "0.4rem 0.85rem", fontSize: "0.85rem" }}
        >
          Mới Nhất • Latest
        </button>
        <button
          type="button"
          data-testid="feed-sort-popular-btn"
          className={`button ${sortBy === "POPULAR" ? "button-primary" : "button-ghost"}`}
          onClick={() => setSortBy("POPULAR")}
          aria-pressed={sortBy === "POPULAR"}
          style={{ padding: "0.4rem 0.85rem", fontSize: "0.85rem" }}
        >
          Sôi Nổi • Popular
        </button>
      </div>

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
