-- CreateTable
CREATE TABLE "academy_courses" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "level" TEXT NOT NULL DEFAULT 'BEGINNER',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academy_courses_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "academy_courses_status_check" CHECK ("status" IN ('DRAFT', 'PUBLISHED', 'ARCHIVED'))
);

-- CreateTable
CREATE TABLE "academy_lessons" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT,
    "order" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academy_lessons_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "academy_lessons_status_check" CHECK ("status" IN ('DRAFT', 'PUBLISHED', 'ARCHIVED'))
);

-- CreateTable
CREATE TABLE "academy_flashcards" (
    "id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "front" TEXT NOT NULL,
    "back" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academy_flashcards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_quizzes" (
    "id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "order" INTEGER NOT NULL DEFAULT 0,
    "passing_score" INTEGER NOT NULL DEFAULT 80,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academy_quizzes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "academy_quizzes_status_check" CHECK ("status" IN ('DRAFT', 'PUBLISHED', 'ARCHIVED'))
);

-- CreateTable
CREATE TABLE "academy_quiz_questions" (
    "id" TEXT NOT NULL,
    "quiz_id" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "explanation" TEXT,
    "type" TEXT NOT NULL DEFAULT 'SINGLE_CHOICE',
    "order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academy_quiz_questions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "academy_quiz_questions_type_check" CHECK ("type" IN ('SINGLE_CHOICE'))
);

-- CreateTable
CREATE TABLE "academy_quiz_options" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academy_quiz_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_quiz_attempts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "quiz_id" TEXT NOT NULL,
    "attempt_number" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "score" INTEGER,
    "passed" BOOLEAN,
    "quiz_title_snapshot" TEXT NOT NULL,
    "quiz_version_snapshot" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_at" TIMESTAMP(3),
    "graded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academy_quiz_attempts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "academy_quiz_attempts_status_check" CHECK ("status" IN ('CREATED', 'IN_PROGRESS', 'SUBMITTED', 'GRADED')),
    CONSTRAINT "academy_quiz_attempts_attempt_number_check" CHECK ("attempt_number" >= 1)
);

-- CreateTable
CREATE TABLE "academy_quiz_answers" (
    "id" TEXT NOT NULL,
    "attempt_id" TEXT NOT NULL,
    "quiz_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "selected_option_id" TEXT,
    "is_correct" BOOLEAN,
    "question_prompt_snapshot" TEXT NOT NULL,
    "selected_option_text_snapshot" TEXT,
    "correct_option_id_snapshot" TEXT,
    "correct_option_text_snapshot" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academy_quiz_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_user_course_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academy_user_course_progress_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "academy_user_course_progress_status_check" CHECK ("status" IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED')),
    CONSTRAINT "academy_user_course_progress_completed_at_check" CHECK (("status" = 'COMPLETED' AND "completed_at" IS NOT NULL) OR ("status" <> 'COMPLETED' AND "completed_at" IS NULL))
);

-- CreateTable
CREATE TABLE "academy_user_lesson_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academy_user_lesson_progress_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "academy_user_lesson_progress_status_check" CHECK ("status" IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED')),
    CONSTRAINT "academy_user_lesson_progress_completed_at_check" CHECK (("status" = 'COMPLETED' AND "completed_at" IS NOT NULL) OR ("status" <> 'COMPLETED' AND "completed_at" IS NULL))
);

-- CreateTable
CREATE TABLE "academy_user_xp" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "total_xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academy_user_xp_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "academy_user_xp_total_xp_non_negative" CHECK ("total_xp" >= 0)
);

-- CreateTable
CREATE TABLE "academy_reward_ledger" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "reward_type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "idempotency_key" TEXT,
    "status" TEXT NOT NULL DEFAULT 'APPLIED',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academy_reward_ledger_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "academy_reward_ledger_status_check" CHECK ("status" IN ('PENDING', 'APPLIED', 'REVERSED')),
    CONSTRAINT "academy_reward_ledger_source_type_check" CHECK ("source_type" IN ('COURSE_COMPLETION', 'LESSON_COMPLETION', 'QUIZ_PERFECT_SCORE', 'FLASHCARD_SESSION')),
    CONSTRAINT "academy_reward_ledger_reward_type_check" CHECK ("reward_type" IN ('XP'))
);

-- CreateIndex
CREATE UNIQUE INDEX "academy_courses_slug_key" ON "academy_courses"("slug");

-- CreateIndex
CREATE INDEX "academy_lessons_course_id_idx" ON "academy_lessons"("course_id");

-- CreateIndex
CREATE UNIQUE INDEX "academy_lessons_course_id_order_key" ON "academy_lessons"("course_id", "order");

-- CreateIndex
CREATE UNIQUE INDEX "academy_lessons_course_id_slug_key" ON "academy_lessons"("course_id", "slug");

