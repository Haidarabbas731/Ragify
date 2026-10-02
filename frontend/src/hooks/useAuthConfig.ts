/**
 * React Query hook for the server's public sign-up settings
 */

import { useQuery } from "@tanstack/react-query";
import { getAuthConfig } from "../lib/api";
import type { AuthConfig } from "../types/api";

/**
 * Fetch the sign-up settings (currently whether an invite code is required).
 *
 * `inviteOnly` stays true until the server says otherwise, so a failed request keeps the
 * stricter, current behavior instead of hiding the invite field by mistake.
 * @returns The settings, the query state, and the resolved `inviteOnly` flag
 */
export function useAuthConfig() {
  const query = useQuery<AuthConfig>({
    queryKey: ["auth", "config"],
    queryFn: getAuthConfig,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  return { ...query, inviteOnly: query.data?.invite_only ?? true };
}
