import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface SearchFilterProps {
  collections: Array<{ collection_id: string; name: string }>;
  onFilterChange: (filters: FilterState) => void;
  totalCount?: number;
}

export interface FilterState {
  searchTerm: string;
  collectionId: string | null;
  statusFilter: string | null;
  sortBy: "created_at" | "filename" | "status";
  order: "asc" | "desc";
}

const STATUS_OPTIONS = [
  { value: "active", label: "Active", dot: "bg-emerald-500" },
  { value: "processing", label: "Processing", dot: "bg-blue-500" },
  { value: "error", label: "Error", dot: "bg-red-500" },
  { value: "deleted", label: "Deleted", dot: "bg-gray-400" },
];

const SORT_OPTIONS = [
  {
    sortBy: "created_at" as const,
    order: "desc" as const,
    label: "Newest first",
  },
  {
    sortBy: "created_at" as const,
    order: "asc" as const,
    label: "Oldest first",
  },
  { sortBy: "filename" as const, order: "asc" as const, label: "Name A→Z" },
  { sortBy: "filename" as const, order: "desc" as const, label: "Name Z→A" },
];

function DropdownMenu({
  trigger,
  children,
}: {
  trigger: React.ReactNode;
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="contents"
      >
        {trigger}
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-30 min-w-[160px] rounded-xl bg-popover border border-border shadow-[0_8px_32px_-8px_rgba(0,0,0,0.16)] py-1.5 overflow-hidden">
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function SearchFilter({
  collections,
  onFilterChange,
  totalCount,
}: SearchFilterProps) {
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: "",
    collectionId: null,
    statusFilter: null,
    sortBy: "created_at",
    order: "desc",
  });

  const update = (updates: Partial<FilterState>) => {
    const next = { ...filters, ...updates };
    setFilters(next);
    onFilterChange(next);
  };

  const clearAll = () => {
    const cleared: FilterState = {
      searchTerm: "",
      collectionId: null,
      statusFilter: null,
      sortBy: "created_at",
      order: "desc",
    };
    setFilters(cleared);
    onFilterChange(cleared);
  };

  const activeCount =
    (filters.searchTerm ? 1 : 0) +
    (filters.collectionId ? 1 : 0) +
    (filters.statusFilter ? 1 : 0) +
    (filters.sortBy !== "created_at" || filters.order !== "desc" ? 1 : 0);

  const currentSort =
    SORT_OPTIONS.find(
      (s) => s.sortBy === filters.sortBy && s.order === filters.order,
    ) ?? SORT_OPTIONS[0];

  const selectedCollection = collections.find(
    (c) => c.collection_id === filters.collectionId,
  );
  const selectedStatus = STATUS_OPTIONS.find(
    (s) => s.value === filters.statusFilter,
  );

  return (
    <div className="flex items-center gap-2 py-1">
      {/* Search */}
      <div className="relative w-56 shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          type="text"
          value={filters.searchTerm}
          onChange={(e) => update({ searchTerm: e.target.value })}
          placeholder="Search documents…"
          className="w-full h-8 pl-8 pr-7 rounded-lg bg-muted/50 border border-transparent text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 focus:bg-background transition-all"
        />
        {filters.searchTerm && (
          <button
            type="button"
            onClick={() => update({ searchTerm: "" })}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Status dropdown */}
      <DropdownMenu
        trigger={
          <button
            type="button"
            className={`relative flex items-center gap-1.5 h-8 px-3 rounded-lg text-[13px] font-medium border transition-all whitespace-nowrap ${
              filters.statusFilter
                ? "bg-primary/10 border-primary/25 text-primary"
                : "bg-muted/50 border-transparent text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {selectedStatus && (
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${selectedStatus.dot}`}
              />
            )}
            {selectedStatus ? selectedStatus.label : "Status"}
            {filters.statusFilter ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  update({ statusFilter: null });
                }}
                className="ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
        }
      >
        {(close) => (
          <>
            <button
              type="button"
              onClick={() => {
                update({ statusFilter: null });
                close();
              }}
              className={`w-full text-left px-3 py-1.5 text-[13px] hover:bg-muted/60 transition-colors ${!filters.statusFilter ? "text-primary font-semibold" : "text-foreground"}`}
            >
              All statuses
            </button>
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => {
                  update({ statusFilter: s.value });
                  close();
                }}
                className={`w-full text-left px-3 py-1.5 text-[13px] hover:bg-muted/60 transition-colors flex items-center gap-2 ${filters.statusFilter === s.value ? "text-primary font-semibold" : "text-foreground"}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`}
                />
                {s.label}
              </button>
            ))}
          </>
        )}
      </DropdownMenu>

      {/* Collection dropdown */}
      {collections.length > 0 && (
        <DropdownMenu
          trigger={
            <button
              type="button"
              className={`relative flex items-center gap-1.5 h-8 px-3 rounded-lg text-[13px] font-medium border transition-all whitespace-nowrap max-w-[160px] ${
                filters.collectionId
                  ? "bg-primary/10 border-primary/25 text-primary"
                  : "bg-muted/50 border-transparent text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <span className="truncate">
                {selectedCollection ? selectedCollection.name : "Collection"}
              </span>
              {filters.collectionId ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    update({ collectionId: null });
                  }}
                  className="shrink-0"
                >
                  <X className="w-3 h-3" />
                </button>
              ) : (
                <ChevronDown className="w-3 h-3 shrink-0" />
              )}
            </button>
          }
        >
          {(close) => (
            <>
              <button
                type="button"
                onClick={() => {
                  update({ collectionId: null });
                  close();
                }}
                className={`w-full text-left px-3 py-1.5 text-[13px] hover:bg-muted/60 transition-colors ${!filters.collectionId ? "text-primary font-semibold" : "text-foreground"}`}
              >
                All collections
              </button>
              {collections.map((c) => (
                <button
                  key={c.collection_id}
                  type="button"
                  onClick={() => {
                    update({ collectionId: c.collection_id });
                    close();
                  }}
                  className={`w-full text-left px-3 py-1.5 text-[13px] hover:bg-muted/60 transition-colors truncate ${filters.collectionId === c.collection_id ? "text-primary font-semibold" : "text-foreground"}`}
                >
                  {c.name}
                </button>
              ))}
            </>
          )}
        </DropdownMenu>
      )}

      {/* Sort dropdown */}
      <DropdownMenu
        trigger={
          <button
            type="button"
            className={`flex items-center gap-1.5 h-8 px-3 rounded-lg text-[13px] font-medium border transition-all whitespace-nowrap ${
              filters.sortBy !== "created_at" || filters.order !== "desc"
                ? "bg-primary/10 border-primary/25 text-primary"
                : "bg-muted/50 border-transparent text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {currentSort.label}
            <ChevronDown className="w-3 h-3" />
          </button>
        }
      >
        {(close) => (
          <>
            {SORT_OPTIONS.map((s) => (
              <button
                key={`${s.sortBy}-${s.order}`}
                type="button"
                onClick={() => {
                  update({ sortBy: s.sortBy, order: s.order });
                  close();
                }}
                className={`w-full text-left px-3 py-1.5 text-[13px] hover:bg-muted/60 transition-colors ${s.sortBy === filters.sortBy && s.order === filters.order ? "text-primary font-semibold" : "text-foreground"}`}
              >
                {s.label}
              </button>
            ))}
          </>
        )}
      </DropdownMenu>

      {/* Count + clear */}
      <div className="flex items-center gap-2 ml-auto shrink-0">
        {typeof totalCount === "number" && (
          <span className="text-[12px] text-muted-foreground tabular-nums">
            {totalCount} {totalCount === 1 ? "file" : "files"}
          </span>
        )}
        {activeCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-[12px] font-medium text-primary hover:underline"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