-- CreateIndex
CREATE INDEX "academy_flashcards_lesson_id_idx" ON "academy_flashcards"("lesson_id");

-- CreateIndex
CREATE UNIQUE INDEX "academy_flashcards_lesson_id_order_key" ON "academy_flashcards"("lesson_id", "order");

-- CreateIndex
CREATE INDEX "academy_quizzes_lesson_id_idx" ON "academy_quizzes"("lesson_id");

-- CreateIndex
CREATE UNIQUE INDEX "academy_quizzes_lesson_id_order_key" ON "academy_quizzes"("lesson_id", "order");

-- CreateIndex
CREATE INDEX "academy_quiz_questions_quiz_id_idx" ON "academy_quiz_questions"("quiz_id");

-- CreateIndex
CREATE UNIQUE INDEX "academy_quiz_questions_quiz_id_order_key" ON "academy_quiz_questions"("quiz_id", "order");

-- CreateIndex: Composite unique key for same-quiz relational integrity on answers
CREATE UNIQUE INDEX "academy_quiz_questions_id_quiz_id_key" ON "academy_quiz_questions"("id", "quiz_id");

-- CreateIndex
CREATE INDEX "academy_quiz_options_question_id_idx" ON "academy_quiz_options"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "academy_quiz_options_question_id_order_key" ON "academy_quiz_options"("question_id", "order");

-- CreateIndex: Composite unique key for relational integrity on answers
CREATE UNIQUE INDEX "academy_quiz_options_id_question_id_key" ON "academy_quiz_options"("id", "question_id");

-- CreateIndex: PostgreSQL partial unique index ensuring at most one correct option per question
CREATE UNIQUE INDEX "academy_quiz_options_one_correct_per_question" ON "academy_quiz_options"("question_id") WHERE "is_correct" = true;

-- CreateIndex
CREATE INDEX "academy_quiz_attempts_user_id_idx" ON "academy_quiz_attempts"("user_id");

-- CreateIndex
CREATE INDEX "academy_quiz_attempts_quiz_id_idx" ON "academy_quiz_attempts"("quiz_id");

-- CreateIndex
CREATE INDEX "academy_quiz_attempts_status_idx" ON "academy_quiz_attempts"("status");

-- CreateIndex: Scoped attempt uniqueness per quiz, user, and attempt number
CREATE UNIQUE INDEX "academy_quiz_attempts_quiz_id_user_id_attempt_number_key" ON "academy_quiz_attempts"("quiz_id", "user_id", "attempt_number");

-- CreateIndex: Composite unique key for same-quiz relational integrity on answers
CREATE UNIQUE INDEX "academy_quiz_attempts_id_quiz_id_key" ON "academy_quiz_attempts"("id", "quiz_id");

-- CreateIndex
CREATE INDEX "academy_quiz_answers_attempt_id_idx" ON "academy_quiz_answers"("attempt_id");

-- CreateIndex
CREATE INDEX "academy_quiz_answers_question_id_idx" ON "academy_quiz_answers"("question_id");

-- CreateIndex
CREATE INDEX "academy_quiz_answers_quiz_id_idx" ON "academy_quiz_answers"("quiz_id");

-- CreateIndex
CREATE UNIQUE INDEX "academy_quiz_answers_attempt_id_question_id_key" ON "academy_quiz_answers"("attempt_id", "question_id");

-- CreateIndex
CREATE INDEX "academy_user_course_progress_user_id_idx" ON "academy_user_course_progress"("user_id");

-- CreateIndex
CREATE INDEX "academy_user_course_progress_course_id_idx" ON "academy_user_course_progress"("course_id");

-- CreateIndex
CREATE UNIQUE INDEX "academy_user_course_progress_user_id_course_id_key" ON "academy_user_course_progress"("user_id", "course_id");

-- CreateIndex
CREATE INDEX "academy_user_lesson_progress_user_id_idx" ON "academy_user_lesson_progress"("user_id");

-- CreateIndex
CREATE INDEX "academy_user_lesson_progress_lesson_id_idx" ON "academy_user_lesson_progress"("lesson_id");

-- CreateIndex
CREATE UNIQUE INDEX "academy_user_lesson_progress_user_id_lesson_id_key" ON "academy_user_lesson_progress"("user_id", "lesson_id");

-- CreateIndex
CREATE UNIQUE INDEX "academy_user_xp_user_id_key" ON "academy_user_xp"("user_id");

-- CreateIndex
CREATE INDEX "academy_reward_ledger_user_id_idx" ON "academy_reward_ledger"("user_id");

-- CreateIndex
CREATE INDEX "academy_reward_ledger_source_type_source_id_idx" ON "academy_reward_ledger"("source_type", "source_id");

