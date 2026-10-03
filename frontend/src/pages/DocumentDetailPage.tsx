import { ArrowLeft, Pencil, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChunkList } from "@/components/documents/ChunkList";
import { DocumentMetaList } from "@/components/documents/DocumentMetaList";
import {
  type DocumentMetadata,
  EditMetadataDialog,
} from "@/components/documents/EditMetadataDialog";
import { FileIcon } from "@/components/documents/FileIcon";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ErrorState } from "@/components/shared/ErrorState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDeleteDocument,
  useDocument,
  useRetryDocument,
  useUpdateDocument,
} from "@/hooks/useDocuments";
import { getApiErrorMessage } from "@/lib/errors";

export function DocumentDetailPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();

  const { data: document, isLoading, error, refetch } = useDocument(documentId);
  const deleteDocument = useDeleteDocument();
  const retryDocument = useRetryDocument();
  const updateDocument = useUpdateDocument();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6" aria-busy="true">
        <Skeleton className="h-10 w-2/3" />
        <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="p-6">
        <ErrorState
          message={getApiErrorMessage(
            error,
            "This document was not found or could not be loaded.",
          )}
          onRetry={() => refetch()}
        />
        <Button asChild variant="link" className="mt-3 px-0">
          <Link to="/documents">Back to documents</Link>
        </Button>
      </div>
    );
  }

  const extension = document.filename.split(".").pop() ?? "";

  const handleSave = (metadata: DocumentMetadata) =>
    updateDocument.mutate(
      { documentId: document.document_id, updates: metadata },
      { onSuccess: () => setEditOpen(false) },
    );

  const handleDelete = () =>
    deleteDocument.mutate(document.document_id, {
      onSuccess: () => navigate("/documents"),
    });

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-4">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="-ml-3 w-fit text-muted-foreground"
        >
          <Link to="/documents">
            <ArrowLeft /> Documents
          </Link>
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <FileIcon type={extension} />
            <div className="flex min-w-0 flex-col gap-1.5">
              <h2
                className="break-all text-title text-foreground"
                title={document.filename}
              >
                {document.filename}
              </h2>
              <div>
                <StatusBadge status={document.status} />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {document.status === "error" && (
              <Button
                variant="outline"
                size="sm"
                disabled={retryDocument.isPending}
                onClick={() => retryDocument.mutate(document.document_id)}
              >
                <RefreshCw
                  className={retryDocument.isPending ? "animate-spin" : ""}
                />
                {retryDocument.isPending ? "Retrying…" : "Retry processing"}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(true)}
            >
              <Pencil /> Edit details
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 /> Delete
            </Button>
          </div>
        </div>

        {document.status === "error" && document.error_message && (
          <div
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/5 p-4"
          >
            <p className="text-section text-destructive">Processing failed</p>
            <p className="mt-1 break-words text-body text-muted-foreground">
              {document.error_message}
            </p>
          </div>
        )}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="order-2 min-w-0 lg:order-1">
          <ChunkList
            chunks={document.chunks ?? []}
            total={document.chunks_count}
            processing={document.status === "processing"}
          />
        </div>
        <div className="order-1 lg:sticky lg:top-6 lg:order-2">
          <DocumentMetaList document={document} />
        </div>
      </div>

      <EditMetadataDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        document={document}
        pending={updateDocument.isPending}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        tone="destructive"
        title="Delete this document?"
        description={`“${document.filename}” and its ${document.chunks_count} indexed chunks will be removed. This can't be undone.`}
        confirmLabel="Delete document"
        pending={deleteDocument.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
