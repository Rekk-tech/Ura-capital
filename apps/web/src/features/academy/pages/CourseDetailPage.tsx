import React from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronRight, BookOpen } from "lucide-react";
import { useCourseQuery } from "../hooks/use-academy";
import { LessonOutlineList } from "../components/LessonOutlineList";
import { CourseDetailSkeleton, ErrorState, NotFoundState } from "../components/AcademyStates";
import { AcademyApiError } from "../types/academy-ui.types";

export const CourseDetailPage: React.FC = () => {
  const { courseSlug } = useParams<{ courseSlug: string }>();
  const { data, isLoading, isError, error, refetch } = useCourseQuery(courseSlug);

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
      </header>

      <section className="course-syllabus-section" aria-labelledby="syllabus-heading">
        <h2 id="syllabus-heading" className="syllabus-heading">
          Course Outline
        </h2>
        <LessonOutlineList courseSlug={course.slug} lessons={course.lessons} />
      </section>
    </div>
  );
};
