/**
 * Axios API client with JWT authentication interceptors
 */

import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner";
import type {
  AdminDocumentsResponse,
  AdminStats,
  AdminUserDetails,
  AdminUsersResponse,
  AiModel,
  AiProvider,
  AiSettings,
  AiSettingsUpdate,
  AiTestResult,
  AuditLogsResponse,
  CleanupResult,
  MessageResponse,
  PasswordResetValidation,
} from "../types/api";
import type { TokenResponse } from "../types/auth";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000, // 30 seconds
  headers: {
    "Content-Type": "application/json",
  },
});

// Track if we're currently refreshing the token
let isRefreshing = false;
// Queue of failed requests waiting for token refresh
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

/**
 * Process queued requests after token refresh
 */
const processQueue = (error: Error | null, token: string | null = null) => {
  for (const prom of failedQueue) {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  }
  failedQueue = [];
};

/**
 * Request interceptor: Inject access token
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get access token from localStorage
    const accessToken = localStorage.getItem("access_token");

    // Skip adding token for auth endpoints
    const isAuthEndpoint = config.url?.includes("/auth/");

    if (accessToken && !isAuthEndpoint) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

/**
 * Response interceptor: Handle 401 errors and token refresh
 */
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 Unauthorized errors — skip auth endpoints (login/register failures are expected)
    const isAuthEndpoint = originalRequest.url?.includes("/auth/");
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      if (isRefreshing) {
        // Already refreshing, add to queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refresh_token");

      if (!refreshToken) {
        // No refresh token, clear auth and redirect
        isRefreshing = false;
        processQueue(new Error("No refresh token available"), null);
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        // Create separate axios instance for refresh to avoid interceptor loop
        const refreshApi = axios.create({
          baseURL: import.meta.env.VITE_API_URL,
          timeout: 30000,
        });

        // Call refresh endpoint
        const { data } = await refreshApi.post<TokenResponse>(
          "/auth/refresh",
          {},
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          },
        );

        // Store new tokens
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);

        // Update authorization header
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;

        // Process queued requests
        processQueue(null, data.access_token);
        isRefreshing = false;

        // Retry original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear auth and redirect
        processQueue(refreshError as Error, null);
        isRefreshing = false;
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    // Handle specific HTTP error codes with user-friendly messages
    if (error.response?.status === 413) {
      toast.error("File too large. Maximum size is 50MB.");
    } else if (error.response?.status === 429) {
      toast.error("Rate limit exceeded. Please try again later.");
    } else if (error.response?.status === 504) {
      toast.error("Request timed out. Please try again.");
    }

    return Promise.reject(error);
  },
);

/**
 * Check whether a password reset link can still be used, without using it
 * @param token - The token from the reset link
 * @returns Whether the link is still valid (expired and already-used links both come back invalid)
 */
export const validatePasswordResetToken = async (
  token: string,
): Promise<PasswordResetValidation> => {
  const { data } = await api.get("/auth/password-reset/validate", {
    params: { token },
    timeout: 10000,
  });
  return data;
};

/**
 * Get the current user's AI settings (the API key is never returned)
 * @returns Saved provider and model, key status, and the server defaults
 */
export const getAiSettings = async (): Promise<AiSettings> => {
  const { data } = await api.get("/ai/settings");
  return data;
};

/**
 * Save the current user's provider, model and API key
 * @param settings - Provider and model; api_key is optional once one is stored
 * @returns Updated settings
 */
export const saveAiSettings = async (
  settings: AiSettingsUpdate,
): Promise<AiSettings> => {
  const { data } = await api.put("/ai/settings", settings);
  return data;
};

/**
 * Remove the saved key and model (chat goes back to the server defaults)
 * @returns Success message
 */
export const resetAiSettings = async (): Promise<MessageResponse> => {
  const { data } = await api.delete("/ai/settings");
  return data;
};

/**
 * Check that a provider, model and key work and support tool calling
 * @param settings - Provider and model; omit api_key to test the stored key
 * @returns Whether it worked, with a message to show
 */
export const testAiSettings = async (
  settings: AiSettingsUpdate,
): Promise<AiTestResult> => {
  const { data } = await api.post("/ai/settings/test", settings);
  return data;
};

/**
 * List models the user can pick for a provider
 * @param provider - Provider to list models for
 * @param apiKey - Key to list Gemini models with (else the saved key is used)
 * @returns Models (empty when Gemini has no key to ask with)
 */
export const listAiModels = async (
  provider: AiProvider,
  apiKey?: string,
): Promise<AiModel[]> => {
  const { data } = await api.post("/ai/models", {
    provider,
    ...(apiKey ? { api_key: apiKey } : {}),
  });
  return data;
};

export default api;

// ============================================================================
// API Methods
// ============================================================================

// ----------------------------------------------------------------------------
// User Profile & Stats
// ----------------------------------------------------------------------------

/**
 * Get current user profile
 * @returns User profile with storage statistics
 */
export const getUserProfile = async () => {
  const { data } = await api.get("/users/me");
  return data;
};

