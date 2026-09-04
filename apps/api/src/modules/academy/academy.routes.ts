import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { createRepositoryContainer } from "../../infrastructure/database/repository-factory.js";
import { AcademyCourseReadService } from "./academy-course-read.service.js";
import { AcademyCourseController } from "./academy-course.controller.js";

export function createAcademyRouter(controller?: AcademyCourseController): Router {
  const router = Router();
  const ctrl =
    controller ??
    new AcademyCourseController(
      new AcademyCourseReadService(createRepositoryContainer().academyCourseRepo),
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

  return router;
}

export const academyRouter = createAcademyRouter();
