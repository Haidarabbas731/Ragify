import { ChevronDown, Layers } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DocumentChunk } from "@/types/api";

const PREVIEW_COUNT = 5;

interface ChunkListProps {
  chunks: DocumentChunk[];
  /** Total chunk count reported by the document. */
  total: number;
  /** Shown when there are no chunks yet. */
  processing: boolean;
}

/** The text segments a document was split into, with a preview and a show-all toggle. */
export function ChunkList({ chunks, total, processing }: ChunkListProps) {
  const [showAll, setShowAll] = useState(false);

  if (chunks.length === 0) {
    return (
      <EmptyState
        icon={Layers}
        title={processing ? "Processing document" : "No content chunks"}
        description={
          processing
            ? "Chunks appear here as soon as processing finishes."
            : "This document has no indexed content."
        }
      />
    );
  }

  const shown = showAll ? chunks : chunks.slice(0, PREVIEW_COUNT);
  const canToggle = chunks.length > PREVIEW_COUNT;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-border py-4">
        <CardTitle className="flex items-center gap-2">
          Content chunks
          <span className="rounded-full bg-muted px-2 py-0.5 text-meta tabular-nums text-muted-foreground">
            {total}
          </span>
        </CardTitle>
        {canToggle && (
          <Button
            variant="ghost"
            size="sm"
            aria-expanded={showAll}
            onClick={() => setShowAll((value) => !value)}
          >
            {showAll ? "Show less" : `Show all ${total}`}
            <ChevronDown
              className={cn(
                "transition-transform duration-150 ease-snap",
                showAll && "rotate-180",
              )}
            />
          </Button>
        )}
      </CardHeader>

      <ol className="divide-y divide-border">
        {shown.map((chunk) => {
          const { page, section } = chunk.metadata ?? {};
          return (
            <li key={chunk.chunk_id} className="flex gap-4 px-5 py-4">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-meta tabular-nums text-muted-foreground">
                {chunk.chunk_index + 1}
              </span>
              <div className="min-w-0 flex-1">
                {(page !== undefined || section !== undefined) && (
                  <p className="mb-1.5 flex flex-wrap items-center gap-2 text-meta text-muted-foreground">
                    {page !== undefined && <span>Page {String(page)}</span>}
                    {section !== undefined && (
                      <span className="rounded bg-muted px-1.5 py-0.5">
                        {String(section)}
                      </span>
                    )}
                  </p>
                )}
                <p className="whitespace-pre-wrap break-words text-body">
                  {chunk.content}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
