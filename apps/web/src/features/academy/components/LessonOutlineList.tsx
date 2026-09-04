import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen } from "lucide-react";
import { LessonSummaryDto } from "../types/academy-ui.types";

interface LessonOutlineListProps {
  courseSlug: string;
  lessons: LessonSummaryDto[];
}

export const LessonOutlineList: React.FC<LessonOutlineListProps> = ({ courseSlug, lessons }) => {
  if (!lessons || lessons.length === 0) {
    return (
      <div className="outline-empty-notice" role="status">
        <BookOpen size={20} aria-hidden="true" className="pill-icon" />
        <span>No published lessons are available in this course yet.</span>
      </div>
    );
  }

  return (
    <div className="lesson-outline-container" aria-label="Course syllabus">
      <ol className="lesson-outline-list">
        {lessons.map((lesson, index) => {
          const stepNumber = index + 1;
          const lessonUrl = `/academy/courses/${encodeURIComponent(courseSlug)}/lessons/${encodeURIComponent(lesson.slug)}`;

          return (
            <li key={lesson.slug} className="lesson-outline-item">
              <Link to={lessonUrl} className="lesson-outline-link" aria-label={`Lesson ${stepNumber}: ${lesson.title}`}>
                <div className="outline-number-badge" aria-hidden="true">
                  {stepNumber}
                </div>
                <div className="outline-content">
                  <h4 className="outline-lesson-title">{lesson.title}</h4>
                </div>
                <div className="outline-action" aria-hidden="true">
                  <span className="outline-action-text">Read Lesson</span>
                  <ArrowRight size={16} className="outline-action-icon" />
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
};
