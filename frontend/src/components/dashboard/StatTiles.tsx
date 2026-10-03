import { Card, CardContent } from "@/components/ui/card";
import type { UserStats } from "@/types/api";
import { StorageTile } from "./StorageTile";

interface StatTilesProps {
  stats: UserStats;
}

function CountTile({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-meta text-muted-foreground">{label}</p>
        <p className="mt-1 text-stat tabular-nums text-foreground">
          {value.toLocaleString()}
        </p>
        <p className="mt-3 text-meta text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

/** Documents, indexed passages and storage at a glance. */
export function StatTiles({ stats }: StatTilesProps) {
  const { active = 0, processing = 0, error = 0 } = stats.documents_by_status;
  const statusParts = [
    `${active} ready`,
    processing > 0 ? `${processing} indexing` : null,
    error > 0 ? `${error} failed` : null,
  ].filter(Boolean);
  const documents = stats.total_documents;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <CountTile
        label="Documents"
        value={documents}
        detail={statusParts.join(" · ")}
      />
      <CountTile
        label="Indexed passages"
        value={stats.total_chunks}
        detail={`Across ${documents} document${documents === 1 ? "" : "s"}`}
      />
      <StorageTile
        usedMb={stats.storage_used_mb}
        limitMb={stats.storage_limit_mb}
        percentage={stats.storage_percentage}
      />
    </div>
  );
}
