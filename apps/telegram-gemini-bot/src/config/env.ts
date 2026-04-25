import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  TELEGRAM_WEBHOOK_SECRET: z.string().min(16),
  GEMINI_API_KEY: z.string().min(1),
  GEMINI_MODEL: z.string().min(1).default("gemini-2.5-flash"),
  PORT: z.coerce.number().int().positive().default(10000),
  BASE_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  ADMIN_CHAT_ID: z.string().optional(),
  REQUEST_BODY_LIMIT: z.string().default("128kb"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(30),
  GEMINI_TIMEOUT_MS: z.coerce.number().int().positive().default(20_000),
  GEMINI_MAX_RETRIES: z.coerce.number().int().min(0).max(5).default(2),
  SESSION_TTL_MS: z.coerce.number().int().positive().default(30 * 60_000),
  SESSION_MAX_MESSAGES: z.coerce.number().int().positive().default(8)
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const formatted = parsedEnv.error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message
  }));

  throw new Error(`Invalid environment configuration: ${JSON.stringify(formatted)}`);
}

export const env = parsedEnv.data;
