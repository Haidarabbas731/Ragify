/**
 * API-related TypeScript type definitions
 */

/**
 * API error response structure from backend
 * The backend returns errors in this format
 */
export interface ApiError {
  detail:
    | string
    | {
        error: string;
        resolution: string;
      };
}

/**
 * Generic API response wrapper
 * Used for consistent response handling
 */
export interface ApiResponse<T> {
  data: T;
  status: number;
}

/**
 * User profile response from GET /users/me
 */
export interface UserProfile {
  user_id: string;
  email: string;
  role: "user" | "admin";
  status: "active" | "suspended";
  storage_used_bytes: number;
  storage_limit_bytes: number;
  storage_used_mb: number;
  storage_limit_mb: number;
  storage_percentage: number;
  created_at: string;
  last_login_at: string | null;
}

/**
 * User profile update request for PATCH /users/me
 */
export interface UserUpdateRequest {
  email?: string;
}

/**
 * Change password request for POST /users/me/change-password
 */
export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

/**
 * User dashboard statistics from GET /users/me/stats
 */
export interface UserStats {
  total_documents: number;
  total_chunks: number;
  total_collections: number;
  total_conversations: number;
  storage_used_bytes: number;
  storage_limit_bytes: number;
  storage_used_mb: number;
  storage_limit_mb: number;
  storage_percentage: number;
  documents_by_status: {
    active: number;
    processing: number;
    error: number;
  };
}

/**
 * Generic message response
 */
export interface MessageResponse {
  message: string;
}

// ----------------------------------------------------------------------------
// Document Types
// ----------------------------------------------------------------------------

/**
 * Document status
 */
export type DocumentStatus = "processing" | "active" | "error" | "deleted";

/**
 * Document chunk from API
 */
export interface DocumentChunk {
  chunk_id: string;
  content: string;
  chunk_index: number;
  metadata?: Record<string, unknown>;
}

/**
 * Document object from API
 */
export interface Document {
  document_id: string;
  user_id: string;
  filename: string;
  file_type: string;
  size_bytes: number;
  status: DocumentStatus;
  collection_id: string | null;
  collection_name: string | null;
  category: string | null;
  tags: string[] | null;
  chunks_count: number;
  uploaded_at: string;
  processed_at: string | null;
  error_message: string | null;
  chunks?: DocumentChunk[]; // Optional, only included in detail view
}

/**
 * Document list response with pagination
 */
export interface DocumentListResponse {
  documents: Document[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/**
 * Document list query parameters
 */
export interface DocumentListParams {
  page?: number;
  limit?: number;
  collection_id?: string;
  status_filter?: DocumentStatus;
  sort_by?: string;
  order?: "asc" | "desc";
}

/**
 * Document update request
 */
export interface DocumentUpdateRequest {
  collection_id?: string | null;
  category?: string | null;
  tags?: string[];
}

/**
 * Batch delete request
 */
export interface BatchDeleteRequest {
  document_ids: string[];
}

/**
 * Bulk upload response
 */
export interface BulkUploadResponse {
  uploaded_count: number;
  failed_count: number;
  documents?: Document[];
  failed_uploads?: Array<{
    filename: string;
    error: string;
  }>;
}

/**
 * Retry all failed documents response
 */
export interface RetryAllResponse {
  retried_count: number;
  failed_count: number;
  errors?: Array<{
    document_id: string;
    error: string;
  }>;
}

// ----------------------------------------------------------------------------
// Conversation Types
// ----------------------------------------------------------------------------

/**
 * Chat message in a conversation
 */
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  sources?: SourceCitation[];
}

/**
 * Source citation for chat responses
 */
export interface SourceCitation {
  document_id: string;
  document_name: string;
  filename: string;
  chunk_index: number;
  chunk_text: string;
  relevance_score: number;
}

/**
 * Conversation list item (summary)
 */
export interface ConversationListItem {
  conversation_id: string;
  user_id: string;
  message_count: number;
  created_at: string;
  updated_at: string;
  last_message?: string | null;
}

/**
 * Full conversation with messages
 */
export interface Conversation {
  conversation_id: string;
  user_id: string;
  messages: ChatMessage[];
  message_count: number;
  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------------------------------
// Collection Types
// ----------------------------------------------------------------------------

/**
 * Collection (folder for organizing documents)
 */
export interface Collection {
  collection_id: string;
  user_id: string;
  name: string;
  description: string | null;
  document_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Create collection request
 */
export interface CreateCollectionRequest {
  name: string;
  description?: string;
}

/**
 * Update collection request
 */
export interface UpdateCollectionRequest {
  name?: string;
  description?: string;
}
