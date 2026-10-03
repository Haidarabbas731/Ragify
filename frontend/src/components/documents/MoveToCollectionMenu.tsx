import { Check, FolderInput, FolderMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CollectionOption {
  collection_id: string;
  name: string;
}

interface MoveToCollectionItemsProps {
  collections: CollectionOption[];
  /** Collection the document is in now, shown with a check. */
  currentId?: string | null;
  /** `null` means "remove from any collection". */
  onMove: (collectionId: string | null) => void;
}

/** Menu items for choosing a collection. Use inside any dropdown or sub-menu content. */
export function MoveToCollectionItems({
  collections,
  currentId,
  onMove,
}: MoveToCollectionItemsProps) {
  return (
    <>
      {collections.map((collection) => (
        <DropdownMenuItem
          key={collection.collection_id}
          onSelect={() => onMove(collection.collection_id)}
        >
          <span className="min-w-0 flex-1 truncate">{collection.name}</span>
          {currentId === collection.collection_id && (
            <Check className="text-primary" />
          )}
        </DropdownMenuItem>
      ))}
      {collections.length > 0 && <DropdownMenuSeparator />}
      <DropdownMenuItem onSelect={() => onMove(null)}>
        <FolderMinus /> No collection
      </DropdownMenuItem>
    </>
  );
}

interface MoveToCollectionMenuProps {
  collections: CollectionOption[];
  onMove: (collectionId: string | null) => void;
  /** Hide the text and keep only the icon (small screens). */
  iconOnly?: boolean;
  disabled?: boolean;
}

/** Button that opens a menu of collections to move the selected documents into. */
export function MoveToCollectionMenu({
  collections,
  onMove,
  iconOnly = false,
  disabled,
}: MoveToCollectionMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={iconOnly ? "icon-sm" : "sm"}
          disabled={disabled}
          aria-label="Move to collection"
        >
          <FolderInput />
          {!iconOnly && "Move to collection"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="center" className="w-56">
        <MoveToCollectionItems collections={collections} onMove={onMove} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
