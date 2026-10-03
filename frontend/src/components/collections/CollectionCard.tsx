import { FolderOpen, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Collection } from "@/types/api";

interface CollectionCardProps {
  collection: Collection;
  /** Position in the first-paint stagger; omit for cards added later. */
  staggerIndex?: number;
  onEdit: (collection: Collection) => void;
  onDelete: (collection: Collection) => void;
}

/** One collection. The whole card opens its documents; the menu holds edit and delete. */
export function CollectionCard({
  collection,
  staggerIndex,
  onEdit,
  onDelete,
}: CollectionCardProps) {
  const { collection_id, name, description, document_count } = collection;

  return (
    <li
      className={cn(
        "group relative flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-[var(--ragify-shadow)] transition-[border-color] duration-150 ease-snap",
        "focus-within:border-primary/40 [@media(hover:hover)and(pointer:fine)]:hover:border-primary/40",
        staggerIndex === undefined ? "motion-row-in" : "stagger-in",
      )}
      style={
        staggerIndex === undefined
          ? undefined
          : ({ "--stagger-index": staggerIndex } as CSSProperties)
      }
    >
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <FolderOpen className="size-4" aria-hidden="true" />
        </div>
        <h2 className="min-w-0 flex-1 pt-1.5 text-section">
          <Link
            to={`/documents?collection=${collection_id}`}
            className="block truncate rounded-sm outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-ring"
            title={name}
          >
            {name}
          </Link>
        </h2>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Actions for ${name}`}
              className="relative z-10 -mr-1.5 -mt-1 shrink-0 text-muted-foreground [@media(hover:hover)and(pointer:fine)]:opacity-0 [@media(hover:hover)and(pointer:fine)]:group-hover:opacity-100 [@media(hover:hover)and(pointer:fine)]:group-focus-within:opacity-100 data-[state=open]:opacity-100"
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onEdit(collection)}>
              <Pencil /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() => onDelete(collection)}
            >
              <Trash2 /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p
        className={cn(
          "line-clamp-2 min-h-[2lh] text-body",
          "text-muted-foreground",
          !description && "italic",
        )}
      >
        {description || "No description"}
      </p>

      <div className="flex items-center justify-between text-meta text-muted-foreground">
        <span className="tabular-nums text-foreground">
          {document_count} {document_count === 1 ? "document" : "documents"}
        </span>
        <span>Updated {formatRelative(collection.updated_at)}</span>
      </div>
    </li>
  );
}
