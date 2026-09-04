import React, { useMemo } from "react";
import { sanitizeLessonMarkdown } from "../utils/markdown-sanitizer";

interface LessonContentProps {
  content: string | null | undefined;
}

/**
 * Isolated component for rendering educational lesson content.
 * Markdown is parsed with raw HTML suppression and sanitized by DOMPurify
 * before being rendered via dangerouslySetInnerHTML.
 * Unsanitized dangerouslySetInnerHTML is strictly prohibited.
 */
export const LessonContent: React.FC<LessonContentProps> = ({ content }) => {
  const sanitizedHtml = useMemo(() => {
    return sanitizeLessonMarkdown(content);
  }, [content]);

  if (!sanitizedHtml) {
    return (
      <div className="lesson-empty-content" role="status">
        <p>No content is available for this lesson.</p>
      </div>
    );
  }

  return (
    <div
      className="prose lesson-prose-content"
      data-testid="lesson-content-body"
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
};
