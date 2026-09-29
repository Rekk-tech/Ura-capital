import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { profileApi } from "../../../api/profile.api";

describe("ChangePasswordForm (FEAT-078)", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.restoreAllMocks();
  });

  const renderComponent = (onChanged = vi.fn()) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ChangePasswordForm accessToken="test-token" onPasswordChanged={onChanged} />
      </QueryClientProvider>
    );
  };

  it("renders all three password input fields with toggle visibility buttons", () => {
    renderComponent();

    expect(screen.getByLabelText(/^current password$/i)).toBeDefined();
    expect(screen.getByLabelText(/^new password$/i)).toBeDefined();
    expect(screen.getByLabelText(/^confirm new password$/i)).toBeDefined();

    expect(screen.getByRole("button", { name: /show current password/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /show new password/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /show confirmation password/i })).toBeDefined();
  });

  it("toggles password input visibility when clicking eye button", () => {
    renderComponent();

    const currentInput = screen.getByLabelText(/^current password$/i) as HTMLInputElement;
    expect(currentInput.type).toBe("password");

    const toggleBtn = screen.getByRole("button", { name: /show current password/i });
    fireEvent.click(toggleBtn);
    expect(currentInput.type).toBe("text");

    fireEvent.click(screen.getByRole("button", { name: /hide current password/i }));
    expect(currentInput.type).toBe("password");
  });

  it("disables submit button and shows mismatch when passwords do not match", () => {
    renderComponent();

    const currentInput = screen.getByLabelText(/^current password$/i);
    const newInput = screen.getByLabelText(/^new password$/i);
    const confirmInput = screen.getByLabelText(/^confirm new password$/i);

    fireEvent.change(currentInput, { target: { value: "OldPassword123!" } });
    fireEvent.change(newInput, { target: { value: "NewSecurePassword123!" } });
    fireEvent.change(confirmInput, { target: { value: "DifferentPassword123!" } });

    expect(screen.getByText(/passwords do not match/i)).toBeDefined();
    const submitBtn1 = screen.getByRole("button", { name: /update account password/i }) as HTMLButtonElement;
    expect(submitBtn1.disabled).toBe(true);
  });

  it("disables submit button when password length is below 12 characters", () => {
    renderComponent();

    const currentInput = screen.getByLabelText(/^current password$/i);
    const newInput = screen.getByLabelText(/^new password$/i);
    const confirmInput = screen.getByLabelText(/^confirm new password$/i);

    fireEvent.change(currentInput, { target: { value: "OldPassword123!" } });
    fireEvent.change(newInput, { target: { value: "Short1!" } });
    fireEvent.change(confirmInput, { target: { value: "Short1!" } });

    expect(screen.getByText(/too short \(min 12 chars\)/i)).toBeDefined();
    const submitBtn2 = screen.getByRole("button", { name: /update account password/i }) as HTMLButtonElement;
    expect(submitBtn2.disabled).toBe(true);
  });

  it("submits compliant password change and displays success banner", async () => {
    vi.spyOn(profileApi, "changePassword").mockResolvedValue({
      success: true,
      message: "Password updated successfully.",
    });
    const onChanged = vi.fn();

    renderComponent(onChanged);

    const currentInput = screen.getByLabelText(/^current password$/i) as HTMLInputElement;
    const newInput = screen.getByLabelText(/^new password$/i) as HTMLInputElement;
    const confirmInput = screen.getByLabelText(/^confirm new password$/i) as HTMLInputElement;

    fireEvent.change(currentInput, { target: { value: "CurrentSecret123!" } });
    fireEvent.change(newInput, { target: { value: "BrandNewSecret123!" } });
    fireEvent.change(confirmInput, { target: { value: "BrandNewSecret123!" } });

    const submitBtn = screen.getByRole("button", { name: /update account password/i }) as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(false);

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(profileApi.changePassword).toHaveBeenCalledWith(
        {
          currentPassword: "CurrentSecret123!",
          newPassword: "BrandNewSecret123!",
          confirmPassword: "BrandNewSecret123!",
        },
        "test-token"
      );
      expect(screen.getByText(/password updated successfully/i)).toBeDefined();
      expect(onChanged).toHaveBeenCalled();
      expect(currentInput.value).toBe("");
      expect(newInput.value).toBe("");
      expect(confirmInput.value).toBe("");
    });
  });

  it("handles server error rejection and displays error alert banner", async () => {
    vi.spyOn(profileApi, "changePassword").mockRejectedValue(
      new Error("Current password is incorrect")
    );

    renderComponent();

    const currentInput = screen.getByLabelText(/^current password$/i);
    const newInput = screen.getByLabelText(/^new password$/i);
    const confirmInput = screen.getByLabelText(/^confirm new password$/i);

    fireEvent.change(currentInput, { target: { value: "WrongCurrentPass123!" } });
    fireEvent.change(newInput, { target: { value: "ValidNewPassword123!" } });
    fireEvent.change(confirmInput, { target: { value: "ValidNewPassword123!" } });

    const submitBtn = screen.getByRole("button", { name: /update account password/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/current password is incorrect/i)).toBeDefined();
    });
  });
});
