/**
 * React Query hook that checks a password reset link before the user types a new password
 */

import { useQuery } from "@tanstack/react-query";
import { validatePasswordResetToken } from "../lib/api";
import type { PasswordResetValidation } from "../types/api";

/**
 * Ask the server whether a reset link can still be used. Nothing is consumed by asking.
 * @param token - The token from the link, or null when the link has none (the query then stays idle)
 * @returns The query state; `data.valid` is false for expired and already-used links
 */
export function usePasswordResetLink(token: string | null) {
  return useQuery<PasswordResetValidation>({
    queryKey: ["auth", "password-reset", token],
    queryFn: () => validatePasswordResetToken(token as string),
    enabled: !!token,
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
  });
}
