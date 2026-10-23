import React from "react";
import { ProtectedRoute } from "../../auth/components/ProtectedRoute";
import { DashboardHeader } from "../components/DashboardHeader";
import { AcademySummaryWidget } from "../components/AcademySummaryWidget";
import { SimulationSummaryWidget } from "../components/SimulationSummaryWidget";
import { CommunitySummaryWidget } from "../components/CommunitySummaryWidget";
import { SubscriptionSummaryWidget } from "../components/SubscriptionSummaryWidget";
import { AIAssistantWidget } from "../components/AIAssistantWidget";
import { UpcomingEventWidget } from "../components/UpcomingEventWidget";

/**
 * FEAT-072: Learner Dashboard & Cross-Domain Summary Page (FR-001..FR-008, AC-001..AC-008)
 *
 * Implements high-fidelity redesigned learner dashboard:
 * - Profile hero with gamification level bar, badges, and server authority notice
 * - Left column (65%): Simulation Portfolio, Academy Learning, Community Discussions
 * - Right column (35%): Aura AI Copilot, Upcoming Event, Membership Subscription
 * - Platform educational & non-brokerage regulatory disclosure
 */
const DashboardView: React.FC = () => {
  return (
    <main className="overview-dashboard-container" id="main-content">
      {/* Profile Hero & Gamification Progression Banner */}
      <DashboardHeader />

      {/* 2-Column Responsive Dashboard Content */}
      <div className="overview-dashboard-grid">
        {/* Left Column (Main): Simulation, Academy, Community */}
        <div className="overview-col-main">
          <SimulationSummaryWidget />
          <AcademySummaryWidget />
          <CommunitySummaryWidget />
        </div>

        {/* Right Column (Side): AI Copilot, Upcoming Event, Subscription */}
        <div className="overview-col-side">
          <AIAssistantWidget />
          <UpcomingEventWidget />
          <SubscriptionSummaryWidget />
        </div>
      </div>

      {/* Educational & Regulatory Bottom Disclosure */}
      <footer className="overview-platform-disclosure" role="contentinfo">
        <p>
          <strong>Platform Disclosure:</strong>{" "}
          <span>
            (Công Bố Nền Tảng) Các mô-đun học tập, bàn giao dịch giả lập, diễn đàn cộng đồng và gói hội viên Aura Capital vận hành hoàn toàn theo tiêu chuẩn mô phỏng phi rủi ro. Không có tiền thật hoặc lệnh môi giới thực tế nào được thực thi trên hệ thống này.
          </span>
        </p>
      </footer>
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
