import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Edit3,
  FileText,
  FolderOpen,
  HardDrive,
  Layers,
  Loader2,
  RefreshCw,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

const STATUS_CONFIG = {
  active: {
    label: "Active",
    dot: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800",
    icon: CheckCircle2,
    spin: false,
  },
  processing: {
    label: "Processing",
    dot: "bg-blue-500",
    text: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-200 dark:border-blue-800",
    icon: Loader2,
    spin: true,
  },
  error: {
    label: "Error",
    dot: "bg-red-500",
    text: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/40",
    border: "border-red-200 dark:border-red-800",
    icon: AlertCircle,
    spin: false,
  },
  deleted: {
    label: "Deleted",
    dot: "bg-gray-400",
    text: "text-gray-500 dark:text-gray-400",
    bg: "bg-gray-50 dark:bg-gray-900/40",
    border: "border-gray-200 dark:border-gray-700",
    icon: AlertCircle,
    spin: false,
  },
};

function MetaRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <Icon className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-muted-foreground font-medium mb-0.5">
          {label}
        </p>
        <div className="text-[13px] text-foreground font-medium">{value}</div>
      </div>
    </div>
  );
}

export function DocumentDetailPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();

  const { data: document, isLoading, error } = useDocument(documentId);
  const { data: collectionsData } = useCollections();

  const deleteDocumentMutation = useDeleteDocument();
  const retryDocumentMutation = useRetryDocument();
  const updateDocumentMutation = useUpdateDocument();

  const [showAllChunks, setShowAllChunks] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

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
    setIsEditOpen(false);
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(2)} MB` : `${(bytes / 1024).toFixed(1)} KB`;
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getExt = (filename: string) => {
    const parts = filename.split(".");
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : "FILE";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertCircle className="w-10 h-10 text-red-500" />
        <p className="text-sm text-muted-foreground">
          Document not found or failed to load.
        </p>
        <button
          type="button"
          onClick={() => navigate("/documents")}
          className="text-[13px] font-medium text-primary hover:underline"
        >
          ← Back to Documents
        </button>
      </div>
    );
  }

  const status =
    STATUS_CONFIG[document.status as keyof typeof STATUS_CONFIG] ??
    STATUS_CONFIG.deleted;
  const StatusIcon = status.icon;
  const chunksToShow = showAllChunks
    ? document.chunks || []
    : (document.chunks || []).slice(0, 5);

  return (
    <div className="p-6">
      {/* Back nav */}
      <button
        type="button"
        onClick={() => navigate("/documents")}
        className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors mb-5"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Documents
      </button>

      {/* Two-panel layout */}
      <div className="flex gap-5 items-start">
        {/* ── Left panel: file info + metadata ── */}
        <div className="w-80 shrink-0 sticky top-6 space-y-3">
          {/* File card */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {/* File type banner */}
            <div className="px-5 pt-5 pb-4 border-b border-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/15 flex items-center justify-center shrink-0">
                  <span className="text-[11px] font-bold text-primary">
                    {getExt(document.filename)}
                  </span>
                </div>
                <div className="min-w-0">
                  <p
                    className="text-[14px] font-semibold text-foreground leading-tight break-all line-clamp-2"
                    title={document.filename}
                  >
                    {document.filename}
                  </p>
                </div>
              </div>

              {/* Status badge */}
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-medium border ${status.bg} ${status.border} ${status.text}`}
              >
                <StatusIcon
                  className={`w-3 h-3 ${status.spin ? "animate-spin" : ""}`}
                />
                {status.label}
              </div>
            </div>

            {/* Metadata */}
            <div className="px-5 py-1">
              <MetaRow
                icon={HardDrive}
                label="File size"
                value={formatFileSize(document.size_bytes)}
              />
              <MetaRow
                icon={FileText}
                label="File type"
                value={
                  document.file_type.split("/")[1]?.toUpperCase() ??
                  document.file_type
                }
              />
              <MetaRow
                icon={Layers}
                label="Chunks"
                value={
                  <span>
                    {document.chunks_count}{" "}
                    <span className="text-muted-foreground font-normal text-[12px]">
                      segments
                    </span>
                  </span>
                }
              />
              <MetaRow
                icon={Calendar}
                label="Uploaded"
                value={
                  <span className="text-[12px]">
                    {formatDate(document.uploaded_at)}
                  </span>
                }
              />
              {document.processed_at && (
                <MetaRow
                  icon={Clock}
                  label="Processed"
                  value={
                    <span className="text-[12px]">
                      {formatDate(document.processed_at)}
                    </span>
                  }
                />
              )}
              <MetaRow
                icon={FolderOpen}
                label="Collection"
                value={
                  document.collection_name ?? (
                    <span className="text-muted-foreground">None</span>
                  )
                }
              />
              <MetaRow
                icon={Tag}
                label="Category"
                value={
                  document.category ?? (
                    <span className="text-muted-foreground">—</span>
                  )
                }
              />
              <MetaRow
                icon={Tag}
                label="Tags"
                value={
                  document.tags && document.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {document.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md bg-primary/8 border border-primary/15 text-[11px] font-medium text-primary"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">None</span>
                  )
                }
              />
            </div>

            {/* Actions */}
            <div className="px-4 pb-4 pt-2 flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setEditForm({
                    collection_id: document.collection_id || "",
                    category: document.category || "",
                    tags: document.tags?.join(", ") || "",
                  });
                  setIsEditOpen(true);
                }}
                className="flex items-center justify-center gap-2 w-full h-8 rounded-lg border border-border text-[13px] font-medium text-foreground hover:bg-muted transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit metadata
              </button>
              {document.status === "error" && (
                <button
                  type="button"
                  onClick={handleRetry}
                  disabled={retryDocumentMutation.isPending}
                  className="flex items-center justify-center gap-2 w-full h-8 rounded-lg border border-blue-200 dark:border-blue-800 text-[13px] font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${retryDocumentMutation.isPending ? "animate-spin" : ""}`}
                  />
                  {retryDocumentMutation.isPending
                    ? "Retrying…"
                    : "Retry processing"}
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsDeleteOpen(true)}
                className="flex items-center justify-center gap-2 w-full h-8 rounded-lg border border-red-200 dark:border-red-900 text-[13px] font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete document
              </button>
            </div>
          </div>

          {/* Error message card */}
          {document.status === "error" && document.error_message && (
            <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <p className="text-[12px] font-semibold text-red-600 dark:text-red-400">
                  Processing error
                </p>
              </div>
              <p className="text-[12px] text-red-600/80 dark:text-red-400/80 leading-relaxed">
                {document.error_message}
              </p>
            </div>
          )}
        </div>

        {/* ── Right panel: content chunks ── */}
        <div className="flex-1 min-w-0">
          {document.chunks && document.chunks.length > 0 ? (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              {/* Chunks header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-muted-foreground" />
                  <span className="text-[14px] font-semibold text-foreground">
                    Content chunks
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-muted text-[11px] font-medium text-muted-foreground tabular-nums">
                    {document.chunks_count}
                  </span>
                </div>
                {(document.chunks?.length ?? 0) > 5 && (
                  <button
                    type="button"
                    onClick={() => setShowAllChunks((v) => !v)}
                    className="flex items-center gap-1.5 text-[12px] font-medium text-primary hover:underline"
                  >
                    {showAllChunks
                      ? "Show less"
                      : `Show all ${document.chunks_count}`}
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform ${showAllChunks ? "rotate-180" : ""}`}
                    />
                  </button>
                )}
              </div>

              {/* Chunk rows */}
              <div className="divide-y divide-border">
                {chunksToShow.map((chunk, index) => (
                  <div
                    key={chunk.chunk_id}
                    className="flex gap-4 px-5 py-4 hover:bg-muted/30 transition-colors"
                    style={{
                      animationDelay: `${index * 30}ms`,
                    }}
                  >
                    {/* Index number */}
                    <div className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">
                        {chunk.chunk_index + 1}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Metadata tags */}
                      {chunk.metadata && typeof chunk.metadata === "object" && (
                        <div className="flex items-center gap-2 mb-2">
                          {"page" in chunk.metadata && (
                            <span className="text-[11px] text-muted-foreground">
                              Page {String(chunk.metadata.page)}
                            </span>
                          )}
                          {"section" in chunk.metadata && (
                            <span className="px-1.5 py-0.5 rounded bg-muted border border-border text-[11px] text-muted-foreground">
                              {String(chunk.metadata.section)}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Chunk text */}
                      <p className="text-[13px] text-foreground leading-relaxed whitespace-pre-wrap">
                        {chunk.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer: show more hint */}
              {!showAllChunks && (document.chunks?.length ?? 0) > 5 && (
                <div className="px-5 py-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowAllChunks(true)}
                    className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Showing 5 of {document.chunks_count} chunks —{" "}
                    <span className="text-primary font-medium hover:underline">
                      show all
                    </span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card flex flex-col items-center justify-center py-16 gap-3">
              <Layers className="w-8 h-8 text-muted-foreground/40" />
              <p className="text-[13px] text-muted-foreground">
                {document.status === "processing"
                  ? "Processing document — chunks will appear here shortly."
                  : "No content chunks available."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Edit metadata modal ── */}
      {isEditOpen && (
        <>
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: backdrop dismiss */}
          {/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop dismiss */}
          <div
            className="fixed inset-0 z-50 bg-black/20 dark:bg-black/40 backdrop-blur-[2px]"
            onClick={() => setIsEditOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: stopPropagation only */}
            {/* biome-ignore lint/a11y/noStaticElementInteractions: stopPropagation only */}
            <div
              className="w-full max-w-sm rounded-2xl bg-card border border-border shadow-[0_24px_64px_-12px_rgba(0,0,0,0.15)] pointer-events-auto overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Edit3 className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-[15px] font-bold text-foreground">
                      Edit metadata
                    </h2>
                    <p className="text-[11px] text-muted-foreground">
                      Update collection, category and tags
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <div className="px-6 py-5 space-y-4">
                {/* Collection */}
                <div>
                  <label
                    htmlFor="edit-collection"
                    className="block text-[12px] font-semibold text-foreground mb-1.5"
                  >
                    Collection
                  </label>
                  <Select
                    value={editForm.collection_id}
                    onValueChange={(value) =>
                      setEditForm({ ...editForm, collection_id: value })
                    }
                  >
                    <SelectTrigger className="w-full h-9 text-[13px] border-border bg-background">
                      <SelectValue placeholder="Select a collection" />
                    </SelectTrigger>
                    <SelectContent>
                      {collectionsData?.collections?.map((c) => (
                        <SelectItem
                          key={c.collection_id}
                          value={c.collection_id}
                        >
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Category */}
                <div>
                  <label
                    htmlFor="edit-category"
                    className="block text-[12px] font-semibold text-foreground mb-1.5"
                  >
                    Category
                  </label>
                  <input
                    id="edit-category"
                    type="text"
                    value={editForm.category}
                    onChange={(e) =>
                      setEditForm({ ...editForm, category: e.target.value })
                    }
                    placeholder="e.g. financial, technical, research"
                    className="w-full h-9 px-3 rounded-lg border border-border bg-background text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label
                    htmlFor="edit-tags"
                    className="block text-[12px] font-semibold text-foreground mb-1.5"
                  >
                    Tags
                  </label>
                  <input
                    id="edit-tags"
                    type="text"
                    value={editForm.tags}
                    onChange={(e) =>
                      setEditForm({ ...editForm, tags: e.target.value })
                    }
                    placeholder="Comma-separated: design, q1, report"
                    className="w-full h-9 px-3 rounded-lg border border-border bg-background text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 px-6 pb-5">
                <button
                  type="button"
                  onClick={handleSaveMetadata}
                  disabled={updateDocumentMutation.isPending}
                  className="flex-1 h-9 rounded-xl text-[13px] font-semibold text-white transition-opacity disabled:opacity-60"
                  style={{
                    background:
                      "linear-gradient(135deg, #7733ea 0%, #153bf5 100%)",
                  }}
                >
                  {updateDocumentMutation.isPending
                    ? "Saving…"
                    : "Save changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="flex-1 h-9 rounded-xl border border-border text-[13px] font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Delete confirmation modal ── */}
      {isDeleteOpen && (
        <>
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: backdrop dismiss */}
          {/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop dismiss */}
          <div
            className="fixed inset-0 z-50 bg-black/20 dark:bg-black/40 backdrop-blur-[2px]"
            onClick={() => setIsDeleteOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: stopPropagation only */}
            {/* biome-ignore lint/a11y/noStaticElementInteractions: stopPropagation only */}
            <div
              className="w-full max-w-sm rounded-2xl bg-card border border-border shadow-[0_24px_64px_-12px_rgba(0,0,0,0.15)] pointer-events-auto overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center shrink-0">
                    <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-[15px] font-bold text-foreground">
                      Delete document?
                    </h2>
                    <p className="text-[11px] text-muted-foreground">
                      This action cannot be undone
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDeleteOpen(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* File info */}
              <div className="px-6 py-4">
                <div className="px-3 py-2.5 rounded-xl bg-muted/50 border border-border">
                  <p className="text-[13px] font-medium text-foreground break-all">
                    {document.filename}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {document.chunks_count} chunks ·{" "}
                    {formatFileSize(document.size_bytes)}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 px-6 pb-5">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteDocumentMutation.isPending}
                  className="flex-1 h-9 rounded-xl bg-red-600 hover:bg-red-500 dark:bg-red-700 dark:hover:bg-red-600 text-white text-[13px] font-semibold transition-colors disabled:opacity-60"
                >
                  {deleteDocumentMutation.isPending ? "Deleting…" : "Delete"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeleteOpen(false)}
                  className="flex-1 h-9 rounded-xl border border-border text-[13px] font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