/**
 * Update current user profile
 * @param userData - User update data (currently only email)
 * @returns Updated user profile
 */
export const updateUserProfile = async (userData: { email?: string }) => {
  const { data } = await api.patch("/users/me", userData);
  return data;
};

/**
 * Change current user password
 * @param passwords - Current and new password
 * @returns Success message
 */
export const changePassword = async (passwords: {
  current_password: string;
  new_password: string;
}) => {
  const { data } = await api.post("/users/me/change-password", passwords);
  return data;
};

/**
 * Get current user dashboard statistics
 * @returns User stats including document counts, storage, collections, conversations
 */
export const getUserStats = async () => {
  const { data } = await api.get("/users/me/stats");
  return data;
};

// ----------------------------------------------------------------------------
// Documents
// ----------------------------------------------------------------------------

/**
 * Upload a document
 * @param file - File to upload
 * @param collectionId - Optional collection ID to assign document to
 * @returns Uploaded document data
 */
export const uploadDocument = async (
  file: File,
  collectionId?: string,
): Promise<{ document_id: string; filename: string; status: string }> => {
  const formData = new FormData();
  formData.append("file", file);
  if (collectionId) {
    formData.append("collection_id", collectionId);
  }

  const { data } = await api.post("/documents/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
};

/**
 * Get list of documents with pagination and filters
 * @param params - Query parameters (page, limit, filters, sorting)
 * @returns Paginated document list
 */
export const getDocuments = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  collection_id?: string;
  status_filter?: string;
  sort_by?: string;
  order?: string;
}) => {
  const { data } = await api.get("/documents", { params });
  return data;
};

/**
 * Get single document by ID
 * @param documentId - Document ID
 * @returns Document details
 */
export const getDocument = async (documentId: string) => {
  const { data } = await api.get(`/documents/${documentId}`);
  return data;
};

/**
 * Update document metadata
 * @param documentId - Document ID
 * @param updates - Fields to update (collection_id, category, tags)
 * @returns Updated document
 */
