import { Card, CardContent } from "@/components/ui/card";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";

const BYTES_PER_MB = 1024 * 1024;

interface StorageTileProps {
  usedMb: number;
  limitMb: number;
  percentage: number;
}

/** Storage use as a number and a bar that is always visible; turns to a warning near the limit. */
export function StorageTile({ usedMb, limitMb, percentage }: StorageTileProps) {
  const clamped = Math.min(Math.max(percentage, 0), 100);
  const nearLimit = clamped >= 90;

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-5">
        <div>
          <p className="text-meta text-muted-foreground">Storage</p>
          <p className="mt-1 text-stat tabular-nums text-foreground">
            {formatBytes(usedMb * BYTES_PER_MB)}
            <span className="ml-1.5 text-body font-normal text-muted-foreground">
              of {formatBytes(limitMb * BYTES_PER_MB)}
            </span>
          </p>
        </div>
        <div
          role="progressbar"
          aria-label="Storage used"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(clamped)}
          className="h-1.5 overflow-hidden rounded-full bg-muted"
        >
          <div
            className={cn(
              "h-full rounded-full",
              nearLimit ? "bg-warning" : "bg-primary",
            )}
            style={{ width: `${clamped > 0 ? Math.max(clamped, 2) : 0}%` }}
          />
        </div>
        <p
          className={cn(
            "text-meta tabular-nums",
            nearLimit ? "text-warning" : "text-muted-foreground",
          )}
        >
          {clamped.toFixed(1)}% used
        </p>
      </CardContent>
    </Card>
  );
}
