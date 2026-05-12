import type { RequestHandler } from "express";
import * as authService from "./auth.service.js";

export const requestOtp: RequestHandler = async (req, res, next) => {
  try {
    const result = await authService.requestOtp(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const resendOtp: RequestHandler = async (req, res, next) => {
  try {
    const result = await authService.resendOtp(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const verifyOtp: RequestHandler = async (req, res, next) => {
  try {
    const result = await authService.verifyOtp(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const me: RequestHandler = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user!.id);
    res.json({ user });
  } catch (error) {
    next(error);
  }
};
