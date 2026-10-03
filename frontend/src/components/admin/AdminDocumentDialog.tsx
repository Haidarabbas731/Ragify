import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatBytes, formatDate } from "@/lib/format";
import type { AdminDocument } from "@/types/api";

interface AdminDocumentDialogProps {
  document: AdminDocument | null;
  onClose: () => void;
}

/** Read-only facts about one document, including why processing failed. */
export function AdminDocumentDialog({
  document,
  onClose,
}: AdminDocumentDialogProps) {
  const rows: [string, React.ReactNode][] = document
    ? [
        ["Owner", document.user_email],
        ["Status", <StatusBadge key="status" status={document.status} />],
        ["Type", document.file_type.toUpperCase()],
        ["Size", formatBytes(document.size_bytes)],
        ["Chunks", document.chunks_count.toLocaleString()],
        ["Uploaded", formatDate(document.uploaded_at, { withTime: true })],
        ...(document.processed_at
          ? ([
              [
                "Processed",
                formatDate(document.processed_at, { withTime: true }),
              ],
            ] as [string, React.ReactNode][])
          : []),
        [
          "Document ID",
          <code key="id" className="font-mono text-meta">
            {document.document_id}
          </code>,
        ],
      ]
    : [];

  return (
    <Dialog
      open={document !== null}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="break-all pr-6">
            {document?.filename}
          </DialogTitle>
          <DialogDescription>Document details.</DialogDescription>
        </DialogHeader>
        <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-3 text-body">
          {rows.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-meta text-muted-foreground">{label}</dt>
              <dd className="min-w-0 break-words">{value}</dd>
            </div>
          ))}
        </dl>
        {document?.error_message && (
          <div
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/5 p-3"
          >
            <p className="text-section text-destructive">Processing failed</p>
            <p className="mt-1 break-words text-body text-muted-foreground">
              {document.error_message}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
