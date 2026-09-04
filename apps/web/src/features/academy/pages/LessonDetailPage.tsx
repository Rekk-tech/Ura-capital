import React from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronRight, ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import { useLessonQuery, useCourseQuery } from "../hooks/use-academy";
import { LessonContent } from "../components/LessonContent";
import { LessonDetailSkeleton, AuthRequiredCard, NotFoundState, ErrorState } from "../components/AcademyStates";
import { AcademyApiError } from "../types/academy-ui.types";

export const LessonDetailPage: React.FC = () => {
  const { courseSlug, lessonSlug } = useParams<{ courseSlug: string; lessonSlug: string }>();

  // Query A: Authenticated lesson content
  const lessonQuery = useLessonQuery(courseSlug, lessonSlug);

  // Query B: Course outline & metadata for navigation
  const courseQuery = useCourseQuery(courseSlug);

  // 1. Handle Lesson Query Loading State
  if (lessonQuery.isLoading) {
    return <LessonDetailSkeleton />;
  }

  // 2. Handle Lesson Query Error States (Authoritative)
  if (lessonQuery.isError) {
    const err = lessonQuery.error;
    if (err instanceof AcademyApiError) {
      if (err.status === 401) {
        return <AuthRequiredCard courseSlug={courseSlug} lessonSlug={lessonSlug} />;
      }
      if (err.status === 404) {
        return (
          <NotFoundState
            title="Lesson Unavailable"
            message="The requested lesson could not be found or is not currently available."
            backTo={courseSlug ? `/academy/courses/${encodeURIComponent(courseSlug)}` : "/academy"}
            backLabel="Back to Course Outline"
          />
        );
      }
    }

    return (
      <ErrorState
        message={err instanceof Error ? err.message : "Failed to load lesson content."}
        onRetry={() => lessonQuery.refetch()}
      />
    );
  }

  const lesson = lessonQuery.data?.data;
  if (!lesson) {
    return (
      <NotFoundState
        title="Lesson Unavailable"
        message="The requested lesson could not be loaded."
        backTo={courseSlug ? `/academy/courses/${encodeURIComponent(courseSlug)}` : "/academy"}
        backLabel="Back to Course Outline"
      />
    );
  }

  // 3. Derive Navigation from Course Detail Query (Query B)
  // If Query B succeeds: derive breadcrumb course title, current index, and adjacent previous/next lessons
  // If Query B fails: gracefully omit adjacent controls and use "Course" fallback breadcrumb
  const course = courseQuery.data?.data;
  const courseTitle = course?.title ?? "Course";
  const lessons = course?.lessons ?? [];

  const currentIndex = lessonSlug ? lessons.findIndex((l) => l.slug === lessonSlug) : -1;
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;
  const positionLabel =
    currentIndex >= 0 && lessons.length > 0 ? `Lesson ${currentIndex + 1} of ${lessons.length}` : "Lesson";

  return (
    <div className="academy-lesson-page">
      {/* Top Breadcrumb Navigation */}
      <nav className="breadcrumb-nav" aria-label="Breadcrumb navigation">
        <ol className="breadcrumb-list">
          <li className="breadcrumb-item">
            <Link to="/academy" className="breadcrumb-link">
              Academy
            </Link>
          </li>
          <ChevronRight size={14} className="breadcrumb-separator" aria-hidden="true" />
          <li className="breadcrumb-item">
            {courseSlug ? (
              <Link to={`/academy/courses/${encodeURIComponent(courseSlug)}`} className="breadcrumb-link">
                {courseTitle}
              </Link>
            ) : (
              <span>{courseTitle}</span>
            )}
          </li>
          <ChevronRight size={14} className="breadcrumb-separator" aria-hidden="true" />
          <li className="breadcrumb-item current" aria-current="page">
            {lesson.title}
          </li>
        </ol>
      </nav>

      {/* Centered Reading Column */}
      <article className="lesson-reading-column" aria-labelledby="lesson-main-heading">
        <header className="lesson-header">
          <div className="lesson-position-badge">
            <BookOpen size={14} aria-hidden="true" className="pill-icon" />
            <span>{positionLabel}</span>
          </div>

          <h1 id="lesson-main-heading" className="lesson-main-title">
            {lesson.title}
          </h1>
        </header>

        {/* Sanitized Markdown Educational Content */}
        <main className="lesson-content-container">
          <LessonContent content={lesson.content} />
        </main>

        {/* Dual Navigation: Bottom Footer Controls */}
        <footer className="lesson-footer-nav" aria-label="Lesson navigation">
          <div className="footer-nav-col left">
            {prevLesson && courseSlug ? (
              <Link
                to={`/academy/courses/${encodeURIComponent(courseSlug)}/lessons/${encodeURIComponent(prevLesson.slug)}`}
                className="btn btn-outline footer-nav-btn prev-btn"
                aria-label={`Previous lesson: ${prevLesson.title}`}
              >
                <ArrowLeft size={16} aria-hidden="true" className="btn-icon" />
                <div className="nav-btn-text">
                  <span className="nav-btn-sub">Previous</span>
                  <span className="nav-btn-title">{prevLesson.title}</span>
                </div>
              </Link>
            ) : null}
          </div>

          <div className="footer-nav-col center">
            {courseSlug && (
              <Link
                to={`/academy/courses/${encodeURIComponent(courseSlug)}`}
                className="btn-link-outline center-outline-link"
                aria-label="Return to course outline"
              >
                Course Outline
              </Link>
            )}
          </div>

          <div className="footer-nav-col right">
            {nextLesson && courseSlug ? (
              <Link
                to={`/academy/courses/${encodeURIComponent(courseSlug)}/lessons/${encodeURIComponent(nextLesson.slug)}`}
                className="btn btn-primary footer-nav-btn next-btn"
                aria-label={`Next lesson: ${nextLesson.title}`}
              >
                <div className="nav-btn-text">
                  <span className="nav-btn-sub">Next</span>
                  <span className="nav-btn-title">{nextLesson.title}</span>
                </div>
                <ArrowRight size={16} aria-hidden="true" className="btn-icon" />
              </Link>
            ) : null}
          </div>
        </footer>
      </article>
    </div>
  );
};
