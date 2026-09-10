import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { createRepositoryContainer } from "../../infrastructure/database/repository-factory.js";
import { AcademyCourseReadService } from "./academy-course-read.service.js";
import { AcademyQuizReadService } from "./academy-quiz-read.service.js";
import { AcademyCourseController } from "./academy-course.controller.js";
import { AcademyQuizAttemptService } from "./academy-quiz-attempt.service.js";
import { AcademyQuizAttemptController } from "./academy-quiz-attempt.controller.js";
import { transactionRunner } from "../../infrastructure/database/transaction-runner.js";

export function createAcademyRouter(
  controller?: AcademyCourseController,
  attemptController?: AcademyQuizAttemptController,
): Router {
  const router = Router();
  const repoContainer = createRepositoryContainer();
  const ctrl =
    controller ??
    new AcademyCourseController(
      new AcademyCourseReadService(repoContainer.academyCourseRepo),
      new AcademyQuizReadService(repoContainer.academyQuizRepo),
    );
  const attemptCtrl =
    attemptController ??
    new AcademyQuizAttemptController(
      new AcademyQuizAttemptService(repoContainer.academyQuizRepo, transactionRunner),
    );

  // 1. Course Catalog (Public)
  router.get("/api/academy/courses", (req, res, next) => ctrl.listCourses(req, res, next));
  router.get("/academy/courses", (req, res, next) => ctrl.listCourses(req, res, next));

  // 2. Course Detail (Public)
  router.get("/api/academy/courses/:slug", (req, res, next) => ctrl.getCourse(req, res, next));
  router.get("/academy/courses/:slug", (req, res, next) => ctrl.getCourse(req, res, next));

  // 3. Lesson Detail (Authenticated)
  router.get(
    "/api/academy/courses/:courseSlug/lessons/:lessonSlug",
    authenticate,
    (req, res, next) => ctrl.getLesson(req, res, next),
  );
  router.get(
    "/academy/courses/:courseSlug/lessons/:lessonSlug",
    authenticate,
    (req, res, next) => ctrl.getLesson(req, res, next),
  );

  // 4. Lesson Flashcards (Authenticated)
  router.get(
    "/api/academy/courses/:courseSlug/lessons/:lessonSlug/flashcards",
    authenticate,
    (req, res, next) => ctrl.getFlashcards(req, res, next),
  );
  router.get(
    "/academy/courses/:courseSlug/lessons/:lessonSlug/flashcards",
    authenticate,
    (req, res, next) => ctrl.getFlashcards(req, res, next),
  );

  // 5. Lesson Quiz Definition (Authenticated)
  router.get(
    "/api/academy/courses/:courseSlug/lessons/:lessonSlug/quiz",
    authenticate,
    (req, res, next) => ctrl.getLessonQuiz(req, res, next),
  );
  router.get(
    "/academy/courses/:courseSlug/lessons/:lessonSlug/quiz",
    authenticate,
    (req, res, next) => ctrl.getLessonQuiz(req, res, next),
  );

  // 6. Start Quiz Attempt (Authenticated)
  router.post(
    "/api/academy/courses/:courseSlug/lessons/:lessonSlug/quiz/attempts",
    authenticate,
    (req, res, next) => attemptCtrl.startAttempt(req, res, next),
  );
  router.post(
    "/academy/courses/:courseSlug/lessons/:lessonSlug/quiz/attempts",
    authenticate,
    (req, res, next) => attemptCtrl.startAttempt(req, res, next),
  );

  // 7. Get Current Active Attempt (Authenticated)
  router.get(
    "/api/academy/courses/:courseSlug/lessons/:lessonSlug/quiz/attempts/current",
    authenticate,
    (req, res, next) => attemptCtrl.getCurrentAttempt(req, res, next),
  );
  router.get(
    "/academy/courses/:courseSlug/lessons/:lessonSlug/quiz/attempts/current",
    authenticate,
    (req, res, next) => attemptCtrl.getCurrentAttempt(req, res, next),
  );

  // 8. Get Attempt By ID (Authenticated)
  router.get(
    "/api/academy/quiz-attempts/:attemptId",
    authenticate,
    (req, res, next) => attemptCtrl.getAttemptById(req, res, next),
  );
  router.get(
    "/academy/quiz-attempts/:attemptId",
    authenticate,
    (req, res, next) => attemptCtrl.getAttemptById(req, res, next),
  );

  // 9. Record Draft Answer (Authenticated)
  router.put(
    "/api/academy/quiz-attempts/:attemptId/answers/:questionId",
    authenticate,
    (req, res, next) => attemptCtrl.recordDraftAnswer(req, res, next),
  );
  router.put(
    "/academy/quiz-attempts/:attemptId/answers/:questionId",
    authenticate,
    (req, res, next) => attemptCtrl.recordDraftAnswer(req, res, next),
  );

  // 10. Submit Quiz Attempt (Authenticated)
  router.post(
    "/api/academy/quiz-attempts/:attemptId/submit",
    authenticate,
    (req, res, next) => attemptCtrl.submitAttempt(req, res, next),
  );
  router.post(
    "/academy/quiz-attempts/:attemptId/submit",
    authenticate,
    (req, res, next) => attemptCtrl.submitAttempt(req, res, next),
  );

  // 11. Get Graded Attempt Result (Authenticated)
  router.get(
    "/api/academy/quiz-attempts/:attemptId/result",
    authenticate,
    (req, res, next) => attemptCtrl.getGradedResult(req, res, next),
  );
  router.get(
    "/academy/quiz-attempts/:attemptId/result",
    authenticate,
    (req, res, next) => attemptCtrl.getGradedResult(req, res, next),
  );

  return router;
}

export const academyRouter = createAcademyRouter();


