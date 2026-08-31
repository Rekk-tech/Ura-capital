import http from "node:http";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaRoleRepository } from "../../src/modules/auth/role.repository.js";
import { PrismaUserRepository } from "../../src/modules/users/user.repository.js";
import { seedCanonicalRoles, assignRoleToExistingUser } from "../../src/modules/auth/role.seed.js";
import { ROLES } from "../../src/modules/auth/authorization.constants.js";

dotenv.config();

const BASE_URL = process.env.API_BASE_URL || "http://127.0.0.1:4000";

interface HttpResponse<T = Record<string, unknown>> {
  status: number;
  headers: http.IncomingHttpHeaders;
  body: T;
}

async function post<T = Record<string, unknown>>(
  path: string,
  body: Record<string, unknown>,
  cookie?: string,
  extraHeaders?: Record<string, string>,
): Promise<HttpResponse<T>> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const url = new URL(path, BASE_URL);
    const req = http.request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
          ...(cookie ? { Cookie: cookie } : {}),
          ...(extraHeaders || {}),
        },
      },
      (res) => {
        let rawData = "";
        res.on("data", (chunk: Buffer | string) => {
          rawData += chunk.toString();
        });
        res.on("end", () => {
          try {
            resolve({
              status: res.statusCode ?? 0,
              headers: res.headers,
              body: rawData ? (JSON.parse(rawData) as T) : ({} as T),
            });
          } catch {
            resolve({
              status: res.statusCode ?? 0,
              headers: res.headers,
              body: {} as T,
            });
          }
        });
      },
    );
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

async function get<T = Record<string, unknown>>(
  path: string,
  token?: string,
  extraHeaders?: Record<string, string>,
): Promise<HttpResponse<T>> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const req = http.request(
      url,
      {
        method: "GET",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(extraHeaders || {}),
        },
      },
      (res) => {
        let rawData = "";
        res.on("data", (chunk: Buffer | string) => {
          rawData += chunk.toString();
        });
        res.on("end", () => {
          try {
            resolve({
              status: res.statusCode ?? 0,
              headers: res.headers,
              body: rawData ? (JSON.parse(rawData) as T) : ({} as T),
            });
          } catch {
            resolve({
              status: res.statusCode ?? 0,
              headers: res.headers,
              body: {} as T,
            });
          }
        });
      },
    );
    req.on("error", reject);
    req.end();
  });
}

function extractCookieValue(setCookieHeader: string | string[] | undefined, name: string): string | undefined {
  if (!setCookieHeader) return undefined;
  const list = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  for (const c of list) {
    const match = c.match(new RegExp(`^${name}=([^;]*)`));
    if (match) return match[1];
  }
  return undefined;
}

function getCookiePath(setCookieHeader: string | string[] | undefined, name: string): string | undefined {
  if (!setCookieHeader) return undefined;
  const list = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  for (const c of list) {
    if (c.startsWith(`${name}=`)) {
      const pathMatch = c.match(/Path=([^;]+)/i);
      if (pathMatch) return pathMatch[1].trim();
    }
  }
  return undefined;
}

function isCookieCleared(setCookieHeader: string | string[] | undefined, name: string): boolean {
  if (!setCookieHeader) return false;
  const list = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  for (const c of list) {
    if (c.startsWith(`${name}=`)) {
      const isExpired = /Expires=Thu, 01 Jan 1970|Max-Age=0/i.test(c);
      const isPathSlash = /Path=\//i.test(c);
      if (isExpired && isPathSlash) return true;
    }
  }
  return false;
}

interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    displayName: string | null;
    status: string;
    createdAt: string;
  };
}

interface HealthResponse {
  status: string;
}

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    requestId?: string;
  };
}

interface AdminPingResponse {
  status: string;
  scope: string;
}

