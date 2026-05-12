import type { RequestHandler } from "express";
import * as catalogService from "./catalog.service.js";
import { buildMeta, parsePagination } from "../../utils/pagination.js";
import { createAuditLog } from "../audit/audit.service.js";

export const listBreeds: RequestHandler = async (req, res, next) => {
  try {
    const { page, limit } = parsePagination(req.query);
    const { breeds, total } = await catalogService.listBreedPage({
      page,
      limit,
      search: typeof req.query.search === "string" ? req.query.search : undefined
    });
    res.json({ breeds, meta: buildMeta(total, page, limit) });
  } catch (error) {
    next(error);
  }
};

export const listTrainingGoals: RequestHandler = async (req, res, next) => {
  try {
    const { page, limit } = parsePagination(req.query);
    const { trainingGoals, total } = await catalogService.listTrainingGoalPage({
      page,
      limit,
      search: typeof req.query.search === "string" ? req.query.search : undefined
    });
    res.json({ trainingGoals, meta: buildMeta(total, page, limit) });
  } catch (error) {
    next(error);
  }
};

export const createBreed: RequestHandler = async (req, res, next) => {
  try {
    const breed = await catalogService.createBreed(req.body);
    await createAuditLog({
      actorType: "ADMIN",
      actorId: req.admin?.id,
      actorEmail: req.admin?.email,
      action: "BREED_CREATE",
      targetType: "BREED",
      targetId: breed.id
    });
    res.status(201).json({ breed });
  } catch (error) {
    next(error);
  }
};

export const deleteBreed: RequestHandler = async (req, res, next) => {
  try {
    await catalogService.deleteBreed(req.params.id);
    await createAuditLog({
      actorType: "ADMIN",
      actorId: req.admin?.id,
      actorEmail: req.admin?.email,
      action: "BREED_DELETE",
      targetType: "BREED",
      targetId: req.params.id
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const createTrainingGoal: RequestHandler = async (req, res, next) => {
  try {
    const trainingGoal = await catalogService.createTrainingGoal(req.body);
    await createAuditLog({
      actorType: "ADMIN",
      actorId: req.admin?.id,
      actorEmail: req.admin?.email,
      action: "TRAINING_GOAL_CREATE",
      targetType: "TRAINING_GOAL",
      targetId: trainingGoal.id
    });
    res.status(201).json({ trainingGoal });
  } catch (error) {
    next(error);
  }
};

export const deleteTrainingGoal: RequestHandler = async (req, res, next) => {
  try {
    await catalogService.deleteTrainingGoal(req.params.id);
    await createAuditLog({
      actorType: "ADMIN",
      actorId: req.admin?.id,
      actorEmail: req.admin?.email,
      action: "TRAINING_GOAL_DELETE",
      targetType: "TRAINING_GOAL",
      targetId: req.params.id
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