-- CreateIndex
CREATE UNIQUE INDEX "academy_reward_ledger_user_id_source_type_source_id_reward_key" ON "academy_reward_ledger"("user_id", "source_type", "source_id", "reward_type");

-- CreateIndex
CREATE UNIQUE INDEX "academy_reward_ledger_idempotency_key_key" ON "academy_reward_ledger"("idempotency_key");

-- AddForeignKey
ALTER TABLE "academy_lessons" ADD CONSTRAINT "academy_lessons_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "academy_courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_flashcards" ADD CONSTRAINT "academy_flashcards_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "academy_lessons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_quizzes" ADD CONSTRAINT "academy_quizzes_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "academy_lessons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_quiz_questions" ADD CONSTRAINT "academy_quiz_questions_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "academy_quizzes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_quiz_options" ADD CONSTRAINT "academy_quiz_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "academy_quiz_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_quiz_attempts" ADD CONSTRAINT "academy_quiz_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_quiz_attempts" ADD CONSTRAINT "academy_quiz_attempts_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "academy_quizzes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: Composite foreign key binding attempt_id and quiz_id to ensure answer belongs to the attempt's quiz
ALTER TABLE "academy_quiz_answers" ADD CONSTRAINT "academy_quiz_answers_attempt_id_quiz_id_fkey" FOREIGN KEY ("attempt_id", "quiz_id") REFERENCES "academy_quiz_attempts"("id", "quiz_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: Composite foreign key binding question_id and quiz_id to ensure question belongs to the attempt's quiz
ALTER TABLE "academy_quiz_answers" ADD CONSTRAINT "academy_quiz_answers_question_id_quiz_id_fkey" FOREIGN KEY ("question_id", "quiz_id") REFERENCES "academy_quiz_questions"("id", "quiz_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: Composite foreign key binding selected_option_id and question_id to ensure selected option belongs to the question
ALTER TABLE "academy_quiz_answers" ADD CONSTRAINT "academy_quiz_answers_selected_option_id_question_id_fkey" FOREIGN KEY ("selected_option_id", "question_id") REFERENCES "academy_quiz_options"("id", "question_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_user_course_progress" ADD CONSTRAINT "academy_user_course_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_user_course_progress" ADD CONSTRAINT "academy_user_course_progress_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "academy_courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_user_lesson_progress" ADD CONSTRAINT "academy_user_lesson_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_user_lesson_progress" ADD CONSTRAINT "academy_user_lesson_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "academy_lessons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_user_xp" ADD CONSTRAINT "academy_user_xp_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_reward_ledger" ADD CONSTRAINT "academy_reward_ledger_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Triggers for DEF-001: Exactly ONE correct option enforcement on SINGLE_CHOICE questions
CREATE OR REPLACE FUNCTION check_academy_quiz_option_correctness()
RETURNS TRIGGER AS $$
DECLARE
  v_question_id TEXT;
  v_question_type TEXT;
  v_correct_count INTEGER;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_question_id := OLD.question_id;
  ELSE
    v_question_id := NEW.question_id;
  END IF;

  SELECT "type" INTO v_question_type
  FROM "academy_quiz_questions"
  WHERE "id" = v_question_id;

  IF NOT FOUND OR v_question_type IS NULL THEN
    RETURN NULL;
  END IF;

  IF v_question_type = 'SINGLE_CHOICE' THEN
    SELECT COUNT(*) INTO v_correct_count
    FROM "academy_quiz_options"
    WHERE "question_id" = v_question_id AND "is_correct" = true;

    IF v_correct_count <> 1 THEN
      RAISE EXCEPTION 'SINGLE_CHOICE question % must have exactly 1 correct option, but found %', v_question_id, v_correct_count
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER "trg_academy_quiz_options_exactly_one_correct"
AFTER INSERT OR UPDATE OR DELETE ON "academy_quiz_options"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION check_academy_quiz_option_correctness();

CREATE OR REPLACE FUNCTION check_academy_quiz_question_options()
RETURNS TRIGGER AS $$
DECLARE
  v_correct_count INTEGER;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "academy_quiz_questions" WHERE "id" = NEW."id") THEN
    RETURN NULL;
  END IF;

  IF NEW."type" = 'SINGLE_CHOICE' THEN
    SELECT COUNT(*) INTO v_correct_count
    FROM "academy_quiz_options"
    WHERE "question_id" = NEW."id" AND "is_correct" = true;

    IF v_correct_count <> 1 THEN
      RAISE EXCEPTION 'SINGLE_CHOICE question % must have exactly 1 correct option, but found %', NEW."id", v_correct_count
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER "trg_academy_quiz_questions_has_correct_option"
AFTER INSERT OR UPDATE ON "academy_quiz_questions"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION check_academy_quiz_question_options();
