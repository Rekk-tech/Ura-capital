import React, { useCallback, useMemo, useState } from "react";
import {
  CalendarClock,
  Check,
  CircleDollarSign,
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

  const confirmCancellation = async () => {
    try {
      await cancelMutation.mutateAsync();
      setDialogOpen(false);
      setAnnouncement("Cancellation is scheduled. Subscription status was refreshed from the server.");
    } catch {
      setAnnouncement("Cancellation was not completed. Your subscription state was not changed by this page.");
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
