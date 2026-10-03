/**
 * Extract the server's error message from a failed request.
 * FastAPI sends `detail` (a string); some endpoints send `message`.
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
  if (typeof data?.message === "string") return data.message;
  return fallback;
}
