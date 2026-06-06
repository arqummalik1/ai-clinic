import { ERROR_MESSAGES } from "@/lib/constants";

export interface AppError {
  message: string;
  code?: string;
  originalError?: unknown;
}

export function handleException(error: unknown): AppError {
  console.error("[Centralized Error Handler] Caught exception:", error);

  if (error && typeof error === "object") {
    // If it's already an AppError
    if ("message" in error && !("originalError" in error)) {
      const err = error as { message: string; code?: string };
      return {
        message: err.message,
        code: err.code,
        originalError: error,
      };
    }

    // Handle Supabase/Postgrest Error shapes
    const obj = error as Record<string, unknown>;
    if (typeof obj.message === "string") {
      // Customize specific database error codes
      let msg = obj.message;
      if (obj.code === "23505") { // unique violation
        msg = "Record already exists with this unique identifier";
      } else if (obj.code === "42501") { // permission denied (RLS violation)
        msg = "Permission denied. Please verify your role configurations.";
      }
      return {
        message: msg,
        code: typeof obj.code === "string" ? obj.code : undefined,
        originalError: error,
      };
    }
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      originalError: error,
    };
  }

  return {
    message: ERROR_MESSAGES.GENERIC_ERROR,
    originalError: error,
  };
}
