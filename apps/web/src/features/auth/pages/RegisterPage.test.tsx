import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../context/AuthContext";
import { RegisterPage } from "./RegisterPage";
import { authApi, AuthApiError } from "../../../api/auth.api";

describe("RegisterPage (FEAT-071: AC-001..AC-006)", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  const renderRegisterPage = (initialEntries = ["/register"], initialToken: string | null = null) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider initialToken={initialToken} initialUser={null} initialIsLoading={false}>
          <MemoryRouter initialEntries={initialEntries}>
            <Routes>
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/account" element={<div>Account Target Page</div>} />
              <Route path="/simulation" element={<div>Simulation Target Page</div>} />
              <Route path="/login" element={<div>Login Page Target</div>} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    );
  };

  it("renders registration form with required inputs and FEAT-003 policy hints (AC-001, AC-003)", () => {
    renderRegisterPage();

    expect(screen.getByRole("heading", { name: /create your account/i })).toBeDefined();
    expect(screen.getByLabelText(/display name/i)).toBeDefined();
    expect(screen.getByLabelText(/email address/i)).toBeDefined();
    expect(screen.getByLabelText(/^password \*/i)).toBeDefined();
    expect(screen.getByLabelText(/confirm password/i)).toBeDefined();

    // Guidance hint for FEAT-003 12-char minimum rule
    expect(screen.getByText(/minimum 12 characters \(feat-003 policy\)/i)).toBeDefined();

    const submitBtn = screen.getByRole("button", { name: /create account/i });
    expect(submitBtn).toBeDefined();
    // Button is disabled when password length is below 12
    expect(submitBtn.hasAttribute("disabled")).toBe(true);

    const loginLink = screen.getByRole("link", { name: /sign in/i });
    expect(loginLink.getAttribute("href")).toBe("/login");
  });

  it("disables submit button and shows rule-unmet when password is shorter than 12 characters (AC-003)", () => {
    renderRegisterPage();

    const passwordInput = screen.getByLabelText(/^password \*/i);
    const submitBtn = screen.getByRole("button", { name: /create account/i });

    fireEvent.change(passwordInput, { target: { value: "Short123!" } });
    expect(submitBtn.hasAttribute("disabled")).toBe(true);

    fireEvent.change(passwordInput, { target: { value: "TwelveCharsMin!" } });
    expect(submitBtn.hasAttribute("disabled")).toBe(false);
  });

  it("validates password mismatch before issuing API call (AC-003)", async () => {
    const registerSpy = vi.spyOn(authApi, "register");
    renderRegisterPage();

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password \*/i);
    const confirmInput = screen.getByLabelText(/confirm password/i);
    const submitBtn = screen.getByRole("button", { name: /create account/i });

    fireEvent.change(emailInput, { target: { value: "trader@auracapital.io" } });
    fireEvent.change(passwordInput, { target: { value: "Password12345!" } });
    fireEvent.change(confirmInput, { target: { value: "PasswordDifferent!" } });

    // In-line error is displayed
    expect(screen.getByText("Passwords do not match")).toBeDefined();

    fireEvent.click(submitBtn);

    expect(screen.getByText(/passwords do not match\. please re-enter\./i)).toBeDefined();
    expect(registerSpy).not.toHaveBeenCalled();
  });

  it("normalizes email to lowercase trimmed and trims display name (AC-003)", async () => {
    const registerSpy = vi.spyOn(authApi, "register").mockResolvedValue({
      user: {
        id: "usr-999",
        email: "alex.chen@auracapital.io",
        displayName: "Alex Chen",
        status: "ACTIVE",
      },
    });

    vi.spyOn(authApi, "login").mockResolvedValue({
      accessToken: "mock-jwt-token",
      tokenType: "Bearer",
      expiresIn: 3600,
      user: {
        id: "usr-999",
        email: "alex.chen@auracapital.io",
        displayName: "Alex Chen",
        status: "ACTIVE",
      },
    });

    renderRegisterPage();

    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: "   Alex Chen   " },
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "   Alex.Chen@AuraCapital.IO   " },
    });
    fireEvent.change(screen.getByLabelText(/^password \*/i), {
      target: { value: "SecurePassword123!" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "SecurePassword123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(registerSpy).toHaveBeenCalledWith({
        email: "alex.chen@auracapital.io",
        password: "SecurePassword123!",
        displayName: "Alex Chen",
      });
    });
  });

  it("handles 409 conflict gracefully with clear actionable guidance (AC-004)", async () => {
    vi.spyOn(authApi, "register").mockRejectedValue(
      new AuthApiError("User already exists", 409, "USER_ALREADY_EXISTS")
    );

    renderRegisterPage();

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "existing@auracapital.io" },
    });
    fireEvent.change(screen.getByLabelText(/^password \*/i), {
      target: { value: "ValidPassword123!" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "ValidPassword123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/an account with this email address already exists\. please sign in instead\./i)
      ).toBeDefined();
    });
  });

  it("handles 429 rate limit during registration (AC-004)", async () => {
    vi.spyOn(authApi, "register").mockRejectedValue(
      new AuthApiError("Too many requests", 429, "RATE_LIMIT_EXCEEDED")
    );

    renderRegisterPage();

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "trader@auracapital.io" },
    });
    fireEvent.change(screen.getByLabelText(/^password \*/i), {
      target: { value: "ValidPassword123!" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "ValidPassword123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/too many registration attempts\. please wait a few minutes before trying again\./i)
      ).toBeDefined();
    });
  });

  it("handles 500 server error during registration (AC-004)", async () => {
    vi.spyOn(authApi, "register").mockRejectedValue(
      new AuthApiError("Internal Server Error", 500, "INTERNAL_ERROR")
    );

    renderRegisterPage();

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "trader@auracapital.io" },
    });
    fireEvent.change(screen.getByLabelText(/^password \*/i), {
      target: { value: "ValidPassword123!" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "ValidPassword123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/registration service is temporarily unavailable\. please try again later\./i)
      ).toBeDefined();
    });
  });

  it("preserves returnTo parameter in login link and navigates safely after registration (AC-006)", async () => {
    vi.spyOn(authApi, "register").mockResolvedValue({
      user: {
        id: "usr-123",
        email: "trader@auracapital.io",
        displayName: "Trader",
        status: "ACTIVE",
      },
    });

    vi.spyOn(authApi, "login").mockResolvedValue({
      accessToken: "mock-token",
      tokenType: "Bearer",
      expiresIn: 3600,
      user: {
        id: "usr-123",
        email: "trader@auracapital.io",
        displayName: "Trader",
        status: "ACTIVE",
      },
    });

    renderRegisterPage(["/register?returnTo=/simulation"]);

    const loginLink = screen.getByRole("link", { name: /sign in/i });
    expect(loginLink.getAttribute("href")).toBe("/login?returnTo=%2Fsimulation");

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "trader@auracapital.io" },
    });
    fireEvent.change(screen.getByLabelText(/^password \*/i), {
      target: { value: "ValidPassword123!" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "ValidPassword123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText("Simulation Target Page")).toBeDefined();
    });
  });

  it("never stores tokens, passwords, or credentials in localStorage or sessionStorage (AC-005)", async () => {
    vi.spyOn(authApi, "register").mockResolvedValue({
      user: {
        id: "usr-123",
        email: "trader@auracapital.io",
        displayName: "Trader",
        status: "ACTIVE",
      },
    });

    vi.spyOn(authApi, "login").mockResolvedValue({
      accessToken: "volatile-token-xyz",
      tokenType: "Bearer",
      expiresIn: 3600,
      user: {
        id: "usr-123",
        email: "trader@auracapital.io",
        displayName: "Trader",
        status: "ACTIVE",
      },
    });

    renderRegisterPage();

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "trader@auracapital.io" },
    });
    fireEvent.change(screen.getByLabelText(/^password \*/i), {
      target: { value: "SuperSecretPassword123!" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "SuperSecretPassword123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText("Account Target Page")).toBeDefined();
    });

    // Invariant verification: ADR-004 zero browser storage persistence
    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("password")).toBeNull();
    expect(sessionStorage.getItem("accessToken")).toBeNull();
    expect(sessionStorage.getItem("token")).toBeNull();
    expect(sessionStorage.getItem("password")).toBeNull();
  });

  it("redirects immediately to returnUrl when already authenticated (AC-001)", () => {
    renderRegisterPage(["/register?returnTo=/simulation"], "existing-token");
    expect(screen.getByText("Simulation Target Page")).toBeDefined();
  });
});