export const updateDocument = async (
  documentId: string,
  updates: {
    collection_id?: string | null;
    category?: string | null;
    tags?: string[];
  },
) => {
  // Backend expects FormData, not JSON
  const formData = new FormData();

  if (updates.collection_id !== undefined) {
    formData.append("collection_id", updates.collection_id || "");
  }
  if (updates.category !== undefined) {
    formData.append("category", updates.category || "");
  }
  if (updates.tags) {
    formData.append("tags", updates.tags.join(","));
  }

  const { data } = await api.put(`/documents/${documentId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
};

/**
 * Delete a document (soft delete)
 * @param documentId - Document ID
 * @returns Success message
 */
export const deleteDocument = async (documentId: string) => {
  const { data } = await api.delete(`/documents/${documentId}`);
  return data;
};

/**
 * Batch delete documents
 * @param documentIds - Array of document IDs
 * @returns Success message with count
 */
/**
 * Move documents into a collection, or out of any collection.
 * @param documentIds - At most 100 documents (the backend limit)
 * @param collectionId - Target collection, or `null` to remove from collections
 */
export const batchUpdateDocuments = async (
  documentIds: string[],
  collectionId: string | null,
) => {
  const { data } = await api.post("/documents/batch-update", {
    document_ids: documentIds,
    collection_id: collectionId ?? "",
  });
  return data as { updated_count: number; failed_count: number };
};

/**
 * Collect the IDs of every document matching a filter, page by page.
 * Used when "select all matching" spans more than one page.
 */
export const getAllMatchingDocumentIds = async (params: {
  search?: string;
  collection_id?: string;
  status_filter?: string;
}) => {
  const ids: string[] = [];
  let page = 1;
  while (true) {
    const data = await getDocuments({ ...params, page, limit: 100 });
    ids.push(
      ...(data.documents as { document_id: string }[]).map(
        (doc) => doc.document_id,
      ),
    );
    if (page >= data.pages) break;
    page += 1;
  }
  return ids;
};

export const batchDeleteDocuments = async (documentIds: string[]) => {
  const { data } = await api.post("/documents/batch-delete", {
    document_ids: documentIds,
  });
  return data;
};

/**
 * Delete all user documents
 * @returns Success message with count
 */
export const deleteAllDocuments = async () => {
  const { data } = await api.post("/documents/delete-all-mine");
  return data;
};

/**
 * Retry processing a failed document
 * @param documentId - Document ID
 * @returns Success message
 */
export const retryDocument = async (documentId: string) => {
  const { data } = await api.post(`/documents/${documentId}/retry`);
  return data;
};

/**
 * Bulk upload multiple documents
 * @param files - Array of files to upload
 * @param collectionId - Optional collection ID for all documents
 * @param category - Optional category for all documents
 * @param tags - Optional comma-separated tags for all documents
 * @returns Bulk upload response with success/failure counts
 */
export const bulkUploadDocuments = async (
  files: File[],
  collectionId?: string,
  category?: string,
  tags?: string,
): Promise<unknown> => {
  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }
  if (collectionId) {
    formData.append("collection_id", collectionId);
  }
  if (category) {
    formData.append("category", category);
  }
  if (tags) {
    formData.append("tags", tags);
  }

  const { data } = await api.post("/documents/bulk-upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
};

/**
 * Retry all failed documents
 * @returns Retry all response with counts
 */
export const retryAllFailedDocuments = async () => {
  const { data } = await api.post("/documents/retry-failed");
  return data;
};

// ============================================================================
// Conversation API Methods
// ============================================================================

/**
 * Get list of user conversations
 * @param params - Pagination parameters (limit, offset)
 * @returns List of conversations
 */
export const getConversations = async (params?: {
  limit?: number;
  offset?: number;
}) => {
  const { data } = await api.get("/conversations", { params });
  return data;
};

/**
 * Get single conversation with full message history
 * @param conversationId - Conversation ID
 * @returns Conversation with messages
 */
export const getConversation = async (conversationId: string) => {
  const { data } = await api.get(`/conversations/${conversationId}`);
  return data;
};

/**
 * Delete a conversation
 * @param conversationId - Conversation ID
 */
export const deleteConversation = async (conversationId: string) => {
  await api.delete(`/conversations/${conversationId}`);
};

// ============================================================================
// Collection API Methods
// ============================================================================

/**
 * Get list of user collections
 * @returns List of collections
 */
export const getCollections = async () => {
  const { data } = await api.get("/collections");
  return data;
};

/**
 * Get single collection with details
 * @param collectionId - Collection ID
 * @returns Collection details
 */
export const getCollection = async (collectionId: string) => {
  const { data } = await api.get(`/collections/${collectionId}`);
  return data;
};

/**
 * Create a new collection
 * @param collectionData - Collection name and description
 * @returns Created collection
 */
export const createCollection = async (collectionData: {
  name: string;
  description?: string;
}) => {
  const { data } = await api.post("/collections", collectionData);
  return data;
};

/**
 * Update collection metadata
 * @param collectionId - Collection ID
 * @param updates - Name and/or description updates
 * @returns Updated collection
 */
export const updateCollection = async (
  collectionId: string,
  updates: { name?: string; description?: string },
) => {
  const { data } = await api.put(`/collections/${collectionId}`, updates);
  return data;
};

/**
 * Delete a collection
 * @param collectionId - Collection ID
 */
export const deleteCollection = async (collectionId: string) => {
  await api.delete(`/collections/${collectionId}`);
};

// ============================================================================
// Admin API Methods
// ============================================================================

/** System-wide statistics (admin only). */
export const getAdminStats = async (): Promise<AdminStats> => {
  const { data } = await api.get("/admin/stats");
  return data;
};

/** Paginated user list with filters (admin only). */
export const getAdminUsers = async (params?: {
  page?: number;
  limit?: number;
  status_filter?: string;
  role?: string;
  sort_by?: string;
  order?: "asc" | "desc";
}): Promise<AdminUsersResponse> => {
  const { data } = await api.get("/admin/users", { params });
  return data;
};

/** One user with document, conversation and collection counts (admin only). */
export const getAdminUserDetails = async (
  userId: string,
): Promise<AdminUserDetails> => {
  const { data } = await api.get(`/admin/users/${userId}`);
  return data;
};

/** Suspend a user account with a reason (admin only). */
export const suspendUser = async (userId: string, reason: string) => {
  const { data } = await api.post(`/admin/users/${userId}/suspend`, { reason });
  return data;
};

/** Activate a suspended user account (admin only). */
export const activateUser = async (userId: string) => {
  const { data } = await api.post(`/admin/users/${userId}/activate`);
  return data;
};

/** Delete a user account (admin only). */
export const deleteAdminUser = async (userId: string) => {
  const { data } = await api.delete(`/admin/users/${userId}`);
  return data;
};

/** Paginated audit trail (admin only). */
export const getAdminAuditLogs = async (params?: {
  page?: number;
  limit?: number;
}): Promise<AuditLogsResponse> => {
  const { data } = await api.get("/admin/audit-logs", { params });
  return data;
};

/** Paginated documents across all users (admin only). */
export const getAdminDocuments = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  sort_by?: string;
  order?: "asc" | "desc";
}): Promise<AdminDocumentsResponse> => {
  const { data } = await api.get("/admin/documents", { params });
  return data;
};

/** Permanently delete one document from the database, storage and vector index (admin only). */
export const deleteAdminDocument = async (documentId: string) => {
  const { data } = await api.delete(`/admin/documents/${documentId}`);
  return data;
};

/** Permanently delete every document of one user (admin only). */
export const cleanupUserDocuments = async (
  userId: string,
): Promise<CleanupResult> => {
  const { data } = await api.delete(`/admin/users/${userId}/documents`);
  return data;
};

/** Permanently delete every document of every user and reset the vector index (admin only). */
export const cleanupAllDocuments = async (): Promise<CleanupResult> => {
  const { data } = await api.delete("/admin/documents/cleanup-all");
  return data;
};
