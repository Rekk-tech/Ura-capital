import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { SimulationDashboardPage } from "../../features/simulation/pages/SimulationDashboardPage";
import { FomoArenaPage } from "../../features/simulation/pages/FomoArenaPage";
import { ProRoomPage } from "../../features/simulation/pages/ProRoomPage";
import { ProtectedRoute } from "../../features/auth/components/ProtectedRoute";

export const SimulationRoutes: React.FC = () => {
  return (
    <ProtectedRoute>
      <Routes>
        <Route path="/" element={<SimulationDashboardPage />} />
        <Route path="/live" element={<SimulationDashboardPage mode="cockpit" />} />
        <Route path="/sessions/:simulationId" element={<SimulationDashboardPage mode="cockpit" />} />
        <Route path="/map-1" element={<FomoArenaPage />} />
        <Route path="/map-2" element={<ProRoomPage />} />
        <Route path="*" element={<Navigate to="/simulation" replace />} />
      </Routes>
    </ProtectedRoute>
  );
};
