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
      <div className="widget-body flex flex-col justify-between">
        {/* Tier Overview Card */}
        <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-slate-400 block">Hạng Thành Viên</span>
              <h3 className="text-sm font-bold text-slate-900 m-0">
                <span>{isPremium ? "Hội Viên Chuyên Nghiệp" : "Khám Phá Miễn Phí"}</span>
                <span data-testid="subscription-plan-value" className="sr-only">
                  {isPremium ? "Institutional Premium" : "Free Explorer"}
                </span>
              </h3>
            </div>
            {isPremium ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                <Sparkles size={11} aria-hidden="true" />
                <span>PREMIUM</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                <span>MIỄN PHÍ</span>
                <span className="sr-only">FREE</span>
              </span>
            )}
          </div>

          <div className="space-y-2 pt-1 border-t border-slate-200/60 text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" aria-hidden="true" />
              <span>Truy cập hệ thống bài học cơ bản</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" aria-hidden="true" />
              <span>Đấu trường giao dịch mô phỏng tiêu chuẩn</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              {isPremium ? (
                <>
                  <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" aria-hidden="true" />
                  <span className="text-slate-700">Định giá chuyên sâu tổ chức &amp; Trợ lý AI Studio</span>
                </>
              ) : (
                <>
                  <X size={13} className="text-slate-400 flex-shrink-0" aria-hidden="true" />
                  <span>Chưa kích hoạt tính năng Cố vấn AI VIP</span>
                </>
              )}
            </div>

            {periodEndFormatted && (
              <div className="text-[11px] text-slate-400 pt-1 font-mono">
                Thời hạn hiệu lực: {periodEndFormatted}
              </div>
            )}
          </div>
        </div>

        {/* Upgrade / Management Action CTA */}
        <div className="mt-4">
          <Link
            to="/subscription"
            className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all block text-center shadow-xs ${
              isPremium
                ? "border border-slate-200 hover:bg-slate-100 text-slate-700"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            <span>{isPremium ? "Xem Chi Tiết Quyền Lợi" : "Nâng Cấp Hội Viên VIP"}</span>
          </Link>
        </div>
      </div>
    </DashboardWidgetWrapper>
  );
};
