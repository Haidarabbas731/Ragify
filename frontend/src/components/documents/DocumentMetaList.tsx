import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBytes, formatDate } from "@/lib/format";
import type { Document } from "@/types/api";

function MetaRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border py-3 first:pt-0 last:border-0 last:pb-0">
      <dt className="text-meta text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-body">{children}</dd>
    </div>
  );
}

const NONE = <span className="text-muted-foreground">None</span>;

/** Facts about a document: size, type, chunks, dates, collection, category and tags. */
export function DocumentMetaList({ document }: { document: Document }) {
  const fileType = (
    document.file_type.split("/")[1] ?? document.file_type
  ).toUpperCase();
  const tags = document.tags ?? [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Details</CardTitle>
      </CardHeader>
      <CardContent>
        <dl>
          <MetaRow label="File size">
            <span className="tabular-nums">
              {formatBytes(document.size_bytes)}
            </span>
          </MetaRow>
          <MetaRow label="File type">{fileType}</MetaRow>
          <MetaRow label="Chunks">
            <span className="tabular-nums">{document.chunks_count}</span>
          </MetaRow>
          <MetaRow label="Uploaded">
            {formatDate(document.uploaded_at, { withTime: true })}
          </MetaRow>
          {document.processed_at && (
            <MetaRow label="Processed">
              {formatDate(document.processed_at, { withTime: true })}
            </MetaRow>
          )}
          <MetaRow label="Collection">
            {document.collection_name ?? NONE}
          </MetaRow>
          <MetaRow label="Category">{document.category ?? NONE}</MetaRow>
          <MetaRow label="Tags">
            {tags.length > 0 ? (
              <span className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </span>
            ) : (
              NONE
            )}
          </MetaRow>
        </dl>
      </CardContent>
    </Card>
  );
}
