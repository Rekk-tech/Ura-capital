import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, Eye, CheckCircle2 } from "lucide-react";
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
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const total = flashcards.length;
  const currentCard = flashcards[currentIndex];

  const handleReveal = useCallback(() => {
    setIsRevealed(true);
  }, []);

  const handleNext = useCallback(() => {
    if (currentIndex < total - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsRevealed(false);
    } else {
      setIsCompleted(true);
      setIsRevealed(false);
    }
  }, [currentIndex, total]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsRevealed(false);
    }
  }, [currentIndex]);

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setIsRevealed(false);
    setIsCompleted(false);
  }, []);

  // Keyboard shortcut listener with interactive element guard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isInteractiveElement(e.target)) {
        return;
      }

      if (e.key === " " || e.key === "Enter") {
        if (!isRevealed && !isCompleted) {
          e.preventDefault();
          handleReveal();
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
  }, [isRevealed, isCompleted, currentIndex, handleReveal, handleNext, handlePrevious, handleRestart]);

  if (isCompleted) {
    return (
      <div className="flashcard-deck-completed" data-testid="flashcard-completed-view">
        <div className="flashcard-completion-card">
          <CheckCircle2 className="flashcard-completion-icon" aria-hidden="true" />
          <h2 className="flashcard-completion-title">Deck Completed!</h2>
          <p className="flashcard-completion-desc">
            You reviewed all {total} {total === 1 ? "flashcard" : "flashcards"} in this lesson.
          </p>
          <button
            type="button"
            className="btn btn-primary flashcard-restart-btn"
            onClick={handleRestart}
            aria-label="Restart Review"
          >
            <RotateCcw className="w-4 h-4 mr-2 inline" aria-hidden="true" />
            Restart Review
          </button>
        </div>
      </div>
    );
  }

  if (!currentCard) {
    return null;
  }

  return (
    <div className="flashcard-review-container" data-testid="flashcard-review-container">
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

      {/* Main Flashcard View */}
      <div className="flashcard-card-surface" data-testid="flashcard-active-card">
        {/* Front Section (Always rendered) */}
        <div className="flashcard-front-section" data-testid="flashcard-front-section">
          <div className="flashcard-face-badge">Prompt</div>
          <div
            className="flashcard-content-prose"
            data-testid="flashcard-front-content"
            dangerouslySetInnerHTML={{ __html: sanitizeLessonMarkdown(currentCard.front) }}
          />
        </div>

        {/* Divider & Reveal / Back Section */}
        {!isRevealed ? (
          <div className="flashcard-reveal-prompt">
            <button
              type="button"
              className="btn btn-primary flashcard-reveal-btn"
              onClick={handleReveal}
              aria-expanded="false"
              aria-label="Reveal Answer"
              data-testid="flashcard-reveal-button"
            >
              <Eye className="w-4 h-4 mr-2 inline" aria-hidden="true" />
              Reveal Answer
            </button>
            <p className="flashcard-shortcut-hint" aria-hidden="true">
              Press <kbd>Space</kbd> or <kbd>Enter</kbd> to reveal
            </p>
          </div>
        ) : (
          <div
            className="flashcard-back-section"
            aria-live="polite"
            data-testid="flashcard-back-section"
          >
            <div className="flashcard-face-badge flashcard-back-badge">Answer</div>
            <div
              className="flashcard-content-prose flashcard-back-content"
              data-testid="flashcard-back-content"
              dangerouslySetInnerHTML={{ __html: sanitizeLessonMarkdown(currentCard.back) }}
            />
          </div>
        )}
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

      {/* Keyboard Helper Footnote */}
      <div className="flashcard-keyboard-guide" aria-hidden="true">
        <span>Shortcuts: <kbd>Space</kbd> / <kbd>Enter</kbd> flip &bull; <kbd>&larr;</kbd> prev &bull; <kbd>&rarr;</kbd> next &bull; <kbd>R</kbd> restart</span>
      </div>
    </div>
  );
};
