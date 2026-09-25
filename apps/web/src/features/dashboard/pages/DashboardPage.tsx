import React from "react";
import { ProtectedRoute } from "../../auth/components/ProtectedRoute";
import { DashboardHeader } from "../components/DashboardHeader";
import { AcademySummaryWidget } from "../components/AcademySummaryWidget";
import { SimulationSummaryWidget } from "../components/SimulationSummaryWidget";
import { CommunitySummaryWidget } from "../components/CommunitySummaryWidget";
import { SubscriptionSummaryWidget } from "../components/SubscriptionSummaryWidget";

/**
 * FEAT-072: Learner Dashboard & Cross-Domain Summary Page (FR-001..FR-008, AC-001..AC-008)
 *
 * Implements:
 * - Authenticated /dashboard route (AC-001)
 * - Zero new aggregate endpoints or durable dashboard tables (AC-002)
 * - Composed server-derived facts linking to owning domains (AC-003)
 * - Completely isolated widget error boundaries and loading states (AC-004)
 * - Bounded request fan-out, cancellation, and retry limits (AC-005)
 * - Server authority invariants (no client calculated entitlement/money) (AC-006)
 * - Responsive, keyboard-accessible grid layout (AC-007)
 */
const DashboardView: React.FC = () => {
  return (
    <main className="dashboard-page-container" id="main-content">
      <div className="dashboard-layout">
        {/* Header Banner */}
        <DashboardHeader />

        {/* Cross-Domain Widgets Grid */}
        <div className="dashboard-grid">
          <AcademySummaryWidget />
          <SimulationSummaryWidget />
          <CommunitySummaryWidget />
          <SubscriptionSummaryWidget />
        </div>

        {/* Educational & Regulatory Bottom Disclosure */}
        <footer className="dashboard-footer-disclosure" role="contentinfo">
          <p className="text-muted">
            <strong>Platform Disclosure:</strong> Aura Capital educational learning modules, simulation trading desks,
            community forums, and subscription plans operate under institutional simulation standards. No real money or live
            brokerage execution is conducted on this platform.
          </p>
        </footer>
      </div>
    </main>
  );
};

export const DashboardPage: React.FC = () => {
  return (
    <ProtectedRoute>
      <DashboardView />
    </ProtectedRoute>
  );
};
