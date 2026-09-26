import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../../src/features/auth/context/AuthContext";
import { AppShell } from "../../src/app/shell/AppShell";

/**
 * Phase 9 Canonical Shell Smoke Test
 *
 * Validates the Phase 9 application shell renders correctly with
 * product-oriented presentation. The old "Foundation: Healthy" pill
 * was part of the Phase 1 foundation UI; Phase 9 replaced this with
 * a full product shell (FEAT-070).
 */
describe("Web Application Shell (Smoke Test)", () => {
  it("renders the root application shell without throwing runtime errors", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider initialToken={null} initialUser={null} initialIsLoading={false}>
          <MemoryRouter initialEntries={["/"]}>
            <AppShell />
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>,
    );

    // Phase 9 shell renders the brand heading
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.textContent).toContain("Aura Capital");

    // Product-oriented navigation links exist (desktop + mobile may both render)
    expect(screen.getAllByRole("link", { name: /home/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole("link", { name: /courses/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole("link", { name: /simulation/i }).length).toBeGreaterThanOrEqual(1);

    // Verify no stale foundation-era copy leaks
    expect(screen.queryByText(/Foundation: Healthy/i)).toBeNull();
    expect(screen.queryByText(/Phase 1: Engineering Foundation/i)).toBeNull();
  });
});
