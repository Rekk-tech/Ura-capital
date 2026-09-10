-- Migration: 20260909000000_feat025_grading_state_constraint_fix
-- Purpose: Corrective migration replacing incomplete grading-state CHECK constraint
-- with strict lifecycle matrix enforcement for CREATED, IN_PROGRESS, SUBMITTED, and GRADED states.

-- Step 1: Preflight safety check
-- Detect any existing rows violating the canonical grading lifecycle matrix.
-- If violating data exists, fail immediately without dropping or altering constraints.
DO $$
BEGIN
  -- 1. Check CREATED and IN_PROGRESS states:
  -- score, passed, submitted_at, and graded_at must all be NULL.
  IF EXISTS (
    SELECT 1 FROM "academy_quiz_attempts"
    WHERE "status" IN ('CREATED', 'IN_PROGRESS')
      AND ("score" IS NOT NULL OR "passed" IS NOT NULL OR "submitted_at" IS NOT NULL OR "graded_at" IS NOT NULL)
  ) THEN
    RAISE EXCEPTION 'Preflight check failed: CREATED or IN_PROGRESS attempts found with non-NULL score, passed, submitted_at, or graded_at';
  END IF;

  -- 2. Check SUBMITTED state:
  -- submitted_at must be NOT NULL, while score, passed, and graded_at must be NULL.
  IF EXISTS (
    SELECT 1 FROM "academy_quiz_attempts"
    WHERE "status" = 'SUBMITTED'
      AND ("submitted_at" IS NULL OR "score" IS NOT NULL OR "passed" IS NOT NULL OR "graded_at" IS NOT NULL)
  ) THEN
    RAISE EXCEPTION 'Preflight check failed: SUBMITTED attempts found with NULL submitted_at or non-NULL score, passed, or graded_at';
  END IF;

  -- 3. Check GRADED state:
  -- score, passed, submitted_at, and graded_at must all be NOT NULL.
  IF EXISTS (
    SELECT 1 FROM "academy_quiz_attempts"
    WHERE "status" = 'GRADED'
      AND ("score" IS NULL OR "passed" IS NULL OR "submitted_at" IS NULL OR "graded_at" IS NULL)
  ) THEN
    RAISE EXCEPTION 'Preflight check failed: GRADED attempts found with NULL score, passed, submitted_at, or graded_at';
  END IF;

  -- 4. Check for invalid/unknown status values:
  IF EXISTS (
    SELECT 1 FROM "academy_quiz_attempts"
    WHERE "status" NOT IN ('CREATED', 'IN_PROGRESS', 'SUBMITTED', 'GRADED')
  ) THEN
    RAISE EXCEPTION 'Preflight check failed: attempts found with unknown status';
  END IF;
END $$;

-- Step 2: Drop the existing incomplete grading-state constraint
ALTER TABLE "academy_quiz_attempts"
  DROP CONSTRAINT IF EXISTS "academy_quiz_attempts_graded_state_check";

-- Step 3: Add the canonical lifecycle-state CHECK constraint
ALTER TABLE "academy_quiz_attempts"
  ADD CONSTRAINT "academy_quiz_attempts_graded_state_check"
  CHECK (
    ("status" IN ('CREATED', 'IN_PROGRESS') AND "score" IS NULL AND "passed" IS NULL AND "submitted_at" IS NULL AND "graded_at" IS NULL)
    OR
    ("status" = 'SUBMITTED' AND "submitted_at" IS NOT NULL AND "score" IS NULL AND "passed" IS NULL AND "graded_at" IS NULL)
    OR
    ("status" = 'GRADED' AND "submitted_at" IS NOT NULL AND "graded_at" IS NOT NULL AND "score" IS NOT NULL AND "passed" IS NOT NULL)
  );
