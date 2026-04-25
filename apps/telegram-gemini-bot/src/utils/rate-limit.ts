import type { Request, RequestHandler, Response } from "express";

type Bucket = {
  count: number;
  resetAt: number;
};

function getClientIp(req: Request): string {
  const forwardedFor = req.header("x-forwarded-for");
  const firstForwardedIp = forwardedFor?.split(",")[0]?.trim();
  return firstForwardedIp || req.ip || "unknown";
}

export function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
}): RequestHandler {
  const buckets = new Map<string, Bucket>();

  return (req: Request, res: Response, next) => {
    const now = Date.now();
    const key = getClientIp(req);
    const existing = buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      buckets.set(key, {
        count: 1,
        resetAt: now + options.windowMs
      });
      next();
      return;
    }

    existing.count += 1;
    if (existing.count > options.maxRequests) {
      res.status(429).json({
        ok: false,
        error: "rate_limited"
      });
      return;
    }

    next();
  };
}
