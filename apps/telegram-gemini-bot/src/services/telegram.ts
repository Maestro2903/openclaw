import { env } from "../config/env.js";
import type { TelegramApiResponse } from "../types/telegram.js";
import { AppError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

const TELEGRAM_API_BASE = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}`;

async function callTelegram<T>(
  method: string,
  payload: Record<string, unknown>
): Promise<TelegramApiResponse<T>> {
  const response = await fetch(`${TELEGRAM_API_BASE}/${method}`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const body = (await response.json().catch(() => null)) as TelegramApiResponse<T> | null;

  if (!response.ok || !body?.ok) {
    logger.warn("Telegram API request failed", {
      method,
      status: response.status,
      errorCode: body?.error_code,
      description: body?.description
    });

    throw new AppError("Telegram API request failed", 502, "telegram_api_error");
  }

  return body;
}

export async function sendTelegramMessage(options: {
  chatId: number | string;
  text: string;
  replyToMessageId?: number;
}): Promise<void> {
  await callTelegram("sendMessage", {
    chat_id: options.chatId,
    text: options.text.slice(0, 4096),
    reply_to_message_id: options.replyToMessageId,
    disable_web_page_preview: true
  });
}

export async function setTelegramWebhook(): Promise<void> {
  const webhookUrl = `${env.BASE_URL.replace(/\/$/, "")}/webhook/telegram`;

  await callTelegram("setWebhook", {
    url: webhookUrl,
    secret_token: env.TELEGRAM_WEBHOOK_SECRET,
    allowed_updates: ["message", "edited_message"],
    drop_pending_updates: false
  });

  logger.info("Telegram webhook registered", {
    webhookUrl
  });
}

export async function notifyAdmin(text: string): Promise<void> {
  if (!env.ADMIN_CHAT_ID) {
    return;
  }

  try {
    await sendTelegramMessage({
      chatId: env.ADMIN_CHAT_ID,
      text
    });
  } catch (error) {
    logger.warn("Admin notification failed", {
      error
    });
  }
}
