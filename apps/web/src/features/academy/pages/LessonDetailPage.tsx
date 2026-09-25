import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronRight, ArrowLeft, ArrowRight, BookOpen, Layers, CheckCircle } from "lucide-react";
import {
  useLessonQuery,
  useCourseQuery,
  useLessonQuizQuery,
  useCurrentQuizAttemptQuery,
  useStartQuizAttemptMutation,
  useSaveDraftQuizAnswerMutation,
  useSubmitQuizAttemptMutation,
  useGradedQuizResultQuery,
  useCompleteLessonMutation,
  useMyXpQuery,
} from "../hooks/use-academy";
import { LessonContent } from "../components/LessonContent";
import { LearnerXpDisplay } from "../components/LearnerXpDisplay";
import { LessonDetailSkeleton, AuthRequiredCard, NotFoundState, ErrorState } from "../components/AcademyStates";
import { QuizPlayer } from "../components/QuizPlayer";
import { AcademyApiError } from "../types/academy-ui.types";


export const LessonDetailPage: React.FC = () => {
  const params = useParams<{
    courseSlug?: string;
    courseId?: string;
    lessonSlug?: string;
    lessonId?: string;
  }>();
  const courseSlug = params.courseSlug || params.courseId;
  const lessonSlug = params.lessonSlug || params.lessonId;

  // Query A: Authenticated lesson content
  const lessonQuery = useLessonQuery(courseSlug, lessonSlug);

  // Query B: Course outline & metadata for navigation
  const courseQuery = useCourseQuery(courseSlug);

  // Query C: Lesson Quiz Definition (FEAT-023)
  const quizQuery = useLessonQuizQuery(courseSlug, lessonSlug);

  // Query D & Mutations: Quiz Attempt Lifecycle (FEAT-024 & FEAT-025)
  const currentAttemptQuery = useCurrentQuizAttemptQuery(courseSlug, lessonSlug);
  const startAttemptMutation = useStartQuizAttemptMutation();
  const saveDraftMutation = useSaveDraftQuizAnswerMutation();
  const submitAttemptMutation = useSubmitQuizAttemptMutation();
  const completeLessonMutation = useCompleteLessonMutation();
  const xpQuery = useMyXpQuery();
  const [savingQuestionId, setSavingQuestionId] = useState<string | null>(null);

  const [saveError, setSaveError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [completeError, setCompleteError] = useState<string | null>(null);

  const activeAttempt =
    currentAttemptQuery.data?.data && currentAttemptQuery.data.data.status === "IN_PROGRESS"
      ? currentAttemptQuery.data.data
      : null;

  const gradedAttemptId =
    currentAttemptQuery.data?.data && currentAttemptQuery.data.data.status === "GRADED"
      ? currentAttemptQuery.data.data.id
      : submitAttemptMutation.data?.data
        ? submitAttemptMutation.data.data.attemptId
        : undefined;

  const gradedResultQuery = useGradedQuizResultQuery(gradedAttemptId);
  const gradedResult = submitAttemptMutation.data?.data ?? gradedResultQuery.data?.data;

  const isLessonCompleted = Boolean(
    lessonQuery.data?.data?.progress?.completed ||
      completeLessonMutation.isSuccess ||
      (gradedResult && gradedResult.passed),
  );

  const handleStartQuiz = () => {
    if (!courseSlug || !lessonSlug) return;
    setSubmitError(null);
    startAttemptMutation.mutate({ courseSlug, lessonSlug });
  };

  const handleCompleteLesson = () => {
    if (!courseSlug || !lessonSlug) return;
    setCompleteError(null);
    completeLessonMutation.mutate(
      { courseSlug, lessonSlug },
      {
        onError: (err: unknown) => {
          if (err instanceof AcademyApiError) {
            setCompleteError(err.message);
          } else if (err instanceof Error) {
            setCompleteError(err.message);
          } else {
            setCompleteError("Failed to complete lesson.");
          }
        },
      },
    );
  };

  const handleSubmitQuiz = () => {
    if (!activeAttempt || !courseSlug || !lessonSlug) return;
    setSubmitError(null);
    submitAttemptMutation.mutate({
      attemptId: activeAttempt.id,
      courseSlug,
      lessonSlug,
    }, {
      onError: (err) => {
        setSubmitError(err instanceof Error ? err.message : "Failed to submit quiz.");
      },
    });
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    if (!activeAttempt || !courseSlug || !lessonSlug) return;
    setSavingQuestionId(questionId);
    setSaveError(null);
    saveDraftMutation.mutate(
      {
        attemptId: activeAttempt.id,
        questionId,
        optionId,
        courseSlug,
        lessonSlug,
      },
      {
        onError: (err) => {
          setSaveError(err instanceof Error ? err.message : "Failed to save draft answer.");
        },
        onSettled: () => {
          setSavingQuestionId(null);
        },
      },
    );
  };

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
          <div className="lesson-header-meta" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <div className="lesson-position-badge">
                <BookOpen size={14} aria-hidden="true" className="pill-icon" />
                <span>{positionLabel}</span>
              </div>
              {isLessonCompleted && (
                <span
                  data-testid="lesson-completed-badge"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0.25rem 0.6rem",
                    borderRadius: "9999px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    backgroundColor: "rgba(16, 185, 129, 0.15)",
                    color: "#10b981",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                  }}
                >
                  <CheckCircle size={13} aria-hidden="true" />
                  Completed
                </span>
              )}
            </div>
            {xpQuery.data?.data && (
              <LearnerXpDisplay totalXp={xpQuery.data.data.totalXp} />
            )}
            {courseSlug && lessonSlug && (
              <Link
                to={`/academy/courses/${encodeURIComponent(courseSlug)}/lessons/${encodeURIComponent(lessonSlug)}/flashcards`}
                className="btn btn-outline lesson-flashcards-link"
                aria-label="Study Flashcards for this lesson"
                data-testid="study-flashcards-button"
              >
                <Layers size={14} aria-hidden="true" style={{ marginRight: "0.4rem", display: "inline" }} />
                Study Flashcards
              </Link>
            )}
          </div>

          <h1 id="lesson-main-heading" className="lesson-main-title">
            {lesson.title}
          </h1>
        </header>

        {/* Sanitized Markdown Educational Content */}
        <main className="lesson-content-container">
          <LessonContent content={lesson.content} />
        </main>

        {/* FEAT-026 Informational Lesson Completion Section */}
        {!quizQuery.data?.data && !quizQuery.isLoading && (
          <section
            className="informational-lesson-completion-section"
            data-testid="informational-lesson-completion"
            style={{
              marginTop: "2rem",
              padding: "1.5rem",
              borderRadius: "0.75rem",
              border: "1px solid var(--color-border, #334155)",
              backgroundColor: "var(--color-surface, #1e293b)",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              alignItems: "flex-start",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <CheckCircle
                size={20}
                style={{ color: isLessonCompleted ? "#10b981" : "var(--color-primary, #38bdf8)" }}
                aria-hidden="true"
              />
              <h2 style={{ fontSize: "1.125rem", fontWeight: 600, margin: 0 }}>
                {isLessonCompleted ? "Lesson Completed" : "Complete Lesson"}
              </h2>
            </div>
            <p style={{ color: "var(--color-text-muted, #94a3b8)", margin: 0, fontSize: "0.875rem" }}>
              {isLessonCompleted
                ? "You have completed this lesson. You can proceed to the next module."
                : "When you have finished reviewing the material, mark this lesson as complete to track your course progression."}
            </p>
            {!isLessonCompleted ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleCompleteLesson}
                disabled={completeLessonMutation.isPending}
                data-testid="mark-lesson-complete-button"
                style={{ cursor: completeLessonMutation.isPending ? "not-allowed" : "pointer" }}
              >
                {completeLessonMutation.isPending ? "Marking Complete..." : "Mark Lesson as Complete"}
              </button>
            ) : (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  color: "#10b981",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                }}
              >
                <CheckCircle size={16} aria-hidden="true" />
                <span>Marked as complete</span>
              </div>
            )}
            {completeError && (
              <p style={{ color: "#ef4444", fontSize: "0.875rem", margin: 0 }} data-testid="complete-lesson-error">
                {completeError}
              </p>
            )}
          </section>
        )}

        {/* FEAT-023 / FEAT-073 Interactive Quiz Player */}
        {quizQuery.data?.data && (
          <QuizPlayer
            quiz={quizQuery.data.data}
            activeAttempt={activeAttempt}
            gradedResult={gradedResult ?? null}
            isStarting={startAttemptMutation.isPending}
            isSaving={saveDraftMutation.isPending}
            isSubmitting={submitAttemptMutation.isPending}
            savingQuestionId={savingQuestionId}
            startError={
              startAttemptMutation.isError
                ? startAttemptMutation.error instanceof Error
                  ? startAttemptMutation.error.message
                  : "Failed to start quiz attempt."
                : null
            }
            saveError={saveError}
            submitError={submitError}
            onStartAttempt={handleStartQuiz}
            onSelectOption={handleSelectOption}
            onSubmitAttempt={handleSubmitQuiz}
            onRetakeQuiz={handleStartQuiz}
            serverXp={xpQuery.data?.data?.totalXp}
          />
        )}

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
