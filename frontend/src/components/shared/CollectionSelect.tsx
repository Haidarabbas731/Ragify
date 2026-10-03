import { FolderOpen, Layers } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface CollectionOption {
  collection_id: string;
  name: string;
  document_count: number;
}

interface CollectionSelectProps {
  collections: CollectionOption[];
  /** Selected collection, or `null` for all collections. */
  value: string | null;
  onChange: (collectionId: string | null) => void;
  className?: string;
}

// Radix Select reserves "" for "no value", so "all" stands in for null.
const ALL = "all";

/** Picks a collection to scope Documents and Chat; `null` means all collections. */
export function CollectionSelect({
  collections,
  value,
  onChange,
  className,
}: CollectionSelectProps) {
  return (
    <Select
      value={value ?? ALL}
      onValueChange={(next) => onChange(next === ALL ? null : next)}
    >
      <SelectTrigger
        aria-label="Collection"
        className={cn("h-10 min-w-40 gap-2", className)}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>
          <span className="flex items-center gap-2">
            <Layers className="size-4 text-muted-foreground" />
            All collections
          </span>
        </SelectItem>
        {collections.map((collection) => (
          <SelectItem
            key={collection.collection_id}
            value={collection.collection_id}
          >
            <span className="flex items-center gap-2">
              <FolderOpen className="size-4 text-muted-foreground" />
              {collection.name}
              <span className="text-meta tabular-nums text-muted-foreground">
                {collection.document_count}
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
