import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PaginationMeta } from "../types/academy-ui.types";

interface PaginationControlsProps {
  pagination: PaginationMeta;
  onPageChange: (newPage: number) => void;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({ pagination, onPageChange }) => {
  const { page, totalPages, total } = pagination;

  if (totalPages <= 1) {
    return null;
  }

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav className="pagination-container" aria-label="Course catalog pagination">
      <div className="pagination-info" aria-live="polite">
        Page <span className="font-semibold">{page}</span> of{" "}
        <span className="font-semibold">{totalPages}</span> ({total} courses)
      </div>

      <div className="pagination-buttons">
        <button
          type="button"
          className="btn btn-outline btn-sm"
          disabled={!hasPrev}
          aria-disabled={!hasPrev}
          onClick={() => onPageChange(page - 1)}
          aria-label="Go to previous page"
        >
          <ChevronLeft size={16} aria-hidden="true" className="btn-icon" />
          <span>Previous</span>
        </button>

        <button
          type="button"
          className="btn btn-outline btn-sm"
          disabled={!hasNext}
          aria-disabled={!hasNext}
          onClick={() => onPageChange(page + 1)}
          aria-label="Go to next page"
        >
          <span>Next</span>
          <ChevronRight size={16} aria-hidden="true" className="btn-icon" />
        </button>
      </div>
    </nav>
  );
};
