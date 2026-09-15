import {
  type PrismaClient,
  Prisma,
  type SimulationScenario,
  type SimulationAsset,
  type SimulationMarketSnapshot,
  type SimulationSession,
  type SimulationPortfolio,
  type SimulationPosition,
  type SimulationOrder,
  type SimulationTrade,
} from "@prisma/client";

import type {
  CreateScenarioInput,
  CreateAssetInput,
  CreateSnapshotInput,
  CreateSessionInput,
  CreatePortfolioInput,
  CreatePositionInput,
  CreateOrderInput,
  CreateTradeInput,
  SimulationScenarioStatus,
  SimulationSessionStatus,
  SimulationOrderStatus,
} from "./simulation.types.js";

import { getPrismaClient } from "../../infrastructure/database/prisma.js";

type DbClient = PrismaClient | Prisma.TransactionClient;

export type SimulationMarketSnapshotWithAsset = SimulationMarketSnapshot & {
  asset: SimulationAsset;
};

function toDecimal(val: Prisma.Decimal | string | number): Prisma.Decimal {
  return val instanceof Prisma.Decimal ? val : new Prisma.Decimal(val);
}

// ============================================================================
// 1. Simulation Scenario Repository
// ============================================================================

export interface ISimulationScenarioRepository {
  createScenario(data: CreateScenarioInput): Promise<SimulationScenario>;
  findScenarioById(id: string): Promise<SimulationScenario | null>;
  findScenarioByKey(key: string): Promise<SimulationScenario | null>;
  listScenarios(filter?: { status?: SimulationScenarioStatus }): Promise<SimulationScenario[]>;
}

export class PrismaSimulationScenarioRepository implements ISimulationScenarioRepository {
  private client: DbClient;

  constructor(client?: DbClient) {
    this.client = client || getPrismaClient();
  }

  async createScenario(data: CreateScenarioInput): Promise<SimulationScenario> {
    return this.client.simulationScenario.create({
      data: {
        key: data.key,
        name: data.name,
        status: data.status ?? "ACTIVE",
      },
    });
  }

  async findScenarioById(id: string): Promise<SimulationScenario | null> {
    return this.client.simulationScenario.findUnique({
      where: { id },
    });
  }

  async findScenarioByKey(key: string): Promise<SimulationScenario | null> {
    return this.client.simulationScenario.findUnique({
      where: { key },
    });
  }

  async listScenarios(filter?: { status?: SimulationScenarioStatus }): Promise<SimulationScenario[]> {
    return this.client.simulationScenario.findMany({
      where: filter?.status ? { status: filter.status } : undefined,
      orderBy: { createdAt: "desc" },
    });
  }
}

// ============================================================================
// 2. Simulation Asset Repository
// ============================================================================

export interface ISimulationAssetRepository {
  createAsset(data: CreateAssetInput): Promise<SimulationAsset>;
  findAssetById(id: string): Promise<SimulationAsset | null>;
  findAssetBySymbol(symbol: string): Promise<SimulationAsset | null>;
  listAssets(filter?: { status?: string; assetType?: string }): Promise<SimulationAsset[]>;
}

export class PrismaSimulationAssetRepository implements ISimulationAssetRepository {
  private client: DbClient;

  constructor(client?: DbClient) {
    this.client = client || getPrismaClient();
  }

  async createAsset(data: CreateAssetInput): Promise<SimulationAsset> {
    return this.client.simulationAsset.create({
      data: {
        symbol: data.symbol,
        name: data.name,
        assetType: data.assetType ?? "EQUITY",
        status: data.status ?? "ACTIVE",
        displayOrder: data.displayOrder ?? 0,
      },
    });
  }

  async findAssetById(id: string): Promise<SimulationAsset | null> {
    return this.client.simulationAsset.findUnique({
      where: { id },
    });
  }

  async findAssetBySymbol(symbol: string): Promise<SimulationAsset | null> {
    return this.client.simulationAsset.findUnique({
      where: { symbol },
    });
  }

