import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Award, Layers } from "lucide-react";
import { useAuth } from "../../auth/context/AuthContext";
import { academyApi } from "../../../api/academy.api";
import { DashboardWidgetWrapper } from "./DashboardWidgetWrapper";

/**
 * FEAT-072: Academy Learning Progress Widget (FR-001, FR-003, FR-004, AC-001..AC-008)
 *
 * Bounded client composition of existing Academy read contracts:
 * - academyApi.getMyXp (authenticated)
 * - academyApi.listCourses (limit: 3)
 * Non-authoritative presentation: links to /academy for all progression actions.
 */
export const AcademySummaryWidget: React.FC = () => {
  const { accessToken } = useAuth();

  const xpQuery = useQuery({
    queryKey: ["dashboard", "academy", "xp"],
    queryFn: ({ signal }) => academyApi.getMyXp(accessToken ?? undefined, { signal }),
    enabled: Boolean(accessToken),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: process.env.NODE_ENV === "test" ? false : 1,
  });

  const coursesQuery = useQuery({
    queryKey: ["dashboard", "academy", "courses"],
    queryFn: ({ signal }) => academyApi.listCourses({ limit: 3 }, { signal }),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: process.env.NODE_ENV === "test" ? false : 1,
  });

  const isLoading = xpQuery.isLoading || coursesQuery.isLoading;
  const isError = xpQuery.isError || coursesQuery.isError;

  const handleRetry = () => {
    if (xpQuery.isError) void xpQuery.refetch();
    if (coursesQuery.isError) void coursesQuery.refetch();
  };

  const totalXp = xpQuery.data?.data?.totalXp ?? 0;
  const courses = coursesQuery.data?.data ?? [];

  return (
    <DashboardWidgetWrapper
      title="Academy Learning"
      icon={<BookOpen size={20} className="text-accent" />}
      domainUrl="/academy"
      domainLabel="View Academy"
      isLoading={isLoading}
      isError={isError}
      errorMessage="Unable to load Academy progress. Please check your connection."
      onRetry={handleRetry}
      testId="dashboard-widget-academy"
    >
      <div className="widget-body">
        {/* Metric Row */}
        <div className="widget-metric-card">
          <div className="metric-icon-wrap" aria-hidden="true">
            <Award size={22} className="text-warning" />
          </div>
          <div className="metric-details">
            <span className="metric-label">Total Experience Points</span>
            <span className="metric-value font-mono" data-testid="learner-xp-value">
              {totalXp.toLocaleString()} XP
            </span>
          </div>
        </div>

        {/* Featured Courses List */}
        <div className="widget-section">
          <div className="widget-section-header">
            <span className="widget-section-title">Available Curricula</span>
            <span className="badge badge-info">{courses.length} Courses</span>
          </div>

          {courses.length === 0 ? (
            <div className="widget-empty-state">
              <Layers size={24} className="text-muted" aria-hidden="true" />
              <p className="text-muted">No courses currently available.</p>
            </div>
          ) : (
            <ul className="widget-list" role="list">
              {courses.map((course) => (
                <li key={course.slug} className="widget-list-item">
                  <div className="item-info">
                    <span className="item-title">{course.title}</span>
                    <span className="item-meta text-muted">
                      {course.level} • {course.lessonCount} {course.lessonCount === 1 ? "lesson" : "lessons"}
                    </span>
                  </div>
                  <Link
                    to={`/academy`}
                    className="btn btn-outline btn-xs"
                    aria-label={`Start course: ${course.title}`}
                  >
                    Start
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardWidgetWrapper>
  );
};
