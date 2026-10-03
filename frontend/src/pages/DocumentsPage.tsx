import { FileText, SearchX } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  DEFAULT_SORT,
  DocumentFilters,
  type DocumentFilterValues,
  SORT_PARAMS,
} from "@/components/documents/DocumentFilters";
import { DocumentPagination } from "@/components/documents/DocumentPagination";
import { DocumentTable } from "@/components/documents/DocumentTable";
import { SelectionBar } from "@/components/documents/SelectionBar";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollections } from "@/hooks/useCollections";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useDocumentSelection } from "@/hooks/useDocumentSelection";
import {
  useBatchDeleteDocuments,
  useBatchMoveDocuments,
  useDeleteAllDocuments,
  useDeleteDocument,
  useDocuments,
  useRetryDocument,
} from "@/hooks/useDocuments";
import { getAllMatchingDocumentIds } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Document } from "@/types/api";

const PAGE_SIZE = 50;

const EMPTY_FILTERS: DocumentFilterValues = {
  search: "",
  collectionId: null,
  status: null,
  sort: DEFAULT_SORT,
};

type DeleteTarget = { kind: "single"; doc: Document } | { kind: "selection" };

/** All of the user's documents: search, filter, sort, select, move and delete. */
export function DocumentsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<DocumentFilterValues>(() => ({
    ...EMPTY_FILTERS,
    collectionId: searchParams.get("collection"),
  }));
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [working, setWorking] = useState(false);

  const search = useDebouncedValue(filters.search, 300);
  const filterParams = useMemo(
    () => ({
      search: search || undefined,
      collection_id: filters.collectionId || undefined,
      status_filter: filters.status || undefined,
    }),
    [search, filters.collectionId, filters.status],
  );

  const { data, isLoading, isPlaceholderData, error, refetch } = useDocuments({
    page,
    limit: PAGE_SIZE,
    ...filterParams,
    ...SORT_PARAMS[filters.sort],
  });
  const { data: collectionsData } = useCollections();
  const collections = collectionsData?.collections ?? [];

  const documents = data?.documents ?? [];
  const total = data?.total ?? 0;
  const visibleIds = useMemo(
    () => documents.map((doc) => doc.document_id),
    [documents],
  );
  const selection = useDocumentSelection(visibleIds);
  const { clear: clearSelection } = selection;

  const deleteOne = useDeleteDocument();
  const batchDelete = useBatchDeleteDocuments();
  const deleteAll = useDeleteAllDocuments();
  const move = useBatchMoveDocuments();
  const retry = useRetryDocument();

  // Changing what is shown starts over on page 1 with nothing selected.
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset when any filter changes
  useEffect(() => {
    setPage(1);
  }, [search, filters.collectionId, filters.status, filters.sort]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: clear when the visible list changes
  useEffect(() => {
    clearSelection();
  }, [
    page,
    search,
    filters.collectionId,
    filters.status,
    filters.sort,
    clearSelection,
  ]);

  // Escape clears the selection, unless it is closing a menu or dialog first.
  const hasSelection = selection.ids.size > 0;
  useEffect(() => {
    if (!hasSelection) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) clearSelection();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [hasSelection, clearSelection]);

  const handleFilterChange = (changes: Partial<DocumentFilterValues>) =>
    setFilters((prev) => ({ ...prev, ...changes }));

  const isFiltered =
    filters.search !== "" ||
    filters.collectionId !== null ||
    filters.status !== null ||
    search !== "";
  const matchingMode = selection.mode === "matching";
  const selectionCount = matchingMode ? total : selection.ids.size;
  const offerMatching =
    selection.allVisibleSelected && !matchingMode && total > documents.length;

  // The delete-all endpoint ignores filters, so it is only used when the selection really is
  // every document the user has: matching mode, no filters, and the full count.
  const deletesEverything =
    matchingMode && !isFiltered && selectionCount === total && total > 0;

  /** IDs the current selection applies to, fetching other pages when "all matching" is on. */
  const resolveSelectedIds = async () =>
    matchingMode ? getAllMatchingDocumentIds(filterParams) : [...selection.ids];

  const selectedNames = documents
    .filter((doc) => selection.ids.has(doc.document_id))
    .map((doc) => doc.filename);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setWorking(true);
    try {
      if (deleteTarget.kind === "single") {
        await deleteOne.mutateAsync(deleteTarget.doc.document_id);
        selection.toggle(deleteTarget.doc.document_id, false);
      } else if (deletesEverything) {
        await deleteAll.mutateAsync();
        clearSelection();
      } else {
        const ids = await resolveSelectedIds();
        await batchDelete.mutateAsync({ document_ids: ids });
        clearSelection();
      }
      setDeleteTarget(null);
    } catch {
      // The mutation hooks already show an error toast; keep the dialog open.
    } finally {
      setWorking(false);
    }
  };

  const moveSelected = async (collectionId: string | null) => {
    setWorking(true);
    try {
      const ids = await resolveSelectedIds();
      await move.mutateAsync({ documentIds: ids, collectionId });
      clearSelection();
    } catch {
      // Error toast comes from the hook.
    } finally {
      setWorking(false);
    }
  };

  const dialogCopy = (() => {
    if (!deleteTarget) return { title: "", description: "", label: "Delete" };
    if (deleteTarget.kind === "single") {
      return {
        title: `Delete “${deleteTarget.doc.filename}”?`,
        description: "This permanently removes the file and its embeddings.",
        label: "Delete",
      };
    }
    if (deletesEverything) {
      return {
        title: `Delete all ${total} documents?`,
        description:
          "This permanently removes every document you have and their embeddings.",
        label: "Delete all",
      };
    }
    const noun = `${selectionCount} document${selectionCount === 1 ? "" : "s"}`;
    const listed =
      !matchingMode && selectedNames.length > 0
        ? ` ${selectedNames.slice(0, 3).join(", ")}${
            selectedNames.length > 3
              ? ` and ${selectedNames.length - 3} more`
              : ""
          }.`
        : "";
    return {
      title: `Delete ${noun}?`,
      description: `This permanently removes the files and their embeddings.${listed}`,
      label: `Delete ${selectionCount}`,
    };
  })();

  return (
    <div className={cn("flex flex-col gap-4 p-4 pb-28 sm:p-6 sm:pb-28")}>
      <PageHeader
        description={
          data
            ? `${total} document${total === 1 ? "" : "s"}${isFiltered ? " match" : ""}`
            : "Your uploaded files and their status"
        }
      />

      <DocumentFilters
        values={filters}
        collections={collections}
        onChange={handleFilterChange}
        onClear={() => setFilters(EMPTY_FILTERS)}
      />

      {isLoading ? (
        <div className="flex flex-col gap-2" aria-busy="true">
          {Array.from({ length: 6 }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder rows
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState
          message="Couldn't load your documents."
          onRetry={() => refetch()}
        />
      ) : documents.length === 0 ? (
        isFiltered ? (
          <EmptyState
            icon={SearchX}
            title="No documents match"
            description="Try a different search or clear the filters."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters(EMPTY_FILTERS)}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={FileText}
            title="No documents yet"
            description="Use New source in the top bar to add files. They are indexed so you can ask questions about them."
          />
        )
      ) : (
        <div
          className={cn(
            "flex flex-col gap-4 transition-opacity duration-150",
            isPlaceholderData && "opacity-60",
          )}
        >
          <DocumentTable
            documents={documents}
            selectable
            selectedIds={selection.ids}
            headerState={selection.headerState}
            collections={collections}
            onToggleAll={selection.toggleVisible}
            onToggle={selection.toggle}
            onOpen={(doc) => navigate(`/documents/${doc.document_id}`)}
            onRetry={(doc) => retry.mutate(doc.document_id)}
            onMove={(doc, collectionId) =>
              move.mutate({ documentIds: [doc.document_id], collectionId })
            }
            onDelete={(doc) => setDeleteTarget({ kind: "single", doc })}
          />
          <DocumentPagination
            page={page}
            pages={data?.pages ?? 1}
            total={total}
            limit={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      )}

      <SelectionBar
        count={selectionCount}
        matchingTotal={offerMatching ? total : undefined}
        allMatchingSelected={matchingMode}
        collections={collections}
        busy={working}
        onSelectMatching={selection.selectMatching}
        onMove={moveSelected}
        onDelete={() => setDeleteTarget({ kind: "selection" })}
        onClear={clearSelection}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        tone="destructive"
        title={dialogCopy.title}
        description={dialogCopy.description}
        confirmLabel={dialogCopy.label}
        requireText={
          deletesEverything && deleteTarget?.kind === "selection"
            ? "delete"
            : undefined
        }
        pending={working}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
