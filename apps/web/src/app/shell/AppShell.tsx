import React from "react";
import { Routes, Route } from "react-router-dom";
import { AppHeader } from "./AppHeader";
import { AppFooter } from "./AppFooter";
import { RouteErrorBoundary } from "../components/RouteErrorBoundary";
import { NotFoundPage } from "../components/NotFoundPage";
import { PlannedRoutePlaceholder } from "../components/PlannedRoutePlaceholder";
import { LandingPage } from "../pages/LandingPage";
import { ROUTE_REGISTRY } from "../router/route-registry";
import { LoginPage } from "../../features/auth/pages/LoginPage";
import { RegisterPage } from "../../features/auth/pages/RegisterPage";
import { AccountPage } from "../../features/auth/pages/AccountPage";
import { DashboardPage } from "../../features/dashboard/pages/DashboardPage";
import { AcademyRoutes } from "../router/academy-routes";

/**
 * FEAT-070 / FEAT-071 / FEAT-072 / FEAT-073: Standard Application Shell (FR-001, FR-003, AC-001)
 *
 * Provides:
 * - Skip to main content link for keyboard & screen reader accessibility
 * - Persistent responsive AppHeader with active navigation highlighting
 * - RouteErrorBoundary wrapping the route body for fail-safe error presentation
 * - Canonical routing driving available views and planned route placeholders
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
            <Route path="/academy/*" element={<AcademyRoutes />} />
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

            {/* Authenticated Account Profile & Auth Entry Surfaces (FEAT-071) */}
            <Route path="/account" element={<AccountPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Authenticated Dashboard (FEAT-072) */}
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Honest Planned MVP Placeholders */}
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
