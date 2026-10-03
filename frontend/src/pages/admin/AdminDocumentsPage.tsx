import { FileText, Search } from "lucide-react";
import { useState } from "react";
import { AdminDocumentDialog } from "@/components/admin/AdminDocumentDialog";
import { AdminDocumentsTable } from "@/components/admin/AdminDocumentsTable";
import { DocumentCleanup } from "@/components/admin/DocumentCleanup";
import { DocumentPagination } from "@/components/documents/DocumentPagination";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminDeleteDocument, useAdminDocuments } from "@/hooks/useAdmin";
import { getApiErrorMessage } from "@/lib/errors";
import type { AdminDocument } from "@/types/api";

const PAGE_SIZE = 20;

export function AdminDocumentsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<AdminDocument | null>(null);
  const [deleting, setDeleting] = useState<AdminDocument | null>(null);

  const { data, isLoading, error, refetch } = useAdminDocuments({
    page,
    limit: PAGE_SIZE,
    status: status === "all" ? undefined : status,
    sort_by: "uploaded_at",
    order: "desc",
  });
  const remove = useAdminDeleteDocument();

  const query = search.trim().toLowerCase();
  const documents = (data?.documents ?? []).filter(
    (doc) => !query || doc.filename.toLowerCase().includes(query),
  );

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        description={
          data
            ? `${data.total} ${data.total === 1 ? "document" : "documents"} across all users`
            : "Browse every user's documents."
        }
      />

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search filenames on this page"
            aria-label="Search documents by filename"
            className="pl-9"
          />
        </div>
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
        >
          <SelectTrigger aria-label="Status" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Ready</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="error">Failed</SelectItem>
            <SelectItem value="deleted">Deleted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 rounded-2xl" aria-busy="true" />
      ) : error ? (
        <ErrorState
          message={getApiErrorMessage(error, "Couldn't load documents.")}
          onRetry={() => refetch()}
        />
      ) : documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents found"
          description="Try a different search or status."
        />
      ) : (
        <AdminDocumentsTable
          documents={documents}
          onView={setViewing}
          onDelete={setDeleting}
        />
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

      <DocumentCleanup />

      <AdminDocumentDialog
        document={viewing}
        onClose={() => setViewing(null)}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        tone="destructive"
        title="Delete this document?"
        description={
          deleting
            ? `“${deleting.filename}” (${deleting.user_email}) is permanently removed from the database, file storage and search index.`
            : undefined
        }
        confirmLabel="Delete document"
        pending={remove.isPending}
        onConfirm={() =>
          deleting &&
          remove.mutate(deleting.document_id, {
            onSuccess: () => setDeleting(null),
          })
        }
      />
    </div>
  );
}
