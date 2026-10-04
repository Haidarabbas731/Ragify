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
  storage_used_mb: number;
  storage_limit_mb: number;
  storage_percentage: number;
  collections_count: number;
  conversations_count: number;
  /** Counts by status; a status with no documents may be missing. */
  documents_by_status: Partial<
    Record<"active" | "processing" | "error", number>
  >;
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
  search?: string;
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
  /** Client-only: set on a conversation inserted into the sidebar before the server confirms it. */
  client_added?: boolean;
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
 * Response for list collections endpoint (includes total doc count)
 */
export interface CollectionListResponse {
  collections: Collection[];
  total_documents: number;
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

/**
 * Supported chat model providers
 */
export type AiProvider = "gemini" | "openrouter";

/**
 * The user's saved AI settings plus what chat uses when they have none.
 * The API key itself is never returned, only its last 4 characters.
 */
export interface AiSettings {
  provider: AiProvider | null;
  model: string | null;
  has_key: boolean;
  key_last4: string | null;
  default_provider: AiProvider;
  default_model: string;
  providers: AiProvider[];
}

/**
 * Save or test request. Omit api_key to keep (or test) the stored key.
 */
export interface AiSettingsUpdate {
  provider: AiProvider;
  model: string;
  api_key?: string;
}

/**
 * Result of a connection test
 */
export interface AiTestResult {
  ok: boolean;
  message: string;
}

/**
 * A model the user can pick
 */
export interface AiModel {
  id: string;
  name: string;
  context_length: number | null;
  free: boolean;
}

/**
 * Public sign-up settings from the server (no login needed)
 */
export interface AuthConfig {
  invite_only: boolean;
}

/**
 * Whether a password reset link can still be used
 */
export interface PasswordResetValidation {
  valid: boolean;
}

// ============================================================================
// Admin
// ============================================================================

/** System-wide counts from GET /admin/stats. */
export interface AdminStats {
  total_users: number;
  active_users_30d: number;
  total_documents: number;
  total_conversations: number;
  total_storage_bytes: number;
  active_invite_codes: number;
  failed_documents: number;
  timestamp: string;
}

/** A user row from GET /admin/users. */
export interface AdminUser {
  user_id: string;
  email: string;
  role: "user" | "admin";
  status: "active" | "suspended";
  storage_used_bytes: number;
  storage_limit_bytes: number;
  last_login_at: string | null;
  created_at: string;
}

/** Extra counts from GET /admin/users/:id. */
export interface AdminUserDetails extends AdminUser {
  document_count: number;
  conversation_count: number;
  collection_count: number;
}

/** A document row from GET /admin/documents. */
export interface AdminDocument {
  document_id: string;
  user_id: string;
  user_email: string;
  filename: string;
  file_type: string;
  size_bytes: number;
  status: DocumentStatus;
  chunks_count: number;
  uploaded_at: string;
  processed_at: string | null;
  error_message: string | null;
}

export type InviteCodeStatus = "active" | "expired" | "fully_used" | "revoked";

export interface InviteCode {
  invite_code_id: string;
  code: string;
  created_by: string | null;
  max_uses: number;
  current_uses: number;
  status: InviteCodeStatus;
  expires_at: string | null;
  description: string | null;
  created_at: string;
}

export interface CreateInviteCodeRequest {
  max_uses: number;
  expires_at?: string;
  description?: string;
}

/** One entry of the admin audit trail. */
export interface AuditLogEntry {
  audit_id: string;
  admin_user_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, unknown>;
  ip_address: string;
  timestamp: string;
}

/** Shape shared by the paginated admin lists. */
export interface Paginated {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface AdminUsersResponse extends Paginated {
  users: AdminUser[];
}

export interface AdminDocumentsResponse extends Paginated {
  documents: AdminDocument[];
}

export interface AuditLogsResponse extends Paginated {
  logs: AuditLogEntry[];
}

/** Result of a bulk document delete. */
export interface CleanupResult {
  status: string;
  message: string;
  deleted_count: number;
  errors: string[] | null;
}
