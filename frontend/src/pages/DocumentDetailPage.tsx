/**
 * Document Detail Page - Data Forensics Lab
 * High-tech document analysis interface with metadata visualization
 * Fonts: JetBrains Mono (data), IBM Plex Sans Condensed (headers), Courier New (code)
 */

import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Database,
  Edit3,
  FileText,
  FolderOpen,
  HardDrive,
  Hash,
  Layers,
  Loader2,
  LogOut,
  Moon,
  RefreshCw,
  Sun,
  Tag,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useDarkMode } from "../hooks/useDarkMode";
import {
  useDeleteDocument,
  useDocument,
  useRetryDocument,
  useUpdateDocument,
} from "../hooks/useDocuments";
import { useAuthStore } from "../store/authStore";

// Mock collections for edit modal - TODO: Replace with collections API
const mockCollections = [
  { collection_id: "research-papers", name: "Research Papers" },
  { collection_id: "meeting-notes", name: "Meeting Notes" },
  { collection_id: "technical-docs", name: "Technical Documentation" },
];

export function DocumentDetailPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { darkMode, toggleDarkMode } = useDarkMode();

  // Fetch document data
  const { data: document, isLoading, error } = useDocument(documentId);

  // API mutations
  const deleteDocumentMutation = useDeleteDocument();
  const retryDocumentMutation = useRetryDocument();
  const updateDocumentMutation = useUpdateDocument();

  const [showAllChunks, setShowAllChunks] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Edit form state - initialize from document data
  const [editForm, setEditForm] = useState({
    collection_id: document?.collection_id || "",
    category: document?.category || "",
    tags: document?.tags.join(", ") || "",
  });

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleRetry = async () => {
    if (!documentId) return;
    await retryDocumentMutation.mutateAsync(documentId);
  };

  const handleDelete = async () => {
    if (!documentId) return;
    await deleteDocumentMutation.mutateAsync(documentId);
    navigate("/documents");
  };

  const handleSaveMetadata = async () => {
    if (!documentId) return;
    await updateDocumentMutation.mutateAsync({
      documentId,
      updates: {
        collection_id: editForm.collection_id || null,
        category: editForm.category || null,
        tags: editForm.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      },
    });
    setIsEditModalOpen(false);
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "active":
        return {
          label: "ACTIVE",
          icon: CheckCircle2,
          color: "text-emerald-500",
          bg: "bg-emerald-500/10",
          border: "border-emerald-500/30",
        };
      case "processing":
        return {
          label: "PROCESSING",
          icon: Loader2,
          color: "text-blue-500",
          bg: "bg-blue-500/10",
          border: "border-blue-500/30",
        };
      case "error":
        return {
          label: "ERROR",
          icon: AlertCircle,
          color: "text-red-500",
          bg: "bg-red-500/10",
          border: "border-red-500/30",
        };
      default:
        return {
          label: "UNKNOWN",
          icon: AlertCircle,
          color: "text-slate-500",
          bg: "bg-slate-500/10",
          border: "border-slate-500/30",
        };
    }
  };

  const statusConfig = getStatusConfig(document?.status || "unknown");
  const StatusIcon = statusConfig.icon;

  const chunksToShow = showAllChunks
    ? document?.chunks || []
    : (document?.chunks || []).slice(0, 5);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-cyan-600 dark:text-cyan-400 mx-auto" />
          <p className="text-slate-600 dark:text-slate-400 font-mono">
            Loading document data...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !document) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Document Not Found
          </h2>
          <p className="text-slate-600 dark:text-slate-400 font-mono">
            Failed to load document. It may have been deleted.
          </p>
          <Button onClick={() => navigate("/documents")} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Documents
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 relative overflow-x-hidden">
      {/* Animated Grid Background */}
      <div className="fixed inset-0 opacity-10 dark:opacity-20 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgb(34 211 238 / 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgb(34 211 238 / 0.1) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
            animation: "gridPulse 8s ease-in-out infinite",
          }}
        />
      </div>

      {/* Scan Line Effect */}
      <div
        className="fixed inset-0 pointer-events-none opacity-15 dark:opacity-30"
        style={{
          background:
            "linear-gradient(to bottom, transparent 0%, rgba(34, 211, 238, 0.05) 50%, transparent 100%)",
          animation: "scanLine 6s linear infinite",
        }}
      />

      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 border-b border-cyan-600/40 dark:border-cyan-500/30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Logo & Brand */}
          <Link to="/documents" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
              <Database className="w-6 h-6 text-white" />
              <div className="absolute inset-0 rounded bg-cyan-400/20 blur-md animate-pulse" />
            </div>
            <div>
              <span className="block text-sm font-bold font-['IBM_Plex_Sans_Condensed'] tracking-wider text-cyan-600 dark:text-cyan-400">
                {"FORENSICS//LAB"}
              </span>
              <span className="block text-[10px] font-mono text-cyan-700/70 dark:text-cyan-500/60">
                DOCUMENT ANALYSIS
              </span>
            </div>
          </Link>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {/* Dark Mode Toggle - Hidden on mobile */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="hidden lg:flex p-2 rounded-lg hover:bg-cyan-500/10 transition-colors border border-cyan-600/30 dark:border-cyan-500/20"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              ) : (
                <Moon className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              )}
            </button>

            {/* User Menu - Hidden on mobile */}
            <div className="hidden lg:flex items-center gap-3 px-3 py-2 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-600/30 dark:border-cyan-500/20">
              <User className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              <span className="text-sm font-medium text-cyan-900 dark:text-cyan-100 font-['JetBrains_Mono']">
                {user?.email}
              </span>
            </div>

            {/* Logout Button - Hidden on mobile */}
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="hidden lg:flex gap-2 border-red-600/40 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-600/70 dark:hover:border-red-500/50 transition-all duration-300 font-['IBM_Plex_Sans_Condensed'] font-semibold"
            >
              <LogOut className="w-4 h-4" />
              <span>LOGOUT</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          type="button"
          onClick={() => navigate("/documents")}
          className="group flex items-center gap-2 mb-6 px-4 py-2 rounded-lg bg-white dark:bg-slate-800/50 border border-cyan-600/30 dark:border-cyan-500/20 hover:border-cyan-600/60 dark:hover:border-cyan-500/40 hover:bg-cyan-50/50 dark:hover:bg-slate-800/70 transition-all duration-300"
        >
          <ArrowLeft className="w-4 h-4 text-cyan-600 dark:text-cyan-400 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-['IBM_Plex_Sans_Condensed'] font-semibold text-cyan-600 dark:text-cyan-400 tracking-wide">
            BACK TO ARCHIVE
          </span>
        </button>

        {/* Document Header */}
        <div className="mb-8 p-6 rounded-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800/80 dark:to-slate-900/80 border border-cyan-600/30 dark:border-cyan-500/20 backdrop-blur-sm">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
                <h1 className="text-2xl font-bold font-['IBM_Plex_Sans_Condensed'] text-cyan-900 dark:text-cyan-100 tracking-tight break-words">
                  {document.filename}
                </h1>
              </div>
              <p className="text-xs font-mono text-cyan-500/60 dark:text-cyan-500/60 text-cyan-700/70">
                ID: {document.document_id}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Status Badge */}
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${statusConfig.bg} ${statusConfig.border}`}
              >
                <StatusIcon
                  className={`w-4 h-4 ${statusConfig.color} ${
                    document.status === "processing" ? "animate-spin" : ""
                  }`}
                />
                <span
                  className={`text-xs font-bold font-['IBM_Plex_Sans_Condensed'] tracking-wide ${statusConfig.color}`}
                >
                  {statusConfig.label}
                </span>
              </div>

              {/* Edit Button */}
              <Button
                onClick={() => setIsEditModalOpen(true)}
                variant="outline"
                size="sm"
                className="gap-2 border-cyan-600/40 dark:border-cyan-500/30 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 hover:border-cyan-600/70 dark:hover:border-cyan-500/50 font-['IBM_Plex_Sans_Condensed'] font-semibold"
              >
                <Edit3 className="w-4 h-4" />
                <span className="hidden sm:inline">EDIT</span>
              </Button>

              {/* Retry Button (for error status) */}
              {document.status === "error" && (
                <Button
                  onClick={handleRetry}
                  disabled={retryDocumentMutation.isPending}
                  variant="outline"
                  size="sm"
                  className="gap-2 border-blue-500/30 dark:border-blue-500/30 border-blue-600/40 text-blue-400 dark:text-blue-400 text-blue-600 hover:bg-blue-500/10 dark:hover:bg-blue-500/10 hover:bg-blue-50 hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:border-blue-600/70 disabled:opacity-50 font-['IBM_Plex_Sans_Condensed'] font-semibold"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${retryDocumentMutation.isPending ? "animate-spin" : ""}`}
                  />
                  <span className="hidden sm:inline">
                    {retryDocumentMutation.isPending ? "RETRYING..." : "RETRY"}
                  </span>
                </Button>
              )}

              {/* Delete Button */}
              <Button
                onClick={() => setIsDeleteModalOpen(true)}
                variant="outline"
                size="sm"
                className="gap-2 border-red-600/40 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/10 hover:bg-red-50 hover:border-red-500/50 dark:hover:border-red-500/50 hover:border-red-600/70 font-['IBM_Plex_Sans_Condensed'] font-semibold"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">DELETE</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {/* File Size */}
          <div className="p-4 rounded-lg bg-white dark:bg-slate-800/50 border border-cyan-600/30 dark:border-cyan-500/20">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span className="text-xs font-['IBM_Plex_Sans_Condensed'] font-semibold text-cyan-700 dark:text-cyan-500 tracking-wide">
                FILE SIZE
              </span>
            </div>
            <p className="text-lg font-mono font-bold text-cyan-900 dark:text-cyan-100">
              {formatFileSize(document.size_bytes)}
            </p>
            <p className="text-xs font-mono text-cyan-500/60 dark:text-cyan-500/60 text-cyan-700/70 mt-1">
              {document.size_bytes.toLocaleString()} bytes
            </p>
          </div>

          {/* Chunks Count */}
          <div className="p-4 rounded-lg bg-white dark:bg-slate-800/50 border border-cyan-600/30 dark:border-cyan-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span className="text-xs font-['IBM_Plex_Sans_Condensed'] font-semibold text-cyan-700 dark:text-cyan-500 tracking-wide">
                CHUNKS
              </span>
            </div>
            <p className="text-lg font-mono font-bold text-cyan-900 dark:text-cyan-100">
              {document.chunks_count}
            </p>
            <p className="text-xs font-mono text-cyan-500/60 dark:text-cyan-500/60 text-cyan-700/70 mt-1">
              Vector segments
            </p>
          </div>

          {/* MIME Type */}
          <div className="p-4 rounded-lg bg-white dark:bg-slate-800/50 border border-cyan-600/30 dark:border-cyan-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Hash className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span className="text-xs font-['IBM_Plex_Sans_Condensed'] font-semibold text-cyan-700 dark:text-cyan-500 tracking-wide">
                FILE TYPE
              </span>
            </div>
            <p className="text-lg font-mono font-bold text-cyan-900 dark:text-cyan-100">
              {document.file_type.split("/")[1].toUpperCase()}
            </p>
            <p className="text-xs font-mono text-cyan-500/60 dark:text-cyan-500/60 text-cyan-700/70 mt-1">
              {document.file_type}
            </p>
          </div>

          {/* Uploaded At */}
          <div className="p-4 rounded-lg bg-white dark:bg-slate-800/50 border border-cyan-600/30 dark:border-cyan-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span className="text-xs font-['IBM_Plex_Sans_Condensed'] font-semibold text-cyan-700 dark:text-cyan-500 tracking-wide">
                UPLOADED
              </span>
            </div>
            <p className="text-sm font-mono font-bold text-cyan-900 dark:text-cyan-100">
              {formatDate(document.uploaded_at)}
            </p>
          </div>

          {/* Processed At */}
          <div className="p-4 rounded-lg bg-white dark:bg-slate-800/50 border border-cyan-600/30 dark:border-cyan-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span className="text-xs font-['IBM_Plex_Sans_Condensed'] font-semibold text-cyan-700 dark:text-cyan-500 tracking-wide">
                PROCESSED
              </span>
            </div>
            <p className="text-sm font-mono font-bold text-cyan-900 dark:text-cyan-100">
              {document.processed_at
                ? formatDate(document.processed_at)
                : "N/A"}
            </p>
          </div>

          {/* Collection */}
          <div className="p-4 rounded-lg bg-white dark:bg-slate-800/50 border border-cyan-600/30 dark:border-cyan-500/20">
            <div className="flex items-center gap-2 mb-2">
              <FolderOpen className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span className="text-xs font-['IBM_Plex_Sans_Condensed'] font-semibold text-cyan-700 dark:text-cyan-500 tracking-wide">
                COLLECTION
              </span>
            </div>
            <p className="text-sm font-mono font-bold text-cyan-900 dark:text-cyan-100">
              {document.collection_name || "None"}
            </p>
          </div>
        </div>

        {/* Category & Tags */}
        <div className="mb-8 p-6 rounded-xl bg-white dark:bg-slate-800/50 border border-cyan-600/30 dark:border-cyan-500/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span className="text-sm font-['IBM_Plex_Sans_Condensed'] font-semibold text-cyan-700 dark:text-cyan-500 tracking-wide">
                  CATEGORY
                </span>
              </div>
              <div className="inline-block px-3 py-1.5 rounded-lg bg-cyan-100 dark:bg-cyan-500/10 border border-cyan-600/40 dark:border-cyan-500/30">
                <span className="text-sm font-mono font-semibold text-cyan-800 dark:text-cyan-300">
                  {document.category || "uncategorized"}
                </span>
              </div>
            </div>

            {/* Tags */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span className="text-sm font-['IBM_Plex_Sans_Condensed'] font-semibold text-cyan-700 dark:text-cyan-500 tracking-wide">
                  TAGS
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {document.tags.length > 0 ? (
                  document.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1.5 rounded-lg bg-cyan-100 dark:bg-cyan-500/10 border border-cyan-600/40 dark:border-cyan-500/30 text-sm font-mono font-semibold text-cyan-800 dark:text-cyan-300"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-sm font-mono text-cyan-500/60 dark:text-cyan-500/60 text-cyan-700/70">
                    No tags
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chunks Section */}
        {document.chunks && document.chunks.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Layers className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <h2 className="text-xl font-bold font-['IBM_Plex_Sans_Condensed'] text-cyan-900 dark:text-cyan-100 tracking-tight">
                  CONTENT CHUNKS
                </h2>
                <span className="px-2 py-1 rounded bg-cyan-100 dark:bg-cyan-500/20 border border-cyan-600/40 dark:border-cyan-500/30 text-xs font-mono font-bold text-cyan-800 dark:text-cyan-300">
                  {document.chunks_count}
                </span>
              </div>

              {/* Show All Toggle */}
              {document.chunks.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllChunks(!showAllChunks)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-slate-800/50 border border-cyan-600/30 dark:border-cyan-500/20 hover:border-cyan-600/60 dark:hover:border-cyan-500/40 hover:bg-cyan-50/50 dark:hover:bg-slate-800/70 transition-all duration-300"
                >
                  <span className="text-sm font-['IBM_Plex_Sans_Condensed'] font-semibold text-cyan-600 dark:text-cyan-400">
                    {showAllChunks ? "SHOW LESS" : "SHOW ALL"}
                  </span>
                  {showAllChunks ? (
                    <ChevronUp className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  )}
                </button>
              )}
            </div>

            {/* Chunks List */}
            <div className="space-y-4">
              {chunksToShow.map((chunk, index) => (
                <div
                  key={chunk.chunk_id}
                  className="p-4 rounded-lg bg-white dark:bg-slate-800/50 border border-cyan-600/30 dark:border-cyan-500/20 hover:border-cyan-600/60 dark:hover:border-cyan-500/40 transition-all duration-300"
                  style={{
                    animation: `fadeSlideIn 0.3s ease-out ${index * 0.05}s both`,
                  }}
                >
                  {/* Chunk Header */}
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-cyan-600/30 dark:border-cyan-500/20">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-cyan-100 dark:bg-cyan-500/20 border border-cyan-600/40 dark:border-cyan-500/30 flex items-center justify-center">
                        <span className="text-xs font-mono font-bold text-cyan-800 dark:text-cyan-300">
                          {chunk.chunk_index + 1}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-cyan-500/60 dark:text-cyan-500/60 text-cyan-700/70">
                        Chunk ID: {chunk.chunk_id}
                      </span>
                    </div>
                    {chunk.metadata && (
                      <div className="flex items-center gap-2">
                        {typeof chunk.metadata === "object" &&
                          "page" in chunk.metadata && (
                            <span className="text-xs font-mono text-cyan-500/60 dark:text-cyan-500/60 text-cyan-700/70">
                              Page {String(chunk.metadata.page)}
                            </span>
                          )}
                        {typeof chunk.metadata === "object" &&
                          "section" in chunk.metadata && (
                            <span className="px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-500/10 border border-cyan-600/30 dark:border-cyan-500/20 text-xs font-mono text-cyan-700 dark:text-cyan-400">
                              {String(chunk.metadata.section)}
                            </span>
                          )}
                      </div>
                    )}
                  </div>

                  {/* Chunk Content */}
                  <div className="font-['Courier_New'] text-sm text-cyan-100/90 dark:text-cyan-100/90 text-cyan-900 leading-relaxed whitespace-pre-wrap">
                    {chunk.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Show More Indicator */}
            {!showAllChunks && document.chunks.length > 5 && (
              <div className="mt-4 text-center">
                <p className="text-sm font-mono text-cyan-500/60 dark:text-cyan-500/60 text-cyan-700/70">
                  Showing 5 of {document.chunks_count} chunks
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Metadata Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 dark:bg-black/80 backdrop-blur-sm">
          <div
            className="w-full max-w-lg p-6 rounded-xl bg-white dark:bg-slate-800 border border-cyan-600/40 dark:border-cyan-500/30 shadow-2xl shadow-cyan-500/20 dark:shadow-cyan-500/20 shadow-cyan-600/30"
            style={{ animation: "modalFadeIn 0.2s ease-out" }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold font-['IBM_Plex_Sans_Condensed'] text-cyan-900 dark:text-cyan-100">
                EDIT METADATA
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 rounded-lg hover:bg-cyan-100 dark:hover:bg-cyan-500/10 transition-colors"
              >
                <X className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* Collection */}
              <div>
                <Label className="text-sm font-['IBM_Plex_Sans_Condensed'] font-semibold text-cyan-700 dark:text-cyan-400 mb-2 block">
                  COLLECTION
                </Label>
                <Select
                  value={editForm.collection_id}
                  onValueChange={(value) =>
                    setEditForm({ ...editForm, collection_id: value })
                  }
                >
                  <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-900 border-cyan-600/40 dark:border-cyan-500/30 text-cyan-900 dark:text-cyan-100 font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {mockCollections.map((collection) => (
                      <SelectItem
                        key={collection.collection_id}
                        value={collection.collection_id}
                      >
                        {collection.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div>
                <Label
                  htmlFor="category"
                  className="text-sm font-['IBM_Plex_Sans_Condensed'] font-semibold text-cyan-700 dark:text-cyan-400 mb-2 block"
                >
                  CATEGORY
                </Label>
                <Input
                  id="category"
                  value={editForm.category}
                  onChange={(e) =>
                    setEditForm({ ...editForm, category: e.target.value })
                  }
                  className="bg-slate-50 dark:bg-slate-900 border-cyan-600/40 dark:border-cyan-500/30 text-cyan-900 dark:text-cyan-100 font-mono"
                  placeholder="e.g., financial, technical, research"
                />
              </div>

              {/* Tags */}
              <div>
                <Label
                  htmlFor="tags"
                  className="text-sm font-['IBM_Plex_Sans_Condensed'] font-semibold text-cyan-700 dark:text-cyan-400 mb-2 block"
                >
                  TAGS
                </Label>
                <Input
                  id="tags"
                  value={editForm.tags}
                  onChange={(e) =>
                    setEditForm({ ...editForm, tags: e.target.value })
                  }
                  className="bg-slate-50 dark:bg-slate-900 border-cyan-600/40 dark:border-cyan-500/30 text-cyan-900 dark:text-cyan-100 font-mono"
                  placeholder="Comma-separated tags"
                />
                <p className="text-xs font-mono text-cyan-500/60 dark:text-cyan-500/60 text-cyan-700/70 mt-1">
                  Separate tags with commas
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 mt-6">
              <Button
                onClick={handleSaveMetadata}
                className="flex-1 bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-500 dark:hover:bg-cyan-600 bg-cyan-600 hover:bg-cyan-700 text-slate-900 dark:text-slate-900 text-white font-['IBM_Plex_Sans_Condensed'] font-bold"
              >
                SAVE CHANGES
              </Button>
              <Button
                onClick={() => setIsEditModalOpen(false)}
                variant="outline"
                className="flex-1 border-cyan-600/40 dark:border-cyan-500/30 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-500/10 font-['IBM_Plex_Sans_Condensed'] font-bold"
              >
                CANCEL
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 dark:bg-black/80 backdrop-blur-sm">
          <div
            className="w-full max-w-md p-6 rounded-xl bg-white dark:bg-slate-800 border border-red-600/40 dark:border-red-500/30 shadow-2xl shadow-red-500/20 dark:shadow-red-500/20 shadow-red-600/30"
            style={{ animation: "modalFadeIn 0.2s ease-out" }}
          >
            {/* Warning Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-500/20 border-2 border-red-600/50 dark:border-red-500/40 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
            </div>

            {/* Modal Header */}
            <h3 className="text-xl font-bold font-['IBM_Plex_Sans_Condensed'] text-red-900 dark:text-red-100 text-center mb-2">
              DELETE DOCUMENT?
            </h3>
            <p className="text-sm font-mono text-red-700/90 dark:text-red-400/80 text-center mb-6">
              This action cannot be undone. All chunks and metadata will be
              permanently deleted.
            </p>

            {/* Document Info */}
            <div className="mb-6 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-600/30 dark:border-red-500/20">
              <p className="text-sm font-mono text-red-900 dark:text-red-100 break-words">
                {document.filename}
              </p>
              <p className="text-xs font-mono text-red-700/70 dark:text-red-400/60 mt-1">
                {document.chunks_count} chunks •{" "}
                {formatFileSize(document.size_bytes)}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button
                onClick={handleDelete}
                className="flex-1 bg-red-500 hover:bg-red-600 dark:bg-red-500 dark:hover:bg-red-600 bg-red-600 hover:bg-red-700 text-white font-['IBM_Plex_Sans_Condensed'] font-bold"
              >
                DELETE
              </Button>
              <Button
                onClick={() => setIsDeleteModalOpen(false)}
                variant="outline"
                className="flex-1 border-slate-600 dark:border-slate-600 border-slate-400 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-['IBM_Plex_Sans_Condensed'] font-bold"
              >
                CANCEL
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Condensed:wght@400;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');

        @keyframes gridPulse {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.3; }
        }

        @keyframes scanLine {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }

        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
