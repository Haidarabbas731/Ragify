/**
 * React Query hooks for admin operations
 * Provides data fetching and mutations for admin-only features
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  activateUser,
  cleanupAllDocuments,
  cleanupUserDocuments,
  deleteAdminDocument,
  deleteAdminUser,
  getAdminAuditLogs,
  getAdminDocuments,
  getAdminStats,
  getAdminUserDetails,
  getAdminUsers,
  suspendUser,
} from "@/lib/api";
import { getApiErrorMessage } from "@/lib/errors";

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
      const message = getApiErrorMessage(error, "Failed to suspend user");
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
      const message = getApiErrorMessage(error, "Failed to activate user");
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
      const message = getApiErrorMessage(error, "Failed to delete user");
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

/** Refresh everything a document delete can change. */
function invalidateAfterDocumentDelete(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  queryClient.invalidateQueries({ queryKey: ["admin", "documents"] });
  queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
  queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
  queryClient.invalidateQueries({ queryKey: ["documents"] });
  queryClient.invalidateQueries({ queryKey: ["userStats"] });
}

/** Hook to permanently delete one document (any user). */
export const useAdminDeleteDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string) => deleteAdminDocument(documentId),
    onSuccess: () => {
      invalidateAfterDocumentDelete(queryClient);
      toast.success("Document deleted");
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Failed to delete document"));
    },
  });
};

/** Hook to permanently delete every document of one user. */
export const useCleanupUserDocuments = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => cleanupUserDocuments(userId),
    onSuccess: (result) => {
      invalidateAfterDocumentDelete(queryClient);
      toast.success(
        `Deleted ${result.deleted_count} ${result.deleted_count === 1 ? "document" : "documents"}`,
      );
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Failed to delete documents"));
    },
  });
};

/** Hook to permanently delete every document of every user. */
export const useCleanupAllDocuments = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => cleanupAllDocuments(),
    onSuccess: (result) => {
      invalidateAfterDocumentDelete(queryClient);
      toast.success(
        `Deleted ${result.deleted_count} ${result.deleted_count === 1 ? "document" : "documents"} from every account`,
      );
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Failed to delete all documents"));
    },
  });
};
