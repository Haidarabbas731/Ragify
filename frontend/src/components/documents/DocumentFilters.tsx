import { Search, X } from "lucide-react";
import { CollectionSelect } from "@/components/shared/CollectionSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DocumentStatus } from "@/types/api";

export type SortKey = "newest" | "oldest" | "name-asc" | "name-desc";

export interface DocumentFilterValues {
  search: string;
  collectionId: string | null;
  status: DocumentStatus | null;
  sort: SortKey;
}

export const DEFAULT_SORT: SortKey = "newest";

/** How each sort option maps to the API's `sort_by` and `order`. */
export const SORT_PARAMS: Record<
  SortKey,
  { sort_by: string; order: "asc" | "desc" }
> = {
  newest: { sort_by: "created_at", order: "desc" },
  oldest: { sort_by: "created_at", order: "asc" },
  "name-asc": { sort_by: "filename", order: "asc" },
  "name-desc": { sort_by: "filename", order: "desc" },
};

const SORT_LABELS: Record<SortKey, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  "name-asc": "Name A to Z",
  "name-desc": "Name Z to A",
};

const STATUS_OPTIONS: { value: DocumentStatus; label: string }[] = [
  { value: "active", label: "Ready" },
  { value: "processing", label: "Processing" },
  { value: "error", label: "Failed" },
];

// Radix Select reserves "" for "no value", so "all" stands in for null.
const ALL = "all";

interface DocumentFiltersProps {
  values: DocumentFilterValues;
  collections: {
    collection_id: string;
    name: string;
    document_count: number;
  }[];
  onChange: (changes: Partial<DocumentFilterValues>) => void;
  onClear: () => void;
}

/** Search, collection, status and sort controls for the documents list. */
export function DocumentFilters({
  values,
  collections,
  onChange,
  onClear,
}: DocumentFiltersProps) {
  const hasActiveFilters =
    values.search !== "" ||
    values.collectionId !== null ||
    values.status !== null ||
    values.sort !== DEFAULT_SORT;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-48 flex-1 sm:max-w-sm">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={values.search}
          onChange={(e) => onChange({ search: e.target.value })}
          placeholder="Search documents…"
          aria-label="Search documents"
          className="h-10 pl-9"
        />
      </div>

      <CollectionSelect
        collections={collections}
        value={values.collectionId}
        onChange={(collectionId) => onChange({ collectionId })}
        className="w-auto"
      />

      <Select
        value={values.status ?? ALL}
        onValueChange={(next) =>
          onChange({ status: next === ALL ? null : (next as DocumentStatus) })
        }
      >
        <SelectTrigger aria-label="Status" className="h-10 w-auto min-w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All statuses</SelectItem>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={values.sort}
        onValueChange={(next) => onChange({ sort: next as SortKey })}
      >
        <SelectTrigger aria-label="Sort" className="h-10 w-auto min-w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
            <SelectItem key={key} value={key}>
              {SORT_LABELS[key]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X /> Clear
        </Button>
      )}
    </div>
  );
}
