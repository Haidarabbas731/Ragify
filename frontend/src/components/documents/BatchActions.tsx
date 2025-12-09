/**
 * Batch Actions Component - Command Center Batch Control
 * Clean interface for bulk document operations
 * Fonts: Geist (sans), Geist Mono (mono)
 */

import {
  AlertTriangle,
  CheckSquare,
  FolderInput,
  Square,
  Trash2,
} from "lucide-react";
import { useState } from "react";

interface BatchActionsProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBatchDelete: () => void;
  onMoveToCollection: (collectionId: string) => void;
  collections: Array<{ collection_id: string; name: string }>;
}

export function BatchActions({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onBatchDelete,
  onMoveToCollection,
  collections,
}: BatchActionsProps) {
  const [showCollectionMenu, setShowCollectionMenu] = useState(false);

  const hasSelection = selectedCount > 0;
  const isAllSelected = selectedCount === totalCount && totalCount > 0;

  return (
    <>
      <div className="mb-4 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-lg p-4 shadow-lg">
        {/* Command Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Selection Reticle Icon */}
            <div
              className={`relative p-1.5 sm:p-2 rounded border-2 transition-all duration-300 ${
                hasSelection
                  ? "bg-primary border-primary shadow-lg shadow-primary/50 animate-pulse-glow"
                  : "bg-slate-200 dark:bg-slate-700 border-slate-400 dark:border-slate-600"
              }`}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Tactical Reticle Overlay */}
                {hasSelection && (
                  <>
                    <div className="absolute w-1 h-full bg-primary-foreground/30" />
                    <div className="absolute h-1 w-full bg-primary-foreground/30" />
                  </>
                )}
              </div>
              {hasSelection ? (
                <CheckSquare
                  className="w-4 h-4 sm:w-5 sm:h-5 text-white relative z-10"
                  strokeWidth={3}
                />
              ) : (
                <Square
                  className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-400"
                  strokeWidth={2}
                />
              )}
            </div>

            {/* Status Display */}
            <div>
              <h3 className="text-sm sm:text-base md:text-lg font-bold text-slate-800 dark:text-slate-200 tracking-tight font-sans">
                BATCH OPERATIONS
              </h3>
              <p className="text-[10px] sm:text-xs font-mono text-slate-600 dark:text-slate-400">
                {hasSelection ? (
                  <span className="flex items-center gap-1 sm:gap-2">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full animate-pulse" />
                    <span className="text-primary font-bold">
                      {selectedCount} TARGET{selectedCount > 1 ? "S" : ""}{" "}
                      LOCKED
                    </span>
                  </span>
                ) : (
                  <span className="text-slate-500">AWAITING SELECTION</span>
                )}
              </p>
            </div>
          </div>

          {/* Selection Controls */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={isAllSelected ? onDeselectAll : onSelectAll}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-bold rounded hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500 transition-all shadow-sm font-sans"
            >
              {isAllSelected ? "DESELECT ALL" : "SELECT ALL"}
            </button>
          </div>
        </div>

        {/* Action Command Bar */}
        {hasSelection && (
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3 animate-slide-in">
            {/* Move to Collection */}
            <div className="relative flex-1 sm:flex-none">
              <button
                type="button"
                onClick={() => setShowCollectionMenu(!showCollectionMenu)}
                disabled={selectedCount === 0}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:from-slate-400 disabled:to-slate-500 text-white text-xs sm:text-sm font-bold rounded shadow-lg hover:shadow-xl transition-all disabled:cursor-not-allowed border-2 border-blue-800 dark:border-blue-500 font-sans"
              >
                <FolderInput
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                  strokeWidth={2.5}
                />
                <span className="hidden xs:inline">MOVE TO COLLECTION</span>
                <span className="inline xs:hidden">MOVE</span>
              </button>

              {/* Collection Dropdown Menu */}
              {showCollectionMenu && (
                <div className="absolute top-full left-0 mt-2 w-full sm:w-64 bg-white dark:bg-slate-800 border-2 border-blue-300 dark:border-blue-600 rounded-lg shadow-2xl z-50 animate-slide-down">
                  <div className="p-2 space-y-1">
                    {collections.map((collection) => (
                      <button
                        key={collection.collection_id}
                        type="button"
                        onClick={() => {
                          onMoveToCollection(collection.collection_id);
                          setShowCollectionMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                      >
                        {collection.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Delete Selected - Smart button that changes to red when all selected */}
            <button
              type="button"
              onClick={onBatchDelete}
              disabled={selectedCount === 0}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-br text-white text-xs sm:text-sm font-bold rounded shadow-lg hover:shadow-xl transition-all disabled:cursor-not-allowed border-2 font-sans ${
                isAllSelected
                  ? "from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 border-red-800 dark:border-red-500"
                  : "from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 border-amber-800 dark:border-amber-500"
              } disabled:from-slate-400 disabled:to-slate-500`}
            >
              {isAllSelected ? (
                <AlertTriangle
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse"
                  strokeWidth={2.5}
                />
              ) : (
                <Trash2
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                  strokeWidth={2.5}
                />
              )}
              <span className="hidden xs:inline">
                {isAllSelected ? `DELETE ALL ${totalCount}` : "DELETE SELECTED"}
              </span>
              <span className="inline xs:hidden">
                {isAllSelected ? `DEL ALL ${totalCount}` : "DELETE"}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Animations */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px hsl(var(--primary) / 0.5);
          }
          50% {
            box-shadow: 0 0 30px hsl(var(--primary) / 0.8);
          }
        }

        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        .animate-slide-in {
          animation: slide-in 300ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .animate-slide-down {
          animation: slide-down 200ms cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </>
  );
}
