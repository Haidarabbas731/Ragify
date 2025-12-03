/**
 * Admin Documents Browser - Document Management Command Center
 * Variation on Command Center aesthetic with unique visual touches
 */

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  File,
  FileText,
  FileType,
  Filter,
  Loader2,
  Search,
  Trash2,
} from "lucide-react";
import { useState } from "react";

interface AdminDocument {
  document_id: string;
  user_id: string;
  user_email: string;
  filename: string;
  file_type: "pdf" | "docx" | "txt" | "md";
  size_bytes: number;
  status: "processing" | "active" | "error" | "deleted";
  chunks_count: number;
  uploaded_at: string;
  processed_at: string | null;
  error_message: string | null;
}

// Mock data - 8 documents
const MOCK_DOCUMENTS: AdminDocument[] = [
  {
    document_id: "doc-001",
    user_id: "user-001",
    user_email: "admin@test.com",
    filename: "Product_Requirements_2025.pdf",
    file_type: "pdf",
    size_bytes: 2457600, // 2.4MB
    status: "active",
    chunks_count: 45,
    uploaded_at: "2025-12-02T10:30:00Z",
    processed_at: "2025-12-02T10:31:00Z",
    error_message: null,
  },
  {
    document_id: "doc-002",
    user_id: "user-002",
    user_email: "user@example.com",
    filename: "Meeting_Notes.docx",
    file_type: "docx",
    size_bytes: 524288, // 512KB
    status: "active",
    chunks_count: 12,
    uploaded_at: "2025-12-02T09:15:00Z",
    processed_at: "2025-12-02T09:16:00Z",
    error_message: null,
  },
  {
    document_id: "doc-003",
    user_id: "user-003",
    user_email: "john.doe@company.com",
    filename: "Research_Paper_Draft.pdf",
    file_type: "pdf",
    size_bytes: 5242880, // 5MB
    status: "processing",
    chunks_count: 0,
    uploaded_at: "2025-12-02T11:00:00Z",
    processed_at: null,
    error_message: null,
  },
  {
    document_id: "doc-004",
    user_id: "user-002",
    user_email: "user@example.com",
    filename: "API_Documentation.md",
    file_type: "md",
    size_bytes: 102400, // 100KB
    status: "active",
    chunks_count: 8,
    uploaded_at: "2025-12-01T16:45:00Z",
    processed_at: "2025-12-01T16:46:00Z",
    error_message: null,
  },
  {
    document_id: "doc-005",
    user_id: "user-004",
    user_email: "power.user@tech.io",
    filename: "corrupted_file.pdf",
    file_type: "pdf",
    size_bytes: 1048576, // 1MB
    status: "error",
    chunks_count: 0,
    uploaded_at: "2025-12-01T14:20:00Z",
    processed_at: null,
    error_message: "Failed to extract text: File corrupted",
  },
  {
    document_id: "doc-006",
    user_id: "user-001",
    user_email: "admin@test.com",
    filename: "Technical_Specs.txt",
    file_type: "txt",
    size_bytes: 51200, // 50KB
    status: "active",
    chunks_count: 5,
    uploaded_at: "2025-11-30T12:00:00Z",
    processed_at: "2025-11-30T12:01:00Z",
    error_message: null,
  },
  {
    document_id: "doc-007",
    user_id: "user-003",
    user_email: "john.doe@company.com",
    filename: "Old_Archive_2024.pdf",
    file_type: "pdf",
    size_bytes: 3145728, // 3MB
    status: "deleted",
    chunks_count: 0,
    uploaded_at: "2025-11-15T08:30:00Z",
    processed_at: "2025-11-15T08:31:00Z",
    error_message: null,
  },
  {
    document_id: "doc-008",
    user_id: "user-004",
    user_email: "power.user@tech.io",
    filename: "User_Guide_v2.docx",
    file_type: "docx",
    size_bytes: 1572864, // 1.5MB
    status: "active",
    chunks_count: 28,
    uploaded_at: "2025-11-28T15:10:00Z",
    processed_at: "2025-11-28T15:11:00Z",
    error_message: null,
  },
];

