-- CreateTable: simulation_scenarios
CREATE TABLE "simulation_scenarios" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "simulation_scenarios_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "simulation_scenarios_status_check" CHECK ("status" IN ('ACTIVE', 'ARCHIVED'))
);

-- CreateTable: simulation_assets
CREATE TABLE "simulation_assets" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "asset_type" TEXT NOT NULL DEFAULT 'EQUITY',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "simulation_assets_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "simulation_assets_asset_type_check" CHECK ("asset_type" IN ('EQUITY')),
    CONSTRAINT "simulation_assets_status_check" CHECK ("status" IN ('ACTIVE', 'ARCHIVED'))
);

-- CreateTable: simulation_market_snapshots
CREATE TABLE "simulation_market_snapshots" (
    "id" TEXT NOT NULL,
    "scenario_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "cycle" INTEGER NOT NULL,
    "price" DECIMAL(20,6) NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "simulation_market_snapshots_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "simulation_market_snapshots_cycle_check" CHECK ("cycle" >= 1),
    CONSTRAINT "simulation_market_snapshots_price_check" CHECK ("price" > 0)
);

-- CreateTable: simulation_sessions
CREATE TABLE "simulation_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "scenario_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "starting_cash" DECIMAL(20,4) NOT NULL DEFAULT 100000.0000,
    "current_cycle" INTEGER NOT NULL DEFAULT 1,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "simulation_sessions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "simulation_sessions_status_check" CHECK ("status" IN ('CREATED', 'ACTIVE', 'COMPLETED', 'CANCELLED')),
    CONSTRAINT "simulation_sessions_starting_cash_check" CHECK ("starting_cash" > 0),
    CONSTRAINT "simulation_sessions_current_cycle_check" CHECK ("current_cycle" >= 1)
);

-- CreateTable: simulation_portfolios
CREATE TABLE "simulation_portfolios" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "cash_balance" DECIMAL(20,4) NOT NULL,
    "realized_pnl" DECIMAL(20,4) NOT NULL DEFAULT 0.0000,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "simulation_portfolios_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "simulation_portfolios_cash_balance_check" CHECK ("cash_balance" >= 0)
);

-- CreateTable: simulation_positions
CREATE TABLE "simulation_positions" (
    "id" TEXT NOT NULL,
    "portfolio_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "average_cost" DECIMAL(20,6) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "simulation_positions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "simulation_positions_quantity_check" CHECK ("quantity" >= 0),
    CONSTRAINT "simulation_positions_average_cost_check" CHECK ("average_cost" >= 0)
);

-- CreateTable: simulation_orders
CREATE TABLE "simulation_orders" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'MARKET',
    "quantity" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "idempotency_key" TEXT NOT NULL,
    "request_fingerprint" TEXT NOT NULL,
    "rejection_code" TEXT,
    "execution_price" DECIMAL(20,6),
    "executed_quantity" INTEGER,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "filled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "simulation_orders_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "simulation_orders_side_check" CHECK ("side" IN ('BUY', 'SELL')),
    CONSTRAINT "simulation_orders_type_check" CHECK ("type" IN ('MARKET')),
    CONSTRAINT "simulation_orders_quantity_check" CHECK ("quantity" > 0),
    CONSTRAINT "simulation_orders_status_check" CHECK ("status" IN ('RECEIVED', 'FILLED', 'REJECTED')),
    CONSTRAINT "simulation_orders_execution_price_check" CHECK ("execution_price" IS NULL OR "execution_price" > 0),
    CONSTRAINT "simulation_orders_executed_quantity_check" CHECK ("executed_quantity" IS NULL OR "executed_quantity" > 0)
);

-- CreateTable: simulation_trades
CREATE TABLE "simulation_trades" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "execution_price" DECIMAL(20,6) NOT NULL,
    "notional" DECIMAL(20,4) NOT NULL,
    "realized_pnl" DECIMAL(20,4) NOT NULL DEFAULT 0.0000,
    "executed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "simulation_trades_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "simulation_trades_side_check" CHECK ("side" IN ('BUY', 'SELL')),
    CONSTRAINT "simulation_trades_quantity_check" CHECK ("quantity" > 0),
    CONSTRAINT "simulation_trades_execution_price_check" CHECK ("execution_price" > 0),
    CONSTRAINT "simulation_trades_notional_check" CHECK ("notional" >= 0)
);

-- Indexes & Unique Constraints

-- Scenario unique key
CREATE UNIQUE INDEX "simulation_scenarios_key_key" ON "simulation_scenarios"("key");

-- Asset unique symbol
CREATE UNIQUE INDEX "simulation_assets_symbol_key" ON "simulation_assets"("symbol");

