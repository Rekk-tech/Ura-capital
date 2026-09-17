import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { SimulationDashboardPage } from "../../features/simulation/pages/SimulationDashboardPage";

export const SimulationRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<SimulationDashboardPage />} />
      <Route path="/sessions/:simulationId" element={<SimulationDashboardPage />} />
      <Route path="*" element={<Navigate to="/simulation" replace />} />
    </Routes>
  );
};
