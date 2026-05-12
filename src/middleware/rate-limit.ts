import type { Request, RequestHandler } from "express";
import { ApiError } from "../utils/api-error.js";

type RateLimitOptions = {
  windowMs: number;
  max: number;
  message: string;
  keyPrefix: string;
  keyFn?: (req: Request) => string | null;
};

const buckets = new Map<string, { count: number; resetAt: number }>();

function getDefaultKey(req: Request) {
  return req.ip || req.headers["x-forwarded-for"]?.toString() || "unknown";
}

export function createRateLimit(options: RateLimitOptions): RequestHandler {
  return (req, _res, next) => {
    const identifier = options.keyFn?.(req) ?? getDefaultKey(req);
    const key = `${options.keyPrefix}:${identifier}`;
    const now = Date.now();
    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
      buckets.set(key, {
        count: 1,
        resetAt: now + options.windowMs
      });
      return next();
    }

    if (current.count >= options.max) {
      return next(new ApiError(429, options.message, { retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000) }));
    }

    current.count += 1;
    buckets.set(key, current);
    return next();
  };
}
