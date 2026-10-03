import { Checkbox } from "@/components/ui/checkbox";
import type { Document } from "@/types/api";
import { DocumentRow } from "./DocumentRow";

interface DocumentTableProps {
  documents: Document[];
  selectable?: boolean;
  selectedIds?: Set<string>;
  /** Header checkbox state: all, some (indeterminate) or none of the visible rows. */
  headerState?: boolean | "indeterminate";
  collections?: { collection_id: string; name: string }[];
  onToggleAll?: (checked: boolean) => void;
  onToggle?: (id: string, checked: boolean) => void;
  onOpen: (doc: Document) => void;
  onRetry?: (doc: Document) => void;
  onMove?: (doc: Document, collectionId: string | null) => void;
  onDelete?: (doc: Document) => void;
}

/** Documents as a table: select, name, collection, status, size, uploaded, row menu. */
export function DocumentTable({
  documents,
  selectable = false,
  selectedIds,
  headerState = false,
  collections,
  onToggleAll,
  onToggle,
  onOpen,
  onRetry,
  onMove,
  onDelete,
}: DocumentTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <table className="w-full table-fixed text-left">
        <thead>
          <tr className="text-meta text-muted-foreground">
            {selectable && (
              <th scope="col" className="w-10 py-2.5 pl-4">
                <Checkbox
                  checked={headerState}
                  onCheckedChange={(checked) => onToggleAll?.(checked === true)}
                  aria-label="Select all rows on this page"
                />
              </th>
            )}
            <th scope="col" className="py-2.5 pl-4 pr-3 font-medium">
              Name
            </th>
            <th
              scope="col"
              className="hidden w-40 px-3 py-2.5 font-medium md:table-cell"
            >
              Collection
            </th>
            <th scope="col" className="w-32 px-3 py-2.5 font-medium">
              Status
            </th>
            <th
              scope="col"
              className="hidden w-28 px-3 py-2.5 font-medium lg:table-cell"
            >
              Size
            </th>
            <th
              scope="col"
              className="hidden w-44 px-3 py-2.5 font-medium lg:table-cell"
            >
              Uploaded
            </th>
            <th scope="col" className="w-12 py-2.5 pr-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <DocumentRow
              key={doc.document_id}
              document={doc}
              selectable={selectable}
              selected={selectedIds?.has(doc.document_id)}
              collections={collections}
              onSelectChange={(checked) => onToggle?.(doc.document_id, checked)}
              onOpen={() => onOpen(doc)}
              onRetry={onRetry && (() => onRetry(doc))}
              onMove={onMove && ((collectionId) => onMove(doc, collectionId))}
              onDelete={onDelete && (() => onDelete(doc))}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
