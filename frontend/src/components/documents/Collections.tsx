/**
 * Collections Component - Archive Vault
 * Museum-grade collection management with refined industrial aesthetic
 * Fonts: DM Serif Display (collection names), Manrope (UI), JetBrains Mono (metadata)
 */

import {
  Archive,
  Edit2,
  FolderOpen,
  MoreVertical,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

interface Collection {
  collection_id: string;
  name: string;
  description: string | null;
  document_count: number;
  created_at: string;
  updated_at: string;
}

interface CollectionsProps {
  onSelectCollection?: (collectionId: string | null) => void;
  selectedCollectionId?: string | null;
}

// Mock data for demonstration
const MOCK_COLLECTIONS: Collection[] = [
  {
    collection_id: "col_work",
    name: "Work Documents",
    description: "Professional documents, reports, and presentations",
    document_count: 24,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    collection_id: "col_research",
    name: "Research Papers",
    description:
      "Academic papers and research materials on AI and machine learning",
    document_count: 15,
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    collection_id: "col_personal",
    name: "Personal Notes",
    description: null,
    document_count: 8,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export function Collections({
  onSelectCollection,
  selectedCollectionId,
}: CollectionsProps) {
  const [collections, setCollections] =
    useState<Collection[]>(MOCK_COLLECTIONS);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(
    null,
  );

  const handleCreateCollection = (name: string, description: string) => {
    const newCollection: Collection = {
      collection_id: `col_${Math.random().toString(36).substring(7)}`,
      name,
      description: description || null,
      document_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setCollections((prev) => [...prev, newCollection]);
    setIsCreateModalOpen(false);
    toast.success(`Collection "${name}" created`);
  };

  const handleEditCollection = (
    collectionId: string,
    name: string,
    description: string,
  ) => {
    setCollections((prev) =>
      prev.map((col) =>
        col.collection_id === collectionId
          ? {
              ...col,
              name,
              description: description || null,
              updated_at: new Date().toISOString(),
            }
          : col,
      ),
    );
    setIsEditModalOpen(false);
    setEditingCollection(null);
    toast.success(`Collection "${name}" updated`);
  };

  const handleDeleteCollection = (collection: Collection) => {
    if (
      confirm(
        `Delete collection "${collection.name}"?\n\nDocuments will not be deleted, only the collection.`,
      )
    ) {
      setCollections((prev) =>
        prev.filter((col) => col.collection_id !== collection.collection_id),
      );
      if (selectedCollectionId === collection.collection_id) {
        onSelectCollection?.(null);
      }
      toast.success(`Collection "${collection.name}" deleted`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 font-['DM_Serif_Display',serif] tracking-tight">
            Collections
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 font-['Manrope',sans-serif]">
            Organize your documents into curated collections
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="gap-2 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 hover:from-slate-800 hover:to-slate-600 dark:hover:from-slate-200 dark:hover:to-slate-400 text-white dark:text-slate-900 shadow-lg hover:shadow-xl transition-all duration-300 font-['Manrope',sans-serif] font-semibold"
        >
          <Plus className="w-4 h-4" />
          New Collection
        </Button>
      </div>

      {/* Collections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* All Documents Card */}
        <button
          type="button"
          onClick={() => onSelectCollection?.(null)}
          className={`group relative bg-white dark:bg-slate-900 border-2 rounded-lg p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/20 dark:hover:shadow-slate-100/20 ${
            selectedCollectionId === null
              ? "border-slate-900 dark:border-slate-100 shadow-lg shadow-slate-900/10 dark:shadow-slate-100/10"
              : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          {/* Icon */}
          <div className="flex items-center justify-between mb-4">
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-300 ${
                selectedCollectionId === null
                  ? "bg-slate-900 dark:bg-slate-100"
                  : "bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
              }`}
            >
              <Archive
                className={`w-6 h-6 transition-colors ${
                  selectedCollectionId === null
                    ? "text-white dark:text-slate-900"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              />
            </div>
          </div>

          {/* Content */}
          <div>
            <h3
              className={`text-xl font-bold mb-1 font-['DM_Serif_Display',serif] transition-colors ${
                selectedCollectionId === null
                  ? "text-slate-900 dark:text-slate-100"
                  : "text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-slate-100"
              }`}
            >
              All Documents
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-['Manrope',sans-serif] mb-4">
              View all documents across collections
            </p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-['JetBrains_Mono',monospace] tabular-nums">
                {collections.reduce((sum, col) => sum + col.document_count, 0)}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-['Manrope',sans-serif]">
                documents
              </span>
            </div>
          </div>
        </button>

        {/* Collection Cards */}
        {collections.map((collection) => (
          <div
            key={collection.collection_id}
            className={`group relative bg-white dark:bg-slate-900 border-2 rounded-lg p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/20 dark:hover:shadow-slate-100/20 ${
              selectedCollectionId === collection.collection_id
                ? "border-slate-900 dark:border-slate-100 shadow-lg shadow-slate-900/10 dark:shadow-slate-100/10"
                : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <button
                type="button"
                onClick={() => onSelectCollection?.(collection.collection_id)}
                className="flex-1 text-left"
              >
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 transition-all duration-300 ${
                    selectedCollectionId === collection.collection_id
                      ? "bg-slate-900 dark:bg-slate-100"
                      : "bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
                  }`}
                >
                  <FolderOpen
                    className={`w-6 h-6 transition-colors ${
                      selectedCollectionId === collection.collection_id
                        ? "text-white dark:text-slate-900"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  />
                </div>
              </button>

              {/* Actions Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: Implement dropdown menu
                  }}
                  aria-label="Collection actions"
                >
                  <MoreVertical className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </button>
              </div>
            </div>

            {/* Content */}
            <button
              type="button"
              onClick={() => onSelectCollection?.(collection.collection_id)}
              className="w-full text-left mb-4"
            >
              <h3
                className={`text-xl font-bold mb-1 font-['DM_Serif_Display',serif] transition-colors line-clamp-2 ${
                  selectedCollectionId === collection.collection_id
                    ? "text-slate-900 dark:text-slate-100"
                    : "text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-slate-100"
                }`}
              >
                {collection.name}
              </h3>
              {collection.description && (
                <p className="text-sm text-slate-600 dark:text-slate-400 font-['Manrope',sans-serif] line-clamp-2">
                  {collection.description}
                </p>
              )}
            </button>

            {/* Stats & Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-['JetBrains_Mono',monospace] tabular-nums">
                  {collection.document_count}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-['Manrope',sans-serif]">
                  docs
                </span>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingCollection(collection);
                    setIsEditModalOpen(true);
                  }}
                  className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Edit collection"
                >
                  <Edit2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCollection(collection);
                  }}
                  className="p-2 rounded-md hover:bg-red-100 dark:hover:bg-red-950 transition-colors"
                  aria-label="Delete collection"
                >
                  <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {collections.length === 0 && (
        <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-12 text-center">
          <div className="max-w-sm mx-auto space-y-4">
            <div className="mx-auto w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
              <FolderOpen className="w-10 h-10 text-slate-400 dark:text-slate-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2 font-['DM_Serif_Display',serif]">
                No collections yet
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-['Manrope',sans-serif] mb-4">
                Create your first collection to organize your documents
              </p>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="gap-2 font-['Manrope',sans-serif]"
              >
                <Plus className="w-4 h-4" />
                Create Collection
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
      />
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
}

function CollectionModal({
  isOpen,
  onClose,
  onSubmit,
  initialName = "",
  initialDescription = "",
  mode,
}: CollectionModalProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  // Reset form when modal opens
  useState(() => {
    if (isOpen) {
      setName(initialName);
      setDescription(initialDescription);
      setIsAnimatingOut(false);
    }
  });

  const handleClose = () => {
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
    onSubmit(name.trim(), description.trim());
    setName("");
    setDescription("");
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
        className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-default"
        aria-label="Close modal"
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden ${
          isAnimatingOut ? "animate-scaleOut" : "animate-scaleIn"
        }`}
      >
        {/* Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-['DM_Serif_Display',serif]">
              {mode === "create" ? "Create Collection" : "Edit Collection"}
            </h2>
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
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
              className="text-slate-700 dark:text-slate-300 font-['Manrope',sans-serif] font-medium"
            >
              Collection Name *
            </Label>
            <Input
              id="collection-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Work Documents, Research Papers"
              className="mt-2 font-['Manrope',sans-serif] bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              autoFocus
            />
          </div>

          {/* Description Textarea */}
          <div>
            <Label
              htmlFor="collection-description"
              className="text-slate-700 dark:text-slate-300 font-['Manrope',sans-serif] font-medium"
            >
              Description (Optional)
            </Label>
            <Textarea
              id="collection-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description to help identify this collection..."
              rows={3}
              className="mt-2 font-['Manrope',sans-serif] bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <Button
              type="button"
              onClick={handleClose}
              variant="outline"
              className="flex-1 font-['Manrope',sans-serif] border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 hover:from-slate-800 hover:to-slate-600 dark:hover:from-slate-200 dark:hover:to-slate-400 text-white dark:text-slate-900 font-['Manrope',sans-serif] font-semibold"
            >
              {mode === "create" ? "Create" : "Save Changes"}
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
        .animate-fadeIn { animation: fadeIn 200ms ease-out; }
        .animate-fadeOut { animation: fadeOut 200ms ease-in; }
        .animate-scaleIn { animation: scaleIn 200ms cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-scaleOut { animation: scaleOut 200ms cubic-bezier(0.7, 0, 0.84, 0); }
      `}</style>
    </div>
  );
}
