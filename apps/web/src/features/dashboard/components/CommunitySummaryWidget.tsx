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
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
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
          <div className="widget-empty-state p-6 text-center flex flex-col items-center justify-center">
            <MessageSquare size={26} className="text-slate-400 mb-2" aria-hidden="true" />
            <p className="empty-title font-bold text-slate-800">
              Chưa Có Thảo Luận Gần Đây
              <span className="sr-only">No Recent Discussions</span>
            </p>
            <p className="text-slate-500 text-xs max-w-sm mt-1">
              Hãy là người đầu tiên chia sẻ góc nhìn đầu tư hoặc đặt câu hỏi thảo luận.
            </p>
            <Link
              to="/community"
              className="mt-3 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors inline-block"
              aria-label="Start Discussion"
            >
              <span>Đăng Bài Thảo Luận</span>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {(displayPosts.length > 0 ? displayPosts : defaultMockPosts).map((post) => (
              <div
                key={post.id}
                className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50/50 transition-all flex flex-col gap-2 shadow-2xs"
              >
                {/* Header: Author & Date */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center text-white ${
                        post.isAdmin ? "bg-slate-900" : "bg-blue-600"
                      }`}
                    >
                      {post.authorInitials}
                    </div>
                    <span className="text-xs font-bold text-slate-900">
                      {post.authorName}
                    </span>
                    {post.isAdmin && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                        Admin
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {post.dateFormatted}
                  </span>
                </div>

                {/* Content Snippet */}
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 m-0">
                  {post.content}
                </p>

                {/* Engagement Stats */}
                <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                  <span className="inline-flex items-center gap-1 hover:text-rose-500 transition-colors">
                    <Heart size={12} />
                    <span>{post.likeCount} Thích</span>
                  </span>
                  <span className="inline-flex items-center gap-1 hover:text-blue-500 transition-colors">
                    <MessageCircle size={12} />
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
