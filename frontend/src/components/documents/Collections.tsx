/**
 * Collections Component - Archive Vault
 * Production-grade collection management with full CRUD operations
 * Aesthetic: Modern minimalist with elegant cards
 * Typography: System fonts for better performance and native feel
 */

import {
  Archive,
  Edit2,
  FolderOpen,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useCollections,
  useCreateCollection,
  useDeleteCollection,
  useUpdateCollection,
} from "@/hooks/useCollections";
import type { Collection } from "@/types/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { DeleteCollectionDialog } from "./DeleteCollectionDialog";

interface CollectionsProps {
  onSelectCollection?: (collectionId: string | null) => void;
  selectedCollectionId?: string | null;
}

export function Collections({
  onSelectCollection,
  selectedCollectionId,
}: CollectionsProps) {
  // Real backend integration - now returns {collections, total_documents}
  const { data, isLoading, error } = useCollections();
  const createMutation = useCreateCollection();
  const updateMutation = useUpdateCollection();
  const deleteMutation = useDeleteCollection();

  const collections = data?.collections || [];
  const totalDocuments = data?.total_documents || 0;

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(
    null,
  );
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    collection: Collection | null;
  }>({
    isOpen: false,
    collection: null,
  });

  const handleCreateCollection = async (name: string, description: string) => {
    await createMutation.mutateAsync({
      name: name.trim(),
      description: description.trim() || undefined,
    });
    setIsCreateModalOpen(false);
  };

  const handleEditCollection = async (
    collectionId: string,
    name: string,
    description: string,
  ) => {
    await updateMutation.mutateAsync({
      collectionId,
      updates: {
        name: name.trim(),
        description: description.trim() || undefined,
      },
    });
    setIsEditModalOpen(false);
    setEditingCollection(null);
  };

  const handleDeleteCollection = async () => {
    if (!deleteDialog.collection) return;

    await deleteMutation.mutateAsync(deleteDialog.collection.collection_id);

    if (selectedCollectionId === deleteDialog.collection.collection_id) {
      onSelectCollection?.(null);
    }

    setDeleteDialog({ isOpen: false, collection: null });
  };

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-950 rounded-xl flex items-center justify-center">
            <X className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
              Failed to load collections
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {(error as Error).message || "An error occurred"}
            </p>
          </div>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-slate-400 dark:text-slate-500 animate-spin mx-auto" />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Loading collections...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeInUp">
      {/* Header */}
      <div className="flex items-start justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Collections
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-400 max-w-2xl">
            Organize your knowledge into curated collections for better document
            management and targeted retrieval.
          </p>
          <div className="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400 pt-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              <span className="font-medium">
                {collections.length} collection
                {collections.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span className="font-medium">
                {totalDocuments} document{totalDocuments !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          disabled={createMutation.isPending}
          className="gap-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
          size="lg"
        >
          <Plus className="w-5 h-5" />
          New Collection
        </Button>
      </div>

      {/* Collections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* All Documents Card */}
        <button
          type="button"
          onClick={() => onSelectCollection?.(null)}
          className={`group relative bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 rounded-2xl p-6 text-left transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
            selectedCollectionId === null
              ? "ring-2 ring-slate-900 dark:ring-slate-100 shadow-lg"
              : "ring-1 ring-slate-200 dark:ring-slate-800 hover:ring-slate-300 dark:hover:ring-slate-700"
          }`}
          style={{
            animation: "slideInLeft 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* Background Gradient Orb */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 dark:from-blue-500/10 dark:to-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Icon */}
          <div className="relative mb-4">
            <div
              className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 ${
                selectedCollectionId === null
                  ? "bg-slate-900 dark:bg-slate-100 shadow-lg"
                  : "bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
              }`}
            >
              <Archive
                className={`w-7 h-7 transition-colors ${
                  selectedCollectionId === null
                    ? "text-white dark:text-slate-900"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              />
            </div>
          </div>

          {/* Content */}
          <div className="relative space-y-3">
            <h3
              className={`text-xl font-bold transition-colors ${
                selectedCollectionId === null
                  ? "text-slate-900 dark:text-slate-100"
                  : "text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-slate-100"
              }`}
            >
              All Documents
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Unified view of all documents across every collection
            </p>
            <div className="flex items-baseline gap-2 pt-2">
              <span className="text-3xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                {totalDocuments}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">
                total
              </span>
            </div>
          </div>

          {/* Selection Indicator */}
          {selectedCollectionId === null && (
            <div className="absolute top-4 right-4 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50" />
          )}
        </button>

        {/* Collection Cards */}
        {collections.map((collection, index) => (
          <div
            key={collection.collection_id}
            className={`group relative bg-white dark:bg-slate-900 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
              selectedCollectionId === collection.collection_id
                ? "ring-2 ring-slate-900 dark:ring-slate-100 shadow-lg"
                : "ring-1 ring-slate-200 dark:ring-slate-800 hover:ring-slate-300 dark:hover:ring-slate-700"
            }`}
            style={{
              animation: `slideInLeft 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.1}s both`,
            }}
          >
            {/* Background Gradient Orb */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 dark:from-violet-500/10 dark:to-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="relative flex items-start justify-between mb-4">
              <button
                type="button"
                onClick={() => onSelectCollection?.(collection.collection_id)}
                className="flex-1 text-left"
              >
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    selectedCollectionId === collection.collection_id
                      ? "bg-slate-900 dark:bg-slate-100 shadow-lg"
                      : "bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
                  }`}
                >
                  <FolderOpen
                    className={`w-7 h-7 transition-colors ${
                      selectedCollectionId === collection.collection_id
                        ? "text-white dark:text-slate-900"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  />
                </div>
              </button>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingCollection(collection);
                    setIsEditModalOpen(true);
                  }}
                  disabled={updateMutation.isPending}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Edit collection"
                >
                  <Edit2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteDialog({ isOpen: true, collection });
                  }}
                  disabled={deleteMutation.isPending}
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                  aria-label="Delete collection"
                >
                  <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                </button>
              </div>
            </div>

            {/* Content */}
            <button
              type="button"
              onClick={() => onSelectCollection?.(collection.collection_id)}
              className="w-full text-left space-y-3 relative"
            >
              <h3
                className={`text-xl font-bold transition-colors line-clamp-2 ${
                  selectedCollectionId === collection.collection_id
                    ? "text-slate-900 dark:text-slate-100"
                    : "text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-slate-100"
                }`}
              >
                {collection.name}
              </h3>
              {collection.description && (
                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {collection.description}
                </p>
              )}
            </button>

            {/* Stats & Metadata */}
            <div className="relative pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                  {collection.document_count}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">
                  documents
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 font-mono">
                <div className="flex items-center justify-between">
                  <span>Created</span>
                  <span className="tabular-nums">
                    {new Date(collection.created_at).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      },
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Modified</span>
                  <span className="tabular-nums">
                    {new Date(collection.updated_at).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      },
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Selection Indicator */}
            {selectedCollectionId === collection.collection_id && (
              <div className="absolute top-4 right-4 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50" />
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {collections.length === 0 && (
        <div
          className="bg-white dark:bg-slate-900 border-4 border-dashed border-slate-300 dark:border-slate-700 rounded-none p-16 text-center"
          style={{
            animation: "fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <div className="max-w-md mx-auto space-y-6">
            <div className="mx-auto w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-none border-4 border-slate-300 dark:border-slate-700 flex items-center justify-center">
              <FolderOpen className="w-12 h-12 text-slate-400 dark:text-slate-500" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-3 font-['JetBrains_Mono'] uppercase tracking-tight">
                Vault Uninitialized
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-['IBM_Plex_Sans'] mb-6 leading-relaxed">
                Create your first collection to establish an organized archive
                system for your documents
              </p>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                disabled={createMutation.isPending}
                className="gap-2 font-['JetBrains_Mono'] font-bold uppercase tracking-wider bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 border-2 border-slate-900 dark:border-slate-100"
              >
                <Plus className="w-4 h-4" />
                Initialize Vault
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <CollectionModal
        isOpen={isCreateModalOpen || isEditModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
          setEditingCollection(null);
        }}
        onSubmit={(name, description) => {
          if (editingCollection) {
            handleEditCollection(
              editingCollection.collection_id,
              name,
              description,
            );
          } else {
            handleCreateCollection(name, description);
          }
        }}
        initialName={editingCollection?.name || ""}
        initialDescription={editingCollection?.description || ""}
        mode={editingCollection ? "edit" : "create"}
        isPending={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteCollectionDialog
        isOpen={deleteDialog.isOpen}
        collectionName={deleteDialog.collection?.name || ""}
        documentCount={deleteDialog.collection?.document_count || 0}
        onConfirm={handleDeleteCollection}
        onCancel={() => setDeleteDialog({ isOpen: false, collection: null })}
        isPending={deleteMutation.isPending}
      />

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
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

interface CollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string) => void;
  initialName?: string;
  initialDescription?: string;
  mode: "create" | "edit";
  isPending?: boolean;
}

function CollectionModal({
  isOpen,
  onClose,
  onSubmit,
  initialName = "",
  initialDescription = "",
  mode,
  isPending = false,
}: CollectionModalProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  // Reset form when modal opens or initial values change
  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setDescription(initialDescription);
      setIsAnimatingOut(false);
    }
  }, [isOpen, initialName, initialDescription]);

  const handleClose = () => {
    if (isPending) return;
    setIsAnimatingOut(true);
    setTimeout(() => {
      onClose();
      setIsAnimatingOut(false);
      setName("");
      setDescription("");
    }, 200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Collection name is required");
      return;
    }
    if (isPending) return;
    onSubmit(name.trim(), description.trim());
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 ${
        isAnimatingOut ? "animate-fadeOut" : "animate-fadeIn"
      }`}
    >
      {/* Backdrop */}
      <button
        type="button"
        onClick={handleClose}
        disabled={isPending}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-default"
        aria-label="Close modal"
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden ${
          isAnimatingOut ? "animate-scaleOut" : "animate-scaleIn"
        }`}
      >
        {/* Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-6 py-5 relative">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {mode === "create" ? "Create Collection" : "Edit Collection"}
            </h2>
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name Input */}
          <div>
            <Label
              htmlFor="collection-name"
              className="text-slate-900 dark:text-slate-100 font-semibold text-sm mb-2 block"
            >
              Collection Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="collection-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Research Papers, Work Documents, Personal Notes"
              className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-base h-11 font-sans"
              autoFocus
              disabled={isPending}
            />
          </div>

          {/* Description Textarea */}
          <div>
            <Label
              htmlFor="collection-description"
              className="text-slate-900 dark:text-slate-100 font-semibold text-sm mb-2 block"
            >
              Description
              <span className="text-slate-500 dark:text-slate-400 ml-2 font-normal">
                (Optional)
              </span>
            </Label>
            <Textarea
              id="collection-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the purpose or content of this collection..."
              rows={4}
              className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-base resize-none font-sans"
              disabled={isPending}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <Button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              variant="outline"
              className="flex-1 font-semibold"
              size="lg"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-semibold disabled:opacity-50"
              size="lg"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {mode === "create" ? "Creating..." : "Saving..."}
                </>
              ) : mode === "create" ? (
                "Create Collection"
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes scaleOut {
          from {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          to {
            opacity: 0;
            transform: scale(0.95) translateY(-20px);
          }
        }
        .animate-fadeIn { animation: fadeIn 250ms ease-out; }
        .animate-fadeOut { animation: fadeOut 200ms ease-in; }
        .animate-scaleIn { animation: scaleIn 300ms cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-scaleOut { animation: scaleOut 200ms cubic-bezier(0.7, 0, 0.84, 0); }
      `}</style>
    </div>
  );
}
