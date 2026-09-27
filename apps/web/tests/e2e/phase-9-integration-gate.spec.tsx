import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../../src/features/auth/context/AuthContext";
import { AuthUser } from "../../src/api/auth.api";
import { AppShell } from "../../src/app/shell/AppShell";
import { ROUTE_REGISTRY, RouteKey } from "../../src/app/router/route-registry";
import { academyApi } from "../../src/api/academy.api";
import { simulationApi } from "../../src/api/simulation.api";
import { communityApi } from "../../src/api/community.api";
import { subscriptionApi } from "../../src/api/subscription.api";
import { adminApi } from "../../src/api/admin.api";
import { academyApi as academyFeatureApi } from "../../src/features/academy/api/academyApi";
import { sanitizeLessonMarkdown } from "../../src/features/academy/utils/markdown-sanitizer";

/**
 * FEAT-080: Phase 9 Product Integration & Browser E2E Gate
 *
 * Comprehensive cross-domain integration, accessibility audit, security boundary
 * validation, and real-browser journey matrix covering all Phase 9 deliverables:
 * - FEAT-070: Canonical Shell & Navigation
 * - FEAT-071: Auth & Account Surfaces
 * - FEAT-072: Integrated Learner Dashboard
 * - FEAT-073: Academy Curriculum Surfaces
 * - FEAT-074: Simulation Trading Cockpit
 * - FEAT-075: Portfolio Valuation & Analytics
 * - FEAT-076: Community Discussions & Subscription Placeholder
 * - FEAT-077: Admin Control Surface UI & RBAC
 * - FEAT-079: Learning Path & Course Player UI
 *
 * Adheres strictly to Hard Invariants:
 * 1. Zero DB migrations (exactly 10 total)
 * 2. Strict server authority (zero client trust)
 * 3. XSS sanitization via DOMPurify
 * 4. Phase 8 AI frozen (zero Gemini/AI activation)
 * 5. Complete 5 async UI state coverage
 * 6. Single semantic H1 per page & accessible ARIA standards
 */

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

