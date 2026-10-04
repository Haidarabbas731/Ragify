import { Link } from "react-router-dom";
import { ErrorState } from "@/components/shared/ErrorState";
import { StatTile } from "@/components/shared/StatTile";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminStats } from "@/hooks/useAdmin";
import { getApiErrorMessage } from "@/lib/errors";
import { formatBytes } from "@/lib/format";

export function AdminOverviewPage() {
  const { data: stats, isLoading, error, refetch } = useAdminStats();

  if (isLoading) {
    return (
      <div
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-busy="true"
      >
        {Array.from({ length: 4 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder tiles
          <Skeleton key={i} className="h-[118px] rounded-2xl" />
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <ErrorState
        message={getApiErrorMessage(error, "Couldn't load system statistics.")}
        onRetry={() => refetch()}
      />
    );
  }

  const failed = stats.failed_documents;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatTile
        label="Users"
        value={stats.total_users.toLocaleString()}
        detail={`${stats.active_users_30d.toLocaleString()} signed in during the last 30 days`}
      />
      <StatTile
        label="Documents"
        value={stats.total_documents.toLocaleString()}
        detail={
          failed > 0 ? (
            <Link
              to="/admin/documents"
              className="text-warning underline-offset-4 hover:underline"
            >
              {failed} failed to process
            </Link>
          ) : (
            "None failed"
          )
        }
      />
      <StatTile
        label="Conversations"
        value={stats.total_conversations.toLocaleString()}
        detail="Across all users"
      />
      <StatTile
        label="Storage used"
        value={formatBytes(stats.total_storage_bytes)}
        detail="Across all users"
      />
    </div>
  );
}
