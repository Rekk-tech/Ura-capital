import React, { useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  Loader2,
  Search,
  PenSquare,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
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
import {
  CommunityStreamNav,
  StreamCategoryId,
} from "../components/CommunityStreamNav";
import { MarketTickerWidget } from "../components/MarketTickerWidget";
import { VoiceRoomWidget } from "../components/VoiceRoomWidget";
import { CrediFinAdvisorCard } from "../components/CrediFinAdvisorCard";
import { TrendingTickersWidget } from "../components/TrendingTickersWidget";
import { ProVipWorkshopCard } from "../components/ProVipWorkshopCard";
import { VerifiedReportPostCard } from "../components/VerifiedReportPostCard";

export const CommunityFeedPage: React.FC = () => {
  const { accessToken, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [sortBy, setSortBy] = useState<"LATEST" | "POPULAR" | "PINNED">("LATEST");
  const [activeStream, setActiveStream] = useState<StreamCategoryId>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const prefillState = location.state as {
    prefillTitle?: string;
    prefillContent?: string;
  } | null;

  const composerRef = useRef<HTMLDivElement | null>(null);

  // Auth boundary: If unauthenticated, no community HTTP requests are dispatched (AC-003)
  const feedQuery = useCommunityFeedQuery(
    accessToken ?? undefined,
    20,
    sortBy === "PINNED" ? "LATEST" : sortBy
  );

  const scrollToComposer = () => {
    if (composerRef.current) {
      composerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      const textarea = composerRef.current.querySelector("textarea");
      if (textarea) textarea.focus();
    }
  };

  if (isAuthLoading) {
    return (
      <main className="community-page-container" aria-busy="true">
        <div className="community-forum-wrapper">
          <CommunityLoadingSkeleton />
        </div>
      </main>
    );
  }

  if (!isAuthenticated || !accessToken) {
    return (
      <main className="community-page-container">
        <div className="community-forum-wrapper">
          <section className="community-hero-header">
            <div>
              <div className="community-hero-title-row">
                <h1 className="community-main-title" aria-label="Community Discussions">
                  Diễn Đàn Thảo Luận Cộng Đồng
                </h1>
                <span className="community-online-pill">
                  <span className="community-online-dot" />
                  1.480 Online
                </span>
              </div>
              <p className="community-main-subtitle">
                Trao đổi phân tích tài chính, nhật ký giao dịch thực chiến và bài học kinh nghiệm chu kỳ cùng các học viên & chuyên gia Aura Capital.
              </p>
            </div>
          </section>
          <CommunityAuthRequiredCard />
        </div>
      </main>
    );
  }

  const posts = feedQuery.data?.pages.flatMap((page) => page.data) ?? [];

  // Filter posts if search query is entered
  const filteredPosts = searchQuery.trim()
    ? posts.filter(
        (p) =>
          p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.author.displayName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : posts;

  return (
    <main
      className="community-page-container"
      data-testid="community-feed-page"
    >
      <div className="community-forum-wrapper">
        {/* Top Community Subheader Row */}
        <section className="community-hero-header">
          <div>
            <div className="community-hero-title-row">
              <h1
                className="community-main-title"
                aria-label="Community Discussions"
              >
                Diễn Đàn Thảo Luận Cộng Đồng
              </h1>
              <span className="community-online-pill">
                <span className="community-online-dot" />
                1.480 Online
              </span>
            </div>
            <p className="community-main-subtitle">
              Trao đổi phân tích tài chính, nhật ký giao dịch thực chiến và bài học kinh nghiệm chu kỳ cùng các học viên & chuyên gia Aura Capital.
            </p>
          </div>

          {/* Search Box on Header Right */}
          <div className="community-search-box">
            <Search
              size={16}
              className="community-search-icon"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm luận điểm, $Mã CP..."
              className="community-search-input"
            />
          </div>
        </section>

        {/* 3-Column Financial Forum Layout */}
        <div className="community-forum-grid">
          {/* ======================================================== */}
          {/* Left Column (Width: 270px) */}
          {/* ======================================================== */}
          <aside className="community-col-left">
            {/* Primary Action: Tạo Bài Viết Mới */}
            <button
              type="button"
              onClick={scrollToComposer}
              className="btn-create-post-gradient"
            >
              <PenSquare size={17} />
              <span>Tạo Bài Viết Mới</span>
            </button>

            {/* Navigation Streams */}
            <CommunityStreamNav
              activeStream={activeStream}
              onSelectStream={(id) => setActiveStream(id)}
            />

            {/* Live Market Mini-Widget */}
            <MarketTickerWidget />

            {/* Live Audio Room */}
            <VoiceRoomWidget />
          </aside>

          {/* ======================================================== */}
          {/* Center Column (Main Feed) */}
          {/* ======================================================== */}
          <section className="community-col-center">
            {/* Post Composer Card */}
            <div ref={composerRef}>
              <PostComposer
                accessToken={accessToken}
                initialTitle={prefillState?.prefillTitle}
                initialContent={prefillState?.prefillContent}
              />
            </div>

            {/* Filter & Sort Controls Row */}
            <div className="community-sort-filter-bar">
              <div className="sort-pill-group">
                <span style={{ fontSize: "0.75rem", color: "#94A3B8", marginRight: "0.25rem", fontWeight: 600 }}>
                  Sắp xếp:
                </span>
                <button
                  type="button"
                  data-testid="feed-sort-latest-btn"
                  className={`sort-pill-btn ${sortBy === "LATEST" ? "active" : ""}`}
                  onClick={() => setSortBy("LATEST")}
                  aria-pressed={sortBy === "LATEST"}
                >
                  Mới Nhất <span className="sr-only">• Latest</span>
                </button>
                <button
                  type="button"
                  data-testid="feed-sort-popular-btn"
                  className={`sort-pill-btn ${sortBy === "POPULAR" ? "active" : ""}`}
                  onClick={() => setSortBy("POPULAR")}
                  aria-pressed={sortBy === "POPULAR"}
                >
                  Sôi Nổi <span className="sr-only">• Popular</span>
                </button>
                <button
                  type="button"
                  className={`sort-pill-btn ${sortBy === "PINNED" ? "active" : ""}`}
                  onClick={() => setSortBy("PINNED")}
                  aria-pressed={sortBy === "PINNED"}
                >
                  Được Ghim
                </button>
              </div>

              {/* Topic Dropdown */}
              <div className="topic-filter-dropdown">
                <span>Chủ đề: Tất cả</span>
                <ChevronDown size={14} />
              </div>
            </div>

            {/* Prominently Featured Verified Pro Room Report Post */}
            <VerifiedReportPostCard />

            {/* Feed Content States */}
            {feedQuery.isLoading ? (
              <CommunityLoadingSkeleton />
            ) : feedQuery.isError ? (
              <CommunityErrorCard
                message="Không thể tải luồng thảo luận. Vui lòng thử lại."
                onRetry={() => feedQuery.refetch()}
              />
            ) : filteredPosts.length === 0 ? (
              <CommunityEmptyState />
            ) : (
              <div className="community-feed-list" style={{ display: "flex", flexDirection: "column", gap: "1rem" }} aria-label="Community Posts">
                {filteredPosts.map((post) => (
                  <PostCard key={post.id} post={post} accessToken={accessToken} />
                ))}

                {/* Explicit Load More pagination */}
                {feedQuery.hasNextPage && (
                  <div style={{ textAlign: "center", margin: "1.5rem 0" }}>
                    <button
                      type="button"
                      data-testid="feed-load-more-btn"
                      className="button button-secondary"
                      style={{
                        padding: "0.65rem 1.75rem",
                        borderRadius: "12px",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        background: "#FFFFFF",
                        border: "1px solid #E2E8F0",
                        color: "#334155",
                        cursor: "pointer",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                      }}
                      onClick={() => feedQuery.fetchNextPage()}
                      disabled={feedQuery.isFetchingNextPage}
                    >
                      {feedQuery.isFetchingNextPage ? (
                        <>
                          <Loader2 size={15} className="animate-spin text-blue-600" aria-hidden="true" />
                          <span>Đang tải thêm thảo luận...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw size={14} style={{ color: "#64748B" }} />
                          <span>Xem Thêm Thảo Luận Trước Đó</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ======================================================== */}
          {/* Right Column (Width: 310px) */}
          {/* ======================================================== */}
          <aside className="community-col-right">
            {/* 1. CrediFin AI Advisor Box */}
            <CrediFinAdvisorCard />

            {/* 2. Top 5 Nhà Đầu Tư Leaderboard */}
            <SimulationLeaderboard
              variant="sidebar"
              limit={5}
              title="Top 5 Nhà Đầu Tư"
              subtitle="Hiệu suất sinh lời cao nhất"
            />

            {/* 3. Ticker Tags Card */}
            <TrendingTickersWidget />

            {/* 4. Pro VIP Workshop Card */}
            <ProVipWorkshopCard />
          </aside>
        </div>
      </div>
    </main>
  );
};
