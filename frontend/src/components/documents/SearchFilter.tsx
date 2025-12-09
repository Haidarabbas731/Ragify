/**
 * Search & Filter Component - Mission Control Filter Panel
 * Clean data interface for document filtering and search
 * Fonts: Geist (sans), Geist Mono (mono)
 */

import { Filter, Search, X } from "lucide-react";
import { useState } from "react";

interface SearchFilterProps {
  collections: Array<{ collection_id: string; name: string }>;
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  searchTerm: string;
  collectionId: string | null;
  statusFilter: string | null;
  sortBy: "created_at" | "filename" | "status";
  order: "asc" | "desc";
}

export function SearchFilter({
  collections,
  onFilterChange,
}: SearchFilterProps) {
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: "",
    collectionId: null,
    statusFilter: null,
    sortBy: "created_at",
    order: "desc",
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilters = (updates: Partial<FilterState>) => {
    const newFilters = { ...filters, ...updates };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters: FilterState = {
      searchTerm: "",
      collectionId: null,
      statusFilter: null,
      sortBy: "created_at",
      order: "desc",
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const activeFilterCount =
    (filters.searchTerm ? 1 : 0) +
    (filters.collectionId ? 1 : 0) +
    (filters.statusFilter ? 1 : 0) +
    (filters.sortBy !== "created_at" || filters.order !== "desc" ? 1 : 0);

  const statusOptions = [
    { value: "active", label: "ACTIVE", color: "primary" },
    { value: "processing", label: "PROC", color: "blue" },
    { value: "error", label: "ERROR", color: "red" },
    { value: "stuck", label: "STUCK", color: "orange" },
  ];

  return (
    <div className="mb-6">
      {/* Filter Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 border border-primary/30 rounded">
            <Filter className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-primary font-sans tracking-tight">
              FILTER CONTROL
            </h3>
            {activeFilterCount > 0 && (
              <p className="text-xs text-primary font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                  {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}{" "}
                  active
                </span>
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-3 py-1.5 bg-card border border-border text-primary text-xs font-mono font-bold rounded hover:bg-muted transition-colors"
        >
          {isExpanded ? "COLLAPSE" : "EXPAND"}
        </button>
      </div>

      {/* Search Bar (Always Visible) */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
        <input
          type="text"
          value={filters.searchTerm}
          onChange={(e) => updateFilters({ searchTerm: e.target.value })}
          placeholder="SEARCH FILES BY NAME..."
          className="w-full pl-10 pr-10 py-2.5 bg-card border-2 border-border text-foreground placeholder:text-muted-foreground/50 font-mono text-sm rounded focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all uppercase"
        />
        {filters.searchTerm && (
          <button
            type="button"
            onClick={() => updateFilters({ searchTerm: "" })}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded transition-colors"
          >
            <X className="w-3 h-3 text-primary" />
          </button>
        )}
      </div>

      {/* Filter Panel (Expandable) */}
      {isExpanded && (
        <div className="bg-muted/30 border-2 border-border rounded-lg p-4 space-y-4 animate-slideDown">
          {/* Collection Filter */}
          <div>
            <div className="block text-xs font-bold text-primary font-mono mb-2 uppercase">
              [COLLECTION]
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => updateFilters({ collectionId: null })}
                className={`px-3 py-1.5 text-xs font-mono font-bold rounded border-2 transition-all ${
                  filters.collectionId === null
                    ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/30"
                    : "bg-card border-border text-foreground hover:bg-muted"
                }`}
              >
                ALL
              </button>
              {collections.map((collection) => (
                <button
                  key={collection.collection_id}
                  type="button"
                  onClick={() =>
                    updateFilters({ collectionId: collection.collection_id })
                  }
                  className={`px-3 py-1.5 text-xs font-mono font-bold rounded border-2 transition-all ${
                    filters.collectionId === collection.collection_id
                      ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/30"
                      : "bg-card border-border text-foreground hover:bg-muted"
                  }`}
                >
                  {collection.name.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <div className="block text-xs font-bold text-primary font-mono mb-2 uppercase">
              [STATUS]
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => updateFilters({ statusFilter: null })}
                className={`px-3 py-1.5 text-xs font-mono font-bold rounded border-2 transition-all ${
                  filters.statusFilter === null
                    ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/30"
                    : "bg-card border-border text-foreground hover:bg-muted"
                }`}
              >
                ALL
              </button>
              {statusOptions.map((status) => (
                <button
                  key={status.value}
                  type="button"
                  onClick={() => updateFilters({ statusFilter: status.value })}
                  className={`px-3 py-1.5 text-xs font-mono font-bold rounded border-2 transition-all flex items-center gap-1.5 ${
                    filters.statusFilter === status.value
                      ? `bg-${status.color}-600 dark:bg-${status.color}-500 border-${status.color}-700 dark:border-${status.color}-400 text-white shadow-lg`
                      : "bg-card border-border text-foreground hover:bg-muted"
                  }`}
                >
                  {filters.statusFilter === status.value && (
                    <span
                      className={`w-1.5 h-1.5 bg-white rounded-full animate-pulse`}
                    />
                  )}
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sort Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sort By */}
            <div>
              <label
                htmlFor="sort-by"
                className="block text-xs font-bold text-primary font-mono mb-2 uppercase"
              >
                [SORT BY]
              </label>
              <select
                id="sort-by"
                value={filters.sortBy}
                onChange={(e) =>
                  updateFilters({
                    sortBy: e.target.value as
                      | "created_at"
                      | "filename"
                      | "status",
                  })
                }
                className="w-full px-3 py-2 bg-card border-2 border-border text-foreground font-mono text-xs font-bold rounded focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 uppercase"
              >
                <option value="created_at">UPLOAD DATE</option>
                <option value="filename">FILE NAME</option>
                <option value="status">STATUS</option>
              </select>
            </div>

            {/* Order */}
            <div>
              <label
                htmlFor="order"
                className="block text-xs font-bold text-primary font-mono mb-2 uppercase"
              >
                [ORDER]
              </label>
              <select
                id="order"
                value={filters.order}
                onChange={(e) =>
                  updateFilters({ order: e.target.value as "asc" | "desc" })
                }
                className="w-full px-3 py-2 bg-card border-2 border-border text-foreground font-mono text-xs font-bold rounded focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 uppercase"
              >
                <option value="desc">DESCENDING</option>
                <option value="asc">ASCENDING</option>
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="w-full px-4 py-2 bg-red-600 dark:bg-red-500 hover:bg-red-500 dark:hover:bg-red-400 text-white font-mono text-xs font-bold rounded transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-900/30"
            >
              <X className="w-4 h-4" />
              CLEAR ALL FILTERS
            </button>
          )}
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slideDown {
          animation: slideDown 200ms ease-out;
        }
      `}</style>
    </div>
  );
}
