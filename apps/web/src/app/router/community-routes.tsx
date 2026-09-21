import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { CommunityFeedPage } from "../../features/community/pages/CommunityFeedPage";
import { PostDetailPage } from "../../features/community/pages/PostDetailPage";

export const CommunityRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<CommunityFeedPage />} />
      <Route path="/posts/:postId" element={<PostDetailPage />} />
      <Route path="*" element={<Navigate to="/community" replace />} />
    </Routes>
  );
};
