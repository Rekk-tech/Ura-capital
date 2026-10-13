import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../auth/context/AuthContext";
import { subscriptionApi } from "../../../api/subscription.api";
import { DashboardWidgetWrapper } from "./DashboardWidgetWrapper";

/**
 * FEAT-072: Subscription & Entitlement Summary Widget (FR-001, FR-003, FR-004, AC-001..AC-008)
 *
 * Bounded client composition of existing Subscription read contract:
 * - subscriptionApi.getCurrent (authenticated)
 * Non-authoritative presentation: links to /subscription for all plan management.
 */
export const SubscriptionSummaryWidget: React.FC = () => {
  const { accessToken } = useAuth();

  const subQuery = useQuery({
    queryKey: ["dashboard", "subscription", "current"],
    queryFn: ({ signal }) => subscriptionApi.getCurrent(accessToken!, { signal }),
    enabled: Boolean(accessToken),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: process.env.NODE_ENV === "test" ? false : 1,
  });

  const sub = subQuery.data?.data;
  const isPremium = sub?.planKey === "PREMIUM" || sub?.plan === "PREMIUM";

  const periodEndFormatted = sub?.currentPeriodEnd
    ? new Date(sub.currentPeriodEnd).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <DashboardWidgetWrapper
      title="Membership Plan"
      displayTitle="Gói Hội Viên"
      icon={<ShieldCheck size={20} className="text-accent" />}
      domainUrl="/subscription"
      domainLabel="Manage Plan"
      displayLabel="Quản Lý Gói"
      badge={
        sub ? (
          <span className={`badge ${isPremium ? "badge-success" : "badge-info"}`}>
            {sub.status || "ACTIVE"}
          </span>
        ) : undefined
      }
      isLoading={subQuery.isLoading}
      isError={subQuery.isError}
      errorMessage="Unable to load subscription status. Please try again."
      onRetry={() => void subQuery.refetch()}
      testId="dashboard-widget-subscription"
    >
      <div className="widget-body">
        {/* Tier Overview Card */}
        <div className="subscription-tier-highlight">
          <div className="tier-header-row">
            <div>
              <span className="tier-label text-muted">Hạng Thành Viên</span>
              <h3 className="tier-name font-bold" data-testid="subscription-plan-value">
                {isPremium ? "Institutional Premium" : "Free Explorer"}
              </h3>
            </div>
            {isPremium ? (
              <span className="badge badge-success">
                <Sparkles size={12} aria-hidden="true" />
                <span>PREMIUM</span>
              </span>
            ) : (
              <span className="badge badge-info">FREE</span>
            )}
          </div>

          <div className="tier-entitlements-list">
            <div className="entitlement-item">
              <CheckCircle2 size={14} className="text-success flex-shrink-0" aria-hidden="true" />
              <span>{isPremium ? "Không giới hạn bàn giao dịch mô phỏng đa tài sản" : "Truy cập hệ thống bài học cơ bản"}</span>
            </div>
            <div className="entitlement-item">
              <CheckCircle2 size={14} className="text-success flex-shrink-0" aria-hidden="true" />
              <span>{isPremium ? "Định giá chuyên sâu tổ chức & Trợ lý AI Studio" : "Đấu trường giao dịch mô phỏng tiêu chuẩn"}</span>
            </div>
            {periodEndFormatted && (
              <div className="entitlement-item text-muted" style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
                <span>Thời hạn hiệu lực: {periodEndFormatted}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Link */}
        <div style={{ marginTop: "1rem" }}>
          <Link
            to="/subscription"
            className={`btn btn-block ${isPremium ? "btn-outline" : "btn-primary"} btn-sm`}
          >
            <span>{isPremium ? "Xem Chi Tiết Quyền Lợi" : "Nâng Cấp Hội Viên VIP"}</span>
          </Link>
        </div>
      </div>
    </DashboardWidgetWrapper>
  );
};
