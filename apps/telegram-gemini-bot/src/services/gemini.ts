import { env } from "../config/env.js";
import type { SessionMessage } from "./session-memory.js";
import { AppError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { retryDelayMs, shouldRetryResponse, sleep } from "../utils/retry.js";

type GeminiPart = {
  text: string;
};

type GeminiContent = {
  role: "user" | "model";
  parts: GeminiPart[];
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[];
    };
    finishReason?: string;
  }>;
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
};

function toGeminiContent(messages: SessionMessage[], prompt: string): GeminiContent[] {
  return [
    ...messages.map((message): GeminiContent => ({
      role: message.role,
      parts: [{ text: message.text }]
    })),
    {
      role: "user",
      parts: [{ text: prompt }]
    }
  ];
}

function extractGeminiText(body: GeminiResponse): string {
  const text = body.candidates?.[0]?.content?.parts
    ?.map((part) => part.text)
    .filter(Boolean)
    .join("\n")
    .trim();

  if (!text) {
    throw new AppError("Gemini returned an empty response", 502, "empty_gemini_response");
  }

  return text;
}

export async function generateResponse(
  prompt: string,
  history: SessionMessage[] = []
): Promise<string> {
  const endpoint = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      env.GEMINI_MODEL
    )}:generateContent`
  );
  endpoint.searchParams.set("key", env.GEMINI_API_KEY);

  for (let attempt = 0; attempt <= env.GEMINI_MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.GEMINI_TIMEOUT_MS);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          contents: toGeminiContent(history, prompt),
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024
          }
        }),
        signal: controller.signal
      });

      const body = (await response.json().catch(() => null)) as GeminiResponse | null;

      if (response.ok && body) {
        return extractGeminiText(body);
      }

      logger.warn("Gemini request failed", {
        status: response.status,
        geminiStatus: body?.error?.status,
        attempt
      });

      if (shouldRetryResponse(response.status, attempt, env.GEMINI_MAX_RETRIES)) {
        await sleep(retryDelayMs(attempt));
        continue;
      }

      throw new AppError("Gemini API request failed", 502, "gemini_api_error");
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.warn("Gemini request error", {
        attempt,
        error
      });

      if (attempt < env.GEMINI_MAX_RETRIES) {
        await sleep(retryDelayMs(attempt));
        continue;
      }

      throw new AppError("Gemini request timed out or failed", 502, "gemini_request_failed");
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new AppError("Gemini retries exhausted", 502, "gemini_retries_exhausted");
}
