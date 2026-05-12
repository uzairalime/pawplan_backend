import type { RequestHandler } from "express";
import * as profileService from "./profile.service.js";

export const getProfile: RequestHandler = async (req, res, next) => {
  try {
    const user = await profileService.getProfile(req.user!.id);
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

export const updateProfile: RequestHandler = async (req, res, next) => {
  try {
    const user = await profileService.updateProfile(req.user!.id, req.body);
    res.json({ user });
  } catch (error) {
    next(error);
  }
};