async function run() {
  console.log("Starting FEAT-008 runtime & admin smoke test...");

  // 1. Health check
  const healthRes = await get<HealthResponse>("/health");
  console.log("1. Health status:", healthRes.status, healthRes.body.status);
  if (healthRes.status !== 200 || healthRes.body.status !== "healthy") {
    throw new Error("Health check failed");
  }

  // 2. Register a normal zero-role user
  const testEmail = `smoke.feat008.${Date.now()}@auracapital.local`;
  const password = "valid-secure-password-12345";
  const regRes = await post<AuthResponse>("/auth/register", {
    email: testEmail,
    password,
    displayName: "FEAT-008 Smoke User",
  });
  console.log("2. Register status:", regRes.status);
  if (regRes.status !== 201) throw new Error("Registration failed: " + JSON.stringify(regRes.body));
  const userId = regRes.body.user?.id;
  if (!userId) throw new Error("Registration response missing user id");

  // 3. Login to obtain access token T
  const loginRes = await post<AuthResponse>("/auth/login", {
    email: testEmail,
    password,
  });
  console.log("3. Login status:", loginRes.status);
  const initialAccessToken = loginRes.body.accessToken;
  const initialCookieVal = extractCookieValue(loginRes.headers["set-cookie"], "aura_refresh_token");
  const cookiePath = getCookiePath(loginRes.headers["set-cookie"], "aura_refresh_token");
  console.log("3. Login Set-Cookie present:", Boolean(initialCookieVal), "Cookie Path:", cookiePath);
  if (loginRes.status !== 200 || !initialCookieVal || !initialAccessToken) {
    throw new Error("Login failed to return access token or refresh cookie");
  }

  // 4. Access protected endpoint /auth/me with initial access token
  const meRes1 = await get<{ user: { email: string } }>("/auth/me", initialAccessToken);
  console.log("4. GET /auth/me status (initial):", meRes1.status, meRes1.body.user?.email);
  if (meRes1.status !== 200 || meRes1.body.user?.email !== testEmail) {
    throw new Error("Initial access token failed on /auth/me");
  }

  // 5. FEAT-008: Verify GET /admin/ping returns 403 FORBIDDEN for zero-role user with token T
  const adminPingDeniedInitial = await get<ErrorResponse>("/admin/ping", initialAccessToken);
  console.log("5. GET /admin/ping zero-role status:", adminPingDeniedInitial.status, adminPingDeniedInitial.body.error?.code);
  if (adminPingDeniedInitial.status !== 403 || adminPingDeniedInitial.body.error?.code !== "FORBIDDEN") {
    throw new Error("GET /admin/ping was not rejected with 403 FORBIDDEN for zero-role user");
  }

  // 6. FEAT-008: Verify GET /admin/ping returns 401 UNAUTHENTICATED when unauthenticated
  const adminPingUnauthRes = await get<ErrorResponse>("/admin/ping");
  console.log("6. GET /admin/ping unauthenticated status:", adminPingUnauthRes.status, adminPingUnauthRes.body.error?.code);
  if (adminPingUnauthRes.status !== 401 || adminPingUnauthRes.body.error?.code !== "UNAUTHENTICATED") {
    throw new Error("GET /admin/ping was not rejected with 401 UNAUTHENTICATED");
  }

  // 7. FEAT-008 Server-Side Operational Provisioning: Grant ADMIN role in PostgreSQL
  console.log("7. Assigning ADMIN role server-side via FEAT-007 operational provisioning...");
  const prisma = new PrismaClient();
  try {
    const roleRepo = new PrismaRoleRepository(prisma);
    const userRepo = new PrismaUserRepository(prisma);
    await seedCanonicalRoles(roleRepo);
    await assignRoleToExistingUser({ userId, roleCode: ROLES.ADMIN }, userRepo, roleRepo);
    console.log("7. Server-side ADMIN role assignment completed successfully.");

    // 8. FEAT-008: Use SAME access token T -> GET /admin/ping must return 200 OK
    const adminPingAllowedRes = await get<AdminPingResponse>("/admin/ping", initialAccessToken);
    console.log("8. GET /admin/ping with SAME token after ADMIN grant status:", adminPingAllowedRes.status, adminPingAllowedRes.body);
    if (adminPingAllowedRes.status !== 200) {
      throw new Error(`GET /admin/ping failed with status ${adminPingAllowedRes.status} after ADMIN grant`);
    }
    if (adminPingAllowedRes.body.status !== "ok" || adminPingAllowedRes.body.scope !== "admin") {
      throw new Error(`GET /admin/ping returned unexpected body: ${JSON.stringify(adminPingAllowedRes.body)}`);
    }
    // Verify response body does not leak user, role IDs, token, or internal fields
    const bodyKeys = Object.keys(adminPingAllowedRes.body);
    if (bodyKeys.length !== 2 || !bodyKeys.includes("status") || !bodyKeys.includes("scope")) {
      throw new Error(`GET /admin/ping response body has extra fields: ${bodyKeys.join(", ")}`);
    }

    // 9. FEAT-008 Server-Side Operational Revocation: Remove ADMIN role in PostgreSQL
    console.log("9. Removing ADMIN role server-side in PostgreSQL...");
    const adminRole = await roleRepo.findByName(ROLES.ADMIN);
    if (!adminRole) throw new Error("ADMIN role not found in database");
    await roleRepo.removeRoleFromUser(userId, adminRole.id);
    console.log("9. Server-side ADMIN role removal completed successfully.");

    // 10. FEAT-008: Use SAME access token T -> GET /admin/ping must return 403 FORBIDDEN immediately
    const adminPingDeniedAfterRemoval = await get<ErrorResponse>("/admin/ping", initialAccessToken);
    console.log("10. GET /admin/ping with SAME token after ADMIN removal status:", adminPingDeniedAfterRemoval.status, adminPingDeniedAfterRemoval.body.error?.code);
    if (adminPingDeniedAfterRemoval.status !== 403 || adminPingDeniedAfterRemoval.body.error?.code !== "FORBIDDEN") {
      throw new Error("GET /admin/ping was not immediately rejected with 403 FORBIDDEN after ADMIN removal");
    }

    // 11. FEAT-008: Verify spoofed headers/query/body remain denied (403 FORBIDDEN)
    const spoofedRes = await get<ErrorResponse>(
      "/admin/ping?admin=true&role=ADMIN",
      initialAccessToken,
      { "X-Admin": "true", "X-Role": "ADMIN" },
    );
    console.log("11. GET /admin/ping with spoofed claims status:", spoofedRes.status, spoofedRes.body.error?.code);
    if (spoofedRes.status !== 403 || spoofedRes.body.error?.code !== "FORBIDDEN") {
      throw new Error("GET /admin/ping accepted spoofed client claims");
    }
  } finally {
    await prisma.$disconnect();
  }

  // 12. Refresh token via canonical POST /auth/refresh (FEAT-005 regression)
  const refreshRes1 = await post<AuthResponse>("/auth/refresh", {}, `aura_refresh_token=${initialCookieVal}`);
  console.log("12. Refresh 1 status:", refreshRes1.status);
  const newAccessToken = refreshRes1.body.accessToken;
  const newCookieVal = extractCookieValue(refreshRes1.headers["set-cookie"], "aura_refresh_token");
  console.log("12. Rotated Set-Cookie present:", Boolean(newCookieVal), "is different:", newCookieVal !== initialCookieVal);
  if (refreshRes1.status !== 200 || !newAccessToken || !newCookieVal || newCookieVal === initialCookieVal) {
    throw new Error("Refresh 1 failed to rotate token");
  }

  // 13. Access protected endpoint with NEW access token
  const meRes2 = await get<{ user: { email: string } }>("/auth/me", newAccessToken);
  console.log("13. GET /auth/me status (refreshed):", meRes2.status, meRes2.body.user?.email);
  if (meRes2.status !== 200) {
    throw new Error("Refreshed access token failed on /auth/me");
  }

  // 14. Canonical POST /auth/logout (FEAT-006 regression)
  const logoutRes1 = await post("/auth/logout", {}, `aura_refresh_token=${newCookieVal}`);
  console.log("14. POST /auth/logout status:", logoutRes1.status);
  const isCleared1 = isCookieCleared(logoutRes1.headers["set-cookie"], "aura_refresh_token");
  console.log("14. Set-Cookie cleared with Path=/ and Expired:", isCleared1);
  if (logoutRes1.status !== 204 || !isCleared1) {
    throw new Error("Canonical logout failed or did not clear cookie");
  }

  // 15. Attempt refresh with the logged-out refresh token -> 401 UNAUTHENTICATED
  const refreshAfterLogoutRes = await post<ErrorResponse>("/auth/refresh", {}, `aura_refresh_token=${newCookieVal}`);
  console.log("15. Refresh after logout status:", refreshAfterLogoutRes.status, refreshAfterLogoutRes.body.error?.code);
  if (refreshAfterLogoutRes.status !== 401 || refreshAfterLogoutRes.body.error?.code !== "UNAUTHENTICATED") {
    throw new Error("Refresh after logout was not rejected with 401 UNAUTHENTICATED");
  }

  // 16. Repeat logout with no cookie -> 204 No Content (idempotent safe)
  const repeatLogoutRes = await post("/auth/logout", {});
  console.log("16. Repeat logout (no cookie) status:", repeatLogoutRes.status);
  if (repeatLogoutRes.status !== 204) {
    throw new Error("Repeated logout without cookie failed to return 204");
  }

  // 17. Login a new session to test alias route POST /api/auth/logout
  const loginRes2 = await post<AuthResponse>("/api/auth/login", {
    email: testEmail,
    password,
  });
  const tokenForAlias = extractCookieValue(loginRes2.headers["set-cookie"], "aura_refresh_token");
  const accessTokenForAlias = loginRes2.body.accessToken;

  // 18. POST /api/auth/logout alias
  const aliasLogoutRes = await post("/api/auth/logout", {}, `aura_refresh_token=${tokenForAlias}`);
  console.log("18. POST /api/auth/logout alias status:", aliasLogoutRes.status);
  const isAliasCleared = isCookieCleared(aliasLogoutRes.headers["set-cookie"], "aura_refresh_token");
  console.log("18. Alias Set-Cookie cleared:", isAliasCleared);
  if (aliasLogoutRes.status !== 204 || !isAliasCleared) {
    throw new Error("Alias logout failed to return 204 or clear cookie");
  }

  // 19. FEAT-004 access token continues to work on /auth/me after logout until normal expiry (stateless JWT)
  const meResAfterLogout = await get<{ user: { email: string } }>("/auth/me", accessTokenForAlias);
  console.log("19. GET /auth/me with access token after logout status:", meResAfterLogout.status, meResAfterLogout.body.user?.email);
  if (meResAfterLogout.status !== 200 || meResAfterLogout.body.user?.email !== testEmail) {
    throw new Error("Stateless access token after logout failed on /auth/me");
  }

  // 20. FEAT-007: Verify access token claims remain role-free
  const decodedPayload = JSON.parse(Buffer.from(accessTokenForAlias.split(".")[1], "base64").toString());
  console.log("20. Token payload keys:", Object.keys(decodedPayload));
  if (decodedPayload.role || decodedPayload.roles || decodedPayload.admin || decodedPayload.isAdmin || decodedPayload.permissions) {
    throw new Error("Access token unexpectedly contains role/admin claims");
  }

  // 21. FEAT-009: Verify durable PostgreSQL audit trail
  console.log("21. Verifying FEAT-009 audit event records in PostgreSQL...");
  const prismaAudit = new PrismaClient();
  try {
    const userAuditRows = await prismaAudit.authSecurityAuditRecord.findMany({
      where: {
        OR: [
          { userId },
          { actorUserId: userId },
          { subjectUserId: userId },
        ],
      },
      orderBy: { occurredAt: "asc" },
    });

    const eventTypes = userAuditRows.map((r) => r.eventType);
    console.log("21. Emitted audit events for test user:", eventTypes);

    if (!eventTypes.includes("REGISTRATION_SUCCESS")) throw new Error("Missing REGISTRATION_SUCCESS audit event");
    if (!eventTypes.includes("LOGIN_SUCCESS")) throw new Error("Missing LOGIN_SUCCESS audit event");
    if (!eventTypes.includes("AUTHORIZATION_DENIED")) throw new Error("Missing AUTHORIZATION_DENIED audit event");
    if (!eventTypes.includes("ROLE_ASSIGNED")) throw new Error("Missing ROLE_ASSIGNED audit event");
    if (!eventTypes.includes("REFRESH_SUCCESS")) throw new Error("Missing REFRESH_SUCCESS audit event");
    if (!eventTypes.includes("LOGOUT_SUCCESS")) throw new Error("Missing LOGOUT_SUCCESS audit event");

    // Verify sensitive data is absent in all records
    for (const r of userAuditRows) {
      const serialized = JSON.stringify(r);
      if (serialized.includes(password)) throw new Error("Password leaked in audit record!");
      if (serialized.includes(testEmail)) throw new Error("Raw email leaked in audit record!");
    }
    console.log("21. FEAT-009 audit records verified with zero sensitive data leaks.");
  } finally {
    await prismaAudit.$disconnect();
  }

  console.log("================================================================================");
  console.log("FEAT-006, FEAT-007, FEAT-008 & FEAT-009 runtime smoke test PASSED with 100% success!");
  console.log("================================================================================");
}

run().catch((err: unknown) => {
  console.error("SMOKE TEST FAILED:", err);
  process.exit(1);
});