  async listAssets(filter?: { status?: string; assetType?: string }): Promise<SimulationAsset[]> {
    return this.client.simulationAsset.findMany({
      where: {
        status: filter?.status,
        assetType: filter?.assetType,
      },
      orderBy: { displayOrder: "asc" },
    });
  }
}

// ============================================================================
// 3. Simulation Market Snapshot Repository
// ============================================================================

export interface ISimulationMarketSnapshotRepository {
  createSnapshot(data: CreateSnapshotInput): Promise<SimulationMarketSnapshot>;
  findSnapshotById(id: string): Promise<SimulationMarketSnapshot | null>;
  findSnapshot(scenarioId: string, cycle: number, assetId: string): Promise<SimulationMarketSnapshot | null>;
  listSnapshotsByScenarioAndCycle(
    scenarioId: string,
    cycle: number,
    filter?: { assetStatus?: string; assetType?: string },
  ): Promise<SimulationMarketSnapshotWithAsset[]>;
}

export class PrismaSimulationMarketSnapshotRepository implements ISimulationMarketSnapshotRepository {
  private client: DbClient;

  constructor(client?: DbClient) {
    this.client = client || getPrismaClient();
  }

  async createSnapshot(data: CreateSnapshotInput): Promise<SimulationMarketSnapshot> {
    return this.client.simulationMarketSnapshot.create({
      data: {
        scenarioId: data.scenarioId,
        assetId: data.assetId,
        cycle: data.cycle,
        price: toDecimal(data.price),
        occurredAt: data.occurredAt,
      },
    });
  }

  async findSnapshotById(id: string): Promise<SimulationMarketSnapshot | null> {
    return this.client.simulationMarketSnapshot.findUnique({
      where: { id },
    });
  }

  async findSnapshot(scenarioId: string, cycle: number, assetId: string): Promise<SimulationMarketSnapshot | null> {
    return this.client.simulationMarketSnapshot.findUnique({
      where: {
        scenarioId_cycle_assetId: {
          scenarioId,
          cycle,
          assetId,
        },
      },
    });
  }

  async listSnapshotsByScenarioAndCycle(
    scenarioId: string,
    cycle: number,
    filter?: { assetStatus?: string; assetType?: string },
  ): Promise<SimulationMarketSnapshotWithAsset[]> {
    return this.client.simulationMarketSnapshot.findMany({
      where: {
        scenarioId,
        cycle,
        asset: {
          status: filter?.assetStatus,
          assetType: filter?.assetType,
        },
      },
      include: {
        asset: true,
      },
      orderBy: [
        { asset: { displayOrder: "asc" } },
        { asset: { symbol: "asc" } },
      ],
    });
  }
}

// ============================================================================
// 4. Simulation Session Repository
// ============================================================================

export interface ISimulationSessionRepository {
  createSession(data: CreateSessionInput): Promise<SimulationSession>;
  findSessionById(id: string): Promise<SimulationSession | null>;
  findActiveSessionByUserId(userId: string): Promise<SimulationSession | null>;
  listSessionsByUserId(userId: string, filter?: { status?: SimulationSessionStatus }): Promise<SimulationSession[]>;
  updateSessionStatus(
    id: string,
    status: SimulationSessionStatus,
    timestampField?: "startedAt" | "completedAt" | "cancelledAt",
    timestamp?: Date,
  ): Promise<SimulationSession>;
  advanceCycle(id: string, newCycle: number): Promise<SimulationSession>;
}

export class PrismaSimulationSessionRepository implements ISimulationSessionRepository {
  private client: DbClient;

  constructor(client?: DbClient) {
    this.client = client || getPrismaClient();
  }

  async createSession(data: CreateSessionInput): Promise<SimulationSession> {
    return this.client.simulationSession.create({
      data: {
        userId: data.userId,
        scenarioId: data.scenarioId,
        status: data.status ?? "CREATED",
        startingCash: data.startingCash ? toDecimal(data.startingCash) : undefined,
        currentCycle: data.currentCycle ?? 1,
        startedAt: data.startedAt,
      },
    });
  }

