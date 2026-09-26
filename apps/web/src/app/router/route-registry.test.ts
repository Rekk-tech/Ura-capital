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
    expect(paths).toContain("/community");
    expect(paths).toContain("/subscription");
    expect(paths).toContain("/account");
    expect(paths).toContain("/login");
    expect(paths).toContain("/register");
    expect(paths).toContain("/admin");
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
  });
});
