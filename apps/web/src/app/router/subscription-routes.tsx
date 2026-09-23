import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { SubscriptionPage } from "../../features/subscription/pages/SubscriptionPage";

export const SubscriptionRoutes: React.FC = () => (
  <Routes>
    <Route path="/" element={<SubscriptionPage />} />
    <Route path="*" element={<Navigate to="/subscription" replace />} />
  </Routes>
);
