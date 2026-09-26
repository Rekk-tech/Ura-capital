import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import type { AddressInfo } from "node:net";
import { pathToFileURL } from "node:url";
import { subscriptionApi } from "../../src/api/subscription.api";
import { SubscriptionRoutes } from "../../src/app/router/subscription-routes";
import { AuthProvider } from "../../src/features/auth/context/AuthContext";

const testDbUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;

describe.skipIf(!testDbUrl)("Subscription learner real runtime journey", () => {
  let server: http.Server;
  let apiBaseUrl: string;
  // The runtime Prisma client is loaded from the independently built API package.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  let realToken: string;
  let realUser: { id: string; email: string; role: string };

  beforeAll(async () => {
    if (!testDbUrl) return;

    process.env.NODE_ENV = "test";
    process.env.DATABASE_URL = testDbUrl;
    process.env.TEST_DATABASE_URL = testDbUrl;
    process.env.JWT_SECRET =
      process.env.JWT_SECRET ?? "ci-test-jwt-secret-with-at-least-32-characters-length";
    process.env.AUTH_ACCESS_TOKEN_SECRET =
      process.env.AUTH_ACCESS_TOKEN_SECRET ?? "ci-test-access-secret-with-at-least-32-characters";
    process.env.AUTH_REFRESH_TOKEN_SECRET =
      process.env.AUTH_REFRESH_TOKEN_SECRET ?? "ci-test-refresh-secret-with-at-least-32-characters";
    process.env.AUTH_ACCESS_TOKEN_ISSUER = "aura-capital-feat056-e2e";
    process.env.AUTH_ACCESS_TOKEN_AUDIENCE = "aura-capital-web-feat056-e2e";
    process.env.SUBSCRIPTION_PROVIDER_MODE = "mock";
    process.env.SUBSCRIPTION_PROVIDER_RUN_ID = "feat056-e2e";
    process.env.SUBSCRIPTION_PROVIDER_WORKER_ID = "worker-1";
    process.env.SUBSCRIPTION_MOCK_WEBHOOK_SECRET =
      process.env.SUBSCRIPTION_MOCK_WEBHOOK_SECRET ??
      "ci-test-subscription-provider-secret-at-least-32-chars";

    const distServerPath = path.resolve(__dirname, "../../../api/dist/server.js");
    const prismaPath = path.resolve(
      __dirname,
      "../../../api/dist/infrastructure/database/prisma.js",
    );

    if (!fs.existsSync(distServerPath)) {
      execSync("npx tsc -b", {
        cwd: path.resolve(__dirname, "../../../api"),
        stdio: "pipe",
      });
    }

    const serverModule = await import(pathToFileURL(distServerPath).href);
    const prismaModule = await import(pathToFileURL(prismaPath).href);
    prisma = prismaModule.getPrismaClient();

    await new Promise<void>((resolve) => {
      server = http.createServer(serverModule.createApp());
      server.listen(0, "127.0.0.1", () => {
        const address = server.address() as AddressInfo;
        apiBaseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
    subscriptionApi.setBaseUrl(`${apiBaseUrl}/api/subscriptions`);

    // JSDOM and Node expose different AbortSignal implementations. Keep the
    // production client intact while exercising its real network path here.
    const getPlansWithoutDomSignal = subscriptionApi.getPlans.bind(subscriptionApi);
    const getCurrentWithoutDomSignal = subscriptionApi.getCurrent.bind(subscriptionApi);
    vi.spyOn(subscriptionApi, "getPlans").mockImplementation((token) =>
      getPlansWithoutDomSignal(token),
    );
    vi.spyOn(subscriptionApi, "getCurrent").mockImplementation((token) =>
      getCurrentWithoutDomSignal(token),
    );

    const email = `feat056_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.test`;
    const password = "ValidStrongPassword123!";
    const registration = await fetch(`${apiBaseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, displayName: "Subscription Learner" }),
    });
    if (!registration.ok) throw new Error("Runtime learner registration failed");

    const login = await fetch(`${apiBaseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!login.ok) throw new Error("Runtime learner login failed");

    const loginBody = (await login.json()) as {
      accessToken: string;
      user: { id: string; email: string; role: string };
    };
    realToken = loginBody.accessToken;
    realUser = loginBody.user;
  }, 30_000);

  afterAll(async () => {
    vi.restoreAllMocks();
    subscriptionApi.setBaseUrl("/api/subscriptions");

    if (prisma && realUser?.id) {
      await prisma.subscriptionTransitionRecord.deleteMany({ where: { userId: realUser.id } });
      await prisma.userSubscription.deleteMany({ where: { userId: realUser.id } });
      await prisma.refreshSession.deleteMany({ where: { userId: realUser.id } });
      await prisma.credential.deleteMany({ where: { userId: realUser.id } });
      await prisma.userRole.deleteMany({ where: { userId: realUser.id } });
      await prisma.user.deleteMany({ where: { id: realUser.id } });
    }

    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it("reflects FREE, ACTIVE PREMIUM, and PAST_DUE from real PostgreSQL with the same JWT", async () => {
    const directResponse = await fetch(`${apiBaseUrl}/api/subscriptions/me`, {
      headers: { Authorization: `Bearer ${realToken}` },
    });
    expect(directResponse.status).toBe(200);
    const directBody = (await directResponse.json()) as { data: { status: string; planKey: string } };
    expect(directBody.data).toMatchObject({ status: "NONE", planKey: "FREE" });
    await expect(subscriptionApi.getCurrent(realToken)).resolves.toMatchObject({
      data: { status: "NONE", planKey: "FREE" },
    });
    await expect(subscriptionApi.getPlans(realToken)).resolves.toMatchObject({
      data: [
        { planKey: "FREE" },
        { planKey: "PREMIUM" },
      ],
    });

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/subscription"]}>
          <AuthProvider initialToken={realToken} initialUser={realUser}>
            <Routes>
              <Route path="/subscription/*" element={<SubscriptionRoutes />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(
      () => expect(screen.getByText("Your Free plan is active")).toBeDefined(),
      { timeout: 10_000 },
    );

    const subscription = await prisma.userSubscription.create({
      data: {
        userId: realUser.id,
        planKey: "PREMIUM",
        status: "ACTIVE",
        providerKey: "MOCK",
        externalSubscriptionId: `feat056_${realUser.id}`,
        currentPeriodStart: new Date(Date.now() - 60_000),
        currentPeriodEnd: new Date(Date.now() + 86_400_000),
        cancelAtPeriodEnd: false,
      },
    });

    fireEvent.click(screen.getByRole("button", { name: "Refresh subscription status" }));
    await waitFor(
      () => expect(screen.getByText("Premium access is active")).toBeDefined(),
      { timeout: 10_000 },
    );
    expect(screen.getByText("Enabled by server")).toBeDefined();

    await prisma.userSubscription.update({
      where: { id: subscription.id },
      data: { status: "PAST_DUE" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Refresh subscription status" }));
    await waitFor(
      () => expect(screen.getByText("Premium access is paused")).toBeDefined(),
      { timeout: 10_000 },
    );
    expect(screen.getByText("Not enabled")).toBeDefined();
  }, 30_000);
});
