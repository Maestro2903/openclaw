import express, { type ErrorRequestHandler, type Request, type Response } from "express";
import { env } from "./config/env.js";
import { createTelegramRouter } from "./routes/telegram.js";
import { createRateLimiter } from "./utils/rate-limit.js";
import { logger } from "./utils/logger.js";

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  logger.error("Unhandled HTTP request error", {
    error
  });

  if (res.headersSent) {
    return;
  }

  res.status(500).json({
    ok: false,
    error: "internal_error"
  });
};

export function createApp(): express.Express {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(
    express.json({
      limit: env.REQUEST_BODY_LIMIT,
      type: "application/json"
    })
  );

  app.use(
    createRateLimiter({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      maxRequests: env.RATE_LIMIT_MAX_REQUESTS
    })
  );

  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({
      ok: true,
      service: "telegram-gemini-bot"
    });
  });

  app.use("/webhook", createTelegramRouter());

  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      ok: false,
      error: "not_found"
    });
  });

  app.use(errorHandler);

  return app;
}
