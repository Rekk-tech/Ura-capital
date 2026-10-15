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

  const levelViText =
    course.level === "BEGINNER"
      ? "Cơ Bản"
      : course.level === "INTERMEDIATE"
      ? "Trung Cấp"
      : "Nâng Cao";

  return (
    <article className="academy-card" aria-labelledby={`course-title-${course.slug}`}>
      <div className="card-header-meta">
        <span className={`badge ${levelClass}`}>
          <span>{levelViText}</span>
          <span className="sr-only">
            Level: {course.level.charAt(0) + course.level.slice(1).toLowerCase()}
          </span>
        </span>
        <span className="lesson-count-pill">
          <BookOpen size={14} aria-hidden="true" className="pill-icon" />
          <span>{course.lessonCount} bài học</span>
          <span className="sr-only">
            {course.lessonCount} {course.lessonCount === 1 ? "Lesson" : "Lessons"}
          </span>
        </span>
      </div>

      <h3 id={`course-title-${course.slug}`} className="course-card-title">
        {course.title}
      </h3>

      <p className="course-card-description">
        {course.description ?? "Khám phá khóa học chuyên sâu trong lộ trình đào tạo Aura Capital."}
      </p>

      <div className="course-card-footer">
        <Link
          to={`/academy/courses/${encodeURIComponent(course.slug)}`}
          className="btn-link-outline"
          aria-label={`View outline for ${course.title}`}
        >
          <span>Xem Đề Cương Khóa Học</span>
          <span className="sr-only">View Outline</span>
          <ArrowRight size={16} aria-hidden="true" className="arrow-icon" />
        </Link>
      </div>
    </article>
  );
};
