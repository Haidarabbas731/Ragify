import { Trash2, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MoveToCollectionMenu } from "./MoveToCollectionMenu";

interface SelectionBarProps {
  /** Number of documents the actions will apply to. */
  count: number;
  /** Offer "Select all N matching" (everything on the page is selected and more exist). */
  matchingTotal?: number;
  /** Every matching document, across pages, is selected. */
  allMatchingSelected: boolean;
  collections: { collection_id: string; name: string }[];
  busy: boolean;
  onSelectMatching: () => void;
  onMove: (collectionId: string | null) => void;
  onDelete: () => void;
  onClear: () => void;
}

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

/**
 * Floating bar for actions on the selected documents. It sits over the page instead of pushing
 * the table down, slides up from the bottom edge, and leaves the same way.
 */
export function SelectionBar({
  count,
  matchingTotal,
  allMatchingSelected,
  collections,
  busy,
  onSelectMatching,
  onMove,
  onDelete,
  onClear,
}: SelectionBarProps) {
  const reduceMotion = useReducedMotion();
  const hidden = reduceMotion
    ? { opacity: 0 }
    : { opacity: 0, transform: "translateY(calc(100% + 24px))" };
  const shown = reduceMotion
    ? { opacity: 1 }
    : { opacity: 1, transform: "translateY(0px)" };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
      <AnimatePresence>
        {count > 0 && (
          <motion.div
            key="selection-bar"
            role="toolbar"
            aria-label="Actions for selected documents"
            initial={hidden}
            animate={{
              ...shown,
              transition: { duration: 0.2, ease: EASE_OUT },
            }}
            exit={{
              ...hidden,
              transition: { duration: 0.15, ease: EASE_OUT },
            }}
            className="material-bar pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-2xl border border-border px-3 py-2 shadow-float"
          >
            <p className="px-1 text-body tabular-nums text-foreground">
              <span className="font-semibold">{count}</span> selected
              {allMatchingSelected && (
                <span className="text-muted-foreground"> (all matching)</span>
              )}
            </p>

            {matchingTotal !== undefined && !allMatchingSelected && (
              <Button
                variant="link"
                size="sm"
                className="h-8 px-1"
                onClick={onSelectMatching}
              >
                Select all {matchingTotal} matching
              </Button>
            )}

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex">
                <MoveToCollectionMenu
                  collections={collections}
                  onMove={onMove}
                  disabled={busy}
                />
              </span>
              <span className="sm:hidden">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex">
                      <MoveToCollectionMenu
                        collections={collections}
                        onMove={onMove}
                        disabled={busy}
                        iconOnly
                      />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Move to collection</TooltipContent>
                </Tooltip>
              </span>

              <Button
                variant="destructive"
                size="sm"
                onClick={onDelete}
                disabled={busy}
                aria-label="Delete selected"
              >
                <Trash2 />
                <span className="hidden sm:inline">Delete</span>
              </Button>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={onClear}
                    aria-label="Clear selection"
                  >
                    <X />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Clear selection</TooltipContent>
              </Tooltip>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
