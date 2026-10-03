import { ScrollText } from "lucide-react";
import { useState } from "react";
import {
  AuditLogTable,
  formatActionName,
} from "@/components/admin/AuditLogTable";
import { DocumentPagination } from "@/components/documents/DocumentPagination";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminAuditLogs } from "@/hooks/useAdmin";
import { getApiErrorMessage } from "@/lib/errors";

const PAGE_SIZE = 20;

export function AdminAuditLogsPage() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("all");

  const { data, isLoading, error, refetch } = useAdminAuditLogs({
    page,
    limit: PAGE_SIZE,
  });

  const logs = data?.logs ?? [];
  const actions = [...new Set(logs.map((log) => log.action))];
  const visible = logs.filter(
    (log) => action === "all" || log.action === action,
  );

  return (
    <div className="flex flex-col gap-4">
      <PageHeader description="A record of what admins changed: suspensions, deletions and invite codes." />

      {actions.length > 0 && (
        <div>
          <Select value={action} onValueChange={setAction}>
            <SelectTrigger aria-label="Action" className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions on this page</SelectItem>
              {actions.map((name) => (
                <SelectItem key={name} value={name}>
                  {formatActionName(name)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {isLoading ? (
        <Skeleton className="h-64 rounded-2xl" aria-busy="true" />
      ) : error ? (
        <ErrorState
          message={getApiErrorMessage(error, "Couldn't load the audit log.")}
          onRetry={() => refetch()}
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="Nothing recorded yet"
          description="Admin actions such as suspending a user show up here."
        />
      ) : (
        <AuditLogTable logs={visible} />
      )}

      {data && (
        <DocumentPagination
          page={data.page}
          pages={data.pages}
          total={data.total}
          limit={PAGE_SIZE}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
