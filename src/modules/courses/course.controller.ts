import type { RequestHandler } from "express";
import * as courseService from "./course.service.js";
import { buildMeta, parsePagination } from "../../utils/pagination.js";
import { createAuditLog } from "../audit/audit.service.js";

export const createCourse: RequestHandler = async (req, res, next) => {
  try {
    const course = await courseService.createCourse(req.body, req.admin);
    await createAuditLog({
      actorType: "ADMIN",
      actorId: req.admin?.id,
      actorEmail: req.admin?.email,
      action: "COURSE_CREATE",
      targetType: "COURSE",
      targetId: course.id
    });
    res.status(201).json({ course });
  } catch (error) {
    next(error);
  }
};

export const addLecture: RequestHandler = async (req, res, next) => {
  try {
    const lecture = await courseService.addLecture(req.params.courseId, req.body, req.admin);
    res.status(201).json({ lecture });
  } catch (error) {
    next(error);
  }
};

export const updateCourse: RequestHandler = async (req, res, next) => {
  try {
    const course = await courseService.updateCourse(req.params.courseId, req.body, req.admin);
    await createAuditLog({
      actorType: "ADMIN",
      actorId: req.admin?.id,
      actorEmail: req.admin?.email,
      action: "COURSE_UPDATE",
      targetType: "COURSE",
      targetId: course.id
    });
    res.json({ course });
  } catch (error) {
    next(error);
  }
};

export const publishCourse: RequestHandler = async (req, res, next) => {
  try {
    const course = await courseService.setCoursePublishStatus(req.params.courseId, true);
    await createAuditLog({
      actorType: "ADMIN",
      actorId: req.admin?.id,
      actorEmail: req.admin?.email,
      action: "COURSE_ONLINE",
      targetType: "COURSE",
      targetId: course.id
    });
    res.json({ course });
  } catch (error) {
    next(error);
  }
};

export const submitCourseForReview: RequestHandler = async (req, res, next) => {
  try {
    const course = await courseService.submitCourseForReview(req.params.courseId, req.admin);
    await createAuditLog({
      actorType: "ADMIN",
      actorId: req.admin?.id,
      actorEmail: req.admin?.email,
      action: "COURSE_SUBMIT_REVIEW",
      targetType: "COURSE",
      targetId: course.id
    });
    res.json({ course });
  } catch (error) {
    next(error);
  }
};

export const approveCourse: RequestHandler = async (req, res, next) => {
  try {
    const course = await courseService.approveCourse(req.params.courseId, req.admin!.id);
    await createAuditLog({
      actorType: "ADMIN",
      actorId: req.admin?.id,
      actorEmail: req.admin?.email,
      action: "COURSE_APPROVE",
      targetType: "COURSE",
      targetId: course.id
    });
    res.json({ course });
  } catch (error) {
    next(error);
  }
};

export const freezeCourse: RequestHandler = async (req, res, next) => {
  try {
    const course = await courseService.setCourseFrozenStatus(
      req.params.courseId,
      true,
      req.admin!.id,
      req.body.reason
    );
    await createAuditLog({
      actorType: "ADMIN",
      actorId: req.admin?.id,
      actorEmail: req.admin?.email,
      action: "COURSE_FREEZE",
      targetType: "COURSE",
      targetId: course.id,
      metadata: { reason: req.body.reason }
    });
    res.json({ course });
  } catch (error) {
    next(error);
  }
};

export const unfreezeCourse: RequestHandler = async (req, res, next) => {
  try {
    const course = await courseService.setCourseFrozenStatus(req.params.courseId, false, req.admin!.id);
    await createAuditLog({
      actorType: "ADMIN",
      actorId: req.admin?.id,
      actorEmail: req.admin?.email,
      action: "COURSE_UNFREEZE",
      targetType: "COURSE",
      targetId: course.id
    });
    res.json({ course });
  } catch (error) {
    next(error);
  }
};

export const rejectCourse: RequestHandler = async (req, res, next) => {
  try {
    const course = await courseService.rejectCourse(req.params.courseId, req.admin!.id, req.body.reason);
    await createAuditLog({
      actorType: "ADMIN",
      actorId: req.admin?.id,
      actorEmail: req.admin?.email,
      action: "COURSE_REJECT",
      targetType: "COURSE",
      targetId: course.id,
      metadata: { reason: req.body.reason }
    });
    res.json({ course });
  } catch (error) {
    next(error);
  }
};

