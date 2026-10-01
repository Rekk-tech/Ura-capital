import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, RotateCcw, Eye, CheckCircle2, ArrowLeft } from "lucide-react";
import { FlashcardItemDto } from "../types/academy-ui.types";
import { sanitizeLessonMarkdown } from "../utils/markdown-sanitizer";

interface FlashcardReviewContainerProps {
  flashcards: FlashcardItemDto[];
  courseSlug: string;
  lessonSlug: string;
  lessonTitle: string;
}

const isInteractiveElement = (target: EventTarget | null): boolean => {
  if (!(target instanceof Element)) return false;

  return Boolean(
    target.closest(
      'input, textarea, select, button, a, [contenteditable="true"]'
    ) || (target instanceof HTMLElement && target.isContentEditable)
  );
};

export const FlashcardReviewContainer: React.FC<FlashcardReviewContainerProps> = ({
  flashcards,
  courseSlug,
  lessonSlug,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const total = flashcards.length;
  const currentCard = flashcards[currentIndex];
  const progressPercent = total > 0 ? Math.round(((currentIndex + (isCompleted ? 1 : 0)) / total) * 100) : 0;

  const handleToggleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleNext = useCallback(() => {
    if (currentIndex < total - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    } else {
      setIsCompleted(true);
      setIsFlipped(false);
    }
  }, [currentIndex, total]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  }, [currentIndex]);

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsCompleted(false);
  }, []);

  // Keyboard shortcut listener with interactive element guard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isInteractiveElement(e.target)) {
        return;
      }

      if (e.key === " " || e.key === "Enter") {
        if (!isCompleted) {
          e.preventDefault();
          handleToggleFlip();
        }
      } else if (e.key === "ArrowRight") {
        if (!isCompleted) {
          e.preventDefault();
          handleNext();
        }
      } else if (e.key === "ArrowLeft") {
        if (!isCompleted && currentIndex > 0) {
          e.preventDefault();
          handlePrevious();
        }
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        handleRestart();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCompleted, currentIndex, handleToggleFlip, handleNext, handlePrevious, handleRestart]);

  if (isCompleted) {
    const lessonUrl =
      courseSlug && lessonSlug
        ? `/academy/courses/${encodeURIComponent(courseSlug)}/lessons/${encodeURIComponent(lessonSlug)}`
        : "/academy";

    return (
      <div className="flashcard-deck-completed" data-testid="flashcard-completed-view">
        <div className="flashcard-completion-card">
          <CheckCircle2 className="flashcard-completion-icon" aria-hidden="true" />
          <h2 className="flashcard-completion-title">Deck Completed!</h2>
          <p className="flashcard-completion-desc">
            You reviewed all {total} {total === 1 ? "flashcard" : "flashcards"} in this lesson.
          </p>
          <div
            className="flashcard-completion-actions"
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              alignItems: "center",
              marginTop: "1.5rem",
              flexWrap: "wrap",
            }}
          >
            <Link
              to={lessonUrl}
              className="btn btn-primary flashcard-return-btn"
              data-testid="flashcard-return-lesson-btn"
              aria-label="Return to Lesson"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>Return to Lesson</span>
            </Link>
            <button
              type="button"
              className="btn btn-secondary flashcard-restart-btn"
              onClick={handleRestart}
              aria-label="Restart Review"
              data-testid="flashcard-restart-btn"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>Restart Deck</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentCard) {
    return null;
  }

  return (
    <div className="flashcard-review-container" data-testid="flashcard-review-container">
      {/* Top Header: Progress Bar */}
      <div
        className="flashcard-progress-bar-container"
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Flashcard Deck Progress"
      >
        <div className="flashcard-progress-bar-fill" style={{ width: `${progressPercent}%` }} />
      </div>

      {/* Top Header Controls: Position Counter & Restart */}
      <div className="flashcard-toolbar">
        <span
          className="flashcard-position-badge"
          aria-label={`Card ${currentIndex + 1} of ${total}`}
          data-testid="flashcard-position-badge"
        >
          Card {currentIndex + 1} of {total}
        </span>
        <button
          type="button"
          className="flashcard-toolbar-btn"
          onClick={handleRestart}
          aria-label="Restart Review"
          title="Restart review session (R)"
        >
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
          <span>Restart</span>
        </button>
      </div>

      {/* Quizlet 3D Card Scene */}
      <div
        className="flashcard-scene"
        data-testid="flashcard-active-card"
        onClick={handleToggleFlip}
        role="button"
        tabIndex={0}
        aria-label={isFlipped ? "Flip to front side" : "Flip to back side"}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            handleToggleFlip();
          }
        }}
      >
        <div className={`flashcard-card-3d ${isFlipped ? "is-flipped" : ""}`}>
          {/* Front Face: Term / Prompt */}
          <div className="flashcard-face flashcard-face-front" data-testid="flashcard-front-section">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="flashcard-face-badge">PROMPT</span>
              {!isFlipped && (
                <button
                  type="button"
                  className="btn btn-outline flashcard-reveal-btn"
                  data-testid="flashcard-reveal-button"
                  aria-expanded="false"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleFlip();
                  }}
                  style={{ fontSize: "0.75rem", padding: "0.2rem 0.55rem" }}
                >
                  <Eye className="w-3.5 h-3.5 mr-1 inline" aria-hidden="true" />
                  <span>Reveal</span>
                </button>
              )}
            </div>

            <div className="flashcard-center-content">
              <div
                className="flashcard-term-title"
                data-testid="flashcard-front-content"
                dangerouslySetInnerHTML={{ __html: sanitizeLessonMarkdown(currentCard.front) }}
              />
            </div>

            <div className="flashcard-flip-hint">
              Click to flip or press <kbd>Space</kbd>
            </div>
          </div>

          {/* Back Face: Definition / Answer (Rendered when flipped) */}
          {isFlipped && (
            <div
              className="flashcard-face flashcard-face-back"
              aria-live="polite"
              data-testid="flashcard-back-section"
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="flashcard-face-badge flashcard-back-badge">
                  DEFINITION <span className="sr-only" aria-hidden="true">Answer</span>
                </span>
                <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 600 }}>
                  {currentIndex + 1} / {total}
                </span>
              </div>

              <div className="flashcard-center-content">
                <div
                  className="flashcard-def-text"
                  data-testid="flashcard-back-content"
                  dangerouslySetInnerHTML={{ __html: sanitizeLessonMarkdown(currentCard.back) }}
                />
              </div>

              <div className="flashcard-flip-hint">
                Click to flip back or press <kbd>Space</kbd>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flashcard-navigation-bar">
        <button
          type="button"
          className="btn btn-secondary flashcard-nav-btn"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          aria-label="Previous Card"
          data-testid="flashcard-prev-button"
        >
          <ChevronLeft className="w-5 h-5 mr-1 inline" aria-hidden="true" />
          Previous
        </button>

        <button
          type="button"
          className="btn btn-primary flashcard-nav-btn"
          onClick={handleNext}
          aria-label={currentIndex === total - 1 ? "Complete Review" : "Next Card"}
          data-testid="flashcard-next-button"
        >
          {currentIndex === total - 1 ? "Finish" : "Next"}
          <ChevronRight className="w-5 h-5 ml-1 inline" aria-hidden="true" />
        </button>
      </div>

      {/* Keyboard Shortcut Hints Guide */}
      <div className="flashcard-keyboard-guide" aria-hidden="true">
        <span>Space: Flip &bull; &larr; / &rarr;: Navigate &bull; R: Restart</span>
      </div>
    </div>
  );
};
