import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../context/AuthContext";
import { LoginPage } from "./LoginPage";
import { authApi, AuthApiError } from "../../../api/auth.api";

describe("LoginPage (FEAT-071: AC-001..AC-006)", () => {
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

  const renderLoginPage = (initialEntries = ["/login"], initialToken: string | null = null) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider initialToken={initialToken} initialUser={null} initialIsLoading={false}>
          <MemoryRouter initialEntries={initialEntries}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/account" element={<div>Account Target Page</div>} />
              <Route path="/simulation" element={<div>Simulation Target Page</div>} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    );
  };

  it("renders login form with title, subtitle, inputs, and accessible elements (AC-001)", () => {
    renderLoginPage();

    expect(screen.getByRole("heading", { name: /sign in to aura capital/i })).toBeDefined();
    expect(screen.getByText(/enter your credentials to access your courses/i)).toBeDefined();

    expect(screen.getByLabelText(/email address/i)).toBeDefined();
    expect(screen.getByLabelText(/^password$/i)).toBeDefined();

    const submitBtn = screen.getByRole("button", { name: /sign in/i });
    expect(submitBtn).toBeDefined();

    const registerLink = screen.getByRole("link", { name: /create an account/i });
    expect(registerLink.getAttribute("href")).toBe("/register");
  });

  it("normalizes email to trimmed lowercase before API submission (AC-003)", async () => {
    const loginSpy = vi.spyOn(authApi, "login").mockResolvedValue({
      accessToken: "mock-jwt-token",
      tokenType: "Bearer",
      expiresIn: 3600,
      user: {
        id: "usr-123",
        email: "test.trader@auracapital.io",
        displayName: "Test Trader",
        status: "ACTIVE",
      },
    });

    renderLoginPage();

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const submitBtn = screen.getByRole("button", { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: "   Test.Trader@AuraCapital.IO   " } });
    fireEvent.change(passwordInput, { target: { value: "ValidPassword123!" } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(loginSpy).toHaveBeenCalledWith("test.trader@auracapital.io", "ValidPassword123!");
    });
  });

  it("validates empty email or password on client before issuing network requests (AC-003)", async () => {
    const loginSpy = vi.spyOn(authApi, "login");
    renderLoginPage();

    const submitBtn = screen.getByRole("button", { name: /sign in/i });

    // Submit with both empty
    fireEvent.click(submitBtn);
    expect(screen.getByText(/please enter your email address/i)).toBeDefined();
    expect(loginSpy).not.toHaveBeenCalled();

    // Fill email only
    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: "trader@example.com" } });
    fireEvent.click(submitBtn);
    expect(screen.getByText(/please enter your password/i)).toBeDefined();
    expect(loginSpy).not.toHaveBeenCalled();
  });

  it("displays uniform failure message on 401 unauthorized to prevent enumeration (AC-004)", async () => {
    vi.spyOn(authApi, "login").mockRejectedValue(
      new AuthApiError("Unauthorized credentials", 401, "INVALID_CREDENTIALS")
    );

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "trader@auracapital.io" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "WrongPassword123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid email or password.")).toBeDefined();
    });
  });

  it("displays uniform failure message on 400 user-not-found to prevent user enumeration (AC-004)", async () => {
    vi.spyOn(authApi, "login").mockRejectedValue(
      new AuthApiError("User does not exist", 400, "USER_NOT_FOUND")
    );

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "nonexistent@auracapital.io" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "SomePassword123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid email or password.")).toBeDefined();
    });
  });

  it("displays bounded, actionable message on 429 rate limit (AC-004)", async () => {
    vi.spyOn(authApi, "login").mockRejectedValue(
      new AuthApiError("Too many requests", 429, "RATE_LIMIT_EXCEEDED")
    );

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "trader@auracapital.io" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "Password12345" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/too many login attempts\. please wait a few minutes before trying again\./i)
      ).toBeDefined();
    });
  });

  it("displays safe service unavailable message on 500 server error (AC-004)", async () => {
    vi.spyOn(authApi, "login").mockRejectedValue(
      new AuthApiError("Internal Server Error", 500, "INTERNAL_ERROR")
    );

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "trader@auracapital.io" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "Password12345" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/authentication service is temporarily unavailable\. please try again later\./i)
      ).toBeDefined();
    });
  });

  it("redirects to validated returnTo path on successful login (AC-006)", async () => {
    vi.spyOn(authApi, "login").mockResolvedValue({
      accessToken: "mock-jwt-token",
      tokenType: "Bearer",
      expiresIn: 3600,
      user: {
        id: "usr-123",
        email: "trader@auracapital.io",
        displayName: "Trader",
        status: "ACTIVE",
      },
    });

    renderLoginPage(["/login?returnTo=/simulation"]);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "trader@auracapital.io" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "ValidPassword123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText("Simulation Target Page")).toBeDefined();
    });
  });

  it("rejects malicious open redirect target and redirects to safe /account default (AC-006)", async () => {
    vi.spyOn(authApi, "login").mockResolvedValue({
      accessToken: "mock-jwt-token",
      tokenType: "Bearer",
      expiresIn: 3600,
      user: {
        id: "usr-123",
        email: "trader@auracapital.io",
        displayName: "Trader",
        status: "ACTIVE",
      },
    });

    renderLoginPage(["/login?returnTo=//malicious-site.com/steal-tokens"]);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "trader@auracapital.io" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "ValidPassword123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText("Account Target Page")).toBeDefined();
    });
  });

  it("toggles password visibility when toggle button is clicked", () => {
    renderLoginPage();

    const passwordInput = screen.getByLabelText(/^password$/i) as HTMLInputElement;
    expect(passwordInput.type).toBe("password");

    const toggleBtn = screen.getByLabelText(/show password/i);
    fireEvent.click(toggleBtn);
    expect(passwordInput.type).toBe("text");

    const hideBtn = screen.getByLabelText(/hide password/i);
    fireEvent.click(hideBtn);
    expect(passwordInput.type).toBe("password");
  });

  it("never stores tokens, passwords, or credentials in localStorage or sessionStorage (AC-005)", async () => {
    vi.spyOn(authApi, "login").mockResolvedValue({
      accessToken: "volatile-memory-token-only",
      tokenType: "Bearer",
      expiresIn: 3600,
      user: {
        id: "usr-123",
        email: "trader@auracapital.io",
        displayName: "Trader",
        status: "ACTIVE",
      },
    });

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "trader@auracapital.io" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "MySecretPassword123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText("Account Target Page")).toBeDefined();
    });

    // Invariant verification: ADR-004 zero browser storage persistence
    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("password")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
    expect(sessionStorage.getItem("accessToken")).toBeNull();
    expect(sessionStorage.getItem("token")).toBeNull();
    expect(sessionStorage.getItem("password")).toBeNull();
  });

  it("redirects immediately to returnUrl when already authenticated (AC-001)", () => {
    renderLoginPage(["/login?returnTo=/simulation"], "existing-token");
    expect(screen.getByText("Simulation Target Page")).toBeDefined();
  });
});
