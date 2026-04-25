export class AppError extends Error {
  constructor(
    message: string,
    readonly statusCode = 500,
    readonly code = "internal_error"
  ) {
    super(message);
  }
}

export function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;
}

export function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
