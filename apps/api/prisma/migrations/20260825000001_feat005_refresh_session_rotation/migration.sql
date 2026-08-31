-- AlterTable
ALTER TABLE "refresh_sessions" ADD COLUMN "family_id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
ADD COLUMN "replaced_by_session_id" TEXT,
ADD COLUMN "rotated_at" TIMESTAMP(3),
ADD COLUMN "revocation_reason" TEXT,
ADD COLUMN "reused_at" TIMESTAMP(3);

-- Remove default on family_id
ALTER TABLE "refresh_sessions" ALTER COLUMN "family_id" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "refresh_sessions_replaced_by_session_id_key" ON "refresh_sessions"("replaced_by_session_id");

-- CreateIndex
CREATE INDEX "refresh_sessions_family_id_idx" ON "refresh_sessions"("family_id");

-- AddForeignKey
ALTER TABLE "refresh_sessions" ADD CONSTRAINT "refresh_sessions_replaced_by_session_id_fkey" FOREIGN KEY ("replaced_by_session_id") REFERENCES "refresh_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
