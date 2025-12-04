/**
 * Axios API client with JWT authentication interceptors
 */

import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
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

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
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

    return Promise.reject(error);
  },
);

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
  const { data } = await api.put(`/documents/${documentId}`, updates);
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
