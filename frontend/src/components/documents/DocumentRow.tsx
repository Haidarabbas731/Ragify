import {
  ExternalLink,
  FolderInput,
  MoreHorizontal,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatBytes, formatDate, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Document } from "@/types/api";
import { FileIcon } from "./FileIcon";
import { MoveToCollectionItems } from "./MoveToCollectionMenu";

interface DocumentRowProps {
  document: Document;
  /** Show the selection checkbox column. */
  selectable?: boolean;
  selected?: boolean;
  collections?: { collection_id: string; name: string }[];
  onSelectChange?: (checked: boolean) => void;
  onOpen: () => void;
  /** Each action below is offered in the row menu only when its handler is given. */
  onRetry?: () => void;
  onMove?: (collectionId: string | null) => void;
  onDelete?: () => void;
}

/** One document in the table: select, open, status, and a menu of row actions. */
export function DocumentRow({
  document: doc,
  selectable = false,
  selected = false,
  collections = [],
  onSelectChange,
  onOpen,
  onRetry,
  onMove,
  onDelete,
}: DocumentRowProps) {
  const canRetry = doc.status === "error" && onRetry;
  const hasMenu = Boolean(canRetry || onMove || onDelete);

  return (
    <tr
      className={cn(
        "border-t border-border transition-colors duration-150 ease-snap hover:bg-accent/50",
        selected && "bg-secondary/40 hover:bg-secondary/50",
      )}
    >
      {selectable && (
        <td className="w-10 py-3 pl-4">
          <Checkbox
            checked={selected}
            onCheckedChange={(checked) => onSelectChange?.(checked === true)}
            aria-label={`Select ${doc.filename}`}
          />
        </td>
      )}

      <td className="max-w-0 py-3 pl-4 pr-3">
        <div className="flex items-center gap-3">
          <FileIcon type={doc.file_type} />
          <div className="min-w-0">
            <button
              type="button"
              onClick={onOpen}
              title={doc.filename}
              className="block max-w-full truncate text-left text-body font-medium text-foreground hover:text-primary focus-visible:outline-none focus-visible:underline"
            >
              {doc.filename}
            </button>
            {doc.status === "error" && doc.error_message ? (
              <p
                className="truncate text-meta text-destructive"
                title={doc.error_message}
              >
                {doc.error_message}
              </p>
            ) : (
              <p className="truncate text-meta tabular-nums text-muted-foreground lg:hidden">
                {formatBytes(doc.size_bytes)} ·{" "}
                {formatRelative(doc.uploaded_at)}
              </p>
            )}
          </div>
        </div>
      </td>

      <td className="hidden max-w-40 truncate px-3 py-3 text-body text-muted-foreground md:table-cell">
        {doc.collection_name ?? "—"}
      </td>

      <td className="px-3 py-3">
        <StatusBadge status={doc.status} />
      </td>

      <td className="hidden whitespace-nowrap px-3 py-3 text-body tabular-nums text-muted-foreground lg:table-cell">
        {formatBytes(doc.size_bytes)}
        {doc.status === "active" && doc.chunks_count > 0 && (
          <span className="block text-meta">{doc.chunks_count} chunks</span>
        )}
      </td>

      <td
        className="hidden whitespace-nowrap px-3 py-3 text-body text-muted-foreground lg:table-cell"
        title={formatDate(doc.uploaded_at, { withTime: true })}
      >
        {formatRelative(doc.uploaded_at)}
      </td>

      <td className="w-12 py-3 pr-3 text-right">
        {hasMenu && (
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={`Actions for ${doc.filename}`}
              className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-[color,background-color,transform] duration-150 ease-snap hover:bg-accent hover:text-foreground active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-accent"
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onSelect={onOpen}>
                <ExternalLink /> Open
              </DropdownMenuItem>
              {onMove && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <FolderInput /> Move to collection
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-52">
                    <MoveToCollectionItems
                      collections={collections}
                      currentId={doc.collection_id}
                      onMove={onMove}
                    />
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}
              {canRetry && (
                <DropdownMenuItem onSelect={onRetry}>
                  <RefreshCw /> Retry processing
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={onDelete}
                  >
                    <Trash2 /> Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </td>
    </tr>
  );
}
