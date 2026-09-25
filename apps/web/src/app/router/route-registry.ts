/**
 * FEAT-070: Canonical Route Registry & Metadata Contract (FR-001, AC-001)
 *
 * Single source of truth for all application routes, metadata, availability statuses,
 * and navigation properties. Prevents duplicate paths, routing ambiguity, and claims
 * of availability for unimplemented features.
 */

export type RouteStatus = "AVAILABLE" | "PLANNED" | "DEFERRED";

export type RouteSection = "core" | "learning" | "trading" | "community" | "account" | "admin" | "ai";

export interface RouteMetadata {
  /** Canonical route identifier */
  id: string;
  /** Canonical route path */
  path: string;
  /** Page title for accessibility & document.title */
  title: string;
  /** Short description of the view */
  description: string;
  /** Label for display in navigation menus */
  navLabel?: string;
  /** Implementation availability status */
  status: RouteStatus;
  /** Whether the route requires an authenticated user session */
  requiresAuth: boolean;
  /** Whether to render in the primary navigation header */
  isNavVisible: boolean;
  /** Route category/section */
  section: RouteSection;
  /** Feature that owns this route */
  owningFeature: string;
  /** Optional target delivery phase (e.g. for deferred features) */
  targetPhase?: string;
}

export const CANONICAL_ROUTES = {
  HOME: "/",
  DASHBOARD: "/dashboard",
  ACADEMY: "/academy",
  ACADEMY_COURSE: "/academy/courses/:courseSlug",
  ACADEMY_LESSON: "/academy/courses/:courseSlug/lessons/:lessonSlug",
  ACADEMY_FLASHCARDS: "/academy/courses/:courseSlug/lessons/:lessonSlug/flashcards",
  SIMULATION: "/simulation",
  SIMULATION_SESSION: "/simulation/sessions/:simulationId",
  COMMUNITY: "/community",
  COMMUNITY_POST: "/community/posts/:postId",
  SUBSCRIPTION: "/subscription",
  ACCOUNT: "/account",
  LOGIN: "/login",
  REGISTER: "/register",
  ADMIN: "/admin",
  AI_COACH: "/ai",
} as const;

export type RouteKey =
  | "home"
  | "dashboard"
  | "academy"
  | "simulation"
  | "community"
  | "subscription"
  | "account"
  | "login"
  | "register"
  | "admin"
  | "ai";

