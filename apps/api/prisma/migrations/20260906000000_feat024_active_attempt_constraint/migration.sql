-- Preflight duplicate detection: fail safely if invalid duplicate data exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "academy_quiz_attempts"
    WHERE "status" = 'IN_PROGRESS'
    GROUP BY "quiz_id", "user_id"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Preflight check failed: duplicate IN_PROGRESS attempts found for same quiz_id and user_id';
  END IF;
END $$;

-- Add partial unique index for active IN_PROGRESS attempts
CREATE UNIQUE INDEX "academy_quiz_attempts_quiz_id_user_id_active_key"
ON "academy_quiz_attempts"("quiz_id", "user_id")
WHERE "status" = 'IN_PROGRESS';
