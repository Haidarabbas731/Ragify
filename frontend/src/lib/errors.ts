/** The structured part of a server error: `{"detail": {"code", "message", ...}}`. */
export interface ApiErrorDetail {
  code?: string;
  message?: string;
  /** Wrong-code tries left before a verification code locks. */
  attempts_left?: number;
  /** Seconds until the request may be repeated. */
  retry_after?: number;
}

/** The `detail` of a failed request when the server sent an object, otherwise null. */
export function getApiErrorDetail(error: unknown): ApiErrorDetail | null {
  const detail = (error as { response?: { data?: { detail?: unknown } } })
    ?.response?.data?.detail;
  return detail && typeof detail === "object"
    ? (detail as ApiErrorDetail)
    : null;
}

/** The machine-readable error code (for example `email_not_verified`), if the server sent one. */
export function getApiErrorCode(error: unknown): string | undefined {
  return getApiErrorDetail(error)?.code;
}

/**
 * Extract the server's error message from a failed request.
 * FastAPI sends `detail` (a string, or an object with a `message`); some endpoints send `message`.
 * @param error - Error thrown by an API call
 * @param fallback - Message to use when the server sent none
 * @returns A message that is safe to show to the user
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  const data = (
    error as {
      response?: { data?: { detail?: unknown; message?: unknown } };
    }
  )?.response?.data;
  if (typeof data?.detail === "string") return data.detail;
  const detail = getApiErrorDetail(error);
  if (typeof detail?.message === "string") return detail.message;
  if (typeof data?.message === "string") return data.message;
  return fallback;
}
