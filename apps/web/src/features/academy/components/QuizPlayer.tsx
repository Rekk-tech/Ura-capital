import React from "react";
import { HelpCircle, CheckCircle, XCircle, Award, RefreshCw, Send, Play } from "lucide-react";
import {
  QuizDefinitionDto,
  QuizAttemptDto,
  QuizResultDto,
} from "../types/academy-ui.types";

export interface QuizPlayerProps {
  quiz: QuizDefinitionDto;
  activeAttempt: QuizAttemptDto | null;
  gradedResult: QuizResultDto | null;
  isStarting?: boolean;
  isSaving?: boolean;
  isSubmitting?: boolean;
  savingQuestionId?: string | null;
  startError?: string | null;
  saveError?: string | null;
  submitError?: string | null;
  onStartAttempt: () => void;
  onSelectOption: (questionId: string, optionId: string) => void;
  onSubmitAttempt: () => void;
  onRetakeQuiz?: () => void;
  serverXp?: number;
}

export const QuizPlayer: React.FC<QuizPlayerProps> = ({
  quiz,
  activeAttempt,
  gradedResult,
  isStarting = false,
  isSaving = false,
  isSubmitting = false,
  savingQuestionId = null,
  startError = null,
  saveError = null,
  submitError = null,
  onStartAttempt,
  onSelectOption,
  onSubmitAttempt,
  onRetakeQuiz,
  serverXp,
}) => {
  const answeredCount = activeAttempt
    ? activeAttempt.answers.filter((a) => a.selectedOptionId !== null).length
    : 0;
  const totalCount = quiz.questions.length;
  const isAllAnswered = totalCount > 0 && answeredCount === totalCount;

  return (
    <section
      className="lesson-quiz-section quiz-player-container"
      data-testid="lesson-quiz-card"
      aria-labelledby="quiz-player-title"
      style={{
        marginTop: "2.5rem",
        padding: "1.75rem",
        borderRadius: "0.75rem",
        border: "1px solid var(--color-border, #334155)",
        backgroundColor: "var(--color-surface, #1e293b)",
      }}
    >
      {/* Quiz Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "0.75rem",
        }}
      >
        <HelpCircle
          size={20}
          style={{ color: "var(--color-primary, #38bdf8)" }}
          aria-hidden="true"
        />
        <h2
          id="quiz-player-title"
          style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0 }}
        >
          {quiz.title}
        </h2>
      </div>

      {quiz.description && (
        <p
          style={{
            color: "var(--color-text-muted, #94a3b8)",
            marginBottom: "1rem",
            fontSize: "0.9375rem",
          }}
        >
          {quiz.description}
        </p>
      )}

      {/* Meta Pills */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "0.25rem 0.75rem",
            borderRadius: "9999px",
            fontSize: "0.875rem",
            backgroundColor: "rgba(56, 189, 248, 0.1)",
            color: "#38bdf8",
            fontWeight: 500,
          }}
          data-testid="quiz-question-count"
        >
          {quiz.totalQuestions} {quiz.totalQuestions === 1 ? "Question" : "Questions"}
        </span>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "0.25rem 0.75rem",
            borderRadius: "9999px",
            fontSize: "0.875rem",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            color: "#10b981",
            fontWeight: 500,
          }}
          data-testid="quiz-passing-score"
        >
          Passing Score: {quiz.passingScore}%
        </span>

        {activeAttempt && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "0.25rem 0.75rem",
              borderRadius: "9999px",
              fontSize: "0.875rem",
              backgroundColor: "rgba(234, 179, 8, 0.1)",
              color: "#eab308",
              fontWeight: 500,
            }}
            data-testid="attempt-status-badge"
          >
            Attempt #{activeAttempt.attemptNumber} &bull; In Progress
          </span>
        )}
      </div>

      {/* 1. Graded Result State */}
      {gradedResult && (
        <div
          className="quiz-graded-card"
          data-testid="quiz-graded-card"
          style={{
            marginTop: "1.5rem",
            padding: "1.5rem",
            borderRadius: "0.5rem",
            backgroundColor: gradedResult.passed
              ? "rgba(34, 197, 94, 0.08)"
              : "rgba(239, 68, 68, 0.08)",
            border: `1px solid ${
              gradedResult.passed ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)"
            }`,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  margin: 0,
                  color: gradedResult.passed ? "#22c55e" : "#ef4444",
                }}
              >
                Quiz {gradedResult.passed ? "Passed" : "Failed"}
              </h3>
              <p
                style={{
                  margin: "0.25rem 0 0 0",
                  fontSize: "0.875rem",
                  color: "var(--color-text-muted, #94a3b8)",
                }}
              >
                Final Score:{" "}
                <strong style={{ color: "var(--color-text, #fff)" }}>
                  {gradedResult.score}%
                </strong>
              </p>
            </div>
            <span
              data-testid="quiz-result-badge"
              style={{
                padding: "0.25rem 0.75rem",
                borderRadius: "9999px",
                fontSize: "0.75rem",
                fontWeight: 600,
                backgroundColor: gradedResult.passed
                  ? "rgba(34, 197, 94, 0.2)"
                  : "rgba(239, 68, 68, 0.2)",
                color: gradedResult.passed ? "#22c55e" : "#ef4444",
              }}
            >
              {gradedResult.passed ? "PASSED" : "FAILED"}
            </span>
          </div>

          {/* Authoritative Server XP presentation */}
          {gradedResult.passed && serverXp !== undefined && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 0.75rem",
                borderRadius: "0.375rem",
                backgroundColor: "rgba(234, 179, 8, 0.15)",
                color: "#facc15",
                fontSize: "0.875rem",
                fontWeight: 600,
                marginBottom: "1rem",
              }}
              data-testid="quiz-earned-xp"
            >
              <Award size={16} aria-hidden="true" />
              <span>Learner Total XP: {serverXp} XP (Server Verified)</span>
            </div>
          )}

          {/* Per-question correctness breakdown */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              marginTop: "1rem",
            }}
          >
            {quiz.questions.map((q, idx) => {
              const ans = gradedResult.answers.find((a) => a.questionId === q.id);
              const isCorrect = ans?.isCorrect ?? false;
              return (
                <div
                  key={q.id}
                  data-testid={`graded-question-${q.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "0.375rem",
                    backgroundColor: "rgba(255, 255, 255, 0.02)",
                    fontSize: "0.875rem",
                    gap: "1rem",
                  }}
                >
                  <span>
                    {idx + 1}. {q.prompt}
                  </span>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      color: isCorrect ? "#22c55e" : "#ef4444",
                      fontWeight: 500,
                      flexShrink: 0,
                    }}
                    data-testid={`question-correctness-${q.id}`}
                  >
                    {isCorrect ? (
                      <>
                        <CheckCircle size={14} /> Correct
                      </>
                    ) : (
                      <>
                        <XCircle size={14} /> Incorrect
                      </>
                    )}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Retake action */}
          <div style={{ marginTop: "1.5rem" }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={onRetakeQuiz ?? onStartAttempt}
              disabled={isStarting}
              data-testid="retake-quiz-button"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                cursor: isStarting ? "not-allowed" : "pointer",
              }}
            >
              <RefreshCw
                size={16}
                className={isStarting ? "animate-spin" : undefined}
                aria-hidden="true"
              />
              {isStarting ? "Starting New Attempt..." : "Retake Quiz"}
            </button>
          </div>
        </div>
      )}

      {/* 2. Initial / Not Started State */}
      {!gradedResult && !activeAttempt && (
        <div style={{ marginTop: "1rem" }}>
          {startError && (
            <p
              style={{ color: "#ef4444", fontSize: "0.875rem", marginBottom: "0.75rem" }}
              data-testid="start-quiz-error"
              role="alert"
            >
              {startError}
            </p>
          )}
          <button
            type="button"
            className="btn btn-primary"
            onClick={onStartAttempt}
            disabled={isStarting}
            data-testid="start-quiz-button"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              cursor: isStarting ? "not-allowed" : "pointer",
            }}
          >
            <Play size={16} aria-hidden="true" />
            {isStarting ? "Starting Quiz..." : "Start Quiz"}
          </button>
        </div>
      )}

      {/* 3. Active Attempt In Progress (Answer Secrecy Guaranteed) */}
      {!gradedResult && activeAttempt && (
        <div
          className="quiz-attempt-questions"
          data-testid="quiz-attempt-container"
          style={{
            marginTop: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
          }}
        >
          {saveError && (
            <p
              style={{ color: "#ef4444", fontSize: "0.875rem", margin: 0 }}
              data-testid="save-draft-error"
              role="alert"
            >
              {saveError}
            </p>
          )}

          {quiz.questions.map((q, qIndex) => {
            const savedAnswer = activeAttempt.answers.find(
              (a) => a.questionId === q.id,
            );
            const selectedOptId = savedAnswer?.selectedOptionId ?? null;
            const isSavingThis = savingQuestionId === q.id;

            return (
              <div
                key={q.id}
                className="quiz-question-card"
                data-testid="quiz-question-item"
                style={{
                  padding: "1rem",
                  borderRadius: "0.5rem",
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid var(--color-border, #334155)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.75rem",
                  }}
                >
                  <h3
                    style={{ fontSize: "1rem", fontWeight: 600, margin: 0 }}
                    data-testid={`question-prompt-${q.id}`}
                  >
                    {qIndex + 1}. {q.prompt}
                  </h3>
                  {isSavingThis && (
                    <span
                      style={{ fontSize: "0.75rem", color: "#38bdf8" }}
                      data-testid="saving-indicator"
                    >
                      Saving...
                    </span>
                  )}
                </div>

                <div
                  style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
                  role="radiogroup"
                  aria-label={`Options for question ${qIndex + 1}`}
                >
                  {q.options.map((opt) => {
                    const isSelected = selectedOptId === opt.id;

                    return (
                      <label
                        key={opt.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          padding: "0.5rem 0.75rem",
                          borderRadius: "0.375rem",
                          backgroundColor: isSelected
                            ? "rgba(56, 189, 248, 0.15)"
                            : "rgba(255, 255, 255, 0.02)",
                          border: isSelected
                            ? "1px solid #38bdf8"
                            : "1px solid transparent",
                          cursor: isSavingThis ? "wait" : "pointer",
                        }}
                        data-testid={`option-${opt.id}`}
                      >
                        <input
                          type="radio"
                          name={`question-${q.id}`}
                          value={opt.id}
                          checked={isSelected}
                          disabled={isSavingThis || isSubmitting}
                          onChange={() => onSelectOption(q.id, opt.id)}
                          data-testid={`radio-${opt.id}`}
                          style={{
                            accentColor: "var(--color-primary, #38bdf8)",
                            cursor: "pointer",
                          }}
                        />
                        <span style={{ fontSize: "0.875rem" }}>{opt.text}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Submit Quiz Controls */}
          <div
            style={{
              marginTop: "0.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            {submitError && (
              <p
                style={{ color: "#ef4444", fontSize: "0.875rem", margin: 0 }}
                data-testid="submit-quiz-error"
                role="alert"
              >
                {submitError}
              </p>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "1rem",
              }}
            >
              <span
                style={{
                  fontSize: "0.875rem",
                  color: "var(--color-text-muted, #94a3b8)",
                }}
                data-testid="answered-counter"
              >
                {answeredCount} of {totalCount} questions answered
              </span>

              {isAllAnswered && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={onSubmitAttempt}
                  disabled={isSubmitting || isSaving}
                  data-testid="submit-quiz-button"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                  }}
                >
                  <Send size={16} aria-hidden="true" />
                  {isSubmitting ? "Submitting Quiz..." : "Submit Quiz"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
