import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  CheckCircle,
  Lock,
  Menu,
  X,
  ShieldCheck,
  Award,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "../../auth/context/AuthContext";
import {
  useCourseQuery,
  useCourseLessonsQuery,
  useLessonContentQuery,
  useMarkLessonCompleteMutation,
} from "../hooks/use-academy";
import { LessonContent } from "./LessonContent";
import { AuthRequiredCard, NotFoundState, ErrorState } from "./AcademyStates";
import { AcademyApiError } from "../types/academy-ui.types";

export const CoursePlayerView: React.FC = () => {
  const params = useParams<{ courseSlug?: string; lessonSlug?: string }>();
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  const courseSlug = params.courseSlug ?? "";
  const lessonSlug = params.lessonSlug ?? "";

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [completeError, setCompleteError] = useState<string | null>(null);

  // Queries
  const courseQuery = useCourseQuery(courseSlug);
  const lessonsQuery = useCourseLessonsQuery(courseSlug, accessToken);
  const lessonQuery = useLessonContentQuery(courseSlug, lessonSlug, accessToken);
  const markCompleteMutation = useMarkLessonCompleteMutation();

  // Scroll to top upon lesson navigation
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      typeof window.scrollTo === "function" &&
      (typeof process === "undefined" || process.env?.NODE_ENV !== "test")
    ) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setCompleteError(null);
  }, [lessonSlug]);

  // Loading State
  if (courseQuery.isLoading || lessonsQuery.isLoading || lessonQuery.isLoading) {
    return (
      <div
        className="course-player-loading-container"
        data-testid="course-player-loading"
        aria-busy="true"
        aria-label="Loading course player"
        style={{ display: "flex", minHeight: "80vh", width: "100%", backgroundColor: "var(--bg-app, #0f172a)" }}
      >
        <div role="status" className="sr-only">
          Loading lesson and player content...
        </div>
        {/* Sidebar Skeleton */}
        <div
          style={{
            width: "320px",
            borderRight: "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
            padding: "1.5rem",
            backgroundColor: "var(--bg-surface, #1e293b)",
          }}
        >
          <div className="skeleton-line skeleton-title" style={{ width: "80%", height: "24px", marginBottom: "1.5rem" }} />
          <div className="skeleton-line skeleton-desc" style={{ width: "100%", height: "12px", marginBottom: "2rem" }} />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton-line" style={{ width: "90%", height: "36px", marginBottom: "0.75rem", borderRadius: "8px" }} />
          ))}
        </div>
        {/* Main Panel Skeleton */}
        <div style={{ flex: 1, padding: "2rem 3rem" }}>
          <div className="skeleton-line skeleton-pill" style={{ width: "140px", height: "20px", marginBottom: "1rem" }} />
          <div className="skeleton-line skeleton-title large" style={{ width: "70%", height: "36px", marginBottom: "2rem" }} />
          <div className="skeleton-line skeleton-desc" style={{ width: "100%", height: "16px", marginBottom: "0.75rem" }} />
          <div className="skeleton-line skeleton-desc" style={{ width: "95%", height: "16px", marginBottom: "0.75rem" }} />
          <div className="skeleton-line skeleton-desc" style={{ width: "85%", height: "16px", marginBottom: "0.75rem" }} />
        </div>
      </div>
    );
  }

  // Handle Authoritative Auth-Required (401)
  if (lessonQuery.isError && lessonQuery.error instanceof AcademyApiError && lessonQuery.error.status === 401) {
    return (
      <div data-testid="course-player-auth-required" style={{ padding: "3rem 1rem", maxWidth: "600px", margin: "0 auto" }}>
        <AuthRequiredCard
          courseSlug={courseSlug}
          lessonSlug={lessonSlug}
          returnPath={`/academy/courses/${encodeURIComponent(courseSlug)}/player/${encodeURIComponent(lessonSlug)}`}
        />
      </div>
    );
  }

  // Handle 404 Not Found
  if (
    courseQuery.isError ||
    lessonQuery.isError ||
    !courseQuery.data?.data ||
    !lessonQuery.data?.data
  ) {
    const is404 =
      (courseQuery.error instanceof AcademyApiError && courseQuery.error.status === 404) ||
      (lessonQuery.error instanceof AcademyApiError && lessonQuery.error.status === 404);

    if (is404) {
      return (
        <div data-testid="course-player-not-found" style={{ padding: "3rem 1rem", maxWidth: "600px", margin: "0 auto" }}>
          <NotFoundState
            title="Lesson Unavailable"
            message="The requested lesson or course could not be located in the curriculum."
            backTo="/academy/learning-path"
            backLabel="Back to Learning Path"
          />
        </div>
      );
    }

    return (
      <div data-testid="course-player-error" style={{ padding: "3rem 1rem", maxWidth: "600px", margin: "0 auto" }}>
        <ErrorState
          message="Failed to load course player. Please try again."
          onRetry={() => {
            courseQuery.refetch();
            lessonsQuery.refetch();
            lessonQuery.refetch();
          }}
        />
      </div>
    );
  }

  const course = courseQuery.data.data;
  const lesson = lessonQuery.data.data;
  const lessonsData = lessonsQuery.data?.data;
  const playerLessons = lessonsData?.lessons ?? [];
  const completedCount = lessonsData?.completedCount ?? 0;
  const totalLessons = lessonsData?.totalCount ?? playerLessons.length;
  const progressPercent = lessonsData?.progressPercent ?? 0;

  // Determine current lesson position and adjacent lessons
  const currentIndex = playerLessons.findIndex((l) => l.slug === lessonSlug);
  const currentMeta = currentIndex >= 0 ? playerLessons[currentIndex] : null;
  const prevLesson = currentIndex > 0 ? playerLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < playerLessons.length - 1 ? playerLessons[currentIndex + 1] : null;

  // Determine if lesson is locked (FR-006 / AC-006)
  const isCurrentLessonLocked = Boolean(currentMeta?.isLocked);
  const isCurrentLessonCompleted = Boolean(currentMeta?.isCompleted || lesson.progress?.completed);

  const handleCompleteAndContinue = () => {
    if (!courseSlug || !lessonSlug || markCompleteMutation.isPending) return;
    setCompleteError(null);

    markCompleteMutation.mutate(
      { courseSlug, lessonSlug, accessToken },
      {
        onSuccess: () => {
          // If there is a next lesson and it's now unlocked, auto-advance
          if (nextLesson) {
            navigate(`/academy/courses/${encodeURIComponent(courseSlug)}/player/${encodeURIComponent(nextLesson.slug)}`);
          }
        },
        onError: (err: unknown) => {
          if (err instanceof AcademyApiError) {
            setCompleteError(err.message);
          } else if (err instanceof Error) {
            setCompleteError(err.message);
          } else {
            setCompleteError("Failed to record authoritative lesson completion.");
          }
        },
      },
    );
  };

  return (
    <div
      className="course-player-container"
      data-testid="course-player-view"
      style={{
        display: "flex",
        minHeight: "calc(100vh - 120px)",
        width: "100%",
        backgroundColor: "var(--bg-app, #0b1120)",
        color: "var(--text-primary, #f8fafc)",
        position: "relative",
      }}
    >
      {/* Left Sidebar (Syllabus & Navigation) */}
      <aside
        id="player-syllabus-sidebar"
        aria-label="Course syllabus navigation"
        data-testid="player-syllabus-sidebar"
        style={{
          width: sidebarOpen ? "320px" : "0",
          minWidth: sidebarOpen ? "300px" : "0",
          maxWidth: "360px",
          borderRight: sidebarOpen ? "1px solid var(--border-subtle, rgba(255,255,255,0.08))" : "none",
          backgroundColor: "var(--bg-surface, #111827)",
          display: sidebarOpen ? "flex" : "none",
          flexDirection: "column",
          transition: "all 0.3s ease",
          zIndex: 20,
        }}
      >
        {/* Sidebar Header */}
        <div style={{ padding: "1.25rem", borderBottom: "1px solid var(--border-subtle, rgba(255,255,255,0.08))" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <Link
              to={`/academy/courses/${encodeURIComponent(courseSlug)}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                color: "var(--accent-cyan, #38bdf8)",
                fontSize: "0.8rem",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              <ArrowLeft size={14} aria-hidden="true" />
              <span>Course Outline</span>
            </Link>
            <button
              type="button"
              aria-label="Collapse course syllabus"
              onClick={() => setSidebarOpen(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-secondary, #94a3b8)",
                cursor: "pointer",
                padding: "0.25rem",
              }}
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 0.75rem", color: "var(--text-primary, #f8fafc)" }}>
            {course.title}
          </h2>

          {/* Progress bar */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary, #94a3b8)", marginBottom: "0.35rem" }}>
              <span>Progress</span>
              <span>
                {completedCount}/{totalLessons} ({progressPercent}%)
              </span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Course completion progress"
              style={{
                width: "100%",
                height: "6px",
                borderRadius: "999px",
                backgroundColor: "rgba(255,255,255,0.1)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: "100%",
                  backgroundColor: progressPercent === 100 ? "var(--status-success, #10b981)" : "var(--accent-cyan, #38bdf8)",
                  borderRadius: "999px",
                }}
              />
            </div>
          </div>
        </div>

        {/* Syllabus Lessons List */}
        <nav aria-label="Lessons in this course" style={{ flex: 1, overflowY: "auto", padding: "0.75rem" }}>
          <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            {playerLessons.map((item, idx) => {
              const isActive = item.slug === lessonSlug;
              const isLocked = item.isLocked;
              const isCompleted = item.isCompleted;

              if (isLocked) {
                return (
                  <li key={item.slug}>
                    <div
                      data-testid={`player-nav-locked-${item.slug}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "8px",
                        color: "#64748b",
                        fontSize: "0.85rem",
                        cursor: "not-allowed",
                        backgroundColor: "transparent",
                      }}
                    >
                      <Lock size={15} aria-hidden="true" style={{ flexShrink: 0 }} />
                      <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {idx + 1}. {item.title}
                      </span>
                    </div>
                  </li>
                );
              }

              return (
                <li key={item.slug}>
                  <Link
                    to={`/academy/courses/${encodeURIComponent(courseSlug)}/player/${encodeURIComponent(item.slug)}`}
                    data-testid={`player-nav-item-${item.slug}`}
                    aria-current={isActive ? "step" : undefined}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "8px",
                      textDecoration: "none",
                      fontSize: "0.85rem",
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? "var(--text-primary, #f8fafc)" : "var(--text-secondary, #94a3b8)",
                      backgroundColor: isActive ? "rgba(56, 189, 248, 0.15)" : "transparent",
                      border: isActive ? "1px solid rgba(56, 189, 248, 0.3)" : "1px solid transparent",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {isCompleted ? (
                      <CheckCircle size={15} style={{ color: "#10b981", flexShrink: 0 }} aria-hidden="true" />
                    ) : isActive ? (
                      <BookOpen size={15} style={{ color: "var(--accent-cyan, #38bdf8)", flexShrink: 0 }} aria-hidden="true" />
                    ) : (
                      <div
                        style={{
                          width: "15px",
                          height: "15px",
                          borderRadius: "50%",
                          border: "1px solid var(--border-subtle, rgba(255,255,255,0.2))",
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {idx + 1}. {item.title}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </nav>
      </aside>

      {/* Main Reading & Player Panel */}
      <main
        className="course-player-main"
        id="main-content"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          overflowX: "hidden",
        }}
      >
        {/* Top Floating Control Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.75rem 1.5rem",
            borderBottom: "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
            backgroundColor: "rgba(17, 24, 39, 0.6)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {!sidebarOpen && (
              <button
                type="button"
                aria-label="Open course syllabus"
                onClick={() => setSidebarOpen(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.4rem 0.75rem",
                  borderRadius: "6px",
                  border: "1px solid var(--border-subtle, rgba(255,255,255,0.15))",
                  backgroundColor: "transparent",
                  color: "var(--text-primary, #f8fafc)",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                }}
              >
                <Menu size={16} aria-hidden="true" />
                <span>Syllabus</span>
              </button>
            )}
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary, #94a3b8)" }}>
              {currentIndex >= 0 ? `Lesson ${currentIndex + 1} of ${totalLessons}` : "Course Player"}
            </span>
          </div>

          <Link
            to="/academy/learning-path"
            style={{
              fontSize: "0.8rem",
              color: "var(--text-secondary, #94a3b8)",
              textDecoration: "none",
            }}
          >
            Exit to Learning Path
          </Link>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, padding: "2rem 1.5rem", maxWidth: "860px", width: "100%", margin: "0 auto" }}>
          {/* Server Authority Notice (FR-007) */}
          <div
            data-testid="player-server-authority-notice"
            role="note"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "1.5rem",
              padding: "0.65rem 0.9rem",
              borderRadius: "8px",
              backgroundColor: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              color: "var(--status-success, #10b981)",
              fontSize: "0.78rem",
            }}
          >
            <ShieldCheck size={16} aria-hidden="true" style={{ flexShrink: 0 }} />
            <span>
              <strong>Server Authority Notice:</strong> All course completions, module unlock states, and XP rewards are evaluated exclusively server-authoritatively.
            </span>
          </div>

          {/* Lesson Header */}
          <header style={{ marginBottom: "2rem" }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0.2rem 0.55rem",
                  borderRadius: "999px",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  backgroundColor: "rgba(56, 189, 248, 0.12)",
                  color: "var(--accent-cyan, #38bdf8)",
                }}
              >
                <BookOpen size={12} aria-hidden="true" />
                Lesson {lesson.order}
              </span>

              {isCurrentLessonCompleted && (
                <span
                  data-testid="player-lesson-completed-badge"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0.2rem 0.55rem",
                    borderRadius: "999px",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    backgroundColor: "rgba(16, 185, 129, 0.15)",
                    color: "#10b981",
                  }}
                >
                  <CheckCircle size={12} aria-hidden="true" />
                  Completed
                </span>
              )}
            </div>

            <h1
              data-testid="player-lesson-title"
              style={{
                fontSize: "2rem",
                fontWeight: 800,
                color: "var(--text-primary, #f8fafc)",
                margin: "0 0 0.75rem",
                lineHeight: 1.2,
              }}
            >
              {lesson.title}
            </h1>
          </header>

          {/* Error Banner if Completion Failed */}
          {completeError && (
            <div
              role="alert"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#fca5a5",
                fontSize: "0.85rem",
                marginBottom: "1.5rem",
              }}
            >
              <AlertCircle size={16} aria-hidden="true" style={{ flexShrink: 0 }} />
              <span>{completeError}</span>
            </div>
          )}

          {/* Locked Lesson State Check (FR-006 / AC-006) */}
          {isCurrentLessonLocked ? (
            <div
              data-testid="locked-lesson-state"
              role="status"
              style={{
                padding: "3rem 2rem",
                borderRadius: "12px",
                backgroundColor: "rgba(30, 41, 59, 0.5)",
                border: "1px dashed rgba(148, 163, 184, 0.3)",
                textAlign: "center",
                margin: "2rem 0",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(148, 163, 184, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1.25rem",
                }}
              >
                <Lock size={28} style={{ color: "#94a3b8" }} aria-hidden="true" />
              </div>
              <h2 style={{ fontSize: "1.4rem", fontWeight: 700, margin: "0 0 0.5rem", color: "var(--text-primary, #f8fafc)" }}>
                Lesson Locked
              </h2>
              <p style={{ color: "var(--text-secondary, #94a3b8)", maxWidth: "480px", margin: "0 auto 1.5rem", fontSize: "0.95rem", lineHeight: 1.6 }}>
                This lesson is part of a sequential curriculum track. Please complete prior lessons before accessing this material.
              </p>
              {prevLesson && (
                <Link
                  to={`/academy/courses/${encodeURIComponent(courseSlug)}/player/${encodeURIComponent(prevLesson.slug)}`}
                  className="btn btn-primary"
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                >
                  <ArrowLeft size={16} aria-hidden="true" />
                  <span>Go to Prior Lesson ({prevLesson.title})</span>
                </Link>
              )}
            </div>
          ) : (
            /* Sanitized Educational Content (FR-005 / DOMPurify) */
            <article
              className="player-reading-content"
              style={{ lineHeight: 1.75, fontSize: "1.0625rem", color: "#1E293B" }}
            >
              <LessonContent content={lesson.content} />
            </article>
          )}

          {/* Bottom Player Control Bar (FR-005) */}
          <nav
            aria-label="Lesson player navigation controls"
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "1rem",
              marginTop: "3rem",
              paddingTop: "1.5rem",
              borderTop: "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
            }}
          >
            {/* Previous Lesson Button */}
            {prevLesson ? (
              <Link
                to={`/academy/courses/${encodeURIComponent(courseSlug)}/player/${encodeURIComponent(prevLesson.slug)}`}
                className="btn btn-outline"
                data-testid="player-prev-button"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
              >
                <ChevronLeft size={16} aria-hidden="true" />
                <span>Previous Lesson</span>
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="btn btn-outline"
                style={{ opacity: 0.5, cursor: "not-allowed", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
              >
                <ChevronLeft size={16} aria-hidden="true" />
                <span>First Lesson</span>
              </button>
            )}

            {/* Complete & Continue Button */}
            {!isCurrentLessonLocked && (
              <button
                type="button"
                onClick={handleCompleteAndContinue}
                disabled={markCompleteMutation.isPending}
                className="btn btn-primary"
                data-testid="player-complete-continue-button"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.6rem 1.4rem",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  backgroundColor: isCurrentLessonCompleted ? "rgba(16, 185, 129, 0.2)" : undefined,
                  borderColor: isCurrentLessonCompleted ? "rgba(16, 185, 129, 0.4)" : undefined,
                  color: isCurrentLessonCompleted ? "#10b981" : undefined,
                }}
              >
                {markCompleteMutation.isPending ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" aria-hidden="true" />
                    <span>Recording Completion...</span>
                  </>
                ) : isCurrentLessonCompleted ? (
                  <>
                    <CheckCircle size={16} aria-hidden="true" />
                    <span>Completed {nextLesson ? "(Continue Next)" : ""}</span>
                  </>
                ) : (
                  <>
                    <Award size={16} aria-hidden="true" />
                    <span>Complete & Continue</span>
                  </>
                )}
              </button>
            )}

            {/* Next Lesson Button */}
            {nextLesson && !nextLesson.isLocked ? (
              <Link
                to={`/academy/courses/${encodeURIComponent(courseSlug)}/player/${encodeURIComponent(nextLesson.slug)}`}
                className="btn btn-outline"
                data-testid="player-next-button"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
              >
                <span>Next Lesson</span>
                <ChevronRight size={16} aria-hidden="true" />
              </Link>
            ) : nextLesson && nextLesson.isLocked ? (
              <button
                type="button"
                disabled
                className="btn btn-outline"
                style={{ opacity: 0.5, cursor: "not-allowed", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                title="Complete current lesson to unlock next lesson"
              >
                <Lock size={14} aria-hidden="true" />
                <span>Next Lesson (Locked)</span>
              </button>
            ) : (
              <Link
                to="/academy/learning-path"
                className="btn btn-outline"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
              >
                <span>Curriculum Complete</span>
                <Award size={16} aria-hidden="true" />
              </Link>
            )}
          </nav>
        </div>
      </main>
    </div>
  );
};
