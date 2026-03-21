import { Request, Response, NextFunction } from "express";

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
}

const store = new Map<string, RateLimitEntry>();

function getIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.socket.remoteAddress ?? "unknown";
}

export function rateLimit(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = getIp(req);
    const now = Date.now();
    const entry = store.get(ip);

    if (!entry || now - entry.firstAttempt > windowMs) {
      store.set(ip, { count: 1, firstAttempt: now });
      next();
      return;
    }

    if (entry.count >= maxRequests) {
      const retryAfter = Math.ceil((entry.firstAttempt + windowMs - now) / 1000);
      res.status(429).json({
        error: "Too many requests. Please try again later.",
        retryAfterSeconds: retryAfter,
      });
      return;
    }

    entry.count++;
    next();
  };
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.socket.remoteAddress ?? "unknown";
}
