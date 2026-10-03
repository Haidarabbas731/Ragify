import { Card, CardContent } from "@/components/ui/card";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { UserStats } from "@/types/api";

const BYTES_PER_MB = 1024 * 1024;
const WARN_AT = 90;

/** What is in the library and how much space is left, on one calm line. */
interface LibrarySummaryProps {
  stats: UserStats;
  /** Fill the storage meter in, for the first visit of a session. */
  animate?: boolean;
}

export function LibrarySummary({
  stats,
  animate = false,
}: LibrarySummaryProps) {
  const percentage = Math.min(Math.max(stats.storage_percentage, 0), 100);
  const nearLimit = percentage >= WARN_AT;
  const documents = stats.total_documents;

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-x-8 gap-y-3 p-4">
        <p className="text-body text-muted-foreground">
          <span className="font-semibold tabular-nums text-foreground">
            {documents.toLocaleString()}
          </span>{" "}
          {documents === 1 ? "document" : "documents"} ·{" "}
          <span className="font-semibold tabular-nums text-foreground">
            {stats.total_chunks.toLocaleString()}
          </span>{" "}
          searchable passages
        </p>

        <div className="flex min-w-56 flex-1 items-center gap-3">
          <div
            role="progressbar"
            aria-label="Storage used"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(percentage)}
            className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
          >
            <div
              className={cn(
                "h-full rounded-full",
                nearLimit ? "bg-warning" : "bg-primary",
                animate && "meter-in",
              )}
              style={{
                width: `${percentage > 0 ? Math.max(percentage, 2) : 0}%`,
              }}
            />
          </div>
          <span
            className={cn(
              "whitespace-nowrap text-meta tabular-nums",
              nearLimit ? "text-warning" : "text-muted-foreground",
            )}
          >
            {formatBytes(stats.storage_used_mb * BYTES_PER_MB)} of{" "}
            {formatBytes(stats.storage_limit_mb * BYTES_PER_MB)}
            {nearLimit && ` · ${percentage.toFixed(0)}% used`}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
