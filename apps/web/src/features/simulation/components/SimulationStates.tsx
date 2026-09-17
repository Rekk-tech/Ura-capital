import React from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Lock, HelpCircle, RefreshCw, PlusCircle } from "lucide-react";

export const SimulationLoadingSkeleton: React.FC = () => {
  return (
    <div className="simulation-skeleton-container" data-testid="simulation-loading-skeleton">
      <div className="skeleton-box skeleton-header" style={{ height: "60px", marginBottom: "1.5rem" }} />
      <div className="skeleton-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <div className="skeleton-box" style={{ height: "100px" }} />
        <div className="skeleton-box" style={{ height: "100px" }} />
        <div className="skeleton-box" style={{ height: "100px" }} />
        <div className="skeleton-box" style={{ height: "100px" }} />
      </div>
      <div className="skeleton-box" style={{ height: "300px" }} />
    </div>
  );
};

export const SimulationAuthRequiredCard: React.FC<{ message?: string }> = ({
  message = "Please sign in to access your investment simulation session.",
}) => {
  return (
    <div className="card simulation-state-card" data-testid="simulation-auth-card">
      <div className="card-icon-wrap" style={{ background: "rgba(239, 68, 68, 0.15)", color: "var(--status-error)" }}>
        <Lock size={28} aria-hidden="true" />
      </div>
      <h2 className="card-title" style={{ marginTop: "1rem" }}>Authentication Required</h2>
      <p className="card-description" style={{ margin: "0.5rem 0 1.5rem" }}>{message}</p>
      <Link to="/" className="button button-primary">
        Return to Home / Sign In
      </Link>
    </div>
  );
};

export const SimulationNotFoundCard: React.FC<{
  title?: string;
  message?: string;
  onCreateNew?: () => void;
}> = ({
  title = "Simulation Session Not Found",
  message = "The requested simulation session does not exist or you do not have permission to view it.",
  onCreateNew,
}) => {
  return (
    <div className="card simulation-state-card" data-testid="simulation-not-found-card">
      <div className="card-icon-wrap" style={{ background: "rgba(245, 158, 11, 0.15)", color: "var(--status-warning)" }}>
        <HelpCircle size={28} aria-hidden="true" />
      </div>
      <h2 className="card-title" style={{ marginTop: "1rem" }}>{title}</h2>
      <p className="card-description" style={{ margin: "0.5rem 0 1.5rem" }}>{message}</p>
      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
        <Link to="/simulation" className="button button-secondary">
          View My Simulations
        </Link>
        {onCreateNew && (
          <button type="button" className="button button-primary" onClick={onCreateNew}>
            <PlusCircle size={16} style={{ marginRight: "6px" }} />
            Start New Simulation
          </button>
        )}
      </div>
    </div>
  );
};

export const SimulationErrorState: React.FC<{
  message?: string;
  onRetry?: () => void;
}> = ({
  message = "An unexpected error occurred while communicating with the simulation engine.",
  onRetry,
}) => {
  return (
    <div className="card simulation-state-card" data-testid="simulation-error-card" role="alert">
      <div className="card-icon-wrap" style={{ background: "rgba(239, 68, 68, 0.15)", color: "var(--status-error)" }}>
        <AlertCircle size={28} aria-hidden="true" />
      </div>
      <h2 className="card-title" style={{ marginTop: "1rem" }}>Engine Communication Error</h2>
      <p className="card-description" style={{ margin: "0.5rem 0 1.5rem" }}>{message}</p>
      {onRetry && (
        <button type="button" className="button button-primary" onClick={onRetry}>
          <RefreshCw size={16} style={{ marginRight: "6px" }} />
          Retry Request
        </button>
      )}
    </div>
  );
};
