import React from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Lock, HelpCircle, RefreshCw, MessageSquare, AlertTriangle } from "lucide-react";

export const CommunityLoadingSkeleton: React.FC = () => {
  return (
    <div className="community-skeleton-container" data-testid="community-loading-skeleton" aria-busy="true">
      <div className="skeleton-box" style={{ height: "140px", marginBottom: "1.5rem", borderRadius: "var(--radius-md)" }} />
      <div className="skeleton-box" style={{ height: "120px", marginBottom: "1rem", borderRadius: "var(--radius-md)" }} />
      <div className="skeleton-box" style={{ height: "120px", marginBottom: "1rem", borderRadius: "var(--radius-md)" }} />
      <div className="skeleton-box" style={{ height: "120px", marginBottom: "1rem", borderRadius: "var(--radius-md)" }} />
    </div>
  );
};

export const CommunityAuthRequiredCard: React.FC<{ message?: string }> = ({
  message = "Vui lòng đăng nhập để tham gia diễn đàn cộng đồng, đăng bài viết và trao đổi cùng các nhà đầu tư khác.",
}) => {
  return (
    <div className="card community-state-card" data-testid="community-auth-card">
      <div
        className="card-icon-wrap"
        style={{ background: "rgba(239, 68, 68, 0.15)", color: "var(--status-error)" }}
      >
        <Lock size={28} aria-hidden="true" />
      </div>
      <h2 className="card-title" style={{ marginTop: "1rem" }}>
        Yêu Cầu Đăng Nhập <span className="sr-only">Authentication Required</span>
      </h2>
      <p className="card-description" style={{ margin: "0.5rem 0 1.5rem" }}>
        {message}
      </p>
      <Link to="/" className="button button-primary">
        <span>Đăng Nhập / Về Trang Chủ</span>
      </Link>
    </div>
  );
};

export const CommunityNotFoundCard: React.FC<{
  title?: string;
  message?: string;
}> = ({
  title,
  message = "Bài viết yêu cầu không tồn tại, đã bị gỡ bỏ hoặc hiện không khả dụng.",
}) => {
  return (
    <div className="card community-state-card" data-testid="community-not-found-card">
      <div
        className="card-icon-wrap"
        style={{ background: "rgba(245, 158, 11, 0.15)", color: "var(--status-warning)" }}
      >
        <HelpCircle size={28} aria-hidden="true" />
      </div>
      <h2 className="card-title" style={{ marginTop: "1rem" }}>
        {title ? title : (
          <>
            Không Tìm Thấy Bài Viết <span className="sr-only">Post Not Found</span>
          </>
        )}
      </h2>
      <p className="card-description" style={{ margin: "0.5rem 0 1.5rem" }}>
        {message}
      </p>
      <Link to="/community" className="button button-secondary">
        <span>Quay Lại Diễn Đàn</span>
      </Link>
    </div>
  );
};

export const CommunityEmptyState: React.FC = () => {
  return (
    <div className="card community-state-card" data-testid="community-empty-state">
      <div
        className="card-icon-wrap"
        style={{ background: "rgba(59, 130, 246, 0.15)", color: "var(--accent-primary)" }}
      >
        <MessageSquare size={28} aria-hidden="true" />
      </div>
      <h3 className="card-title" style={{ marginTop: "1rem" }}>
        Chưa Có Bài Viết Nào <span className="sr-only">No Community Posts Yet</span>
      </h3>
      <p className="card-description" style={{ margin: "0.5rem 0 0" }}>
        Hãy là học viên đầu tiên chia sẻ câu hỏi, góc nhìn hoặc phân tích thị trường cùng cộng đồng!
      </p>
    </div>
  );
};

export const CommunityRateLimitedBanner: React.FC<{ retryAfter?: number }> = ({ retryAfter }) => {
  return (
    <div
      className="alert alert-warning community-alert-banner"
      data-testid="community-rate-limited-banner"
      role="alert"
      aria-live="polite"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.75rem 1rem",
        borderRadius: "var(--radius-sm)",
        marginBottom: "1rem",
        backgroundColor: "var(--status-warning-bg)",
        border: "1px solid var(--status-warning)",
        color: "var(--text-primary)",
      }}
    >
      <AlertTriangle size={20} style={{ color: "var(--status-warning)", flexShrink: 0 }} aria-hidden="true" />
      <div>
        <strong>Rate Limit Exceeded:</strong> Please wait {retryAfter ?? 60} seconds before attempting another write action.
      </div>
    </div>
  );
};

export const CommunityServiceUnavailableBanner: React.FC = () => {
  return (
    <div
      className="alert alert-error community-alert-banner"
      data-testid="community-service-unavailable-banner"
      role="alert"
      aria-live="polite"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.75rem 1rem",
        borderRadius: "var(--radius-sm)",
        marginBottom: "1rem",
        backgroundColor: "var(--status-error-bg)",
        border: "1px solid var(--status-error)",
        color: "var(--text-primary)",
      }}
    >
      <AlertCircle size={20} style={{ color: "var(--status-error)", flexShrink: 0 }} aria-hidden="true" />
      <div>
        <strong>Service Temporarily Unavailable:</strong> Community write actions are currently paused. Please try again shortly.
      </div>
    </div>
  );
};

export const CommunityErrorCard: React.FC<{
  message?: string;
  onRetry?: () => void;
}> = ({
  message = "An unexpected error occurred while loading community data.",
  onRetry,
}) => {
  return (
    <div className="card community-state-card" data-testid="community-error-card" role="alert">
      <div
        className="card-icon-wrap"
        style={{ background: "rgba(239, 68, 68, 0.15)", color: "var(--status-error)" }}
      >
        <AlertCircle size={28} aria-hidden="true" />
      </div>
      <h2 className="card-title" style={{ marginTop: "1rem" }}>
        Unable to Load Community Data
      </h2>
      <p className="card-description" style={{ margin: "0.5rem 0 1.5rem" }}>
        {message}
      </p>
      {onRetry && (
        <button type="button" className="button button-secondary" onClick={onRetry}>
          <RefreshCw size={16} style={{ marginRight: "6px" }} />
          Retry
        </button>
      )}
    </div>
  );
};
