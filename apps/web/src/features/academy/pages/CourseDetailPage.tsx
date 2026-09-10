import React from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronRight, BookOpen } from "lucide-react";
import { useCourseQuery, useCourseProgressQuery } from "../hooks/use-academy";
import { LessonOutlineList } from "../components/LessonOutlineList";
import { CourseDetailSkeleton, ErrorState, NotFoundState } from "../components/AcademyStates";
import { AcademyApiError } from "../types/academy-ui.types";

export const CourseDetailPage: React.FC = () => {
  const { courseSlug } = useParams<{ courseSlug: string }>();
  const { data, isLoading, isError, error, refetch } = useCourseQuery(courseSlug);
  const progressQuery = useCourseProgressQuery(courseSlug);

  if (isLoading) {
    return <CourseDetailSkeleton />;
  }

  if (isError) {
    if (error instanceof AcademyApiError && error.status === 404) {
      return (
        <NotFoundState
          title="Course Unavailable"
          message="The requested course does not exist or is currently unavailable."
          backTo="/academy"
          backLabel="Back to Courses"
        />
      );
    }

    return (
      <ErrorState
        message={error instanceof Error ? error.message : "Failed to load course details."}
        onRetry={() => refetch()}
      />
    );
  }

  const course = data?.data;
  if (!course) {
    return (
      <NotFoundState
        title="Course Unavailable"
        message="The requested course could not be loaded."
        backTo="/academy"
        backLabel="Back to Courses"
      />
    );
  }

  const progress = progressQuery.data?.data;
  const derivedLessonCount = course.lessons ? course.lessons.length : 0;
  const levelClass =
    course.level === "BEGINNER"
      ? "badge-beginner"
      : course.level === "INTERMEDIATE"
      ? "badge-intermediate"
      : "badge-advanced";

  return (
    <div className="academy-detail-page">
      <nav className="breadcrumb-nav" aria-label="Breadcrumb navigation">
        <ol className="breadcrumb-list">
          <li className="breadcrumb-item">
            <Link to="/academy" className="breadcrumb-link">
              Academy
            </Link>
          </li>
          <ChevronRight size={14} className="breadcrumb-separator" aria-hidden="true" />
          <li className="breadcrumb-item current" aria-current="page">
            {course.title}
          </li>
        </ol>
      </nav>

      <header className="course-hero-header">
        <div className="course-hero-meta">
          <span className={`badge ${levelClass}`}>
            Level: {course.level.charAt(0) + course.level.slice(1).toLowerCase()}
          </span>
          <span className="lesson-count-pill">
            <BookOpen size={14} aria-hidden="true" className="pill-icon" />
            {derivedLessonCount} {derivedLessonCount === 1 ? "Lesson" : "Lessons"}
          </span>
        </div>

        <h1 className="course-detail-title">{course.title}</h1>

        <p className="course-detail-description">
          {course.description ?? "Explore the concepts and modules covered in this course outline."}
        </p>

        {progress && (
          <div
            className="course-progress-card"
            data-testid="course-progress-card"
            style={{
              marginTop: "1.5rem",
              padding: "1.25rem",
              borderRadius: "0.75rem",
              border: "1px solid var(--color-border, #334155)",
              backgroundColor: "var(--color-surface, #1e293b)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.5rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>Course Progress</span>
                {progress.completed && (
                  <span
                    className="badge badge-completed"
                    data-testid="course-completed-badge"
                    style={{
                      padding: "0.2rem 0.5rem",
                      borderRadius: "9999px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      backgroundColor: "rgba(16, 185, 129, 0.15)",
                      color: "#10b981",
                      border: "1px solid rgba(16, 185, 129, 0.3)",
                    }}
                  >
                    Completed
                  </span>
                )}
              </div>
              <span
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--color-primary, #38bdf8)",
                }}
                data-testid="course-progress-percent"
              >
                {progress.progressPercent}%
              </span>
            </div>

            <div
              style={{
                width: "100%",
                height: "8px",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                borderRadius: "4px",
                overflow: "hidden",
                marginBottom: "0.5rem",
              }}
            >
              <div
                data-testid="course-progress-bar"
                style={{
                  width: `${Math.min(100, Math.max(0, progress.progressPercent))}%`,
                  height: "100%",
                  backgroundColor: progress.completed
                    ? "#10b981"
                    : "var(--color-primary, #38bdf8)",
                  borderRadius: "4px",
                  transition: "width 0.3s ease",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.75rem",
                color: "var(--color-text-muted, #94a3b8)",
              }}
            >
              <span data-testid="course-progress-count">
                {progress.completedLessons} of {progress.totalLessons} lessons completed
              </span>
              {progress.completed && progress.progressPercent < 100 && (
                <span data-testid="curriculum-expanded-notice">
                  Historically completed • curriculum expanded
                </span>
              )}
            </div>
          </div>
        )}
      </header>

      <section className="course-syllabus-section" aria-labelledby="syllabus-heading">
        <h2 id="syllabus-heading" className="syllabus-heading">
          Course Outline
        </h2>
        <LessonOutlineList
          courseSlug={course.slug}
          lessons={course.lessons}
          lessonProgress={progress?.lessons}
        />
      </section>
    </div>
  );
};
