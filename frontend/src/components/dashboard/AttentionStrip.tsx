import { AlertCircle, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface AttentionStripProps {
  /** Documents currently being indexed. */
  processing: number;
  /** Documents that failed to process. */
  failed: number;
}

function Strip({
  tone,
  icon,
  text,
  to,
}: {
  tone: "warning" | "destructive";
  icon: React.ReactNode;
  text: string;
  to: string;
}) {
  return (
    <output
      className={cn(
        "fade-in-soft flex items-center gap-2 rounded-xl border px-4 py-2.5 text-body",
        tone === "warning"
          ? "border-warning/25 bg-warning/10 text-warning"
          : "border-destructive/25 bg-destructive/10 text-destructive",
      )}
    >
      {icon}
      <span className="flex-1">{text}</span>
      <Link to={to} className="font-medium underline underline-offset-2">
        View
      </Link>
    </output>
  );
}

const plural = (count: number) => (count === 1 ? "document" : "documents");

/** Only appears when something needs attention: documents failing or still being indexed. */
export function AttentionStrip({ processing, failed }: AttentionStripProps) {
  if (processing <= 0 && failed <= 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {failed > 0 && (
        <Strip
          tone="destructive"
          icon={<AlertCircle className="size-4" aria-hidden="true" />}
          text={`${failed} ${plural(failed)} failed to process`}
          to="/documents?status=error"
        />
      )}
      {processing > 0 && (
        <Strip
          tone="warning"
          icon={<Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          text={`Indexing ${processing} ${plural(processing)}`}
          to="/documents?status=processing"
        />
      )}
    </div>
  );
}
