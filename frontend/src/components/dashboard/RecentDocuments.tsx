import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DocumentTable } from "@/components/documents/DocumentTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDeleteDocument,
  useDocuments,
  useRetryDocument,
} from "@/hooks/useDocuments";
import type { Document } from "@/types/api";

/** The five most recently uploaded documents, with open, retry and delete. */
export function RecentDocuments() {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useDocuments({
    page: 1,
    limit: 5,
    sort_by: "created_at",
    order: "desc",
  });
  const retry = useRetryDocument();
  const deleteDocument = useDeleteDocument();
  const [toDelete, setToDelete] = useState<Document | null>(null);

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteDocument.mutateAsync(toDelete.document_id);
      setToDelete(null);
    } catch {
      // The hook shows an error toast; keep the dialog open.
    }
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Recent documents</CardTitle>
        <Button asChild variant="link" size="sm" className="h-auto p-0">
          <Link to="/documents">View all</Link>
        </Button>
      </CardHeader>

      {isLoading ? (
        <div className="flex flex-col gap-2 px-5 pb-5" aria-busy="true">
          {Array.from({ length: 4 }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder rows
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="px-5 pb-5">
          <ErrorState
            message="Couldn't load recent documents."
            onRetry={() => refetch()}
          />
        </div>
      ) : (
        <DocumentTable
          compact
          documents={data?.documents ?? []}
          onOpen={(doc) => navigate(`/documents/${doc.document_id}`)}
          onRetry={(doc) => retry.mutate(doc.document_id)}
          onDelete={setToDelete}
        />
      )}

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        tone="destructive"
        title={`Delete “${toDelete?.filename ?? ""}”?`}
        description="This permanently removes the file and its embeddings."
        confirmLabel="Delete"
        pending={deleteDocument.isPending}
        onConfirm={confirmDelete}
      />
    </Card>
  );
}
