import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FlashcardReviewPage } from "./FlashcardReviewPage";
import { academyApi } from "../../../api/academy.api";
import { AcademyApiError } from "../types/academy-ui.types";

const mockFlashcardsResponse = {
  data: {
    courseSlug: "crypto-fundamentals",
    lessonSlug: "proof-of-work",
    lessonTitle: "Proof of Work Consensus",
    flashcards: [
      {
        front: "What is **Proof of Work**?",
        back: "A consensus algorithm where miners compete to solve cryptographic puzzles.",
        order: 1,
      },
      {
        front: "What determines mining difficulty?",
        back: "The target block time and total network hash rate.",
        order: 2,
      },
      {
        front: "# What is the 51% attack vector?\n\nCan it reverse old blocks?",
        back: "An attacker gaining >50% hash rate. Can reorganize recent blocks, not arbitrary history.",
        order: 3,
      },
    ],
    totalCount: 3,
  },
};

const mockEmptyFlashcardsResponse = {
  data: {
    courseSlug: "crypto-fundamentals",
    lessonSlug: "proof-of-work",
    lessonTitle: "Proof of Work Consensus",
    flashcards: [],
    totalCount: 0,
  },
};

function renderWithProviders(courseSlug = "crypto-fundamentals", lessonSlug = "proof-of-work") {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/academy/courses/${courseSlug}/lessons/${lessonSlug}/flashcards`]}>
        <Routes>
          <Route
            path="/academy/courses/:courseSlug/lessons/:lessonSlug/flashcards"
            element={<FlashcardReviewPage />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("FlashcardReviewPage (FEAT-022: AC-001..AC-018)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // AC-001, AC-007, AC-014: Single H1, Loading, Position Badge, Front rendered
  it("renders page header with single h1, position badge, and front prompt card", async () => {
    vi.spyOn(academyApi, "getLessonFlashcards").mockResolvedValue(mockFlashcardsResponse);

    const { container } = renderWithProviders();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 1, name: "Flashcards: Proof of Work Consensus" })
      ).toBeDefined();
    });

    // Verify exactly one <h1> element on the page
    const h1Elements = container.querySelectorAll("h1");
    expect(h1Elements.length).toBe(1);

    // Position indicator
    expect(screen.getByTestId("flashcard-position-badge").textContent).toBe("Card 1 of 3");

    // Front content visible
    expect(screen.getByTestId("flashcard-front-content")).toBeDefined();
    expect(screen.getByText(/What is/i)).toBeDefined();

    // Previous button initially disabled on first card
    const prevBtn = screen.getByTestId("flashcard-prev-button");
    expect(prevBtn.getAttribute("disabled")).not.toBeNull();
  });

  // AC-008: Option A - Back absent from DOM before explicit Reveal
  it("ensures back answer is completely ABSENT from DOM before explicit reveal", async () => {
    vi.spyOn(academyApi, "getLessonFlashcards").mockResolvedValue(mockFlashcardsResponse);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByTestId("flashcard-front-content")).toBeDefined();
    });

    // Reveal button present with aria-expanded="false"
    const revealBtn = screen.getByTestId("flashcard-reveal-button");
    expect(revealBtn.getAttribute("aria-expanded")).toBe("false");

    // CRITICAL: Back answer must NOT exist in the DOM (not just hidden with CSS)
    expect(
      screen.queryByText(/A consensus algorithm where miners compete to solve cryptographic puzzles/i)
    ).toBeNull();
    expect(screen.queryByTestId("flashcard-back-section")).toBeNull();
  });

  // AC-008, AC-009: Explicit Reveal action mounts back section
  it("mounts back section and answer into DOM upon clicking Reveal Answer", async () => {
    vi.spyOn(academyApi, "getLessonFlashcards").mockResolvedValue(mockFlashcardsResponse);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByTestId("flashcard-reveal-button")).toBeDefined();
    });

    const revealBtn = screen.getByTestId("flashcard-reveal-button");
    fireEvent.click(revealBtn);

    // Now back section must be mounted
    await waitFor(() => {
      expect(screen.getByTestId("flashcard-back-section")).toBeDefined();
    });

    expect(
      screen.getByText("A consensus algorithm where miners compete to solve cryptographic puzzles.")
    ).toBeDefined();
    // Reveal button is replaced by back section
    expect(screen.queryByTestId("flashcard-reveal-button")).toBeNull();
  });

  // AC-009, AC-010: Next resets reveal state for new card
  it("advances to next card and RESETS reveal state so back is absent again", async () => {
    vi.spyOn(academyApi, "getLessonFlashcards").mockResolvedValue(mockFlashcardsResponse);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByTestId("flashcard-reveal-button")).toBeDefined();
    });

    // Reveal card 1
    fireEvent.click(screen.getByTestId("flashcard-reveal-button"));
    expect(screen.getByTestId("flashcard-back-section")).toBeDefined();

    // Click Next
    fireEvent.click(screen.getByTestId("flashcard-next-button"));

    // Now on card 2
    expect(screen.getByTestId("flashcard-position-badge").textContent).toBe("Card 2 of 3");
    expect(screen.getByText("What determines mining difficulty?")).toBeDefined();

    // CRITICAL: Card 2 back must NOT be mounted!
    expect(screen.queryByTestId("flashcard-back-section")).toBeNull();
    expect(
      screen.queryByText("The target block time and total network hash rate.")
    ).toBeNull();
    expect(screen.getByTestId("flashcard-reveal-button")).toBeDefined();

    // Previous button should now be enabled
    expect(screen.getByTestId("flashcard-prev-button").getAttribute("disabled")).toBeNull();
  });

  // AC-009, AC-010: Previous navigation resets reveal state
  it("navigates to previous card and resets reveal state", async () => {
    vi.spyOn(academyApi, "getLessonFlashcards").mockResolvedValue(mockFlashcardsResponse);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByTestId("flashcard-next-button")).toBeDefined();
    });

    // Advance to Card 2
    fireEvent.click(screen.getByTestId("flashcard-next-button"));
    expect(screen.getByTestId("flashcard-position-badge").textContent).toBe("Card 2 of 3");

    // Reveal Card 2
    fireEvent.click(screen.getByTestId("flashcard-reveal-button"));
    expect(screen.getByTestId("flashcard-back-section")).toBeDefined();

    // Click Previous back to Card 1
    fireEvent.click(screen.getByTestId("flashcard-prev-button"));
    expect(screen.getByTestId("flashcard-position-badge").textContent).toBe("Card 1 of 3");

    // Card 1 back is reset to absent
    expect(screen.queryByTestId("flashcard-back-section")).toBeNull();
    expect(screen.getByTestId("flashcard-reveal-button")).toBeDefined();
  });

  // AC-010: Completion state and Restart session
  it("displays completion state when finishing deck and resets on restart", async () => {
    vi.spyOn(academyApi, "getLessonFlashcards").mockResolvedValue(mockFlashcardsResponse);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByTestId("flashcard-next-button")).toBeDefined();
    });

    // Advance to Card 2
    fireEvent.click(screen.getByTestId("flashcard-next-button"));
    // Advance to Card 3
    fireEvent.click(screen.getByTestId("flashcard-next-button"));
    expect(screen.getByTestId("flashcard-position-badge").textContent).toBe("Card 3 of 3");

    // Finish review (button says Finish)
    const finishBtn = screen.getByTestId("flashcard-next-button");
    expect(finishBtn.textContent).toContain("Finish");
    fireEvent.click(finishBtn);

    // Deck completed view
    expect(screen.getByTestId("flashcard-completed-view")).toBeDefined();
    expect(screen.getByText("Deck Completed!")).toBeDefined();
    expect(screen.getByText(/You reviewed all 3 flashcards in this lesson/i)).toBeDefined();

    // Click Restart
    const restartBtn = screen.getByRole("button", { name: /Restart Review/i });
    fireEvent.click(restartBtn);

    // Reset back to Card 1 in READY_FRONT state
    expect(screen.getByTestId("flashcard-position-badge").textContent).toBe("Card 1 of 3");
    expect(screen.queryByTestId("flashcard-back-section")).toBeNull();
  });

  // AC-012: Keyboard navigation & interactive element guard
  it("supports keyboard navigation (Space/Enter reveal, Arrow keys, R restart) and guards interactive inputs", async () => {
    vi.spyOn(academyApi, "getLessonFlashcards").mockResolvedValue(mockFlashcardsResponse);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByTestId("flashcard-reveal-button")).toBeDefined();
    });

    // 1. Space key reveals card
    fireEvent.keyDown(window, { key: " " });
    expect(screen.getByTestId("flashcard-back-section")).toBeDefined();

    // 2. ArrowRight advances to Card 2
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByTestId("flashcard-position-badge").textContent).toBe("Card 2 of 3");
    expect(screen.queryByTestId("flashcard-back-section")).toBeNull();

    // 3. ArrowLeft returns to Card 1
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(screen.getByTestId("flashcard-position-badge").textContent).toBe("Card 1 of 3");

    // 4. R key restarts session
    fireEvent.keyDown(window, { key: "r" });
    expect(screen.getByTestId("flashcard-position-badge").textContent).toBe("Card 1 of 3");

    // 5. Interactive guard: simulate typing inside an input element
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    // Firing Space on input should NOT trigger reveal on container
    fireEvent.keyDown(input, { key: " " });
    expect(screen.queryByTestId("flashcard-back-section")).toBeNull();

    document.body.removeChild(input);
  });

  // DEF-022-01 Regression: Interactive ancestor inspection and nested control guard
  it("guards against shortcut hijacking across nested interactive elements (DEF-022-01)", async () => {
    vi.spyOn(academyApi, "getLessonFlashcards").mockResolvedValue(mockFlashcardsResponse);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByTestId("flashcard-reveal-button")).toBeDefined();
    });

    const testArea = document.createElement("div");
    testArea.setAttribute("data-testid", "test-interactive-harness");
    document.body.appendChild(testArea);

    try {
      // A. Direct button target
      const directButton = document.createElement("button");
      directButton.textContent = "Action";
      testArea.appendChild(directButton);
      expect(screen.queryByTestId("flashcard-back-section")).toBeNull();
      fireEvent.keyDown(directButton, { key: " " });
      fireEvent.keyDown(directButton, { key: "Enter" });
      expect(screen.queryByTestId("flashcard-back-section")).toBeNull();

      // B. Nested span inside button
      const buttonWithSpan = document.createElement("button");
      const nestedSpan = document.createElement("span");
      nestedSpan.setAttribute("data-testid", "nested-span");
      nestedSpan.textContent = "Label";
      buttonWithSpan.appendChild(nestedSpan);
      testArea.appendChild(buttonWithSpan);

      expect(screen.queryByTestId("flashcard-back-section")).toBeNull();
      fireEvent.keyDown(nestedSpan, { key: " " });
      expect(screen.queryByTestId("flashcard-back-section")).toBeNull();
      fireEvent.keyDown(nestedSpan, { key: "Enter" });
      expect(screen.queryByTestId("flashcard-back-section")).toBeNull();
      fireEvent.keyDown(nestedSpan, { key: "ArrowRight" });
      expect(screen.getByTestId("flashcard-position-badge").textContent).toBe("Card 1 of 3");

      // C. Nested SVG inside button
      const buttonWithSvg = document.createElement("button");
      const nestedSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      nestedSvg.setAttribute("data-testid", "nested-svg");
      buttonWithSvg.appendChild(nestedSvg);
      testArea.appendChild(buttonWithSvg);

      expect(screen.queryByTestId("flashcard-back-section")).toBeNull();
      fireEvent.keyDown(nestedSvg, { key: " " });
      expect(screen.queryByTestId("flashcard-back-section")).toBeNull();
      fireEvent.keyDown(nestedSvg, { key: "Enter" });
      expect(screen.queryByTestId("flashcard-back-section")).toBeNull();

      // D. Nested link child
      const linkWithSpan = document.createElement("a");
      linkWithSpan.setAttribute("href", "/academy");
      const nestedLinkChild = document.createElement("span");
      nestedLinkChild.setAttribute("data-testid", "nested-link-child");
      nestedLinkChild.textContent = "Back to Academy";
      linkWithSpan.appendChild(nestedLinkChild);
      testArea.appendChild(linkWithSpan);

      expect(screen.queryByTestId("flashcard-back-section")).toBeNull();
      fireEvent.keyDown(nestedLinkChild, { key: " " });
      expect(screen.queryByTestId("flashcard-back-section")).toBeNull();
      fireEvent.keyDown(nestedLinkChild, { key: "Enter" });
      expect(screen.queryByTestId("flashcard-back-section")).toBeNull();

      // E. contenteditable with child element
      const editableDiv = document.createElement("div");
      editableDiv.setAttribute("contenteditable", "true");
      const editableChild = document.createElement("span");
      editableChild.textContent = "Editable child";
      editableDiv.appendChild(editableChild);
      testArea.appendChild(editableDiv);

      expect(screen.queryByTestId("flashcard-back-section")).toBeNull();
      fireEvent.keyDown(editableChild, { key: " " });
      expect(screen.queryByTestId("flashcard-back-section")).toBeNull();
      fireEvent.keyDown(editableChild, { key: "Enter" });
      expect(screen.queryByTestId("flashcard-back-section")).toBeNull();

      // F. Normal non-interactive container: approved shortcut still works
      const nonInteractiveDiv = document.createElement("div");
      nonInteractiveDiv.setAttribute("data-testid", "page-body");
      testArea.appendChild(nonInteractiveDiv);

      expect(screen.queryByTestId("flashcard-back-section")).toBeNull();
      fireEvent.keyDown(nonInteractiveDiv, { key: " " });
      expect(screen.getByTestId("flashcard-back-section")).toBeDefined();
    } finally {
      document.body.removeChild(testArea);
    }
  });

  // AC-013: Markdown sanitization & heading hierarchy downshift
  it("sanitizes markdown and prevents duplicate h1 from user content", async () => {
    const maliciousPayload = {
      data: {
        courseSlug: "crypto-fundamentals",
        lessonSlug: "proof-of-work",
        lessonTitle: "Proof of Work",
        flashcards: [
          {
            front: `# Malicious Heading\n<script>alert('front-xss')</script><img src=x onerror=alert('xss')>`,
            back: `# Back Heading\n<script>alert('back-xss')</script><iframe src="javascript:alert(1)"></iframe>`,
            order: 1,
          },
        ],
        totalCount: 1,
      },
    };

    vi.spyOn(academyApi, "getLessonFlashcards").mockResolvedValue(maliciousPayload);

    const { container } = renderWithProviders();

    await waitFor(() => {
      expect(screen.getByTestId("flashcard-front-content")).toBeDefined();
    });

    // Script and onerror stripped from front
    expect(container.querySelectorAll("script").length).toBe(0);
    const imgs = container.querySelectorAll("img");
    imgs.forEach((img) => {
      expect(img.getAttribute("onerror")).toBeNull();
    });

    // Only one <h1> allowed on the entire page
    const h1s = container.querySelectorAll("h1");
    expect(h1s.length).toBe(1);
    expect(h1s[0]?.textContent).toBe("Flashcards: Proof of Work");

    // User's # was downshifted to <h2>
    expect(screen.getByRole("heading", { level: 2, name: "Malicious Heading" })).toBeDefined();

    // Reveal back
    fireEvent.click(screen.getByTestId("flashcard-reveal-button"));

    // Script and iframe stripped from back
    expect(container.querySelectorAll("script").length).toBe(0);
    expect(container.querySelectorAll("iframe").length).toBe(0);
    // User's back # was downshifted to <h2>
    expect(screen.getByRole("heading", { level: 2, name: "Back Heading" })).toBeDefined();
  });

  // AC-004: Empty Deck State (200 OK with 0 cards)
  it("renders empty deck state on 200 OK with zero cards", async () => {
    vi.spyOn(academyApi, "getLessonFlashcards").mockResolvedValue(mockEmptyFlashcardsResponse);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByTestId("flashcard-empty-state")).toBeDefined();
    });

    expect(
      screen.getByText("This lesson does not currently have any flashcards available for review.")
    ).toBeDefined();
    expect(screen.getByRole("link", { name: /Back to Lesson/i })).toBeDefined();
  });

  // AC-005, AC-015: 401 Auth Required State
  it("renders AUTH_REQUIRED state with safe internal redirect on 401 response", async () => {
    vi.spyOn(academyApi, "getLessonFlashcards").mockRejectedValue(
      new AcademyApiError(401, "UNAUTHENTICATED", "Authentication required")
    );

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText("Authentication Required")).toBeDefined();
    });

    const signInLink = screen.getByRole("link", { name: /Sign In to Continue/i });
    expect(signInLink.getAttribute("href")).toBe(
      "/login?redirect=%2Facademy%2Fcourses%2Fcrypto-fundamentals%2Flessons%2Fproof-of-work%2Fflashcards"
    );

    // Front/back content not exposed
    expect(screen.queryByTestId("flashcard-front-content")).toBeNull();
  });

  // AC-005: 404 Not Found State
  it("renders generic NOT_FOUND state without leaking draft/archived status", async () => {
    vi.spyOn(academyApi, "getLessonFlashcards").mockRejectedValue(
      new AcademyApiError(404, "NOT_FOUND", "Flashcards not found")
    );

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText("Flashcards Unavailable")).toBeDefined();
    });

    // Zero leakage
    expect(screen.queryByText(/DRAFT/i)).toBeNull();
    expect(screen.queryByText(/ARCHIVED/i)).toBeNull();
    expect(screen.queryByText(/prisma/i)).toBeNull();
  });

  // AC-005: 500 Error State with retry
  it("renders ERROR state on 500 failure and handles retry", async () => {
    const flashcardSpy = vi
      .spyOn(academyApi, "getLessonFlashcards")
      .mockRejectedValueOnce(new AcademyApiError(500, "INTERNAL_ERROR", "Server failure"))
      .mockResolvedValueOnce(mockFlashcardsResponse);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeDefined();
      expect(screen.getByText(/Server failure/i)).toBeDefined();
    });

    // Retry
    const retryBtn = screen.getByRole("button", { name: /Retry/i });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByTestId("flashcard-front-content")).toBeDefined();
    });

    expect(flashcardSpy).toHaveBeenCalledTimes(2);
  });
});
