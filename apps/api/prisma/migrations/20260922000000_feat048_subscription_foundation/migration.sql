-- CreateTable: user_subscriptions
CREATE TABLE "user_subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_key" TEXT NOT NULL DEFAULT 'FREE',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "provider_key" TEXT NOT NULL DEFAULT 'INTERNAL',
    "external_subscription_id" TEXT,
    "current_period_start" TIMESTAMP(3) NOT NULL,
    "current_period_end" TIMESTAMP(3) NOT NULL,
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "provider_sequence" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "user_subscriptions_status_check" CHECK ("status" IN ('ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED')),
    CONSTRAINT "user_subscriptions_plan_key_check" CHECK ("plan_key" IN ('FREE', 'PREMIUM')),
    CONSTRAINT "user_subscriptions_period_dates_check" CHECK ("current_period_end" >= "current_period_start")
);

-- CreateTable: subscription_provider_events
CREATE TABLE "subscription_provider_events" (
    "id" TEXT NOT NULL,
    "provider_key" TEXT NOT NULL,
    "provider_event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "outcome" TEXT NOT NULL DEFAULT 'RECEIVED',
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "payload_digest" TEXT,
    "metadata" JSONB,
    "subscription_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_provider_events_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "subscription_provider_events_outcome_check" CHECK ("outcome" IN ('RECEIVED', 'PROCESSED', 'DUPLICATE', 'IGNORED', 'FAILED'))
);

-- CreateTable: subscription_transition_records
CREATE TABLE "subscription_transition_records" (
    "id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "from_status" TEXT,
    "to_status" TEXT NOT NULL,
    "from_plan" TEXT,
    "to_plan" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "transaction_strategy" TEXT NOT NULL,
    "reason" TEXT,
    "provider_event_id" TEXT,
    "actor_id" TEXT,
    "subject_id" TEXT,
    "request_id" TEXT,
    "correlation_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_transition_records_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "subscription_transition_records_to_status_check" CHECK ("to_status" IN ('ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED')),
    CONSTRAINT "subscription_transition_records_from_status_check" CHECK ("from_status" IS NULL OR "from_status" IN ('ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED')),
    CONSTRAINT "subscription_transition_records_to_plan_check" CHECK ("to_plan" IN ('FREE', 'PREMIUM')),
    CONSTRAINT "subscription_transition_records_from_plan_check" CHECK ("from_plan" IS NULL OR "from_plan" IN ('FREE', 'PREMIUM')),
    CONSTRAINT "subscription_transition_records_source_check" CHECK ("source" IN ('USER_ACTION', 'PROVIDER_WEBHOOK', 'ADMIN_ACTION', 'SYSTEM_JOB', 'RECONCILIATION')),
    CONSTRAINT "subscription_transition_records_strategy_check" CHECK ("transaction_strategy" IN ('TRANSACTIONALLY_COUPLED', 'STATE_FIRST', 'BEST_EFFORT'))
);

-- Indexes & Unique Constraints

-- user_subscriptions indexes & partial unique constraints
CREATE UNIQUE INDEX "user_subscriptions_one_non_terminal" ON "user_subscriptions"("user_id") WHERE "status" IN ('ACTIVE', 'PAST_DUE');
CREATE UNIQUE INDEX "user_subscriptions_provider_external_id_uidx" ON "user_subscriptions"("provider_key", "external_subscription_id") WHERE "external_subscription_id" IS NOT NULL;
CREATE INDEX "user_subscriptions_user_id_idx" ON "user_subscriptions"("user_id");
CREATE INDEX "user_subscriptions_status_idx" ON "user_subscriptions"("status");
CREATE INDEX "user_subscriptions_provider_key_idx" ON "user_subscriptions"("provider_key");
CREATE INDEX "user_subscriptions_period_end_idx" ON "user_subscriptions"("current_period_end");

-- subscription_provider_events unique constraint & indexes
CREATE UNIQUE INDEX "subscription_provider_events_provider_event_uidx" ON "subscription_provider_events"("provider_key", "provider_event_id");
CREATE INDEX "subscription_provider_events_subscription_id_idx" ON "subscription_provider_events"("subscription_id");
CREATE INDEX "subscription_provider_events_occurred_at_idx" ON "subscription_provider_events"("occurred_at" DESC);
CREATE INDEX "subscription_provider_events_received_at_idx" ON "subscription_provider_events"("received_at" DESC);
CREATE INDEX "subscription_provider_events_outcome_idx" ON "subscription_provider_events"("outcome");

-- subscription_transition_records indexes
CREATE INDEX "subscription_transition_records_subscription_created_idx" ON "subscription_transition_records"("subscription_id", "created_at" ASC);
CREATE INDEX "subscription_transition_records_user_created_idx" ON "subscription_transition_records"("user_id", "created_at" ASC);
CREATE INDEX "subscription_transition_records_correlation_idx" ON "subscription_transition_records"("correlation_id");
CREATE INDEX "subscription_transition_records_provider_event_idx" ON "subscription_transition_records"("provider_event_id");

-- Foreign Keys

-- user_subscriptions -> users (ON DELETE RESTRICT)
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- subscription_provider_events -> user_subscriptions (ON DELETE SET NULL)
ALTER TABLE "subscription_provider_events" ADD CONSTRAINT "subscription_provider_events_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "user_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- subscription_transition_records -> user_subscriptions & users (ON DELETE RESTRICT)
ALTER TABLE "subscription_transition_records" ADD CONSTRAINT "subscription_transition_records_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "user_subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "subscription_transition_records" ADD CONSTRAINT "subscription_transition_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
