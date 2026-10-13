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
 * Bounded client composition of existing Community read contract:
 * - communityApi.listPosts ({ limit: 3 })
 * Non-authoritative presentation: links to /community for all thread actions.
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

  return (
    <DashboardWidgetWrapper
      title="Community Discussions"
      displayTitle="Thảo Luận Cộng Đồng"
      icon={<MessageSquare size={20} className="text-accent" />}
      domainUrl="/community"
      domainLabel="Join Forum"
      displayLabel="Vào Diễn Đàn"
      badge={<span className="badge badge-info">{posts.length} Mới nhất</span>}
      isLoading={postsQuery.isLoading}
      isError={postsQuery.isError}
      errorMessage="Unable to load community discussions. Please try again."
      onRetry={() => void postsQuery.refetch()}
      testId="dashboard-widget-community"
    >
      <div className="widget-body">
        {posts.length === 0 ? (
          <div className="widget-empty-state">
            <MessageSquare size={26} className="text-muted" aria-hidden="true" />
            <p className="empty-title font-bold">
              Chưa Có Thảo Luận Gần Đây
              <span className="sr-only">No Recent Discussions</span>
            </p>
            <p className="text-muted">
              Hãy là người đầu tiên chia sẻ góc nhìn đầu tư hoặc đặt câu hỏi thảo luận.
            </p>
            <Link
              to="/community"
              className="btn btn-outline btn-sm"
              style={{ marginTop: "0.75rem" }}
              aria-label="Start Discussion"
            >
              <span>Đăng Bài Thảo Luận</span>
            </Link>
          </div>
        ) : (
          <ul className="community-posts-list" role="list">
            {posts.map((post) => (
              <li key={post.id} className="community-post-summary-card">
                <div className="post-header-line">
                  <span className="post-author font-bold">{post.author.displayName}</span>
                  <span className="post-time text-muted">
                    {new Date(post.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <p className="post-snippet text-muted">
                  {post.content.length > 90 ? `${post.content.slice(0, 90)}...` : post.content}
                </p>
                <div className="post-stats-row">
                  <span className="post-stat">
                    <Heart size={12} className="text-muted" aria-hidden="true" />
                    <span>{post.likeCount}</span>
                  </span>
                  <span className="post-stat">
                    <MessageCircle size={12} className="text-muted" aria-hidden="true" />
                    <span>{post.commentCount}</span>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardWidgetWrapper>
  );
};
