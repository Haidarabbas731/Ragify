import { FileSearch, FileX, Loader2, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { FileIcon } from "@/components/documents/FileIcon";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useBatchMoveDocuments, useDocuments } from "@/hooks/useDocuments";
import { formatBytes, pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Collection, Document } from "@/types/api";

interface AddDocumentsDialogProps {
  /** Collection to add to; the dialog is closed while this is `null`. */
  collection: Collection | null;
  onOpenChange: (open: boolean) => void;
}

/** Pick documents from the library and put them in a collection. */
export function AddDocumentsDialog({
  collection,
  onOpenChange,
}: AddDocumentsDialogProps) {
  const open = collection !== null;
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const search = useDebouncedValue(query.trim(), 300);
  const move = useBatchMoveDocuments();

  // Only finished documents can be filed; processing and failed ones have nothing to chat with yet.
  const { data, isLoading, isError, refetch } = useDocuments(
    {
      search: search || undefined,
      limit: 100,
      status_filter: "active",
      sort_by: "uploaded_at",
      order: "desc",
    },
    { enabled: open },
  );

  // Start empty every time the dialog opens
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(new Set());
    }
  }, [open]);

  // The server does the searching; just leave out documents already in this collection
  const candidates = useMemo(
    () =>
      (data?.documents ?? []).filter(
        (doc) => doc.collection_id !== collection?.collection_id,
      ),
    [data, collection],
  );
  const toggle = (id: string, checked: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collection || selected.size === 0) return;

    const chosen = candidates.filter((doc) => selected.has(doc.document_id));
    move.mutate(
      {
        documentIds: chosen.map((doc) => doc.document_id),
        collectionId: collection.collection_id,
        silent: true,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          toast.success(
            `Added ${pluralize(chosen.length, "document")} to “${collection.name}”`,
            { action: { label: "Undo", onClick: () => undo(chosen) } },
          );
        },
      },
    );
  };

  // Put each document back where it was, one request per previous collection
  const undo = (chosen: Document[]) => {
    const byPrevious = new Map<string | null, string[]>();
    for (const doc of chosen) {
      const ids = byPrevious.get(doc.collection_id) ?? [];
      ids.push(doc.document_id);
      byPrevious.set(doc.collection_id, ids);
    }
    for (const [collectionId, documentIds] of byPrevious) {
      move.mutate({ documentIds, collectionId, silent: true });
    }
  };

  const count = selected.size;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !move.isPending && onOpenChange(next)}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="pr-6">
            Add documents to {collection ? `“${collection.name}”` : ""}
          </DialogTitle>
          <DialogDescription>
            A document lives in one collection, so any you pick from another
            collection move here.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your documents"
              aria-label="Search your documents"
              autoComplete="off"
              className="pl-9"
            />
          </div>

          <div className="h-72 overflow-y-auto rounded-xl border border-border">
            {isLoading ? (
              <ul className="flex flex-col gap-1 p-2" aria-busy="true">
                {Array.from({ length: 5 }, (_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder rows
                  <li key={i}>
                    <Skeleton className="h-12 rounded-lg" />
                  </li>
                ))}
              </ul>
            ) : isError ? (
              <EmptyState
                icon={FileX}
                title="Could not load your documents"
                description="Check your connection and try again."
                className="h-full justify-center border-0"
                action={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                  >
                    Try again
                  </Button>
                }
              />
            ) : candidates.length === 0 ? (
              <EmptyState
                icon={FileSearch}
                title={
                  search
                    ? `No documents match “${search}”`
                    : (data?.documents.length ?? 0) > 0
                      ? "Everything is already here"
                      : "No documents to add"
                }
                description={
                  search
                    ? "Try a different name, category or tag."
                    : (data?.documents.length ?? 0) > 0
                      ? "All your documents are in this collection."
                      : "Upload a document first, then add it here."
                }
                className="h-full justify-center border-0"
              />
            ) : (
              <ul className="flex flex-col p-1">
                {candidates.map((doc) => (
                  <li key={doc.document_id}>
                    <label
                      htmlFor={`add-doc-${doc.document_id}`}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition-colors duration-150 ease-snap",
                        "[@media(hover:hover)and(pointer:fine)]:hover:bg-accent/50",
                        selected.has(doc.document_id) && "bg-secondary/40",
                      )}
                    >
                      <Checkbox
                        id={`add-doc-${doc.document_id}`}
                        checked={selected.has(doc.document_id)}
                        onCheckedChange={(checked) =>
                          toggle(doc.document_id, checked === true)
                        }
                      />
                      <FileIcon type={doc.file_type} />
                      <span className="min-w-0 flex-1">
                        <span
                          className="block truncate text-body font-medium text-foreground"
                          title={doc.filename}
                        >
                          {doc.filename}
                        </span>
                        <span className="block truncate text-meta tabular-nums text-muted-foreground">
                          {doc.collection_name
                            ? `In ${doc.collection_name}`
                            : "No collection"}
                          {" · "}
                          {formatBytes(doc.size_bytes)}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={move.isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={count === 0 || move.isPending}>
              {move.isPending && <Loader2 className="animate-spin" />}
              {count === 0
                ? "Add documents"
                : `Add ${pluralize(count, "document")}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
