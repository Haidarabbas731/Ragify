/**
 * Documents Page - Archive Command Center
 * Full-page document management interface with clean design
 * Fonts: Geist (sans), Geist Mono (mono)
 */

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BatchActions } from "../components/documents/BatchActions";
import { BatchDeleteDialog } from "../components/documents/BatchDeleteDialog";
import { DocumentList } from "../components/documents/DocumentList";
import {
  type FilterState,
  SearchFilter,
} from "../components/documents/SearchFilter";
import { useCollections } from "../hooks/useCollections";
import {
  useBatchDeleteDocuments,
  useDeleteAllDocuments,
  useDeleteDocument,
  useDocuments,
  useRetryDocument,
  useUpdateDocument,
} from "../hooks/useDocuments";
export function DocumentsPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: "",
    collectionId: null,
    statusFilter: null,
    sortBy: "created_at",
    order: "desc",
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch documents with filters
  const {
    data: documentsData,
    isLoading,
    error,
  } = useDocuments({
    page: currentPage,
    limit: 50,
    search: filters.searchTerm || undefined,
    collection_id: filters.collectionId || undefined,
    status_filter:
      (filters.statusFilter as
        | "processing"
        | "active"
        | "error"
        | "deleted"
        | undefined) || undefined,
    sort_by: filters.sortBy,
    order: filters.order,
  });

  // API mutations
  const deleteDocumentMutation = useDeleteDocument();
  const retryDocumentMutation = useRetryDocument();
  const batchDeleteMutation = useBatchDeleteDocuments();
  const deleteAllMutation = useDeleteAllDocuments();
  const updateDocumentMutation = useUpdateDocument();

  // Fetch collections from backend
  const { data: collectionsData } = useCollections();
  const collections = collectionsData?.collections || [];

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Batch operations state
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(
    new Set(),
  );
  const [batchDeleteDialog, setBatchDeleteDialog] = useState(false);

  const totalDocuments = documentsData?.total || 0;

  const handleSelectionChange = (documentId: string, selected: boolean) => {
    setSelectedDocuments((prev) => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(documentId);
      } else {
        newSet.delete(documentId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (documentsData?.documents) {
      const allDocIds = documentsData.documents.map((doc) => doc.document_id);
      setSelectedDocuments(new Set(allDocIds));
    }
  };

  const handleDeselectAll = () => {
    setSelectedDocuments(new Set());
  };

  const handleBatchDelete = () => {
    setBatchDeleteDialog(true);
  };

  const handleConfirmBatchDelete = async () => {
    const isAllSelected = selectedDocuments.size === totalDocuments;

    if (isAllSelected) {
      // All documents selected - use delete-all endpoint
      await deleteAllMutation.mutateAsync();
    } else {
      // Partial selection - use batch-delete endpoint
      await batchDeleteMutation.mutateAsync({
        document_ids: Array.from(selectedDocuments),
      });
    }

    setSelectedDocuments(new Set());
    setBatchDeleteDialog(false);
  };

  const handleMoveToCollection = async (collectionId: string) => {
    // Update all selected documents to new collection
    const updatePromises = Array.from(selectedDocuments).map((documentId) =>
      updateDocumentMutation.mutateAsync({
        documentId,
        updates: { collection_id: collectionId },
      }),
    );

    await Promise.all(updatePromises);
    setSelectedDocuments(new Set());
  };

  return (
    <>
      <div className="p-6">
        {/* Search & Filter */}
        <SearchFilter
          collections={collections}
          onFilterChange={handleFilterChange}
        />

        {/* Batch Operations - Only show when documents are selected */}
        {selectedDocuments.size > 0 && (
          <div className="animate-in slide-in-from-top-2 duration-300">
            <BatchActions
              selectedCount={selectedDocuments.size}
              totalCount={totalDocuments}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              onBatchDelete={handleBatchDelete}
              onMoveToCollection={handleMoveToCollection}
              collections={collections}
            />
          </div>
        )}

        {/* Document List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-950/20 p-6 text-center">
            <p className="text-red-600 dark:text-red-400 font-mono">
              Failed to load documents. Please try again.
            </p>
          </div>
        ) : (
          <DocumentList
            documents={documentsData?.documents || []}
            onDocumentClick={(docId) => {
              navigate(`/documents/${docId}`);
            }}
            onDeleteDocument={(docId) => {
              deleteDocumentMutation.mutate(docId);
            }}
            onRetryDocument={(docId) => {
              retryDocumentMutation.mutate(docId);
            }}
            selectedDocuments={selectedDocuments}
            onSelectionChange={handleSelectionChange}
          />
        )}
      </div>

      <BatchDeleteDialog
        isOpen={batchDeleteDialog}
        selectedCount={selectedDocuments.size}
        totalCount={totalDocuments}
        onConfirm={handleConfirmBatchDelete}
        onCancel={() => setBatchDeleteDialog(false)}
      />
    </>
  );
}
