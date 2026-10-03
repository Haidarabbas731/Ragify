import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

interface IndexingStripProps {
  /** Documents currently being processed. Renders nothing when zero. */
  count: number;
}

/** Shown only while documents are being indexed, with a link to see which. */
export function IndexingStrip({ count }: IndexingStripProps) {
  if (count <= 0) return null;

  return (
    <output className="fade-in-soft flex items-center gap-2 rounded-xl border border-warning/25 bg-warning/10 px-4 py-2.5 text-body text-warning">
      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      <span className="flex-1">
        Indexing {count} document{count === 1 ? "" : "s"}
      </span>
      <Link
        to="/documents?status=processing"
        className="font-medium underline-offset-2 hover:underline"
      >
        View
      </Link>
    </output>
  );
}
