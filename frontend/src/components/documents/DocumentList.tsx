/**
 * Document List Component - Archive Catalog
 * Library-inspired document browser with dense information display
 * Fonts: Fira Code (stats/IDs), Space Grotesk (headings), Inter (body)
 */

import { formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Loader2,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";

interface Document {
  document_id: string;
  filename: string;
  file_type: string;
  size_bytes: number;
  status: "processing" | "active" | "error" | "deleted";
  chunks_count: number;
  uploaded_at: string;
  processed_at: string | null;
  error_message: string | null;
  collection_id: string | null;
}

interface DocumentListProps {
  onDocumentClick?: (documentId: string) => void;
  onDeleteDocument?: (documentId: string) => void;
}

// Mock data for demonstration
const MOCK_DOCUMENTS: Document[] = [
  {
    document_id: "doc_1a2b3c4d",
    filename: "Product Requirements Document Q4 2024.pdf",
    file_type: "application/pdf",
    size_bytes: 2457600,
    status: "active",
    chunks_count: 47,
    uploaded_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    processed_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    error_message: null,
    collection_id: "col_work",
  },
  {
    document_id: "doc_5e6f7g8h",
    filename: "meeting-notes-2024-11.docx",
    file_type:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    size_bytes: 856000,
    status: "active",
    chunks_count: 23,
    uploaded_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    processed_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    error_message: null,
    collection_id: "col_work",
  },
  {
    document_id: "doc_9i0j1k2l",
    filename: "research-paper-ai-embeddings.txt",
    file_type: "text/plain",
    size_bytes: 145000,
    status: "processing",
    chunks_count: 0,
    uploaded_at: new Date(Date.now() - 30 * 1000).toISOString(),
    processed_at: null,
    error_message: null,
    collection_id: "col_research",
  },
  {
    document_id: "doc_3m4n5o6p",
    filename: "budget-analysis-2024.pdf",
    file_type: "application/pdf",
    size_bytes: 3245000,
    status: "error",
    chunks_count: 0,
    uploaded_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    processed_at: null,
    error_message: "Failed to extract text from PDF",
    collection_id: null,
  },
  {
    document_id: "doc_7q8r9s0t",
    filename: "architecture-design.md",
    file_type: "text/markdown",
    size_bytes: 98000,
    status: "active",
    chunks_count: 12,
    uploaded_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    processed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    error_message: null,
    collection_id: "col_work",
  },
];

export function DocumentList({
  onDocumentClick,
  onDeleteDocument,
}: DocumentListProps) {
  const [documents] = useState<Document[]>(MOCK_DOCUMENTS);
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredDoc, setHoveredDoc] = useState<string | null>(null);

  const itemsPerPage = 50;
  const totalPages = Math.ceil(documents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDocuments = documents.slice(startIndex, endIndex);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusBadge = (status: Document["status"]) => {
    switch (status) {
      case "processing":
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-100 dark:bg-blue-950 border border-blue-300 dark:border-blue-700">
            <Loader2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 animate-spin" />
            <span className="text-xs font-medium text-blue-700 dark:text-blue-300 font-['Inter']">
              Processing
            </span>
          </div>
        );
      case "active":
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300 font-['Inter']">
              Active
            </span>
          </div>
        );
      case "error":
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-100 dark:bg-red-950 border border-red-300 dark:border-red-700">
            <AlertCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
            <span className="text-xs font-medium text-red-700 dark:text-red-300 font-['Inter']">
              Error
            </span>
          </div>
        );
      case "deleted":
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 font-['Inter']">
              Deleted
            </span>
          </div>
        );
    }
  };

  const getFileExtension = (filename: string): string => {
    const parts = filename.split(".");
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : "FILE";
  };

  if (documents.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center">
        <div className="max-w-sm mx-auto space-y-4">
          <div className="mx-auto w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
            <FileText className="w-10 h-10 text-slate-400 dark:text-slate-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2 font-['Space_Grotesk']">
              No documents yet
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-['Inter']">
              Upload your first document to get started with your AI knowledge
              base
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Document Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        {/* Table Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <div className="grid grid-cols-12 gap-4 px-6 py-3">
            <div className="col-span-5 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-['Inter']">
              Document
            </div>
            <div className="col-span-2 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-['Inter']">
              Status
            </div>
            <div className="col-span-2 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-['Inter']">
              Size
            </div>
            <div className="col-span-2 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-['Inter']">
              Uploaded
            </div>
            <div className="col-span-1 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-['Inter'] text-right">
              Actions
            </div>
          </div>
        </div>

        {/* Document Rows */}
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {currentDocuments.map((doc) => (
            <button
              type="button"
              key={doc.document_id}
              className={`grid grid-cols-12 gap-4 px-6 py-4 transition-all duration-200 w-full text-left ${
                hoveredDoc === doc.document_id
                  ? "bg-slate-50 dark:bg-slate-800/50"
                  : "hover:bg-slate-50 dark:hover:bg-slate-800/30"
              }`}
              onMouseEnter={() => setHoveredDoc(doc.document_id)}
              onMouseLeave={() => setHoveredDoc(null)}
              onClick={() => onDocumentClick?.(doc.document_id)}
            >
              {/* Document Name & Type */}
              <div className="col-span-5 flex items-center gap-3 min-w-0">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-950 dark:to-purple-950 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300 font-['Fira_Code']">
                      {getFileExtension(doc.filename)}
                    </span>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate font-['Inter'] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {doc.filename}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-['Fira_Code'] mt-0.5">
                    {doc.document_id}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="col-span-2 flex items-center">
                {getStatusBadge(doc.status)}
              </div>

              {/* Size & Chunks */}
              <div className="col-span-2 flex flex-col justify-center">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 font-['Fira_Code']">
                  {formatFileSize(doc.size_bytes)}
                </p>
                {doc.status === "active" && doc.chunks_count > 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-['Fira_Code']">
                    {doc.chunks_count} chunks
                  </p>
                )}
                {doc.status === "error" && doc.error_message && (
                  <p className="text-xs text-red-600 dark:text-red-400 font-['Inter'] truncate">
                    {doc.error_message}
                  </p>
                )}
              </div>

              {/* Upload Time */}
              <div className="col-span-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-slate-700 dark:text-slate-300 font-['Inter']">
                    {formatDistanceToNow(new Date(doc.uploaded_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="col-span-1 flex items-center justify-end">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Show dropdown menu
                  }}
                  className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors opacity-0 group-hover:opacity-100"
                  aria-label="Document actions"
                >
                  <MoreVertical className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </button>
                {hoveredDoc === doc.document_id && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (
                        confirm(
                          `Delete "${doc.filename}"? This action cannot be undone.`,
                        )
                      ) {
                        onDeleteDocument?.(doc.document_id);
                      }
                    }}
                    className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-950 transition-colors"
                    aria-label="Delete document"
                  >
                    <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </button>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="text-sm text-slate-600 dark:text-slate-400 font-['Inter']">
            Showing {startIndex + 1}-{Math.min(endIndex, documents.length)} of{" "}
            {documents.length} documents
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="gap-2 font-['Inter']"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <div className="text-sm text-slate-700 dark:text-slate-300 font-['Fira_Code'] px-3">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="gap-2 font-['Inter']"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
