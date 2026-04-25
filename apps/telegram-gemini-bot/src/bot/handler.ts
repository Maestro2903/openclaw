import type { TelegramMessage, TelegramUpdate } from "../types/telegram.js";
import { logger } from "../utils/logger.js";
import { commandResponse, isResetCommand } from "./commands.js";
import { generateResponse } from "../services/gemini.js";
import {
  appendSessionMessages,
  clearSession,
  getSessionMessages
} from "../services/session-memory.js";
import { notifyAdmin, sendTelegramMessage } from "../services/telegram.js";
import { toErrorMessage } from "../utils/errors.js";

const MAX_INPUT_CHARS = 8_000;

function getMessage(update: TelegramUpdate): TelegramMessage | undefined {
  return update.message ?? update.edited_message;
}

function sanitizePrompt(text: string): string {
  return text.replace(/\u0000/g, "").trim().slice(0, MAX_INPUT_CHARS);
}

export async function handleTelegramUpdate(update: TelegramUpdate): Promise<void> {
  const message = getMessage(update);

  if (!message) {
    logger.debug("Ignoring Telegram update without message", {
      updateId: update.update_id
    });
    return;
  }

  const text = message.text;
  if (!text) {
    await sendTelegramMessage({
      chatId: message.chat.id,
      text: "Please send a text message.",
      replyToMessageId: message.message_id
    });
    return;
  }

  const prompt = sanitizePrompt(text);
  const userId = message.from?.id ?? message.chat.id;
  const commandText = commandResponse(prompt);

  if (commandText) {
    if (isResetCommand(prompt)) {
      clearSession(userId);
    }

    await sendTelegramMessage({
      chatId: message.chat.id,
      text: commandText,
      replyToMessageId: message.message_id
    });
    return;
  }

  logger.info("Processing Telegram message", {
    updateId: update.update_id,
    chatId: message.chat.id,
    userId,
    textLength: prompt.length
  });

  try {
    const history = getSessionMessages(userId);
    const responseText = await generateResponse(prompt, history);

    appendSessionMessages(userId, [
      {
        role: "user",
        text: prompt
      },
      {
        role: "model",
        text: responseText
      }
    ]);

    await sendTelegramMessage({
      chatId: message.chat.id,
      text: responseText,
      replyToMessageId: message.message_id
    });
  } catch (error) {
    logger.error("Telegram message processing failed", {
      updateId: update.update_id,
      chatId: message.chat.id,
      userId,
      error
    });

    await sendTelegramMessage({
      chatId: message.chat.id,
      text: "Sorry, I could not process that message. Please try again.",
      replyToMessageId: message.message_id
    });

    await notifyAdmin(
      `Telegram Gemini bot error for chat ${message.chat.id}: ${toErrorMessage(error)}`
    );
  }
}
