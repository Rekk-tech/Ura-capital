import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, Sparkles, CheckCircle2, X } from "lucide-react";
import { useAuth } from "../../auth/context/AuthContext";
import { subscriptionApi } from "../../../api/subscription.api";
import { DashboardWidgetWrapper } from "./DashboardWidgetWrapper";

/**
 * FEAT-072: Subscription & Entitlement Summary Widget (FR-001, FR-003, FR-004, AC-001..AC-008)
 *
 * Implements high-fidelity redesigned subscription card:
 * - Membership tier badge (MIỄN PHÍ vs PREMIUM)
 * - Entitlements checklist (free vs active VIP features)
 * - Upgrade CTA linking to /subscription
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
    ? new Date(sub.currentPeriodEnd).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <DashboardWidgetWrapper
      title="Membership Plan"
      displayTitle="Gói Hội Viên"
      subtitle="Trạng thái quyền lợi"
      icon={<ShieldCheck size={18} className="text-blue-600" />}
      domainUrl="/subscription"
      domainLabel="Manage Plan"
      displayLabel="Quản Lý Gói"
      isLoading={subQuery.isLoading}
      isError={subQuery.isError}
      errorMessage="Unable to load subscription status. Please try again."
      onRetry={() => void subQuery.refetch()}
      testId="dashboard-widget-subscription"
    >
      <div className="widget-body">
        {/* Tier Overview Card */}
        <div className="sub-membership-box">
          <div className="sub-tier-row">
            <div>
              <span className="sub-tier-label">Hạng Thành Viên</span>
              <h3 className="sub-tier-name">
                <span>{isPremium ? "Hội Viên Chuyên Nghiệp" : "Khám Phá Miễn Phí"}</span>
                <span data-testid="subscription-plan-value" className="sr-only">
                  {isPremium ? "Institutional Premium" : "Free Explorer"}
                </span>
              </h3>
            </div>
            {isPremium ? (
              <span className="sub-tier-badge premium">
                <Sparkles size={11} aria-hidden="true" />
                <span>PREMIUM</span>
              </span>
            ) : (
              <span className="sub-tier-badge">
                <span>MIỄN PHÍ</span>
                <span className="sr-only">FREE</span>
              </span>
            )}
          </div>

          <div className="sub-entitlements-list">
            <div className="sub-entitlement-item checked">
              <CheckCircle2 size={13} style={{ color: "#10B981", flexShrink: 0 }} aria-hidden="true" />
              <span>Truy cập hệ thống bài học cơ bản</span>
            </div>
            <div className="sub-entitlement-item checked">
              <CheckCircle2 size={13} style={{ color: "#10B981", flexShrink: 0 }} aria-hidden="true" />
              <span>Đấu trường giao dịch mô phỏng tiêu chuẩn</span>
            </div>
            <div className={`sub-entitlement-item ${isPremium ? "checked" : "unchecked"}`}>
              {isPremium ? (
                <>
                  <CheckCircle2 size={13} style={{ color: "#10B981", flexShrink: 0 }} aria-hidden="true" />
                  <span>Định giá chuyên sâu tổ chức &amp; Trợ lý AI Studio</span>
                </>
              ) : (
                <>
                  <X size={13} style={{ color: "#94A3B8", flexShrink: 0 }} aria-hidden="true" />
                  <span>Chưa kích hoạt tính năng Cố vấn AI VIP</span>
                </>
              )}
            </div>

            {periodEndFormatted && (
              <div style={{ fontSize: "0.725rem", color: "#94A3B8", marginTop: 4, fontFamily: "var(--font-mono, monospace)" }}>
                Thời hạn hiệu lực: {periodEndFormatted}
              </div>
            )}
          </div>
        </div>

        {/* Upgrade / Management Action CTA */}
        <Link
          to="/subscription"
          className="btn-sub-upgrade"
        >
          <span>{isPremium ? "Xem Chi Tiết Quyền Lợi" : "Nâng Cấp Hội Viên VIP"}</span>
        </Link>
      </div>
    </DashboardWidgetWrapper>
  );
};
