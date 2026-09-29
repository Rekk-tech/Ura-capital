import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProfileDetailsForm } from "./ProfileDetailsForm";
import { profileApi, UserProfile } from "../../../api/profile.api";

describe("ProfileDetailsForm (FEAT-078)", () => {
  let queryClient: QueryClient;

  const mockProfile: UserProfile = {
    id: "usr-test-456",
    email: "trader.alex@aura.internal",
    displayName: "Alex Trader",
    status: "ACTIVE",
    roles: ["USER"],
    createdAt: "2026-02-15T10:00:00Z",
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.restoreAllMocks();
  });

  const renderComponent = (profile = mockProfile, onUpdated = vi.fn()) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ProfileDetailsForm profile={profile} accessToken="test-token" onProfileUpdated={onUpdated} />
      </QueryClientProvider>
    );
  };

  it("renders read-only account ID, email, status, and role badges", () => {
    renderComponent();

    const idInput = screen.getByLabelText(/account id/i) as HTMLInputElement;
    expect(idInput.value).toBe("usr-test-456");
    expect(idInput.readOnly).toBe(true);

    const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;
    expect(emailInput.value).toBe("trader.alex@aura.internal");
    expect(emailInput.readOnly).toBe(true);

    expect(screen.getByText("LEARNER")).toBeDefined();
    expect(screen.getByText("ACTIVE")).toBeDefined();
  });

  it("renders editable display name input with initial value", () => {
    renderComponent();

    const nameInput = screen.getByLabelText(/display name/i) as HTMLInputElement;
    expect(nameInput.value).toBe("Alex Trader");
  });

  it("validates display name and displays inline error when exceeding 100 characters", async () => {
    renderComponent();

    const nameInput = screen.getByLabelText(/display name/i);
    const longName = "A".repeat(101);

    fireEvent.change(nameInput, { target: { value: longName } });

    expect(await screen.findByText(/display name must not exceed 100 characters/i)).toBeDefined();
    const saveButton = screen.getByRole("button", { name: /save profile details/i }) as HTMLButtonElement;
    expect(saveButton.disabled).toBe(true);
  });

  it("submits updated display name and displays success alert", async () => {
    const updatedProfile: UserProfile = { ...mockProfile, displayName: "Alex Rivera Pro" };
    vi.spyOn(profileApi, "updateProfile").mockResolvedValue(updatedProfile);
    const onUpdated = vi.fn();

    renderComponent(mockProfile, onUpdated);

    const nameInput = screen.getByLabelText(/display name/i);
    fireEvent.change(nameInput, { target: { value: "Alex Rivera Pro" } });

    const saveButton = screen.getByRole("button", { name: /save profile details/i }) as HTMLButtonElement;
    expect(saveButton.disabled).toBe(false);

    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(profileApi.updateProfile).toHaveBeenCalledWith(
        { displayName: "Alex Rivera Pro" },
        "test-token"
      );
      expect(screen.getByText(/profile information updated successfully/i)).toBeDefined();
      expect(onUpdated).toHaveBeenCalledWith(updatedProfile);
    });
  });

  it("satisfies form accessibility standards (labeled inputs, accessible button)", () => {
    renderComponent();

    expect(screen.getByLabelText(/account id/i)).toBeDefined();
    expect(screen.getByLabelText(/email address/i)).toBeDefined();
    expect(screen.getByLabelText(/display name/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /save profile details/i })).toBeDefined();
  });
});