export const unpublishCourse: RequestHandler = async (req, res, next) => {
  try {
    const course = await courseService.setCoursePublishStatus(req.params.courseId, false);
    await createAuditLog({
      actorType: "ADMIN",
      actorId: req.admin?.id,
      actorEmail: req.admin?.email,
      action: "COURSE_OFFLINE",
      targetType: "COURSE",
      targetId: course.id
    });
    res.json({ course });
  } catch (error) {
    next(error);
  }
};

export const deleteCourse: RequestHandler = async (req, res, next) => {
  try {
    await courseService.deleteCourse(req.params.courseId, req.admin);
    await createAuditLog({
      actorType: "ADMIN",
      actorId: req.admin?.id,
      actorEmail: req.admin?.email,
      action: "COURSE_DELETE",
      targetType: "COURSE",
      targetId: req.params.courseId
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const updateLecture: RequestHandler = async (req, res, next) => {
  try {
    const lecture = await courseService.updateLecture(req.params.lectureId, req.body, req.admin);
    res.json({ lecture });
  } catch (error) {
    next(error);
  }
};

export const deleteLecture: RequestHandler = async (req, res, next) => {
  try {
    await courseService.deleteLecture(req.params.lectureId, req.admin);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const addStep: RequestHandler = async (req, res, next) => {
  try {
    const step = await courseService.addStep(req.params.lectureId, req.body, req.admin);
    res.status(201).json({ step });
  } catch (error) {
    next(error);
  }
};

export const updateStep: RequestHandler = async (req, res, next) => {
  try {
    const step = await courseService.updateStep(req.params.stepId, req.body, req.admin);
    res.json({ step });
  } catch (error) {
    next(error);
  }
};

export const deleteStep: RequestHandler = async (req, res, next) => {
  try {
    await courseService.deleteStep(req.params.stepId, req.admin);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const createDailyTask: RequestHandler = async (req, res, next) => {
  try {
    const task = await courseService.createDailyTask(req.params.courseId, req.body, req.admin);
    res.status(201).json({ task });
  } catch (error) {
    next(error);
  }
};

export const updateDailyTask: RequestHandler = async (req, res, next) => {
  try {
    const task = await courseService.updateDailyTask(req.params.taskId, req.body, req.admin);
    res.json({ task });
  } catch (error) {
    next(error);
  }
};

export const deleteDailyTask: RequestHandler = async (req, res, next) => {
  try {
    await courseService.deleteDailyTask(req.params.taskId, req.admin);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const listCourses: RequestHandler = async (req, res, next) => {
  try {
    const { page, limit } = parsePagination(req.query);
    const { courses, total } = await courseService.listCourses({
      page,
      limit,
      search: typeof req.query.search === "string" ? req.query.search : undefined,
      category: typeof req.query.category === "string" ? req.query.category : undefined,
      level: typeof req.query.level === "string" ? req.query.level : undefined
    });
    res.json({ courses, meta: buildMeta(total, page, limit) });
  } catch (error) {
    next(error);
  }
};

export const listAdminCourses: RequestHandler = async (req, res, next) => {
  try {
    const { page, limit } = parsePagination(req.query);
    const result =
      res.req.admin?.role === "ADMIN"
        ? await courseService.listTrainerCourses(res.req.admin.id, {
            page,
            limit,
            search: typeof req.query.search === "string" ? req.query.search : undefined,
            status: typeof req.query.status === "string" ? req.query.status : undefined,
            level: typeof req.query.level === "string" ? req.query.level : undefined
          })
        : await courseService.listAdminCourses({
            page,
            limit,
            search: typeof req.query.search === "string" ? req.query.search : undefined,
            status: typeof req.query.status === "string" ? req.query.status : undefined,
            level: typeof req.query.level === "string" ? req.query.level : undefined
          });
    res.json({ courses: result.courses, meta: buildMeta(result.total, page, limit) });
  } catch (error) {
    next(error);
  }
};

export const listPendingApprovalCourses: RequestHandler = async (req, res, next) => {
  try {
    const { page, limit } = parsePagination(req.query);
    const { courses, total } = await courseService.listPendingApprovalCourses({
      page,
      limit,
      search: typeof req.query.search === "string" ? req.query.search : undefined
    });
    res.json({ courses, meta: buildMeta(total, page, limit) });
  } catch (error) {
    next(error);
  }
};

export const listMyCourses: RequestHandler = async (req, res, next) => {
  try {
    const { page, limit } = parsePagination(req.query);
    const { enrollments, total } = await courseService.listMyCourses(req.user!.id, { page, limit });
    res.json({ enrollments, meta: buildMeta(total, page, limit) });
  } catch (error) {
    next(error);
  }
};

export const getCourse: RequestHandler = async (req, res, next) => {
  try {
    const course = await courseService.getCourse(req.params.courseId);
    res.json({ course });
  } catch (error) {
    next(error);
  }
};

export const getAdminCourse: RequestHandler = async (req, res, next) => {
  try {
    const course =
      req.admin?.role === "ADMIN"
        ? await courseService.getTrainerCourse(req.params.courseId, req.admin.id)
        : await courseService.getAdminCourse(req.params.courseId);
    res.json({ course });
  } catch (error) {
    next(error);
  }
};

export const getCourseAnalytics: RequestHandler = async (req, res, next) => {
  try {
    const analytics =
      req.admin?.role === "ADMIN"
        ? await courseService.getTrainerCourseAnalytics(req.params.courseId, req.admin.id)
        : await courseService.getCourseAnalytics(req.params.courseId);
    res.json({ analytics });
  } catch (error) {
    next(error);
  }
};

export const joinCourse: RequestHandler = async (req, res, next) => {
  try {
    const enrollment = await courseService.joinCourse(req.user!.id, req.params.courseId);
    res.status(201).json({ enrollment });
  } catch (error) {
    next(error);
  }
};

export const reportCourse: RequestHandler = async (req, res, next) => {
  try {
    const report = await courseService.reportCourse(req.user!.id, req.params.courseId, req.body);
    res.status(201).json({ report });
  } catch (error) {
    next(error);
  }
};

export const listCourseReports: RequestHandler = async (_req, res, next) => {
  try {
    const { page, limit } = parsePagination(res.req.query);
    const { reports, total } = await courseService.listCourseReports({
      page,
      limit,
      search: typeof res.req.query.search === "string" ? res.req.query.search : undefined,
      status: typeof res.req.query.status === "string" ? res.req.query.status : undefined
    });
    res.json({ reports, meta: buildMeta(total, page, limit) });
  } catch (error) {
    next(error);
  }
};

export const resolveCourseReport: RequestHandler = async (req, res, next) => {
  try {
    const report = await courseService.resolveCourseReport(req.params.reportId, req.admin!.id, req.body);
    await createAuditLog({
      actorType: "ADMIN",
      actorId: req.admin?.id,
      actorEmail: req.admin?.email,
      action: "COURSE_REPORT_RESOLVE",
      targetType: "COURSE_REPORT",
      targetId: report.id
    });
    res.json({ report });
  } catch (error) {
    next(error);
  }
};

export const dismissCourseReport: RequestHandler = async (req, res, next) => {
  try {
    const report = await courseService.dismissCourseReport(req.params.reportId, req.admin!.id, req.body);
    await createAuditLog({
      actorType: "ADMIN",
      actorId: req.admin?.id,
      actorEmail: req.admin?.email,
      action: "COURSE_REPORT_DISMISS",
      targetType: "COURSE_REPORT",
      targetId: report.id
    });
    res.json({ report });
  } catch (error) {
    next(error);
  }
};

export const getMyCourseProgress: RequestHandler = async (req, res, next) => {
  try {
    const progress = await courseService.getMyCourseProgress(req.user!.id, req.params.courseId);
    res.json(progress);
  } catch (error) {
    next(error);
  }
};

export const getDailyTaskHistory: RequestHandler = async (req, res, next) => {
  try {
    const history = await courseService.getDailyTaskHistory(req.user!.id, req.params.courseId);
    res.json({ history });
  } catch (error) {
    next(error);
  }
};

export const getCourseResume: RequestHandler = async (req, res, next) => {
  try {
    const resume = await courseService.getCourseResume(req.user!.id, req.params.courseId);
    res.json(resume);
  } catch (error) {
    next(error);
  }
};

export const completeStep: RequestHandler = async (req, res, next) => {
  try {
    const enrollment = await courseService.completeStep(req.user!.id, req.params.stepId);
    res.json({ enrollment });
  } catch (error) {
    next(error);
  }
};

export const completeDailyTask: RequestHandler = async (req, res, next) => {
  try {
    const enrollment = await courseService.completeDailyTask(req.user!.id, req.params.taskId);
    res.json({ enrollment });
  } catch (error) {
    next(error);
  }
};
