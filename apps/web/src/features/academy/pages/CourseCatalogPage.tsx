import React, { useState } from "react";
import { Search } from "lucide-react";
import { useCoursesQuery } from "../hooks/use-academy";
import { CourseLevel } from "../types/academy-ui.types";
import { LevelFilter } from "../components/LevelFilter";
import { CourseCard } from "../components/CourseCard";
import { PaginationControls } from "../components/PaginationControls";
import { CatalogLoadingSkeleton, EmptyState, ErrorState } from "../components/AcademyStates";

export const CourseCatalogPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [level, setLevel] = useState<CourseLevel | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, isError, error, refetch } = useCoursesQuery({
    page,
    limit: 12,
    level,
  });

  const handleLevelChange = (newLevel?: CourseLevel) => {
    setLevel(newLevel);
    setPage(1); // Reset page on filter change
  };

  const rawCourses = data?.data ?? [];
  const filteredCourses = searchQuery.trim()
    ? rawCourses.filter((course) => {
        const query = searchQuery.toLowerCase().trim();
        return (
          course.title.toLowerCase().includes(query) ||
          (course.description && course.description.toLowerCase().includes(query))
        );
      })
    : rawCourses;

  return (
    <div className="academy-catalog-page">
      <header className="catalog-header">
        <h1 className="catalog-title">Aura Academy Courses</h1>
        <p className="catalog-subtitle">
          Master financial markets, investment principles, and risk management through structured, progressive learning.
        </p>
      </header>

      {/* 3-Stage Curriculum Pathway */}
      <section className="academy-curriculum-overview" aria-label="Aura Academy 3-Stage Curriculum Roadmap" style={{ marginBottom: "2rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
          <div className="card-aura" style={{ padding: "1.25rem", borderLeft: "4px solid var(--aura-blue-500)" }}>
            <span className="badge badge-brand" style={{ marginBottom: "0.5rem", display: "inline-block" }}>STAGE 1 · STATIONS 1–3</span>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 0.4rem" }}>Awareness & Foundations</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
              Core financial literacy, personal cash flow budgeting, risk profiling, and inflation dynamics.
            </p>
          </div>

          <div className="card-aura" style={{ padding: "1.25rem", borderLeft: "4px solid var(--aura-teal-500)" }}>
            <span className="badge badge-teal" style={{ marginBottom: "0.5rem", display: "inline-block" }}>STAGE 2 · STATIONS 4–6</span>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 0.4rem" }}>Skills & Real Simulation</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
              Equity valuation, technical indicators, order execution mechanics, and volatility management in FOMO Arena.
            </p>
          </div>

          <div className="card-aura" style={{ padding: "1.25rem", borderLeft: "4px solid var(--aura-green-500)" }}>
            <span className="badge badge-success-subtle" style={{ marginBottom: "0.5rem", display: "inline-block" }}>STAGE 3 · STATIONS 7–9</span>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 0.4rem" }}>Strategy & Mastery</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
              Macroeconomic cycles, multi-asset portfolio hedging, risk-adjusted returns, and autonomous execution.
            </p>
          </div>
        </div>
      </section>

      <div
        className="catalog-toolbar"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
        }}
      >
        <LevelFilter selectedLevel={level} onSelectLevel={handleLevelChange} />

        {/* Search Filter */}
        <div
          className="course-search-box"
          style={{ display: "flex", alignItems: "center", position: "relative" }}
        >
          <label
            htmlFor="course-search-input"
            style={{
              position: "absolute",
              width: "1px",
              height: "1px",
              padding: 0,
              margin: "-1px",
              overflow: "hidden",
              clip: "rect(0, 0, 0, 0)",
              border: 0,
            }}
          >
            Search courses
          </label>
          <Search
            size={16}
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "0.75rem",
              color: "var(--text-muted)",
              pointerEvents: "none",
            }}
          />
          <input
            id="course-search-input"
            type="search"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            data-testid="course-search-input"
            style={{
              paddingLeft: "2.25rem",
              paddingRight: "1rem",
              paddingTop: "0.5rem",
              paddingBottom: "0.5rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
              backgroundColor: "var(--bg-surface)",
              color: "var(--text-main)",
              fontSize: "0.875rem",
              outline: "none",
              minWidth: "220px",
            }}
          />
        </div>
      </div>

      <main className="catalog-content" aria-label="Course catalog">
        {isLoading && <CatalogLoadingSkeleton />}

        {isError && (
          <ErrorState
            message={
              error instanceof Error
                ? error.message
                : "Failed to load courses. Please check your connection."
            }
            onRetry={() => refetch()}
          />
        )}

        {!isLoading && !isError && data && filteredCourses.length === 0 && (
          <EmptyState
            message={
              searchQuery
                ? `No courses found matching "${searchQuery}". Try a different keyword.`
                : level
                ? `No courses found matching "${level.toLowerCase()}" level. Try resetting filters.`
                : "New interactive courses are currently being prepared. Explore the 3-stage curriculum roadmap above in the meantime."
            }
            onReset={
              searchQuery || level
                ? () => {
                    setSearchQuery("");
                    handleLevelChange(undefined);
                  }
                : undefined
            }
          />
        )}

        {!isLoading && !isError && data && filteredCourses.length > 0 && (
          <>
            <div className="academy-card-grid" data-testid="course-card-grid">
              {filteredCourses.map((course) => (
                <CourseCard key={course.slug} course={course} />
              ))}
            </div>

            <PaginationControls pagination={data.pagination} onPageChange={setPage} />
          </>
        )}
      </main>
    </div>
  );
};
