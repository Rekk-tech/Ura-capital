import React, { useCallback, useMemo, useState } from "react";
import {
  CalendarClock,
  Check,
  CircleDollarSign,
  Crown,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../auth/context/AuthContext";
import { SubscriptionApiError } from "../types/subscription-ui.types";
import {
  useCancelSubscriptionMutation,
  useCurrentSubscriptionQuery,
  useSubscriptionPlansQuery,
} from "../hooks/use-subscription";
import {
  SubscriptionAuthRequired,
  SubscriptionErrorState,
  SubscriptionLoadingState,
  SubscriptionReadOnlyNotice,
} from "../components/SubscriptionStates";
import { CancelSubscriptionDialog } from "../components/CancelSubscriptionDialog";
import { gamificationService } from "../../simulation/services/gamification.service";

interface SubscriptionPageProps {
  commandEnvironment?: string;
}

export function isSubscriptionCommandUiEnabled(environment: string): boolean {
  return environment === "development" || environment === "test";
}

function formatPeriodDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export const SubscriptionPage: React.FC<SubscriptionPageProps> = ({
  commandEnvironment = import.meta.env.MODE,
}) => {
  const { accessToken, user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");

  const plansQuery = useSubscriptionPlansQuery(accessToken ?? undefined);
  const currentQuery = useCurrentSubscriptionQuery(accessToken ?? undefined, user?.id);
  const cancelMutation = useCancelSubscriptionMutation(accessToken ?? undefined);

  const current = currentQuery.data?.data;
  const currentPlan = useMemo(
    () => plansQuery.data?.data.find((plan) => plan.planKey === current?.planKey),
    [current?.planKey, plansQuery.data?.data],
  );

  const refetchAuthoritativeState = useCallback(async () => {
    setAnnouncement("Refreshing subscription status.");
    await Promise.all([plansQuery.refetch(), currentQuery.refetch()]);
    setAnnouncement("Subscription status refreshed from the server.");
  }, [currentQuery, plansQuery]);

  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeBonusClaimed, setUpgradeBonusClaimed] = useState(false);

  const confirmCancellation = async () => {
    try {
      await cancelMutation.mutateAsync();
      setDialogOpen(false);
      setAnnouncement("Cancellation is scheduled. Subscription status was refreshed from the server.");
    } catch {
      setAnnouncement("Cancellation was not completed. Your subscription state was not changed by this page.");
    }
  };

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      gamificationService.unlockBadge("VIP_PATRON");
      gamificationService.addXp(500);
      setUpgradeBonusClaimed(true);
      setAnnouncement("Welcome to Premium VIP! 500 XP and VIP Patron Badge awarded.");
      await refetchAuthoritativeState();
    } catch {
      setAnnouncement("Upgrade was not completed. Please try again.");
    } finally {
      setIsUpgrading(false);
    }
  };

  if (authLoading) {
    return (
      <main className="subscription-page">
        <SubscriptionLoadingState />
      </main>
    );
  }

  if (!isAuthenticated || !accessToken || !user) {
    return (
      <main className="subscription-page">
        <SubscriptionPageHeader />
        <SubscriptionAuthRequired />
      </main>
    );
  }

  if (plansQuery.isLoading || currentQuery.isLoading) {
    return (
      <main className="subscription-page">
        <SubscriptionPageHeader />
        <SubscriptionLoadingState />
      </main>
    );
  }

  const queryError = currentQuery.error ?? plansQuery.error;
  if (queryError) {
    const apiError = queryError instanceof SubscriptionApiError ? queryError : null;
    const kind =
      apiError?.status === 401
        ? "auth"
        : apiError?.status === 403
          ? "forbidden"
          : apiError?.status === 429
            ? "rate-limited"
            : apiError?.status === 503
              ? "unavailable"
              : "generic";

    return (
      <main className="subscription-page">
        <SubscriptionPageHeader />
        {kind === "auth" ? (
          <SubscriptionAuthRequired />
        ) : (
          <SubscriptionErrorState
            kind={kind}
            retryAfter={apiError?.retryAfter}
            onRetry={() => void refetchAuthoritativeState()}
          />
        )}
      </main>
    );
  }

  if (!current || !currentPlan) {
    return (
      <main className="subscription-page">
        <SubscriptionPageHeader />
        <SubscriptionErrorState onRetry={() => void refetchAuthoritativeState()} />
      </main>
    );
  }

  const periodEnd = formatPeriodDate(current.currentPeriodEnd);
  const periodStart = formatPeriodDate(current.currentPeriodStart);
  const isFree = current.planKey === "FREE" || current.status === "NONE";
  const isCancellationPending =
    current.status === "ACTIVE" && current.cancelAtPeriodEnd && current.isEntitled;
  const hasPremiumAccess =
    current.planKey === "PREMIUM" && current.status === "ACTIVE" && current.isEntitled;
  const canCancel =
    isSubscriptionCommandUiEnabled(commandEnvironment) &&
    hasPremiumAccess &&
    !current.cancelAtPeriodEnd;
  const mutationError =
    cancelMutation.error instanceof SubscriptionApiError ? cancelMutation.error : null;

  const state = isFree
    ? {
        label: "Free",
        tone: "neutral",
        title: "Your Free plan is active",
        body: "You have access to Aura Capital's foundational learning and simulation tools.",
      }
    : isCancellationPending
      ? {
          label: "Cancellation pending",
          tone: "warning",
          title: "Premium remains active for now",
          body: periodEnd
            ? `The server confirms Premium access through ${periodEnd}.`
            : "The server confirms Premium access until the current period ends.",
        }
      : hasPremiumAccess
        ? {
            label: "Active",
            tone: "success",
            title: "Premium access is active",
            body: "Your effective Premium entitlement is confirmed by the server.",
          }
        : current.status === "PAST_DUE"
          ? {
              label: "Past due",
              tone: "danger",
              title: "Premium access is paused",
              body: "This account is not currently entitled to Premium access.",
            }
          : current.status === "CANCELLED"
            ? {
                label: "Cancelled",
                tone: "neutral",
                title: "Subscription cancelled",
                body: "Premium access is not active for this account.",
              }
            : current.status === "EXPIRED"
              ? {
                  label: "Expired",
                  tone: "neutral",
                  title: "Subscription expired",
                  body: "Premium access is not active for this account.",
                }
              : {
                  label: "Unavailable",
                  tone: "danger",
                  title: "Premium access is unavailable",
                  body: "The server does not confirm an effective Premium entitlement.",
                };

  return (
    <main className="subscription-page" data-testid="subscription-page">
      <SubscriptionPageHeader />

      <div className="subscription-layout">
        <section className="subscription-status-card" aria-labelledby="subscription-state-title">
          <div className="subscription-status-topline">
            <span className={`subscription-status-badge subscription-status-${state.tone}`}>
              {state.label}
            </span>
            <button
              type="button"
              className="subscription-refresh-button"
              onClick={() => void refetchAuthoritativeState()}
              disabled={currentQuery.isFetching || plansQuery.isFetching}
              aria-label="Refresh subscription status"
            >
              <RefreshCw
                size={17}
                className={currentQuery.isFetching ? "subscription-spin" : undefined}
                aria-hidden="true"
              />
              Refresh
            </button>
          </div>

          <div className="subscription-plan-mark" aria-hidden="true">
            {hasPremiumAccess || isCancellationPending ? (
              <Sparkles size={26} />
            ) : (
              <CircleDollarSign size={26} />
            )}
          </div>
          <p className="subscription-eyebrow">Current plan</p>
          <h2 id="subscription-state-title">{state.title}</h2>
          <p className="subscription-state-copy">{state.body}</p>

          <dl className="subscription-facts">
            <div>
              <dt>Plan</dt>
              <dd>{currentPlan.name}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{current.status === "NONE" ? "No paid subscription" : current.status.replace("_", " ")}</dd>
            </div>
            <div>
              <dt>Premium access</dt>
              <dd>{current.isEntitled ? "Enabled by server" : "Not enabled"}</dd>
            </div>
            <div>
              <dt>Period start</dt>
              <dd>{periodStart ?? "Not applicable"}</dd>
            </div>
            <div>
              <dt>Period end</dt>
              <dd>{periodEnd ?? "Not applicable"}</dd>
            </div>
          </dl>

          {canCancel && (
            <button
              type="button"
              className="btn btn-outline subscription-cancel-button"
              onClick={() => setDialogOpen(true)}
            >
              <CalendarClock size={18} aria-hidden="true" />
              Schedule cancellation
            </button>
          )}
        </section>

        <section className="subscription-benefits" aria-labelledby="subscription-benefits-title">
          <div className="subscription-section-heading">
            <ShieldCheck size={22} aria-hidden="true" />
            <div>
              <p className="subscription-eyebrow">Included access</p>
              <h2 id="subscription-benefits-title">{currentPlan.name}</h2>
            </div>
          </div>
          <p className="subscription-plan-description">{currentPlan.description}</p>
          <ul className="subscription-benefit-list">
            {currentPlan.entitlements.length > 0 ? (
              currentPlan.entitlements.map((entitlement) => (
                <li key={entitlement}>
                  <Check size={18} aria-hidden="true" />
                  <span>
                    {entitlement === "PREMIUM_ACCESS"
                      ? "Advanced platform capabilities"
                      : "Approved plan access"}
                  </span>
                </li>
              ))
            ) : (
              <li>
                <Check size={18} aria-hidden="true" />
                <span>Foundational learning and simulation access</span>
              </li>
            )}
          </ul>
          {!isSubscriptionCommandUiEnabled(commandEnvironment) && <SubscriptionReadOnlyNotice />}
        </section>
      </div>

      {/* ================================================================ */}
      {/* ZONE 2: Bảng Giá 2 Gói (Standard: 0₫ & Premium VIP: 199k/1.49M)   */}
      {/* ================================================================ */}
      <section className="subscription-pricing-section" aria-labelledby="pricing-plans-title">
        <div className="subscription-billing-toggle-container">
          <p className="subscription-eyebrow">Bảng Giá Hội Viên</p>
          <h2 id="pricing-plans-title" style={{ margin: "0.2rem 0 0.5rem", fontSize: "1.6rem", fontWeight: 800 }}>
            Lựa Chọn Gói Phù Hợp Với Bạn
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: 0, textAlign: "center" }}>
            Trải nghiệm trọn vẹn sức mạnh trí tuệ nhân tạo và đấu trường mô phỏng tài chính chuẩn tổ chức.
          </p>

          <div className="subscription-billing-toggle" style={{ marginTop: "1rem" }}>
            <button
              type="button"
              className={`billing-toggle-btn ${billingCycle === "yearly" ? "active" : ""}`}
              onClick={() => setBillingCycle("yearly")}
            >
              <span>Theo Năm</span>
              <span className="billing-savings-badge">Tiết kiệm 38% 🔥</span>
            </button>
            <button
              type="button"
              className={`billing-toggle-btn ${billingCycle === "monthly" ? "active" : ""}`}
              onClick={() => setBillingCycle("monthly")}
            >
              <span>Theo Tháng</span>
            </button>
          </div>
        </div>

        <div className="subscription-pricing-grid">
          {/* Card 1: Gói Tiêu Chuẩn (Standard) */}
          <div className="pricing-card">
            <div>
              <div className="pricing-card-header">
                <h3 className="pricing-plan-name">Gói Tiêu Chuẩn</h3>
                <p className="pricing-plan-tagline">
                  Bắt đầu hành trình đầu tư thực chiến không rủi ro tài chính
                </p>
              </div>

              <div className="pricing-amount-block">
                <span className="pricing-number">0 ₫</span>
                <span className="pricing-unit">/ Trọn đời</span>
              </div>
              <p className="pricing-equivalent-note" style={{ color: "var(--text-secondary)" }}>
                Miễn phí vĩnh viễn cho mọi học viên
              </p>

              <ul className="pricing-features-list">
                <li>
                  <Check size={17} className="text-emerald-500" />
                  <span><strong>100.000.000 ₫</strong> tiền ảo thực chiến cố định</span>
                </li>
                <li>
                  <Check size={17} className="text-emerald-500" />
                  <span><strong>Không giới hạn</strong> Đấu Trường FOMO (Map 1)</span>
                </li>
                <li>
                  <Check size={17} className="text-emerald-500" />
                  <span><strong>3 phiên / tháng</strong> Đấu Trường Pro Room (Map 2)</span>
                </li>
                <li>
                  <Check size={17} className="text-emerald-500" />
                  <span><strong>10 câu hỏi / ngày</strong> với Trợ lý AI Aura Coach</span>
                </li>
                <li>
                  <Check size={17} className="text-emerald-500" />
                  <span>Mở khóa <strong>Chặng 1 &amp; 2</strong> Aura Academy (Cổ phiếu)</span>
                </li>
              </ul>
            </div>

            <div className="pricing-card-actions">
              <button
                type="button"
                disabled
                className="btn btn-outline"
                style={{ width: "100%", justifyContent: "center" }}
              >
                {isFree ? "Gói Đang Sử Dụng" : "Gói Mặc Định"}
              </button>
            </div>
          </div>

          {/* Card 2: Gói Cao Cấp (Premium VIP) */}
          <div className="pricing-card pricing-card-featured">
            <div className="pricing-card-badge">
              <Sparkles size={14} />
              <span>KHUYÊN DÙNG • TIẾT KIỆM 38% 🔥</span>
            </div>

            <div>
              <div className="pricing-card-header" style={{ marginTop: "0.25rem" }}>
                <h3 className="pricing-plan-name" style={{ color: "var(--accent-primary, #4f46e5)" }}>
                  Gói Cao Cấp VIP
                </h3>
                <p className="pricing-plan-tagline">
                  Toàn quyền tiếp cận công cụ phân tích tổ chức &amp; AI Market Coach 24/7
                </p>
              </div>

              <div className="pricing-amount-block">
                <span className="pricing-number">
                  {billingCycle === "yearly" ? "1.490.000 ₫" : "199.000 ₫"}
                </span>
                <span className="pricing-unit">
                  {billingCycle === "yearly" ? "/ năm" : "/ tháng"}
                </span>
              </div>
              <p className="pricing-equivalent-note">
                {billingCycle === "yearly"
                  ? "Tương đương ~124.000 ₫ / tháng (Tiết kiệm 38%)"
                  : "Thanh toán linh hoạt theo từng tháng"}
              </p>

              <div className="pricing-bonus-highlight">
                <Crown size={16} />
                <span>Tặng ngay +500 XP &amp; Huy hiệu VIP Patron</span>
              </div>

              {upgradeBonusClaimed && (
                <div style={{ fontSize: "0.85rem", color: "#10b981", fontWeight: 700, marginBottom: "1rem" }}>
                  ✨ VIP Patron Badge unlocked &amp; +500 XP awarded!
                </div>
              )}

              <ul className="pricing-features-list">
                <li>
                  <Check size={17} className="text-emerald-500" />
                  <span><strong>Tùy biến vốn danh mục</strong> lên tới 1.000.000.000 ₫</span>
                </li>
                <li>
                  <Check size={17} className="text-emerald-500" />
                  <span><strong>Không giới hạn</strong> Đấu Trường FOMO &amp; Map 2 Pro Room</span>
                </li>
                <li>
                  <Check size={17} className="text-emerald-500" />
                  <span><strong>Không giới hạn 24/7</strong> Aura AI Studio (Gemini 1.5 Pro)</span>
                </li>
                <li>
                  <Check size={17} className="text-emerald-500" />
                  <span>Bóc tách chi tiết tâm lý lệnh &amp; bẫy cảm xúc từng chu kỳ</span>
                </li>
                <li>
                  <Check size={17} className="text-emerald-500" />
                  <span><strong>Mở khóa 100%</strong> Academy (Chặng 3 phái sinh &amp; định giá)</span>
                </li>
                <li>
                  <Check size={17} className="text-emerald-500" />
                  <span>Xuất báo cáo phân tích hiệu suất chuyên sâu</span>
                </li>
                <li>
                  <Check size={17} className="text-emerald-500" />
                  <span>Huy hiệu <strong>VIP Patron vàng</strong> nổi bật trên Bảng Xếp Hạng</span>
                </li>
              </ul>
            </div>

            <div className="pricing-card-actions">
              <button
                type="button"
                data-testid="subscription-upgrade-button"
                className="btn btn-primary"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  gap: "0.5rem",
                  padding: "0.75rem",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                }}
                onClick={() => void handleUpgrade()}
                disabled={isUpgrading || hasPremiumAccess}
              >
                <Sparkles size={18} />
                <span>
                  {hasPremiumAccess
                    ? "Gói Đang Sử Dụng (Premium VIP)"
                    : isUpgrading
                      ? "Processing upgrade..."
                      : "Nâng Cấp Gói Premium VIP"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* ZONE 3: Bảng So Sánh Quyền Lợi Chi Tiết (8 Chỉ Mục Matrix)        */}
      {/* ================================================================ */}
      <section className="subscription-comparison-section" aria-labelledby="comparison-matrix-title">
        <div>
          <p className="subscription-eyebrow">So Sánh Quyền Lợi</p>
          <h2 id="comparison-matrix-title" style={{ margin: "0.2rem 0 0.5rem", fontSize: "1.4rem", fontWeight: 800 }}>
            Chi Tiết Đặc Quyền Giữa 2 Gói
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", margin: 0 }}>
            Minh bạch mọi giới hạn và quyền lợi nâng cao để bạn tự tin ra quyết định đầu tư.
          </p>
        </div>

        <div className="comparison-table-wrapper">
          <table className="comparison-table">
            <thead>
              <tr>
                <th scope="col" style={{ width: "34%" }}>Tính Năng &amp; Đặc Quyền</th>
                <th scope="col" style={{ width: "33%" }}>Gói Tiêu Chuẩn (Standard)</th>
                <th scope="col" style={{ width: "33%", color: "#6366f1" }}>Gói Cao Cấp (Premium VIP)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="col-feature">Vốn Khởi Điểm Thực Chiến</td>
                <td className="col-standard">100.000.000 ₫ (Cố định)</td>
                <td className="col-premium">Tùy biến lên tới 1.000.000.000 ₫</td>
              </tr>
              <tr>
                <td className="col-feature">Đấu Trường FOMO (Map 1)</td>
                <td className="col-standard">Không giới hạn lượt chơi</td>
                <td className="col-premium">Không giới hạn lượt chơi</td>
              </tr>
              <tr>
                <td className="col-feature">Đấu Trường Pro Room (Map 2)</td>
                <td className="col-standard">Tối đa 3 phiên / tháng</td>
                <td className="col-premium">Không giới hạn 12 quý vĩ mô</td>
              </tr>
              <tr>
                <td className="col-feature">Trợ Lý AI Aura Intelligence</td>
                <td className="col-standard">10 truy vấn / ngày (Cơ bản)</td>
                <td className="col-premium">Không giới hạn 24/7 (AI Studio chuyên sâu)</td>
              </tr>
              <tr>
                <td className="col-feature">Phân Tích Lệnh &amp; Tâm Lý AI</td>
                <td className="col-standard">Đánh giá tổng quan sau trận</td>
                <td className="col-premium">Bóc tách chi tiết từng chu kỳ lệnh</td>
              </tr>
              <tr>
                <td className="col-feature">Khóa Học Aura Academy</td>
                <td className="col-standard">Chặng 1 &amp; 2 (Nền tảng &amp; Cổ phiếu)</td>
                <td className="col-premium">Mở khóa 100% Khóa học &amp; Phái sinh / Hedging</td>
              </tr>
              <tr>
                <td className="col-feature">Đặc Quyền Bảng Xếp Hạng</td>
                <td className="col-standard">Hiển thị xếp hạng tiêu chuẩn</td>
                <td className="col-premium">Huy hiệu VIP Patron vàng nổi bật</td>
              </tr>
              <tr>
                <td className="col-feature">Quà Tặng Điểm Thưởng XP</td>
                <td className="col-standard">200 XP mặc định ban đầu</td>
                <td className="col-premium">Tặng ngay +500 XP khi nâng cấp</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {mutationError && (
        <div
          className="subscription-mutation-message subscription-mutation-error"
          role="alert"
          data-testid="subscription-mutation-error"
        >
          {mutationError.status === 429
            ? mutationError.retryAfter
              ? `Please wait ${mutationError.retryAfter} seconds before trying again.`
              : "Please wait before trying again."
            : mutationError.status === 503
              ? "Cancellation is temporarily unavailable. No subscription change was applied."
              : mutationError.status === 409
                ? "Subscription state changed. Refresh before trying again."
                : "Cancellation was not completed. No subscription change was applied."}
        </div>
      )}

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>

      <CancelSubscriptionDialog
        open={dialogOpen}
        pending={cancelMutation.isPending}
        onCancel={() => setDialogOpen(false)}
        onConfirm={() => void confirmCancellation()}
      />
    </main>
  );
};

const SubscriptionPageHeader: React.FC = () => (
  <header className="subscription-page-header">
    <p className="subscription-eyebrow">Membership</p>
    <h1>Subscription</h1>
    <p>Review your server-confirmed plan, access, and billing-period status.</p>
  </header>
);
