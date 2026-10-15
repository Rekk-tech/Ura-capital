import React from "react";
import { CourseLevel } from "../types/academy-ui.types";

interface LevelFilterProps {
  selectedLevel?: CourseLevel;
  onSelectLevel: (level?: CourseLevel) => void;
}

const LEVELS: Array<{ label: string; viLabel: string; value?: CourseLevel }> = [
  { label: "All Levels", viLabel: "Tất Cả Cấp Độ", value: undefined },
  { label: "Beginner", viLabel: "Cơ Bản", value: "BEGINNER" },
  { label: "Intermediate", viLabel: "Trung Cấp", value: "INTERMEDIATE" },
  { label: "Advanced", viLabel: "Nâng Cao", value: "ADVANCED" },
];

export const LevelFilter: React.FC<LevelFilterProps> = ({ selectedLevel, onSelectLevel }) => {
  return (
    <nav className="level-filter-container" aria-label="Course level filters">
      <div className="level-filter-list" role="toolbar" aria-label="Filter courses by proficiency level">
        {LEVELS.map((item) => {
          const isActive = selectedLevel === item.value;
          return (
            <button
              key={item.label}
              type="button"
              className={`filter-pill ${isActive ? "active" : ""}`}
              aria-pressed={isActive}
              aria-label={item.label}
              onClick={() => onSelectLevel(item.value)}
            >
              {item.viLabel}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
