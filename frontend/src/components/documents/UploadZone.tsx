import { Loader2, Upload, X } from "lucide-react";
import { useState } from "react";
import { type FileRejection, useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { CollectionSelect } from "@/components/shared/CollectionSelect";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { useCollections } from "@/hooks/useCollections";
import { useBulkUploadDocuments } from "@/hooks/useDocuments";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FileIcon } from "./FileIcon";

interface QueuedFile {
  file: File;
  id: string;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
  chunks?: number;
}

interface UploadZoneProps {
  /** Called after a batch finishes uploading, whether or not every file succeeded. */
  onUploadComplete?: (summary: { succeeded: number; failed: number }) => void;
}

const ALLOWED_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "text/plain": [".txt"],
  "text/markdown": [".md"],
};
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

const extensionOf = (name: string) => name.split(".").pop() ?? "";

/** Drop files (or browse), optionally pick a collection, and upload them in one batch. */
export function UploadZone({ onUploadComplete }: UploadZoneProps) {
  const [files, setFiles] = useState<QueuedFile[]>([]);
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const { data: collectionsData } = useCollections();
  const collections = collectionsData?.collections ?? [];
  const bulkUpload = useBulkUploadDocuments();

  const onDrop = (accepted: File[], rejected: FileRejection[]) => {
    for (const rejection of rejected) {
      const reasons = rejection.errors
        .map((e) => {
          if (e.code === "file-too-large") return "larger than 50 MB";
          if (e.code === "file-invalid-type")
            return "not a PDF, DOCX, TXT or MD file";
          return e.message;
        })
        .join(", ");
      toast.error(`${rejection.file.name} was skipped: ${reasons}`);
    }
    setFiles((prev) => [
      ...prev,
      ...accepted.map((file) => ({
        file,
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        status: "pending" as const,
      })),
    ]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ALLOWED_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: true,
  });

  const pending = files.filter((f) => f.status === "pending");
  const uploading = files.some((f) => f.status === "uploading");

  const upload = async () => {
    if (pending.length === 0) return;
    setFiles((prev) =>
      prev.map((f) =>
        f.status === "pending" ? { ...f, status: "uploading" } : f,
      ),
    );
    let succeeded = 0;
    let failed = pending.length;
    try {
      const result = await bulkUpload.mutateAsync({
        files: pending.map((f) => f.file),
        collectionId: collectionId ?? undefined,
      });
      succeeded = result.documents?.length ?? 0;
      failed = pending.length - succeeded;
      setFiles((prev) =>
        prev.map((f) => {
          if (f.status !== "uploading") return f;
          const done = result.documents?.find(
            (d) => d.filename === f.file.name,
          );
          if (done)
            return { ...f, status: "success", chunks: done.chunks_count || 0 };
          const failed = result.failed_uploads?.find(
            (x) => x.filename === f.file.name,
          );
          return failed ? { ...f, status: "error", error: failed.error } : f;
        }),
      );
    } catch (error) {
      setFiles((prev) =>
        prev.map((f) =>
          f.status === "uploading"
            ? {
                ...f,
                status: "error",
                error: error instanceof Error ? error.message : "Upload failed",
              }
            : f,
        ),
      );
    } finally {
      onUploadComplete?.({ succeeded, failed });
    }
  };

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div
        {...getRootProps()}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed px-6 py-10 text-center transition-colors duration-150 ease-snap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isDragActive
            ? "border-primary bg-secondary/60"
            : "border-input bg-muted/40 hover:bg-muted",
        )}
      >
        <input {...getInputProps()} />
        <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary">
          <Upload className="size-5" aria-hidden="true" />
        </div>
        <p className="text-body font-medium text-foreground">
          {isDragActive
            ? "Drop files to add them"
            : "Drag files here, or click to browse"}
        </p>
        <p className="text-meta text-muted-foreground">
          PDF, DOCX, TXT or MD, up to 50 MB each
        </p>
      </div>

      {files.length > 0 && (
        <ul className="flex max-h-56 flex-col gap-2 overflow-y-auto">
          {files.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-2.5"
            >
              <FileIcon type={extensionOf(item.file.name)} className="size-9" />
              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-body text-foreground"
                  title={item.file.name}
                >
                  {item.file.name}
                </p>
                <p
                  className={cn(
                    "truncate text-meta tabular-nums",
                    item.status === "error"
                      ? "text-destructive"
                      : "text-muted-foreground",
                  )}
                >
                  {item.status === "error"
                    ? item.error
                    : item.status === "success"
                      ? `${formatBytes(item.file.size)} · ${item.chunks} chunks`
                      : formatBytes(item.file.size)}
                </p>
              </div>
              {item.status === "uploading" && (
                <Loader2
                  className="size-4 animate-spin text-muted-foreground"
                  aria-label="Uploading"
                />
              )}
              {item.status === "success" && <StatusBadge status="active" />}
              {item.status === "error" && <StatusBadge status="error" />}
              {(item.status === "pending" || item.status === "error") && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${item.file.name}`}
                  onClick={() =>
                    setFiles((prev) => prev.filter((f) => f.id !== item.id))
                  }
                >
                  <X />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-meta text-muted-foreground">Add to</span>
          <CollectionSelect
            collections={collections}
            value={collectionId}
            onChange={setCollectionId}
            allLabel="No collection"
            className="h-9 w-auto"
          />
        </div>
        <Button onClick={upload} disabled={pending.length === 0 || uploading}>
          {uploading && <Loader2 className="animate-spin" />}
          {pending.length > 1 ? `Upload ${pending.length} files` : "Upload"}
        </Button>
      </div>
    </div>
  );
}
