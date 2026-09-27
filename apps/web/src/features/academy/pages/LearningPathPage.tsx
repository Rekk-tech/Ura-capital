import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  CheckCircle,
  Lock,
  PlayCircle,
  ChevronRight,
  ShieldCheck,
  Award,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../auth/context/AuthContext";
import { useLearningPathQuery } from "../hooks/use-academy";
import { CourseLevel, LearningPathMilestoneDto } from "../types/academy-ui.types";
import { ErrorState, EmptyState } from "../components/AcademyStates";
import { buildAuthRedirectUrl } from "../utils/redirect-validator";

export const LearningPathPage: React.FC = () => {
  const { accessToken, isAuthenticated } = useAuth();
  const { data, isLoading, isError, error, refetch } = useLearningPathQuery(accessToken);
  const [selectedLevel, setSelectedLevel] = useState<CourseLevel | "ALL">("ALL");

  if (isLoading) {
    return (
      <div
        className="learning-path-page"
        data-testid="learning-path-loading"
        aria-busy="true"
        aria-label="Loading curriculum roadmap"
      >
        <div role="status" className="sr-only">
          Loading learning path roadmap...
        </div>
        <div className="learning-path-skeleton" style={{ padding: "1.5rem" }}>
          <div
            className="skeleton-line skeleton-title"
            style={{ width: "320px", height: "36px", marginBottom: "1rem", borderRadius: "6px" }}
          />
          <div
            className="skeleton-line skeleton-desc"
            style={{ width: "500px", height: "18px", marginBottom: "2rem", borderRadius: "4px" }}
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                style={{
                  height: "220px",
                  borderRadius: "12px",
                  backgroundColor: "var(--bg-surface, rgba(255,255,255,0.03))",
                  border: "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
                  padding: "1.5rem",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="learning-path-page" data-testid="learning-path-error">
        <ErrorState
          message={error instanceof Error ? error.message : "Failed to load curriculum roadmap."}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const roadmap = data?.data;
  const tracks = roadmap?.tracks ?? [];
  const totalCourses = roadmap?.totalCourses ?? 0;
  const completedCourses = roadmap?.completedCourses ?? 0;
  const overallProgress = roadmap?.overallProgressPercent ?? 0;
  const activeCourseSlug = roadmap?.activeCourseSlug ?? null;

  if (tracks.length === 0 || totalCourses === 0) {
    return (
      <div className="learning-path-page" data-testid="learning-path-empty">
        <EmptyState
          message="No structured learning tracks are currently published."
          onReset={() => refetch()}
        />
      </div>
    );
  }

  const filteredTracks = selectedLevel === "ALL"
    ? tracks
    : tracks.filter((t) => t.level === selectedLevel);

  return (
    <div className="learning-path-page" data-testid="learning-path-container" style={{ width: "100%", maxWidth: "1200px", margin: "0 auto", padding: "1.5rem 1rem" }}>
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb navigation" style={{ marginBottom: "1rem" }}>
        <ol style={{ display: "flex", alignItems: "center", gap: "0.5rem", listStyle: "none", padding: 0, margin: 0, fontSize: "0.85rem", color: "var(--text-secondary, #94a3b8)" }}>
          <li>
            <Link to="/academy" style={{ color: "var(--text-secondary, #94a3b8)", textDecoration: "none" }}>
              Academy
            </Link>
          </li>
          <ChevronRight size={14} aria-hidden="true" />
          <li aria-current="page" style={{ color: "var(--text-primary, #f8fafc)", fontWeight: 600 }}>
            Learning Path
          </li>
        </ol>
      </nav>

      {/* Page Header */}
      <header className="learning-path-header" style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.25rem 0.65rem", borderRadius: "999px", backgroundColor: "rgba(56, 189, 248, 0.1)", color: "var(--accent-cyan, #38bdf8)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.75rem" }}>
              <Sparkles size={13} aria-hidden="true" />
              <span>Curriculum Roadmap</span>
            </div>
            <h1 style={{ margin: "0 0 0.5rem", fontSize: "2rem", fontWeight: 800, color: "var(--text-primary, #f8fafc)", lineHeight: 1.2 }}>
              Financial Learning Path
            </h1>
            <p style={{ margin: 0, color: "var(--text-secondary, #94a3b8)", maxWidth: "700px", lineHeight: 1.6, fontSize: "1rem" }}>
              Structured, sequential financial education from foundational investment mechanics through quantitative asset allocation and risk mitigation.
            </p>
          </div>

          {/* Active Course Quick Jump */}
          {activeCourseSlug && (
            <div style={{ padding: "1rem 1.25rem", borderRadius: "10px", backgroundColor: "var(--bg-surface, #1e293b)", border: "1px solid var(--border-subtle, rgba(255,255,255,0.1))", minWidth: "240px" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary, #94a3b8)", textTransform: "uppercase", marginBottom: "0.35rem" }}>
                Current Milestone
              </div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary, #f8fafc)", marginBottom: "0.75rem" }}>
                {activeCourseSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </div>
              <Link
                to={`/academy/courses/${encodeURIComponent(activeCourseSlug)}`}
                className="btn btn-primary"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", padding: "0.4rem 0.85rem" }}
              >
                <PlayCircle size={15} aria-hidden="true" />
                <span>Continue Course</span>
              </Link>
            </div>
          )}
        </div>

        {/* Server Authority Notice (NFR-001, FR-007) */}
        <div
          data-testid="server-authority-notice"
          role="note"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            marginTop: "1.25rem",
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            backgroundColor: "rgba(16, 185, 129, 0.08)",
            border: "1px solid rgba(16, 185, 129, 0.25)",
            color: "var(--status-success, #10b981)",
            fontSize: "0.82rem",
          }}
        >
          <ShieldCheck size={18} aria-hidden="true" style={{ flexShrink: 0 }} />
          <span>
            <strong>Server Authority Disclosure:</strong> All course completions, module unlock states, and XP rewards are evaluated exclusively server-authoritatively.
          </span>
        </div>

        {/* Guest Progress Notice if unauthenticated */}
        {!isAuthenticated && (
          <div
            data-testid="guest-progress-prompt"
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.75rem",
              marginTop: "0.75rem",
              padding: "0.85rem 1.25rem",
              borderRadius: "8px",
              backgroundColor: "rgba(245, 158, 11, 0.08)",
              border: "1px solid rgba(245, 158, 11, 0.25)",
              color: "var(--text-primary, #f8fafc)",
              fontSize: "0.85rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Lock size={16} style={{ color: "#f59e0b" }} aria-hidden="true" />
              <span>
                You are browsing as a guest. Sign in to permanently track your progress, unlock milestones, and earn XP.
              </span>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <Link
                to={buildAuthRedirectUrl("/login", "/academy/learning-path")}
                className="btn btn-primary"
                style={{ padding: "0.3rem 0.75rem", fontSize: "0.8rem" }}
              >
                Sign In
              </Link>
              <Link
                to={buildAuthRedirectUrl("/register", "/academy/learning-path")}
                className="btn btn-outline"
                style={{ padding: "0.3rem 0.75rem", fontSize: "0.8rem" }}
              >
                Create Account
              </Link>
            </div>
          </div>
        )}

        {/* Overall Curriculum Progress Bar */}
        <div
          style={{
            marginTop: "1.5rem",
            padding: "1.25rem",
            borderRadius: "10px",
            backgroundColor: "var(--bg-surface, #1e293b)",
            border: "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
            <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary, #f8fafc)" }}>
              Overall Learning Journey Progress
            </span>
            <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--accent-cyan, #38bdf8)" }}>
              {overallProgress}% Complete ({completedCourses}/{totalCourses} Courses Finished)
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={overallProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Overall curriculum progress"
            style={{
              width: "100%",
              height: "10px",
              borderRadius: "999px",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${overallProgress}%`,
                height: "100%",
                backgroundColor: overallProgress === 100 ? "var(--status-success, #10b981)" : "var(--accent-cyan, #38bdf8)",
                borderRadius: "999px",
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>

        {/* Track Filter Buttons */}
        <div
          role="group"
          aria-label="Filter tracks by level"
          style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "1.5rem" }}
        >
          {(["ALL", "BEGINNER", "INTERMEDIATE", "ADVANCED"] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setSelectedLevel(lvl)}
              style={{
                padding: "0.45rem 0.9rem",
                borderRadius: "8px",
                fontSize: "0.85rem",
                fontWeight: selectedLevel === lvl ? 700 : 500,
                border: selectedLevel === lvl ? "1px solid var(--accent-cyan, #38bdf8)" : "1px solid var(--border-subtle, rgba(255,255,255,0.1))",
                backgroundColor: selectedLevel === lvl ? "rgba(56, 189, 248, 0.12)" : "transparent",
                color: selectedLevel === lvl ? "var(--accent-cyan, #38bdf8)" : "var(--text-secondary, #94a3b8)",
                cursor: "pointer",
              }}
            >
              {lvl === "ALL" ? "All Tracks" : lvl.charAt(0) + lvl.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </header>

      {/* Tracks Section */}
      <main className="learning-path-tracks">
        {filteredTracks.map((track) => (
          <section
            key={track.id}
            aria-labelledby={`track-heading-${track.id}`}
            style={{
              marginBottom: "2.5rem",
              padding: "1.75rem",
              borderRadius: "14px",
              backgroundColor: "var(--bg-surface, #1e293b)",
              border: "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
            }}
          >
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem", marginBottom: "1.25rem", borderBottom: "1px solid var(--border-subtle, rgba(255,255,255,0.08))", paddingBottom: "1rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                  <span
                    style={{
                      padding: "0.2rem 0.5rem",
                      borderRadius: "4px",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      backgroundColor: track.level === "BEGINNER" ? "rgba(16, 185, 129, 0.15)" : track.level === "INTERMEDIATE" ? "rgba(245, 158, 11, 0.15)" : "rgba(239, 68, 68, 0.15)",
                      color: track.level === "BEGINNER" ? "#10b981" : track.level === "INTERMEDIATE" ? "#f59e0b" : "#ef4444",
                    }}
                  >
                    {track.level}
                  </span>
                  <h2 id={`track-heading-${track.id}`} style={{ margin: 0, fontSize: "1.35rem", fontWeight: 700, color: "var(--text-primary, #f8fafc)" }}>
                    {track.title}
                  </h2>
                </div>
                <p style={{ margin: 0, color: "var(--text-secondary, #94a3b8)", fontSize: "0.9rem" }}>
                  {track.description}
                </p>
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary, #94a3b8)", fontWeight: 500 }}>
                {track.milestones.filter((m) => m.status === "COMPLETED").length} of {track.milestones.length} Courses Completed
              </div>
            </div>

            {/* Milestones Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "1.25rem",
              }}
            >
              {track.milestones.map((milestone, idx) => (
                <MilestoneCard key={milestone.courseSlug} milestone={milestone} index={idx + 1} />
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
};

interface MilestoneCardProps {
  milestone: LearningPathMilestoneDto;
  index: number;
}

const MilestoneCard: React.FC<MilestoneCardProps> = ({ milestone, index }) => {
  const isLocked = milestone.status === "LOCKED";
  const isCompleted = milestone.status === "COMPLETED";
  const isInProgress = milestone.status === "IN_PROGRESS";

  const getStatusBadge = () => {
    switch (milestone.status) {
      case "COMPLETED":
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.2rem 0.5rem", borderRadius: "999px", fontSize: "0.72rem", fontWeight: 700, backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
            <CheckCircle size={12} aria-hidden="true" />
            Completed
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.2rem 0.5rem", borderRadius: "999px", fontSize: "0.72rem", fontWeight: 700, backgroundColor: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", border: "1px solid rgba(245, 158, 11, 0.3)" }}>
            <PlayCircle size={12} aria-hidden="true" />
            In Progress
          </span>
        );
      case "AVAILABLE":
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.2rem 0.5rem", borderRadius: "999px", fontSize: "0.72rem", fontWeight: 700, backgroundColor: "rgba(56, 189, 248, 0.15)", color: "var(--accent-cyan, #38bdf8)", border: "1px solid rgba(56, 189, 248, 0.3)" }}>
            <BookOpen size={12} aria-hidden="true" />
            Available
          </span>
        );
      case "LOCKED":
      default:
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.2rem 0.5rem", borderRadius: "999px", fontSize: "0.72rem", fontWeight: 700, backgroundColor: "rgba(148, 163, 184, 0.1)", color: "#94a3b8", border: "1px solid rgba(148, 163, 184, 0.2)" }}>
            <Lock size={12} aria-hidden="true" />
            Locked
          </span>
        );
    }
  };

  return (
    <article
      data-testid={`milestone-card-${milestone.courseSlug}`}
      style={{
        padding: "1.25rem",
        borderRadius: "10px",
        backgroundColor: isLocked ? "rgba(30, 41, 59, 0.4)" : "var(--bg-card, #1e293b)",
        border: isLocked ? "1px dashed rgba(148, 163, 184, 0.2)" : "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        opacity: isLocked ? 0.75 : 1,
        transition: "all 0.2s ease",
      }}
    >
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary, #94a3b8)", textTransform: "uppercase" }}>
            Milestone {index}
          </span>
          {getStatusBadge()}
        </div>

        <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary, #f8fafc)" }}>
          {milestone.courseTitle}
        </h3>

        {milestone.description && (
          <p style={{ margin: "0 0 1rem", fontSize: "0.85rem", color: "var(--text-secondary, #94a3b8)", lineHeight: 1.5 }}>
            {milestone.description}
          </p>
        )}

        {/* Prerequisite Notice for Locked Courses */}
        {isLocked && milestone.prerequisites.length > 0 && (
          <div
            data-testid={`milestone-locked-notice-${milestone.courseSlug}`}
            style={{
              padding: "0.5rem 0.75rem",
              borderRadius: "6px",
              backgroundColor: "rgba(148, 163, 184, 0.08)",
              fontSize: "0.78rem",
              color: "#94a3b8",
              marginBottom: "1rem",
            }}
          >
            <strong>Prerequisite:</strong> Complete {milestone.prerequisites.join(", ")} first.
          </div>
        )}
      </div>

      <div>
        {/* Progress percent indicator */}
        {!isLocked && (
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "var(--text-secondary, #94a3b8)", marginBottom: "0.3rem" }}>
              <span>{milestone.lessonCount} Lessons</span>
              <span>{milestone.progressPercent}%</span>
            </div>
            <div
              style={{
                width: "100%",
                height: "6px",
                borderRadius: "999px",
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${milestone.progressPercent}%`,
                  height: "100%",
                  backgroundColor: isCompleted ? "var(--status-success, #10b981)" : "var(--accent-cyan, #38bdf8)",
                  borderRadius: "999px",
                }}
              />
            </div>
          </div>
        )}

        {/* Action Button */}
        {isLocked ? (
          <button
            type="button"
            disabled
            className="btn btn-outline"
            style={{ width: "100%", opacity: 0.6, cursor: "not-allowed", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.4rem" }}
          >
            <Lock size={14} aria-hidden="true" />
            <span>Prerequisites Required</span>
          </button>
        ) : (
          <Link
            to={`/academy/courses/${encodeURIComponent(milestone.courseSlug)}`}
            className="btn btn-primary"
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "0.4rem",
              backgroundColor: isCompleted ? "transparent" : undefined,
              borderColor: isCompleted ? "var(--border-subtle, rgba(255,255,255,0.15))" : undefined,
              color: isCompleted ? "var(--text-primary, #f8fafc)" : undefined,
            }}
          >
            {isCompleted ? (
              <>
                <Award size={15} aria-hidden="true" />
                <span>Review Course</span>
              </>
            ) : isInProgress ? (
              <>
                <PlayCircle size={15} aria-hidden="true" />
                <span>Continue Course</span>
              </>
            ) : (
              <>
                <BookOpen size={15} aria-hidden="true" />
                <span>Start Course</span>
              </>
            )}
          </Link>
        )}
      </div>
    </article>
  );
};
