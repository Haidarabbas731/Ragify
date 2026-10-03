import { StatTile } from "@/components/shared/StatTile";
import type { UserStats } from "@/types/api";
import { StorageTile } from "./StorageTile";

interface StatTilesProps {
  stats: UserStats;
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
      <StatTile
        label="Documents"
        value={documents.toLocaleString()}
        detail={statusParts.join(" · ")}
      />
      <StatTile
        label="Indexed passages"
        value={stats.total_chunks.toLocaleString()}
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
