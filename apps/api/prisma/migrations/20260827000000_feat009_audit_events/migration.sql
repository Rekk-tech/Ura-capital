-- AlterTable: non-destructively add FEAT-009 audit columns
ALTER TABLE "auth_security_audit_records" ADD COLUMN "outcome" TEXT NOT NULL DEFAULT 'SUCCESS';
ALTER TABLE "auth_security_audit_records" ADD COLUMN "actor_user_id" TEXT;
ALTER TABLE "auth_security_audit_records" ADD COLUMN "subject_user_id" TEXT;
ALTER TABLE "auth_security_audit_records" ADD COLUMN "session_id" TEXT;
ALTER TABLE "auth_security_audit_records" ADD COLUMN "identity_hash" TEXT;
ALTER TABLE "auth_security_audit_records" ADD COLUMN "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "auth_security_audit_records_actor_user_id_idx" ON "auth_security_audit_records"("actor_user_id");

-- CreateIndex
CREATE INDEX "auth_security_audit_records_subject_user_id_idx" ON "auth_security_audit_records"("subject_user_id");

-- CreateIndex
CREATE INDEX "auth_security_audit_records_request_id_idx" ON "auth_security_audit_records"("request_id");

-- CreateIndex
CREATE INDEX "auth_security_audit_records_occurred_at_idx" ON "auth_security_audit_records"("occurred_at");
