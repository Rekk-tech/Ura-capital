import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuizPlayer } from "./QuizPlayer";
import { QuizDefinitionDto, QuizAttemptDto, QuizResultDto } from "../types/academy-ui.types";

const mockQuiz: QuizDefinitionDto = {
  id: "quiz-crypto-1",
  courseSlug: "crypto-fundamentals",
  lessonSlug: "blockchain-basics",
  lessonTitle: "Blockchain Basics",
  title: "Blockchain Knowledge Check",
  description: "Test your understanding of distributed ledgers and hashing.",
  passingScore: 80,
  totalQuestions: 2,
  questions: [
    {
      id: "q1",
      prompt: "What is a blockchain block primarily composed of?",
      type: "SINGLE_CHOICE",
      order: 1,
      options: [
        { id: "opt-1a", text: "Transactions and header hash", order: 1 },
        { id: "opt-1b", text: "Plain text spreadsheets", order: 2 },
      ],
    },
    {
      id: "q2",
      prompt: "What provides immutability in proof-of-work chains?",
      type: "SINGLE_CHOICE",
      order: 2,
      options: [
        { id: "opt-2a", text: "Cryptographic work and cumulative difficulty", order: 1 },
        { id: "opt-2b", text: "Central bank guarantees", order: 2 },
      ],
    },
  ],
};

const mockActiveAttempt: QuizAttemptDto = {
  id: "attempt-1",
  quizId: "quiz-crypto-1",
  attemptNumber: 1,
  status: "IN_PROGRESS",
  startedAt: "2026-09-25T10:00:00Z",
  answers: [
    { questionId: "q1", selectedOptionId: "opt-1a", updatedAt: "2026-09-25T10:01:00Z" },
    { questionId: "q2", selectedOptionId: null, updatedAt: "2026-09-25T10:01:00Z" },
  ],
};

const mockGradedResult: QuizResultDto = {
  attemptId: "attempt-1",
  quizId: "quiz-crypto-1",
  status: "GRADED",
  score: 100,
  passed: true,
  submittedAt: "2026-09-25T10:05:00Z",
  gradedAt: "2026-09-25T10:05:01Z",
  answers: [
    { questionId: "q1", selectedOptionId: "opt-1a", isCorrect: true, correctOptionId: "opt-1a" },
    { questionId: "q2", selectedOptionId: "opt-2a", isCorrect: true, correctOptionId: "opt-2a" },
  ],
};

describe("QuizPlayer (Interactive Quiz Component & Answer Secrecy - FR-003, AC-003)", () => {
  it("renders quiz header, questions count, and passing score requirement", () => {
    render(
      <QuizPlayer
        quiz={mockQuiz}
        activeAttempt={null}
        gradedResult={null}
        onStartAttempt={vi.fn()}
        onSelectOption={vi.fn()}
        onSubmitAttempt={vi.fn()}
      />
    );

    expect(screen.getByRole("heading", { level: 2, name: "Blockchain Knowledge Check" })).toBeDefined();
    expect(screen.getByText("Test your understanding of distributed ledgers and hashing.")).toBeDefined();
    expect(screen.getByTestId("quiz-question-count").textContent).toContain("2 Questions");
    expect(screen.getByTestId("quiz-passing-score").textContent).toContain("Passing Score: 80%");
  });

  it("enforces Answer Secrecy: does NOT leak correct answers or correct indicators during active attempt", () => {
    const { container } = render(
      <QuizPlayer
        quiz={mockQuiz}
        activeAttempt={mockActiveAttempt}
        gradedResult={null}
        onStartAttempt={vi.fn()}
        onSelectOption={vi.fn()}
        onSubmitAttempt={vi.fn()}
      />
    );

    // Verify option elements contain text and inputs only, never isCorrect or correct attributes
    expect(container.querySelector("[data-correct]")).toBeNull();
    expect(container.querySelector(".correct-answer")).toBeNull();
    expect(container.innerHTML).not.toContain("isCorrect");
    expect(container.innerHTML).not.toContain("correctOptionId");
  });

  it("handles Start Quiz action", () => {
    const startSpy = vi.fn();
    render(
      <QuizPlayer
        quiz={mockQuiz}
        activeAttempt={null}
        gradedResult={null}
        onStartAttempt={startSpy}
        onSelectOption={vi.fn()}
        onSubmitAttempt={vi.fn()}
      />
    );

    const startBtn = screen.getByTestId("start-quiz-button");
    fireEvent.click(startBtn);
    expect(startSpy).toHaveBeenCalledTimes(1);
  });

  it("handles draft answer selection and shows saving indicator", () => {
    const selectSpy = vi.fn();
    render(
      <QuizPlayer
        quiz={mockQuiz}
        activeAttempt={mockActiveAttempt}
        gradedResult={null}
        savingQuestionId="q2"
        onStartAttempt={vi.fn()}
        onSelectOption={selectSpy}
        onSubmitAttempt={vi.fn()}
      />
    );

    // q2 saving indicator should be visible
    expect(screen.getByTestId("saving-indicator")).toBeDefined();

    // Click option 2b
    const optInput = screen.getByTestId("radio-opt-2b");
    fireEvent.click(optInput);
    expect(selectSpy).toHaveBeenCalledWith("q2", "opt-2b");
  });

  it("enables submit when all questions are answered and calls onSubmitAttempt", () => {
    const submitSpy = vi.fn();
    const allAnsweredAttempt: QuizAttemptDto = {
      ...mockActiveAttempt,
      answers: [
        { questionId: "q1", selectedOptionId: "opt-1a", updatedAt: "2026-09-25T10:01:00Z" },
        { questionId: "q2", selectedOptionId: "opt-2a", updatedAt: "2026-09-25T10:01:00Z" },
      ],
    };

    render(
      <QuizPlayer
        quiz={mockQuiz}
        activeAttempt={allAnsweredAttempt}
        gradedResult={null}
        onStartAttempt={vi.fn()}
        onSelectOption={vi.fn()}
        onSubmitAttempt={submitSpy}
      />
    );

    const submitBtn = screen.getByTestId("submit-quiz-button");
    expect(submitBtn).toBeDefined();
    fireEvent.click(submitBtn);
    expect(submitSpy).toHaveBeenCalledTimes(1);
  });

  it("renders server-authoritative graded result, breakdown, server XP, and retake action", () => {
    const retakeSpy = vi.fn();
    render(
      <QuizPlayer
        quiz={mockQuiz}
        activeAttempt={null}
        gradedResult={mockGradedResult}
        serverXp={250}
        onStartAttempt={vi.fn()}
        onSelectOption={vi.fn()}
        onSubmitAttempt={vi.fn()}
        onRetakeQuiz={retakeSpy}
      />
    );

    expect(screen.getByTestId("quiz-result-badge").textContent).toBe("PASSED");
    expect(screen.getByText(/Final Score:/i).textContent).toContain("100%");
    expect(screen.getByTestId("quiz-earned-xp").textContent).toContain("Learner Total XP: 250 XP (Server Verified)");

    // Per-question breakdown
    expect(screen.getByTestId("question-correctness-q1").textContent).toContain("Correct");
    expect(screen.getByTestId("question-correctness-q2").textContent).toContain("Correct");

    // Retake button
    const retakeBtn = screen.getByTestId("retake-quiz-button");
    fireEvent.click(retakeBtn);
    expect(retakeSpy).toHaveBeenCalledTimes(1);
  });
});
