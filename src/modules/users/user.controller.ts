import type { RequestHandler } from "express";
import * as userService from "./user.service.js";
import { buildMeta, parsePagination } from "../../utils/pagination.js";
import { createAuditLog } from "../audit/audit.service.js";

export const listUsers: RequestHandler = async (req, res, next) => {
  try {
    const { page, limit } = parsePagination(req.query);
    const { users, total } = await userService.listUserPage({
      page,
      limit,
      search: typeof req.query.search === "string" ? req.query.search : undefined,
      status: typeof req.query.status === "string" ? req.query.status : undefined
    });
    res.json({ users, meta: buildMeta(total, page, limit) });
  } catch (error) {
    next(error);
  }
};

export const getUserDetail: RequestHandler = async (req, res, next) => {
  try {
    const user = await userService.getUserDetail(req.params.userId);
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

export const updateUser: RequestHandler = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.userId, req.body);
    await createAuditLog({
      actorType: "ADMIN",
      actorId: req.admin?.id,
      actorEmail: req.admin?.email,
      action: "USER_UPDATE",
      targetType: "USER",
      targetId: user.id
    });
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

export const freezeUser: RequestHandler = async (req, res, next) => {
  try {
    const user = await userService.freezeUser(req.params.userId, req.body.reason);
    await createAuditLog({
      actorType: "ADMIN",
      actorId: req.admin?.id,
      actorEmail: req.admin?.email,
      action: "USER_FREEZE",
      targetType: "USER",
      targetId: user.id,
      metadata: { reason: req.body.reason }
    });
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

export const unfreezeUser: RequestHandler = async (req, res, next) => {
  try {
    const user = await userService.unfreezeUser(req.params.userId);
    await createAuditLog({
      actorType: "ADMIN",
      actorId: req.admin?.id,
      actorEmail: req.admin?.email,
      action: "USER_UNFREEZE",
      targetType: "USER",
      targetId: user.id
    });
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

export const blockUser: RequestHandler = async (req, res, next) => {
  try {
    const user = await userService.blockUser(req.params.userId, req.body.reason);
    await createAuditLog({
      actorType: "ADMIN",
      actorId: req.admin?.id,
      actorEmail: req.admin?.email,
      action: "USER_BLOCK",
      targetType: "USER",
      targetId: user.id,
      metadata: { reason: req.body.reason }
    });
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

export const unblockUser: RequestHandler = async (req, res, next) => {
  try {
    const user = await userService.unblockUser(req.params.userId);
    await createAuditLog({
      actorType: "ADMIN",
      actorId: req.admin?.id,
      actorEmail: req.admin?.email,
      action: "USER_UNBLOCK",
      targetType: "USER",
      targetId: user.id
    });
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

export const deleteUser: RequestHandler = async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.userId);
    await createAuditLog({
      actorType: "ADMIN",
      actorId: req.admin?.id,
      actorEmail: req.admin?.email,
      action: "USER_DELETE",
      targetType: "USER",
      targetId: req.params.userId
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
