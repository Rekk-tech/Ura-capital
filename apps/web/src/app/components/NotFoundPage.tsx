import React from "react";
import { Link } from "react-router-dom";
import { FileQuestion, Home, BookOpen, TrendingUp } from "lucide-react";

/**
 * FEAT-070: Canonical 404 Not Found Page (FR-004, AC-004)
 *
 * Semantic, accessible 404 presentation for unknown URLs.
 * Guarantees zero sensitive data leakage and provides helpful navigation exits.
 */
export const NotFoundPage: React.FC = () => {
  return (
    <main className="not-found-container" id="main-content">
      <div className="not-found-card">
        <div className="not-found-icon-wrap" aria-hidden="true">
          <FileQuestion size={44} className="text-muted" />
        </div>

        <span className="badge badge-warning" style={{ alignSelf: "center", marginBottom: "0.5rem" }}>
          Status 404
        </span>

        <h1 className="not-found-title">Page Not Found</h1>

        <p className="not-found-copy">
          The requested page does not exist or may have been relocated.
          Please verify the URL address or navigate to one of the available sections below.
        </p>

        <div className="not-found-actions">
          <Link to="/" className="btn btn-primary">
            <Home size={16} aria-hidden="true" />
            <span>Return to Home</span>
          </Link>

          <Link to="/academy" className="btn btn-secondary">
            <BookOpen size={16} aria-hidden="true" />
            <span>Browse Academy</span>
          </Link>

          <Link to="/simulation" className="btn btn-secondary">
            <TrendingUp size={16} aria-hidden="true" />
            <span>Open Simulation</span>
          </Link>
        </div>
      </div>
    </main>
  );
};
