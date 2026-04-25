import { timingSafeEqual } from "node:crypto";
import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { handleTelegramUpdate } from "../bot/handler.js";
import type { TelegramUpdate } from "../types/telegram.js";
import { logger } from "../utils/logger.js";

const telegramUpdateSchema = z.object({
  update_id: z.number(),
  message: z.unknown().optional(),
  edited_message: z.unknown().optional()
});

function isValidWebhookSecret(req: Request): boolean {
  const received = req.header("x-telegram-bot-api-secret-token");

  if (!received) {
    return false;
  }

  const expectedBuffer = Buffer.from(env.TELEGRAM_WEBHOOK_SECRET);
  const receivedBuffer = Buffer.from(received);

  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

export function createTelegramRouter(): Router {
  const router = createRouter();

  router.post("/telegram", async (req: Request, res: Response) => {
    if (!isValidWebhookSecret(req)) {
      logger.warn("Rejected Telegram webhook with invalid secret", {
        ip: req.ip
      });
      res.status(401).json({
        ok: false,
        error: "unauthorized"
      });
      return;
    }

    const parsed = telegramUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      logger.warn("Rejected invalid Telegram update", {
        issues: parsed.error.issues
      });
      res.status(400).json({
        ok: false,
        error: "invalid_update"
      });
      return;
    }

    res.status(200).json({
      ok: true
    });

    try {
      await handleTelegramUpdate(req.body as TelegramUpdate);
    } catch (error) {
      logger.error("Unhandled Telegram webhook processing error", {
        error
      });
    }
  });

  return router;
}
