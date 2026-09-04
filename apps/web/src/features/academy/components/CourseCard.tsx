import React from "react";
import { Link } from "react-router-dom";
import { BookOpen, ArrowRight } from "lucide-react";
import { CourseSummaryDto } from "../types/academy-ui.types";

interface CourseCardProps {
  course: CourseSummaryDto;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  const levelClass =
    course.level === "BEGINNER"
      ? "badge-beginner"
      : course.level === "INTERMEDIATE"
      ? "badge-intermediate"
      : "badge-advanced";

  return (
    <article className="academy-card" aria-labelledby={`course-title-${course.slug}`}>
      <div className="card-header-meta">
        <span className={`badge ${levelClass}`}>
          Level: {course.level.charAt(0) + course.level.slice(1).toLowerCase()}
        </span>
        <span className="lesson-count-pill">
          <BookOpen size={14} aria-hidden="true" className="pill-icon" />
          {course.lessonCount} {course.lessonCount === 1 ? "Lesson" : "Lessons"}
        </span>
      </div>

      <h3 id={`course-title-${course.slug}`} className="course-card-title">
        {course.title}
      </h3>

      <p className="course-card-description">
        {course.description ?? "Explore this comprehensive course in the Aura Capital curriculum."}
      </p>

      <div className="course-card-footer">
        <Link
          to={`/academy/courses/${encodeURIComponent(course.slug)}`}
          className="btn-link-outline"
          aria-label={`View outline for ${course.title}`}
        >
          <span>View Outline</span>
          <ArrowRight size={16} aria-hidden="true" className="arrow-icon" />
        </Link>
      </div>
    </article>
  );
};
