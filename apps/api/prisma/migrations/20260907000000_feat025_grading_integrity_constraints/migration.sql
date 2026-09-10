-- Preflight check: inspect historical rows and fail safely if violating data exists
DO $$
BEGIN
  -- 1. Score range preflight check
  IF EXISTS (
    SELECT 1 FROM "academy_quiz_attempts"
    WHERE "score" IS NOT NULL AND ("score" < 0 OR "score" > 100)
  ) THEN
    RAISE EXCEPTION 'Preflight check failed: academy_quiz_attempts found with score < 0 or score > 100';
  END IF;

  -- 2. CREATED and IN_PROGRESS state attributes preflight check:
  -- score, passed, submitted_at, and graded_at must all be NULL
  IF EXISTS (
    SELECT 1 FROM "academy_quiz_attempts"
    WHERE "status" IN ('CREATED', 'IN_PROGRESS')
      AND ("score" IS NOT NULL OR "passed" IS NOT NULL OR "submitted_at" IS NOT NULL OR "graded_at" IS NOT NULL)
  ) THEN
    RAISE EXCEPTION 'Preflight check failed: CREATED or IN_PROGRESS attempts found with non-NULL score, passed, submitted_at, or graded_at';
  END IF;

  -- 3. SUBMITTED state attributes preflight check:
  -- submitted_at must be NOT NULL, score, passed, and graded_at must be NULL
  IF EXISTS (
    SELECT 1 FROM "academy_quiz_attempts"
    WHERE "status" = 'SUBMITTED'
      AND ("submitted_at" IS NULL OR "score" IS NOT NULL OR "passed" IS NOT NULL OR "graded_at" IS NOT NULL)
  ) THEN
    RAISE EXCEPTION 'Preflight check failed: SUBMITTED attempts found with NULL submitted_at or non-NULL score, passed, or graded_at';
  END IF;

  -- 4. GRADED state attributes preflight check:
  -- score, passed, submitted_at, and graded_at must all be NOT NULL
  IF EXISTS (
    SELECT 1 FROM "academy_quiz_attempts"
    WHERE "status" = 'GRADED'
      AND ("score" IS NULL OR "passed" IS NULL OR "submitted_at" IS NULL OR "graded_at" IS NULL)
  ) THEN
    RAISE EXCEPTION 'Preflight check failed: GRADED attempts found with NULL score, passed, submitted_at, or graded_at';
  END IF;

  -- 5. Unexpected status preflight check
  IF EXISTS (
    SELECT 1 FROM "academy_quiz_attempts"
    WHERE "status" NOT IN ('CREATED', 'IN_PROGRESS', 'SUBMITTED', 'GRADED')
  ) THEN
    RAISE EXCEPTION 'Preflight check failed: attempts found with invalid status';
  END IF;
END $$;

-- 1. Score range check: score must be between 0 and 100 when present
ALTER TABLE "academy_quiz_attempts"
  ADD CONSTRAINT "academy_quiz_attempts_score_range_check"
  CHECK ("score" IS NULL OR ("score" >= 0 AND "score" <= 100));

-- 2. State attribute coherency check:
-- When CREATED or IN_PROGRESS: score, passed, submitted_at, graded_at MUST all be NULL
-- When SUBMITTED: submitted_at MUST be NOT NULL, score, passed, graded_at MUST be NULL
-- When GRADED: score, passed, submitted_at, graded_at MUST all be NOT NULL
ALTER TABLE "academy_quiz_attempts"
  ADD CONSTRAINT "academy_quiz_attempts_graded_state_check"
  CHECK (
    ("status" IN ('CREATED', 'IN_PROGRESS') AND "score" IS NULL AND "passed" IS NULL AND "submitted_at" IS NULL AND "graded_at" IS NULL)
    OR
    ("status" = 'SUBMITTED' AND "submitted_at" IS NOT NULL AND "score" IS NULL AND "passed" IS NULL AND "graded_at" IS NULL)
    OR
    ("status" = 'GRADED' AND "submitted_at" IS NOT NULL AND "graded_at" IS NOT NULL AND "score" IS NOT NULL AND "passed" IS NOT NULL)
  );
