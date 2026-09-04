import React from "react";
import { CourseLevel } from "../types/academy-ui.types";

interface LevelFilterProps {
  selectedLevel?: CourseLevel;
  onSelectLevel: (level?: CourseLevel) => void;
}

const LEVELS: Array<{ label: string; value?: CourseLevel }> = [
  { label: "All Levels", value: undefined },
  { label: "Beginner", value: "BEGINNER" },
  { label: "Intermediate", value: "INTERMEDIATE" },
  { label: "Advanced", value: "ADVANCED" },
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
              onClick={() => onSelectLevel(item.value)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