-- Market Snapshot indexes & unique
CREATE INDEX "simulation_market_snapshots_scenario_id_cycle_idx" ON "simulation_market_snapshots"("scenario_id", "cycle");
CREATE INDEX "simulation_market_snapshots_asset_id_idx" ON "simulation_market_snapshots"("asset_id");
CREATE UNIQUE INDEX "simulation_market_snapshots_scenario_id_cycle_asset_id_key" ON "simulation_market_snapshots"("scenario_id", "cycle", "asset_id");

-- Session indexes & constraints
CREATE INDEX "simulation_sessions_user_id_idx" ON "simulation_sessions"("user_id");
CREATE INDEX "simulation_sessions_scenario_id_idx" ON "simulation_sessions"("scenario_id");
CREATE INDEX "simulation_sessions_status_idx" ON "simulation_sessions"("status");
CREATE UNIQUE INDEX "simulation_sessions_id_user_id_key" ON "simulation_sessions"("id", "user_id");
CREATE UNIQUE INDEX "simulation_sessions_user_active_idx" ON "simulation_sessions" ("user_id") WHERE "status" = 'ACTIVE';

-- Portfolio unique session
CREATE UNIQUE INDEX "simulation_portfolios_session_id_key" ON "simulation_portfolios"("session_id");

-- Position indexes & unique
CREATE INDEX "simulation_positions_portfolio_id_idx" ON "simulation_positions"("portfolio_id");
CREATE INDEX "simulation_positions_asset_id_idx" ON "simulation_positions"("asset_id");
CREATE UNIQUE INDEX "simulation_positions_portfolio_id_asset_id_key" ON "simulation_positions"("portfolio_id", "asset_id");

-- Order indexes & unique
CREATE INDEX "simulation_orders_session_id_idx" ON "simulation_orders"("session_id");
CREATE INDEX "simulation_orders_user_id_idx" ON "simulation_orders"("user_id");
CREATE INDEX "simulation_orders_asset_id_idx" ON "simulation_orders"("asset_id");
CREATE INDEX "simulation_orders_status_idx" ON "simulation_orders"("status");
CREATE UNIQUE INDEX "simulation_orders_user_id_session_id_idempotency_key_key" ON "simulation_orders"("user_id", "session_id", "idempotency_key");
CREATE UNIQUE INDEX "simulation_orders_id_session_id_asset_id_key" ON "simulation_orders"("id", "session_id", "asset_id");

-- Trade indexes & unique
CREATE UNIQUE INDEX "simulation_trades_order_id_key" ON "simulation_trades"("order_id");
CREATE INDEX "simulation_trades_session_id_idx" ON "simulation_trades"("session_id");
CREATE INDEX "simulation_trades_asset_id_idx" ON "simulation_trades"("asset_id");
CREATE INDEX "simulation_trades_order_id_idx" ON "simulation_trades"("order_id");

-- Foreign Keys (with ON DELETE RESTRICT)

-- Market Snapshot -> Scenario & Asset
ALTER TABLE "simulation_market_snapshots" ADD CONSTRAINT "simulation_market_snapshots_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "simulation_scenarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "simulation_market_snapshots" ADD CONSTRAINT "simulation_market_snapshots_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "simulation_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Session -> User & Scenario
ALTER TABLE "simulation_sessions" ADD CONSTRAINT "simulation_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "simulation_sessions" ADD CONSTRAINT "simulation_sessions_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "simulation_scenarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Portfolio -> Session
ALTER TABLE "simulation_portfolios" ADD CONSTRAINT "simulation_portfolios_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "simulation_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Position -> Portfolio & Asset
ALTER TABLE "simulation_positions" ADD CONSTRAINT "simulation_positions_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "simulation_portfolios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "simulation_positions" ADD CONSTRAINT "simulation_positions_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "simulation_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Order -> Session, User & Asset
ALTER TABLE "simulation_orders" ADD CONSTRAINT "simulation_orders_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "simulation_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "simulation_orders" ADD CONSTRAINT "simulation_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "simulation_orders" ADD CONSTRAINT "simulation_orders_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "simulation_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "simulation_orders" ADD CONSTRAINT "simulation_orders_session_id_user_id_fkey" FOREIGN KEY ("session_id", "user_id") REFERENCES "simulation_sessions"("id", "user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Trade -> Order, Session & Asset
ALTER TABLE "simulation_trades" ADD CONSTRAINT "simulation_trades_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "simulation_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "simulation_trades" ADD CONSTRAINT "simulation_trades_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "simulation_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "simulation_trades" ADD CONSTRAINT "simulation_trades_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "simulation_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "simulation_trades" ADD CONSTRAINT "simulation_trades_order_id_session_id_asset_id_fkey" FOREIGN KEY ("order_id", "session_id", "asset_id") REFERENCES "simulation_orders"("id", "session_id", "asset_id") ON DELETE RESTRICT ON UPDATE CASCADE;
