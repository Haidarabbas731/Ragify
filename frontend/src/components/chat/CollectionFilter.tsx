/**
 * Collection Filter Component
 * Elegant dropdown filter for selecting collections in chat
 * Matches purple/indigo theme with smooth animations
 */

import {
  Check,
  ChevronDown,
  Filter,
  FolderOpen,
  Layers,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Collection {
  collection_id: string;
  name: string;
  document_count: number;
}

interface CollectionFilterProps {
  collections: Collection[];
  selectedCollectionId: string | null;
  onSelectCollection: (collectionId: string | null) => void;
  className?: string;
}

/**
 * CollectionFilter - Dropdown for filtering chat by collection
 * Features: Smooth animations, click-outside detection, purple accent
 */
export function CollectionFilter({
  collections,
  selectedCollectionId,
  onSelectCollection,
  className = "",
}: CollectionFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get selected collection for display
  const selectedCollection = collections.find(
    (c) => c.collection_id === selectedCollectionId,
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClearFilter = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectCollection(null);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button - Match input field height (44px) */}
      <div
        className={`flex items-center gap-2 px-4 h-[44px] rounded-lg border transition-all duration-300 ${
          selectedCollectionId
            ? "bg-primary/10 border-primary/30 text-primary"
            : "bg-muted border-border text-foreground hover:bg-muted/80"
        }`}
      >
        {selectedCollectionId ? (
          <>
            <Layers className="w-4 h-4" />
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="text-sm font-medium font-sans hover:opacity-80 transition-opacity"
            >
              {selectedCollection?.name}
            </button>
            <button
              type="button"
              onClick={handleClearFilter}
              className="p-0.5 rounded hover:bg-primary/20 transition-colors"
              aria-label="Clear filter"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 w-full"
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium font-sans">
              All Collections
            </span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        )}
      </div>

      {/* Dropdown Menu - Show above the button */}
      {isOpen && (
        <div className="absolute bottom-full mb-2 left-0 w-64 bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 z-50">
          {/* All Collections Option */}
          <button
            type="button"
            onClick={() => {
              onSelectCollection(null);
              setIsOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors ${
              !selectedCollectionId ? "bg-primary/10" : ""
            }`}
          >
            <Layers
              className={`w-4 h-4 ${
                !selectedCollectionId ? "text-primary" : "text-muted-foreground"
              }`}
            />
            <span
              className={`flex-1 text-left text-sm font-medium font-sans ${
                !selectedCollectionId ? "text-primary" : "text-foreground"
              }`}
            >
              All Collections
            </span>
            {!selectedCollectionId && (
              <Check className="w-4 h-4 text-primary" />
            )}
          </button>

          <div className="h-px bg-border" />

          {/* Collection List */}
          <div className="max-h-64 overflow-y-auto custom-scrollbar">
            {collections.map((collection) => (
              <button
                key={collection.collection_id}
                type="button"
                onClick={() => {
                  onSelectCollection(collection.collection_id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors ${
                  selectedCollectionId === collection.collection_id
                    ? "bg-primary/10"
                    : ""
                }`}
              >
                <FolderOpen
                  className={`w-4 h-4 ${
                    selectedCollectionId === collection.collection_id
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                />
                <div className="flex-1 text-left">
                  <p
                    className={`text-sm font-medium font-sans ${
                      selectedCollectionId === collection.collection_id
                        ? "text-primary"
                        : "text-foreground"
                    }`}
                  >
                    {collection.name}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {collection.document_count} docs
                  </p>
                </div>
                {selectedCollectionId === collection.collection_id && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
