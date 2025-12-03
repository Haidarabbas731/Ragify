/**
 * React Query hook for user dashboard statistics
 */

import { useQuery } from "@tanstack/react-query";
import { getUserStats } from "../lib/api";
import type { UserStats } from "../types/api";

/**
 * Fetch current user dashboard statistics
 * @returns User stats including document counts, storage, collections, conversations
 */
export function useUserStats() {
  return useQuery<UserStats>({
    queryKey: ["user", "stats"],
    queryFn: getUserStats,
    staleTime: 1000 * 60 * 2, // 2 minutes - stats change more frequently
  });
}