export const ROUTE_REGISTRY: Record<RouteKey, RouteMetadata> = {
  home: {
    id: "home",
    path: CANONICAL_ROUTES.HOME,
    title: "Aura Capital — Investment Learning & Simulation",
    description: "Production financial education and simulation platform.",
    navLabel: "Home",
    status: "AVAILABLE",
    requiresAuth: false,
    isNavVisible: true,
    section: "core",
    owningFeature: "FEAT-070",
  },
  dashboard: {
    id: "dashboard",
    path: CANONICAL_ROUTES.DASHBOARD,
    title: "Learner Dashboard",
    description: "Cross-domain overview of learning progress and simulation status.",
    navLabel: "Dashboard",
    status: "PLANNED",
    requiresAuth: true,
    isNavVisible: true,
    section: "core",
    owningFeature: "FEAT-072",
  },
  academy: {
    id: "academy",
    path: CANONICAL_ROUTES.ACADEMY,
    title: "Academy Course Catalog",
    description: "Interactive financial lessons, flashcards, and quizzes.",
    navLabel: "Courses",
    status: "PLANNED",
    requiresAuth: false,
    isNavVisible: true,
    section: "learning",
    owningFeature: "FEAT-073",
  },
  simulation: {
    id: "simulation",
    path: CANONICAL_ROUTES.SIMULATION,
    title: "Simulation Trading Desk",
    description: "Server-authoritative simulated market orders and portfolio valuation.",
    navLabel: "Simulation",
    status: "PLANNED",
    requiresAuth: false,
    isNavVisible: true,
    section: "trading",
    owningFeature: "FEAT-074",
  },
  community: {
    id: "community",
    path: CANONICAL_ROUTES.COMMUNITY,
    title: "Community Discussions",
    description: "Collaborative investment insights, discussions, and posts.",
    navLabel: "Community",
    status: "PLANNED",
    requiresAuth: false,
    isNavVisible: true,
    section: "community",
    owningFeature: "FEAT-075",
  },
  subscription: {
    id: "subscription",
    path: CANONICAL_ROUTES.SUBSCRIPTION,
    title: "Subscription & Tiers",
    description: "Membership tier status, limits, and mock upgrade plans.",
    navLabel: "Subscription",
    status: "PLANNED",
    requiresAuth: false,
    isNavVisible: true,
    section: "account",
    owningFeature: "FEAT-076",
  },
  account: {
    id: "account",
    path: CANONICAL_ROUTES.ACCOUNT,
    title: "Account Profile",
    description: "User profile and session identity.",
    navLabel: "Account",
    status: "AVAILABLE",
    requiresAuth: true,
    isNavVisible: false,
    section: "account",
    owningFeature: "FEAT-071",
  },
  login: {
    id: "login",
    path: CANONICAL_ROUTES.LOGIN,
    title: "Sign In",
    description: "Sign in to access personalized learning and simulation sessions.",
    navLabel: "Sign In",
    status: "AVAILABLE",
    requiresAuth: false,
    isNavVisible: false,
    section: "account",
    owningFeature: "FEAT-071",
  },
  register: {
    id: "register",
    path: CANONICAL_ROUTES.REGISTER,
    title: "Register Account",
    description: "Create a new Aura Capital account.",
    navLabel: "Register",
    status: "AVAILABLE",
    requiresAuth: false,
    isNavVisible: false,
    section: "account",
    owningFeature: "FEAT-071",
  },
  admin: {
    id: "admin",
    path: CANONICAL_ROUTES.ADMIN,
    title: "Admin Control Surface",
    description: "Administrative access verification.",
    status: "PLANNED",
    requiresAuth: true,
    isNavVisible: false,
    section: "admin",
    owningFeature: "FEAT-077",
  },
  ai: {
    id: "ai",
    path: CANONICAL_ROUTES.AI_COACH,
    title: "Aura Intelligence (AI Coach)",
    description: "Context-aware financial education assistant (Phase 8).",
    navLabel: "AI Coach",
    status: "DEFERRED",
    requiresAuth: true,
    isNavVisible: false,
    section: "ai",
    owningFeature: "FEAT-078",
    targetPhase: "Phase 8 (Frozen / Post-MVP)",
  },
};

/** Canonical list of all routes */
export const ROUTES: RouteMetadata[] = Object.values(ROUTE_REGISTRY);

/** Returns all primary navigation routes in display order */
export function getPrimaryNavRoutes(): RouteMetadata[] {
  return [
    ROUTE_REGISTRY.home,
    ROUTE_REGISTRY.dashboard,
    ROUTE_REGISTRY.academy,
    ROUTE_REGISTRY.simulation,
    ROUTE_REGISTRY.community,
    ROUTE_REGISTRY.subscription,
  ].filter((r) => r.isNavVisible);
}

/** Lookup metadata for a given pathname */
export function findRouteByPath(pathname: string): RouteMetadata | undefined {
  if (pathname === "/" || pathname === "") return ROUTE_REGISTRY.home;

  const normalized = pathname.endsWith("/") && pathname.length > 1
    ? pathname.slice(0, -1)
    : pathname;

  const entries = Object.values(ROUTE_REGISTRY);
  // Exact match first
  const exact = entries.find((r) => r.path === normalized);
  if (exact) return exact;

  // Prefix match for nested routes
  if (normalized.startsWith("/academy")) return ROUTE_REGISTRY.academy;
  if (normalized.startsWith("/simulation")) return ROUTE_REGISTRY.simulation;
  if (normalized.startsWith("/community")) return ROUTE_REGISTRY.community;
  if (normalized.startsWith("/subscription")) return ROUTE_REGISTRY.subscription;
  if (normalized.startsWith("/dashboard")) return ROUTE_REGISTRY.dashboard;
  if (normalized.startsWith("/account")) return ROUTE_REGISTRY.account;
  if (normalized.startsWith("/admin")) return ROUTE_REGISTRY.admin;
  if (normalized.startsWith("/login")) return ROUTE_REGISTRY.login;
  if (normalized.startsWith("/register")) return ROUTE_REGISTRY.register;
  if (normalized.startsWith("/ai")) return ROUTE_REGISTRY.ai;

  return undefined;
}

/** Check if route is active matching current location pathname */
export function isRouteActive(currentPath: string, routePath: string): boolean {
  if (routePath === "/") {
    return currentPath === "/";
  }
  return currentPath === routePath || currentPath.startsWith(`${routePath}/`);
}
