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
    <main className="dashboard-page-container min-h-screen py-6 px-4 md:px-8 max-w-7xl mx-auto" id="main-content">
      <div className="dashboard-layout flex flex-col gap-6">
        {/* Profile Hero & Gamification Progression Banner */}
        <DashboardHeader />

        {/* 2-Column Responsive Dashboard Content */}
        <div className="dashboard-content-columns grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (Approx 60-65%): Simulation, Academy, Community */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
            <SimulationSummaryWidget />
            <AcademySummaryWidget />
            <CommunitySummaryWidget />
          </div>

          {/* Right Column (Approx 35-40%): AI Copilot, Upcoming Event, Subscription */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">
            <AIAssistantWidget />
            <UpcomingEventWidget />
            <SubscriptionSummaryWidget />
          </div>
        </div>

        {/* Educational & Regulatory Bottom Disclosure */}
        <footer className="dashboard-footer-disclosure pt-4 pb-8" role="contentinfo">
          <p className="text-xs text-slate-400 text-center leading-relaxed max-w-4xl mx-auto">
            <strong>Platform Disclosure:</strong>{" "}
            <span>
              (Công Bố Nền Tảng) Các mô-đun học tập, bàn giao dịch giả lập, diễn đàn cộng đồng và gói hội viên Aura Capital vận hành hoàn toàn theo tiêu chuẩn mô phỏng phi rủi ro. Không có tiền thật hoặc lệnh môi giới thực tế nào được thực thi trên hệ thống này.
            </span>
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
