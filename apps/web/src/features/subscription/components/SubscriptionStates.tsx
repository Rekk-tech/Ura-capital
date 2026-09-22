import React from "react";
import {
  AlertCircle,
  Clock3,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

export const SubscriptionLoadingState: React.FC = () => (
  <section
    className="subscription-state subscription-loading"
    data-testid="subscription-loading"
    aria-busy="true"
    aria-label="Loading subscription"
  >
    <div className="subscription-skeleton subscription-skeleton-short" />
    <div className="subscription-skeleton subscription-skeleton-title" />
    <div className="subscription-skeleton" />
    <div className="subscription-skeleton subscription-skeleton-medium" />
  </section>
);
export const SubscriptionAuthRequired: React.FC = () => (
  <section className="subscription-state" data-testid="subscription-auth-required">
    <div className="subscription-state-icon subscription-state-icon-info" aria-hidden="true">
      <LockKeyhole size={26} />
    </div>
    <div>
      <p className="subscription-eyebrow">Account access</p>
      <h2>Sign in to view your subscription</h2>
      <p>
        Subscription details are private and are loaded only after your authenticated session is
        available.
      </p>
    </div>
  </section>
);

interface SubscriptionErrorStateProps {
  kind?: "forbidden" | "rate-limited" | "unavailable" | "generic";
  retryAfter?: number;
  onRetry: () => void;
}

export const SubscriptionErrorState: React.FC<SubscriptionErrorStateProps> = ({
  kind = "generic",
  retryAfter,
  onRetry,
}) => {
  const copy = {
    forbidden: {
      title: "Subscription access unavailable",
      body: "This account cannot access subscription details. No account state was changed.",
    },
    "rate-limited": {
      title: "Please wait before trying again",
      body: retryAfter
        ? `Try again in ${retryAfter} seconds. No subscription change was applied.`
        : "Try again shortly. No subscription change was applied.",
    },
    unavailable: {
      title: "Subscription service temporarily unavailable",
      body: "Your existing account state has not been changed. Please try again shortly.",
    },
    generic: {
      title: "Unable to load subscription",
      body: "Subscription data could not be loaded safely. Please try again.",
    },
  }[kind];

  return (
    <section className="subscription-state" data-testid={`subscription-error-${kind}`} role="alert">
      <div className="subscription-state-icon subscription-state-icon-error" aria-hidden="true">
        {kind === "rate-limited" ? <Clock3 size={26} /> : <AlertCircle size={26} />}
      </div>
      <div>
        <p className="subscription-eyebrow">Account status</p>
        <h2>{copy.title}</h2>
        <p>{copy.body}</p>
        <button type="button" className="btn btn-outline" onClick={onRetry}>
          <RefreshCw size={17} aria-hidden="true" />
          Retry
        </button>
      </div>
    </section>
  );
};

export const SubscriptionReadOnlyNotice: React.FC = () => (
  <aside className="subscription-readonly-notice" aria-label="Plan availability">
    <ShieldCheck size={20} aria-hidden="true" />
    <div>
      <strong>Plan changes are currently unavailable.</strong>
      <span>This page is read-only in this environment. Your account state remains server-managed.</span>
    </div>
  </aside>
);
