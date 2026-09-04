import React, { useState } from "react";
import { useCoursesQuery } from "../hooks/use-academy";
import { CourseLevel } from "../types/academy-ui.types";
import { LevelFilter } from "../components/LevelFilter";
import { CourseCard } from "../components/CourseCard";
import { PaginationControls } from "../components/PaginationControls";
import { CatalogLoadingSkeleton, EmptyState, ErrorState } from "../components/AcademyStates";

export const CourseCatalogPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [level, setLevel] = useState<CourseLevel | undefined>(undefined);

  const { data, isLoading, isError, error, refetch } = useCoursesQuery({
    page,
    limit: 12,
    level,
  });

  const handleLevelChange = (newLevel?: CourseLevel) => {
    setLevel(newLevel);
    setPage(1); // Reset page on filter change
  };

  return (
    <div className="academy-catalog-page">
      <header className="catalog-header">
        <h1 className="catalog-title">Aura Academy Courses</h1>
        <p className="catalog-subtitle">
          Master financial markets, investment principles, and risk management through structured, progressive learning.
        </p>
      </header>

      <div className="catalog-toolbar">
        <LevelFilter selectedLevel={level} onSelectLevel={handleLevelChange} />
      </div>

      <main className="catalog-content" aria-label="Course catalog">
        {isLoading && <CatalogLoadingSkeleton />}

        {isError && (
          <ErrorState
            message={error instanceof Error ? error.message : "Failed to load courses. Please check your connection."}
            onRetry={() => refetch()}
          />
        )}

        {!isLoading && !isError && data && data.data.length === 0 && (
          <EmptyState
            message={level ? `No courses found matching "${level.toLowerCase()}" level.` : "No published courses available yet."}
            onReset={level ? () => handleLevelChange(undefined) : undefined}
          />
        )}

        {!isLoading && !isError && data && data.data.length > 0 && (
          <>
            <div className="academy-card-grid" data-testid="course-card-grid">
              {data.data.map((course) => (
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
