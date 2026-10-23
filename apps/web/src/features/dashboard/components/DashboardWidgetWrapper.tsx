import React from "react";
import { Link } from "react-router-dom";
import { AlertCircle, RotateCcw, ArrowRight } from "lucide-react";

interface Props {
  title: string;
  displayTitle?: string;
  subtitle?: string;
  icon: React.ReactNode;
  domainUrl: string;
  domainLabel: string;
  displayLabel?: string;
  badge?: React.ReactNode;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  children: React.ReactNode;
  testId?: string;
}

/**
 * FEAT-072: Isolated Dashboard Widget Wrapper (AC-004, AC-007)
 *
 * Ensures each domain widget operates in complete isolation:
 * - Local loading states do not block other widgets
 * - Local error states do not fail other widgets or crash the dashboard
 * - Keyboard-accessible retry action
 * - Direct navigation link to the owning domain
 */
export const DashboardWidgetWrapper: React.FC<Props> = ({
  title,
  displayTitle,
  subtitle,
  icon,
  domainUrl,
  domainLabel,
  displayLabel,
  badge,
  isLoading,
  isError,
  errorMessage = "Unable to load summary data. Please try again.",
  onRetry,
  children,
  testId,
}) => {
  return (
    <section className="overview-card dashboard-widget" aria-labelledby={`widget-title-${title.replace(/\s+/g, "-").toLowerCase()}`} data-testid={testId}>
      <header className="overview-card-header widget-header">
        <div className="overview-card-header-left widget-title-wrap">
          <span className="overview-card-icon-wrap widget-icon" aria-hidden="true">
            {icon}
          </span>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h2 id={`widget-title-${title.replace(/\s+/g, "-").toLowerCase()}`} className="overview-card-title widget-title">
                {displayTitle || title}
              </h2>
              {badge && <div className="widget-badge">{badge}</div>}
            </div>
            {subtitle && <p className="overview-card-sub widget-subtitle">{subtitle}</p>}
          </div>
        </div>
        <Link to={domainUrl} className="overview-header-link widget-domain-link" aria-label={`Go to ${domainLabel}`}>
          <span>{displayLabel || domainLabel}</span>
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </header>

      <div className="widget-content" style={{ marginTop: "16px" }}>
        {isError ? (
          <div className="widget-error" role="alert">
            <div className="widget-error-message">
              <AlertCircle size={18} className="text-error" aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>
            {onRetry && (
              <button
                type="button"
                className="btn btn-outline btn-sm widget-retry-btn"
                onClick={onRetry}
                aria-label={`Retry loading ${title}`}
              >
                <RotateCcw size={14} aria-hidden="true" />
                <span>Retry</span>
              </button>
            )}
          </div>
        ) : isLoading ? (
          <div className="widget-loading" role="status" aria-label={`Loading ${title}`}>
            <div className="loading-spinner" aria-hidden="true" />
            <span className="text-muted">Loading summary...</span>
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
};
