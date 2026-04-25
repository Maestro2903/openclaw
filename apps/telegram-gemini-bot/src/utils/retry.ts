import { isRetryableStatus } from "./errors.js";

export async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export function retryDelayMs(attempt: number): number {
  const base = 400 * 2 ** attempt;
  const jitter = Math.floor(Math.random() * 150);
  return base + jitter;
}

export function shouldRetryResponse(status: number, attempt: number, maxRetries: number): boolean {
  return attempt < maxRetries && isRetryableStatus(status);
}
