import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, Heart, MessageCircle } from "lucide-react";
import { useAuth } from "../../auth/context/AuthContext";
import { communityApi } from "../../../api/community.api";
import { DashboardWidgetWrapper } from "./DashboardWidgetWrapper";

/**
 * FEAT-072: Community Discussions Summary Widget (FR-001, FR-003, FR-004, AC-001..AC-008)
 *
 * Implements high-fidelity redesigned community overview:
 * - Thread discussion cards with author avatars & admin badges
 * - Post snippets, engagement statistics (likes, comments)
 * - Navigation links to /community
 */
export const CommunitySummaryWidget: React.FC = () => {
  const { accessToken } = useAuth();

  const postsQuery = useQuery({
    queryKey: ["dashboard", "community", "posts"],
    queryFn: ({ signal }) => communityApi.listPosts({ limit: 3 }, accessToken ?? undefined, { signal }),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: process.env.NODE_ENV === "test" ? false : 1,
  });

  const posts = postsQuery.data?.data ?? [];

  const defaultMockPosts = [
    {
      id: "post-mock-1",
      authorName: "Aura System Admin",
      authorInitials: "AS",
      isAdmin: true,
      dateFormatted: "10 Tháng 10",
      content:
        "# Tổng kết 12 Quý Pro Room: Đạt chứng chỉ Nhà đầu tư Phòng thủ (Defensive Investor)...",
      likeCount: 24,
      commentCount: 9,
    },
    {
      id: "post-mock-2",
      authorName: "Dev User 2",
      authorInitials: "D2",
      isAdmin: false,
      dateFormatted: "29 Tháng 9",
      content:
        "When growth equities experience multiple expansion, value sectors often provide defensive stability in volatile sessions...",
      likeCount: 12,
      commentCount: 4,
    },
    {
      id: "post-mock-3",
      authorName: "Dev User 1",
      authorInitials: "D1",
      isAdmin: false,
      dateFormatted: "29 Tháng 9",
      content:
        "Simulation Trading Order Execution Notes: Ghi chú cách đặt lệnh Limit Order trong phiên biến động mạnh để tránh trượt giá...",
      likeCount: 18,
      commentCount: 7,
    },
  ];

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    const first = parts[0];
    const last = parts[parts.length - 1];
    if (first && last && first[0] && last[0]) {
      return (first[0] + last[0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const displayPosts =
    posts.length > 0
      ? posts.map((p) => ({
          id: p.id,
          authorName: p.author.displayName,
          authorInitials: getInitials(p.author.displayName),
          isAdmin: p.author.displayName.toLowerCase().includes("admin"),
          dateFormatted: new Date(p.createdAt).toLocaleDateString("vi-VN", {
            day: "numeric",
            month: "long",
          }),
          content: p.content,
          likeCount: p.likeCount,
          commentCount: p.commentCount,
        }))
      : [];

  return (
    <DashboardWidgetWrapper
      title="Community Discussions"
      displayTitle="Thảo Luận & Góc Nhìn Chuyên Gia"
      subtitle="Diễn đàn trao đổi phương pháp đầu tư Aura Community"
      icon={<MessageSquare size={18} className="text-blue-600" />}
      domainUrl="/community"
      domainLabel="Join Forum"
      displayLabel="Vào Diễn Đàn"
      badge={
        <span className="overview-header-pill">
          {posts.length > 0 ? posts.length : 3} Mới Nhất
        </span>
      }
      isLoading={postsQuery.isLoading}
      isError={postsQuery.isError}
      errorMessage="Unable to load community discussions. Please try again."
      onRetry={() => void postsQuery.refetch()}
      testId="dashboard-widget-community"
    >
      <div className="widget-body">
        {postsQuery.isSuccess && posts.length === 0 ? (
          <div className="widget-empty-state" style={{ padding: "24px", textAlign: "center" }}>
            <MessageSquare size={26} style={{ color: "#94A3B8", marginBottom: "8px" }} aria-hidden="true" />
            <p className="empty-title" style={{ fontWeight: 700, color: "#1E293B" }}>
              Chưa Có Thảo Luận Gần Đây
              <span className="sr-only">No Recent Discussions</span>
            </p>
            <p style={{ color: "#64748B", fontSize: "0.775rem", maxWidth: "380px", margin: "6px auto 0" }}>
              Hãy là người đầu tiên chia sẻ góc nhìn đầu tư hoặc đặt câu hỏi thảo luận.
            </p>
            <Link
              to="/community"
              className="btn-overview-action"
              style={{ marginTop: "12px", display: "inline-flex" }}
              aria-label="Start Discussion"
            >
              <span>Đăng Bài Thảo Luận</span>
            </Link>
          </div>
        ) : (
          <div className="overview-posts-list">
            {(displayPosts.length > 0 ? displayPosts : defaultMockPosts).map((post) => (
              <div
                key={post.id}
                className="overview-post-item"
              >
                {/* Header: Author & Date */}
                <div className="overview-post-head">
                  <div className="post-author-box">
                    <div
                      className="post-author-avatar"
                      style={{ background: post.isAdmin ? "#0F172A" : "#1D6FF2" }}
                    >
                      {post.authorInitials}
                    </div>
                    <span className="post-author-name">
                      {post.authorName}
                    </span>
                    {post.isAdmin && (
                      <span className="post-admin-badge">
                        Admin
                      </span>
                    )}
                  </div>
                  <span className="post-date-str">
                    {post.dateFormatted}
                  </span>
                </div>

                {/* Content Snippet */}
                <p className="post-snippet-text">
                  {post.content}
                </p>

                {/* Engagement Stats */}
                <div className="post-stats-row">
                  <span className="post-stat-item">
                    <Heart size={13} style={{ color: "#EF4444" }} aria-hidden="true" />
                    <span>{post.likeCount} Thích</span>
                  </span>
                  <span className="post-stat-item">
                    <MessageCircle size={13} style={{ color: "#64748B" }} aria-hidden="true" />
                    <span>{post.commentCount} Bình luận</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardWidgetWrapper>
  );
};
