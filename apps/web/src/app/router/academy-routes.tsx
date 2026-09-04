import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { CourseCatalogPage } from "../../features/academy/pages/CourseCatalogPage";
import { CourseDetailPage } from "../../features/academy/pages/CourseDetailPage";
import { LessonDetailPage } from "../../features/academy/pages/LessonDetailPage";

export const AcademyRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<CourseCatalogPage />} />
      <Route path="/courses" element={<Navigate to="/academy" replace />} />
      <Route path="/courses/:courseSlug" element={<CourseDetailPage />} />
      <Route path="/courses/:courseSlug/lessons/:lessonSlug" element={<LessonDetailPage />} />
    </Routes>
  );
};