  async findSessionById(id: string): Promise<SimulationSession | null> {
    return this.client.simulationSession.findUnique({
      where: { id },
      include: {
        scenario: true,
        portfolio: {
          include: {
            positions: {
              include: { asset: true },
            },
          },
        },
      },
    });
  }

  async findActiveSessionByUserId(userId: string): Promise<SimulationSession | null> {
    return this.client.simulationSession.findFirst({
      where: {
        userId,
        status: "ACTIVE",
      },
      include: {
        scenario: true,
        portfolio: {
          include: {
            positions: {
              include: { asset: true },
            },
          },
        },
      },
    });
  }

  async listSessionsByUserId(
    userId: string,
    filter?: { status?: SimulationSessionStatus },
  ): Promise<SimulationSession[]> {
    return this.client.simulationSession.findMany({
      where: {
        userId,
        status: filter?.status,
      },
      include: {
        scenario: true,
        portfolio: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateSessionStatus(
    id: string,
    status: SimulationSessionStatus,
    timestampField?: "startedAt" | "completedAt" | "cancelledAt",
    timestamp: Date = new Date(),
  ): Promise<SimulationSession> {
    const data: Prisma.SimulationSessionUpdateInput = { status };
    if (timestampField === "startedAt") data.startedAt = timestamp;
    if (timestampField === "completedAt") data.completedAt = timestamp;
    if (timestampField === "cancelledAt") data.cancelledAt = timestamp;

    return this.client.simulationSession.update({
      where: { id },
      data,
    });
  }

  async advanceCycle(id: string, newCycle: number): Promise<SimulationSession> {
    return this.client.simulationSession.update({
      where: { id },
      data: { currentCycle: newCycle },
    });
  }
}

// ============================================================================
// 5. Simulation Portfolio & Position Repository
// ============================================================================

export interface ISimulationPortfolioRepository {
  createPortfolio(data: CreatePortfolioInput): Promise<SimulationPortfolio>;
  findPortfolioBySessionId(sessionId: string): Promise<SimulationPortfolio | null>;
  findPortfolioById(id: string): Promise<SimulationPortfolio | null>;
  updateCashBalance(id: string, cashBalance: Prisma.Decimal | string | number): Promise<SimulationPortfolio>;
  updateRealizedPnl(id: string, realizedPnl: Prisma.Decimal | string | number): Promise<SimulationPortfolio>;
  updatePortfolioAccounting(
    id: string,
    data: {
      cashBalance: Prisma.Decimal | string | number;
      realizedPnl?: Prisma.Decimal | string | number;
    },
  ): Promise<SimulationPortfolio>;
  createPosition(data: CreatePositionInput): Promise<SimulationPosition>;
  findPosition(portfolioId: string, assetId: string): Promise<SimulationPosition | null>;
  listPositions(portfolioId: string): Promise<SimulationPosition[]>;
  upsertPosition(
    portfolioId: string,
    assetId: string,
    quantity: number,
    averageCost: Prisma.Decimal | string | number,
  ): Promise<SimulationPosition>;
  deletePosition(portfolioId: string, assetId: string): Promise<SimulationPosition | null>;
}

export class PrismaSimulationPortfolioRepository implements ISimulationPortfolioRepository {
  private client: DbClient;

  constructor(client?: DbClient) {
    this.client = client || getPrismaClient();
  }

  async createPortfolio(data: CreatePortfolioInput): Promise<SimulationPortfolio> {
    return this.client.simulationPortfolio.create({
      data: {
        sessionId: data.sessionId,
        cashBalance: toDecimal(data.cashBalance),
        realizedPnl: data.realizedPnl ? toDecimal(data.realizedPnl) : undefined,
      },
    });
  }

  async findPortfolioBySessionId(sessionId: string): Promise<SimulationPortfolio | null> {
    return this.client.simulationPortfolio.findUnique({
      where: { sessionId },
      include: {
        positions: {
          include: { asset: true },
        },
      },
    });
  }

  async findPortfolioById(id: string): Promise<SimulationPortfolio | null> {
    return this.client.simulationPortfolio.findUnique({
      where: { id },
      include: {
        positions: {
          include: { asset: true },
        },
      },
    });
  }

  async updateCashBalance(
    id: string,
    cashBalance: Prisma.Decimal | string | number,
  ): Promise<SimulationPortfolio> {
    return this.client.simulationPortfolio.update({
      where: { id },
      data: { cashBalance: toDecimal(cashBalance) },
    });
  }

  async updateRealizedPnl(
    id: string,
    realizedPnl: Prisma.Decimal | string | number,
  ): Promise<SimulationPortfolio> {
    return this.client.simulationPortfolio.update({
      where: { id },
      data: { realizedPnl: toDecimal(realizedPnl) },
    });
  }

  async updatePortfolioAccounting(
    id: string,
    data: {
      cashBalance: Prisma.Decimal | string | number;
      realizedPnl?: Prisma.Decimal | string | number;
    },
  ): Promise<SimulationPortfolio> {
    return this.client.simulationPortfolio.update({
      where: { id },
      data: {
        cashBalance: toDecimal(data.cashBalance),
        realizedPnl: data.realizedPnl !== undefined ? toDecimal(data.realizedPnl) : undefined,
      },
    });
  }

  async createPosition(data: CreatePositionInput): Promise<SimulationPosition> {
    return this.client.simulationPosition.create({
      data: {
        portfolioId: data.portfolioId,
        assetId: data.assetId,
        quantity: data.quantity,
        averageCost: toDecimal(data.averageCost),
      },
    });
  }

  async findPosition(portfolioId: string, assetId: string): Promise<SimulationPosition | null> {
    return this.client.simulationPosition.findUnique({
      where: {
        portfolioId_assetId: {
          portfolioId,
          assetId,
        },
      },
    });
  }

  async listPositions(portfolioId: string): Promise<SimulationPosition[]> {
    return this.client.simulationPosition.findMany({
      where: { portfolioId },
      include: { asset: true },
      orderBy: { asset: { displayOrder: "asc" } },
    });
  }

  async upsertPosition(
    portfolioId: string,
    assetId: string,
    quantity: number,
    averageCost: Prisma.Decimal | string | number,
  ): Promise<SimulationPosition> {
    const cost = toDecimal(averageCost);
    return this.client.simulationPosition.upsert({
      where: {
        portfolioId_assetId: {
          portfolioId,
          assetId,
        },
      },
      create: {
        portfolioId,
        assetId,
        quantity,
        averageCost: cost,
      },
      update: {
        quantity,
        averageCost: cost,
      },
    });
  }

  async deletePosition(portfolioId: string, assetId: string): Promise<SimulationPosition | null> {
    try {
      return await this.client.simulationPosition.delete({
        where: {
          portfolioId_assetId: {
            portfolioId,
            assetId,
          },
        },
      });
    } catch {
      return null;
    }
  }
}

// ============================================================================
// 6. Simulation Order Repository
// ============================================================================

export interface ISimulationOrderRepository {
  createOrder(data: CreateOrderInput): Promise<SimulationOrder>;
  findOrderById(id: string): Promise<SimulationOrder | null>;
  findOrderByUserSessionIdempotencyKey(
    userId: string,
    sessionId: string,
    idempotencyKey: string,
  ): Promise<SimulationOrder | null>;
  listOrdersBySessionId(sessionId: string): Promise<SimulationOrder[]>;
  updateOrderStatus(
    id: string,
    status: SimulationOrderStatus,
    details?: {
      executionPrice?: Prisma.Decimal | string | number | null;
      executedQuantity?: number | null;
      filledAt?: Date | null;
      rejectionCode?: string | null;
    },
  ): Promise<SimulationOrder>;
}

export class PrismaSimulationOrderRepository implements ISimulationOrderRepository {
  private client: DbClient;

  constructor(client?: DbClient) {
    this.client = client || getPrismaClient();
  }

  async createOrder(data: CreateOrderInput): Promise<SimulationOrder> {
    return this.client.simulationOrder.create({
      data: {
        sessionId: data.sessionId,
        userId: data.userId,
        assetId: data.assetId,
        side: data.side,
        type: data.type ?? "MARKET",
        quantity: data.quantity,
        status: data.status ?? "RECEIVED",
        idempotencyKey: data.idempotencyKey,
        requestFingerprint: data.requestFingerprint,
        executionPrice: data.executionPrice ? toDecimal(data.executionPrice) : null,
        executedQuantity: data.executedQuantity ?? null,
      },
    });
  }

  async findOrderById(id: string): Promise<SimulationOrder | null> {
    return this.client.simulationOrder.findUnique({
      where: { id },
      include: {
        asset: true,
        trade: true,
      },
    });
  }

  async findOrderByUserSessionIdempotencyKey(
    userId: string,
    sessionId: string,
    idempotencyKey: string,
  ): Promise<SimulationOrder | null> {
    return this.client.simulationOrder.findUnique({
      where: {
        userId_sessionId_idempotencyKey: {
          userId,
          sessionId,
          idempotencyKey,
        },
      },
      include: {
        asset: true,
        trade: true,
      },
    });
  }

  async listOrdersBySessionId(sessionId: string): Promise<SimulationOrder[]> {
    return this.client.simulationOrder.findMany({
      where: { sessionId },
      include: {
        asset: true,
        trade: true,
      },
      orderBy: { submittedAt: "desc" },
    });
  }

  async updateOrderStatus(
    id: string,
    status: SimulationOrderStatus,
    details?: {
      executionPrice?: Prisma.Decimal | string | number | null;
      executedQuantity?: number | null;
      filledAt?: Date | null;
      rejectionCode?: string | null;
    },
  ): Promise<SimulationOrder> {
    return this.client.simulationOrder.update({
      where: { id },
      data: {
        status,
        executionPrice: details?.executionPrice !== undefined && details.executionPrice !== null
          ? toDecimal(details.executionPrice)
          : undefined,
        executedQuantity: details?.executedQuantity !== undefined ? details.executedQuantity : undefined,
        filledAt: details?.filledAt !== undefined ? details.filledAt : undefined,
        rejectionCode: details?.rejectionCode !== undefined ? details.rejectionCode : undefined,
      },
    });
  }
}

// ============================================================================
// 7. Simulation Trade Repository
// ============================================================================

export interface ISimulationTradeRepository {
  createTrade(data: CreateTradeInput): Promise<SimulationTrade>;
  findTradeById(id: string): Promise<SimulationTrade | null>;
  findTradeByOrderId(orderId: string): Promise<SimulationTrade | null>;
  listTradesBySessionId(sessionId: string): Promise<SimulationTrade[]>;
}

export class PrismaSimulationTradeRepository implements ISimulationTradeRepository {
  private client: DbClient;

  constructor(client?: DbClient) {
    this.client = client || getPrismaClient();
  }

  async createTrade(data: CreateTradeInput): Promise<SimulationTrade> {
    return this.client.simulationTrade.create({
      data: {
        orderId: data.orderId,
        sessionId: data.sessionId,
        assetId: data.assetId,
        side: data.side,
        quantity: data.quantity,
        executionPrice: toDecimal(data.executionPrice),
        notional: toDecimal(data.notional),
        realizedPnl: data.realizedPnl ? toDecimal(data.realizedPnl) : undefined,
        executedAt: data.executedAt,
      },
    });
  }

  async findTradeById(id: string): Promise<SimulationTrade | null> {
    return this.client.simulationTrade.findUnique({
      where: { id },
      include: {
        asset: true,
        order: true,
      },
    });
  }

  async findTradeByOrderId(orderId: string): Promise<SimulationTrade | null> {
    return this.client.simulationTrade.findUnique({
      where: { orderId },
      include: {
        asset: true,
        order: true,
      },
    });
  }

  async listTradesBySessionId(sessionId: string): Promise<SimulationTrade[]> {
    return this.client.simulationTrade.findMany({
      where: { sessionId },
      include: {
        asset: true,
        order: true,
      },
      orderBy: { executedAt: "desc" },
    });
  }
}
