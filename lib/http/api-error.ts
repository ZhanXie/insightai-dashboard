// Unified error class for API responses
// Safe to serialize - never exposes stack traces or internal details

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
  }

  // Get a safe message for client consumption
  safeMessage(): string {
    return this.message;
  }
}