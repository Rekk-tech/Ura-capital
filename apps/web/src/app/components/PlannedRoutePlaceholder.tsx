import React from "react";
import { Link } from "react-router-dom";
import { Clock, Home, ArrowLeft } from "lucide-react";
import { RouteMetadata } from "../router/route-registry";

interface Props {
  route: RouteMetadata;
}

/**
 * FEAT-070: Honest Planned Route Placeholder (FR-002, FR-004, AC-002, AC-004)
 *
 * Renders an honest status for features that are planned or deferred.
 * Never claims an unavailable feature is implemented or active.
 */
export const PlannedRoutePlaceholder: React.FC<Props> = ({ route }) => {
  const isDeferred = route.status === "DEFERRED";
  const badgeClass = isDeferred ? "badge badge-neutral" : "badge badge-info";
  const statusLabel = isDeferred ? "Deferred for AI Enhancement" : "Planned for MVP Release";

  return (
    <main className="placeholder-container" id="main-content">
      <div className="placeholder-card">
        <div className="placeholder-icon-wrap" aria-hidden="true">
          <Clock size={40} className="text-accent" />
        </div>

        <span className={badgeClass} style={{ alignSelf: "center", marginBottom: "0.5rem" }}>
          {statusLabel}
        </span>

        <h1 className="placeholder-title">{route.title}</h1>

        <p className="placeholder-copy">{route.description}</p>

        <div className="placeholder-meta">
          <span>Owning Feature: <strong>{route.owningFeature}</strong></span>
          <span>Status: <strong>{route.status}</strong></span>
        </div>

        <p className="placeholder-subcopy">
          This feature is scheduled in the product roadmap.
          Please use the available Academy, Simulation, and Community features below.
        </p>

        <div className="placeholder-actions">
          <Link to="/" className="btn btn-primary">
            <Home size={16} aria-hidden="true" />
            <span>Return to Home</span>
          </Link>
          <button type="button" className="btn btn-secondary" onClick={() => window.history.back()}>
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    </main>
  );
};
