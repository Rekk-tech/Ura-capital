import React from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronRight, ArrowLeft, Layers } from "lucide-react";
import { useFlashcardsQuery } from "../hooks/use-academy";
import { FlashcardReviewContainer } from "../components/FlashcardReviewContainer";
import {
  FlashcardLoadingSkeleton,
  AuthRequiredCard,
  NotFoundState,
  ErrorState,
} from "../components/AcademyStates";
import { AcademyApiError } from "../types/academy-ui.types";

export const FlashcardReviewPage: React.FC = () => {
  const { courseSlug, lessonSlug } = useParams<{ courseSlug: string; lessonSlug: string }>();

  const { data, isLoading, isError, error, refetch } = useFlashcardsQuery(courseSlug, lessonSlug);

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="academy-page-container">
        <FlashcardLoadingSkeleton />
      </div>
    );
  }

  // 2. Error & Auth Handling
  if (isError) {
    if (error instanceof AcademyApiError) {
      if (error.status === 401) {
        return (
          <div className="academy-page-container">
            <AuthRequiredCard
              courseSlug={courseSlug}
              lessonSlug={lessonSlug}
              returnPath={
                courseSlug && lessonSlug
                  ? `/academy/courses/${encodeURIComponent(courseSlug)}/lessons/${encodeURIComponent(lessonSlug)}/flashcards`
                  : undefined
              }
            />
          </div>
        );
      }
      if (error.status === 404) {
        return (
          <div className="academy-page-container">
            <NotFoundState
              title="Flashcards Unavailable"
              message="The requested flashcards could not be found or are not currently available."
              backTo={
                courseSlug && lessonSlug
                  ? `/academy/courses/${encodeURIComponent(courseSlug)}/lessons/${encodeURIComponent(lessonSlug)}`
                  : "/academy"
              }
              backLabel="Back to Lesson"
            />
          </div>
        );
      }
    }

    return (
      <div className="academy-page-container">
        <ErrorState
          message={error instanceof Error ? error.message : "Failed to load flashcards."}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const flashcardsResponse = data?.data;
  const lessonTitle = flashcardsResponse?.lessonTitle || "Lesson";
  const flashcards = flashcardsResponse?.flashcards || [];

  const lessonUrl =
    courseSlug && lessonSlug
      ? `/academy/courses/${encodeURIComponent(courseSlug)}/lessons/${encodeURIComponent(lessonSlug)}`
      : "/academy";

  // 3. Empty Deck State (HTTP 200 with 0 flashcards)
  if (flashcards.length === 0) {
    return (
      <div className="academy-page-container">
        {/* Breadcrumb Navigation */}
        <nav className="academy-breadcrumb" aria-label="Breadcrumb">
          <Link to="/academy">Academy</Link>
          <ChevronRight className="breadcrumb-separator" size={14} aria-hidden="true" />
          {courseSlug && (
            <>
              <Link to={`/academy/courses/${encodeURIComponent(courseSlug)}`}>Course</Link>
              <ChevronRight className="breadcrumb-separator" size={14} aria-hidden="true" />
            </>
          )}
          <Link to={lessonUrl}>{lessonTitle}</Link>
          <ChevronRight className="breadcrumb-separator" size={14} aria-hidden="true" />
          <span aria-current="page">Flashcards</span>
        </nav>

        <div className="flashcard-empty-state" data-testid="flashcard-empty-state" role="status">
          <Layers className="academy-state-icon muted-icon" size={48} aria-hidden="true" />
          <h1 className="flashcard-page-title">Flashcards: {lessonTitle}</h1>
          <p className="academy-state-desc">
            This lesson does not currently have any flashcards available for review.
          </p>
          <Link to={lessonUrl} className="btn btn-primary">
            <ArrowLeft size={16} className="mr-2 inline" aria-hidden="true" />
            Back to Lesson
          </Link>
        </div>
      </div>
    );
  }

  // 4. Active Flashcard Review View
  return (
    <div className="academy-page-container">
      {/* Breadcrumb Navigation */}
      <nav className="academy-breadcrumb" aria-label="Breadcrumb">
        <Link to="/academy">Academy</Link>
        <ChevronRight className="breadcrumb-separator" size={14} aria-hidden="true" />
        {courseSlug && (
          <>
            <Link to={`/academy/courses/${encodeURIComponent(courseSlug)}`}>Course</Link>
            <ChevronRight className="breadcrumb-separator" size={14} aria-hidden="true" />
          </>
        )}
        <Link to={lessonUrl}>{lessonTitle}</Link>
        <ChevronRight className="breadcrumb-separator" size={14} aria-hidden="true" />
        <span aria-current="page">Flashcards</span>
      </nav>

      {/* Page-level Header with exactly one <h1> */}
      <header className="flashcard-page-header">
        <div className="flashcard-page-header-top">
          <Link to={lessonUrl} className="flashcard-back-link" aria-label="Back to Lesson">
            <ArrowLeft size={16} className="mr-1 inline" aria-hidden="true" />
            <span>Back to Lesson</span>
          </Link>
        </div>
        <h1 className="flashcard-page-title" data-testid="flashcard-page-title">
          Flashcards: {lessonTitle}
        </h1>
        <p className="flashcard-page-subtitle">
          Test your recall with interactive front-and-back study cards.
        </p>
      </header>

      {/* Interactive Review Container */}
      <FlashcardReviewContainer
        flashcards={flashcards}
        courseSlug={courseSlug || ""}
        lessonSlug={lessonSlug || ""}
        lessonTitle={lessonTitle}
      />
    </div>
  );
};
