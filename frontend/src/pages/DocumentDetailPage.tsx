/**
 * Document Detail Page - Data Forensics Lab
 * High-tech document analysis interface with metadata visualization
 * Fonts: Geist (sans), Geist Mono (mono)
 */

import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Edit3,
  FileText,
  FolderOpen,
  HardDrive,
  Hash,
  Layers,
  Loader2,
  RefreshCw,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { useCollections } from "../hooks/useCollections";
import {
  useDeleteDocument,
  useDocument,
  useRetryDocument,
  useUpdateDocument,
} from "../hooks/useDocuments";
export function DocumentDetailPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();

  // Fetch document data
  const { data: document, isLoading, error } = useDocument(documentId);

  // Fetch collections for edit modal
  const { data: collectionsData } = useCollections();

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
    tags: document?.tags?.join(", ") || "",
  });

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground font-mono">
            Loading document data...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !document) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold text-foreground">
            Document Not Found
          </h2>
          <p className="text-muted-foreground font-mono">
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
    <div className="min-h-screen bg-background text-foreground relative overflow-x-hidden">
      {/* Animated Grid Background */}
      <div className="fixed inset-0 opacity-10 dark:opacity-20 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, hsl(var(--muted) / 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--muted) / 0.1) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
            animation: "gridPulse 8s ease-in-out infinite",
          }}
        />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          type="button"
          onClick={() => navigate("/documents")}
          className="group flex items-center gap-2 mb-6 px-4 py-2 rounded-lg bg-card border border-border hover:border-primary/40 hover:bg-muted transition-all duration-300"
        >
          <ArrowLeft className="w-4 h-4 text-primary group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-sans font-semibold text-primary tracking-wide">
            BACK TO ARCHIVE
          </span>
        </button>

        {/* Document Header */}
        <div className="mb-8 p-6 rounded-xl bg-card border border-border backdrop-blur-sm">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                <h1 className="text-2xl font-bold font-sans text-foreground tracking-tight break-words">
                  {document.filename}
                </h1>
              </div>
              <p className="text-xs font-mono text-muted-foreground">
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
                  className={`text-xs font-bold font-sans tracking-wide ${statusConfig.color}`}
                >
                  {statusConfig.label}
                </span>
              </div>

              {/* Edit Button */}
              <Button
                onClick={() => setIsEditModalOpen(true)}
                variant="outline"
                size="sm"
                className="gap-2 border-primary/40 text-primary hover:bg-primary/10 hover:border-primary/70 font-sans font-semibold"
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
                  className="gap-2 border-primary/40 text-primary hover:bg-primary/10 hover:border-primary/70 disabled:opacity-50 font-sans font-semibold"
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
                className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 hover:border-destructive/70 font-sans font-semibold"
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
          <div className="p-4 rounded-lg bg-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="w-4 h-4 text-primary" />
              <span className="text-xs font-sans font-semibold text-primary tracking-wide">
                FILE SIZE
              </span>
            </div>
            <p className="text-lg font-mono font-bold text-foreground">
              {formatFileSize(document.size_bytes)}
            </p>
            <p className="text-xs font-mono text-muted-foreground mt-1">
              {document.size_bytes.toLocaleString()} bytes
            </p>
          </div>

          {/* Chunks Count */}
          <div className="p-4 rounded-lg bg-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-4 h-4 text-primary" />
              <span className="text-xs font-sans font-semibold text-primary tracking-wide">
                CHUNKS
              </span>
            </div>
            <p className="text-lg font-mono font-bold text-foreground">
              {document.chunks_count}
            </p>
            <p className="text-xs font-mono text-muted-foreground mt-1">
              Vector segments
            </p>
          </div>

          {/* MIME Type */}
          <div className="p-4 rounded-lg bg-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Hash className="w-4 h-4 text-primary" />
              <span className="text-xs font-sans font-semibold text-primary tracking-wide">
                FILE TYPE
              </span>
            </div>
            <p className="text-lg font-mono font-bold text-foreground">
              {document.file_type.split("/")[1]?.toUpperCase() ||
                document.file_type.toUpperCase()}
            </p>
            <p className="text-xs font-mono text-muted-foreground mt-1">
              {document.file_type}
            </p>
          </div>

          {/* Uploaded At */}
          <div className="p-4 rounded-lg bg-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-xs font-sans font-semibold text-primary tracking-wide">
                UPLOADED
              </span>
            </div>
            <p className="text-sm font-mono font-bold text-foreground">
              {formatDate(document.uploaded_at)}
            </p>
          </div>

          {/* Processed At */}
          <div className="p-4 rounded-lg bg-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-xs font-sans font-semibold text-primary tracking-wide">
                PROCESSED
              </span>
            </div>
            <p className="text-sm font-mono font-bold text-foreground">
              {document.processed_at
                ? formatDate(document.processed_at)
                : "N/A"}
            </p>
          </div>

          {/* Collection */}
          <div className="p-4 rounded-lg bg-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <FolderOpen className="w-4 h-4 text-primary" />
              <span className="text-xs font-sans font-semibold text-primary tracking-wide">
                COLLECTION
              </span>
            </div>
            <p className="text-sm font-mono font-bold text-foreground">
              {document.collection_name || "None"}
            </p>
          </div>
        </div>

        {/* Category & Tags */}
        <div className="mb-8 p-6 rounded-xl bg-card border border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-primary" />
                <span className="text-sm font-sans font-semibold text-primary tracking-wide">
                  CATEGORY
                </span>
              </div>
              <div className="inline-block px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30">
                <span className="text-sm font-mono font-semibold text-primary">
                  {document.category || "uncategorized"}
                </span>
              </div>
            </div>

            {/* Tags */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-primary" />
                <span className="text-sm font-sans font-semibold text-primary tracking-wide">
                  TAGS
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {document.tags && document.tags.length > 0 ? (
                  document.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-sm font-mono font-semibold text-primary"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-sm font-mono text-muted-foreground">
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
                <Layers className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold font-sans text-foreground tracking-tight">
                  CONTENT CHUNKS
                </h2>
                <span className="px-2 py-1 rounded bg-cyan-100 dark:bg-cyan-500/20 border border-cyan-600/40 dark:border-cyan-500/30 text-xs font-mono font-bold text-primary">
                  {document.chunks_count}
                </span>
              </div>

              {/* Show All Toggle */}
              {(document.chunks?.length ?? 0) > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllChunks(!showAllChunks)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border hover:border-primary/40 hover:bg-muted transition-all duration-300"
                >
                  <span className="text-sm font-sans font-semibold text-primary">
                    {showAllChunks ? "SHOW LESS" : "SHOW ALL"}
                  </span>
                  {showAllChunks ? (
                    <ChevronUp className="w-4 h-4 text-primary" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-primary" />
                  )}
                </button>
              )}
            </div>

            {/* Chunks List */}
            <div className="space-y-4">
              {chunksToShow.map((chunk, index) => (
                <div
                  key={chunk.chunk_id}
                  className="p-4 rounded-lg bg-card border border-border hover:border-primary/40 transition-all duration-300"
                  style={{
                    animation: `fadeSlideIn 0.3s ease-out ${index * 0.05}s both`,
                  }}
                >
                  {/* Chunk Header */}
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-border">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-cyan-100 dark:bg-cyan-500/20 border border-cyan-600/40 dark:border-cyan-500/30 flex items-center justify-center">
                        <span className="text-xs font-mono font-bold text-primary">
                          {chunk.chunk_index + 1}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-muted-foreground">
                        Chunk ID: {chunk.chunk_id}
                      </span>
                    </div>
                    {chunk.metadata && (
                      <div className="flex items-center gap-2">
                        {typeof chunk.metadata === "object" &&
                          "page" in chunk.metadata && (
                            <span className="text-xs font-mono text-muted-foreground">
                              Page {String(chunk.metadata.page)}
                            </span>
                          )}
                        {typeof chunk.metadata === "object" &&
                          "section" in chunk.metadata && (
                            <span className="px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-500/10 border border-border text-xs font-mono text-primary">
                              {String(chunk.metadata.section)}
                            </span>
                          )}
                      </div>
                    )}
                  </div>

                  {/* Chunk Content */}
                  <div className="font-mono text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {chunk.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Show More Indicator */}
            {!showAllChunks && (document.chunks?.length ?? 0) > 5 && (
              <div className="mt-4 text-center">
                <p className="text-sm font-mono text-muted-foreground">
                  Showing 5 of {document.chunks_count} chunks
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Metadata Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div
            className="w-full max-w-lg p-6 rounded-xl bg-card border-2 border-primary/60 shadow-2xl shadow-primary/30"
            style={{ animation: "modalFadeIn 0.2s ease-out" }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold font-sans text-foreground">
                EDIT METADATA
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
              >
                <X className="w-5 h-5 text-primary" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* Collection */}
              <div>
                <Label className="text-sm font-sans font-semibold text-primary mb-2 block">
                  COLLECTION
                </Label>
                <Select
                  value={editForm.collection_id}
                  onValueChange={(value) =>
                    setEditForm({ ...editForm, collection_id: value })
                  }
                >
                  <SelectTrigger className="w-full bg-background border-2 border-primary/40 text-foreground font-mono hover:border-primary/60 transition-colors">
                    <SelectValue placeholder="Select a collection" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-2 border-primary/40 text-foreground">
                    {collectionsData?.collections &&
                    collectionsData.collections.length > 0 ? (
                      collectionsData.collections.map((collection) => (
                        <SelectItem
                          key={collection.collection_id}
                          value={collection.collection_id}
                          className="text-foreground focus:bg-primary/10 focus:text-primary cursor-pointer"
                        >
                          {collection.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No collections available
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div>
                <Label
                  htmlFor="category"
                  className="text-sm font-sans font-semibold text-primary mb-2 block"
                >
                  CATEGORY
                </Label>
                <Input
                  id="category"
                  value={editForm.category}
                  onChange={(e) =>
                    setEditForm({ ...editForm, category: e.target.value })
                  }
                  className="bg-background border-2 border-primary/40 text-foreground font-mono focus:border-primary/60 transition-colors"
                  placeholder="e.g., financial, technical, research"
                />
              </div>

              {/* Tags */}
              <div>
                <Label
                  htmlFor="tags"
                  className="text-sm font-sans font-semibold text-primary mb-2 block"
                >
                  TAGS
                </Label>
                <Input
                  id="tags"
                  value={editForm.tags}
                  onChange={(e) =>
                    setEditForm({ ...editForm, tags: e.target.value })
                  }
                  className="bg-background border-2 border-primary/40 text-foreground font-mono focus:border-primary/60 transition-colors"
                  placeholder="Comma-separated tags"
                />
                <p className="text-xs font-mono text-muted-foreground mt-1">
                  Separate tags with commas
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 mt-6">
              <Button
                onClick={handleSaveMetadata}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-sans font-bold"
              >
                SAVE CHANGES
              </Button>
              <Button
                onClick={() => setIsEditModalOpen(false)}
                variant="outline"
                className="flex-1 border-border text-foreground hover:bg-muted font-sans font-bold"
              >
                CANCEL
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div
            className="w-full max-w-md p-6 rounded-xl bg-card border-2 border-destructive/60 shadow-2xl shadow-destructive/30"
            style={{ animation: "modalFadeIn 0.2s ease-out" }}
          >
            {/* Warning Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-destructive/10 border-2 border-destructive/40 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
            </div>

            {/* Modal Header */}
            <h3 className="text-xl font-bold font-sans text-destructive text-center mb-2">
              DELETE DOCUMENT?
            </h3>
            <p className="text-sm font-mono text-destructive/80 text-center mb-6">
              This action cannot be undone. All chunks and metadata will be
              permanently deleted.
            </p>

            {/* Document Info */}
            <div className="mb-6 p-3 rounded-lg bg-destructive/10 border border-red-600/30 dark:border-red-500/20">
              <p className="text-sm font-mono text-destructive break-words">
                {document.filename}
              </p>
              <p className="text-xs font-mono text-destructive/60 mt-1">
                {document.chunks_count} chunks •{" "}
                {formatFileSize(document.size_bytes)}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button
                onClick={handleDelete}
                className="flex-1 bg-destructive hover:bg-destructive/80 text-destructive-foreground font-sans font-bold border-2 border-destructive hover:border-destructive/80 transition-all"
              >
                DELETE
              </Button>
              <Button
                onClick={() => setIsDeleteModalOpen(false)}
                variant="outline"
                className="flex-1 border-2 border-border text-foreground hover:bg-muted hover:border-primary/40 font-sans font-bold transition-all"
              >
                CANCEL
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Styles */}
      <style>{`
        @keyframes gridPulse {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.3; }
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
