import { describe, it, expect } from "vitest";
import {
  ROUTES,
  getPrimaryNavRoutes,
  findRouteByPath,
  isRouteActive,
} from "./route-registry";

describe("Route Registry (FEAT-070 / AC-001)", () => {
  it("defines canonical routes with unique paths", () => {
    const paths = ROUTES.map((r) => r.path);
    const uniquePaths = new Set(paths);
    expect(paths.length).toBe(uniquePaths.size);
    expect(paths).toContain("/");
    expect(paths).toContain("/dashboard");
    expect(paths).toContain("/academy");
    expect(paths).toContain("/simulation");
    expect(paths).toContain("/portfolio");
    expect(paths).toContain("/community");
    expect(paths).toContain("/subscription");
    expect(paths).toContain("/account");
    expect(paths).toContain("/login");
    expect(paths).toContain("/register");
    expect(paths).toContain("/admin");
    expect(paths).toContain("/admin/users");
    expect(paths).toContain("/admin/moderation");
    expect(paths).toContain("/admin/audit");
    expect(paths).toContain("/ai");
  });

  it("identifies primary navigation routes accurately", () => {
    const primary = getPrimaryNavRoutes();
    const primaryPaths = primary.map((r) => r.path);
    expect(primaryPaths).toEqual([
      "/",
      "/dashboard",
      "/academy",
      "/simulation",
      "/portfolio",
      "/community",
      "/subscription",
    ]);
  });

  it("correctly finds route by exact path", () => {
    const home = findRouteByPath("/");
    expect(home?.id).toBe("home");
    expect(home?.status).toBe("AVAILABLE");

    const ai = findRouteByPath("/ai");
    expect(ai?.id).toBe("ai");
    expect(ai?.status).toBe("DEFERRED");
    expect(ai?.targetPhase).toBe("Phase 8 (Frozen / Post-MVP)");

    const simulation = findRouteByPath("/simulation");
    expect(simulation?.id).toBe("simulation");
    expect(simulation?.owningFeature).toBe("FEAT-074");
    expect(simulation?.status).toBe("AVAILABLE");
    expect(simulation?.requiresAuth).toBe(true);

    const portfolio = findRouteByPath("/portfolio");
    expect(portfolio?.id).toBe("portfolio");
    expect(portfolio?.owningFeature).toBe("FEAT-075");
    expect(portfolio?.status).toBe("AVAILABLE");
    expect(portfolio?.requiresAuth).toBe(true);

    const community = findRouteByPath("/community");
    expect(community?.id).toBe("community");
    expect(community?.owningFeature).toBe("FEAT-076");
    expect(community?.status).toBe("AVAILABLE");
    expect(community?.requiresAuth).toBe(false);

    const communityPost = findRouteByPath("/community/posts/p-123");
    expect(communityPost?.id).toBe("communityPost");
    expect(communityPost?.owningFeature).toBe("FEAT-076");
    expect(communityPost?.status).toBe("AVAILABLE");
    expect(communityPost?.requiresAuth).toBe(false);

    const admin = findRouteByPath("/admin");
    expect(admin?.id).toBe("admin");
    expect(admin?.owningFeature).toBe("FEAT-077");
    expect(admin?.status).toBe("AVAILABLE");
    expect(admin?.requiresAuth).toBe(true);
    expect(admin?.requiredRole).toBe("ADMIN");

    const adminUsers = findRouteByPath("/admin/users");
    expect(adminUsers?.id).toBe("adminUsers");
    expect(adminUsers?.owningFeature).toBe("FEAT-077");
    expect(adminUsers?.status).toBe("AVAILABLE");
    expect(adminUsers?.requiresAuth).toBe(true);
    expect(adminUsers?.requiredRole).toBe("ADMIN");

    const adminMod = findRouteByPath("/admin/moderation");
    expect(adminMod?.id).toBe("adminModeration");
    expect(adminMod?.requiredRole).toBe("ADMIN");

    const adminAudit = findRouteByPath("/admin/audit");
    expect(adminAudit?.id).toBe("adminAudit");
    expect(adminAudit?.requiredRole).toBe("ADMIN");

    const unknown = findRouteByPath("/unknown-route");
    expect(unknown).toBeUndefined();
  });

  it("handles trailing slashes in route lookup", () => {
    const academy = findRouteByPath("/academy/");
    expect(academy?.id).toBe("academy");
  });

  it("evaluates active route correctly", () => {
    expect(isRouteActive("/", "/")).toBe(true);
    expect(isRouteActive("/academy", "/")).toBe(false);
    expect(isRouteActive("/academy", "/academy")).toBe(true);
    expect(isRouteActive("/academy/lesson-1", "/academy")).toBe(true);
    expect(isRouteActive("/simulation/trades", "/simulation")).toBe(true);
    expect(isRouteActive("/community", "/simulation")).toBe(false);
    expect(isRouteActive("/admin/users", "/admin")).toBe(true);
  });
});
