import React from "react";
import { Routes, Route } from "react-router-dom";
import { AppHeader } from "./AppHeader";
import { AppFooter } from "./AppFooter";
import { RouteErrorBoundary } from "../components/RouteErrorBoundary";
import { NotFoundPage } from "../components/NotFoundPage";
import { PlannedRoutePlaceholder } from "../components/PlannedRoutePlaceholder";
import { LandingPage } from "../pages/LandingPage";
import { ROUTE_REGISTRY } from "../router/route-registry";

/**
 * FEAT-070: Standard Application Shell (FR-001, FR-003, FR-004, FR-005, AC-001..AC-005)
 *
 * Provides:
 * - Skip to main content link for keyboard & screen reader accessibility
 * - Persistent responsive AppHeader with active navigation highlighting
 * - RouteErrorBoundary wrapping the route body for fail-safe error presentation
 * - Canonical routing driving available and planned route placeholders
 * - 404 Not Found fallback for unknown paths
 * - Standardized AppFooter with regulatory/educational disclosures
 */
export const AppShell: React.FC = () => {
  return (
    <div className="app-container">
      {/* Accessibility Skip Link */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Global Application Header */}
      <AppHeader />

      {/* Application Main Body with Error Boundary */}
      <div className="app-body">
        <RouteErrorBoundary>
          <Routes>
            {/* Core & Available Domain Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/academy/*"
              element={<PlannedRoutePlaceholder route={ROUTE_REGISTRY.academy} />}
            />
            <Route
              path="/simulation/*"
              element={<PlannedRoutePlaceholder route={ROUTE_REGISTRY.simulation} />}
            />
            <Route
              path="/community/*"
              element={<PlannedRoutePlaceholder route={ROUTE_REGISTRY.community} />}
            />
            <Route
              path="/subscription/*"
              element={<PlannedRoutePlaceholder route={ROUTE_REGISTRY.subscription} />}
            />

            {/* Honest Planned MVP Placeholders */}
            <Route
              path="/dashboard"
              element={<PlannedRoutePlaceholder route={ROUTE_REGISTRY.dashboard} />}
            />
            <Route
              path="/account"
              element={<PlannedRoutePlaceholder route={ROUTE_REGISTRY.account} />}
            />
            <Route
              path="/login"
              element={<PlannedRoutePlaceholder route={ROUTE_REGISTRY.login} />}
            />
            <Route
              path="/register"
              element={<PlannedRoutePlaceholder route={ROUTE_REGISTRY.register} />}
            />
            <Route
              path="/admin"
              element={<PlannedRoutePlaceholder route={ROUTE_REGISTRY.admin} />}
            />
            <Route
              path="/ai"
              element={<PlannedRoutePlaceholder route={ROUTE_REGISTRY.ai} />}
            />

            {/* 404 Fallback for unknown routes */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </RouteErrorBoundary>
      </div>

      {/* Global Application Footer */}
      <AppFooter />
    </div>
  );
};
