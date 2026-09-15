import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { Prisma } from "@prisma/client";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import { createApp } from "../../src/server.js";
import { accessTokenService } from "../../src/modules/auth/access-token.service.js";
import { PrismaUserRepository } from "../../src/modules/users/user.repository.js";
import {
  PrismaSimulationAssetRepository,
  PrismaSimulationMarketSnapshotRepository,
  PrismaSimulationScenarioRepository,
} from "../../src/modules/simulation/simulation.repository.js";

const activeUser = {
  id: "11111111-2222-4333-8444-555555555555",
  email: "sim.reader@auracapital.test",
  displayName: "Simulation Reader",
  status: "ACTIVE",
  createdAt: new Date("2026-09-15T00:00:00.000Z"),
  updatedAt: new Date("2026-09-15T00:00:00.000Z"),
};

function mockAuthenticatedUser(): string {
  vi.spyOn(PrismaUserRepository.prototype, "findById").mockResolvedValue(activeUser);
  return accessTokenService.issueAccessToken(activeUser.id).accessToken;
}

describe("FEAT-032 Simulation market read routes", () => {
  const app = createApp();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("requires authentication for asset catalog", async () => {
    const res = await request(app)
      .get("/api/simulation/assets")
      .expect(HTTP_STATUS.UNAUTHORIZED);

    expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
  });

  it("returns approved mock equity asset DTOs without internal IDs or timestamps", async () => {
    const token = mockAuthenticatedUser();
    vi.spyOn(PrismaSimulationAssetRepository.prototype, "listAssets").mockResolvedValue([
      {
        id: "internal-asset-id",
        symbol: "AAPL",
        name: "Apple Inc.",
        assetType: "EQUITY",
        status: "ACTIVE",
        displayOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const res = await request(app)
      .get("/api/simulation/assets")
      .set("Authorization", `Bearer ${token}`)
      .expect(HTTP_STATUS.OK);

    expect(res.body).toEqual({
      data: [
        {
          symbol: "AAPL",
          name: "Apple Inc.",
          assetType: "EQUITY",
          status: "ACTIVE",
          displayOrder: 1,
          simulated: true,
        },
      ],
    });
    expect(res.body.data[0]).not.toHaveProperty("id");
    expect(res.body.data[0]).not.toHaveProperty("createdAt");
    expect(res.body.data[0]).not.toHaveProperty("updatedAt");
  });

  it("requires authentication for scenario snapshots", async () => {
    const res = await request(app)
      .get("/api/simulation/scenarios/MVP_SCENARIO/snapshots/1")
      .expect(HTTP_STATUS.UNAUTHORIZED);

    expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
  });

  it("returns persisted scenario snapshots in safe DTO shape", async () => {
    const token = mockAuthenticatedUser();
    vi.spyOn(PrismaSimulationScenarioRepository.prototype, "findScenarioByKey").mockResolvedValue({
      id: "scenario-id",
      key: "MVP_SCENARIO",
      name: "MVP Scenario",
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.spyOn(
      PrismaSimulationMarketSnapshotRepository.prototype,
      "listSnapshotsByScenarioAndCycle",
    ).mockResolvedValue([
      {
        id: "snap-2",
        scenarioId: "scenario-id",
        assetId: "asset-2",
        cycle: 1,
        price: new Prisma.Decimal("250.500000"),
        occurredAt: new Date("2026-09-15T00:00:00.000Z"),
        createdAt: new Date(),
        asset: {
          id: "asset-2",
          symbol: "MSFT",
          name: "Microsoft Corp.",
          assetType: "EQUITY",
          status: "ACTIVE",
          displayOrder: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    ]);

    const res = await request(app)
      .get("/api/simulation/scenarios/MVP_SCENARIO/snapshots/1")
      .set("Authorization", `Bearer ${token}`)
      .expect(HTTP_STATUS.OK);

    expect(res.body).toEqual({
      data: [
        {
          scenarioKey: "MVP_SCENARIO",
          cycle: 1,
          assetSymbol: "MSFT",
          price: "250.500000",
          occurredAt: "2026-09-15T00:00:00.000Z",
          simulated: true,
        },
      ],
    });
    expect(res.body.data[0]).not.toHaveProperty("id");
    expect(res.body.data[0]).not.toHaveProperty("scenarioId");
    expect(res.body.data[0]).not.toHaveProperty("assetId");
  });

  it("rejects invalid cycle and scenario key params", async () => {
    const token = mockAuthenticatedUser();

    const badCycle = await request(app)
      .get("/api/simulation/scenarios/MVP_SCENARIO/snapshots/0")
      .set("Authorization", `Bearer ${token}`)
      .expect(HTTP_STATUS.BAD_REQUEST);
    expect(badCycle.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);

    const badScenario = await request(app)
      .get("/api/simulation/scenarios/bad scenario/snapshots/1")
      .set("Authorization", `Bearer ${token}`)
      .expect(HTTP_STATUS.BAD_REQUEST);
    expect(badScenario.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
  });

  it("rejects client-authority query/body fields instead of silently ignoring them", async () => {
    const token = mockAuthenticatedUser();

    const queryRes = await request(app)
      .get("/api/simulation/scenarios/MVP_SCENARIO/snapshots/1?price=1&cycle=2")
      .set("Authorization", `Bearer ${token}`)
      .expect(HTTP_STATUS.BAD_REQUEST);
    expect(queryRes.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);

    const bodyRes = await request(app)
      .get("/api/simulation/assets")
      .set("Authorization", `Bearer ${token}`)
      .send({ availability: "ACTIVE" })
      .expect(HTTP_STATUS.BAD_REQUEST);
    expect(bodyRes.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
  });

  it("returns safe not found errors for unknown scenario or cycle", async () => {
    const token = mockAuthenticatedUser();
    vi.spyOn(PrismaSimulationScenarioRepository.prototype, "findScenarioByKey").mockResolvedValueOnce(null);

    const unknownScenario = await request(app)
      .get("/api/simulation/scenarios/UNKNOWN/snapshots/1")
      .set("Authorization", `Bearer ${token}`)
      .expect(HTTP_STATUS.NOT_FOUND);
    expect(unknownScenario.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
    expect(unknownScenario.body.error.message).toBe("Scenario not found");

    vi.spyOn(PrismaSimulationScenarioRepository.prototype, "findScenarioByKey").mockResolvedValueOnce({
      id: "scenario-id",
      key: "MVP_SCENARIO",
      name: "MVP Scenario",
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.spyOn(
      PrismaSimulationMarketSnapshotRepository.prototype,
      "listSnapshotsByScenarioAndCycle",
    ).mockResolvedValueOnce([]);

    const unknownCycle = await request(app)
      .get("/api/simulation/scenarios/MVP_SCENARIO/snapshots/99")
      .set("Authorization", `Bearer ${token}`)
      .expect(HTTP_STATUS.NOT_FOUND);
    expect(unknownCycle.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
    expect(unknownCycle.body.error.message).toBe("Market snapshots not found");
  });

  it("does not introduce FEAT-033 session routes", async () => {
    const token = mockAuthenticatedUser();

    const res = await request(app)
      .post("/api/simulation/sessions")
      .set("Authorization", `Bearer ${token}`)
      .send({})
      .expect(HTTP_STATUS.NOT_FOUND);

    expect(res.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
  });
});
