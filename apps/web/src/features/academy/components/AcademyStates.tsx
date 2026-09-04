import React from "react";
import { Link, useLocation } from "react-router-dom";
import { AlertCircle, Lock, BookOpen, RefreshCw } from "lucide-react";
import { buildAuthRedirectUrl } from "../utils/redirect-validator";

export const CatalogLoadingSkeleton: React.FC = () => (
  <div className="academy-skeleton-container" aria-busy="true" aria-label="Loading courses">
    <div role="status" className="sr-only">
      Loading academy courses...
    </div>
    <div className="academy-card-grid">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="academy-card skeleton-card">
          <div className="skeleton-line skeleton-badge" />
          <div className="skeleton-line skeleton-title" />
          <div className="skeleton-line skeleton-desc" />
          <div className="skeleton-line skeleton-desc short" />
          <div className="skeleton-footer">
            <div className="skeleton-line skeleton-pill" />
            <div className="skeleton-line skeleton-link" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const CourseDetailSkeleton: React.FC = () => (
  <div className="academy-detail-skeleton" aria-busy="true" aria-label="Loading course details">
    <div role="status" className="sr-only">
      Loading course details...
    </div>
    <div className="skeleton-line skeleton-badge" />
    <div className="skeleton-line skeleton-title large" />
    <div className="skeleton-line skeleton-desc" />
    <div className="skeleton-line skeleton-desc short" />
    <div className="skeleton-outline-section">
      <div className="skeleton-line skeleton-heading" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="skeleton-outline-row">
          <div className="skeleton-circle" />
          <div className="skeleton-line skeleton-title" style={{ width: "60%" }} />
        </div>
      ))}
    </div>
  </div>
);

export const LessonDetailSkeleton: React.FC = () => (
  <div className="academy-lesson-skeleton" aria-busy="true" aria-label="Loading lesson content">
    <div role="status" className="sr-only">
      Loading lesson content...
    </div>
    <div className="skeleton-line skeleton-badge" />
    <div className="skeleton-line skeleton-title large" />
    <div className="skeleton-prose">
      <div className="skeleton-line skeleton-desc" />
      <div className="skeleton-line skeleton-desc" />
      <div className="skeleton-line skeleton-desc short" />
      <div className="skeleton-line skeleton-desc" style={{ marginTop: "1.5rem" }} />
      <div className="skeleton-line skeleton-desc" />
      <div className="skeleton-line skeleton-desc short" />
    </div>
  </div>
);

interface EmptyStateProps {
  message?: string;
  onReset?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  message = "No courses match the selected filter.",
  onReset,
}) => (
  <div className="academy-empty-state" role="status">
    <BookOpen className="academy-state-icon" size={48} aria-hidden="true" />
    <h3 className="academy-state-title">No Courses Found</h3>
    <p className="academy-state-desc">{message}</p>
    {onReset && (
      <button type="button" className="btn btn-outline" onClick={onReset}>
        Reset Filters
      </button>
    )}
  </div>
);

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = "Failed to load content. Please try again.",
  onRetry,
}) => (
  <div className="academy-error-state" role="alert">
    <AlertCircle className="academy-state-icon error-icon" size={48} aria-hidden="true" />
    <h3 className="academy-state-title">Something went wrong</h3>
    <p className="academy-state-desc">{message}</p>
    {onRetry && (
      <button type="button" className="btn btn-primary btn-retry" onClick={onRetry}>
        <RefreshCw size={16} className="btn-icon" aria-hidden="true" />
        Retry
      </button>
    )}
  </div>
);

interface NotFoundStateProps {
  title?: string;
  message?: string;
  backTo?: string;
  backLabel?: string;
}

export const NotFoundState: React.FC<NotFoundStateProps> = ({
  title = "Content Unavailable",
  message = "The requested course or lesson could not be found or is not currently available.",
  backTo = "/academy",
  backLabel = "Back to Academy",
}) => (
  <div className="academy-not-found-state" role="status">
    <AlertCircle className="academy-state-icon muted-icon" size={48} aria-hidden="true" />
    <h2 className="academy-state-title">{title}</h2>
    <p className="academy-state-desc">{message}</p>
    <Link to={backTo} className="btn btn-primary">
      {backLabel}
    </Link>
  </div>
);

interface AuthRequiredCardProps {
  courseSlug?: string;
  lessonSlug?: string;
  returnPath?: string;
}

export const AuthRequiredCard: React.FC<AuthRequiredCardProps> = ({ courseSlug, lessonSlug, returnPath }) => {
  const location = useLocation();
  const currentPath =
    returnPath ??
    (courseSlug && lessonSlug
      ? `/academy/courses/${courseSlug}/lessons/${lessonSlug}`
      : location.pathname + location.search);

  const loginUrl = buildAuthRedirectUrl("/login", currentPath);
  const registerUrl = buildAuthRedirectUrl("/register", currentPath);

  return (
    <div className="academy-auth-required-card" role="status" aria-labelledby="auth-required-title">
      <div className="auth-card-icon-wrap">
        <Lock size={32} className="auth-card-icon" aria-hidden="true" />
      </div>
      <h2 id="auth-required-title" className="auth-card-title">
        Authentication Required
      </h2>
      <p className="auth-card-desc">
        This lesson is available exclusively to registered Aura Capital learners. Please sign in or create an account to access the educational content and track your progress.
      </p>
      <div className="auth-card-actions">
        <Link to={loginUrl} className="btn btn-primary">
          Sign In to Continue
        </Link>
        <Link to={registerUrl} className="btn btn-outline">
          Create Free Account
        </Link>
      </div>
    </div>
  );
};

export const FlashcardLoadingSkeleton: React.FC = () => (
  <div className="flashcard-review-skeleton" aria-busy="true" aria-label="Loading flashcards" data-testid="flashcard-loading-skeleton">
    <div role="status" className="sr-only">
      Loading flashcards...
    </div>
    <div className="skeleton-toolbar" style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
      <div className="skeleton-line skeleton-pill" style={{ width: "120px", height: "24px" }} />
      <div className="skeleton-line skeleton-pill" style={{ width: "80px", height: "24px" }} />
    </div>
    <div className="skeleton-card-surface" style={{ padding: "2rem", borderRadius: "0.75rem", background: "var(--card-bg, rgba(255,255,255,0.03))", minHeight: "260px" }}>
      <div className="skeleton-line skeleton-badge" style={{ width: "70px", height: "20px", marginBottom: "1.5rem" }} />
      <div className="skeleton-line skeleton-title" style={{ width: "70%", height: "24px", marginBottom: "1rem" }} />
      <div className="skeleton-line skeleton-desc" style={{ width: "90%", height: "16px", marginBottom: "0.5rem" }} />
      <div className="skeleton-line skeleton-desc" style={{ width: "50%", height: "16px", marginBottom: "2rem" }} />
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div className="skeleton-line" style={{ width: "160px", height: "42px", borderRadius: "0.5rem" }} />
      </div>
    </div>
    <div className="skeleton-footer" style={{ display: "flex", justifyContent: "space-between", marginTop: "1.5rem" }}>
      <div className="skeleton-line" style={{ width: "110px", height: "40px", borderRadius: "0.5rem" }} />
      <div className="skeleton-line" style={{ width: "110px", height: "40px", borderRadius: "0.5rem" }} />
    </div>
  </div>
);

