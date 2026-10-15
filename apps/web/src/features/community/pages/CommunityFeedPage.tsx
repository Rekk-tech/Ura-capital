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

      {/* 2-Column Responsive Layout: 70% Main Feed & 30% Top 5 Leaderboard Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Feed Column (70% / 8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
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
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginRight: "0.25rem" }}>
              Sắp xếp theo:
            </span>
            <button
              type="button"
              data-testid="feed-sort-latest-btn"
              className={`button ${sortBy === "LATEST" ? "button-primary" : "button-ghost"}`}
              onClick={() => setSortBy("LATEST")}
              aria-pressed={sortBy === "LATEST"}
              style={{ padding: "0.4rem 0.85rem", fontSize: "0.85rem" }}
            >
              Mới Nhất <span className="sr-only">• Latest</span>
            </button>
            <button
              type="button"
              data-testid="feed-sort-popular-btn"
              className={`button ${sortBy === "POPULAR" ? "button-primary" : "button-ghost"}`}
              onClick={() => setSortBy("POPULAR")}
              aria-pressed={sortBy === "POPULAR"}
              style={{ padding: "0.4rem 0.85rem", fontSize: "0.85rem" }}
            >
              Sôi Nổi <span className="sr-only">• Popular</span>
            </button>
          </div>

          {/* Feed content states */}
          {feedQuery.isLoading ? (
            <CommunityLoadingSkeleton />
          ) : feedQuery.isError ? (
            <CommunityErrorCard
              message="Không thể tải luồng thảo luận. Vui lòng thử lại."
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
                        <span>Đang tải thêm bài viết...</span>
                      </>
                    ) : (
                      <span>Tải thêm bài viết</span>
                    )}
                  </button>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Sidebar Column (30% / 4 cols) - Compact Top 5 Leaderboard */}
        <aside className="lg:col-span-4 flex flex-col gap-6">
          <SimulationLeaderboard
            variant="sidebar"
            limit={5}
            title="Top 5 Nhà Đầu Tư"
            subtitle="Hiệu suất sinh lời cao nhất"
          />
        </aside>
      </div>
    </main>
  );
};
