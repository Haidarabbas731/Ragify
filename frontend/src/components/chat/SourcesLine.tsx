import { FileText } from "lucide-react";
import type { SourceCitation } from "@/types/api";

interface SourcesLineProps {
  sources: SourceCitation[];
}

/** The documents an answer drew from, as highlighter-marked chips. */
export function SourcesLine({ sources }: SourcesLineProps) {
  const filenames = [...new Set(sources.map((source) => source.filename))];
  if (filenames.length === 0) return null;

  return (
    <div className="fade-in-soft mt-3 flex flex-wrap items-center gap-1.5">
      <span className="flex items-center gap-1 text-meta text-muted-foreground">
        <FileText className="size-3.5" aria-hidden="true" />
        Sources
      </span>
      {filenames.map((filename) => (
        <span
          key={filename}
          className="max-w-full truncate rounded-md bg-highlight px-2 py-0.5 text-meta text-highlight-foreground"
          title={filename}
        >
          {filename}
        </span>
      ))}
    </div>
  );
}
