import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { SimulationDashboardPage } from "../../features/simulation/pages/SimulationDashboardPage";
import { ProtectedRoute } from "../../features/auth/components/ProtectedRoute";

export const SimulationRoutes: React.FC = () => {
  return (
    <ProtectedRoute>
      <Routes>
        <Route path="/" element={<SimulationDashboardPage mode="maps" />} />
        <Route path="/live" element={<SimulationDashboardPage mode="cockpit" />} />
        <Route path="/sessions/:simulationId" element={<SimulationDashboardPage mode="cockpit" />} />
        <Route path="*" element={<Navigate to="/simulation" replace />} />
      </Routes>
    </ProtectedRoute>
  );
};