const MOCK_USERS = [
  { id: "all", email: "All Users" },
  { id: "user-001", email: "admin@test.com" },
  { id: "user-002", email: "user@example.com" },
  { id: "user-003", email: "john.doe@company.com" },
  { id: "user-004", email: "power.user@tech.io" },
];

export function AdminDocuments() {
  const [searchQuery, setSearchQuery] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "processing" | "active" | "error" | "deleted"
  >("all");
  const [selectedDoc, setSelectedDoc] = useState<AdminDocument | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    type: "delete" | "cleanup-user" | "cleanup-user-select" | "cleanup-all";
    doc?: AdminDocument;
    userId?: string;
    userEmail?: string;
  } | null>(null);
  const [page, setPage] = useState(1);
  const limit = 10;

  // Filter documents
  const filteredDocs = MOCK_DOCUMENTS.filter((doc) => {
    const matchesSearch = doc.filename
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesUser = userFilter === "all" || doc.user_id === userFilter;
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
    return matchesSearch && matchesUser && matchesStatus;
  });

  // Format bytes
  const formatBytes = (bytes: number) => {
    const kb = bytes / 1024;
    if (kb >= 1024) {
      return `${(kb / 1024).toFixed(2)} MB`;
    }
    return `${kb.toFixed(0)} KB`;
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get file icon
  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "pdf":
        return <FileText className="w-5 h-5 text-red-600 dark:text-red-400" />;
      case "docx":
        return (
          <FileType className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        );
      case "txt":
        return <File className="w-5 h-5 text-gray-600 dark:text-slate-400" />;
      case "md":
        return (
          <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        );
      default:
        return <File className="w-5 h-5 text-gray-600 dark:text-slate-400" />;
    }
  };

  // Get status badge
  const getStatusBadge = (status: AdminDocument["status"]) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 rounded text-xs font-mono text-emerald-700 dark:text-emerald-400">
            <CheckCircle className="w-3.5 h-3.5" />
            ACTIVE
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 rounded text-xs font-mono text-amber-700 dark:text-amber-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            PROCESSING
          </span>
        );
      case "error":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-100 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 rounded text-xs font-mono text-red-700 dark:text-red-400">
            <AlertCircle className="w-3.5 h-3.5" />
            ERROR
          </span>
        );
      case "deleted":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded text-xs font-mono text-gray-700 dark:text-slate-400">
            DELETED
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold font-mono tracking-tight text-indigo-600 dark:text-purple-400">
                DOCUMENTS_BROWSER
              </h1>
              <p className="text-sm text-gray-600 dark:text-slate-400 mt-1 font-mono">
                Browse and manage all user documents
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <div className="px-3 py-1.5 bg-gray-100 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded text-gray-600 dark:text-slate-400">
                {filteredDocs.length} DOCUMENTS
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Filters */}
        <div className="mb-6 bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search filename..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded font-mono text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 dark:focus:border-purple-500 transition-colors"
              />
            </div>

            {/* User Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500 z-10" />
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="w-full pl-10 pr-8 py-2 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded font-mono text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:border-indigo-400 dark:focus:border-purple-500 transition-colors appearance-none cursor-pointer"
              >
                {MOCK_USERS.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500 z-10" />
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as
                      | "all"
                      | "processing"
                      | "active"
                      | "error"
                      | "deleted",
                  )
                }
                className="w-full pl-10 pr-8 py-2 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded font-mono text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:border-indigo-400 dark:focus:border-purple-500 transition-colors appearance-none cursor-pointer"
              >
                <option value="all">ALL STATUS</option>
                <option value="active">ACTIVE</option>
                <option value="processing">PROCESSING</option>
                <option value="error">ERROR</option>
                <option value="deleted">DELETED</option>
              </select>
            </div>
          </div>
        </div>

        {/* Documents Table */}
        <div className="bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-700 text-xs font-mono font-bold uppercase text-gray-600 dark:text-slate-400">
            <div className="col-span-4">Filename</div>
            <div className="col-span-2">User</div>
            <div className="col-span-1 text-center">Type</div>
            <div className="col-span-1 text-right">Size</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1 text-right">Chunks</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-gray-100 dark:divide-slate-800">
            {filteredDocs.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-12 h-12 text-gray-300 dark:text-slate-700 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-slate-500 font-mono">
                  No documents found
                </p>
              </div>
            ) : (
              filteredDocs.map((doc, idx) => (
                <div
                  key={doc.document_id}
                  className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors group"
                  style={{
                    animation: `slideIn 0.3s ease-out ${idx * 0.05}s both`,
                  }}
                >
                  {/* Filename */}
                  <div className="col-span-4 flex items-center gap-3 min-w-0">
                    {getFileIcon(doc.file_type)}
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">
                        {doc.filename}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-500 font-mono">
                        {formatDate(doc.uploaded_at)}
                      </p>
                    </div>
                  </div>

                  {/* User */}
                  <div className="col-span-2 flex items-center min-w-0">
                    <p className="font-mono text-sm text-gray-700 dark:text-slate-300 truncate">
                      {doc.user_email}
                    </p>
                  </div>

                  {/* Type */}
                  <div className="col-span-1 flex items-center justify-center">
                    <span className="px-2 py-1 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded text-xs font-mono uppercase text-gray-700 dark:text-slate-300">
                      {doc.file_type}
                    </span>
                  </div>

                  {/* Size */}
                  <div className="col-span-1 flex items-center justify-end">
                    <p className="font-mono text-sm tabular-nums text-gray-700 dark:text-slate-300">
                      {formatBytes(doc.size_bytes)}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="col-span-2 flex items-center">
                    {getStatusBadge(doc.status)}
                  </div>

                  {/* Chunks */}
                  <div className="col-span-1 flex items-center justify-end">
                    <p className="font-mono text-sm tabular-nums text-indigo-600 dark:text-purple-400 font-bold">
                      {doc.chunks_count}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedDoc(doc)}
                      className="p-2 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded hover:bg-gray-200 dark:hover:bg-slate-700 hover:border-indigo-400 dark:hover:border-purple-500 transition-all opacity-0 group-hover:opacity-100"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4 text-gray-600 dark:text-slate-400" />
                    </button>
                    {doc.status !== "deleted" && (
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmDialog({ type: "delete", doc })
                        }
                        className="p-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded hover:bg-red-100 dark:hover:bg-red-500/20 hover:border-red-400 dark:hover:border-red-500/50 transition-all opacity-0 group-hover:opacity-100"
                        title="Delete Document"
                      >
                        <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {filteredDocs.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
              <div className="flex items-center justify-between">
                <p className="text-sm font-mono text-gray-600 dark:text-slate-400">
                  Showing {(page - 1) * limit + 1}-
                  {Math.min(page * limit, filteredDocs.length)} of{" "}
                  {filteredDocs.length}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="p-2 bg-gray-200 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded hover:bg-gray-300 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={page * limit >= filteredDocs.length}
                    onClick={() => setPage(page + 1)}
                    className="p-2 bg-gray-200 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded hover:bg-gray-300 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="mt-6 bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 border-2 border-red-300 dark:border-red-500/50 rounded-lg p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h2 className="text-lg font-bold font-mono text-red-700 dark:text-red-400 mb-2">
                DANGER_ZONE
              </h2>
              <p className="text-sm font-mono text-gray-600 dark:text-slate-400 mb-4">
                Destructive operations. Use with extreme caution.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setConfirmDialog({
                      type: "cleanup-user-select",
                    })
                  }
                  className="px-4 py-2 bg-red-100 dark:bg-red-500/20 border border-red-300 dark:border-red-500/30 rounded font-mono text-sm text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/30 transition-colors"
                >
                  DELETE_USER_DOCUMENTS
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDialog({ type: "cleanup-all" })}
                  className="px-4 py-2 bg-red-600 dark:bg-red-500 border border-red-700 dark:border-red-600 rounded font-mono text-sm text-white hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
                >
                  ⚠️ NUCLEAR: CLEANUP_ALL
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Document Details Modal */}
      {selectedDoc && (
        // biome-ignore lint/a11y/useKeyWithClickEvents: Modal backdrop - click to close is intentional UX pattern
        // biome-ignore lint/a11y/noStaticElementInteractions: Modal backdrop requires click handler
        <div
          className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedDoc(null)}
        >
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: Modal content - stopPropagation is intentional */}
          {/* biome-ignore lint/a11y/noStaticElementInteractions: Modal content requires click handler */}
          <div
            className="bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 border-2 border-gray-300 dark:border-slate-700 rounded-lg max-w-2xl w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold font-mono text-gray-900 dark:text-slate-100">
                  DOCUMENT_DETAILS
                </h2>
                <button
                  type="button"
                  onClick={() => setSelectedDoc(null)}
                  className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-mono text-gray-500 dark:text-slate-500 uppercase mb-1">
                    Filename
                  </p>
                  <p className="font-mono text-gray-900 dark:text-slate-100">
                    {selectedDoc.filename}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-mono text-gray-500 dark:text-slate-500 uppercase mb-1">
                    Document ID
                  </p>
                  <p className="font-mono text-sm text-gray-900 dark:text-slate-100 break-all">
                    {selectedDoc.document_id}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-mono text-gray-500 dark:text-slate-500 uppercase mb-1">
                    User Email
                  </p>
                  <p className="font-mono text-gray-900 dark:text-slate-100">
                    {selectedDoc.user_email}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-mono text-gray-500 dark:text-slate-500 uppercase mb-1">
                    File Type
                  </p>
                  <p className="font-mono text-gray-900 dark:text-slate-100 uppercase">
                    {selectedDoc.file_type}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-mono text-gray-500 dark:text-slate-500 uppercase mb-1">
                    Size
                  </p>
                  <p className="font-mono text-gray-900 dark:text-slate-100">
                    {formatBytes(selectedDoc.size_bytes)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-mono text-gray-500 dark:text-slate-500 uppercase mb-1">
                    Chunks
                  </p>
                  <p className="font-mono text-gray-900 dark:text-slate-100">
                    {selectedDoc.chunks_count}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-mono text-gray-500 dark:text-slate-500 uppercase mb-1">
                    Status
                  </p>
                  <div>{getStatusBadge(selectedDoc.status)}</div>
                </div>
                <div>
                  <p className="text-xs font-mono text-gray-500 dark:text-slate-500 uppercase mb-1">
                    Uploaded
                  </p>
                  <p className="font-mono text-gray-900 dark:text-slate-100">
                    {formatDate(selectedDoc.uploaded_at)}
                  </p>
                </div>
                {selectedDoc.processed_at && (
                  <div>
                    <p className="text-xs font-mono text-gray-500 dark:text-slate-500 uppercase mb-1">
                      Processed
                    </p>
                    <p className="font-mono text-gray-900 dark:text-slate-100">
                      {formatDate(selectedDoc.processed_at)}
                    </p>
                  </div>
                )}
                {selectedDoc.error_message && (
                  <div className="col-span-2">
                    <p className="text-xs font-mono text-gray-500 dark:text-slate-500 uppercase mb-1">
                      Error Message
                    </p>
                    <p className="font-mono text-sm text-red-600 dark:text-red-400">
                      {selectedDoc.error_message}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 bg-gray-200 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded font-mono text-sm text-gray-900 dark:text-slate-100 hover:bg-gray-300 dark:hover:bg-slate-700 transition-colors"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog && (
        // biome-ignore lint/a11y/useKeyWithClickEvents: Modal backdrop - click to close is intentional UX pattern
        // biome-ignore lint/a11y/noStaticElementInteractions: Modal backdrop requires click handler
        <div
          className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setConfirmDialog(null)}
        >
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: Modal content - stopPropagation is intentional */}
          {/* biome-ignore lint/a11y/noStaticElementInteractions: Modal content requires click handler */}
          <div
            className="bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 border-2 border-red-300 dark:border-red-500/50 rounded-lg max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dialog Header */}
            <div className="px-6 py-4 border-b border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                <h2 className="text-lg font-bold font-mono text-red-700 dark:text-red-400">
                  {confirmDialog.type === "delete" && "DELETE_DOCUMENT"}
                  {confirmDialog.type === "cleanup-user-select" &&
                    "DELETE_USER_DOCUMENTS"}
                  {confirmDialog.type === "cleanup-user" &&
                    "DELETE_USER_DOCUMENTS"}
                  {confirmDialog.type === "cleanup-all" && "⚠️ NUCLEAR_CLEANUP"}
                </h2>
              </div>
            </div>

            {/* Dialog Content */}
            <div className="p-6">
              {confirmDialog.type === "delete" && confirmDialog.doc && (
                <p className="font-mono text-gray-900 dark:text-slate-100">
                  Are you sure you want to delete{" "}
                  <strong className="text-red-600 dark:text-red-400">
                    {confirmDialog.doc.filename}
                  </strong>
                  ? This action cannot be undone.
                </p>
              )}
              {confirmDialog.type === "cleanup-user-select" && (
                <div className="space-y-4">
                  <p className="font-mono text-gray-900 dark:text-slate-100 mb-4">
                    Select a user to delete ALL their documents. This action
                    cannot be undone.
                  </p>
                  <div>
                    <label
                      htmlFor="cleanup-user-select"
                      className="block text-xs font-mono text-gray-500 dark:text-slate-500 uppercase mb-2"
                    >
                      Select User
                    </label>
                    <select
                      id="cleanup-user-select"
                      value={confirmDialog.userId || ""}
                      onChange={(e) =>
                        setConfirmDialog({
                          ...confirmDialog,
                          userId: e.target.value,
                          userEmail:
                            MOCK_USERS.find((u) => u.id === e.target.value)
                              ?.email || "",
                        })
                      }
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded font-mono text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:border-red-400 dark:focus:border-red-500 transition-colors"
                    >
                      <option value="">-- Select a user --</option>
                      {MOCK_USERS.filter((u) => u.id !== "all").map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.email}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              {confirmDialog.type === "cleanup-user" && (
                <p className="font-mono text-gray-900 dark:text-slate-100">
                  Are you sure you want to delete ALL documents for{" "}
                  <strong className="text-red-600 dark:text-red-400">
                    {confirmDialog.userEmail}
                  </strong>
                  ? This action cannot be undone.
                </p>
              )}
              {confirmDialog.type === "cleanup-all" && (
                <div className="space-y-4">
                  <p className="font-mono text-red-700 dark:text-red-400 font-bold">
                    ⚠️ NUCLEAR OPTION ⚠️
                  </p>
                  <p className="font-mono text-gray-900 dark:text-slate-100">
                    This will DELETE ALL DOCUMENTS from ALL USERS. This action
                    is IRREVERSIBLE and will permanently remove all data.
                  </p>
                  <p className="font-mono text-sm text-gray-600 dark:text-slate-400">
                    Type "DELETE ALL" to confirm this action.
                  </p>
                </div>
              )}
            </div>

            {/* Dialog Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 bg-gray-200 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded font-mono text-sm text-gray-900 dark:text-slate-100 hover:bg-gray-300 dark:hover:bg-slate-700 transition-colors"
              >
                CANCEL
              </button>
              <button
                type="button"
                disabled={
                  confirmDialog.type === "cleanup-user-select" &&
                  !confirmDialog.userId
                }
                onClick={() => {
                  if (confirmDialog.type === "cleanup-user-select") {
                    // Move to confirmation dialog
                    setConfirmDialog({
                      type: "cleanup-user",
                      userId: confirmDialog.userId,
                      userEmail: confirmDialog.userEmail,
                    });
                  } else {
                    // Execute action
                    console.log("Confirm:", confirmDialog.type);
                    setConfirmDialog(null);
                    // TODO: API call
                  }
                }}
                className="px-4 py-2 bg-red-600 dark:bg-red-500 border border-red-700 dark:border-red-600 text-white rounded font-mono text-sm hover:bg-red-700 dark:hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {confirmDialog.type === "cleanup-user-select"
                  ? "CONTINUE"
                  : confirmDialog.type === "cleanup-all"
                    ? "☢️ EXECUTE"
                    : "DELETE"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
