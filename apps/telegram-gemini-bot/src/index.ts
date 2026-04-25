import { createServer } from "node:http";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { setTelegramWebhook } from "./services/telegram.js";
import { logger } from "./utils/logger.js";

const app = createApp();
const server = createServer(app);

server.listen(env.PORT, () => {
  logger.info("Telegram Gemini bot listening", {
    port: env.PORT,
    nodeEnv: env.NODE_ENV
  });
});

setTelegramWebhook().catch((error) => {
  logger.error("Telegram webhook registration failed", {
    error
  });
});

function shutdown(signal: NodeJS.Signals): void {
  logger.info("Received shutdown signal", {
    signal
  });

  server.close((error) => {
    if (error) {
      logger.error("HTTP server shutdown failed", {
        error
      });
      process.exit(1);
    }

    logger.info("HTTP server stopped");
    process.exit(0);
  });

  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", {
    reason
  });
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", {
    error
  });
  process.exit(1);
});
