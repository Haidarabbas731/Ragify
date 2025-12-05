/**
 * React Query hooks for admin operations
 * Provides data fetching and mutations for admin-only features
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  activateUser,
  createInviteCode,
  deactivateInviteCode,
  deleteAdminUser,
  getAdminAuditLogs,
  getAdminDocuments,
  getAdminInviteCodes,
  getAdminStats,
  getAdminUserDetails,
  getAdminUsers,
  suspendUser,
} from "@/lib/api";

// ============================================================================
// System Stats
// ============================================================================

/**
 * Hook to fetch system-wide statistics
 * @returns React Query result with system stats
 */
export const useAdminStats = () => {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => getAdminStats(),
    staleTime: 1000 * 60, // 1 minute
  });
};

// ============================================================================
// User Management
// ============================================================================

/**
 * Hook to fetch paginated user list
 * @param params - Query parameters for filtering and pagination
 * @returns React Query result with user list
 */
export const useAdminUsers = (params?: {
  page?: number;
  limit?: number;
  status_filter?: string;
  role?: string;
  sort_by?: string;
  order?: "asc" | "desc";
}) => {
  return useQuery({
    queryKey: ["admin", "users", params],
    queryFn: () => getAdminUsers(params),
    staleTime: 1000 * 30, // 30 seconds
  });
};

/**
 * Hook to fetch detailed user information
 * @param userId - User ID
 * @returns React Query result with user details
 */
export const useAdminUserDetails = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["admin", "users", userId],
    queryFn: () => getAdminUserDetails(userId as string),
    enabled: !!userId,
    staleTime: 1000 * 30, // 30 seconds
  });
};

/**
 * Hook to suspend a user
 * @returns Mutation function and state for suspending users
 */
export const useSuspendUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      suspendUser(userId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("User suspended successfully");
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Failed to suspend user";
      toast.error(message);
    },
  });
};

/**
 * Hook to activate a suspended user
 * @returns Mutation function and state for activating users
 */
export const useActivateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => activateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("User activated successfully");
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Failed to activate user";
      toast.error(message);
    },
  });
};

/**
 * Hook to delete a user
 * @returns Mutation function and state for deleting users
 */
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => deleteAdminUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("User deleted successfully");
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Failed to delete user";
      toast.error(message);
    },
  });
};

// ============================================================================
// Invite Codes
// ============================================================================

/**
 * Hook to fetch all invite codes
 * @returns React Query result with invite codes list
 */
export const useAdminInviteCodes = () => {
  return useQuery({
    queryKey: ["admin", "invite-codes"],
    queryFn: () => getAdminInviteCodes(),
    staleTime: 1000 * 60, // 1 minute
  });
};

/**
 * Hook to create a new invite code
 * @returns Mutation function and state for creating invite codes
 */
export const useCreateInviteCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (codeData: {
      max_uses?: number;
      expires_at?: string;
      description?: string;
    }) => createInviteCode(codeData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "invite-codes"] });
      toast.success("Invite code created successfully");
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Failed to create invite code";
      toast.error(message);
    },
  });
};

/**
 * Hook to deactivate an invite code
 * @returns Mutation function and state for deactivating invite codes
 */
export const useDeactivateInviteCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (codeId: string) => deactivateInviteCode(codeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "invite-codes"] });
      toast.success("Invite code deactivated successfully");
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Failed to deactivate invite code";
      toast.error(message);
    },
  });
};

// ============================================================================
// Audit Logs
// ============================================================================

/**
 * Hook to fetch audit logs
 * @param params - Query parameters for pagination
 * @returns React Query result with audit logs
 */
export const useAdminAuditLogs = (params?: {
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ["admin", "audit-logs", params],
    queryFn: () => getAdminAuditLogs(params),
    staleTime: 1000 * 60, // 1 minute
  });
};

// ============================================================================
// Documents Management
// ============================================================================

/**
 * Hook to fetch all documents across all users
 * @param params - Query parameters for filtering and pagination
 * @returns React Query result with documents list
 */
export const useAdminDocuments = (params?: {
  page?: number;
  limit?: number;
  status?: string;
  sort_by?: string;
  order?: "asc" | "desc";
}) => {
  return useQuery({
    queryKey: ["admin", "documents", params],
    queryFn: () => getAdminDocuments(params),
    staleTime: 1000 * 30, // 30 seconds
  });
};
