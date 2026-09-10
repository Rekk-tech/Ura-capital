import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, CheckCircle } from "lucide-react";
import { LessonSummaryDto, LessonProgressDto } from "../types/academy-ui.types";

interface LessonOutlineListProps {
  courseSlug: string;
  lessons: LessonSummaryDto[];
  lessonProgress?: LessonProgressDto[];
}

export const LessonOutlineList: React.FC<LessonOutlineListProps> = ({
  courseSlug,
  lessons,
  lessonProgress,
}) => {
  if (!lessons || lessons.length === 0) {
    return (
      <div className="outline-empty-notice" role="status">
        <BookOpen size={20} aria-hidden="true" className="pill-icon" />
        <span>No published lessons are available in this course yet.</span>
      </div>
    );
  }

  const completedSet = new Set<string>();
  if (lessonProgress) {
    for (const lp of lessonProgress) {
      if (lp.completed) {
        completedSet.add(lp.lessonSlug);
      }
    }
  }

  return (
    <div className="lesson-outline-container" aria-label="Course syllabus">
      <ol className="lesson-outline-list">
        {lessons.map((lesson, index) => {
          const stepNumber = index + 1;
          const isCompleted = completedSet.has(lesson.slug);
          const lessonUrl = `/academy/courses/${encodeURIComponent(courseSlug)}/lessons/${encodeURIComponent(lesson.slug)}`;

          return (
            <li key={lesson.slug} className="lesson-outline-item">
              <Link to={lessonUrl} className="lesson-outline-link" aria-label={`Lesson ${stepNumber}: ${lesson.title}`}>
                <div
                  className="outline-number-badge"
                  aria-hidden="true"
                  style={isCompleted ? { backgroundColor: "rgba(16, 185, 129, 0.2)", color: "#10b981", borderColor: "#10b981" } : undefined}
                >
                  {isCompleted ? <CheckCircle size={14} /> : stepNumber}
                </div>
                <div className="outline-content">
                  <h4 className="outline-lesson-title">{lesson.title}</h4>
                </div>
                <div className="outline-action" aria-hidden="true">
                  {isCompleted ? (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        color: "#10b981",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        marginRight: "0.5rem",
                      }}
                      data-testid={`lesson-completed-indicator-${lesson.slug}`}
                    >
                      <CheckCircle size={13} />
                      Completed
                    </span>
                  ) : null}
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
