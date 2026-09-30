import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { FlashcardReviewContainer } from "./FlashcardReviewContainer";

const mockFlashcards = [
  {
    id: "card-1",
    front: "What is Alpha in investing?",
    back: "Alpha represents an investment strategy's ability to beat the market return.",
    order: 1,
  },
  {
    id: "card-2",
    front: "What is Beta?",
    back: "Beta measures the volatility of an asset compared to the overall market.",
    order: 2,
  },
];

describe("FlashcardReviewContainer", () => {
  it("renders the first flashcard front side and navigation buttons", () => {
    render(
      <BrowserRouter>
        <FlashcardReviewContainer
          flashcards={mockFlashcards}
          courseSlug="investing-101"
          lessonSlug="market-indicators"
          lessonTitle="Market Indicators"
        />
      </BrowserRouter>
    );

    // Header counter
    expect(screen.getByTestId("flashcard-position-badge").textContent).toContain("Card 1 of 2");

    // Front content
    expect(screen.getByText("What is Alpha in investing?")).toBeDefined();
    expect(screen.getByTestId("flashcard-reveal-button")).toBeDefined();

    // Previous button is disabled on card 1
    const prevBtn = screen.getByTestId("flashcard-prev-button") as HTMLButtonElement;
    expect(prevBtn.disabled).toBe(true);

    // Next button is enabled
    const nextBtn = screen.getByTestId("flashcard-next-button") as HTMLButtonElement;
    expect(nextBtn.disabled).toBe(false);
  });

  it("reveals card back upon clicking Reveal Answer button", () => {
    render(
      <BrowserRouter>
        <FlashcardReviewContainer
          flashcards={mockFlashcards}
          courseSlug="investing-101"
          lessonSlug="market-indicators"
          lessonTitle="Market Indicators"
        />
      </BrowserRouter>
    );

    const revealBtn = screen.getByTestId("flashcard-reveal-button");
    fireEvent.click(revealBtn);

    expect(
      screen.getByText("Alpha represents an investment strategy's ability to beat the market return.")
    ).toBeDefined();
    expect(screen.getByText("Answer")).toBeDefined();
  });

  it("navigates with keyboard shortcuts: Enter/Space to reveal, ArrowRight to next, ArrowLeft to prev", () => {
    render(
      <BrowserRouter>
        <FlashcardReviewContainer
          flashcards={mockFlashcards}
          courseSlug="investing-101"
          lessonSlug="market-indicators"
          lessonTitle="Market Indicators"
        />
      </BrowserRouter>
    );

    // Press Space (key: " ") to reveal
    fireEvent.keyDown(window, { key: " " });
    expect(
      screen.getByText("Alpha represents an investment strategy's ability to beat the market return.")
    ).toBeDefined();

    // Press ArrowRight to go to next card
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByTestId("flashcard-position-badge").textContent).toContain("Card 2 of 2");
    expect(screen.getByText("What is Beta?")).toBeDefined();

    // Press ArrowLeft to go back to card 1
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(screen.getByTestId("flashcard-position-badge").textContent).toContain("Card 1 of 2");
    expect(screen.getByText("What is Alpha in investing?")).toBeDefined();
  });

  it("renders completion screen when finishing the deck and allows return to lesson or restart", () => {
    render(
      <BrowserRouter>
        <FlashcardReviewContainer
          flashcards={mockFlashcards}
          courseSlug="investing-101"
          lessonSlug="market-indicators"
          lessonTitle="Market Indicators"
        />
      </BrowserRouter>
    );

    // Card 1 -> click next
    fireEvent.click(screen.getByTestId("flashcard-next-button"));
    expect(screen.getByTestId("flashcard-position-badge").textContent).toContain("Card 2 of 2");

    // Card 2 -> click Finish
    const finishBtn = screen.getByTestId("flashcard-next-button");
    expect(finishBtn.textContent).toContain("Finish");
    fireEvent.click(finishBtn);

    // Completed view
    expect(screen.getByTestId("flashcard-completed-view")).toBeDefined();
    expect(screen.getByText("Deck Completed!")).toBeDefined();
    expect(screen.getByText("You reviewed all 2 flashcards in this lesson.")).toBeDefined();

    // Check Return to Lesson link
    const returnLessonBtn = screen.getByTestId("flashcard-return-lesson-btn");
    expect(returnLessonBtn.getAttribute("href")).toBe(
      "/academy/courses/investing-101/lessons/market-indicators"
    );

    // Check Restart Review button
    const restartBtn = screen.getByTestId("flashcard-restart-btn");
    fireEvent.click(restartBtn);

    // Should return to card 1
    expect(screen.getByTestId("flashcard-position-badge").textContent).toContain("Card 1 of 2");
    expect(screen.getByText("What is Alpha in investing?")).toBeDefined();
  });
});