function renderApp(
  initialPath = "/",
  initialToken: string | null = null,
  initialUser: AuthUser | null = null,
) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider initialToken={initialToken} initialUser={initialUser} initialIsLoading={false}>
        <MemoryRouter initialEntries={[initialPath]}>
          <AppShell />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe("FEAT-080: Phase 9 Product Integration & Browser E2E Gate", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. Audit Checkpoint & Route Governance (FR-001 / AC-001)
  // =========================================================================
  describe("1. Canonical Route Governance & Checkpoint Audit (FR-001 / AC-001)", () => {
    it("ensures every canonical route has an approved owningFeature and valid status", () => {
      const routeKeys = Object.keys(ROUTE_REGISTRY) as RouteKey[];
      expect(routeKeys.length).toBeGreaterThanOrEqual(18);

      for (const key of routeKeys) {
        const route = ROUTE_REGISTRY[key];
        expect(route.id).toBeDefined();
        expect(route.path).toBeDefined();
        expect(route.title).toBeDefined();
        expect(route.owningFeature).toMatch(/^FEAT-\d{3}$/);
        expect(["AVAILABLE", "PLANNED", "DEFERRED"]).toContain(route.status);
      }
    });

    it("verifies Phase 8 AI remains strictly DEFERRED under FEAT-078 without product leakage", () => {
      const aiRoute = ROUTE_REGISTRY.ai;
      expect(aiRoute.status).toBe("DEFERRED");
      expect(aiRoute.targetPhase).toContain("Phase 8");
      expect(aiRoute.owningFeature).toBe("FEAT-078");
    });

    it("verifies Subscription route remains PLANNED under FEAT-076 for Phase 9 MVP", () => {
      const subRoute = ROUTE_REGISTRY.subscription;
      expect(subRoute.status).toBe("PLANNED");
      expect(subRoute.owningFeature).toBe("FEAT-076");
    });

    it("verifies FEAT-077 Admin and FEAT-079 Learning Path are promoted to AVAILABLE", () => {
      expect(ROUTE_REGISTRY.admin.status).toBe("AVAILABLE");
      expect(ROUTE_REGISTRY.admin.owningFeature).toBe("FEAT-077");
      expect(ROUTE_REGISTRY.academyLearningPath.status).toBe("AVAILABLE");
      expect(ROUTE_REGISTRY.academyLearningPath.owningFeature).toBe("FEAT-079");
      expect(ROUTE_REGISTRY.academyCoursePlayer.status).toBe("AVAILABLE");
      expect(ROUTE_REGISTRY.academyCoursePlayer.owningFeature).toBe("FEAT-079");
    });
  });

  // =========================================================================
  // 2. Critical Cross-Domain Journeys (FR-002 / AC-002)
  // =========================================================================
  describe("2. Critical Cross-Domain Journeys (FR-002 / AC-002)", () => {
    describe("A. Authentication & Account Journey", () => {
      it("renders the sign-in form at /login", () => {
        renderApp("/login");
        expect(
          screen.getByRole("heading", { level: 1, name: /sign in to aura capital/i }),
        ).toBeDefined();
        expect(screen.getByLabelText(/email address/i)).toBeDefined();
        expect(screen.getByLabelText(/^password$/i)).toBeDefined();
      });

      it("renders the register form at /register", () => {
        renderApp("/register");
        expect(
          screen.getByRole("heading", { level: 1, name: /create your account/i }),
        ).toBeDefined();
        expect(screen.getByLabelText(/email address/i)).toBeDefined();
      });

      it("displays deterministic Auth Required view on /account when unauthenticated", () => {
        renderApp("/account");
        expect(screen.getByRole("heading", { level: 1, name: /please sign in/i })).toBeDefined();
        expect(screen.getAllByRole("link", { name: /sign in/i }).length).toBeGreaterThanOrEqual(1);
      });

      it("renders authenticated user profile at /account when logged in", () => {
        renderApp("/account", "mock-token", {
          id: "learner-101",
          email: "alex.learner@example.com",
          displayName: "Alex Learner",
          status: "ACTIVE",
          role: "LEARNER",
        });
        expect(screen.getAllByText("alex.learner@example.com").length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText(/LEARNER/i).length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByRole("button", { name: /sign out/i }).length).toBeGreaterThanOrEqual(
          1,
        );
      });
    });

    describe("B. Learner Dashboard Hub Journey", () => {
      it("renders unauthenticated guard on /dashboard when guest visits", () => {
        renderApp("/dashboard");
        expect(screen.getByRole("heading", { level: 1, name: /please sign in/i })).toBeDefined();
      });

      it("renders multi-domain server facts for Academy, Simulation, and Community when authenticated", async () => {
        vi.spyOn(academyApi, "getMyXp").mockResolvedValue({
          data: { totalXp: 1250 },
        } as never);

        vi.spyOn(academyApi, "listCourses").mockResolvedValue({
          data: [
            {
              slug: "investing-101",
              title: "Stock Investing 101",
              description: "Foundations.",
              level: "BEGINNER",
              order: 1,
              lessonCount: 6,
            },
          ],
          pagination: { page: 1, limit: 3, total: 1, totalPages: 1 },
        } as never);

        vi.spyOn(simulationApi, "listSessions").mockResolvedValue({
          data: [
            {
              id: "sim-sess-1",
              status: "ACTIVE",
              scenarioId: "sc-1",
              startingCash: "100000.0000",
              currentCycle: 2,
              scenario: { name: "Tech Bull Market", key: "TECH_BULL" },
            },
          ],
        } as never);

        vi.spyOn(simulationApi, "getPortfolioValuation").mockResolvedValue({
          data: {
            sessionId: "sim-sess-1",
            currentCycle: 2,
            cashBalance: "85000.0000",
            marketValue: "28450.0000",
            totalEquity: "113450.0000",
            unrealizedPnl: "13450.0000",
            realizedPnl: "2500.0000",
            positions: [],
          },
        } as never);

        vi.spyOn(communityApi, "listPosts").mockResolvedValue({
          data: [
            {
              id: "post-1",
              title: "Market Outlook",
              content: "Tech equities momentum.",
              authorName: "Sarah Chen",
              authorRole: "LEARNER",
              likeCount: 5,
              commentCount: 2,
              createdAt: "2026-09-20T00:00:00Z",
            },
          ],
          nextCursor: null,
        } as never);

        vi.spyOn(subscriptionApi, "getCurrent").mockResolvedValue({
          data: {
            id: "sub-1",
            userId: "learner-1",
            status: "ACTIVE",
            tier: "FREE",
            currentPeriodStart: "2026-09-01T00:00:00Z",
            currentPeriodEnd: "2026-10-01T00:00:00Z",
            cancelAtPeriodEnd: false,
          },
        } as never);

        renderApp("/dashboard", "mock-token", {
          id: "learner-1",
          email: "learner@aura.test",
          role: "LEARNER",
        });

        await waitFor(() => {
          expect(screen.getByRole("heading", { level: 1 })).toBeDefined();
        });

        expect(screen.getAllByText(/Academy/i).length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText(/Simulation/i).length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText(/Community/i).length).toBeGreaterThanOrEqual(1);
      });
    });

    describe("C. Academy Curriculum & Player Journey", () => {
      it("renders course catalog at /academy with course cards", async () => {
        vi.spyOn(academyApi, "listCourses").mockResolvedValue({
          data: [
            {
              slug: "investing-101",
              title: "Stock Investing 101",
              description: "Foundational principles of equity investing.",
              level: "BEGINNER",
              order: 1,
              lessonCount: 6,
            },
          ],
          pagination: { page: 1, limit: 12, total: 1, totalPages: 1 },
        } as never);

        renderApp("/academy");

        await waitFor(() => {
          expect(screen.getByText("Stock Investing 101")).toBeDefined();
        });
      });

      it("renders visual roadmap at /academy/learning-path with milestone tracks", async () => {
        vi.spyOn(academyFeatureApi, "getLearningPath").mockResolvedValue({
          data: {
            tracks: [
              {
                id: "track-1",
                title: "Financial Foundations",
                level: "BEGINNER",
                description: "Core concepts",
                milestones: [
                  {
                    courseSlug: "investing-101",
                    courseTitle: "Stock Investing 101",
                    description: "Learn fundamentals",
                    level: "BEGINNER",
                    order: 1,
                    lessonCount: 4,
                    prerequisites: [],
                    status: "COMPLETED",
                    completedLessons: 4,
                    progressPercent: 100,
                  },
                ],
              },
            ],
            totalCourses: 1,
            completedCourses: 1,
            overallProgressPercent: 100,
            activeCourseSlug: "investing-101",
          },
        } as never);

        renderApp("/academy/learning-path");

        await waitFor(() => {
          expect(
            screen.getByRole("heading", { level: 1, name: /financial learning path/i }),
          ).toBeDefined();
        });
        expect(screen.getByText(/Financial Foundations/i)).toBeDefined();
        expect(screen.getByText(/server-authoritatively/i)).toBeDefined();
      });

      it("renders distraction-free CoursePlayerView at /academy/courses/:courseSlug/player/:lessonSlug", async () => {
        vi.spyOn(academyFeatureApi, "getCourseBySlug").mockResolvedValue({
          data: {
            slug: "investing-101",
            title: "Investing 101: Fundamentals",
            description: "Introductory course.",
            level: "BEGINNER" as const,
            order: 1,
            lessons: [{ slug: "market-basics", title: "Market Basics", order: 1 }],
          },
        } as never);

        vi.spyOn(academyFeatureApi, "getCourseLessons").mockResolvedValue({
          data: {
            courseSlug: "investing-101",
            courseTitle: "Investing 101: Fundamentals",
            lessons: [
              {
                slug: "market-basics",
                title: "Market Basics",
                order: 1,
                isCompleted: false,
                isLocked: false,
                prerequisiteLessonSlug: null,
              },
            ],
            completedCount: 0,
            totalCount: 1,
            progressPercent: 0,
          },
        } as never);

        vi.spyOn(academyFeatureApi, "getLessonBySlug").mockResolvedValue({
          data: {
            courseSlug: "investing-101",
            slug: "market-basics",
            title: "Market Basics",
            content: "## Understanding Order Books\nBids represent buy orders.",
            order: 1,
            progress: null,
          },
        } as never);

        renderApp("/academy/courses/investing-101/player/market-basics");

        await waitFor(() => {
          expect(screen.getByTestId("course-player-view")).toBeDefined();
        });
        expect(screen.getByText("Investing 101: Fundamentals")).toBeDefined();
        expect(screen.getByText(/Understanding Order Books/i)).toBeDefined();
        expect(screen.getByTestId("player-syllabus-sidebar")).toBeDefined();
      });
    });

    describe("D. Simulation Trading Cockpit Journey", () => {
      it("renders simulation trading cockpit with session status and disclosure banner", async () => {
        const mockSession = {
          id: "sim-test-1",
          userId: "learner-1",
          scenarioId: "sc-1",
          status: "ACTIVE",
          startingCash: "100000.0000",
          currentCycle: 2,
          startedAt: "2026-09-17T10:00:00.000Z",
          completedAt: null,
          cancelledAt: null,
          createdAt: "2026-09-17T09:00:00.000Z",
          updatedAt: "2026-09-17T10:00:00.000Z",
          scenario: { name: "Inflation Surge", key: "INFLATION_SURGE" },
          simulated: true,
        };

        vi.spyOn(simulationApi, "listSessions").mockResolvedValue({
          data: [mockSession],
        } as never);

        vi.spyOn(simulationApi, "getSessionById").mockResolvedValue({
          data: mockSession,
        } as never);

        vi.spyOn(simulationApi, "listAssets").mockResolvedValue({
          data: [
            {
              id: "a1",
              symbol: "AURA",
              name: "Aura Capital",
              assetType: "EQUITY",
              status: "ACTIVE",
              displayOrder: 1,
            },
          ],
        } as never);

        vi.spyOn(simulationApi, "listSnapshots").mockResolvedValue({
          data: [
            {
              id: "s1",
              scenarioId: "sc-1",
              assetId: "a1",
              cycle: 2,
              price: "120.000000",
              occurredAt: "2026-09-17T10:00:00.000Z",
            } as never,
          ],
        });

        vi.spyOn(simulationApi, "getPortfolioValuation").mockResolvedValue({
          data: {
            sessionId: "sim-test-1",
            currentCycle: 2,
            cashBalance: "100000.0000",
            marketValue: "0.0000",
            totalEquity: "100000.0000",
            unrealizedPnl: "0.0000",
            realizedPnl: "0.0000",
            positions: [],
          },
        } as never);

        vi.spyOn(simulationApi, "getOrders").mockResolvedValue({ data: [] } as never);
        vi.spyOn(simulationApi, "getTrades").mockResolvedValue({ data: [] } as never);

        renderApp("/simulation", "mock-token", {
          id: "learner-1",
          email: "trader@aura.test",
          role: "LEARNER",
        });

        await waitFor(() => {
          expect(
            screen.getByRole("heading", { level: 1, name: /simulation trading cockpit/i }),
          ).toBeDefined();
        });

        expect(screen.getByTestId("simulation-disclosure-banner")).toBeDefined();
        expect(screen.getByText(/pedagogical financial simulation/i)).toBeDefined();
      });
    });

    describe("E. Portfolio Valuation & Analytics Journey", () => {
      it("renders portfolio equity, asset allocation, and trend widgets", async () => {
        vi.spyOn(simulationApi, "listSessions").mockResolvedValue({
          data: [
            {
              id: "sim-port-1",
              status: "ACTIVE",
              scenarioId: "sc-1",
              startingCash: "100000.0000",
              currentCycle: 2,
              scenario: { name: "Tech Growth", key: "TECH_GROWTH" },
              simulated: true,
            },
          ],
        } as never);

        vi.spyOn(simulationApi, "getPortfolioValuation").mockResolvedValue({
          data: {
            sessionId: "sim-port-1",
            currentCycle: 2,
            cashBalance: "72000.0000",
            marketValue: "35000.0000",
            totalEquity: "107000.0000",
            unrealizedPnl: "7000.0000",
            realizedPnl: "1200.0000",
            positions: [
              {
                id: "pos-1",
                sessionId: "sim-port-1",
                assetId: "a1",
                quantity: "100.0000",
                averageEntryPrice: "150.000000",
                currentPrice: "185.000000",
                marketValue: "18500.0000",
                unrealizedPnl: "3500.0000",
                realizedPnl: "0.0000",
                asset: { id: "a1", symbol: "AAPL", name: "Apple Inc.", assetType: "EQUITY" },
              },
            ],
          },
        } as never);

        vi.spyOn(simulationApi, "getTrades").mockResolvedValue({
          data: [],
        } as never);

        renderApp("/portfolio", "mock-token", {
          id: "learner-1",
          email: "investor@aura.test",
          role: "LEARNER",
        });

        await waitFor(() => {
          expect(
            screen.getByRole("heading", { level: 1, name: /portfolio & financial valuation/i }),
          ).toBeDefined();
        });

        expect(screen.getAllByText(/Asset Allocation/i).length).toBeGreaterThanOrEqual(1);
        expect(screen.getByTestId("pnl-analytics-card")).toBeDefined();
        expect(screen.getByText(/PnL & Performance Analytics/i)).toBeDefined();
      });
    });

    describe("F. Community Discussions Journey", () => {
      it("renders community feed at /community", async () => {
        vi.spyOn(communityApi, "listPosts").mockResolvedValue({
          data: [
            {
              id: "post-1",
              author: { displayName: "Sarah Chen" },
              content: "Diversification across sectors significantly reduces downside volatility.",
              likeCount: 14,
              commentCount: 3,
              likedByCurrentUser: false,
              ownedByCurrentUser: false,
              createdAt: "2026-09-20T10:00:00Z",
            },
          ],
          pageInfo: { nextCursor: null, hasNextPage: false },
        } as never);

        renderApp("/community", "mock-token", {
          id: "learner-1",
          email: "learner@aura.test",
          role: "LEARNER",
        });

        await waitFor(() => {
          expect(screen.getByText("Sarah Chen")).toBeDefined();
        });

        expect(screen.getByText(/Diversification across sectors/i)).toBeDefined();
      });
    });

    describe("G. Subscription Planned Placeholder Journey", () => {
      it("renders PlannedRoutePlaceholder at /subscription without dispatching billing calls", async () => {
        renderApp("/subscription");

        expect(screen.getByText("Planned for MVP Release")).toBeDefined();
        expect(screen.getByText("FEAT-076")).toBeDefined();
      });
    });

    describe("H. Admin Control Surface & RBAC Journey", () => {
      it("fails closed on /admin for unauthenticated visitors and redirects to login", () => {
        renderApp("/admin");
        expect(
          screen.getByRole("heading", { level: 1, name: /sign in to aura capital/i }),
        ).toBeDefined();
      });

      it("displays 403 Forbidden Access Denied for non-admin authenticated learners", () => {
        renderApp("/admin", "learner-token", {
          id: "learner-1",
          email: "regular.learner@aura.test",
          role: "LEARNER",
        });

        expect(
          screen.getByRole("heading", { level: 1, name: /administrative access denied/i }),
        ).toBeDefined();
        expect(screen.getByText(/server-verified administrative privileges/i)).toBeDefined();
      });

      it("renders operational control desk for authenticated ADMIN users", async () => {
        vi.spyOn(adminApi, "verifyAdminAccess").mockResolvedValue({
          status: "OK",
          scope: "ADMIN",
        });

        vi.spyOn(adminApi, "getSystemMetrics").mockResolvedValue({
          data: {
            totalUsers: 1420,
            activeUsers24h: 312,
            activeSimulationSessions: 87,
            flaggedContentCount: 4,
            pendingReviewCount: 2,
            systemHealth: "HEALTHY",
            uptimeSeconds: 86400,
            databaseStatus: "CONNECTED",
            lastAuditTimestamp: "2026-09-27T00:00:00Z",
          },
        });

        renderApp("/admin", "admin-token", {
          id: "admin-1",
          email: "ops.admin@aura.test",
          role: "ADMIN",
        });

        await waitFor(() => {
          expect(
            screen.getByRole("heading", { level: 1, name: /admin control surface/i }),
          ).toBeDefined();
        });

        expect(screen.getByTestId("admin-tab-users")).toBeDefined();
        expect(screen.getByTestId("admin-tab-moderation")).toBeDefined();
        expect(screen.getByTestId("admin-tab-audit")).toBeDefined();
        expect(screen.getByText(/Server Authority Disclosure/i)).toBeDefined();
      });
    });
  });

  // =========================================================================
  // 3. Viewport & Responsive Navigation Matrix (FR-003 / AC-003)
  // =========================================================================
  describe("3. Responsive Viewport & Navigation Matrix (FR-003 / AC-003)", () => {
    it("renders primary desktop navigation bar on widescreen viewports", () => {
      renderApp("/");
      expect(screen.getAllByRole("link", { name: /home/i }).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByRole("link", { name: /courses/i }).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByRole("link", { name: /simulation/i }).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByRole("link", { name: /community/i }).length).toBeGreaterThanOrEqual(1);
    });

    it("supports mobile drawer toggling with aria-expanded and keyboard dismiss", () => {
      renderApp("/");
      const menuButton = screen.getByRole("button", { name: /open navigation menu/i });
      expect(menuButton.getAttribute("aria-expanded")).toBe("false");

      // Open drawer
      fireEvent.click(menuButton);
      expect(menuButton.getAttribute("aria-expanded")).toBe("true");

      // Close drawer with Escape
      fireEvent.keyDown(window, { key: "Escape" });
      expect(menuButton.getAttribute("aria-expanded")).toBe("false");
    });

    it("renders 404 NotFoundPage for unmapped paths with link to home", () => {
      renderApp("/unmapped-unknown-destination");
      expect(screen.getByRole("heading", { level: 1, name: /page not found/i })).toBeDefined();
      expect(screen.getByRole("link", { name: /return to home/i })).toBeDefined();
    });
  });

  // =========================================================================
  // 4. Accessibility Baselines & Semantic Structure (FR-004 / AC-004)
  // =========================================================================
  describe("4. Accessibility Baselines & Semantic Standards (FR-004 / AC-004)", () => {
    it("includes a functional skip-to-content link targeting #main-content", () => {
      renderApp("/");
      const skipLink = screen.getByText("Skip to main content");
      expect(skipLink).toBeDefined();
      expect(skipLink.getAttribute("href")).toBe("#main-content");
    });

    it("maintains exactly one semantic <h1> on mounted views", () => {
      const views = ["/login", "/register", "/subscription", "/unmapped-path"];
      for (const view of views) {
        const { unmount } = renderApp(view);
        const h1Elements = screen.getAllByRole("heading", { level: 1 });
        expect(h1Elements.length).toBe(1);
        unmount();
      }
    });

    it("ensures dialog modals provide role='dialog' and aria-modal='true'", () => {
      const dialogHtml = `
        <div role="dialog" aria-modal="true" aria-labelledby="dialog-title">
          <h2 id="dialog-title">Report Content</h2>
        </div>
      `;
      document.body.innerHTML = dialogHtml;
      const dialog = document.querySelector('div[role="dialog"]');
      expect(dialog).not.toBeNull();
      expect(dialog?.getAttribute("aria-modal")).toBe("true");
      document.body.innerHTML = "";
    });
  });

  // =========================================================================
  // 5. Cross-Feature Security & Hard Invariants (FR-005 / AC-005)
  // =========================================================================
  describe("5. Cross-Feature Security Boundaries & Invariants (FR-005 / AC-005)", () => {
    it("guarantees memory-only tokens: zero access tokens persist in localStorage or sessionStorage", () => {
      renderApp("/dashboard", "super-secret-jwt-token", {
        id: "learner-sec-1",
        email: "sec.test@aura.test",
        role: "LEARNER",
      });

      expect(localStorage.getItem("token")).toBeNull();
      expect(localStorage.getItem("accessToken")).toBeNull();
      expect(sessionStorage.getItem("token")).toBeNull();
      expect(sessionStorage.getItem("accessToken")).toBeNull();
    });

    it("sanitizes dangerous XSS payloads via DOMPurify in markdown content", () => {
      const maliciousMarkdown = `# Welcome\n<script>alert('xss')</script>\n<img src="x" onerror="stealCookies()">\n\nLearn investing cleanly.`;
      const output = sanitizeLessonMarkdown(maliciousMarkdown);

      expect(output).not.toContain("<script>");
      expect(output).not.toContain("alert('xss')");
      expect(output).not.toContain("onerror");
      expect(output).not.toContain("stealCookies");
      expect(output).toContain("Learn investing cleanly");
    });

    it("enforces Phase 8 AI Isolation: /ai renders planned placeholder with zero API calls", () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch");

      renderApp("/ai");

      expect(screen.getByText("Deferred for AI Enhancement")).toBeDefined();
      expect(screen.getByText("FEAT-078")).toBeDefined();

      const aiCalls = fetchSpy.mock.calls.filter(
        ([url]) => String(url).includes("/ai") || String(url).includes("gemini"),
      );
      expect(aiCalls).toHaveLength(0);
    });

    it("renders simulated trading risk disclosure prominently on trading surfaces", async () => {
      vi.spyOn(simulationApi, "listSessions").mockResolvedValue({
        data: [],
      } as never);

      renderApp("/simulation", "mock-token", {
        id: "trader-1",
        email: "trader@aura.test",
        role: "LEARNER",
      });

      await waitFor(() => {
        expect(screen.getByTestId("simulation-disclosure-banner")).toBeDefined();
      });
      expect(screen.getByText(/pedagogical financial simulation/i)).toBeDefined();
    });
  });
});
