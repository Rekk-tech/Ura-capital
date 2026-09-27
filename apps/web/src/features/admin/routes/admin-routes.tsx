import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AdminRouteGuard } from "../components/AdminRouteGuard";
import { AdminDashboardPage } from "../pages/AdminDashboardPage";

/**
 * FEAT-077: Canonical Admin Routes Mount (FR-001, FR-002, AC-001, AC-002)
 *
 * All admin routes are protected by the authoritative AdminRouteGuard:
 * - /admin -> Admin Dashboard (Overview tab)
 * - /admin/users -> User Management Panel
 * - /admin/moderation -> Content Moderation Desk
 * - /admin/audit -> Security & Audit Trail
 */
export const AdminRoutes: React.FC = () => {
  return (
    <AdminRouteGuard>
      <Routes>
        <Route index element={<AdminDashboardPage initialTab="overview" />} />
        <Route path="users" element={<AdminDashboardPage initialTab="users" />} />
        <Route path="moderation" element={<AdminDashboardPage initialTab="moderation" />} />
        <Route path="audit" element={<AdminDashboardPage initialTab="audit" />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminRouteGuard>
  );
};
