import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PostComposer } from "./PostComposer";
import { communityApi } from "../../../api/community.api";
import { CommunityApiError } from "../types/community-ui.types";

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>,
  );
};

describe("PostComposer Component (AC-004)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders title input, textarea, character counter, and disables submit when empty", () => {
    renderWithProviders(<PostComposer accessToken="token" />);

    expect(screen.getByTestId("post-composer-title-input")).toBeDefined();
    const textarea = screen.getByTestId("post-composer-textarea");
    expect(textarea).toBeDefined();

    const counter = screen.getByTestId("post-composer-counter");
    expect(counter.textContent).toContain("0 / 5000");

    const submitBtn = screen.getByTestId("post-composer-submit-btn") as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);
  });

  it("updates character counter and submits with optional title and content", async () => {
    const createSpy = vi.spyOn(communityApi, "createPost").mockResolvedValue({
      data: {
        id: "p-test",
        author: { displayName: "Author" },
        content: "# Hedging\n\nDelta neutral portfolio",
        createdAt: new Date().toISOString(),
        likeCount: 0,
        commentCount: 0,
        likedByCurrentUser: false,
        ownedByCurrentUser: true,
      },
    });
    const onCreated = vi.fn();

    renderWithProviders(<PostComposer accessToken="token" onPostCreated={onCreated} />);

    const titleInput = screen.getByTestId("post-composer-title-input");
    const textarea = screen.getByTestId("post-composer-textarea");
    const submitBtn = screen.getByTestId("post-composer-submit-btn") as HTMLButtonElement;

    fireEvent.change(titleInput, { target: { value: "Hedging" } });
    fireEvent.change(textarea, { target: { value: "Delta neutral portfolio" } });

    expect(screen.getByTestId("post-composer-counter").textContent).toContain("23 / 5000");
    expect(submitBtn.disabled).toBe(false);

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        { title: "Hedging", content: "Delta neutral portfolio" },
        "token",
      );
      expect(onCreated).toHaveBeenCalled();
    });

    expect((textarea as HTMLTextAreaElement).value).toBe("");
    expect((titleInput as HTMLInputElement).value).toBe("");
  });

  it("displays rate-limit banner on 429 TOO_MANY_REQUESTS", async () => {
    vi.spyOn(communityApi, "createPost").mockRejectedValue(
      new CommunityApiError(429, "RATE_LIMITED", "Too many requests", 90),
    );

    renderWithProviders(<PostComposer accessToken="token" />);

    const textarea = screen.getByTestId("post-composer-textarea");
    fireEvent.change(textarea, { target: { value: "Rapid posting test" } });
    fireEvent.click(screen.getByTestId("post-composer-submit-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("community-rate-limited-banner")).toBeDefined();
      expect(screen.getByText(/Please wait 90 seconds/i)).toBeDefined();
    });
  });

  it("displays service unavailable banner on 503 outage", async () => {
    vi.spyOn(communityApi, "createPost").mockRejectedValue(
      new CommunityApiError(503, "SERVICE_UNAVAILABLE", "Service unavailable"),
    );

    renderWithProviders(<PostComposer accessToken="token" />);

    const textarea = screen.getByTestId("post-composer-textarea");
    fireEvent.change(textarea, { target: { value: "Outage posting test" } });
    fireEvent.click(screen.getByTestId("post-composer-submit-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("community-service-unavailable-banner")).toBeDefined();
    });
  });
});
